import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildServer } from '../server'

const URL = "/api/v1/users"

const server = buildServer()

beforeAll(async () => {
    await server.ready()
})

afterAll(async () => {
    await server.close()
})

describe("User routes", () => {
    let userId: string;

    it("Creates a user", async () => {
        const res = await server.inject({
            method: "post",
            url: "/api/v1/users",
            payload: { name: "andrew", password: "test1234" }
        })

        expect(res.statusCode).toBe(201)
        expect(res.json().username).toBe("andrew")
        userId = res.json().id
    })

    it("Gets all users", async () => {
        const res = await get()
        console.log(res.json())
    })
})

async function get(userId?: string) {
    return await server.inject({
        method: 'GET',
        url: URL
    })
}