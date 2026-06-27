## Project Description
This is a full-stack e-commerce simulation. You can browse products, place orders manually, or run an automated simulation to stress-test the system in real time.
- **Browse the Marketplace:** Head to the Marketplace to see all available products. Use the category sidebar to filter by type, and click any product card to view details or buy manually.

- **Pick a User:**
Select a user from the dropdown in the header. Choose a specific user to buy as them, or pick "🎲 Random User" to have the simulation rotate through all users automatically.

- **Run a Simulation:**
Hit Simulate in the header. The system will continuously place random orders at the interval shown by the speed slider. Watch stock levels drop in real time.

- **Watch Live Orders:**
Open the Orders page while the simulation is running. The right column shows a live notification feed pushed over WebSocket as each order changes status: Pending → Confirmed → Shipped → Delivered.

- **Replenish Stock:**
When products sell out the simulation stops automatically. Go to the Products page to replenish any out-of-stock item back to 100 units, then resume.

## Tech Stack
- **Spring Boot 3.5.14**, Java 21
- **Spring Data JPA** (Hibernate), **PostgreSQL** (`localhost:5432/ecommerce`, user: `postgres`)
- **Spring Retry** + **Spring AOP** — `@Retryable` on `placeOrder()` for optimistic lock recovery
- `spring.jpa.hibernate.ddl-auto=update`, `spring.jpa.open-in-view=false`

## Running the Project

### Prerequisites
- PostgreSQL running locally with a database named `ecommerce`
- `DB_PASSWORD` env var set to the `postgres` user password
- Linux/WSL (or native Linux) for building the C++ pricing engine

### Start Order
1. **Pricing engine** (must start before backend)
   ```bash
   cd pricing-engine/build
   cmake .. && make -j$(nproc)
   ./pricing_server   # listens on :50051
   ```
2. **Backend**
   ```bash
   cd backend
   DB_PASSWORD=<password> ./mvnw spring-boot:run   # listens on :8080
   ```
3. **Frontend**
   ```bash
   cd frontend
   npm install && npm start   # listens on :3000
   ```

### Load Testing
```bash
locust -f frontend/locustfile.py
# opens web UI at http://localhost:8089
```
The locust script resets product 1 stock to 10,000 on test start, then simulates browse, order placement, and CRUD tasks.

## Design Decisions
- `app_user` table name — `USER` is a reserved keyword in PostgreSQL
- `BigDecimal` for all monetary values — floating point is unsuitable for money
- `priceAtPurchase` snapshotted at order time — product price can change later
- `@Version Long version` on `Product` — optimistic locking chosen over pessimistic for general-case throughput; pessimistic locking is more appropriate under extreme flash-sale contention
- Constructor injection over `@Autowired` field injection — makes dependencies explicit and allows `final` fields
- Service layer (`ProductOrderService`) owns order placement business logic — controllers handle HTTP only
- WebSocket uses in-memory STOMP broker (`SimpleBroker`) — sufficient for single-node; swap to RabbitMQ/Redis broker for multi-instance deployments
- `@Retryable` must be the outer proxy and `@Transactional` the inner proxy so each retry gets a fresh transaction. `TransactionConfig` sets `@EnableTransactionManagement(order = LOWEST_PRECEDENCE - 1)` to guarantee this ordering explicitly.
- FK indexes declared via `@Index` on `@Table` rather than a migration file — `ddl-auto=update` has Hibernate create them automatically on startup. If the project ever moves to Flyway/Liquibase, these should be migrated there instead.
- Cart state is lifted to `App.js` (not a Context) — the only consumer is `MarketplacePage` + `CartDrawer`, so prop-passing is sufficient and avoids the complexity of a Context provider.
- `checkout()` places orders sequentially (not in parallel) to avoid race conditions on the same product's optimistic lock; the backend `@Retryable` handles any remaining contention.
- The floating cart button is scoped to `MarketplacePage` only — other pages don't expose the cart since cart items are only added from the Marketplace.
