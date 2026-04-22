import { FastifyInstance } from "fastify"
import { RefreshTokenType } from "../../schemas/auth.schema"
import { NameAndPasswordType } from "../../schemas/user.schema"

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