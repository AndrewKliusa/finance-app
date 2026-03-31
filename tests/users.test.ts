import { afterAll, beforeAll, describe, expect, it, afterEach, beforeEach } from 'vitest'
import { buildServer } from '../server'
import { UserCreateType, UserCreateSchema, UserEditType, GetUsersQuerySchema, GetUsersQueryType } from '../schemas/user.schema';
import { prisma } from '../lib/prisma';
import { createAdminUser, emptyUUID, testFunctionsBuilder } from './helpers';
import { redis } from '../lib/redis';

const URL = "/api/v1/users"
const server = buildServer()

let accessToken: string;
const { get, del, patch, query } = testFunctionsBuilder<UserCreateType, UserEditType, GetUsersQueryType>(server, URL, () => accessToken)

describe("User routes", () => {
    it("Creates a user", async () => {
        const res = await post({ name: "andrew", password: "test1234" })

        expect(res.statusCode).toBe(201)
        expect(res.json().user.name).toBe("andrew")
    })

    it("Creates a duplicate user", async () => {
        await post({ name: "andrew", password: "test1234" })
        const res = await post({ name: "andrew", password: "test1234" })

        expect(res.statusCode).toBe(409)
    })

    it("Gets a user", async () => {
        const postRes = await post({ name: "andrew", password: "test1234" })
        const getRes = await get(postRes.json().user.id)

        expect(getRes.statusCode).toBe(200)
        expect(getRes.json()).toEqual(postRes.json().user)
    })

    it("Deletes a user", async () => {
        const postRes = await post({ name: "andrew", password: "test1234" })
        const delRes = await del(postRes.json().user.id)

        expect(delRes.statusCode).toBe(200)
        expect(delRes.json()).toEqual(postRes.json().user)
    })

    it("Gets a non-existent user", async () => {
        const res = await get(emptyUUID)

        expect(res.statusCode).toBe(404)
    })

    it("Deletes a non-existent user", async () => {
        const res = await del(emptyUUID)

        expect(res.statusCode).toBe(404)
    })

    it("Changes user name", async () => {
        const postRes = await post({ name: "andrw", password: "test1234" })
        const patchRes = await patch(postRes.json().user.id, { name: "andrew"})

        expect(patchRes.statusCode).toBe(200)
        expect(patchRes.json().name).toBe("andrew")
    })

    it("Gets multiple users", async () => {
        await post({ name: "andrew1", password: "test1234" })
        await post({ name: "andrew2", password: "test1234" })
        const getRes = await query({ page: 1, limit: 10 })

        expect(getRes.json()).length(3)
    })

    it("Gets user from cache", async () => {
        const postRes = await post({ name: "andrew1", password: "test1234" })
        const { id } = postRes.json().user

        await get(id)
        const cachedUser = await redis.get(`user:${id}`)

        expect(cachedUser).not.toBeNull()
        expect(JSON.parse(cachedUser!)).toMatchObject({ id })
    })

    it("Uses wrong input for operations", async () => {
        const postRes = await post({ name: "-1", password: "" })
        const getRes = await get("123")
        const delRes = await get("")

        expect(postRes.statusCode).toBe(400)
        expect(getRes.statusCode).toBe(400)
        expect(delRes.statusCode).toBe(400)
    })
})

beforeAll(async () => {
    await server.ready()
    accessToken = await createAdminUser()
})

afterAll(async () => {
    await server.close()
    await prisma.user.deleteMany()
})

beforeEach(async () => {
    await prisma.user.deleteMany({
        where: { name: { not: 'admin' } }
    })
})

afterEach(async () => {
    await prisma.user.deleteMany({
        where: { name: { not: 'admin' } }
    })
})

async function post(payload: UserCreateType) {
    return await server.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload
    })
}

// ADDITIONAL AI GENERATED TESTS
// TESTS BELOW WERE NOT WRITTEN BY ME

describe("(AI) User routes", async () => {
    it("(AI) Does not expose password in POST response", async () => {
        const res = await post({ name: "andrew", password: "test1234" })

        expect(res.json()).not.toHaveProperty("password")
    })

    it("(AI) Does not expose password in GET response", async () => {
        const postRes = await post({ name: "andrew", password: "test1234" })
        const getRes = await get(postRes.json().id)

        expect(getRes.json()).not.toHaveProperty("password")
    })

    it("(AI) Does not expose password in DELETE response", async () => {
        const postRes = await post({ name: "andrew", password: "test1234" })
        const delRes = await del(postRes.json().id)

        expect(delRes.json()).not.toHaveProperty("password")
    })

    it("(AI) POST response contains expected fields", async () => {
        const res = await post({ name: "andrew", password: "test1234" })
        const body = res.json().user

        expect(body).toHaveProperty("id")
        expect(body).toHaveProperty("name", "andrew")
        expect(body).toHaveProperty("createdAt")
    })

    it("(AI) Rejects a name that is too long", async () => {
        const res = await post({ name: "a".repeat(256), password: "test1234" })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects a password that is too short", async () => {
        const res = await post({ name: "andrew", password: "123" })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Trims or rejects a name with only whitespace", async () => {
        const res = await post({ name: "   ", password: "test1234" })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Gets a non-existent user", async () => {
        const res = await get(emptyUUID)

        expect(res.statusCode).toBe(404)
    })

    it("(AI) Returns a structured error body on validation failure", async () => {
        const res = await get("not-a-uuid")
        const body = res.json()

        expect(res.statusCode).toBe(400)
        expect(body).toHaveProperty("message", "Validation error")
        expect(body).toHaveProperty("errors")
        expect(Array.isArray(body.errors)).toBe(true)
    })

    it("(AI) Returns a structured error body on 409 conflict", async () => {
        await post({ name: "andrew", password: "test1234" })
        const res = await post({ name: "andrew", password: "test1234" })
        const body = res.json()

        expect(res.statusCode).toBe(409)
        expect(body).toHaveProperty("message")
        expect(body.message).toMatch(/name/i)
    })

    it("(AI) Returns a structured error body on 404", async () => {
        const res = await get(emptyUUID)
        const body = res.json()

        expect(res.statusCode).toBe(404)
        expect(body).toHaveProperty("message")
    })
})