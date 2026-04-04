import { afterAll, beforeAll, describe, expect, it, afterEach, beforeEach } from 'vitest'
import { buildServer } from '../server'
import { NameAndPasswordType, NameAndPasswordSchema, UserEditType, GetUsersQuerySchema, GetUsersQueryType } from '../schemas/user.schema';
import { prisma } from '../lib/prisma';
import { generateAdminToken, emptyUUID, userFunctionsBuilder, adminAccessToken, authFunctionsBuilder } from './helpers';
import { redis } from '../lib/redis';
import argon2 from "argon2"

const server = buildServer()

const { get, del, patch, query, changePassword } = userFunctionsBuilder(server)
const { register, login } = authFunctionsBuilder(server)

describe("User routes", () => {
    it("Creates a user", async () => {
        const res = await register({ name: "andrew", password: "test1234" })

        expect(res.statusCode).toBe(201)
        expect(res.json().user.name).toBe("andrew")
    })

    it("Creates a duplicate user", async () => {
        await register({ name: "andrew", password: "test1234" })
        const res = await register({ name: "andrew", password: "test1234" })

        expect(res.statusCode).toBe(409)
    })

    it("Gets a user", async () => {
        const regRes = await register({ name: "andrew", password: "test1234" })
        const getRes = await get(regRes.json().user.id)

        expect(getRes.statusCode).toBe(200)
        expect(getRes.json()).toEqual(regRes.json().user)
    })

    it("Deletes a user", async () => {
        const regRes = await register({ name: "andrew", password: "test1234" })
        const delRes = await del(regRes.json().user.id)

        expect(delRes.statusCode).toBe(200)
        expect(delRes.json()).toEqual(regRes.json().user)
    })

    it("Gets a non-existent user", async () => {
        const res = await get(emptyUUID)

        expect(res.statusCode).toBe(404)
    })

    it("Deletes a non-existent user", async () => {
        const res = await del(emptyUUID)

        expect(res.statusCode).toBe(404)
    })

    it("Deletes a user and all their session keys", async () => {
        const regRes = await register({ name: "andrew", password: "test1234" })
        const loginRes = await login({ name: regRes.json().user.name, password: "test1234" })
        const delRes = await del(regRes.json().user.id)

        expect(delRes.statusCode).toBe(200)
        expect(regRes.json().refreshToken).toBeTypeOf("string")
        expect(regRes.json().accessToken).toBeTypeOf("string")
        expect(regRes.json().refreshToken).not.toEqual(loginRes.json().refreshToken)
        expect(regRes.json().accessToken).not.toEqual(loginRes.json().accessToken)

        const firstToken = await redis.get(`refreshToken:${regRes.json().refreshToken}`)
        const secondToken = await redis.get(`refreshToken:${loginRes.json().refreshToken}`)

        expect(firstToken).toBeNull()
        expect(secondToken).toBeNull()
    })

    it("Deletes a non-existent user without admin perms", async () => {
        const regRes = await register({ name: "andrew", password: "test1234" })
        const delRes = await del(regRes.json().user.id, "", regRes.json().accessToken)

        expect(delRes.statusCode).toBe(401)
    })

    it("Changes user name", async () => {
        const regRes = await register({ name: "andrw", password: "test1234" })
        const patchRes = await patch(regRes.json().user.id, { name: "andrew"}, "", regRes.json().accessToken)

        expect(patchRes.statusCode).toBe(200)
        expect(patchRes.json().name).toBe("andrew")
    })

    it("Changes user name of a different user", async () => {
        const regRes = await register({ name: "andrw", password: "test1234" })
        const regResTwo = await register({ name: "andrew2", password: "test1234" })
        const patchRes = await patch(regRes.json().user.id, { name: "andrew"}, "", regResTwo.json().accessToken)

        expect(patchRes.statusCode).toBe(401)
    })

    it("Changes user name of a different user as admin", async () => {
        const regRes = await register({ name: "andrw", password: "test1234" })
        const patchRes = await patch(regRes.json().user.id, { name: "andrew"})

        expect(patchRes.statusCode).toBe(200)
        expect(patchRes.json().name).toBe("andrew")
    })

    it("Gets multiple users", async () => {
        await register({ name: "andrew1", password: "test1234" })
        await register({ name: "andrew2", password: "test1234" })
        const getRes = await query({ page: 1, limit: 10 })

        expect(getRes.json()).length(3)
    })

    it("Gets user from cache", async () => {
        const regRes = await register({ name: "andrew1", password: "test1234" })
        const { id } = regRes.json().user

        await get(id)
        const cachedUser = await redis.get(`user:${id}`)

        expect(cachedUser).not.toBeNull()
        expect(JSON.parse(cachedUser!)).toMatchObject({ id })
    })

    it("Uses wrong input for operations", async () => {
        const regRes = await register({ name: "-1", password: "" })
        const getRes = await get("123")
        const delRes = await get("")

        expect(regRes.statusCode).toBe(400)
        expect(getRes.statusCode).toBe(400)
        expect(delRes.statusCode).toBe(400)
    })

    it("Gets a user using invalid token", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const getRes = await get(regRes.json().user.id, "", "dummytoken")

        expect(getRes.statusCode).toBe(401)
    })

    it("Changes user password", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const user = await prisma.user.findUnique({
            where: { name: regRes.json().user.name }
        })

        const passChangeRes = await changePassword(regRes.json().user.id, "test1234", "newTest1234")
        const updatedUser = await prisma.user.findUnique({
            where: { name: regRes.json().user.name }
        })
        expect(passChangeRes.statusCode).toBe(204)
        
        expect(user?.password).not.toEqual(updatedUser?.password)
    })

    it("Changes user password with a wrong old password", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const user = await prisma.user.findUnique({
            where: { name: regRes.json().user.name }
        })

        const passChangeRes = await changePassword(regRes.json().user.id, "test", "newTest1234")
        const updatedUser = await prisma.user.findUnique({
            where: { name: regRes.json().user.name }
        })
        expect(passChangeRes.statusCode).toBe(400)
        
        expect(user?.password).toEqual(updatedUser?.password)
    })
})

beforeAll(async () => {
    await server.ready()
    await generateAdminToken()
})

afterAll(async () => {
    await server.close()
    await prisma.user.deleteMany()
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

// ADDITIONAL AI GENERATED TESTS
// TESTS BELOW WERE NOT WRITTEN BY ME

describe("(AI) User routes", async () => {
    it("(AI) Does not expose password in register response", async () => {
        const res = await register({ name: "andrew", password: "test1234" })

        expect(res.json()).not.toHaveProperty("password")
    })

    it("(AI) Does not expose password in GET response", async () => {
        const regRes = await register({ name: "andrew", password: "test1234" })
        const getRes = await get(regRes.json().id)

        expect(getRes.json()).not.toHaveProperty("password")
    })

    it("(AI) Does not expose password in DELETE response", async () => {
        const regRes = await register({ name: "andrew", password: "test1234" })
        const delRes = await del(regRes.json().id)

        expect(delRes.json()).not.toHaveProperty("password")
    })

    it("(AI) register response contains expected fields", async () => {
        const res = await register({ name: "andrew", password: "test1234" })
        const body = res.json().user

        expect(body).toHaveProperty("id")
        expect(body).toHaveProperty("name", "andrew")
        expect(body).toHaveProperty("createdAt")
    })

    it("(AI) Rejects a name that is too long", async () => {
        const res = await register({ name: "a".repeat(256), password: "test1234" })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects a password that is too short", async () => {
        const res = await register({ name: "andrew", password: "123" })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Trims or rejects a name with only whitespace", async () => {
        const res = await register({ name: "   ", password: "test1234" })

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
        await register({ name: "andrew", password: "test1234" })
        const res = await register({ name: "andrew", password: "test1234" })
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

    it("(AI) User can change their own password", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const res = await changePassword(regRes.json().user.id, "test1234", "newTest1234", regRes.json().accessToken)

        expect(res.statusCode).toBe(204)
    })

    it("(AI) Can login with new password after change", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        await changePassword(regRes.json().user.id, "test1234", "newTest1234", regRes.json().accessToken)

        const loginRes = await login({ name: "andrew1234", password: "newTest1234" })
        expect(loginRes.statusCode).toBe(200)
    })

    it("(AI) Cannot login with old password after change", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        await changePassword(regRes.json().user.id, "test1234", "newTest1234", regRes.json().accessToken)

        const loginRes = await login({ name: "andrew1234", password: "test1234" })
        expect(loginRes.statusCode).toBe(401)
    })

    it("(AI) Cannot change another user's password", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const regResTwo = await register({ name: "andrew2", password: "test1234" })

        const res = await changePassword(regRes.json().user.id, "test1234", "newTest1234", regResTwo.json().accessToken)
        expect(res.statusCode).toBe(401)
    })

    it("(AI) Admin can change another user's password", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const res = await changePassword(regRes.json().user.id, "test1234", "newTest1234")

        expect(res.statusCode).toBe(204)
    })

    it("(AI) Rejects new password that is too short", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const res = await changePassword(regRes.json().user.id, "test1234", "short", regRes.json().accessToken)

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects password change for non-existent user", async () => {
        const res = await changePassword(emptyUUID, "test1234", "newTest1234")

        expect(res.statusCode).toBe(404)
    })
})