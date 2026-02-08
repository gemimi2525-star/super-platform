import { complianceEngine } from './coreos/brain/compliance';

async function verifyLocale() {
    console.log('🗣️ Verifying Locale Switch (Phase 32A)...');

    complianceEngine.setCountry('TH');
    if (complianceEngine.getLocale() !== 'th-TH') throw new Error('Locale TH failed');
    console.log('TH Locale: OK');

    complianceEngine.setCountry('US');
    if (complianceEngine.getLocale() !== 'en-US') throw new Error('Locale US failed');
    console.log('US Locale: OK');

    console.log('✅ Locale Governance Verified');
}

verifyLocale().catch(console.error);
