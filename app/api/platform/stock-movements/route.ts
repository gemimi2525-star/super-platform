import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAuthContext } from "@/lib/auth/server";
import {
    StockMovement,
    StockMovementType
} from '@super-platform/business';

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
        const warehouseId = req.nextUrl.searchParams.get("warehouseId");
        const productId = req.nextUrl.searchParams.get("productId");

        let query: FirebaseFirestore.Query = db.collection(`organizations/${orgId}/stockMovements`);

        if (warehouseId) query = query.where("warehouseId", "==", warehouseId);
        if (productId) query = query.where("productId", "==", productId);

        const snapshot = await query.orderBy("createdAt", "desc").limit(50).get();

        const movements = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString()
        }));

        return NextResponse.json({ data: movements });
    } catch (error) {
        console.error("List Stock Movements Error:", error);
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

        const docRef = db.collection(`organizations/${orgId}/stockMovements`).doc();
        const docId = docRef.id;
        const now = new Date();

        const newMovement: StockMovement = {
            ...body,
            id: docId,
            orgId: orgId,
            createdAt: now,
            updatedAt: now
        };

        await docRef.set(newMovement);

        return NextResponse.json({ data: { id: docId } }, { status: 201 });

    } catch (error) {
        console.error("Create Stock Movement Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
