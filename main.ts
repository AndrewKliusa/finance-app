import 'dotenv/config'
import { buildServer } from './server'

const server =  buildServer()

server.listen({ port: 3000 }, (error) => {
    if (error) {
        server.log.error(error)
    }
})