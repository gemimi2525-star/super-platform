import { complianceEngine } from './coreos/brain/compliance';

async function verifyUIi18n() {
    console.log('🌐 Verifying System UI i18n (Phase 32.0A)...');

    // 1. Switch to TH
    complianceEngine.setCountry('TH');
    const localeTH = complianceEngine.getLocale();
    console.log(`System switched to: ${localeTH}`);

    if (localeTH !== 'th-TH') throw new Error('Failed to set TH locale');

    // Simulate UI String Lookup (Mock)
    const uiStrings = {
        'th-TH': { 'welcome': 'ยินดีต้อนรับ', 'logout': 'ออกจากระบบ' },
        'en-US': { 'welcome': 'Welcome', 'logout': 'Logout' }
    };

    const currentUI = uiStrings[localeTH as keyof typeof uiStrings];
    if (currentUI?.welcome !== 'ยินดีต้อนรับ') throw new Error('UI Text not consistent with TH');
    console.log('✅ UI Text Match (TH):', currentUI);

    // 2. Switch to US
    complianceEngine.setCountry('US');
    const localeUS = complianceEngine.getLocale();
    console.log(`System switched to: ${localeUS}`);

    if (localeUS !== 'en-US') throw new Error('Failed to set US locale');

    const currentUI_US = uiStrings[localeUS as keyof typeof uiStrings];
    if (currentUI_US?.welcome !== 'Welcome') throw new Error('UI Text not consistent with US');
    console.log('✅ UI Text Match (US):', currentUI_US);
}

verifyUIi18n().catch(console.error);
