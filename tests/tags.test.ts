import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis/redis";
import { authFunctionsBuilder } from "./helpers/auth.helper";
import { emptyUUID, generateAdminToken, server } from "./helpers/helper.js";
import { tagsFunctionsBuilder } from "./helpers/tags.helper";

const { create, get, getAll, patch, del } = tagsFunctionsBuilder(server);
const { register } = authFunctionsBuilder(server)

// ALL TESTS FOR TAGS WERE TRANSITIONED FROM CATEGORIES TESTS TO TAGS BY AI
// Tests for categories are almost identical to tags.
describe("(AI) Tags", () => {
    it("(AI) Creates a tag", async () => {
        const createRes = await create({ name: "test1234" })

        expect(createRes.statusCode).toBe(201)
        expect(createRes.json().name).toBe("test1234")
    })

    it("(AI) Creates a tag with the same name", async () => {
        await create({ name: "test1234" })
        const createResTwo = await create({ name: "test1234" })

        expect(createResTwo.statusCode).toBe(409)
    })

    it("(AI) Gets a tag", async () => {
        const createRes = await create({ name: "test1234" })
        const getRes = await get(createRes.json().id)

        expect(getRes.statusCode).toBe(200)
        expect(createRes.json()).toEqual(createRes.json())
    })

    it("(AI) Gets a tag with a wrong id", async () => {
        const getRes = await get(emptyUUID)

        expect(getRes.statusCode).toBe(404)
    })

    it("(AI) Gets a tag of another user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const createRes = await create({ name: "test1234" })
        const getRes = await get(createRes.json().id, "", regRes.json().user.id)

        expect(getRes.statusCode).toBe(401)
    })

    it("(AI) Gets all tags of a user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        await create({ name: "test1234" }, regRes.json().accessToken)
        await create({ name: "test12345" }, regRes.json().accessToken)
        const getRes = await getAll(regRes.json().user.id)

        expect(getRes.statusCode).toBe(200)
        expect(getRes.json()).length(2)
        expect(getRes.json()[0].name).toBe("test1234")
        expect(getRes.json()[1].name).toBe("test12345")
    })

    it("(AI) Gets all tags of a user with no tags", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const getRes = await getAll(regRes.json().user.id)

        expect(getRes.statusCode).toBe(200)
        expect(getRes.json()).length(0)
    })

    it("(AI) Edits a tag", async () => {
        const createRes = await create({ name: "test1234" })
        await patch(createRes.json().id, { name: "test12345" })
        const getRes = await get(createRes.json().id)

        expect(getRes.statusCode).toBe(200)
        expect(getRes.json().name).toBe("test12345")
    })

    it("(AI) Edits a tag of another user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const regResTwo = await register({ name: "andrew12345", password: "password" })
        const createRes = await create({ name: "test1234" }, regRes.json().accessToken)
        const editRes = await patch(createRes.json().id, { name: "test12345" }, "", regResTwo.json().accessToken)
        const getRes = await get(createRes.json().id, "", regRes.json().accessToken)

        expect(editRes.statusCode).toBe(403)
        expect(getRes.json().name).toBe("test1234")
    })

    it("(AI) Edits a non-existent tag", async () => {
        const editRes = await patch(emptyUUID, { name: "test12345" })

        expect(editRes.statusCode).toBe(404)
    })

    it("(AI) Deletes a tag", async () => {
        const createRes = await create({ name: "test1234" })
        const delRes = await del(createRes.json().id)
        const getRes = await get(createRes.json().id)

        expect(delRes.statusCode).toBe(204)
        expect(getRes.statusCode).toBe(404)
    })

    it("(AI) Deletes a tag of another user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const regResTwo = await register({ name: "andrew12345", password: "password" })
        const createRes = await create({ name: "test1234" }, regRes.json().accessToken)
        const delRes = await del(createRes.json().id, "", regResTwo.json().accessToken)
        const getRes = await get(createRes.json().id, "", regRes.json().accessToken)

        expect(delRes.statusCode).toBe(403)
        expect(getRes.statusCode).toBe(200)
    })

    it("(AI) Deletes a non-existent tag", async () => {
        const delRes = await del(emptyUUID)

        expect(delRes.statusCode).toBe(404)
    })

    it("(AI) Rejects a tag name that is too long", async () => {
        const res = await create({ name: "a".repeat(65) })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects a missing name", async () => {
        const res = await create({} as any)

        expect(res.statusCode).toBe(400)
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
        const res = await create({ name: "test1234" })

        expect(res.json()).not.toHaveProperty("userId")
    })

    it("(AI) Create response contains expected fields", async () => {
        const res = await create({ name: "test1234" })
        const body = res.json()

        expect(body).toHaveProperty("id")
        expect(body).toHaveProperty("name", "test1234")
    })

    it("(AI) Rejects create without a valid auth token", async () => {
        const res = await create({ name: "test1234" }, "invalid-token")

        expect(res.statusCode).toBe(401)
    })

    it("(AI) Admin can get another user's tag", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const createRes = await create({ name: "test1234" }, regRes.json().accessToken)
        const getRes = await get(createRes.json().id)

        expect(getRes.statusCode).toBe(200)
    })

    it("(AI) Admin can delete another user's tag", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const createRes = await create({ name: "test1234" }, regRes.json().accessToken)
        const delRes = await del(createRes.json().id)

        expect(delRes.statusCode).toBe(204)
    })

    it("(AI) Patch rejects an invalid body", async () => {
        const createRes = await create({ name: "test1234" })
        const patchRes = await patch(createRes.json().id, { name: "a".repeat(65) })

        expect(patchRes.statusCode).toBe(400)
    })

    it("(AI) Caches a tag after creation", async () => {
        const createRes = await create({ name: "test1234" })
        const cached = await redis.hgetall(`tag:${createRes.json().id}`)

        expect(cached).toHaveProperty("name", "test1234")
    })

    it("(AI) Removes a tag from cache after deletion", async () => {
        const createRes = await create({ name: "test1234" })
        await del(createRes.json().id)
        const cached = await redis.hgetall(`tag:${createRes.json().id}`)

        expect(Object.keys(cached)).length(0)
    })

    it("(AI) Reflects a patch in subsequent get", async () => {
        const createRes = await create({ name: "test1234" })
        await patch(createRes.json().id, { name: "renamed" })
        const getRes = await get(createRes.json().id)

        expect(getRes.json().name).toBe("renamed")
    })

    it("(AI) Does not return deleted tags in getAll", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const createRes = await create({ name: "test1234" }, regRes.json().accessToken)
        await create({ name: "test12345" }, regRes.json().accessToken)
        await del(createRes.json().id)
        const getRes = await getAll(regRes.json().user.id)

        expect(getRes.json()).length(1)
        expect(getRes.json()[0].name).toBe("test12345")
    })

    it("(AI) Different users can create tags with the same name", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const regResTwo = await register({ name: "andrew12345", password: "password" })
        const createRes = await create({ name: "shared" }, regRes.json().accessToken)
        const createResTwo = await create({ name: "shared" }, regResTwo.json().accessToken)

        expect(createRes.statusCode).toBe(201)
        expect(createResTwo.statusCode).toBe(201)
    })
})

beforeAll(async () => {
    await server.ready()
    await generateAdminToken()
})

afterAll(async () => {
    await server.close()
    await prisma.tag.deleteMany()
})

beforeEach(async () => {
    await prisma.tag.deleteMany()
    await prisma.user.deleteMany({
        where: { name: { not: 'admin' } }
    })
    await redis.flushdb()
})
