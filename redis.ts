import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIT_URL!)

redis.on("error", (error) => {
    console.error("Redis error: ", error)
})