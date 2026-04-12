import type { FastifyInstance } from "fastify";
import type { InjectPayload } from "light-my-request";
import { prisma } from "../lib/prisma";
import { generateTokenPair } from "../services/auth.service";
import { GetUsersQueryType, NameAndPasswordType, PasswordChangeType, UserEditType } from "../schemas/user.schema";
import { RefreshTokenType } from "../schemas/auth.schema";
import { CategoryCreateSchemaType } from "../schemas/category.schema";
import { TagCreateSchemaType } from "../schemas/tag.schema";
import { TransactionCreateSchemaType } from "../schemas/transaction.schema";
import { buildServer } from "../server";

export const emptyUUID = "00000000-0000-0000-0000-000000000000"
export let adminAccessToken: string;

export const server = buildServer()

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

export function authFunctionsBuilder(server: FastifyInstance) {
    return {
       async register(payload: NameAndPasswordType) {
            return server.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload
            })
        },

        async login(payload: NameAndPasswordType) {
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
                url: '/api/v1/auth/promote-admin/' + userId,
                headers: { authorization: `Bearer ${adminAccessToken}` }
            })
        }
    }
}

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