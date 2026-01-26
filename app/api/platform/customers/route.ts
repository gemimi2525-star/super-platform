import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAuthContext } from "@/lib/auth/server";
import {
    Customer,
    CustomerType,
    Status
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

        let query: FirebaseFirestore.Query = db.collection(`organizations/${orgId}/customers`);

        if (type) query = query.where("type", "==", type);
        if (status) query = query.where("status", "==", status);

        const snapshot = await query.orderBy("createdAt", "desc").limit(50).get();

        const customers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString()
        }));

        return NextResponse.json({ data: customers });
    } catch (error) {
        console.error("List Customers Error:", error);
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
        const contactPerson = body.contactPerson; // Extract contact if any
        const customerData = { ...body };
        delete customerData.contactPerson;

        const docRef = db.collection(`organizations/${orgId}/customers`).doc();
        const docId = docRef.id;
        const now = new Date();

        const newCustomer: Customer = {
            ...customerData,
            id: docId,
            orgId: orgId,
            status: customerData.status || Status.ACTIVE,
            createdAt: now,
            updatedAt: now
        };

        const batch = db.batch();
        batch.set(docRef, newCustomer);

        if (contactPerson) {
            const contactRef = docRef.collection('contacts').doc();
            batch.set(contactRef, {
                ...contactPerson,
                id: contactRef.id,
                customerId: docId,
                orgId: orgId,
                createdAt: now,
                updatedAt: now,
                isPrimary: true
            });
        }

        await batch.commit();

        return NextResponse.json({ data: { id: docId } }, { status: 201 });

    } catch (error) {
        console.error("Create Customer Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
