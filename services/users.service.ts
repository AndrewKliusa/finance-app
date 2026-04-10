import { prisma } from "../lib/prisma"
import { redis } from "../lib/redis/redis"

export async function invalidateUserPages() {
    const keys = await redis.keys('users:page:*')
    if (keys.length) await redis.del(...keys)
}

export async function revokeUserTokens(id: string) {
    const tokens = await prisma.refreshToken.findMany({
        where: { userId: id }
    })
    
    await prisma.refreshToken.deleteMany({
        where: { userId: id }                                                                           
    })
    await Promise.all(tokens.map(token => redis.del(`refreshToken:${token.token}`)))
    await invalidateUserPages()
}

export async function isAdmin(userId: string) {
    return await prisma.user.findFirst({
        where: { id: userId, role: "ADMIN" }
    })
}