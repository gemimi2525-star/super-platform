'use client';

import { useState } from 'react';
import { useTranslations } from '@/lib/i18n';
import type { ProofBundle, VerificationResult } from '@/packages/synapse/src/public-verifier';

// Import verifier logic (will be adapted for client-side)
function verifyProofBundleClient(bundle: ProofBundle): VerificationResult {
    const reasons: string[] = [];

    // 1. Structural validation
    if (!bundle.decisionId || typeof bundle.decisionId !== 'string') {
        reasons.push('Missing or invalid decisionId');
    }

    if (!bundle.policyId || typeof bundle.policyId !== 'string') {
        reasons.push('Missing or invalid policyId');
    }

    if (!bundle.policyVersion || typeof bundle.policyVersion !== 'string') {
        reasons.push('Missing or invalid policyVersion');
    }

    if (!bundle.intentHash || typeof bundle.intentHash !== 'string') {
        reasons.push('Missing or invalid intentHash');
    }

    if (!['ALLOW', 'DENY', 'ESCALATE'].includes(bundle.decision)) {
        reasons.push('Invalid decision value');
    }

    if (!bundle.signature || typeof bundle.signature !== 'string') {
        reasons.push('Missing or invalid signature');
    }

    if (!bundle.issuedAt || typeof bundle.issuedAt !== 'number') {
        reasons.push('Missing or invalid issuedAt timestamp');
    }

    // 2. Hash format validation (SHA-256 = 64 hex chars)
    if (bundle.intentHash && !/^[a-f0-9]{64}$/i.test(bundle.intentHash)) {
        reasons.push('intentHash is not a valid SHA-256 hash');
    }

    if (bundle.ledgerHash && !/^[a-f0-9]{64}$/i.test(bundle.ledgerHash)) {
        reasons.push('ledgerHash is not a valid SHA-256 hash');
    }

    // 3. Signature format validation (HMAC-SHA256 = 64 hex chars)
    if (bundle.signature && !/^[a-f0-9]{64}$/i.test(bundle.signature)) {
        reasons.push('Signature format is invalid');
    }

    // 4. Timestamp sanity check
    if (bundle.issuedAt) {
        const now = Date.now();
        const age = now - bundle.issuedAt;

        if (bundle.issuedAt > now + 60000) {
            reasons.push('Timestamp is in the future');
        }

        if (age > 365 * 24 * 60 * 60 * 1000) {
            reasons.push('Timestamp is older than 1 year');
        }
    }

    if (reasons.length > 0) {
        return { valid: false, reasons };
    }

    return { valid: true };
}

export default function VerifyProofPage() {
    const t = useTranslations('trust.verify');
    const [input, setInput] = useState('');
    const [result, setResult] = useState<{ bundle?: ProofBundle; verification?: VerificationResult } | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleVerify = () => {
        try {
            const bundle = JSON.parse(input) as ProofBundle;
            const verification = verifyProofBundleClient(bundle);
            setResult({ bundle, verification });
        } catch (error) {
            setResult({
                verification: {
                    valid: false,
                    reasons: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
                },
            });
        }
    };

    const copyToClipboard = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const truncateHash = (hash: string) => {
        return `${hash.substring(0, 16)}...`;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
                    <span>🔍</span>
                    {t('title')}
                </h1>
                <p className="text-lg text-neutral-700 mb-4">{t('subtitle')}</p>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                    <p className="text-sm">⚠️ {t('note')}</p>
                </div>
            </div>

            {/* Input Section */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4">{t('input.label')}</h2>
                <textarea
                    className="w-full h-64 p-4 border-2 border-neutral-200 rounded-lg font-mono text-sm focus:border-primary focus:outline-none resize-vertical"
                    placeholder={t('input.placeholder')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button
                    onClick={handleVerify}
                    className="mt-4 bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                    {t('button')}
                </button>
            </div>

            {/* Result Section */}
            {result && (
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold mb-6">Verification Result</h2>

                    {result.verification?.valid ? (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">✅</div>
                            <h3 className="text-3xl font-bold text-success mb-2">{t('result.valid')}</h3>
                            <p className="text-neutral-600">{t('result.validDesc')}</p>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">❌</div>
                            <h3 className="text-3xl font-bold text-error mb-2">{t('result.invalid')}</h3>
                            <p className="text-neutral-600 mb-4">{t('result.invalidDesc')}</p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                                <h4 className="font-bold mb-2">Reasons:</h4>
                                <ul className="list-disc ml-6 space-y-1">
                                    {result.verification?.reasons?.map((reason, idx) => (
                                        <li key={idx} className="text-error">{reason}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {result.bundle && result.verification?.valid && (
                        <div className="mt-8 border-t pt-8">
                            <h3 className="text-xl font-bold mb-4">Proof Details</h3>
                            <table className="w-full">
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="py-3 font-semibold w-48">{t('field.decisionId')}</td>
                                        <td className="py-3 font-mono text-sm">{result.bundle.decisionId}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold">{t('field.policy')}</td>
                                        <td className="py-3 font-mono text-sm">
                                            {result.bundle.policyId}@{result.bundle.policyVersion}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold">{t('field.decision')}</td>
                                        <td className="py-3">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${result.bundle.decision === 'ALLOW'
                                                        ? 'bg-success text-white'
                                                        : result.bundle.decision === 'DENY'
                                                            ? 'bg-error text-white'
                                                            : 'bg-amber-500 text-white'
                                                    }`}
                                            >
                                                {result.bundle.decision}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold">{t('field.intentHash')}</td>
                                        <td className="py-3 flex items-center gap-2">
                                            <code className="text-sm">{truncateHash(result.bundle.intentHash)}</code>
                                            <button
                                                onClick={() => copyToClipboard(result.bundle!.intentHash, 'intentHash')}
                                                className="text-primary hover:text-primary-700 text-sm font-medium"
                                            >
                                                {copiedField === 'intentHash' ? t('copied') : t('copy')}
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold">{t('field.ledgerHash')}</td>
                                        <td className="py-3 flex items-center gap-2">
                                            <code className="text-sm">{truncateHash(result.bundle.ledgerHash)}</code>
                                            <button
                                                onClick={() => copyToClipboard(result.bundle!.ledgerHash, 'ledgerHash')}
                                                className="text-primary hover:text-primary-700 text-sm font-medium"
                                            >
                                                {copiedField === 'ledgerHash' ? t('copied') : t('copy')}
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold">{t('field.signature')}</td>
                                        <td className="py-3 flex items-center gap-2">
                                            <code className="text-sm">{truncateHash(result.bundle.signature)}</code>
                                            <button
                                                onClick={() => copyToClipboard(result.bundle!.signature, 'signature')}
                                                className="text-primary hover:text-primary-700 text-sm font-medium"
                                            >
                                                {copiedField === 'signature' ? t('copied') : t('copy')}
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold">{t('field.issuedAt')}</td>
                                        <td className="py-3 font-mono text-sm">
                                            {new Date(result.bundle.issuedAt).toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold">{t('field.authority')}</td>
                                        <td className="py-3 font-mono text-sm">{result.bundle.authorityId}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
