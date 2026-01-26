'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Card, CardBody, CardHeader, Button, Input } from '@super-platform/ui';
import { useAdminContext } from '@/contexts/AdminContext';
import { useTranslations, useLocale } from '@/lib/i18n';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';

export default function EditCustomerPage({ params }: { params: Promise<{ customerId: string }> }) {
    const t = useTranslations();
    const l = useLocale();
    const router = useRouter();
    const { selectedOrgId } = useAdminContext();
    const [customerId, setCustomerId] = useState<string>('');

    // Unwrap params
    useEffect(() => {
        params.then(p => setCustomerId(p.customerId));
    }, [params]);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        taxId: '',
        address: '',
        contactName: '',
        contactEmail: '',
        contactPhone: ''
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch Data
    useEffect(() => {
        if (!selectedOrgId || !customerId) return;

        async function fetchCustomer() {
            try {
                const res = await apiClient<{ data: { customer: any } }>(`/api/platform/customers/${customerId}`);
                const c = res.data.customer;
                setFormData({
                    code: c.code || '',
                    name: c.name || '',
                    taxId: c.taxId || '',
                    address: c.address || '',
                    contactName: c.contactPerson?.name || '',
                    contactEmail: c.contactPerson?.email || '',
                    contactPhone: c.contactPerson?.phone || ''
                });
            } catch (err: any) {
                console.error('Failed to fetch customer:', err);
                setError(err.message || t('platform.customers.form.error'));
            } finally {
                setIsLoading(false);
            }
        }
        fetchCustomer();
    }, [selectedOrgId, customerId]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrgId) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                code: formData.code,
                name: formData.name,
                taxId: formData.taxId,
                address: formData.address,
                contactPerson: {
                    name: formData.contactName,
                    email: formData.contactEmail,
                    phone: formData.contactPhone
                }
            };

            await apiClient(`/api/platform/customers/${customerId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            // Navigate back on success
            router.push(`/${l}/platform/customers`);
        } catch (err: any) {
            console.error('Update customer failed:', err);
            setError(err.message || t('common.states.errorTitle'));
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(t('common.crud.delete') + '?')) return;

        setIsDeleting(true);
        try {
            await apiClient(`/api/platform/customers/${customerId}`, {
                method: 'DELETE'
            });
            router.push(`/${l}/platform/customers`);
        } catch (err: any) {
            console.error('Delete customer failed:', err);
            setError(err.message || t('common.states.errorTitle'));
            setIsDeleting(false);
        }
    };

    // Case: No Context
    if (!selectedOrgId) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <AlertCircle className="w-10 h-10 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">{t('common.states.noOrgTitle')}</h3>
            </div>
        );
    }

    if (isLoading) {
        return <div className="p-12 text-center text-gray-500">{t('common.states.loading')}</div>;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link
                        href={`/${l}/platform/customers`}
                        className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        {t('common.crud.back')}
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">{t('platform.customers.form.titleEdit')}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('platform.customers.form.subtitle').replace('{orgId}', selectedOrgId)}
                    </p>
                </div>
                <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={isDeleting || isSubmitting}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common.crud.delete')}
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5" />
                        <div>
                            <p className="font-medium">{t('common.states.errorTitle')}</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                <Card className="mb-6">
                    <CardHeader title={t('platform.customers.form.sections.basic')} />
                    <CardBody className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('platform.customers.form.fields.code.label')} <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder={t('platform.customers.form.fields.code.placeholder')}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('platform.customers.form.fields.name.label')} <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={t('platform.customers.form.fields.name.placeholder')}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('platform.customers.form.fields.taxId.label')}
                            </label>
                            <Input
                                name="taxId"
                                value={formData.taxId}
                                onChange={handleChange}
                                placeholder={t('platform.customers.form.fields.taxId.placeholder')}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('platform.customers.form.fields.address.label')}
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder={t('platform.customers.form.fields.address.placeholder')}
                                disabled={isSubmitting}
                            />
                        </div>
                    </CardBody>
                </Card>

                <Card className="mb-6">
                    <CardHeader title={t('platform.customers.form.sections.contact')} />
                    <CardBody className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('platform.customers.form.fields.contactName.label')}
                            </label>
                            <Input
                                name="contactName"
                                value={formData.contactName}
                                onChange={handleChange}
                                placeholder={t('platform.customers.form.fields.contactName.placeholder')}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('platform.customers.form.fields.email.label')}
                                </label>
                                <Input
                                    name="contactEmail"
                                    type="email"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    placeholder={t('platform.customers.form.fields.email.placeholder')}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('platform.customers.form.fields.phone.label')}
                                </label>
                                <Input
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleChange}
                                    placeholder={t('platform.customers.form.fields.phone.placeholder')}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <div className="flex justify-end gap-3 mb-10">
                    <Link href={`/${l}/platform/customers`}>
                        <Button variant="secondary" type="button" disabled={isSubmitting}>
                            {t('common.crud.cancel')}
                        </Button>
                    </Link>
                    <Button type="submit" loading={isSubmitting}>
                        {t('common.crud.save')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
