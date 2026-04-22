import { adminNotificationsToken, generateAdminToken } from "./helper"

export async function connectNotificationsStream(token: string = adminNotificationsToken) {
    const response = await fetch(`http://localhost:3000/api/v1/notifications/stream?token=${token}`)
    
    if (response.status != 200) {
        throw new Error(response.status.toString())
    }

    const reader = response.body!.getReader()
    await readNotificationsStream(reader)

    return reader
}

export async function readNotificationsStream(reader: ReadableStreamDefaultReader) {
    const decoder = new TextDecoder()

    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timed out!")), 1000)
    })
    
    const { value } = await Promise.race([
        reader.read(),
        timeout
    ])
    return decoder.decode(value)
}

export async function closeNotificationsStream(reader: ReadableStreamDefaultReader) {
    reader.cancel()
}