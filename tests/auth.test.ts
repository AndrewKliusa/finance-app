import { buildServer } from "../server"
import { UserCreateType } from '../schemas/user.schema';
import { RefreshType } from "../schemas/auth.schema";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma";

const server = buildServer()

describe("Authentification", async () => {
    it("Accessing users with invalid token", async () => {
        const regRes = await register({ name: "andrew", password: "test1234" })
        const getRes = await getUser(regRes.json().user.id, "dummytoken")

        expect(getRes.statusCode).toBe(401)
    })
})

beforeAll(async () => {
    await server.ready()
})

afterAll(async () => {
    await server.close()
})

beforeEach(async () => {
    await prisma.user.deleteMany()
})

afterEach(async () => {
    await prisma.user.deleteMany()
})

async function register(payload: UserCreateType) {
    return server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload
    })
}

async function login(payload: UserCreateType) {
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

async function getUser(userId: string, token: string) {
    return server.inject({
        method: 'GET',
        url: `/api/v1/users/${userId}` ,
        headers: { authorization: `Bearer ${token}` }
    })
}