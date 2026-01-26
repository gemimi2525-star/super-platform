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
    { params }: { params: Promise<{ customerId: string }> }
) {
    const user = await checkAuth(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = user.orgId as string;
    if (!orgId) {
        return NextResponse.json({ error: "Organization Context Missing" }, { status: 403 });
    }

    const { customerId } = await params;

    try {
        const docRef = db.doc(`organizations/${orgId}/customers/${customerId}`);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Customer Not Found" }, { status: 404 });
        }

        // Fetch Contacts
        const contactsSnap = await docRef.collection("contacts").get();
        const contacts = contactsSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate().toISOString(),
            updatedAt: d.data().updatedAt?.toDate().toISOString()
        }));

        const data = {
            ...docSnap.data(),
            contacts: contacts,
            createdAt: docSnap.data()?.createdAt?.toDate().toISOString(),
            updatedAt: docSnap.data()?.updatedAt?.toDate().toISOString()
        };

        return NextResponse.json({ data });

    } catch (error) {
        console.error("Get Customer Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
