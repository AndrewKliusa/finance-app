import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis/redis";
import { authFunctionsBuilder } from "./helpers/authHelper";
import { categoriesFunctionsBuilder } from "./helpers/categoriesHelper";
import { emptyUUID, generateAdminToken, server } from "./helpers/helper.js";

const { create, get, getAll, patch, del } = categoriesFunctionsBuilder(server);
const { register } = authFunctionsBuilder(server)

describe("Categories", () => {
    it("Creates a category", async () => {
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000"})

        expect(createRes.statusCode).toBe(201)
        expect(createRes.json().name).toBe("test1234")
    })

    it("Craetes a category with the same name", async () => {
        await create({ name: "test1234", budget: 100, color: "#000000"})
        const createResTwo = await create({ name: "test1234", budget: 100, color: "#000000"})
        
        expect(createResTwo.statusCode).toBe(409)
    })

    it("Gets a category", async () => {
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000"})
        const getRes = await get(createRes.json().id)   

        expect(getRes.statusCode).toBe(200)
        expect(createRes.json()).toEqual(createRes.json())
    })

    it("Gets a category with a wrong id", async () => {
        const getRes = await get(emptyUUID)

        expect(getRes.statusCode).toBe(404)
    })

    it("Gets a category of another user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password"})
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000"})
        const getRes = await get(createRes.json().id, "", regRes.json().user.id)

        expect(getRes.statusCode).toBe(401)
    })

    it("Gets all categories of a user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password"})
        await create({ name: "test1234", budget: 100, color: "#000000"}, regRes.json().accessToken)
        await create({ name: "test12345", budget: 100, color: "#000000"}, regRes.json().accessToken)
        const getRes = await getAll(regRes.json().user.id)

        expect(getRes.statusCode).toBe(200)
        expect(getRes.json()).length(2)
        expect(getRes.json()[0].name).toBe("test1234")
        expect(getRes.json()[1].name).toBe("test12345")
    })

    it("Gets all categories of a user with no categories", async () => {
        const regRes = await register({ name: "andrew1234", password: "password"})
        const getRes = await getAll(regRes.json().user.id)

        expect(getRes.statusCode).toBe(200)
        expect(getRes.json()).length(0)
    })

    it("Edits a category", async () => {
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000" })
        await patch(createRes.json().id, { name: "test12345", budget: 200, color: "#100000" })
        const getRes = await get(createRes.json().id)

        expect(getRes.statusCode).toBe(200)
        expect(getRes.json().name).toBe("test12345")
        expect(getRes.json().budget).toBe(200)
        expect(getRes.json().color).toBe("#100000")
    })

    it("Edits a category of another user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password"})
        const regResTwo = await register({ name: "andrew12345", password: "password"})
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000"}, regRes.json().accessToken)
        const editRes = await patch(createRes.json().id, { name: "test12345", budget: 200, color: "#100000" }, "", regResTwo.json().accessToken)
        const getRes = await get(createRes.json().id, "", regRes.json().accessToken)

        expect(editRes.statusCode).toBe(403)
        expect(getRes.json().name).toBe("test1234")
        expect(getRes.json().budget).toBe(100)
        expect(getRes.json().color).toBe("#000000")
    })

    it("Edits a non-existent category", async () => {
        const editRes = await patch(emptyUUID, { name: "test12345", budget: 200, color: "#100000" })

        expect(editRes.statusCode).toBe(404)
    })

    it("Deletes a category", async () => {
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000"})
        const delRes = await del(createRes.json().id)
        const getRes = await get(createRes.json().id)

        expect(delRes.statusCode).toBe(204)
        expect(getRes.statusCode).toBe(404)
    })

    it("Deletes a category of another user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password"})
        const regResTwo = await register({ name: "andrew12345", password: "password"})
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000"}, regRes.json().accessToken)
        const delRes = await del(createRes.json().id, "", regResTwo.json().accessToken)
        const getRes = await get(createRes.json().id, "", regRes.json().accessToken)

        expect(delRes.statusCode).toBe(403)
        expect(getRes.statusCode).toBe(200)
    })

    it("Deletes a non-existent category", async () => {
        const delRes = await del(emptyUUID)

        expect(delRes.statusCode).toBe(404)
    })
})

beforeAll(async () => {
    await server.ready()
    await generateAdminToken()
})

afterAll(async () => {
    await server.close()
    await prisma.category.deleteMany()
})

beforeEach(async () => {
    await prisma.category.deleteMany()
    await prisma.user.deleteMany({
        where: { name: { not: 'admin' } }
    })
    await redis.flushdb()
})

// ADDITIONAL AI GENERATED TESTS
// TESTS BELOW WERE NOT WRITTEN BY ME

describe("(AI) Category routes", () => {
    it("(AI) Rejects a category name that is too long", async () => {
        const res = await create({ name: "a".repeat(33), budget: 100, color: "#000000" })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects an invalid hex color", async () => {
        const res = await create({ name: "test1234", budget: 100, color: "not-a-color" })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects a zero budget", async () => {
        const res = await create({ name: "test1234", budget: 0, color: "#000000" })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects a negative budget", async () => {
        const res = await create({ name: "test1234", budget: -50, color: "#000000" })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects a non-integer budget", async () => {
        const res = await create({ name: "test1234", budget: 10.5, color: "#000000" })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects a missing name", async () => {
        const res = await create({ budget: 100, color: "#000000" } as any)

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Accepts a three-character hex color", async () => {
        const res = await create({ name: "test1234", budget: 100, color: "#fff" })

        expect(res.statusCode).toBe(201)
    })

    it("(AI) Returns 400 on invalid UUID in get", async () => {
        const res = await get("not-a-uuid")

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Returns a structured error body on 404", async () => {
        const res = await get(emptyUUID)
        const body = res.json()

        expect(res.statusCode).toBe(404)
        expect(body).toHaveProperty("message")
    })

    it("(AI) Create response does not expose userId", async () => {
        const res = await create({ name: "test1234", budget: 100, color: "#000000" })

        expect(res.json()).not.toHaveProperty("userId")
    })

    it("(AI) Create response contains expected fields", async () => {
        const res = await create({ name: "test1234", budget: 100, color: "#000000" })
        const body = res.json()

        expect(body).toHaveProperty("id")
        expect(body).toHaveProperty("name", "test1234")
        expect(body).toHaveProperty("color", "#000000")
        expect(body).toHaveProperty("budget", 100)
    })

    it("(AI) Rejects create without an auth token", async () => {
        const res = await create({ name: "test1234", budget: 100, color: "#000000" }, "invalid-token")

        expect(res.statusCode).toBe(401)
    })

    it("(AI) Admin can get another user's category", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000" }, regRes.json().accessToken)
        const getRes = await get(createRes.json().id)

        expect(getRes.statusCode).toBe(200)
    })

    it("(AI) Admin can delete another user's category", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000" }, regRes.json().accessToken)
        const delRes = await del(createRes.json().id)

        expect(delRes.statusCode).toBe(204)
    })

    it("(AI) Patch rejects an invalid body", async () => {
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000" })
        const patchRes = await patch(createRes.json().id, { name: "updated", budget: -5, color: "#ffffff" })

        expect(patchRes.statusCode).toBe(400)
    })

    it("(AI) Patch returns 404 for a non-existent category", async () => {
        const patchRes = await patch(emptyUUID, { name: "updated", budget: 200, color: "#ffffff" })

        expect(patchRes.statusCode).toBe(404)
    })

    it("(AI) Patch of another user's category is rejected", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const regResTwo = await register({ name: "andrew12345", password: "password" })
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000" }, regRes.json().accessToken)
        const patchRes = await patch(createRes.json().id, { name: "hacked", budget: 999, color: "#ffffff" }, "", regResTwo.json().accessToken)

        expect(patchRes.statusCode).toBe(403)
    })

    it("(AI) Caches a category after creation", async () => {
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000" })
        const cached = await redis.hgetall(`category:${createRes.json().id}`)

        expect(cached).toHaveProperty("name", "test1234")
    })

    it("(AI) Removes a category from cache after deletion", async () => {
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000" })
        await del(createRes.json().id)
        const cached = await redis.hgetall(`category:${createRes.json().id}`)

        expect(Object.keys(cached)).length(0)
    })

    it("(AI) Reflects a patch in subsequent get", async () => {
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000" })
        await patch(createRes.json().id, { name: "renamed", budget: 500, color: "#abcdef" })
        const getRes = await get(createRes.json().id)

        expect(getRes.json().name).toBe("renamed")
        expect(getRes.json().budget).toBe(500)
        expect(getRes.json().color).toBe("#abcdef")
    })

    it("(AI) Returns an empty array for a user with no categories", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const getRes = await getAll(regRes.json().user.id)

        expect(getRes.statusCode).toBe(200)
        expect(getRes.json()).length(0)
    })

    it("(AI) Does not return deleted categories in getAll", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const createRes = await create({ name: "test1234", budget: 100, color: "#000000" }, regRes.json().accessToken)
        await create({ name: "test12345", budget: 100, color: "#000000" }, regRes.json().accessToken)
        await del(createRes.json().id)
        const getRes = await getAll(regRes.json().user.id)

        expect(getRes.json()).length(1)
        expect(getRes.json()[0].name).toBe("test12345")
    })
})