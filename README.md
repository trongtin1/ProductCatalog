# Product Catalog API (FastAPI)

Hệ thống RESTful API quản lý danh mục và sản phẩm (**Product Catalog**) theo đúng yêu cầu đề bài thực hành [docs/ThucHanh-Tuan2.md](docs/ThucHanh-Tuan2.md).

Dự án áp dụng mô hình kiến trúc phân lớp chuẩn (**Router → Service → Repository**), quản lý phụ thuộc hoàn toàn bằng **uv**, hỗ trợ **PostgreSQL**, **Redis Cache**, và đóng gói hoàn chỉnh bằng **Docker / Docker Compose**.

---

## 🛠 Tech Stack

- **Backend:** Python 3.11+ (kiểm thử trên Python 3.12 / 3.13)
- **Framework:** FastAPI, Uvicorn
- **ORM & Migrations:** SQLAlchemy, Alembic
- **Validation & Settings:** Pydantic v2, `pydantic-settings`
- **Database:** PostgreSQL (`psycopg2-binary`)
- **Caching:** Redis (`redis-py`) với cơ chế fallback an toàn (graceful degradation)
- **Package Manager:** `uv`
- **Containerization:** Docker, Docker Compose

---

## 📁 Cấu trúc thư mục

```text
app/
├── api/
│   ├── deps.py               # Dependency Injection (DB session, Repositories, Services)
│   └── routers/            # Router tầng ngoài (prefix /api/v1)
│       ├── categories.py     # routers: GET, POST, PUT, DELETE
│       └── products.py       # routers: GET list, GET detail, POST, PUT, PATCH, DELETE
├── core/
│   ├── config.py             # BaseSettings đọc từ .env
│   └── redis.py              # Redis client wrapper & caching helper
├── db/
│   ├── base.py               # SQLAlchemy Base (chứa Base và các model)
│   └── session.py            # Database engine & sessionmaker (PostgreSQL)
├── models/
│   ├── category.py           # Model Category: id, name, description, created_at
│   └── product.py            # Model Product: id, name, description, price, stock, category_id, image_url, ...
├── repositories/             # Data Access layer (SQLAlchemy query abstraction)
│   ├── base.py               # BaseRepository generic CRUD (find_one, find_list, count, create, update, delete)
│   ├── category.py           # CategoryRepository
│   └── product.py            # ProductRepository (phân trang, tìm kiếm, lọc giá, sắp xếp)
├── services/                 # Business Logic layer
│   ├── category.py           # CategoryService (kiểm tra trùng tên, xóa)
│   └── product.py            # ProductService (tích hợp Redis Cache TTL 60s, cache invalidation)
├── schemas/                  # Pydantic Schemas & DTOs
│   ├── base.py               # QueryResource, Result[T]
│   ├── category.py           # Category schemas, CategoryQueryResource
│   └── product.py            # Product schemas, ProductQueryResource
└── main.py                   # FastAPI app bootstrap, CORS, static files, routers
migrations/                   # Alembic configuration & migration versions
scripts/
└── seed.py                   # Script tự động sinh >= 100 sản phẩm & danh mục mẫu
tests/
└── test_api.py               # Bộ test tự động (pytest) — dùng DB PostgreSQL riêng `product_catalog_test`
Dockerfile                    # Dockerfile cho backend (sử dụng uv)
docker-compose.yml            # Docker Compose gồm postgres, redis, backend, frontend
.env.example                  # File cấu hình mẫu
```

---

## 🚀 Cài đặt & Chạy ứng dụng

### Cách 1: Chạy bằng `uv` (Local development)

> **Yêu cầu:** PostgreSQL đang chạy trên `localhost:5432`.
>
> Nếu chưa có, khởi động nhanh bằng Docker:
>
> ```bash
> docker run -d --name pg-dev \
>   -e POSTGRES_PASSWORD=postgres \
>   -p 5432:5432 \
>   postgres:16
>
> # Tạo database
> docker exec -it pg-dev psql -U postgres -c "CREATE DATABASE product_catalog;"
> ```

```bash
# 1. Đồng bộ môi trường và thư viện
uv sync

# 2. Sao chép file cấu hình và chỉnh sửa nếu cần
cp .env.example .env

# 3. Áp dụng database migration
uv run alembic upgrade head

# 4. Seed dữ liệu (tạo >= 100 sản phẩm mẫu)
uv run python scripts/seed.py

# 5. Khởi động server
uv run uvicorn app.main:app --reload
```

API Docs:

- **Swagger UI:** `http://127.0.0.1:8000/docs`

---

### Cách 2: Chạy bằng Docker Compose

Chạy toàn bộ hệ thống (PostgreSQL, Redis, Backend và Frontend — backend tự migrate & seed dữ liệu):

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`

---

## 🧪 Chạy Kiểm thử (Automated Tests)

> **Lưu ý:** Test dùng database PostgreSQL riêng tên `product_catalog_test`.  
> Cần tạo DB này trước khi chạy lần đầu:
>
> ```bash
> # Nếu dùng container pg-dev
> docker exec -it pg-dev psql -U postgres -c "CREATE DATABASE product_catalog_test;"
> ```

```bash
uv run pytest
```

---

## ⚙️ Cấu hình (.env)

Sao chép file mẫu và chỉnh sửa theo môi trường của bạn:

```bash
cp .env.example .env
```

| Biến                | Mặc định          | Mô tả            |
| ------------------- | ----------------- | ---------------- |
| `POSTGRES_SERVER`   | `localhost`       | Host PostgreSQL  |
| `POSTGRES_PORT`     | `5432`            | Port PostgreSQL  |
| `POSTGRES_USER`     | `postgres`        | Username         |
| `POSTGRES_PASSWORD` | `postgres`        | Password         |
| `POSTGRES_DB`       | `product_catalog` | Tên database     |
| `REDIS_HOST`        | `localhost`       | Host Redis       |
| `REDIS_PORT`        | `6379`            | Port Redis       |
| `REDIS_CACHE_TTL`   | `60`              | Cache TTL (giây) |

---

## 📌 Danh sách API chính (`/api/v1`)

### 1. Categories (`/api/v1/categories`)

- `GET /api/v1/categories/`: Danh sách danh mục (hỗ trợ phân trang, tìm kiếm `search_term`, `name`, `description`).
- `GET /api/v1/categories/{category_id}`: Chi tiết danh mục.
- `POST /api/v1/categories/`: Tạo danh mục mới (validate tên duy nhất).
- `PUT /api/v1/categories/{category_id}`: Cập nhật danh mục.
- `DELETE /api/v1/categories/{category_id}`: Xóa danh mục.

### 2. Products (`/api/v1/products`)

- `GET /api/v1/products/`: Danh sách sản phẩm kết hợp:
  - **Cursor pagination:** `page_size` (default 10, max 100); dùng `next_cursor` từ response trước làm tham số `cursor` cho trang tiếp theo.
  - **Tìm kiếm:** `search_term` (tìm trong name và description).
  - **Bộ lọc:** `category_id`, `min_price`, `max_price`.
  - **Sắp xếp:** `sort_column_by` (`id`, `price`, `name`, `stock`, `category_id`, `created_at`, `updated_at`), `is_sort_column_ascending` (true/false). Khi dùng `cursor`, giữ nguyên hai tham số sắp xếp và các bộ lọc của request trước.
  - **Redis Cache:** Response kèm header `X-Cache: HIT` hoặc `X-Cache: MISS`.
- `GET /api/v1/products/{product_id}`: Chi tiết sản phẩm (Cache Redis 60s, header `X-Cache: HIT/MISS`).
- `POST /api/v1/products/`: Tạo sản phẩm (validate `price > 0`, `stock >= 0`, `name` không rỗng; tự động xóa cache).
- `PUT /api/v1/products/{product_id}`: Cập nhật toàn bộ thông tin sản phẩm.
- `PATCH /api/v1/products/{product_id}`: Cập nhật từng phần (partial update).
- `DELETE /api/v1/products/{product_id}`: Xóa sản phẩm (tự động xóa cache).
