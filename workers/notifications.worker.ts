import { Worker } from "bullmq"
import { redis } from "../lib/redis/redis"

new Worker("notifications", async (job) => {
    if (job.name == "budget-check") {
        console.log("Got a job!")
    }
}, {
    connection: redis
})