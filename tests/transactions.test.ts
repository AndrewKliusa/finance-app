import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
    authFunctionsBuilder,
    categoriesFunctionsBuilder,
    tagsFunctionsBuilder,
    transactionsFunctionsBuilder,
    emptyUUID,
    generateAdminToken,
    server
} from "./helpers";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis/redis";

const { create, get, getAll, patch, del } = transactionsFunctionsBuilder(server);
const { create: createCategory, del: delCategory } = categoriesFunctionsBuilder(server);
const { create: createTag } = tagsFunctionsBuilder(server);
const { register } = authFunctionsBuilder(server);

// ALL TESTS FOR TRANSACTIONS WERE WRITTEN BY AI
describe("(AI) Transactions", () => {
    it("(AI) Creates a transaction with a category", async () => {
        const catRes = await createCategory({ name: "food", budget: 500, color: "#000000" })
        const createRes = await create({
            amount: 100,
            type: "INCOME",
            description: "salary",
            categoryId: catRes.json().id,
            tagsId: []
        })

        expect(createRes.statusCode).toBe(201)
        expect(createRes.json().amount).toBe(100)
        expect(createRes.json().type).toBe("INCOME")
        expect(createRes.json().description).toBe("salary")
    })

    it("(AI) Creates a transaction without a category", async () => {
        const createRes = await create({
            amount: 50,
            type: "OUTCOME",
            description: "misc",
            categoryId: null,
            tagsId: []
        })

        expect(createRes.statusCode).toBe(201)
        expect(createRes.json().category).toBeNull()
    })

    it("(AI) Creates a transaction with tags", async () => {
        const tagRes = await createTag({ name: "weekly" })
        const tagResTwo = await createTag({ name: "recurring" })
        const createRes = await create({
            amount: 200,
            type: "INCOME",
            description: "payment",
            categoryId: null,
            tagsId: [tagRes.json().id, tagResTwo.json().id]
        })

        expect(createRes.statusCode).toBe(201)
        expect(createRes.json().tags).length(2)
    })

    it("(AI) Creates a transaction with null description", async () => {
        const createRes = await create({
            amount: 100,
            type: "INCOME",
            description: null,
            categoryId: null,
            tagsId: []
        })

        expect(createRes.statusCode).toBe(201)
        expect(createRes.json().description).toBeNull()
    })

    it("(AI) Creates an OUTCOME transaction", async () => {
        const createRes = await create({
            amount: 75,
            type: "OUTCOME",
            description: "groceries",
            categoryId: null,
            tagsId: []
        })

        expect(createRes.statusCode).toBe(201)
        expect(createRes.json().type).toBe("OUTCOME")
    })

    it("(AI) Gets a transaction", async () => {
        const createRes = await create({
            amount: 100,
            type: "INCOME",
            description: "test",
            categoryId: null,
            tagsId: []
        })
        const getRes = await get(createRes.json().id)

        expect(getRes.statusCode).toBe(200)
        expect(getRes.json().amount).toBe(100)
    })

    it("(AI) Gets a transaction with a wrong id", async () => {
        const getRes = await get(emptyUUID)

        expect(getRes.statusCode).toBe(404)
    })

    it("(AI) Gets a transaction of another user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const createRes = await create({ amount: 100, type: "INCOME", description: "test", categoryId: null, tagsId: [] })
        const getRes = await get(createRes.json().id, "", regRes.json().user.id)

        expect(getRes.statusCode).toBe(401)
    })

    it("(AI) Gets all transactions of a user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        await create({ amount: 100, type: "INCOME", description: "one", categoryId: null, tagsId: [] }, regRes.json().accessToken)
        await create({ amount: 200, type: "OUTCOME", description: "two", categoryId: null, tagsId: [] }, regRes.json().accessToken)
        const getRes = await getAll(regRes.json().user.id)

        expect(getRes.statusCode).toBe(200)
        expect(getRes.json()).length(2)
    })

    it("(AI) Gets all transactions of a user with no transactions", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const getRes = await getAll(regRes.json().user.id)

        expect(getRes.statusCode).toBe(204)
    })

    it("(AI) Edits a transaction", async () => {
        const createRes = await create({ amount: 100, type: "INCOME", description: "test", categoryId: null, tagsId: [] })
        const patchRes = await patch(createRes.json().id, { amount: 200, type: "OUTCOME", description: "edited", categoryId: null, tagsId: [] })

        expect(patchRes.statusCode).toBe(200)
    })

    it("(AI) Edits a transaction of another user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const regResTwo = await register({ name: "andrew12345", password: "password" })
        const createRes = await create({ amount: 100, type: "INCOME", description: "test", categoryId: null, tagsId: [] }, regRes.json().accessToken)
        const editRes = await patch(createRes.json().id, { amount: 200, type: "OUTCOME", description: "hacked", categoryId: null, tagsId: [] }, "", regResTwo.json().accessToken)

        expect(editRes.statusCode).toBe(403)
    })

    it("(AI) Edits a non-existent transaction", async () => {
        const editRes = await patch(emptyUUID, { amount: 200, type: "OUTCOME", description: "edited", categoryId: null, tagsId: [] })

        expect(editRes.statusCode).toBe(404)
    })

    it("(AI) Deletes a transaction", async () => {
        const createRes = await create({ amount: 100, type: "INCOME", description: "test", categoryId: null, tagsId: [] })
        const delRes = await del(createRes.json().id)
        const getRes = await get(createRes.json().id)

        expect(delRes.statusCode).toBe(204)
        expect(getRes.statusCode).toBe(404)
    })

    it("(AI) Deletes a transaction of another user", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const regResTwo = await register({ name: "andrew12345", password: "password" })
        const createRes = await create({ amount: 100, type: "INCOME", description: "test", categoryId: null, tagsId: [] }, regRes.json().accessToken)
        const delRes = await del(createRes.json().id, "", regResTwo.json().accessToken)
        const getRes = await get(createRes.json().id, "", regRes.json().accessToken)

        expect(delRes.statusCode).toBe(403)
        expect(getRes.statusCode).toBe(200)
    })

    it("(AI) Deletes a non-existent transaction", async () => {
        const delRes = await del(emptyUUID)

        expect(delRes.statusCode).toBe(404)
    })

    it("(AI) Rejects zero amount", async () => {
        const res = await create({ amount: 0, type: "INCOME", description: "test", categoryId: null, tagsId: [] })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects negative amount", async () => {
        const res = await create({ amount: -100, type: "INCOME", description: "test", categoryId: null, tagsId: [] })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects non-integer amount", async () => {
        const res = await create({ amount: 10.5, type: "INCOME", description: "test", categoryId: null, tagsId: [] })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects invalid transaction type", async () => {
        const res = await create({ amount: 100, type: "INVALID" as any, description: "test", categoryId: null, tagsId: [] })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects description that is too long", async () => {
        const res = await create({ amount: 100, type: "INCOME", description: "a".repeat(256), categoryId: null, tagsId: [] })

        expect(res.statusCode).toBe(400)
    })

    it("(AI) Rejects missing required fields", async () => {
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

    it("(AI) Create response contains expected fields", async () => {
        const res = await create({ amount: 100, type: "INCOME", description: "test", categoryId: null, tagsId: [] })
        const body = res.json()

        expect(body).toHaveProperty("id")
        expect(body).toHaveProperty("amount", 100)
        expect(body).toHaveProperty("type", "INCOME")
        expect(body).toHaveProperty("description", "test")
        expect(body).toHaveProperty("category")
        expect(body).toHaveProperty("tags")
    })

    it("(AI) Create response includes nested category data", async () => {
        const catRes = await createCategory({ name: "food", budget: 500, color: "#000000" })
        const createRes = await create({ amount: 100, type: "INCOME", description: "test", categoryId: catRes.json().id, tagsId: [] })

        expect(createRes.json().category).not.toBeNull()
        expect(createRes.json().category.name).toBe("food")
    })

    it("(AI) Create response includes nested tags data", async () => {
        const tagRes = await createTag({ name: "monthly" })
        const createRes = await create({ amount: 100, type: "INCOME", description: "test", categoryId: null, tagsId: [tagRes.json().id] })

        expect(createRes.json().tags).length(1)
        expect(createRes.json().tags[0].name).toBe("monthly")
    })

    it("(AI) Rejects create without a valid auth token", async () => {
        const res = await create({ amount: 100, type: "INCOME", description: "test", categoryId: null, tagsId: [] }, "invalid-token")

        expect(res.statusCode).toBe(401)
    })

    it("(AI) Admin can get another user's transaction", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const createRes = await create({ amount: 100, type: "INCOME", description: "test", categoryId: null, tagsId: [] }, regRes.json().accessToken)
        const getRes = await get(createRes.json().id)

        expect(getRes.statusCode).toBe(200)
    })

    it("(AI) Admin can delete another user's transaction", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const createRes = await create({ amount: 100, type: "INCOME", description: "test", categoryId: null, tagsId: [] }, regRes.json().accessToken)
        const delRes = await del(createRes.json().id)

        expect(delRes.statusCode).toBe(204)
    })

    it("(AI) Does not return deleted transactions in getAll", async () => {
        const regRes = await register({ name: "andrew1234", password: "password" })
        const createRes = await create({ amount: 100, type: "INCOME", description: "one", categoryId: null, tagsId: [] }, regRes.json().accessToken)
        await create({ amount: 200, type: "OUTCOME", description: "two", categoryId: null, tagsId: [] }, regRes.json().accessToken)
        await del(createRes.json().id)
        const getRes = await getAll(regRes.json().user.id)

        expect(getRes.json()).length(1)
        expect(getRes.json()[0].description).toBe("two")
    })

    it("(AI) Deleting a category cascades to its transactions", async () => {
        const catRes = await createCategory({ name: "temp", budget: 100, color: "#000000" })
        await create({ amount: 50, type: "INCOME", description: "test", categoryId: catRes.json().id, tagsId: [] })
        await delCategory(catRes.json().id)

        const count = await prisma.transaction.count()
        expect(count).toBe(0)
    })
})

beforeAll(async () => {
    await server.ready()
    await generateAdminToken()
})

afterAll(async () => {
    await server.close()
    await prisma.transaction.deleteMany()
})

beforeEach(async () => {
    await prisma.transaction.deleteMany()
    await prisma.category.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.user.deleteMany({
        where: { name: { not: 'admin' } }
    })
    await redis.flushdb()
})
