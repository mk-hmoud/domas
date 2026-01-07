import { useState } from "react";
import { Button, Modal, Text, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface ConfirmDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
}

export function ConfirmDeleteModal({
  opened,
  onClose,
  onConfirm,
  title,
  message,
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <Text size="sm">{message}</Text>
      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onClose} disabled={loading}>
          {t("cancel")}
        </Button>
        <Button color="red" onClick={handleConfirm} loading={loading}>
          {t("confirm")}
        </Button>
      </Group>
    </Modal>
  );
}
