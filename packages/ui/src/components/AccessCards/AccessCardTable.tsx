import { Table, Badge, Text, Group, ActionIcon, Tooltip } from "@mantine/core";
import { AccessCard, CardStatus } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import {
  IconHistory,
  IconArrowBackUp,
  IconUserShare,
} from "@tabler/icons-react";

interface AccessCardTableProps {
  data: AccessCard[];
  onIssue?: (card: AccessCard) => void;
  onReturn?: (card: AccessCard) => void;
  onShowLogs?: (card: AccessCard) => void;
}

export function AccessCardTable({
  data,
  onIssue,
  onReturn,
  onShowLogs,
}: AccessCardTableProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: CardStatus) => {
    switch (status) {
      case CardStatus.AVAILABLE:
        return "green";
      case CardStatus.ACTIVE:
        return "blue";
      case CardStatus.LOST:
        return "red";
      case CardStatus.VOID:
        return "orange";
      default:
        return "gray";
    }
  };

  const rows = data.map((card) => (
    <Table.Tr key={card.id}>
      <Table.Td fw={700}>#{card.cardNumber}</Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(card.status)} variant="light">
          {t(`card_status_enum.${card.status}`, card.status)}
        </Badge>
      </Table.Td>
      <Table.Td>
        {card.currentHolderId ? (
          <Text size="sm">{card.currentHolderId}</Text>
        ) : (
          <Text size="sm" c="dimmed">
            -
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end">
          {card.status === CardStatus.AVAILABLE && onIssue && (
            <Tooltip label={t("issue_card")}>
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => onIssue(card)}
              >
                <IconUserShare size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {card.status === CardStatus.ACTIVE && onReturn && (
            <Tooltip label={t("return_card")}>
              <ActionIcon
                variant="subtle"
                color="green"
                onClick={() => onReturn(card)}
              >
                <IconArrowBackUp size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {onShowLogs && (
            <Tooltip label={t("card_logs")}>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => onShowLogs(card)}
              >
                <IconHistory size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t("card_number")}</Table.Th>
          <Table.Th>{t("status")}</Table.Th>
          <Table.Th>{t("current_holder")}</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
        {data.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={4}>
              <Text ta="center" c="dimmed" py="xl">
                {t("no_cards_found", "No cards found.")}
              </Text>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
