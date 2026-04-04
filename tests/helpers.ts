import type { FastifyInstance } from "fastify";
import type { InjectPayload } from "light-my-request";
import { prisma } from "../lib/prisma";
import { generateTokenPair } from "../services/auth.service";
import { GetUsersQueryType, UserCreateType, UserEditType } from "../schemas/user.schema";
import { RefreshTokenType } from "../schemas/auth.schema";

export const emptyUUID = "00000000-0000-0000-0000-000000000000"
export let adminAccessToken: string;

export async function generateAdminToken() {
    const admin = await prisma.user.findFirst({
        where: { name: "admin" }
    })

    const { accessToken } = await generateTokenPair(admin!.id)
    adminAccessToken = accessToken
}

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
        }
    }
}

export function authFunctionsBuilder(server: FastifyInstance) {
    return {
       async register(payload: UserCreateType) {
            return server.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload
            })
        },

        async login(payload: UserCreateType) {
            return server.inject({
                method: 'POST',
                url: '/api/v1/auth/login',
                payload
            })
        },

        async refresh(payload: RefreshTokenType) {
            return server.inject({
                method: 'POST',
                url: '/api/v1/auth/refresh',
                payload
            })
        },

        async logout(payload: RefreshTokenType) {
            return server.inject({
                method: 'POST',
                url: '/api/v1/auth/logout',
                payload
            })
        },

        async promoteAdmin(userId: string, adminAccessToken: string) {
            return server.inject({
                method: 'POST',
                url: '/api/v1/auth/promoteAdmin/' + userId,
                headers: { authorization: `Bearer ${adminAccessToken}` }
            })
        }
    }
}