import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Image,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@domas/ui';
import { IconCamera, IconPhoto, IconX } from '@tabler/icons-react';
import { TicketCategory, CreateTicketDto } from '@domas/ts-types';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTicketDto, photos: File[]) => Promise<void>;
}

export function CreateTicketModal({ opened, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<TicketCategory | null>(TicketCategory.MAINTENANCE);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setCategory(TicketCategory.MAINTENANCE);
    setTitle('');
    setDescription('');
    setPhotos([]);
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const remaining = 5 - photos.length;
    const toAdd = allowed.slice(0, remaining);
    setPhotos((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!category || title.trim().length === 0 || description.trim().length < 5) return;
    setSubmitting(true);
    try {
      await onSubmit({ category, title, description }, photos);
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

        {/* Photo section */}
        <Box>
          <Text size="sm" fw={500} mb={6}>
            {t('portal.ticket_photos_label', 'Photos')}
            <Text component="span" size="xs" c="dimmed" ml={6}>
              {t('portal.ticket_photos_hint', '(optional, up to 5)')}
            </Text>
          </Text>

          {previews.length > 0 && (
            <SimpleGrid cols={3} spacing="xs" mb="xs">
              {previews.map((url, i) => (
                <Box key={i} style={{ position: 'relative' }}>
                  <Image
                    src={url}
                    radius="md"
                    h={90}
                    fit="cover"
                    style={{ border: '1px solid var(--mantine-color-default-border)' }}
                  />
                  <ActionIcon
                    size="xs"
                    color="red"
                    variant="filled"
                    radius="xl"
                    style={{ position: 'absolute', top: 4, right: 4 }}
                    onClick={() => removePhoto(i)}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                </Box>
              ))}
            </SimpleGrid>
          )}

          {photos.length < 5 && (
            <Group gap="xs">
              {/* Camera capture — mobile opens rear camera directly */}
              <Button
                size="xs"
                variant="light"
                radius="lg"
                leftSection={<IconCamera size={14} />}
                onClick={() => cameraInputRef.current?.click()}
              >
                {t('portal.ticket_take_photo', 'Take photo')}
              </Button>
              {/* File picker — gallery / file browser */}
              <Button
                size="xs"
                variant="subtle"
                radius="lg"
                leftSection={<IconPhoto size={14} />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('portal.ticket_choose_photo', 'Choose from gallery')}
              </Button>
            </Group>
          )}

          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => addFiles(e.target.files)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => addFiles(e.target.files)}
          />
        </Box>

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
