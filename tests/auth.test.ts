import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis/redis";
import { authFunctionsBuilder } from "./helpers/auth.helper";
import { adminAccessToken, generateAdminToken, server } from "./helpers/helper.js";
import { userFunctionsBuilder } from "./helpers/users.helper";

const { register, login, refresh, logout, promoteAdmin } = authFunctionsBuilder(server)
const { del } = userFunctionsBuilder(server)

describe("Authentification", () => {
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

    it("Promotes another user to admin", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const regResTwo = await register({ name: "andrew2", password: "test1234" })

        const delRes = await del(regResTwo.json().user.id, "", regRes.json().accessToken)
        expect(delRes.statusCode).toBe(403)

        const adminRes = await promoteAdmin(regRes.json().user.id, adminAccessToken)
        expect(adminRes.statusCode).toBe(200)

        const loginRes = await login({ name: "andrew1234", password: "test1234" })
        expect(loginRes.statusCode).toBe(200)

        const delResTwo = await del(regResTwo.json().user.id, "", loginRes.json().accessToken)
        expect(delResTwo.statusCode).toBe(204)
    })

    it("Promotes a user to admin without admin permissions", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const adminRes = await promoteAdmin(regRes.json().user.id, regRes.json().accessToken)

        expect(adminRes.statusCode).toBe(403)
    })
})

beforeAll(async () => {
    await server.ready()
    await generateAdminToken()
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

// ADDITIONAL AI GENERATED TESTS
// TESTS BELOW WERE NOT WRITTEN BY ME

describe("(AI) User routes", () => {
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
        const refreshRes = await refresh({ refreshToken: "a".repeat(64) })

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

    it("(AI) Promotes a non-existent user", async () => {
        const res = await promoteAdmin("00000000-0000-0000-0000-000000000000", adminAccessToken)

        expect(res.statusCode).toBe(404)
    })

    it("(AI) Rejects promotion with invalid UUID", async () => {
        const res = await promoteAdmin("not-a-uuid", adminAccessToken)

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Invalidates user sessions after promotion", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        const { refreshToken } = regRes.json()

        await promoteAdmin(regRes.json().user.id, adminAccessToken)

        const refreshRes = await refresh({ refreshToken })
        expect(refreshRes.statusCode).toBe(401)
    })

    it("(AI) Promoting an already-admin user still succeeds", async () => {
        const regRes = await register({ name: "andrew1234", password: "test1234" })
        await promoteAdmin(regRes.json().user.id, adminAccessToken)

        const secondPromote = await promoteAdmin(regRes.json().user.id, adminAccessToken)
        expect(secondPromote.statusCode).toBe(200)
    })
})
