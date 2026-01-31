import random
import string
import time
from datetime import datetime, timedelta
import requests

BASE_URL = "http://localhost:3001/api/feed/partner"

HEADERS_A = {
    "X-API-Key": "secret-key-pat-a",
    "Content-Type": "application/json",
}

HEADERS_B = {
    "X-API-Key": "secret-key-pat-b",
    "Content-Type": "application/json",
}


def random_sku():
    return "SKU-" + "".join(random.choices(string.digits, k=4))


def random_item_code():
    return "IT-" + "".join(random.choices(string.digits, k=3))


def random_timestamp_2025_2026():
    start = datetime(2026, 1, 1)
    end = datetime(2026, 1, 31)
    delta = end - start
    random_time = start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))
    return int(random_time.timestamp() * 1000)  # milliseconds


def random_purchase_time():
    start = datetime(2026, 1, 1)
    end = datetime(2026, 1, 31)
    delta = end - start
    random_time = start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))
    return random_time.strftime("%Y-%m-%d %H:%M:%S")


def send_partner_a():
    payload = {
        "skuId": random_sku(),
        "transactionTimeMs": random_timestamp_2025_2026(),
        "amount": round(random.uniform(10.0, 500.0), 2),
    }

    response = requests.post(
        f"{BASE_URL}?partner=A",
        json=payload,
        headers=HEADERS_A,
    )

    print("Partner A →", response.status_code, response.json())


def send_partner_b():
    total = round(random.uniform(50.0, 500.0), 2)
    discount = round(random.uniform(0.0, total * 0.3), 2)

    payload = {
        "itemCode": random_item_code(),
        "purchaseTime": random_purchase_time(),
        "total": total,
        "discount": discount,
    }

    response = requests.post(
        f"{BASE_URL}?partner=B",
        json=payload,
        headers=HEADERS_B,
    )

    print("Partner B →", response.status_code, response.json())


if __name__ == "__main__":
    for _ in range(10):
        send_partner_a()
        send_partner_b()
        time.sleep(1)
