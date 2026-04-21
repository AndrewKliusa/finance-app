import { adminNotificationsToken, generateAdminToken } from "./helper"

export async function connectNotificationsStream() {
    const response = await fetch(`http://localhost:3000/api/v1/notifications/stream?token=${adminNotificationsToken}`)
    
    const reader = response.body!.getReader()
    await readNotificationsStream(reader)

    return reader
}

export async function readNotificationsStream(reader: ReadableStreamDefaultReader) {
    const decoder = new TextDecoder()

    const { value } = await reader.read()
    return decoder.decode(value)
}

export async function closeNotificationsStream(reader: ReadableStreamDefaultReader) {
    reader.cancel()
}