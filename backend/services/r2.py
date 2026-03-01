"""
Cloudflare R2 storage — upload generated design images.
Uses boto3 (S3-compatible API). Returns presigned URLs (valid 7 days)
so the browser can load images directly without exposing credentials.
"""
import base64
import uuid
import boto3
from botocore.config import Config as BotoConfig
from config import settings

_s3_client = None

PRESIGNED_URL_TTL = 60 * 60 * 24 * 7  # 7 days in seconds


def _get_client():
    global _s3_client
    if _s3_client is None:
        if not settings.R2_ACCESS_KEY_ID or not settings.R2_ENDPOINT:
            return None
        _s3_client = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=BotoConfig(signature_version="s3v4"),
            region_name="auto",
        )
    return _s3_client


def upload_image_b64(image_b64: str, prefix: str = "designs") -> str | None:
    """
    Upload a base64-encoded PNG to R2.
    Returns a 7-day presigned URL (browser-accessible) or None if R2 is not configured.
    """
    client = _get_client()
    if not client:
        return None

    key = f"{prefix}/{uuid.uuid4()}.png"
    image_bytes = base64.b64decode(image_b64)

    client.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=image_bytes,
        ContentType="image/png",
    )

    presigned_url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key},
        ExpiresIn=PRESIGNED_URL_TTL,
    )
    print(f"[R2] Uploaded {key}, presigned URL valid 7 days")
    return presigned_url
