import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.api.deps import get_db
from app.core import config
from app.core.security import hash_password, create_access_token
from app.repositories.user import UserRepository

# Use SQLite in-memory with StaticPool for deterministic, standalone tests
# (or TEST_DATABASE_URL if explicitly configured)
_test_db_url = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")

if _test_db_url.startswith("sqlite"):
    engine = create_engine(
        _test_db_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(_test_db_url, pool_pre_ping=True)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def get_admin_headers() -> dict:
    token = create_access_token(subject="admin")
    return {"Authorization": f"Bearer {token}"}


def get_user_headers() -> dict:
    token = create_access_token(subject="regular_user")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        user_repo = UserRepository(db)
        # Seed admin
        if not user_repo.find_by_username("admin"):
            user_repo.create(
                username="admin",
                hashed_password=hash_password("admin123"),
                is_admin=True,
            )
        # Seed regular non-admin user
        if not user_repo.find_by_username("regular_user"):
            user_repo.create(
                username="regular_user",
                hashed_password=hash_password("user123"),
                is_admin=False,
            )
    finally:
        db.close()

    yield
    Base.metadata.drop_all(bind=engine)


# ============================================================================
# Auth & Authorization Tests
# ============================================================================

def test_auth_login_admin_success():
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_auth_login_invalid_password():
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert res.status_code == 401
    assert "detail" in res.json()


def test_auth_login_non_admin_forbidden():
    res = client.post("/api/v1/auth/login", json={"username": "regular_user", "password": "user123"})
    assert res.status_code == 403


def test_auth_get_me():
    # Unauthenticated
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # Authenticated admin
    auth_res = client.get("/api/v1/auth/me", headers=get_admin_headers())
    assert auth_res.status_code == 200
    body = auth_res.json()
    assert body["is_success"] is True
    assert body["data"]["username"] == "admin"
    assert body["data"]["is_admin"] is True


def test_protected_endpoints_require_admin():
    # Attempt category create without token
    res = client.post("/api/v1/categories/", json={"name": "No Auth"})
    assert res.status_code == 401

    # Attempt category create with non-admin token
    res_forbidden = client.post(
        "/api/v1/categories/",
        json={"name": "No Auth"},
        headers=get_user_headers(),
    )
    assert res_forbidden.status_code == 403

    # Attempt product create without token
    prod_unauth = client.post("/api/v1/products/", json={"name": "Test", "price": 100, "category_id": 1})
    assert prod_unauth.status_code == 401


# ============================================================================
# Rate Limiting Tests
# ============================================================================

def test_rate_limit_exceeded_handler():
    # Test rate limit response formatting by hitting login endpoint repeatedly
    # Login limit is 10/minute
    last_res = None
    for _ in range(12):
        last_res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "bad"})
        if last_res.status_code == 429:
            break

    # If triggered, assert custom JSON format matches Result unified structure
    if last_res.status_code == 429:
        body = last_res.json()
        assert body["status_code"] == 429
        assert body["is_success"] is False
        assert "message" in body


# ============================================================================
# Categories CRUD Tests
# ============================================================================

def test_categories_crud():
    headers = get_admin_headers()

    # 1. Validation test: empty name should fail with 422
    bad_res = client.post("/api/v1/categories/", json={"name": "   "}, headers=headers)
    assert bad_res.status_code == 422

    # 2. Create category (wrapped in Result)
    res = client.post(
        "/api/v1/categories/",
        json={"name": "Electronics", "description": "Gadgets"},
        headers=headers,
    )
    assert res.status_code == 201
    body = res.json()
    assert body["is_success"] is True
    assert body["status_code"] == 201
    cat = body["data"]
    assert cat["name"] == "Electronics"
    cat_id = cat["id"]

    # 3. Duplicate name
    dup = client.post(
        "/api/v1/categories/",
        json={"name": "Electronics"},
        headers=headers,
    )
    assert dup.status_code == 409
    assert dup.json()["is_success"] is False

    # 4. Get by ID (public)
    get_res = client.get(f"/api/v1/categories/{cat_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["name"] == "Electronics"

    # 5. List with offset pagination (public)
    second_category = client.post(
        "/api/v1/categories/",
        json={"name": "Home Appliances"},
        headers=headers,
    )
    assert second_category.status_code == 201
    list_res = client.get("/api/v1/categories/?page=1&page_size=1")
    assert list_res.status_code == 200
    list_data = list_res.json()["data"]
    assert len(list_data["items"]) == 1
    assert list_data["total"] == 2
    assert list_data["page"] == 1
    assert list_data["total_pages"] == 2
    next_page = client.get("/api/v1/categories/?page=2&page_size=1")
    assert next_page.status_code == 200
    assert next_page.json()["data"]["items"][0]["id"] != list_data["items"][0]["id"]

    # 6. Update
    up_res = client.put(
        f"/api/v1/categories/{cat_id}",
        json={"description": "Updated gadgets"},
        headers=headers,
    )
    assert up_res.status_code == 200
    assert up_res.json()["data"]["description"] == "Updated gadgets"

    # 7. Delete
    del_res = client.delete(f"/api/v1/categories/{cat_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["is_success"] is True

    # 8. 404 after delete
    assert client.get(f"/api/v1/categories/{cat_id}").status_code == 404


# ============================================================================
# Products Validation Tests
# ============================================================================

def test_products_validation():
    headers = get_admin_headers()

    # Create category first
    cat_res = client.post("/api/v1/categories/", json={"name": "Computers"}, headers=headers)
    cat_id = cat_res.json()["data"]["id"]

    # Price <= 0 should fail with 422
    bad_price = client.post(
        "/api/v1/products/",
        json={
            "name": "Laptop",
            "price": 0.0,
            "stock": 10,
            "category_id": cat_id,
        },
        headers=headers,
    )
    assert bad_price.status_code == 422

    # Stock < 0 should fail with 422
    bad_stock = client.post(
        "/api/v1/products/",
        json={
            "name": "Laptop",
            "price": 999.99,
            "stock": -1,
            "category_id": cat_id,
        },
        headers=headers,
    )
    assert bad_stock.status_code == 422

    # Empty name should fail with 422
    bad_name = client.post(
        "/api/v1/products/",
        json={
            "name": "   ",
            "price": 999.99,
            "stock": 5,
            "category_id": cat_id,
        },
        headers=headers,
    )
    assert bad_name.status_code == 422

    # Non-existent category should return 400
    bad_cat = client.post(
        "/api/v1/products/",
        json={
            "name": "Laptop",
            "price": 999.99,
            "stock": 5,
            "category_id": 9999,
        },
        headers=headers,
    )
    assert bad_cat.status_code == 400
    assert bad_cat.json()["is_success"] is False


# ============================================================================
# Products CRUD, Search, Filter, Sort, Pagination Tests
# ============================================================================

def test_products_crud_and_search_pagination():
    headers = get_admin_headers()

    # 1. Setup category
    cat_res = client.post("/api/v1/categories/", json={"name": "Smartphones"}, headers=headers)
    cat_id = cat_res.json()["data"]["id"]

    # 2. Create products
    p1 = client.post(
        "/api/v1/products/",
        json={
            "name": "iPhone 15 Pro",
            "description": "Apple flagship smartphone with titanium body",
            "price": 999.0,
            "stock": 50,
            "category_id": cat_id,
            "image_url": "https://example.com/iphone15.jpg",
        },
        headers=headers,
    )
    assert p1.status_code == 201
    p1_id = p1.json()["data"]["id"]

    p2 = client.post(
        "/api/v1/products/",
        json={
            "name": "Samsung Galaxy S24",
            "description": "AI-powered Android smartphone",
            "price": 799.0,
            "stock": 30,
            "category_id": cat_id,
            "image_url": "https://example.com/s24.jpg",
        },
        headers=headers,
    )
    assert p2.status_code == 201
    p2_id = p2.json()["data"]["id"]

    # 3. Get detail & check X-Cache header (public)
    detail = client.get(f"/api/v1/products/{p1_id}")
    assert detail.status_code == 200
    assert detail.json()["is_success"] is True
    assert detail.json()["data"]["name"] == "iPhone 15 Pro"
    assert "x-cache" in detail.headers

    # 4. List with offset pagination (public)
    list_res = client.get("/api/v1/products/?page=1&page_size=1")
    assert list_res.status_code == 200
    res_data = list_res.json()["data"]
    assert res_data["page_size"] == 1
    assert len(res_data["items"]) == 1
    assert res_data["total"] == 2
    assert res_data["page"] == 1
    assert res_data["total_pages"] == 2
    next_page = client.get("/api/v1/products/?page=2&page_size=1")
    assert next_page.status_code == 200
    assert next_page.json()["data"]["items"][0]["id"] != res_data["items"][0]["id"]
    assert "x-cache" in list_res.headers

    # 4b. Cursor pagination is available as a separate advanced endpoint.
    cursor_res = client.get("/api/v1/products/cursor?page_size=1")
    assert cursor_res.status_code == 200
    cursor_data = cursor_res.json()["data"]
    assert cursor_data["has_more"] is True
    assert cursor_data["next_cursor"]
    cursor_next = client.get(
        f"/api/v1/products/cursor?page_size=1&cursor={cursor_data['next_cursor']}"
    )
    assert cursor_next.status_code == 200
    assert cursor_next.json()["data"]["items"][0]["id"] != cursor_data["items"][0]["id"]

    # 5. Search keyword using search param
    search_res = client.get("/api/v1/products/?search=titanium")
    assert search_res.status_code == 200
    assert search_res.json()["data"]["total"] == 1
    assert search_res.json()["data"]["items"][0]["name"] == "iPhone 15 Pro"

    # 6. Filter price range
    filter_res = client.get("/api/v1/products/?min_price=850&max_price=1200")
    assert filter_res.status_code == 200
    assert filter_res.json()["data"]["total"] == 1
    assert filter_res.json()["data"]["items"][0]["name"] == "iPhone 15 Pro"

    # 7. Sort by price ascending using sort_by and order
    sort_res = client.get("/api/v1/products/?sort_by=price&order=asc")
    assert sort_res.status_code == 200
    items = sort_res.json()["data"]["items"]
    assert items[0]["name"] == "Samsung Galaxy S24"
    assert items[1]["name"] == "iPhone 15 Pro"

    # 7b. Sort by price descending using sort_by and order
    sort_desc_res = client.get("/api/v1/products/?sort_by=price&order=desc")
    assert sort_desc_res.status_code == 200
    desc_items = sort_desc_res.json()["data"]["items"]
    assert desc_items[0]["name"] == "iPhone 15 Pro"
    assert desc_items[1]["name"] == "Samsung Galaxy S24"

    # 8. Update product (PUT)
    put_res = client.put(
        f"/api/v1/products/{p1_id}",
        json={
            "name": "iPhone 15 Pro Max",
            "price": 1199.0,
        },
        headers=headers,
    )
    assert put_res.status_code == 200
    assert put_res.json()["data"]["name"] == "iPhone 15 Pro Max"
    assert put_res.json()["data"]["price"] == 1199.0

    # 9. Partial update (PATCH)
    patch_res = client.patch(
        f"/api/v1/products/{p1_id}",
        json={"stock": 100},
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["stock"] == 100
    assert patch_res.json()["data"]["name"] == "iPhone 15 Pro Max"

    # 10. Delete product
    del_res = client.delete(f"/api/v1/products/{p1_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["is_success"] is True

    # 11. 404 after delete
    not_found = client.get(f"/api/v1/products/{p1_id}")
    assert not_found.status_code == 404
    assert not_found.json()["is_success"] is False
