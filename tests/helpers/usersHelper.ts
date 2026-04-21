import { FastifyInstance } from "fastify"
import { GetUsersQueryType, UserEditType, PasswordChangeType } from "../../schemas/user.schema"
import { adminAccessToken } from "./helper"

export function userFunctionsBuilder(server: FastifyInstance) {
    return {
        async get(indentifier: string, path?: string, token?: string) {
            return await server.inject({
                method: 'GET',
                url: `/api/v1/users/${indentifier}` + (path ? `/${path}` : ""),
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async query(query: GetUsersQueryType) {
            return await server.inject({
                method: 'GET',
                url: "/api/v1/users",
                query: {
                    page: String(query.page),
                    limit: String(query.limit)
                },
                headers: { authorization: `Bearer ${adminAccessToken}` }
            })
        },

        async patch(identifier: string, payload: UserEditType, path?: string, token?: string) {
            return await server.inject({
                method: 'PATCH',
                url: `/api/v1/users/${identifier}` + (path ? `/${path}` : ""),
                payload,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async del(identifier: string, path?: string, token?: string) {
            return await server.inject({
                method: 'DELETE',
                url: `/api/v1/users/${identifier}` + (path ? `/${path}` : ""),
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        },

        async changePassword(identifier: string, oldPassword: string, newPassword: string, token?: string) {
            return await server.inject({
                method: 'PATCH',
                body: { oldPassword, newPassword } as PasswordChangeType,
                url: `/api/v1/users/${identifier}/password`,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        }
    }
}