import type { FastifyInstance } from "fastify";
import type { InjectPayload } from "light-my-request";
import { prisma } from "../lib/prisma";
import { generateTokenPair } from "../services/auth.service";

export const emptyUUID = "00000000-0000-0000-0000-000000000000"

export async function getAdminToken() {
    const admin = await prisma.user.findUnique({
        where: { name: "admin" }
    })

    const { accessToken } = await generateTokenPair(admin!.id)
    return accessToken
}

export function testFunctionsBuilder
    <POST_TYPE extends InjectPayload, PATCH_TYPE extends InjectPayload, QUERY_TYPE = Record<string, unknown>>
    (server: FastifyInstance, url: string, getToken: () => string) {

    return {
        async get(indentifier: string, path?: string) {
            return await server.inject({
                method: 'GET',
                url: `${url}/${indentifier}` + (path ? `/${path}` : ""),
                headers: { authorization: `Bearer ${getToken()}` }
            })
        },

        async query(query: QUERY_TYPE) {
            return await server.inject({
                method: 'GET',
                url: `${url}`,
                query: query ?? {},
                headers: { authorization: `Bearer ${getToken()}` }
            })
        },

        async post(payload: POST_TYPE, path?: string) {
            return await server.inject({
                method: 'POST',
                url: url + (path ? `/${path}` : ""),
                payload,
                headers: { authorization: `Bearer ${getToken()}` }
            })
        },

        async patch(identifier: string, payload: PATCH_TYPE, path?: string, token?: string) {
            return await server.inject({
                method: 'PATCH',
                url: `${url}/${identifier}` + (path ? `/${path}` : ""),
                payload,
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${getToken()}` }
            })
        },

        async del(identifier: string, path?: string, token?: string) {
            return await server.inject({
                method: 'DELETE',
                url: `${url}/${identifier}` + (path ? `/${path}` : ""),
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${getToken()}` }
            })
        }
    }
}