# Finance Tracker API
#### This project was made to illustrate my programming skills, as I am too young to have any real experience yet.

Finance tracker API is a backend for an application that track your finances. It handles the following features:
- Storing your transactions inside a database.
- Categorizing them using categories and tags.
- Setting budgets for your total expenses or individual categories.
- Generating information reports on your transactions using a background worker.
- Recieving notifications for events like exceeding budget or finishing report generation via an SSE event stream and a backgroud worker.
- JWT Authentification using access and refresh token.
- Caching using in-memory storage.
- Containarization and deployment to the cloud.
- Thorough automated testing with 152 tests.

<details>
    <summary><h2>Tech stack</h2></summary>

The tech stack for this project is:
- Database: **Postgres** (Prisma ORM)
- Caching: **Redis** (ioredis)
- HTTP client: **Fastify**
- Type validation: **Zod**
- Background workers: **BullMQ**
- Authentication: **JWT** (jose)
- Infrastructure: **Docker**
- Deployment: **Render + Upstash**

</details>


<details>
    <summary><h2>Authentication</h2></summary>

I used JWT to generate access and refresh tokens for every user on registration

Access token - expires in 15 minutes. Used to gain access to the API. It is required in authorization header with every request, and gets checked against a token secret to verify it. Access token is stateless, so it is not stored anywhere on the server.

Refresh token - expires in 30 days. Used to get a new access token. It is stored in postgres and is mirrored to redis for faster look-ups. It is generated on registration/login and gets revoked on logout.

Authentication flow:
Both token generated on registration.

Send refresh token with each request ->
If refresh token is valid -> accept request
If refresh token is invalid -> deny request -> ask /auth/refresh route for a new access token using a refresh token

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
    H -- No --> I["401 — force re-login"]
    H -- Yes --> J["Rotate: revoke old refresh,<br/>issue new access + refresh pair"]
    J --> D

    K["Logout"] --> L["Revoke refresh token<br/>(delete from Redis + Postgres)"]

    style B1 fill:#fee
    style I fill:#fee
    style F fill:#efe
```

</details>