import Fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { userRoutes } from './routes/users.route'
import { errorHandler } from './handlers/errorHandler'
import { authRoutes } from './routes/auth.route'
import { categoryRoutes } from './routes/category.route'
import { seed } from './prisma/seed'
import rateLimit from '@fastify/rate-limit'
import { prisma } from './lib/prisma'
import { redis } from './lib/redis/redis'
import { tagRoutes } from './routes/tags.route'
import { transactionRoutes } from './routes/transations.route'
import { notificationsRoutes } from './routes/notifications.route'
import cors from '@fastify/cors'
import { reportRoutes } from './routes/reports.route'

export function buildServer() {
    const server = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>()

    server.setValidatorCompiler(validatorCompiler)
    server.setSerializerCompiler(serializerCompiler)
    server.setErrorHandler(errorHandler);

    server.register(cors, {
        origin: "*"
    })

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
    server.register(categoryRoutes, { prefix: '/api/v1' })
    server.register(tagRoutes, { prefix: '/api/v1' })
    server.register(transactionRoutes, { prefix: '/api/v1' })
    server.register(notificationsRoutes, { prefix: '/api/v1' })
    server.register(reportRoutes, { prefix: '/api/v1' })

    server.register(rateLimit, {
        global: true,
        max: 100,
        timeWindow: '1 minute'
    })
    server.register(async () => { await seed() })

    server.addHook('onClose', async () => {
        await prisma.$disconnect()
        await redis.quit()
    })

    return server
}