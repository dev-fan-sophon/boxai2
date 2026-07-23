#!/usr/bin/env python3
"""Put CORS rules on the playground R2 bucket (S3-compatible API).

Reads R2_* from the environment (typically sourced from /opt/boxai/.env).
Does not print secrets. R2 expects the S3 XML CORS schema (not JSON).
"""
from __future__ import annotations

import datetime
import hashlib
import hmac
import os
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from urllib.parse import urlparse


def _sign_key(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def aws_v4_headers(
    *,
    method: str,
    url: str,
    query: str,
    access_key: str,
    secret_key: str,
    payload: bytes,
    extra_headers: dict[str, str] | None = None,
) -> dict[str, str]:
    parsed = urlparse(url)
    host = parsed.netloc
    canonical_uri = parsed.path or "/"
    region = "auto"
    service = "s3"

    now = datetime.datetime.now(datetime.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")
    payload_hash = hashlib.sha256(payload).hexdigest()

    headers: dict[str, str] = {
        "host": host,
        "x-amz-content-sha256": payload_hash,
        "x-amz-date": amz_date,
    }
    if extra_headers:
        headers.update(extra_headers)

    signed_header_keys = sorted(k.lower() for k in headers)
    header_map = {k.lower(): v.strip() for k, v in headers.items()}
    canonical_headers = "".join(f"{k}:{header_map[k]}\n" for k in signed_header_keys)
    signed_headers = ";".join(signed_header_keys)
    canonical_request = "\n".join(
        [
            method,
            canonical_uri,
            query,
            canonical_headers,
            signed_headers,
            payload_hash,
        ]
    )
    credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"
    string_to_sign = "\n".join(
        [
            "AWS4-HMAC-SHA256",
            amz_date,
            credential_scope,
            hashlib.sha256(canonical_request.encode("utf-8")).hexdigest(),
        ]
    )
    k_date = _sign_key(("AWS4" + secret_key).encode("utf-8"), date_stamp)
    k_region = _sign_key(k_date, region)
    k_service = _sign_key(k_region, service)
    k_signing = _sign_key(k_service, "aws4_request")
    signature = hmac.new(
        k_signing, string_to_sign.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    headers["Authorization"] = (
        f"AWS4-HMAC-SHA256 Credential={access_key}/{credential_scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )
    return headers


def build_cors_xml(origins: list[str]) -> bytes:
    # S3 PutBucketCors XML schema
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
        "  <CORSRule>",
    ]
    for origin in origins:
        lines.append(f"    <AllowedOrigin>{origin}</AllowedOrigin>")
    lines.extend(
        [
            "    <AllowedMethod>GET</AllowedMethod>",
            "    <AllowedMethod>HEAD</AllowedMethod>",
            "    <AllowedHeader>*</AllowedHeader>",
            "    <ExposeHeader>ETag</ExposeHeader>",
            "    <ExposeHeader>Content-Type</ExposeHeader>",
            "    <ExposeHeader>Content-Length</ExposeHeader>",
            "    <ExposeHeader>Content-Disposition</ExposeHeader>",
            "    <ExposeHeader>Accept-Ranges</ExposeHeader>",
            "    <ExposeHeader>Content-Range</ExposeHeader>",
            "    <MaxAgeSeconds>86400</MaxAgeSeconds>",
            "  </CORSRule>",
            "</CORSConfiguration>",
            "",
        ]
    )
    return "\n".join(lines).encode("utf-8")


def parse_cors_origins(xml_body: str) -> list[str]:
    try:
        root = ET.fromstring(xml_body)
    except ET.ParseError:
        return []
    # strip namespace
    origins: list[str] = []
    for el in root.iter():
        tag = el.tag.split("}", 1)[-1]
        if tag == "AllowedOrigin" and el.text:
            origins.append(el.text.strip())
    return origins


def main() -> int:
    endpoint = os.environ.get("R2_ENDPOINT", "").rstrip("/")
    bucket = os.environ.get("R2_BUCKET", "").strip()
    access_key = os.environ.get("R2_ACCESS_KEY_ID", "").strip()
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY", "").strip()
    if not all([endpoint, bucket, access_key, secret_key]):
        print("missing R2_ENDPOINT / R2_BUCKET / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY")
        return 2

    origins = [
        o.strip()
        for o in os.environ.get(
            "R2_CORS_ORIGINS",
            "https://you-box.com,https://www.you-box.com",
        ).split(",")
        if o.strip()
    ]
    body = build_cors_xml(origins)
    base = f"{endpoint}/{bucket}"
    url = f"{base}?cors"
    query = "cors="

    put_headers = aws_v4_headers(
        method="PUT",
        url=base,
        query=query,
        access_key=access_key,
        secret_key=secret_key,
        payload=body,
        extra_headers={"content-type": "application/xml"},
    )
    req = urllib.request.Request(url, data=body, method="PUT", headers=put_headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"put_cors_status={resp.status}")
    except urllib.error.HTTPError as exc:
        err = exc.read().decode("utf-8", "replace")[:800]
        print(f"put_cors_status={exc.code}")
        print(f"put_cors_error={err}")
        return 1

    get_headers = aws_v4_headers(
        method="GET",
        url=base,
        query=query,
        access_key=access_key,
        secret_key=secret_key,
        payload=b"",
    )
    req = urllib.request.Request(url, method="GET", headers=get_headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read().decode("utf-8", "replace")
        print(f"get_cors_status={resp.status}")
        got = parse_cors_origins(data)
        print(f"origins={got}")
        missing = [o for o in origins if o not in got]
        if missing:
            print(f"missing_origins={missing}")
            return 1
    print(f"bucket={bucket}")
    print("cors_applied=true")
    return 0


if __name__ == "__main__":
    sys.exit(main())
