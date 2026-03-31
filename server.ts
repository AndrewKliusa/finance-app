import Fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { userRoutes } from './routes/users.route'
import { errorHandler } from './plugins/errorHandler'
import { authRoutes } from './routes/auth.route'

export function buildServer() {
    const server = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>()

    server.setValidatorCompiler(validatorCompiler)
    server.setSerializerCompiler(serializerCompiler)
    server.setErrorHandler(errorHandler);

    server.register(swagger, {
        openapi: {
            info: {
                title: "Finance Tracker API",
                version: "1.0"
            }
        }
    })

    server.register(swaggerUi, {
        routePrefix: '/api/v1/docs'
    })

    server.register(userRoutes, { prefix: '/api/v1' })
    server.register(authRoutes, { prefix: '/api/v1' })
    return server
}