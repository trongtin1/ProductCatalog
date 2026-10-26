import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.api.deps import get_db
from app.core import config

# Dùng cùng PostgreSQL config nhưng DB riêng cho test
_test_db_url = config.get_database_url().rsplit("/", 1)[0] + "/product_catalog_test"

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


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_categories_crud():
    # 1. Validation test: empty name should fail with 422
    bad_res = client.post("/api/v1/categories/", json={"name": "   "})
    assert bad_res.status_code == 422

    # 2. Create category (wrapped in Result)
    res = client.post("/api/v1/categories/", json={"name": "Electronics", "description": "Gadgets"})
    assert res.status_code == 201
    body = res.json()
    assert body["is_success"] is True
    assert body["status_code"] == 201
    cat = body["data"]
    assert cat["name"] == "Electronics"
    cat_id = cat["id"]

    # 3. Duplicate name
    dup = client.post("/api/v1/categories/", json={"name": "Electronics"})
    assert dup.status_code == 409
    assert dup.json()["is_success"] is False

    # 4. Get by ID
    get_res = client.get(f"/api/v1/categories/{cat_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["name"] == "Electronics"

    # 5. List with cursor pagination
    second_category = client.post(
        "/api/v1/categories/",
        json={"name": "Home Appliances"},
    )
    assert second_category.status_code == 201
    list_res = client.get("/api/v1/categories/?page_size=1")
    assert list_res.status_code == 200
    list_data = list_res.json()["data"]
    assert len(list_data["items"]) == 1
    assert list_data["has_more"] is True
    assert list_data["next_cursor"]
    next_page = client.get(
        f"/api/v1/categories/?page_size=1&cursor={list_data['next_cursor']}"
    )
    assert next_page.status_code == 200
    assert next_page.json()["data"]["items"][0]["id"] != list_data["items"][0]["id"]

    # 6. Update
    up_res = client.put(f"/api/v1/categories/{cat_id}", json={"description": "Updated gadgets"})
    assert up_res.status_code == 200
    assert up_res.json()["data"]["description"] == "Updated gadgets"

    # 7. Delete
    del_res = client.delete(f"/api/v1/categories/{cat_id}")
    assert del_res.status_code == 200
    assert del_res.json()["is_success"] is True

    # 8. 404 after delete
    assert client.get(f"/api/v1/categories/{cat_id}").status_code == 404


def test_products_validation():
    # Create category first
    cat_res = client.post("/api/v1/categories/", json={"name": "Computers"})
    cat_id = cat_res.json()["data"]["id"]

    # Price <= 0 should fail with 422
    bad_price = client.post("/api/v1/products/", json={
        "name": "Laptop",
        "price": 0.0,
        "stock": 10,
        "category_id": cat_id,
    })
    assert bad_price.status_code == 422

    # Stock < 0 should fail with 422
    bad_stock = client.post("/api/v1/products/", json={
        "name": "Laptop",
        "price": 999.99,
        "stock": -1,
        "category_id": cat_id,
    })
    assert bad_stock.status_code == 422

    # Empty name should fail with 422
    bad_name = client.post("/api/v1/products/", json={
        "name": "   ",
        "price": 999.99,
        "stock": 5,
        "category_id": cat_id,
    })
    assert bad_name.status_code == 422

    # Non-existent category should return 400
    bad_cat = client.post("/api/v1/products/", json={
        "name": "Laptop",
        "price": 999.99,
        "stock": 5,
        "category_id": 9999,
    })
    assert bad_cat.status_code == 400
    assert bad_cat.json()["is_success"] is False


def test_products_crud_and_search_pagination():
    # 1. Setup category
    cat_res = client.post("/api/v1/categories/", json={"name": "Smartphones"})
    cat_id = cat_res.json()["data"]["id"]

    # 2. Create products
    p1 = client.post("/api/v1/products/", json={
        "name": "iPhone 15 Pro",
        "description": "Apple flagship smartphone with titanium body",
        "price": 999.0,
        "stock": 50,
        "category_id": cat_id,
        "image_url": "https://example.com/iphone15.jpg",
    })
    assert p1.status_code == 201
    p1_id = p1.json()["data"]["id"]

    p2 = client.post("/api/v1/products/", json={
        "name": "Samsung Galaxy S24",
        "description": "AI-powered Android smartphone",
        "price": 799.0,
        "stock": 30,
        "category_id": cat_id,
        "image_url": "https://example.com/s24.jpg",
    })
    assert p2.status_code == 201
    p2_id = p2.json()["data"]["id"]

    # 3. Get detail & check X-Cache header
    detail = client.get(f"/api/v1/products/{p1_id}")
    assert detail.status_code == 200
    assert detail.json()["is_success"] is True
    assert detail.json()["data"]["name"] == "iPhone 15 Pro"
    assert "x-cache" in detail.headers

    # 4. List with cursor pagination
    list_res = client.get("/api/v1/products/?page_size=1")
    assert list_res.status_code == 200
    res_data = list_res.json()["data"]
    assert res_data["page_size"] == 1
    assert len(res_data["items"]) == 1
    assert res_data["has_more"] is True
    assert res_data["next_cursor"]
    next_page = client.get(
        f"/api/v1/products/?page_size=1&cursor={res_data['next_cursor']}"
    )
    assert next_page.status_code == 200
    assert next_page.json()["data"]["items"][0]["id"] != res_data["items"][0]["id"]
    assert "x-cache" in list_res.headers

    # 5. Search keyword using search_term
    search_res = client.get("/api/v1/products/?search_term=titanium")
    assert search_res.status_code == 200
    assert search_res.json()["data"]["total"] == 1
    assert search_res.json()["data"]["items"][0]["name"] == "iPhone 15 Pro"

    # 6. Filter price range
    filter_res = client.get("/api/v1/products/?min_price=850&max_price=1200")
    assert filter_res.status_code == 200
    assert filter_res.json()["data"]["total"] == 1
    assert filter_res.json()["data"]["items"][0]["name"] == "iPhone 15 Pro"

    # 7. Sort by price ascending using sort_column_by and is_sort_column_ascending
    sort_res = client.get("/api/v1/products/?sort_column_by=price&is_sort_column_ascending=true")
    assert sort_res.status_code == 200
    items = sort_res.json()["data"]["items"]
    assert items[0]["name"] == "Samsung Galaxy S24"
    assert items[1]["name"] == "iPhone 15 Pro"

    # 8. Update product (PUT)
    put_res = client.put(f"/api/v1/products/{p1_id}", json={
        "name": "iPhone 15 Pro Max",
        "price": 1199.0,
    })
    assert put_res.status_code == 200
    assert put_res.json()["data"]["name"] == "iPhone 15 Pro Max"
    assert put_res.json()["data"]["price"] == 1199.0

    # 9. Partial update (PATCH)
    patch_res = client.patch(f"/api/v1/products/{p1_id}", json={"stock": 100})
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["stock"] == 100
    assert patch_res.json()["data"]["name"] == "iPhone 15 Pro Max"

    # 10. Delete product
    del_res = client.delete(f"/api/v1/products/{p1_id}")
    assert del_res.status_code == 200
    assert del_res.json()["is_success"] is True

    # 11. 404 after delete
    not_found = client.get(f"/api/v1/products/{p1_id}")
    assert not_found.status_code == 404
    assert not_found.json()["is_success"] is False
