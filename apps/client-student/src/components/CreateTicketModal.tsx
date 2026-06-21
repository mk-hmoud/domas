import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Group, Modal, Select, Stack, TextInput, Textarea } from '@domas/ui';
import { TicketCategory, CreateTicketDto } from '@domas/ts-types';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTicketDto) => Promise<void>;
}

export function CreateTicketModal({ opened, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<TicketCategory | null>(TicketCategory.MAINTENANCE);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCategory(TicketCategory.MAINTENANCE);
    setTitle('');
    setDescription('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!category || title.trim().length === 0 || description.trim().length < 5) return;
    setSubmitting(true);
    try {
      await onSubmit({ category, title, description });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!category && title.trim().length > 0 && description.trim().length >= 5;

  return (
    <Modal opened={opened} onClose={handleClose} title={t('portal.ticket_modal_title')} size="lg">
      <Stack gap="md">
        <Select
          label={t('portal.ticket_category_label')}
          data={Object.values(TicketCategory).map((c) => ({
            value: c,
            label: t(`ticket_category.${c}`),
          }))}
          value={category}
          onChange={(val) => setCategory(val as TicketCategory)}
          radius="lg"
        />

        <TextInput
          label={t('portal.ticket_title_label')}
          placeholder={t('portal.ticket_title_placeholder')}
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          radius="lg"
        />

        <Textarea
          label={t('portal.ticket_description_label')}
          placeholder={t('portal.ticket_description_placeholder')}
          minRows={4}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          radius="lg"
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="default" radius="xl" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button
            radius="xl"
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            disabled={!canSubmit}
            loading={submitting}
            onClick={handleSubmit}
          >
            {t('portal.ticket_submit')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
