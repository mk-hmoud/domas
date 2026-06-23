import {
  Modal,
  Stack,
  Text,
  Checkbox,
  Select,
  Group,
  Button,
  Alert,
} from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessCard, CardBatch } from "@domas/ts-types";
import { IconTool } from "@tabler/icons-react";

interface ReportBrokenCardModalProps {
  opened: boolean;
  onClose: () => void;
  card: AccessCard | null;
  batches: CardBatch[];
  loading?: boolean;
  onConfirm: (issueReplacement: boolean, batchId?: number) => Promise<void>;
}

export function ReportBrokenCardModal({
  opened,
  onClose,
  card,
  batches,
  loading,
  onConfirm,
}: ReportBrokenCardModalProps) {
  const { t } = useTranslation();
  const [issueReplacement, setIssueReplacement] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);

  const handleClose = () => {
    setIssueReplacement(false);
    setBatchId(null);
    onClose();
  };

  const handleConfirm = async () => {
    await onConfirm(issueReplacement, batchId ? Number(batchId) : undefined);
    setIssueReplacement(false);
    setBatchId(null);
  };

  if (!card) return null;

  const batchOptions = batches.map((b) => ({
    value: b.id.toString(),
    label: b.name,
  }));

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("report_broken_card", "Report Broken Card")}
      size="sm"
    >
      <Stack gap="md">
        <Alert icon={<IconTool size={16} />} color="orange">
          {t("report_broken_card_warning", {
            defaultValue:
              "Card #{{cardNumber}} will be marked as broken and quarantined until a supervisor reinstates it.",
            cardNumber: card.cardNumber,
          })}
        </Alert>

        {card.holderName && (
          <Text size="sm">
            <Text span fw={500}>
              {t("current_holder", "Current holder")}:{" "}
            </Text>
            {card.holderName}
          </Text>
        )}

        {card.currentBookingId && (
          <Checkbox
            label={t("issue_replacement_card", "Issue a replacement card")}
            checked={issueReplacement}
            onChange={(e) => setIssueReplacement(e.currentTarget.checked)}
          />
        )}

        {issueReplacement && card.currentBookingId && (
          <Select
            label={t("card_batch_optional", "Card batch (optional)")}
            placeholder={t("any_available_batch", "Any available batch")}
            data={batchOptions}
            value={batchId}
            onChange={setBatchId}
            clearable
          />
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button color="orange" loading={loading} onClick={handleConfirm}>
            {t("confirm_broken", "Confirm Broken")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
