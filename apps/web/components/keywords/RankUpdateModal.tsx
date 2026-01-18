'use client';

/**
 * RankUpdateModal Component
 * Modal for manually updating keyword ranking
 */

import { useState } from 'react';
import { Modal, ModalFooter, Button, FormGroup, Input, Textarea } from '@platform/ui-kit';
import { useTranslations } from 'next-intl';
import { useAddRankEntry, useLogAudit } from '@modules/seo';
import { useAuthStore } from '@/lib/stores/authStore';
import type { Keyword } from '@modules/seo';

export interface RankUpdateModalProps {
    open: boolean;
    keyword: Keyword | null;
    organizationId: string;
    onClose: () => void;
}

export function RankUpdateModal({
    open,
    keyword,
    organizationId,
    onClose
}: RankUpdateModalProps) {
    const t = useTranslations();
    const addRankEntry = useAddRankEntry();
    const authStore = useAuthStore();

    const [rank, setRank] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ rank?: string; date?: string }>({});

    // Reset when modal opens
    // Note: We don't use useEffect here to avoid overwriting user input on re-renders, 
    // but typically we'd reset when 'open' changes to true. 
    // For simplicity, we assume parent controls unmounting or we just init state.

    const validate = (): boolean => {
        const newErrors: { rank?: string; date?: string } = {};

        if (!rank) {
            newErrors.rank = t('seo.ranks.validation.rankRequired');
        } else {
            const num = parseInt(rank);
            if (isNaN(num) || num < 1 || num > 100) {
                newErrors.rank = t('seo.ranks.validation.rankInvalid');
            }
        }

        if (!date) {
            newErrors.date = t('seo.ranks.validation.dateRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const logAudit = useLogAudit();

    // ...

    const handleSubmit = async () => {
        if (!keyword || !validate()) return;

        setIsSubmitting(true);
        try {
            await addRankEntry.mutateAsync({
                organizationId,
                keywordId: keyword.id,
                rank: parseInt(rank),
                date,
                note: note.trim() || undefined
            });

            // Audit Log
            logAudit.mutate({
                organizationId,
                actor: { userId: authStore.firebaseUser?.uid || '' },
                action: 'rank.create',
                entity: { type: 'rank', id: keyword.id, name: `#${rank}` }
            });

            // Reset and close
            setRank('');
            setNote('');
            setDate(new Date().toISOString().split('T')[0]);
            onClose();
        } catch (error) {
            console.error('Failed to update rank', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={t('seo.ranks.modal.title')}
            size="sm"
        >
            <div className="space-y-4">
                <div className="mb-4">
                    <p className="text-sm text-gray-500">{t('seo.keywords.term')}:</p>
                    <p className="font-semibold text-gray-900">{keyword?.term}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormGroup
                        label={t('seo.ranks.modal.rankLabel')}
                        required
                        error={errors.rank}
                    >
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={rank}
                            onChange={(e) => setRank(e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup
                        label={t('seo.ranks.modal.dateLabel')}
                        required
                        error={errors.date}
                    >
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </FormGroup>
                </div>

                <FormGroup
                    label={t('seo.ranks.modal.noteLabel')}
                >
                    <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t('seo.ranks.modal.notePlaceholder')}
                        rows={3}
                    />
                </FormGroup>
            </div>

            <ModalFooter>
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                >
                    {t('seo.ranks.modal.saveButton')}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
