import random
import string
import time
from datetime import datetime, timedelta
import requests
import uuid
import argparse

BASE_URL = "http://localhost:3001/api/feed/partner"

HEADERS_A = {
    "X-API-Key": "secret-key-pat-a",
    "Content-Type": "application/json",
}

HEADERS_B = {
    "X-API-Key": "secret-key-pat-b",
    "Content-Type": "application/json",
}


# ---------- helpers ----------

def chance(p=0.2):
    return random.random() < p


def random_sku():
    return "SKU-" + "".join(random.choices(string.digits, k=4))


def random_item_code():
    return "IT-" + "".join(random.choices(string.digits, k=3))


def random_timestamp_2025_2026():
    start = datetime(2026, 1, 1)
    end = datetime(2026, 1, 31)
    delta = end - start
    random_time = start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))
    return int(random_time.timestamp() * 1000)


def random_purchase_time():
    start = datetime(2026, 1, 1)
    end = datetime(2026, 1, 31)
    delta = end - start
    random_time = start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))
    return random_time.strftime("%Y-%m-%d %H:%M:%S")


def random_bad_date():
    return random.choice(["not-a-date", "2026-99-99", "", None])


def random_amount():
    if chance(0.3):
        return random.choice([-100, 0, "abc", None])
    return round(random.uniform(10.0, 500.0), 2)


IDEMPOTENCY_KEYS = [str(uuid.uuid4()) for _ in range(3)]


# ---------- payload builders ----------

def build_partner_a_payload(mode):
    if mode == "valid":
        return {
            "skuId": random_sku(),
            "transactionTimeMs": random_timestamp_2025_2026(),
            "amount": round(random.uniform(10, 500), 2),
        }

    # random / chaos
    payload = {}
    if not chance(0.15):
        payload["skuId"] = "" if chance() else random_sku()
    if not chance(0.15):
        payload["transactionTimeMs"] = (
            random_bad_date() if chance(0.3) else random_timestamp_2025_2026()
        )
    if not chance(0.15):
        payload["amount"] = random_amount()
    return payload


def build_partner_b_payload(mode):
    if mode == "valid":
        return {
            "itemCode": random_item_code(),
            "purchaseTime": random_purchase_time(),
            "total": round(random.uniform(50, 500), 2),
            "discount": round(random.uniform(0, 30), 2),
        }

    # random / chaos
    payload = {}
    if not chance(0.15):
        payload["itemCode"] = "" if chance() else random_item_code()
    if not chance(0.15):
        payload["purchaseTime"] = (
            random_bad_date() if chance(0.3) else random_purchase_time()
        )
    if not chance(0.15):
        payload["total"] = random_amount()
    if not chance(0.15):
        payload["discount"] = random.choice([10.0, -5, "oops", None])
    return payload


def build_headers(base_headers, mode):
    headers = base_headers.copy()
    if mode == "random" and chance(0.3):
        headers["Idempotency-Key"] = random.choice(IDEMPOTENCY_KEYS)
    else:
        headers["Idempotency-Key"] = str(uuid.uuid4())
    return headers


# ---------- senders ----------

def send_partner_a(mode):
    payload = build_partner_a_payload(mode)
    headers = build_headers(HEADERS_A, mode)

    res = requests.post(
        f"{BASE_URL}?partner=A",
        json=payload,
        headers=headers,
    )

    print("Partner A →", res.status_code)
    print("Payload:", payload)
    print(res.text)
    print("-" * 60)


def send_partner_b(mode):
    payload = build_partner_b_payload(mode)
    headers = build_headers(HEADERS_B, mode)

    res = requests.post(
        f"{BASE_URL}?partner=B",
        json=payload,
        headers=headers,
    )

    print("Partner B →", res.status_code)
    print("Payload:", payload)
    print(res.text)
    print("-" * 60)


# ---------- main ----------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Partner Feed Event Generator")
    parser.add_argument(
        "--mode",
        choices=["valid", "random"],
        default="random",
        help="valid = correct payloads, random = chaos testing",
    )
    parser.add_argument("--count", type=int, default=20, help="Number of iterations")
    parser.add_argument("--delay", type=float, default=0.8, help="Delay between calls")

    args = parser.parse_args()

    print(f"Running in {args.mode.upper()} mode")

    for _ in range(args.count):
        send_partner_a(args.mode)
        send_partner_b(args.mode)
        time.sleep(args.delay)
