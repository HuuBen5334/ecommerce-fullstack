# E-Commerce Backend — Project Context

## Repositories
https://github.com/HuuBen5334/ecommerce-fullstack.git

## Tech Stack
- **Spring Boot 3.5.14**, Java 21
- **Spring Data JPA** (Hibernate), **PostgreSQL** (`localhost:5432/ecommerce`, user: `postgres`)
- **Spring Retry** + **Spring AOP** — `@Retryable` on `placeOrder()` for optimistic lock recovery
- `spring.jpa.hibernate.ddl-auto=update`, `spring.jpa.open-in-view=false`

## Package Structure
```
com.example.ecommerce_backend/
├── Entities/           Product, User, ProductOrder
├── Repositories/       ProductRepository, UserRepository, ProductOrderRepository
├── Controllers/        ProductController, UserController, ProductOrderController
├── Service/            ProductOrderService
├── WebSocket/          WebSocketConfig, OrderNotificationService, OrderUpdateMessage
├── Config/             GrpcConfig, TransactionConfig
└── Exceptions/         ProductNotFoundException, UserNotFoundException, OutOfStockException
```

## Entities

### Product
- `Long id` (auto-increment), `String name`, `BigDecimal price`, `Integer stockQuantity`
- `Long version` — `@Version` for optimistic locking on concurrent stock updates

### User
- `Long id`, `String name`, `String email` (`@Column(unique=true)`)
- Table name: `app_user` (avoids reserved SQL keyword)

### ProductOrder
- `Long id`, `Integer quantity`, `BigDecimal priceAtPurchase`, `OrderStatus status` (`@Enumerated(EnumType.STRING)`)
- `@ManyToOne Product product`, `@ManyToOne User user`
- `Instant createdAt` — set via `@CreationTimestamp`, not updatable
- Indexes: `idx_product_order_product_id` on `product_id`, `idx_product_order_user_id` on `user_id` (declared via `@Index` on `@Table`)
- Price is captured at order time for historical accuracy

## API Endpoints

### Products — `/products`
| Method | Path | Status |
|--------|------|--------|
| GET | `/products` | 200 |
| GET | `/products/{id}` | 200 / 404 |
| POST | `/products` | 201 |
| PUT | `/products/{id}` | 200 / 404 |
| DELETE | `/products/{id}` | 204 / 409 (FK conflict) |

### Users — `/users`
| Method | Path | Status |
|--------|------|--------|
| GET | `/users` | 200 |
| GET | `/users/{id}` | 200 / 404 |
| POST | `/users` | 201 |
| PUT | `/users/{id}` | 200 / 404 |
| DELETE | `/users/{id}` | 204 / 409 (FK conflict) |

### Orders — `/orders`
| Method | Path | Status |
|--------|------|--------|
| GET | `/orders` | 200 |
| GET | `/orders/{id}` | 200 / 404 |
| POST | `/orders?productId=&userId=&quantity=` | 201 — delegates to ProductOrderService |
| PUT | `/orders/{id}` | 200 / 404 |
| DELETE | `/orders/{id}` | 204 |

### WebSocket — `/ws` (SockJS endpoint)
| Subscribe destination | When pushed |
|---|---|
| `/topic/orders/user/{userId}` | After every `placeOrder()` call for that user |

Payload: `{ orderId, userId, status, priceAtPurchase }`

## Key Patterns
- **Constructor injection** throughout (no `@Autowired` on fields)
- **Custom exceptions** carry `@ResponseStatus`: `ProductNotFoundException` → 404, `UserNotFoundException` → 404, `OutOfStockException` → 409
- **409 CONFLICT** returned on `DataIntegrityViolationException` (FK constraint on DELETE)
- **201 CREATED** for POST, **204 NO_CONTENT** for DELETE — follow this in new endpoints
- All `getAll` endpoints use `findAll(Sort.by("id").ascending())` — sort is done in the database via the primary key index, not in application memory
- `ProductOrderService.placeOrder()` is `@Retryable` (outer) + `@Transactional` (inner): validates stock → decrements stock → saves product (triggers optimistic lock check) → creates order → pushes WebSocket notification. On `ObjectOptimisticLockingFailureException`, retries up to 3× with 50ms/100ms backoff.

## WebSocket Architecture
- `WebSocketConfig` — registers `/ws` SockJS endpoint, enables STOMP broker on `/topic`, app prefix `/app`
- `OrderNotificationService` — wraps `SimpMessagingTemplate`; call `notifyOrderUpdate(order)` from any service to push to `/topic/orders/user/{id}`
- `OrderUpdateMessage` — Java `record` serialized to JSON; fields: `orderId`, `userId`, `status`, `priceAtPurchase`
- React client connects via `@stomp/stompjs` + `sockjs-client`, subscribes to `/topic/orders/user/{userId}`
- CORS allowed origin: `http://localhost:3000` (React dev server)

## Testing
- `ProductOrderServiceTest` — pure Mockito unit tests; mocks `pricingStub` and `orderNotificationService`; sets entity ids via reflection (no `setId()` on JPA entities)
- `ProductOrderControllerTest` — `@WebMvcTest` slice; mocks service layer
- `WebSocketIntegrationTest` — `@SpringBootTest(RANDOM_PORT)`; real STOMP client over SockJS; H2 in-memory DB; asserts message delivery within 5s timeout
- Test DB config in `src/test/resources/application.properties` (H2, overrides PostgreSQL)

## Project Status — ALL PHASES COMPLETE

### Phase 1 — Database Layer & Java API ← COMPLETE
Spring Boot REST API with JPA/Hibernate, PostgreSQL, full CRUD for Products, Users, and Orders.

### Phase 2 — C++ Pricing Engine via gRPC ← COMPLETE
- Pricing engine lives at `pricing-engine/` in this repo, serves on `localhost:50051`
- `ProductOrderService` calls it via `PricingServiceBlockingStub` before capturing `priceAtPurchase`
- Two RPCs: `GetPrice` (bulk discount + scarcity surge), `UpdateDiscount` (admin override per product)
- Multi-threaded via gRPC thread pool; `std::shared_mutex` protects the discount override map
- Build (Linux/WSL): `cd pricing-engine/build && cmake .. && make -j$(nproc) && ./pricing_server`

### Phase 3 — React Frontend ← COMPLETE
- React 19, React Router 7, CRA with dev proxy to `:8080`
- Pages: Home, Products, Users, Orders
- `useFetch` custom hook for REST data; `useOrderNotifications` for live WebSocket feed
- `React.memo` on table rows; all pages lazy-loaded with `Suspense`
- Live order notification feed on Orders page via STOMP/SockJS

### Phase 4 — Load Testing ← COMPLETE
- Tool: **Locust** (`frontend/locustfile.py`)
- 50-user concurrent checkout test revealed `ObjectOptimisticLockingFailureException` (96% failure rate) — fixed with `@Retryable` in `ProductOrderService`
- FK indexes added on `product_order.product_id` and `product_order.user_id` via `@Index` on `ProductOrder` entity

## Frontend Architecture (`frontend/`)
React 19 / React Router 7 / Create React App

**Pages:** `/` (Home), `/products` (Products), `/users` (Users), `/orders` (Orders + live feed)

**Key hooks:**
- `useFetch(path)` — generic data fetcher; proxied to `localhost:8080` via `setupProxy.js`
- `useOrderNotifications(userId)` — subscribes to `/topic/orders/user/{userId}` via STOMP/SockJS; returns accumulated notification list
- `useProducts` — product-specific fetch hook

**Performance:** `ProductRow` and `OrderRow` wrapped in `React.memo`; all page components are `lazy`-loaded with `Suspense`.

**WebSocket client:** `@stomp/stompjs` + `sockjs-client`

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