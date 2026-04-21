import { afterAll, beforeAll } from "vitest"
import { server } from "./helpers/helper"

beforeAll(async () => {
    await server.close()
    await server.listen({ port: 3000 })

    const address = server.addresses()[0]
})

afterAll(async () => {
    server.close()
})