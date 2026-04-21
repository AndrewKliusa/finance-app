import { FastifyInstance } from "fastify"
import { CategoryCreateSchemaType } from "../../schemas/category.schema"
import { adminAccessToken } from "./helper"

export function categoriesFunctionsBuilder(server: FastifyInstance) {
    return {
        async create(data: CategoryCreateSchemaType, token?: string) {
            return await server.inject({
                method: 'POST',
                url: `/api/v1/categories`,
                body: data,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async get(indentifier: string, path?: string, token?: string) {
            return await server.inject({
                method: 'GET',
                url: `/api/v1/categories/${indentifier}` + (path ? `/${path}` : ""),
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async getAll(userId: string, token?: string) {
            return await server.inject({
                method: 'GET',
                url: `/api/v1/categories/user/${userId}`,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async patch(identifier: string, payload: CategoryCreateSchemaType, path?: string, token?: string) {
            return await server.inject({
                method: 'PATCH',
                url: `/api/v1/categories/${identifier}` + (path ? `/${path}` : ""),
                payload,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async del(identifier: string, path?: string, token?: string) {
            return await server.inject({
                method: 'DELETE',
                url: `/api/v1/categories/${identifier}` + (path ? `/${path}` : ""),
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },
    }
}