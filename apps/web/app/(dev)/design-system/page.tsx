'use client';

import {
    Button, Input, Card, CardHeader, CardBody, Modal, ModalFooter,
    FormGroup, Select, Table, Pagination
} from '@platform/ui-kit';
import { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';

export default function DesignSystemPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">UI Kit Design System</h1>
                    <p className="text-gray-600">Super Platform Component Library</p>
                </div>

                {/* Buttons */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Buttons</h2>
                    <Card>
                        <CardBody>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Variants</h3>
                                    <div className="flex flex-wrap gap-3">
                                        <Button variant="primary">Primary</Button>
                                        <Button variant="secondary">Secondary</Button>
                                        <Button variant="outline">Outline</Button>
                                        <Button variant="ghost">Ghost</Button>
                                        <Button variant="danger">Danger</Button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Sizes</h3>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button size="sm">Small</Button>
                                        <Button size="md">Medium</Button>
                                        <Button size="lg">Large</Button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">States</h3>
                                    <div className="flex flex-wrap gap-3">
                                        <Button loading>Loading</Button>
                                        <Button disabled>Disabled</Button>
                                        <Button icon={<User className="w-4 h-4" />}>With Icon</Button>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </section>

                {/* Inputs */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Inputs</h2>
                    <Card>
                        <CardBody>
                            <div className="space-y-6 max-w-md">
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="you@example.com"
                                    icon={<Mail className="w-5 h-5 text-gray-400" />}
                                />

                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    icon={<Lock className="w-5 h-5 text-gray-400" />}
                                    helperText="Must be at least 8 characters"
                                />

                                <Input
                                    label="Name"
                                    placeholder="John Doe"
                                    error="This field is required"
                                />
                            </div>
                        </CardBody>
                    </Card>
                </section>

                {/* Cards */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card variant="default">
                            <CardHeader title="Default Card" subtitle="Basic card style" />
                            <CardBody>This is a default card with standard styling.</CardBody>
                        </Card>

                        <Card variant="bordered">
                            <CardHeader title="Bordered Card" subtitle="With 2px border" />
                            <CardBody>This card has a thicker border for emphasis.</CardBody>
                        </Card>

                        <Card variant="elevated">
                            <CardHeader title="Elevated Card" subtitle="With shadow" />
                            <CardBody>This card has an elevated shadow effect.</CardBody>
                        </Card>
                    </div>
                </section>

                {/* Modal */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Modal</h2>
                    <Card>
                        <CardBody>
                            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>

                            <Modal
                                isOpen={isModalOpen}
                                onClose={() => setIsModalOpen(false)}
                                title="Example Modal"
                                size="md"
                            >
                                <div className="space-y-4">
                                    <p className="text-gray-600">
                                        This is a modal dialog component with Portal rendering,
                                        backdrop blur, and smooth animations.
                                    </p>
                                    <Input label="Test Input" placeholder="Type something..." />
                                </div>
                                <ModalFooter>
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                                        Confirm
                                    </Button>
                                </ModalFooter>
                            </Modal>
                        </CardBody>
                    </Card>
                </section>

                {/* Component Stats */}
                <section>
                    <Card variant="elevated">
                        <CardHeader title="Component Library Stats" />
                        <CardBody>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <div className="text-3xl font-bold text-blue-600">9</div>
                                    <div className="text-sm text-gray-600">Total Components</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-green-600">5</div>
                                    <div className="text-sm text-gray-600">Variants</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-purple-600">3</div>
                                    <div className="text-sm text-gray-600">Sizes</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-orange-600">100%</div>
                                    <div className="text-sm text-gray-600">TypeScript</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </section>

                {/* Forms Components */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Form Components</h2>

                    <Card>
                        <CardHeader title="FormGroup" subtitle="Form field wrapper with label and validation" />
                        <CardBody>
                            <div className="space-y-4 max-w-md">
                                <FormGroup label="Username" required>
                                    <Input placeholder="Enter username" />
                                </FormGroup>

                                <FormGroup
                                    label="Email"
                                    helperText="We'll never share your email"
                                >
                                    <Input type="email" placeholder="you@example.com" />
                                </FormGroup>

                                <FormGroup
                                    label="Password"
                                    required
                                    error="Password must be at least 8 characters"
                                >
                                    <Input type="password" placeholder="••••••••" />
                                </FormGroup>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader title="Select" subtitle="Dropdown with search and multi-select" />
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Status"
                                    options={[
                                        { value: 'active', label: 'Active' },
                                        { value: 'inactive', label: 'Inactive' },
                                        { value: 'pending', label: 'Pending' },
                                    ]}
                                    onChange={() => { }}
                                    placeholder="Select status..."
                                />

                                <Select
                                    label="Tags"
                                    options={[
                                        { value: 'seo', label: 'SEO' },
                                        { value: 'content', label: 'Content' },
                                        { value: 'marketing', label: 'Marketing' },
                                        { value: 'analytics', label: 'Analytics' },
                                    ]}
                                    multiple
                                    searchable
                                    onChange={() => { }}
                                    placeholder="Select tags..."
                                />
                            </div>
                        </CardBody>
                    </Card>
                </section>

                {/* Data Display Components */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Data Display</h2>

                    <Card>
                        <CardHeader title="Table" subtitle="Display tabular data" />
                        <CardBody>
                            <Table
                                columns={[
                                    { key: 'name', header: 'Name' },
                                    { key: 'email', header: 'Email' },
                                    { key: 'role', header: 'Role' },
                                    {
                                        key: 'status',
                                        header: 'Status',
                                        render: (row: any) => (
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${row.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {row.status}
                                            </span>
                                        )
                                    },
                                ]}
                                data={[
                                    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
                                    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'active' },
                                    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'inactive' },
                                ]}
                                keyExtractor={(row) => row.id}
                            />
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader title="Pagination" subtitle="Navigate through pages" />
                        <CardBody>
                            <Pagination
                                currentPage={3}
                                totalPages={10}
                                onPageChange={(page) => console.log('Page:', page)}
                                itemsPerPage={10}
                                totalItems={95}
                            />
                        </CardBody>
                    </Card>
                </section>

                {/* Feedback Components */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Feedback</h2>

                    <Card>
                        <CardHeader title="ConfirmDialog" subtitle="Confirmation for destructive actions" />
                        <CardBody>
                            <div className="space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const dialog = document.createElement('div');
                                        dialog.innerHTML = 'ConfirmDialog: Check Modal section above for demo';
                                        alert('ConfirmDialog uses Modal internally. See Modal section for interactive demo.');
                                    }}
                                >
                                    Warning Dialog (Demo)
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => {
                                        alert('ConfirmDialog: Built on Modal component with AlertTriangle icon');
                                    }}
                                >
                                    Danger Dialog (Demo)
                                </Button>
                            </div>
                            <p className="mt-4 text-sm text-gray-600">
                                ConfirmDialog extends Modal with warning/danger styling and confirmation buttons.
                            </p>
                        </CardBody>
                    </Card>
                </section>
            </div>
        </div>
    );
}
