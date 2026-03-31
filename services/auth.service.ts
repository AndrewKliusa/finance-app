import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '../lib/prisma'
import { redis } from '../lib/redis'

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET)
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET)

const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30

export async function generateTokenPair(userId: string) {
    const accessToken = await new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(ACCESS_TOKEN_TTL)
        .setIssuedAt()
        .sign(accessSecret)

    const refreshToken = await new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(REFRESH_TOKEN_TTL)
        .setIssuedAt()
        .sign(refreshSecret)

    const expiresAt = new Date(Date.now() +  REFRESH_TOKEN_TTL * 1000)

    await prisma.refreshToken.create({
        data: { token: refreshToken, userId, expiresAt }
    })

    await redis.set(`refreshToken:${refreshToken}`, userId, 'EX', REFRESH_TOKEN_TTL)

    return { accessToken, refreshToken }
}

export async function rotateRefreshToken(oldToken: string) {
    const userId = await redis.get(`refreshToken:${oldToken}`)

    if (!userId) {
        throw new Error('Invalid refresh token!')
    }

    await prisma.refreshToken.delete({
        where: { token: oldToken }
    })
    await redis.del(`refreshToken:${oldToken}`)

    return generateTokenPair(userId)
}

export async function revokeRefreshToken(token: string) {
    await prisma.refreshToken.delete({
        where: { token }
    })
    await redis.del(`refreshToken:${token}`)
}

export async function verifyAccessToken(token: string) {
    const { payload } = await jwtVerify(token, accessSecret)
    return payload;
}