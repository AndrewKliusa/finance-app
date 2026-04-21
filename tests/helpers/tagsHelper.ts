import { FastifyInstance } from "fastify"
import { TagCreateSchemaType } from "../../schemas/tag.schema"
import { adminAccessToken } from "./helper"

// Tags functions builder was created by AI, as it is so similar to categories and requires just manualy changing some names.
export function tagsFunctionsBuilder(server: FastifyInstance) {
    return {
        async create(data: TagCreateSchemaType, token?: string) {
            return await server.inject({
                method: 'POST',
                url: `/api/v1/tags`,
                body: data,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async get(indentifier: string, path?: string, token?: string) {
            return await server.inject({
                method: 'GET',
                url: `/api/v1/tags/${indentifier}` + (path ? `/${path}` : ""),
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async getAll(userId: string, token?: string) {
            return await server.inject({
                method: 'GET',
                url: `/api/v1/tags/user/${userId}`,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async patch(identifier: string, payload: TagCreateSchemaType, path?: string, token?: string) {
            return await server.inject({
                method: 'PATCH',
                url: `/api/v1/tags/${identifier}` + (path ? `/${path}` : ""),
                payload,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async del(identifier: string, path?: string, token?: string) {
            return await server.inject({
                method: 'DELETE',
                url: `/api/v1/tags/${identifier}` + (path ? `/${path}` : ""),
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },
    }
}