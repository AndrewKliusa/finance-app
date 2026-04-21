import { FastifyInstance } from "fastify"
import { TransactionCreateSchemaType } from "../../schemas/transaction.schema"
import { adminAccessToken } from "./helper"

export function transactionsFunctionsBuilder(server: FastifyInstance) {
    return {
        async create(data: TransactionCreateSchemaType, token?: string) {
            return await server.inject({
                method: 'POST',
                url: `/api/v1/transactions`,
                body: data,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async get(indentifier: string, path?: string, token?: string) {
            return await server.inject({
                method: 'GET',
                url: `/api/v1/transactions/${indentifier}` + (path ? `/${path}` : ""),
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async getAll(userId: string, token?: string) {
            return await server.inject({
                method: 'GET',
                url: `/api/v1/transactions/user/${userId}`,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async patch(identifier: string, payload: TransactionCreateSchemaType, path?: string, token?: string) {
            return await server.inject({
                method: 'PATCH',
                url: `/api/v1/transactions/${identifier}` + (path ? `/${path}` : ""),
                payload,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async del(identifier: string, path?: string, token?: string) {
            return await server.inject({
                method: 'DELETE',
                url: `/api/v1/transactions/${identifier}` + (path ? `/${path}` : ""),
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },
    }
}