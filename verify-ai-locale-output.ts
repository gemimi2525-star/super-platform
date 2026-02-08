import { toolRegistry } from './coreos/brain/registry';
import { complianceEngine } from './coreos/brain/compliance';

async function verifyAIOutput() {
    console.log('🤖 Verifying AI Locale Output (Phase 32.0A)...');

    // Set to TH
    await toolRegistry.executeTool('admin_set_country', { code: 'TH' }, { appId: 'system', correlationId: 'i18n-ai-th', userId: 'admin' });

    // Mock AI "Thought" Process consuming locale
    const rules = complianceEngine.getRules();
    console.log(`AI Context: ${rules.locale} (Tax: ${rules.taxName})`);

    // In a real scenario, the LLM prompt would injection "Reply in Thai".
    // Here we verify that the metadata returned by our tools is correctly localized.

    const res = await toolRegistry.executeTool('execute_create_accounting_draft', {
        sourceDoc: 'doc.pdf', data: { amount: 100 }
    }, { appId: 'tenant-corp', correlationId: 'ai-th-1', userId: 'ai' });

    console.log('AI Draft Result:', res.localizedInfo);

    if (res.localizedInfo.taxName !== 'VAT') {
        throw new Error('AI failed to use TH Tax Name');
    }

    // Simulate AI Text Generation check
    const aiTextHelper = (locale: string) => locale === 'th-TH' ? 'แบบร่างบัญชี' : 'Accounting Draft';
    const outputText = aiTextHelper(rules.locale);

    if (outputText !== 'แบบร่างบัญชี') throw new Error('AI Output language mismatch');
    console.log(`✅ AI Output Correct: "${outputText}" for ${rules.locale}`);
}

verifyAIOutput().catch(console.error);
