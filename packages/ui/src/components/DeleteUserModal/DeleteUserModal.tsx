import { useState } from "react";
import { Button, Modal, Text, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { User } from "@domas/ts-types";

interface DeleteUserModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (user: User) => Promise<void>;
  user: User | null;
}

export function DeleteUserModal({
  opened,
  onClose,
  onConfirm,
  user,
}: DeleteUserModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await onConfirm(user);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("delete_user_title")}>
      <Text size="sm">{t("delete_user_message", { email: user?.email })}</Text>
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
