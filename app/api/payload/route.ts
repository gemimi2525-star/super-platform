// Payload 2.x API handler for Next.js
import { getPayload } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const payload = await getPayload()
    // Payload 2.x handles requests differently
    // This is a placeholder - actual integration requires custom setup
    return new Response('Payload API', { status: 200 })
}

export async function POST(request: Request) {
    const payload = await getPayload()
    return new Response('Payload API', { status: 200 })
}
