import React from 'react';

export const metadata = {
    title: 'CORE OS — Ops Center',
    description: 'Operational metrics and monitoring dashboard',
};

export default function OpsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
