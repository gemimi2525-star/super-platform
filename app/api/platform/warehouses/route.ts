import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAuthContext } from "@/lib/auth/server";
import { Warehouse } from '@super-platform/business';

const db = getAdminFirestore();

export async function GET(req: NextRequest) {
    const user = await getAuthContext(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = user.orgId;
    if (!orgId) {
        return NextResponse.json({ error: "Organization Context Missing" }, { status: 403 });
    }

    try {
        let query: FirebaseFirestore.Query = db.collection(`organizations/${orgId}/warehouses`);
        const snapshot = await query.orderBy("createdAt", "desc").get();

        const warehouses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString()
        }));

        return NextResponse.json({ data: warehouses });
    } catch (error) {
        console.error("List Warehouses Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = await getAuthContext(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = user.orgId;
    if (!orgId) {
        return NextResponse.json({ error: "Organization Context Missing" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const docRef = db.collection(`organizations/${orgId}/warehouses`).doc();
        const docId = docRef.id;
        const now = new Date();

        const newWarehouse: Warehouse = {
            ...body,
            id: docId,
            orgId: orgId,
            createdAt: now,
            updatedAt: now
        };

        await docRef.set(newWarehouse);

        return NextResponse.json({ data: { id: docId } }, { status: 201 });

    } catch (error) {
        console.error("Create Warehouse Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
