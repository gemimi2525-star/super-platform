/**
 * Platform Brand Settings Page
 * 
 * Redirects to /platform/settings/brand/header
 * Brand settings are now split into 3 separate pages
 */

import { redirect } from 'next/navigation';

export default function BrandSettingsPage() {
    redirect('/platform/settings/brand/header');
}
