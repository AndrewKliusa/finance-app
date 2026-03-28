import type { FastifyInstance } from "fastify";
import type { InjectPayload } from "light-my-request";

export const emptyUUID = "00000000-0000-0000-0000-000000000000"

export function testFunctionsBuilder
    <POST_TYPE extends InjectPayload, PATCH_TYPE extends InjectPayload, QUERY_TYPE = undefined>
    (server: FastifyInstance, url: string) {
    return {
        async get(indentifier: string, path?: string) {
            return await server.inject({
                method: 'GET',
                url: `${url}/${indentifier}` + (path ? `/${path}` : "")
            })
        },

        async query(query: QUERY_TYPE) {
            return await server.inject({
                method: 'GET',
                url: `${url}`,
                query: query ?? {}
            })
        },

        async post(payload: POST_TYPE, path?: string) {
            return await server.inject({
                method: 'POST',
                url: url + (path ? `/${path}` : ""),
                payload
            })
        },

        async patch(identifier: string, payload: PATCH_TYPE, path?: string) {
            return await server.inject({
                method: 'PATCH',
                url: `${url}/${identifier}` + (path ? `/${path}` : ""),
                payload
            })
        },

        async del(identifier: string, path?: string) {
            return await server.inject({
                method: 'DELETE',
                url: `${url}/${identifier}` + (path ? `/${path}` : "")
            })
        }
    }
}