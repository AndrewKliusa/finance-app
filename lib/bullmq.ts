import { Queue } from "bullmq"
import { redis } from "./redis/redis"

export const notificationsQueue = new Queue("notifications", {
    connection: redis
})