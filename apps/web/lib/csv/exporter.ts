/**
 * CSV Exporter Utility
 */

export function exportToCSV(data: any[], filename: string, columns?: { key: string; label: string }[]) {
    if (!data || data.length === 0) return;

    // 1. Determine Headers
    const headers = columns ? columns.map(c => c.label) : Object.keys(data[0]);
    const keys = columns ? columns.map(c => c.key) : Object.keys(data[0]);

    // 2. Build Content
    const csvContent = [
        headers.join(','), // Header Row
        ...data.map(row => {
            return keys.map(key => {
                let val = (row as any)[key]; // Use 'as any' safely here for flexible object access

                // Handle undefined/null
                if (val === null || val === undefined) val = '';

                // Handle nested objects simply (e.g. if key is 'obj.prop' - user must flatten data before passing generally, 
                // but we can support simple dot notation if needed. For now assume flattened data or direct keys.)
                if (key.includes('.')) {
                    val = key.split('.').reduce((o: any, k) => (o || {})[k], row) || '';
                }

                // Escape quotes and wrap in quotes if contains comma
                const stringVal = String(val);
                if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                    return `"${stringVal.replace(/"/g, '""')}"`;
                }
                return stringVal;
            }).join(',');
        })
    ].join('\n');

    // 3. Create Blob (UTF-8 with BOM for Excel)
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 4. Trigger Download
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
