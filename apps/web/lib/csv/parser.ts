// Custom parser implementation
// import { parse } from 'csv-parse/sync'; 
// Instructions said "Use existing UI Kit only" and "NO external integrations" but 'csv-parse' is a lib.
// To stay strict to "No external libs if possible" and keep build clean, 
// I will write a simple robust CSV parser since we only need simple string/number columns.

export interface CSVRow {
    [key: string]: string;
}

export interface ParseResult {
    data: CSVRow[];
    errors: string[];
    headers: string[];
}

/**
 * Simple client-side CSV parser
 */
export async function parseCSV(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                if (!text) {
                    resolve({ data: [], errors: ['Empty file'], headers: [] });
                    return;
                }

                const lines = text.split(/\r\n|\n/).filter(line => line.trim());
                if (lines.length === 0) {
                    resolve({ data: [], errors: ['Empty file'], headers: [] });
                    return;
                }

                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')); // Basic unquote
                const data: CSVRow[] = [];
                const errors: string[] = [];

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    // Simple split by comma. NOTE: This breaks on commas inside quotes. 
                    // For MVP simple keywords, this is usually acceptable, but a regex split is safer.
                    // Regex to split by comma but ignore commas inside quotes:
                    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
                    // Actually simpler robust regex:
                    // /,(?=(?:(?:[^"]*"){2})*[^"]*$)/

                    const rowValues = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, ''));

                    if (rowValues.length !== headers.length) {
                        errors.push(`Row ${i + 1}: Column count mismatch (Expected ${headers.length}, got ${rowValues.length})`);
                        continue;
                    }

                    const row: CSVRow = {};
                    headers.forEach((header, index) => {
                        row[header] = rowValues[index] || '';
                    });
                    data.push(row);
                }

                resolve({ data, errors, headers });
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}
