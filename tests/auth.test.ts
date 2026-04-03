import { buildServer } from "../server"
import { GetUsersQueryType, UserCreateType, UserEditType } from '../schemas/user.schema';
import { RefreshType } from "../schemas/auth.schema";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

const server = buildServer()

describe("Authentification", async () => {
    it("Checks user auth keys upon creation", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })

        expect(regRes.statusCode).toBe(201)
        expect(regRes.json().refreshToken).toBeTypeOf("string")
        expect(regRes.json().accessToken).toBeTypeOf("string")
    })

    it("Checks user auth keys upon login", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })

        expect(regRes.statusCode).toBe(201)
        expect(regRes.json().refreshToken).toBeTypeOf("string")
        expect(regRes.json().accessToken).toBeTypeOf("string")
    })

    it("Logins with invalid credentials", async () => {
        await register({ name: "andrew1234", password: "test1234" })
        const loginRes = await login({ name: "andrew123", password: "test1234" })
        const loginResTwo = await login({ name: "andrew1234", password: "test12345" })

        expect(loginRes.statusCode).toBe(401)
        expect(loginResTwo.statusCode).toBe(401)
    })

    it("Logins with valid credentials", async () => {
        await register({ name: "andrew1234", password: "test1234" })
        const loginRes = await login({ name: "andrew1234", password: "test1234" })

        expect(loginRes.statusCode).toBe(200)
        expect(loginRes.json().accessToken).toBeTypeOf("string")
        expect(loginRes.json().refreshToken).toBeTypeOf("string")
        expect(loginRes.json().user.name).toBe("andrew1234")
        expect(loginRes.json().user.password).toBeUndefined()
    })
})

beforeAll(async () => {
    await server.ready()
})

afterAll(async () => {
    await server.close()
})

beforeEach(async () => {
    await prisma.user.deleteMany({
        where: { name: { not: 'admin' } }
    })
    await redis.flushdb()
})

afterEach(async () => {
    await prisma.user.deleteMany({
        where: { name: { not: 'admin' } }
    })
    await redis.flushdb()
})

export async function register(payload: UserCreateType) {
    return server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload
    })
}

export async function login(payload: UserCreateType) {
    return server.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload
    })
}

async function refresh(payload: RefreshType) {
    return server.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload
    })
}

async function logout(payload: RefreshType) {
    return server.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        payload
    })
}

// ADDITIONAL AI GENERATED TESTS
// TESTS BELOW WERE NOT WRITTEN BY ME

describe("(AI) User routes", async () => {
    it("(AI) Refreshes a token pair", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const { refreshToken } = regRes.json()

        const refreshRes = await refresh({ refreshToken })

        expect(refreshRes.statusCode).toBe(200)
        expect(refreshRes.json().accessToken).toBeTypeOf("string")
        expect(refreshRes.json().refreshToken).toBeTypeOf("string")
        expect(refreshRes.json().refreshToken).not.toBe(refreshToken)
    })

    it("(AI) Rejects an already-used refresh token", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const { refreshToken } = regRes.json()

        await refresh({ refreshToken })
        const secondRefresh = await refresh({ refreshToken })

        expect(secondRefresh.statusCode).toBe(401)
    })

    it("(AI) Rejects an invalid refresh token", async () => {
        const refreshRes = await refresh({ refreshToken: "invalid-token" })

        expect(refreshRes.statusCode).toBe(401)
    })

    it("(AI) Logs out successfully", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const { refreshToken } = regRes.json()

        const logoutRes = await logout({ refreshToken })

        expect(logoutRes.statusCode).toBe(204)
    })

    it("(AI) Rejects refresh after logout", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const { refreshToken } = regRes.json()

        await logout({ refreshToken })
        const refreshRes = await refresh({ refreshToken })

        expect(refreshRes.statusCode).toBe(401)
    })
})