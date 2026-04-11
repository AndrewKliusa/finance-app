import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { authFunctionsBuilder, categoriesFunctionsBuilder, emptyUUID, generateAdminToken, server } from "./helpers";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis/redis";

const { create, get, getAll, patch, del } = categoriesFunctionsBuilder(server);
const { register} = authFunctionsBuilder(server)

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