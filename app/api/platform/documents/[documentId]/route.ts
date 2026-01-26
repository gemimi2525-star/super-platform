import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

const adminAuth = getAdminAuth();
const db = getAdminFirestore();

// Helper for Auth & RBAC (Duplicated for now, should move to shared lib later)
async function checkAuth(req: NextRequest) {
    const sessionCookie = req.cookies.get("session")?.value || "";
    if (!sessionCookie) return null;
    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedClaims;
    } catch {
        return null;
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    const user = await checkAuth(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = user.orgId as string;
    if (!orgId) {
        return NextResponse.json({ error: "Organization Context Missing" }, { status: 403 });
    }

    const { documentId } = await params;

    try {
        const docRef = db.doc(`organizations/${orgId}/documents/${documentId}`);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Document Not Found" }, { status: 404 });
        }

        // Fetch Items
        const itemsSnap = await docRef.collection("items").get();
        const items = itemsSnap.docs.map(d => d.data());

        const data = {
            ...docSnap.data(),
            items: items,
            // Convert Dates
            createdAt: docSnap.data()?.createdAt?.toDate().toISOString(),
            updatedAt: docSnap.data()?.updatedAt?.toDate().toISOString(),
            issueDate: docSnap.data()?.issueDate?.toDate().toISOString(),
            dueDate: docSnap.data()?.dueDate?.toDate().toISOString(),
        };

        return NextResponse.json({ data });

    } catch (error) {
        console.error("Get Document Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
