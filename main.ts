import 'dotenv/config'
import { buildServer } from './server'
import { enviromentSchema } from './schemas/env.schema'

console.log("main.ts starting, NODE_ENV =", process.env.NODE_ENV, "PORT =", process.env.PORT)
const env = enviromentSchema.parse(process.env)

const server = buildServer()
server.listen({ port: env.PORT, host: env.HOST }, (error, address) => {
    if (error) {
        server.log.error(error)
        process.exit(1)
    }
    server.log.info(`Server listening at ${address}`)
})

async function shutdown() {
    console.log("Shutting down...")
    await server.close()
    process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)