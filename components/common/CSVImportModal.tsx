'use client';

/**
 * CSV Import Modal
 * 
 * Generic modal for importing CSV data.
 */

import { useState, useRef } from 'react';
import { useTranslations } from '@/lib/i18n';
import { Modal, ModalFooter, Button, useToast, Table } from '@super-platform/ui';
import { parseCSV, type CSVRow } from '@/lib/csv/parser';
import { Download } from 'lucide-react';

export interface CSVImportModalProps {
    open: boolean;
    onClose: () => void;
    onImport: (rows: CSVRow[]) => Promise<void>;
    templateUrl?: string; // Optional download link
    requiredColumns: string[];
}

export function CSVImportModal({
    open,
    onClose,
    onImport,
    templateUrl,
    requiredColumns
}: CSVImportModalProps) {
    const t = useTranslations('common.csv');
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<CSVRow[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    const reset = () => {
        setStep('upload');
        setFile(null);
        setParsedData([]);
        setErrors([]);
        setIsImporting(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFile(file);

        try {
            const result = await parseCSV(file);

            // Validate Columns
            const missingColumns = requiredColumns.filter(col => !result.headers.includes(col));
            if (missingColumns.length > 0) {
                setErrors([`Missing columns: ${missingColumns.join(', ')}`]);
            } else {
                setErrors(result.errors);
            }

            setParsedData(result.data);
            setStep('preview');
        } catch (error) {
            console.error(error);
            setErrors(['Failed to parse file']);
        }
    };

    // Filter valid rows: Assume row is valid if it has required columns filled
    // This is basic validation. Complex validation happens in 'onImport' usually or expanded here.
    // For now, we consider a row valid if required props are not empty string.
    const validRows = parsedData.filter(row => {
        return requiredColumns.every(col => row[col] && row[col].trim() !== '');
    });

    const invalidCount = parsedData.length - validRows.length;

    const handleImport = async () => {
        if (validRows.length === 0) return;

        setIsImporting(true);
        try {
            await onImport(validRows);
            showToast(t('successSummary', { count: validRows.length }), 'success');
            reset();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Import failed', 'error'); // Should rely on t('operationFailed') ideally but simple is ok
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Modal
            isOpen={open}
            onClose={() => { reset(); onClose(); }}
            title={t('importTitle')}
            size="lg"
        >
            <div className="space-y-6">

                {/* Step 1: Upload */}
                {step === 'upload' && (
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            // Handle drop... (simplified: just click for now)
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                            📄
                        </div>
                        <p className="text-gray-600 font-medium">
                            {t('dropzone')}
                        </p>
                        {templateUrl && (
                            <div className="mt-4">
                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); /* download logic */ }}>
                                    <Download className="w-4 h-4 mr-2" />
                                    {t('downloadTemplate')}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Preview */}
                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-green-600 font-medium">{t('validRows', { count: validRows.length })}</span>
                            {invalidCount > 0 && (
                                <span className="text-red-600 font-medium">{t('invalidRows', { count: invalidCount })}</span>
                            )}
                        </div>

                        {errors.length > 0 && parsedData.length === 0 && (
                            <div className="bg-red-50 p-4 rounded text-red-700 text-sm">
                                {errors.map((e, i) => <div key={i}>{e}</div>)}
                            </div>
                        )}

                        {parsedData.length > 0 && (
                            <div className="border rounded max-h-60 overflow-y-auto">
                                <table className="min-w-full text-xs divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {requiredColumns.map(col => (
                                                <th key={col} className="px-4 py-2 text-left font-medium text-gray-500 uppercase">{col}</th>
                                            ))}
                                            <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {parsedData.slice(0, 50).map((row, i) => {
                                            const isValid = requiredColumns.every(col => row[col] && row[col].trim() !== '');
                                            return (
                                                <tr key={i} className={isValid ? '' : 'bg-red-50'}>
                                                    {requiredColumns.map(col => (
                                                        <td key={col} className="px-4 py-2 text-gray-900">{row[col] || '-'}</td>
                                                    ))}
                                                    <td className="px-4 py-2">
                                                        {isValid ? (
                                                            <span className="text-green-600">Valid</span>
                                                        ) : (
                                                            <span className="text-red-600">Invalid</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {parsedData.length > 50 && (
                                    <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
                                        + {parsedData.length - 50} more rows...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ModalFooter>
                <Button variant="outline" onClick={() => { reset(); onClose(); }}>
                    {t('cancel')}
                </Button>
                {step === 'preview' && validRows.length > 0 && (
                    <Button
                        variant="primary"
                        onClick={handleImport}
                        loading={isImporting}
                    >
                        {t('importButton', { count: validRows.length })}
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    );
}
