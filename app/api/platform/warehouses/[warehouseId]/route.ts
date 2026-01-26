import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

const adminAuth = getAdminAuth();
const db = getAdminFirestore();

async function checkAuth(req: NextRequest) {
    const sessionCookie = req.cookies.get("session")?.value || "";
    if (!sessionCookie) return null;
    try {
        return await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch {
        return null;
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ warehouseId: string }> }
) {
    const user = await checkAuth(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = user.orgId as string;
    if (!orgId) {
        return NextResponse.json({ error: "Organization Context Missing" }, { status: 403 });
    }

    const { warehouseId } = await params;

    try {
        const docRef = db.doc(`organizations/${orgId}/warehouses/${warehouseId}`);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Warehouse Not Found" }, { status: 404 });
        }

        const data = {
            ...docSnap.data(),
            createdAt: docSnap.data()?.createdAt?.toDate().toISOString(),
            updatedAt: docSnap.data()?.updatedAt?.toDate().toISOString()
        };

        return NextResponse.json({ data });

    } catch (error) {
        console.error("Get Warehouse Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
