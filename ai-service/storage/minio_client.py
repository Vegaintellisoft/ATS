# pyrefly: ignore [missing-import]
from minio import Minio

from utils.config import (
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
)

client = Minio(
    endpoint=MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False,
)


def download_pdf(object_key: str) -> bytes:
    response = client.get_object(
        bucket_name=MINIO_BUCKET,
        object_name=object_key,
    )

    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()
