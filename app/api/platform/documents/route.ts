import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAuthContext } from "@/lib/auth/server";
import {
    DocumentHeader,
    DocumentItem,
    DocumentStatus,
    DocumentType
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
        const status = req.nextUrl.searchParams.get("status");

        let query: FirebaseFirestore.Query = db.collection(`organizations/${orgId}/documents`);

        if (type) query = query.where("type", "==", type);
        if (status) query = query.where("status", "==", status);

        const snapshot = await query.orderBy("createdAt", "desc").limit(50).get();

        const documents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate().toISOString(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString()
        }));

        return NextResponse.json({ data: documents });
    } catch (error) {
        console.error("List Documents Error:", error);
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
        const items = body.items || [];
        const headerData = { ...body };
        delete headerData.items;

        const docRef = db.collection(`organizations/${orgId}/documents`).doc();
        const docId = docRef.id;
        const now = new Date();
        const docDate = headerData.date ? new Date(headerData.date) : now;

        const newHeader: DocumentHeader = {
            ...headerData,
            id: docId,
            orgId: orgId,
            status: headerData.status || DocumentStatus.DRAFT,
            date: docDate,
            createdAt: now,
            updatedAt: now
        };

        const batch = db.batch();
        batch.set(docRef, newHeader);

        items.forEach((item: any) => {
            const itemRef = docRef.collection('items').doc();
            const newItem: DocumentItem = {
                ...item,
                id: itemRef.id,
                documentId: docId,
                orgId: orgId,
                createdAt: now,
                updatedAt: now
            };
            batch.set(itemRef, newItem);
        });

        await batch.commit();

        return NextResponse.json({ data: { id: docId } }, { status: 201 });

    } catch (error) {
        console.error("Create Document Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
