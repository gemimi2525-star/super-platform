import { trustObservatory } from './coreos/brain/observability';

async function verifyEvidence() {
    console.log('📦 Verifying Evidence Pack (Phase 33A)...');

    const history = [
        'User Input: "Create Invoice"',
        'AI Proposal: "Draft #123"',
        'Human Review: "Approved"'
    ];

    const pack = trustObservatory.generateEvidencePack('trace-001', history);
    console.log('Generated Pack:', pack);

    if (!pack.metricsSnapshot) throw new Error('Missing metrics in pack');
    if (pack.finalVerdict !== 'GENERATED_BY_TRUST_OBSERVATORY') throw new Error('Invalid pack signature');

    console.log('✅ Evidence Pack Generated Successfully');
}

verifyEvidence().catch(console.error);
