/**
 * UI Component Barrel Export
 * 
 * Re-exports all commonly used UI components
 * to enable simpler import statements like:
 * import { Card, Badge, Button } from '@super-platform/ui';
 */

// Primitives
export { Button } from './components/primitives/Button';
export { Card, CardHeader, CardBody, CardFooter } from './components/primitives/Card';
export { Input } from './components/primitives/Input';
export { Modal, ModalFooter } from './components/primitives/Modal';
export { Textarea } from './components/primitives/Textarea';

// Data Display
export { Badge } from './components/data-display/Badge';
export { Pagination } from './components/data-display/Pagination';
export { Table } from './components/data-display/Table';
export type { ColumnDef } from './components/data-display/Table';

// Forms
export { FormGroup } from './components/forms/FormGroup';
export { Select } from './components/forms/Select';

// Feedback
export { ConfirmDialog } from './components/feedback/ConfirmDialog';
export { Toast } from './components/feedback/Toast';
export { ToastProvider, useToast } from './components/feedback/ToastProvider';

// Error Handling
export { ErrorBoundary } from './error-boundary';
