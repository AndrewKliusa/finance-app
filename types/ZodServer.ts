import Fastify from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

const _server = Fastify().withTypeProvider<ZodTypeProvider>()
export type ZodServer = typeof _server