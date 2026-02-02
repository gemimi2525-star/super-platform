import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'SYNAPSE CMS Admin',
    description: 'Content Management System',
}

export default function AdminPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Payload Admin Panel</h1>
            <p className="mt-4 text-gray-600">
                Admin panel integration in progress.
                Configure Payload admin UI mounting here.
            </p>
        </div>
    )
}
