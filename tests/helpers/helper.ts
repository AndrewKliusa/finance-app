import { prisma } from "../../lib/prisma";
import { buildServer } from "../../server";
import { generateTokenPair } from "../../services/auth.service";

export const emptyUUID = "00000000-0000-0000-0000-000000000000"
export let adminAccessToken: string;

export const server = buildServer()

export async function generateAdminToken() {
    const admin = await prisma.user.findFirst({
        where: { name: "admin" }
    })

    const { accessToken } = await generateTokenPair(admin!.id)
    adminAccessToken = accessToken
}