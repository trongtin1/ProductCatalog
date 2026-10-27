import io
import json
import uuid

from minio import Minio
from minio.error import S3Error

from app.core import config


def get_minio_client() -> Minio:
    return Minio(
        endpoint=config.MINIO_ENDPOINT,
        access_key=config.MINIO_ACCESS_KEY,
        secret_key=config.MINIO_SECRET_KEY,
        secure=config.MINIO_SECURE,
    )


def ensure_bucket_exists(client: Minio) -> None:
    """Create the bucket and set a public-read policy if it doesn't exist yet."""
    try:
        if not client.bucket_exists(config.MINIO_BUCKET):
            client.make_bucket(config.MINIO_BUCKET)
            policy = json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{config.MINIO_BUCKET}/*"],
                }],
            })
            client.set_bucket_policy(config.MINIO_BUCKET, policy)
    except S3Error:
        pass


def upload_image(file_data: bytes, content_type: str, extension: str) -> str:
    """Upload image bytes to MinIO and return the public URL."""
    client = get_minio_client()
    ensure_bucket_exists(client)

    filename = f"{uuid.uuid4().hex}{extension}"
    client.put_object(
        bucket_name=config.MINIO_BUCKET,
        object_name=filename,
        data=io.BytesIO(file_data),
        length=len(file_data),
        content_type=content_type,
    )
    return f"{config.MINIO_PUBLIC_URL}/{config.MINIO_BUCKET}/{filename}"

