import Fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { userRoutes } from './routes/users'

const server = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>()

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.register(swagger, {
    openapi: {
        info: {
            title: "Finance Tracker API",
            version: "1.0"
        }
    }
})

server.register(swaggerUi, {
    routePrefix: '/docs'
})

server.register(userRoutes, { prefix: '/api/v1' })

server.listen({ port: 3000 }, (error) => {
    if (error) {
        server.log.error(error)
        // maybe exit the app
    }
})