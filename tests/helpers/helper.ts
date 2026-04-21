import { config } from "dotenv"
config({ path: ".env.test" })

import { prisma } from "../../lib/prisma";
import { UserType } from "../../schemas/user.schema";
import { buildServer } from "../../server";
import { generateTokenPair } from "../../services/auth.service";

export const emptyUUID = "00000000-0000-0000-0000-000000000000"
export let adminAccessToken: string
export let adminNotificationsToken: string
export let admin: UserType

export const server = buildServer()

export async function generateAdminToken() {
    admin = await prisma.user.findFirstOrThrow({
        where: { name: "admin" }
    })

    const { accessToken, notificationsToken } = await generateTokenPair(admin!.id)
    adminAccessToken = accessToken
    adminNotificationsToken = notificationsToken
}