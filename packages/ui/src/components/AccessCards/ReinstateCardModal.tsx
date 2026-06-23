import {
  Modal,
  Stack,
  Text,
  Textarea,
  Group,
  Button,
  Alert,
} from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessCard } from "@domas/ts-types";
import { IconRefresh } from "@tabler/icons-react";

interface ReinstateCardModalProps {
  opened: boolean;
  onClose: () => void;
  card: AccessCard | null;
  loading?: boolean;
  onConfirm: (notes?: string) => Promise<void>;
}

export function ReinstateCardModal({
  opened,
  onClose,
  card,
  loading,
  onConfirm,
}: ReinstateCardModalProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState("");

  const handleClose = () => {
    setNotes("");
    onClose();
  };

  const handleConfirm = async () => {
    await onConfirm(notes || undefined);
    setNotes("");
  };

  if (!card) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("reinstate_card", "Reinstate Card")}
      size="sm"
    >
      <Stack gap="md">
        <Alert icon={<IconRefresh size={16} />} color="green">
          {t("reinstate_card_warning", {
            defaultValue:
              "Card #{{cardNumber}} (currently {{status}}) will be reinstated and made available for reuse.",
            cardNumber: card.cardNumber,
            status: card.status,
          })}
        </Alert>

        <Textarea
          label={t("notes_optional", "Notes (optional)")}
          placeholder={t(
            "reinstate_notes_placeholder",
            "Reason for reinstatement...",
          )}
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          rows={3}
        />

        <Text size="xs" c="dimmed">
          {t(
            "reinstate_card_note",
            "This action requires elevated privileges. The card number will be available for reissue.",
          )}
        </Text>

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button color="green" loading={loading} onClick={handleConfirm}>
            {t("confirm_reinstate", "Confirm Reinstate")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
