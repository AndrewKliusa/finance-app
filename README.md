# Finance Tracker API

#### Finance tracker API is a backend for an application that track your finances. <br>This project was made to illustrate my programming skills, as I am too young to have any real experience yet.

## Features
- Stores your transactions inside a database.
- Categorizes them using categories and tags.
- Sets up budgets for your total expenses or individual categories.
- Generates information reports on your transactions.
- Sends notifications for events like exceeding budget or finishing a report.

## Technical features
- JWT Authentication using access and refresh tokens.
- Caching using in-memory data store.
- Background workers for report generation and notifications.
- SSE Event stream for notifications.
- Type safety and request/response validation with zod schemas.
- Containerization and deployment to the cloud.
- Thorough testing using 152 integration tests.

Swagger UI documentation: https://finance-api-3yl5.onrender.com/api/v1/docs

## Tech Stack

The tech stack for this project is:
- Database: **Postgres** (Prisma ORM)
- Caching: **Redis** (ioredis)
- HTTP server: **Fastify**
- Type validation: **Zod**
- Background workers: **BullMQ**
- Authentication: **JWT** (jose)
- Infrastructure: **Docker**
- Deployment: **Render + Upstash**
- Testing: **Vitest**

## Running the project

> Requires **Node 22+**, **Docker**, and **git**.

**1. Clone and install**
```sh
git clone https://github.com/AndrewKliusa/finance-app
cd Petproject
npm install
```

**2. Start Postgres and Redis containers**
```sh
docker compose up -d
```
This will run:
- Postgres on `localhost:5432` (dev DB)
- Postgres on `localhost:5433` (test DB)
- Redis on `localhost:6379`

**3. Create `.env` and `.env.test` files** in the project root.

<details>
<summary>Environment file shape</summary>

```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_tracker
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<64+ character random string>
JWT_REFRESH_SECRET=<64+ character random string>
JWT_NOTIFICATIONS_SECRET=<64+ character random string>
ADMIN_PASSWORD=<seed admin password>
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=*
```
</details>

<details>
<summary>Test environment file shape</summary>

```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/finance_tracker_test
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<64+ character random string>
JWT_REFRESH_SECRET=<64+ character random string>
JWT_NOTIFICATIONS_SECRET=<64+ character random string>
ADMIN_PASSWORD=test
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=*
```
</details>

**4. Sync the database schema**
```sh
npm run dev:push
```

**5. Run the API and workers** in two separate terminals:
```sh
npm run dev
```
```sh
npm run workers
```

The API will be live on `http://localhost:3000`, and Swagger UI is at `http://localhost:3000/api/v1/docs`.

### Running tests
```sh
npm test            # pushes test schema and runs all 152 integration tests
npm run workers:test # in a second terminal, runs workers against the test DB
```

## Authentication

| Method | Path                       | Auth             | Description                                          |
| ------ | -------------------------- | ---------------- | ---------------------------------------------------- |
| POST   | `/auth/register`           | ---                | Create a new user, return access + refresh tokens    |
| POST   | `/auth/login`              | ---                | Verify credentials, return access + refresh tokens   |
| POST   | `/auth/refresh`            | refresh          | Rotate refresh token, return a new token pair        |
| POST   | `/auth/logout`             | refresh          | Revoke the given refresh token                       |
| POST   | `/auth/promote-admin/:id`  | access + admin   | Promote another user to `ADMIN` role                 |

I used **JWT** to generate access and refresh tokens for every user.

**Access token** - expires in 15 minutes. Used to gain access to the API. It is required in authorization header with every request, and gets checked against a token secret to verify it. Access token is stateless, so it is not stored anywhere on the server, this eliminates a need for a DB-look up on every request.

**Refresh token** - expires in 30 days. Used to get a new access token. It is stored in postgres and is mirrored to redis for faster look-ups. It is generated on registration/login and gets revoked on logout.

There are also admin users, that can edit any other user in the system. From the start, seed generates one admin user, that can later promote other users to admins.

Authentication flow diagram:
```mermaid
flowchart TB
    A["Register / Login"] --> B{"Credentials valid?"}
    B -- No --> B1["401 Unauthorized"]
    B -- Yes --> C["Issue access token (15m)<br/>Issue refresh token (30d)<br/>Store refresh in Redis + Postgres"]

    C --> D["Client sends request<br/>with access token"]
    D --> E{"Access token valid?"}
    E -- Yes --> F["Process request"]
    E -- No / expired --> G["POST /auth/refresh<br/>with refresh token"]

    G --> H{"Refresh token valid?<br/>(exists in store + signature ok)"}
    H -- No --> I["401 - force re-login"]
    H -- Yes --> J["Rotate: revoke old refresh,<br/>issue new access + refresh pair"]
    J --> D

    K["Logout"] --> L["Revoke refresh token<br/>(delete from Redis + Postgres)"]

    style B1 fill:#fee
    style I fill:#fee
    style F fill:#efe
```

## Users

| Method | Path                  | Auth                | Description                                                |
| ------ | --------------------- | ------------------- | ---------------------------------------------------------- |
| GET    | `/users`              | access              | Paginated list of users (`?page=1&limit=20`), cached       |
| GET    | `/users/:id`          | access              | Get a single user by id, cached                            |
| PATCH  | `/users/:id`          | access + self/admin | Edit user fields, invalidates user + page caches           |
| PATCH  | `/users/:id/password` | access + self/admin | Change password (requires old password)                    |
| DELETE | `/users/:id`          | access + admin      | Delete user, revoke their refresh tokens                   |

User routes consist of CRUD operations, that are safe guarded by authentication pre-handler, that validates user refresh token. All users are stored to prisma and are cached to redis using read-through cache with TTL and write-through invalidation on mutations.

(routes\users.route.ts:44-73)
```ts
server.get("/users/:id", {
    ...
}, async (request, reply) => {
    // Extract user ID to look for from request
    const { id } = request.params
    // user:${id} is the path in which user is stored in redis
    const cacheKey = `user:${id}`

    // check if user in redis (MUCH FASTER then checking postgres)
    // usually takes 0.1 to 1 millisecond to complete
    const cachedUser = await redis.get(cacheKey)
    // if it is - send it; end the function
    if (cachedUser) {
        return reply.code(200).send(JSON.parse(cachedUser))
    }

    // if it is not, get it from postgres (MUCH SLOWER then checking redis)
    // usually takes 2-10 milliseconds to complete
    const user = await prisma.user.findUnique({
        where: { id },
        omit: { password: true }
    })
    // if it is not in postgres, then user doesn't exist
    if (!user) {
        return reply.code(404).send({ message: "User with this ID does not exist!" })
    }

    // put it into redis, so that next time you try to get this user...
    // ...it will already be in redis
    await redis.set(cacheKey, JSON.stringify(user), "EX", 60)
    return reply.code(200).send(user)
})
```

There is also pagination implemented on the (GET) /users route for retrieving a lot of users at once. It accepts page number and limit of how many users to take. Pages also get cached, to avoid an expensive query if request gets repeated, but pages also get invalidated if any user information changes.

This is how user schema looks:

```prisma
model User {
    id            String         @id @default(uuid()) @db.Uuid
    password      String         /// Hashed with Argon2 (salt included)
    name          String         @unique
    role          Role           @default(USER) /// USER or ADMIN
    globalLimit   Int?           @default(0)    /// Spending cap across all categories
    createdAt     DateTime       @default(now())
    refreshTokens RefreshToken[] /// One per active session, supports multi-device login
    categories    Category[]
    tags          Tag[]
    transactions  Transaction[]
    reports       Report[]
}
```

## Categories and tags

| Method | Path                                                  | Auth                | Description                                                       |
| ------ | ----------------------------------------------------- | ------------------- | ----------------------------------------------------------------- |
| POST   | `/categories` &nbsp;·&nbsp; `/tags`                   | access              | Create a category/tag for the current user, write to cache        |
| GET    | `/categories/:id` &nbsp;·&nbsp; `/tags/:id`           | access + owner      | Get a single category/tag by id                                   |
| GET    | `/categories/user/:id` &nbsp;·&nbsp; `/tags/user/:id` | access + self/admin | List all categories/tags for a user, served from cache when warm  |
| PATCH  | `/categories/:id` &nbsp;·&nbsp; `/tags/:id`           | access + owner      | Edit a category/tag, refresh its cache entry                      |
| DELETE | `/categories/:id` &nbsp;·&nbsp; `/tags/:id`           | access + owner      | Delete a category/tag, remove from cache                          |

Every transaction can be assigned to one category and any number of tags. For example: a $20 transaction in category "Food" with tags "Restaurant" and "Bought for a friend".

### Budgets
Each category has a **budget**, which is basically a spending limit. When user's spending in that category exceeds the limit, they get a notification. There is also a **global budget** that applies across all transactions (including ones with no category), and works the same way.

### Caching
Categories and tags use a different cache layout from users. Each record is stored as a Redis **hash** under `category:{id}` or `tag:{id}`, and the ids of records owned by a user are tracked in a Redis **set** under `user:{userId}:categories`.

This lets us:
- Look up a single record in O(1): `HGETALL category:{id}`
- Read or update one field without rewriting the rest: `HGET category:{id} name`
- List all of a user's records in one set read plus N parallel hash reads, instead of scanning Redis

Mutations are write-through, the cache is updated alongside Postgres on every change, so there is no TTL.

## Transactions

| Method | Path                       | Auth                | Description                                                       |
| ------ | -------------------------- | ------------------- | ----------------------------------------------------------------- |
| POST   | `/transactions`            | access              | Create a transaction, fires a budget-check job if it's an OUTCOME |
| GET    | `/transactions/:id`        | access + owner      | Get a single transaction by id                                    |
| GET    | `/transactions/user/:id`   | access + self/admin | List all transactions for a user (204 if empty)                   |
| PATCH  | `/transactions/:id`        | access + owner      | Edit a transaction, re-fires the budget-check job for OUTCOMEs    |
| DELETE | `/transactions/:id`        | access + owner      | Delete a transaction, re-fires the budget-check job for OUTCOMEs  |

Each transaction has an amount, a type (`INCOME` or `OUTCOME`), an optional description, optional category and any number of tags. Amounts are stored as integers (in cents) to avoid floating-point precision issues with money. Categories and tags are optional on purpose, such transactions fall under user's global budget.

```prisma
model Transaction {
  id          String          @id @default(uuid()) @db.Uuid
  amount      Int
  type        TransactionType
  description String?
  userId      String          @db.Uuid
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId  String?         @db.Uuid
  category    Category?       @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  tags        Tag[]
  createdAt   DateTime        @default(now())
}
```

## Reports

| Method | Path                          | Auth   | Description                                                  |
| ------ | ----------------------------- | ------ | ------------------------------------------------------------ |
| GET    | `/report?year=YYYY&month=MM`  | access | Returns the report if it exists (200), else queues it (202)  |

Reports are generated by a BullMQ worker that runs independently from the API. The first call to `/report` for a given month returns `202 Report is being generated` and queues a job. The worker runs a few prisma aggregations (plus a raw SQL daily-trend query) and writes the finished report to Postgres. The next call returns `200` with the data.

Each report contains:
- **Summary** - total income, total expenses, net, transaction count.
- **Categories breakdown** - per-category total spent, transaction count, budget, and an `isOverBudget` flag.
- **Daily trend** - per-day income vs expenses for the month.
- **Top transactions** - the 5 largest transactions of the month.

Job ids are deterministic (`report-{userId}-{year}-{month}`), so spamming the endpoint while a job is in flight doesn't queue duplicates, BullMQ deduplicates by `jobId`.

```mermaid
flowchart TB
    A["Client: GET /report?year=Y&month=M"] --> B{"Report exists<br/>in Postgres?"}
    B -- Yes --> C["200 + report data"]
    B -- No --> D["Enqueue BullMQ job<br/>(jobId = report-{userId}-{year}-{month})"]
    D --> E["202 Report is being generated"]
    D -.-> F["Reports worker picks up job"]
    F --> G["Aggregate transactions<br/>(summary, breakdown, trend, top 5)"]
    G --> H["Save report to Postgres"]
    H -.-> A

    style C fill:#efe
    style E fill:#ffe
    style H fill:#eef
```

The dashed arrow back to the client shows what happens *next time* they hit `/report`, the worker has finished, the report exists, the call goes down the green path.

## Notifications
| Method | Path                                 | Auth                | Description                                  |
| ------ | ------------------------------------ | ------------------- | -------------------------------------------- |
| GET    | `/notifications/stream?token=...`    | notifications token | Open SSE stream for the current user         |

Notifications are implemented via an SSE event stream. User recieves them:
- When finance report finished generating.
- When user exceeds category budget.

Notifications route accepts a **separate token**, that user gets on `auth/refreshTokens` route. The browser SSE client doesn't let you set Authorization header, so there is no way to set an access token, and passing it in the query string is too dangerous. So, instead it uses a token that is only scoped to notifications access and nothing else.

Communication with BullMQ worker is different from reports. Notifications use **redis pub/sub** - first worker checks if incoming transaction exceeds the budget, then publishes notification text to `notifications:{userId}`, and then sub picks it up in the route logic and sends it.

Send a notification (services/notifications.service.ts:4-11)
```ts
export async function sendNotification(userId: string, message: string) {
    await redis.publish(`notifications:${userId}`,
        JSON.stringify({
            type: "BUDGET_EXCEEDED",
            payload: message
        })
    );
}
```

Handle a notification (routes/notifications.route.ts:25-28)
```ts
await sub.subscribe(`notifications:${request.user.id}`)
sub.on("message", (_, message) => {
    reply.raw.write(`data: ${message}\n\n`)
})
```

```mermaid
flowchart LR
    A["Transaction (OUTCOME)"] --> B["Notifications queue"]
    B --> C["Worker aggregates spend"]
    C --> D{"Over budget?"}
    D -- No --> E["Done"]
    D -- Yes --> F["PUBLISH notifications:{userId}"]
    F --> G["SSE handler<br/>(subscribed to channel)"]
    G --> H["Client receives event"]

    style E fill:#eef
    style H fill:#efe
```

## Deployment
