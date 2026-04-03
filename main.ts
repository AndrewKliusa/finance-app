import 'dotenv/config'
import { buildServer } from './server'
import { enviromentSchema } from './schemas/env.schema'

enviromentSchema.parse(process.env)

const server =  buildServer()
server.listen({ port: 3000 }, (error) => {
    if (error) {
        server.log.error(error)
    }
})