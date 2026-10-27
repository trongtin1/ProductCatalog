
import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Tự động đọc file .env ở thư mục gốc nếu có
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

PROJECT_NAME = os.getenv("PROJECT_NAME")
VERSION = os.getenv("VERSION")
API_V1_STR = os.getenv("API_V1_STR")

POSTGRES_SERVER = os.getenv("POSTGRES_SERVER")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT"))
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_DB = os.getenv("POSTGRES_DB")

def get_database_url():
    return (
        f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )


REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD") or None
REDIS_DB = int(os.getenv("REDIS_DB"))
REDIS_CACHE_TTL = int(os.getenv("REDIS_CACHE_TTL"))

def get_redis_url():
    if REDIS_PASSWORD:
        return f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
    return f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "product-images")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
MINIO_PUBLIC_URL = os.getenv("MINIO_PUBLIC_URL", "http://localhost:9000")

cors_env = os.getenv("BACKEND_CORS_ORIGINS")
try:
    BACKEND_CORS_ORIGINS = json.loads(cors_env)
except Exception:
    BACKEND_CORS_ORIGINS = ["*"]

