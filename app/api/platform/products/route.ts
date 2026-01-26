import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAuthContext } from "@/lib/auth/server";
import {
    Product,
    ProductType
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
        const type = req.nextUrl.searchParams.get("type");
        const categoryId = req.nextUrl.searchParams.get("categoryId");

        let query: FirebaseFirestore.Query = db.collection(`organizations/${orgId}/products`);

        if (type) query = query.where("type", "==", type);
        if (categoryId) query = query.where("categoryId", "==", categoryId);

        const snapshot = await query.orderBy("createdAt", "desc").limit(50).get();

        const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString()
        }));

        return NextResponse.json({ data: products });
    } catch (error) {
        console.error("List Products Error:", error);
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

        const docRef = db.collection(`organizations/${orgId}/products`).doc();
        const docId = docRef.id;
        const now = new Date();

        const newProduct: Product = {
            ...body,
            id: docId,
            orgId: orgId,
            active: body.active !== undefined ? body.active : true,
            createdAt: now,
            updatedAt: now
        };

        await docRef.set(newProduct);

        return NextResponse.json({ data: { id: docId } }, { status: 201 });

    } catch (error) {
        console.error("Create Product Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
