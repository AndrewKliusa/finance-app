import { randomBytes } from 'node:crypto'
import { existsSync, writeFileSync } from 'node:fs'

if (existsSync(".env")) {
    console.error(".env already exists!")
} else {
    writeFileSync(".env", `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_tracker
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=${randomBytes(48).toString('hex')}
JWT_REFRESH_SECRET=${randomBytes(48).toString('hex')}
JWT_NOTIFICATIONS_SECRET=${randomBytes(48).toString('hex')}
ADMIN_PASSWORD=admin
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=*
`)
    console.log("Created .env file.")
}

if (existsSync(".env.test")) {
    console.error(".env.test already exists!")
} else {
    writeFileSync(".env.test", `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/finance_tracker_test
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=${randomBytes(48).toString('hex')}
JWT_REFRESH_SECRET=${randomBytes(48).toString('hex')}
JWT_NOTIFICATIONS_SECRET=${randomBytes(48).toString('hex')}
ADMIN_PASSWORD=test
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=*
`)
    console.log("Created .env.test file.")
}