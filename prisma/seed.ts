import argon2 from "argon2"
import { prisma } from "../lib/prisma";

export async function seed() {
    await prisma.user.upsert({
        where: { name: "admin" },
        update: {},
        create: {
            name: "admin",
            password: await argon2.hash(process.env.ADMIN_PASSWORD!),
            role: "ADMIN"
        }
    })
}