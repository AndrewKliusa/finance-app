import { FastifyInstance } from "fastify";
import { adminAccessToken } from "./helper";

export function reportsFunctionsBuilder(server: FastifyInstance) {
    return {
        async requestReport(year: string, month: string, token?: string) {
            return await server.inject({
                method: 'GET',
                url: `/api/v1/report`,
                query: { year, month },
                headers: { authorization: token ? `Bearer ${token}` : `Bearer ${adminAccessToken}` }
            })
        }
    }
}