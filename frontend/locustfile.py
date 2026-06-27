from locust import HttpUser, task, between, events
import requests
import random

@events.test_start.add_listener
def reset_stock(environment, **kwargs):
    product = requests.get("http://localhost:8080/products/1").json()
    requests.put("http://localhost:8080/products/1", json={
        "name": product["name"],
        "price": str(product["price"]),
        "stockQuantity": 10000
    })

class CheckoutUser(HttpUser):
    host = "http://localhost:8080"
    wait_time = between(1, 3)

    @task(3)
    def browse_products(self):
        self.client.get("/products")

    @task(3)
    def browse_orders(self):
        self.client.get("/orders")

    @task(1)
    def browse_users(self):
        self.client.get("/users")

    @task(2)
    def place_order(self):
        self.client.post(
            f"/orders?productId=1&userId={random.randint(1, 2)}&quantity=1"
        )

    @task(1)
    def create_product(self):
        self.client.post("/products", json={
            "name": f"Product {random.randint(1, 1000)}",
            "price": str(round(random.uniform(1.99, 499.99), 2)),
            "stockQuantity": random.randint(10, 500)
        })

    @task(1)
    def create_user(self):
        self.client.post("/users", json={
            "name": f"User {random.randint(1, 10000)}",
            "email": f"user{random.randint(1, 10000)}@test.com"
        })
