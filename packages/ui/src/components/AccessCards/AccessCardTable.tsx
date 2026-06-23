import { Table, Badge, Text, Group, ActionIcon, Tooltip } from "@mantine/core";
import { AccessCard, CardStatus } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import {
  IconHistory,
  IconArrowBackUp,
  IconUserShare,
  IconAlertTriangle,
  IconTool,
  IconRefresh,
} from "@tabler/icons-react";
import { EmptyState } from "../EmptyState";
import classes from "../Table/table.module.css";

interface AccessCardTableProps {
  data: AccessCard[];
  onIssue?: (card: AccessCard) => void;
  onReturn?: (card: AccessCard) => void;
  onMarkLost?: (card: AccessCard) => void;
  onMarkBroken?: (card: AccessCard) => void;
  onReinstate?: (card: AccessCard) => void;
  onShowLogs?: (card: AccessCard) => void;
}

export function AccessCardTable({
  data,
  onIssue,
  onReturn,
  onMarkLost,
  onMarkBroken,
  onReinstate,
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
      case CardStatus.BROKEN:
        return "orange";
      case CardStatus.VOID:
        return "gray";
      default:
        return "gray";
    }
  };

  const rows = data.map((card) => (
    <Table.Tr key={card.id}>
      <Table.Td fw={600}>#{card.cardNumber}</Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(card.status)} variant="light">
          {t(`card_status_enum.${card.status}`, card.status)}
        </Badge>
      </Table.Td>
      <Table.Td>
        {card.holderName || card.currentHolderId ? (
          <Text size="sm">{card.holderName ?? card.currentHolderId}</Text>
        ) : (
          <Text size="sm" c="dimmed">
            —
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
          {card.status === CardStatus.ACTIVE && onMarkLost && (
            <Tooltip label={t("mark_lost", "Mark as Lost")}>
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => onMarkLost(card)}
              >
                <IconAlertTriangle size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {card.status === CardStatus.ACTIVE && onMarkBroken && (
            <Tooltip label={t("mark_broken", "Mark as Broken")}>
              <ActionIcon
                variant="subtle"
                color="orange"
                onClick={() => onMarkBroken(card)}
              >
                <IconTool size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {(card.status === CardStatus.LOST ||
            card.status === CardStatus.BROKEN ||
            card.status === CardStatus.VOID) &&
            onReinstate && (
              <Tooltip label={t("reinstate_card", "Reinstate Card")}>
                <ActionIcon
                  variant="subtle"
                  color="green"
                  onClick={() => onReinstate(card)}
                >
                  <IconRefresh size={16} />
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
    <Table highlightOnHover>
      <Table.Thead className={classes.thead}>
        <Table.Tr>
          <Table.Th className={classes.th}>{t("card_number")}</Table.Th>
          <Table.Th className={classes.th}>{t("status")}</Table.Th>
          <Table.Th className={classes.th}>{t("current_holder")}</Table.Th>
          <Table.Th className={classes.th} style={{ width: 100 }} />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
        {data.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={4} style={{ padding: 0 }}>
              <EmptyState
                title={t("no_cards_found", { defaultValue: "No cards found" })}
              />
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
