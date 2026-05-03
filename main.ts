import 'dotenv/config'
import { buildServer } from './server'
import { enviromentSchema } from './schemas/env.schema'
import { FastifyInstance } from 'fastify'

enviromentSchema.parse(process.env)

const server = buildServer()
server.listen({ port: 3000 }, (error) => {
    if (error) {
        server.log.error(error)
    }
})

async function shutdown() {
    console.log("Shutting down...")
    await server.close()
    process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)