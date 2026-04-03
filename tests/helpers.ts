import type { FastifyInstance } from "fastify";
import type { InjectPayload } from "light-my-request";
import { prisma } from "../lib/prisma";
import { generateTokenPair } from "../services/auth.service";

export const emptyUUID = "00000000-0000-0000-0000-000000000000"
export let adminAccessToken: string;

export async function generateAdminToken() {
    const admin = await prisma.user.findFirst({
        where: { name: "admin" }
    })

    const { accessToken } = await generateTokenPair(admin!.id)
    adminAccessToken = accessToken
}

export function userFunctionsBuilder
    <POST_TYPE extends InjectPayload, PATCH_TYPE extends InjectPayload, QUERY_TYPE = Record<string, unknown>>
    (server: FastifyInstance, getToken: () => string) {

    return {
        async get(indentifier: string, path?: string) {
            return await server.inject({
                method: 'GET',
                url: `/api/v1/users/${indentifier}` + (path ? `/${path}` : ""),
                headers: { authorization: `Bearer ${getToken()}` }
            })
        },

        async query(query: QUERY_TYPE) {
            return await server.inject({
                method: 'GET',
                url: "/api/v1/users",
                query: query ?? {},
                headers: { authorization: `Bearer ${getToken()}` }
            })
        },

        async post(payload: POST_TYPE, path?: string) {
            return await server.inject({
                method: 'POST',
                url: "/api/v1/users" + (path ? `/${path}` : ""),
                payload,
                headers: { authorization: `Bearer ${getToken()}` }
            })
        },

        async patch(identifier: string, payload: PATCH_TYPE, path?: string, token?: string) {
            return await server.inject({
                method: 'PATCH',
                url: `/api/v1/users/${identifier}` + (path ? `/${path}` : ""),
                payload,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${getToken()}` }
            })
        },

        async del(identifier: string, path?: string, token?: string) {
            return await server.inject({
                method: 'DELETE',
                url: `/api/v1/users/${identifier}` + (path ? `/${path}` : ""),
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${getToken()}` }
            })
        }
    }
}