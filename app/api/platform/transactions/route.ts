import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAuthContext } from "@/lib/auth/server";
import {
    Transaction,
    TransactionType
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
        const accountId = req.nextUrl.searchParams.get("accountId");

        let query: FirebaseFirestore.Query = db.collection(`organizations/${orgId}/transactions`);

        if (type) query = query.where("type", "==", type);
        if (accountId) query = query.where("accountId", "==", accountId);

        const snapshot = await query.orderBy("createdAt", "desc").limit(50).get();

        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate().toISOString(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString()
        }));

        return NextResponse.json({ data: transactions });
    } catch (error) {
        console.error("List Transactions Error:", error);
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

        const docRef = db.collection(`organizations/${orgId}/transactions`).doc();
        const docId = docRef.id;
        const now = new Date();
        const date = body.date ? new Date(body.date) : now;

        const newTransaction: Transaction = {
            ...body,
            id: docId,
            orgId: orgId,
            date: date,
            createdAt: now,
            updatedAt: now
        };

        await docRef.set(newTransaction);

        return NextResponse.json({ data: { id: docId } }, { status: 201 });

    } catch (error) {
        console.error("Create Transaction Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
