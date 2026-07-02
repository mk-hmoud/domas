import { useEffect, useState } from "react";
import { PageHeader, PageShell, EmptyState, LabelValue } from "@domas/ui";
import tableClasses from "../tableClasses.module.css";
import {
  Table,
  Badge,
  Tabs,
  Card,
  Paper,
  Text,
  Group,
  Select,
  ActionIcon,
  Tooltip,
  Code,
  ScrollArea,
  SegmentedControl,
  TextInput,
  SimpleGrid,
  MultiSelect,
  Pagination,
  LoadingOverlay,
  Drawer,
  Stack,
  Divider,
} from "@mantine/core";
import {
  IconDatabase,
  IconUser,
  IconTable,
  IconSearch,
  IconFilter,
  IconCalendar,
  IconClock,
  IconRefresh,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { audit } from "@domas/api-client";
import { BulkOperation, PaginatedResult, AuditLogEntry } from "@domas/ts-types";
import { notifications } from "@mantine/notifications";

export function SharedAuditLogsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>("search");
  const [loading, setLoading] = useState(false);

  // Search tab
  const [searchResults, setSearchResults] = useState<
    PaginatedResult<AuditLogEntry>
  >({ data: [], total: 0, page: 1, limit: 50 });
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<string>("50");
  const [datePreset, setDatePreset] = useState<string>("this_week");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableNameFilter, setTableNameFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedTableName, setDebouncedTableName] = useState("");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Bulk operations tab
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [selectedBulkOp, setSelectedBulkOp] = useState<BulkOperation | null>(
    null,
  );
  const [bulkDetailLogs, setBulkDetailLogs] = useState<AuditLogEntry[]>([]);
  const [bulkDetailLoading, setBulkDetailLoading] = useState(false);

  useEffect(() => {
    applyDatePreset("this_week");
  }, []);

  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(h);
  }, [searchQuery]);

  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedTableName(tableNameFilter);
      setPage(1);
    }, 300);
    return () => clearTimeout(h);
  }, [tableNameFilter]);

  // Fetch individual entries when a bulk op is selected
  useEffect(() => {
    if (!selectedBulkOp) {
      setBulkDetailLogs([]);
      return;
    }
    const fetchDetail = async () => {
      setBulkDetailLoading(true);
      try {
        const result = await audit.search({
          operationContext: selectedBulkOp.op_id,
          limit: 200,
          page: 1,
        });
        setBulkDetailLogs(result.data);
      } catch {
        // silent — drawer shows empty state
      } finally {
        setBulkDetailLoading(false);
      }
    };
    fetchDetail();
  }, [selectedBulkOp]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const limitNum = parseInt(limit);
      if (activeTab === "search") {
        const formattedEndDate = dateRange.end
          ? `${dateRange.end}T23:59:59`
          : undefined;
        const result = await audit.search({
          page,
          limit: limitNum,
          startDate: dateRange.start || undefined,
          endDate: formattedEndDate,
          actions: selectedActions.length > 0 ? selectedActions : undefined,
          search: debouncedSearch || undefined,
          tableName: debouncedTableName || undefined,
        });
        setSearchResults(result);
      } else if (activeTab === "bulk") {
        const data = await audit.getBulkOperations(200);
        setBulkOperations(data);
      }
    } catch {
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    activeTab,
    page,
    limit,
    dateRange,
    selectedActions,
    debouncedSearch,
    debouncedTableName,
  ]);

  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case "today":
        start = today;
        break;
      case "yesterday":
        start = new Date(today);
        start.setDate(today.getDate() - 1);
        end = new Date(today);
        end.setDate(today.getDate() - 1);
        break;
      case "this_week": {
        const day = today.getDay() || 7;
        start = new Date(today);
        if (day !== 1) start.setHours(-24 * (day - 1));
        break;
      }
      case "this_month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "all":
        setDateRange({ start: "", end: "" });
        setPage(1);
        return;
      default:
        return;
    }

    setDateRange({
      start: toLocalDateString(start),
      end: toLocalDateString(end),
    });
    setPage(1);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-GB");

  const getActionColor = (action?: string) => {
    switch (action) {
      case "I":
        return "green";
      case "U":
        return "blue";
      case "D":
        return "red";
      case "T":
        return "orange";
      default:
        return "gray";
    }
  };

  const getActionLabel = (action?: string) => {
    switch (action) {
      case "I":
        return t("audit.actions.insert", { defaultValue: "Insert" });
      case "U":
        return t("audit.actions.update", { defaultValue: "Update" });
      case "D":
        return t("audit.actions.delete", { defaultValue: "Delete" });
      case "T":
        return t("audit.actions.truncate", { defaultValue: "Truncate" });
      default:
        return action;
    }
  };

  const renderFieldValue = (val: unknown): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const renderDrawerContent = (log: AuditLogEntry) => {
    if (log.action === "U") {
      const changedFields = log.changed_fields ?? [];
      const oldVals = log.old_values ?? {};
      const newVals = log.new_values ?? {};
      const allFields = Array.from(
        new Set([...Object.keys(oldVals), ...Object.keys(newVals)]),
      );
      const displayFields =
        changedFields.length > 0 ? changedFields : allFields;
      const unchangedFields = allFields.filter(
        (f) => !displayFields.includes(f),
      );

      return (
        <Stack gap="sm">
          <Text fw={600} size="sm">
            {t("audit.changed_fields", { defaultValue: "Changed Fields" })}
          </Text>
          <Paper withBorder radius="md">
            <Table fz="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    {t("audit.field", { defaultValue: "Field" })}
                  </Table.Th>
                  <Table.Th c="red">
                    {t("audit.before", { defaultValue: "Before" })}
                  </Table.Th>
                  <Table.Th c="green">
                    {t("audit.after", { defaultValue: "After" })}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {displayFields.map((field) => (
                  <Table.Tr key={field}>
                    <Table.Td w={160}>
                      <Code>{field}</Code>
                    </Table.Td>
                    <Table.Td c="red" style={{ wordBreak: "break-all" }}>
                      {renderFieldValue(oldVals[field])}
                    </Table.Td>
                    <Table.Td c="green" style={{ wordBreak: "break-all" }}>
                      {renderFieldValue(newVals[field])}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>

          {unchangedFields.length > 0 && changedFields.length > 0 && (
            <>
              <Text fw={600} size="sm" c="dimmed" mt="xs">
                {t("audit.context_fields", {
                  defaultValue: "Context (unchanged)",
                })}
              </Text>
              <Paper withBorder radius="md">
                <Table fz="xs">
                  <Table.Tbody>
                    {unchangedFields.map((field) => (
                      <Table.Tr key={field}>
                        <Table.Td w={160} c="dimmed">
                          <Code>{field}</Code>
                        </Table.Td>
                        <Table.Td c="dimmed" style={{ wordBreak: "break-all" }}>
                          {renderFieldValue(newVals[field])}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </>
          )}
        </Stack>
      );
    }

    const values =
      log.action === "I" ? (log.new_values ?? {}) : (log.old_values ?? {});
    const accentColor = log.action === "I" ? "green" : "red";
    const label =
      log.action === "I"
        ? t("audit.new_data", { defaultValue: "New Data" })
        : t("audit.deleted_data", { defaultValue: "Deleted Data" });

    return (
      <Stack gap="sm">
        <Text fw={600} size="sm" c={accentColor}>
          {label}
        </Text>
        <Paper withBorder radius="md">
          <Table fz="sm">
            <Table.Tbody>
              {Object.entries(values).map(([key, val]) => (
                <Table.Tr key={key}>
                  <Table.Td w={160}>
                    <Code>{key}</Code>
                  </Table.Td>
                  <Table.Td style={{ wordBreak: "break-all" }}>
                    {renderFieldValue(val)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    );
  };

  const ChangedFieldsBadges = ({ fields }: { fields?: string[] }) => (
    <Group gap={4}>
      {fields?.slice(0, 3).map((f) => (
        <Badge key={f} size="sm" variant="outline" color="gray">
          {f}
        </Badge>
      ))}
      {fields && fields.length > 3 && (
        <Badge size="sm" variant="outline" color="gray">
          +{fields.length - 3}
        </Badge>
      )}
    </Group>
  );

  return (
    <>
      <PageHeader
        title={t("nav.audit_logs", { defaultValue: "Audit Logs" })}
        actions={
          <Group gap="sm">
            <Select
              label={t("audit.rows_per_page", {
                defaultValue: "Rows per page",
              })}
              value={limit}
              onChange={(val) => {
                setLimit(val || "50");
                setPage(1);
              }}
              data={["20", "50", "100", "200"]}
              w={130}
            />
            <Tooltip label={t("refresh", { defaultValue: "Refresh" })}>
              <ActionIcon
                variant="default"
                size="lg"
                mt={24}
                onClick={fetchData}
                loading={loading}
              >
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        }
      />
      <PageShell size="xl">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
              {t("audit.search_logs", { defaultValue: "Search Logs" })}
            </Tabs.Tab>
            <Tabs.Tab value="bulk" leftSection={<IconDatabase size={16} />}>
              {t("audit.bulk_operations", { defaultValue: "Bulk Operations" })}
            </Tabs.Tab>
          </Tabs.List>

          {/* ── SEARCH TAB ─────────────────────────────────────────── */}
          <Tabs.Panel value="search">
            <Card withBorder padding="md" radius="md" mb="md">
              <Text fw={600} mb="sm" c="dimmed">
                {t("audit.filters", { defaultValue: "Filters" })}
              </Text>
              <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="md">
                <TextInput
                  placeholder={t("audit.search_placeholder", {
                    defaultValue: "Search by username or context…",
                  })}
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                />
                <TextInput
                  placeholder={t("audit.table_filter_placeholder", {
                    defaultValue: "Filter by table name…",
                  })}
                  leftSection={<IconTable size={16} />}
                  value={tableNameFilter}
                  onChange={(e) => setTableNameFilter(e.currentTarget.value)}
                />
                <MultiSelect
                  placeholder={t("audit.filter_by_action", {
                    defaultValue: "Filter by Action",
                  })}
                  data={[
                    {
                      value: "I",
                      label: t("audit.actions.insert", {
                        defaultValue: "Insert",
                      }),
                    },
                    {
                      value: "U",
                      label: t("audit.actions.update", {
                        defaultValue: "Update",
                      }),
                    },
                    {
                      value: "D",
                      label: t("audit.actions.delete", {
                        defaultValue: "Delete",
                      }),
                    },
                  ]}
                  value={selectedActions}
                  onChange={(val) => {
                    setSelectedActions(val);
                    setPage(1);
                  }}
                  leftSection={<IconFilter size={16} />}
                />
                <Group gap="xs" grow>
                  <TextInput
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }));
                      setDatePreset("custom");
                      setPage(1);
                    }}
                    leftSection={<IconCalendar size={16} />}
                  />
                  <TextInput
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange((prev) => ({
                        ...prev,
                        end: e.target.value,
                      }));
                      setDatePreset("custom");
                      setPage(1);
                    }}
                  />
                </Group>
              </SimpleGrid>
              <Group mt="md">
                <SegmentedControl
                  value={datePreset}
                  onChange={applyDatePreset}
                  size="xs"
                  data={[
                    {
                      label: t("audit.presets.all", { defaultValue: "All" }),
                      value: "all",
                    },
                    {
                      label: t("audit.presets.today", {
                        defaultValue: "Today",
                      }),
                      value: "today",
                    },
                    {
                      label: t("audit.presets.this_week", {
                        defaultValue: "This Week",
                      }),
                      value: "this_week",
                    },
                    {
                      label: t("audit.presets.this_month", {
                        defaultValue: "This Month",
                      }),
                      value: "this_month",
                    },
                  ]}
                />
              </Group>
            </Card>

            <Paper withBorder radius="md" style={{ position: "relative" }}>
              <LoadingOverlay visible={loading} />
              <ScrollArea>
                <Table highlightOnHover>
                  <Table.Thead className={tableClasses.thead}>
                    <Table.Tr>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.timestamp", { defaultValue: "Timestamp" })}
                      </Table.Th>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.user", { defaultValue: "User" })}
                      </Table.Th>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.table", { defaultValue: "Table" })}
                      </Table.Th>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.action", { defaultValue: "Action" })}
                      </Table.Th>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.context", { defaultValue: "Context" })}
                      </Table.Th>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.changed_fields", {
                          defaultValue: "Changed Fields",
                        })}
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {searchResults.data.map((log, index) => (
                      <Table.Tr
                        key={index}
                        onClick={() => setSelectedLog(log)}
                        style={{ cursor: "pointer" }}
                      >
                        <Table.Td style={{ whiteSpace: "nowrap" }}>
                          <Group gap={4}>
                            <IconClock
                              size={14}
                              color="var(--mantine-color-gray-5)"
                            />
                            <Text size="sm">
                              {formatDate(log.event_timestamp)}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <IconUser
                              size={14}
                              color="var(--mantine-color-gray-5)"
                            />
                            <Text size="sm" fw={500}>
                              {log.username || "System"}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Code>{log.table_name}</Code>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={getActionColor(log.action)}
                            variant="light"
                          >
                            {getActionLabel(log.action)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {log.operation_context && (
                            <Badge
                              size="sm"
                              variant="dot"
                              color="violet"
                              style={{ maxWidth: 180 }}
                            >
                              <Text size="xs" truncate>
                                {log.operation_context}
                              </Text>
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <ChangedFieldsBadges
                            fields={log.changed_fields ?? undefined}
                          />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
              {searchResults.data.length === 0 && !loading && (
                <EmptyState
                  title={t("audit.no_logs_found", {
                    defaultValue: "No audit logs found matching criteria",
                  })}
                />
              )}
              <Group justify="flex-end" mt="md" p="sm">
                <Pagination
                  total={Math.ceil(searchResults.total / parseInt(limit))}
                  value={page}
                  onChange={setPage}
                />
              </Group>
            </Paper>
          </Tabs.Panel>

          {/* ── BULK OPERATIONS TAB ────────────────────────────────── */}
          <Tabs.Panel value="bulk">
            <Paper withBorder radius="md" style={{ position: "relative" }}>
              <LoadingOverlay visible={loading} />
              <ScrollArea>
                <Table highlightOnHover>
                  <Table.Thead className={tableClasses.thead}>
                    <Table.Tr>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.timestamp", { defaultValue: "Timestamp" })}
                      </Table.Th>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.user", { defaultValue: "User" })}
                      </Table.Th>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.resource", { defaultValue: "Resource" })}
                      </Table.Th>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.operation", { defaultValue: "Operation" })}
                      </Table.Th>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.context", { defaultValue: "Context" })}
                      </Table.Th>
                      <Table.Th className={tableClasses.th}>
                        {t("audit.affected", { defaultValue: "Affected" })}
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {bulkOperations.map((op, index) => (
                      <Table.Tr
                        key={index}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedBulkOp(op)}
                      >
                        <Table.Td style={{ whiteSpace: "nowrap" }}>
                          <Group gap={4}>
                            <IconClock
                              size={14}
                              color="var(--mantine-color-gray-5)"
                            />
                            <Text size="sm">
                              {formatDate(op.event_timestamp)}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <IconUser
                              size={14}
                              color="var(--mantine-color-gray-5)"
                            />
                            <Text size="sm" fw={500}>
                              {op.username}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Code>{op.resource_type}</Code>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={getActionColor(op.operation_type)}
                            variant="light"
                          >
                            {getActionLabel(op.operation_type)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            size="xs"
                            c="dimmed"
                            style={{ maxWidth: 220 }}
                            truncate
                          >
                            {op.op_id}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="blue" variant="filled" size="sm">
                            {op.affected_count}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
              {bulkOperations.length === 0 && !loading && (
                <EmptyState
                  title={t("audit.no_bulk_operations", {
                    defaultValue: "No bulk operations found",
                  })}
                />
              )}
            </Paper>
          </Tabs.Panel>
        </Tabs>

        {/* ── LOG DETAIL DRAWER ──────────────────────────────────────── */}
        <Drawer
          opened={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={
            <Group>
              <Text fw={700} size="lg">
                {t("audit.log_details", { defaultValue: "Log Details" })}
              </Text>
              <Badge
                color={getActionColor(selectedLog?.action)}
                variant="light"
              >
                {getActionLabel(selectedLog?.action)}
              </Badge>
              <Code>{selectedLog?.table_name}</Code>
            </Group>
          }
          position="right"
          size="xl"
        >
          {selectedLog && (
            <Stack gap="md">
              <SimpleGrid cols={2}>
                <LabelValue label={t("audit.user", { defaultValue: "User" })}>
                  {selectedLog.username || "System"}
                </LabelValue>
                <LabelValue
                  label={t("audit.timestamp", { defaultValue: "Timestamp" })}
                >
                  {formatDate(selectedLog.event_timestamp)}
                </LabelValue>
                <LabelValue label={t("audit.table", { defaultValue: "Table" })}>
                  <Code>{selectedLog.table_name}</Code>
                </LabelValue>
                <LabelValue
                  label={t("audit.record_id", { defaultValue: "Record ID" })}
                >
                  <Code>{selectedLog.record_id}</Code>
                </LabelValue>
              </SimpleGrid>

              {selectedLog.operation_context && (
                <LabelValue
                  label={t("audit.context", { defaultValue: "Context" })}
                >
                  <Code>{selectedLog.operation_context}</Code>
                </LabelValue>
              )}

              {selectedLog.ip_address && (
                <LabelValue
                  label={t("audit.ip_address", { defaultValue: "IP Address" })}
                >
                  <Code>{selectedLog.ip_address}</Code>
                </LabelValue>
              )}

              <Divider />

              {renderDrawerContent(selectedLog)}

              {selectedLog.query_text && (
                <>
                  <Divider />
                  <LabelValue
                    label={t("audit.query", { defaultValue: "Query" })}
                  >
                    <Code block style={{ fontSize: 11 }}>
                      {selectedLog.query_text}
                    </Code>
                  </LabelValue>
                </>
              )}
            </Stack>
          )}
        </Drawer>

        {/* ── BULK DETAIL DRAWER ─────────────────────────────────────── */}
        <Drawer
          opened={!!selectedBulkOp}
          onClose={() => setSelectedBulkOp(null)}
          title={
            <Group>
              <Text fw={700} size="lg">
                {t("audit.bulk_detail", { defaultValue: "Bulk Operation" })}
              </Text>
              {selectedBulkOp && (
                <Badge color="blue" variant="filled">
                  {selectedBulkOp.affected_count}{" "}
                  {t("audit.records", { defaultValue: "records" })}
                </Badge>
              )}
            </Group>
          }
          position="right"
          size="xl"
        >
          {selectedBulkOp && (
            <Stack gap="md">
              <SimpleGrid cols={2}>
                <LabelValue label={t("audit.user", { defaultValue: "User" })}>
                  {selectedBulkOp.username}
                </LabelValue>
                <LabelValue
                  label={t("audit.timestamp", { defaultValue: "Timestamp" })}
                >
                  {formatDate(selectedBulkOp.event_timestamp)}
                </LabelValue>
                <LabelValue
                  label={t("audit.resource", { defaultValue: "Resource" })}
                >
                  <Code>{selectedBulkOp.resource_type}</Code>
                </LabelValue>
                <LabelValue
                  label={t("audit.operation", { defaultValue: "Operation" })}
                >
                  <Badge
                    color={getActionColor(selectedBulkOp.operation_type)}
                    variant="light"
                  >
                    {getActionLabel(selectedBulkOp.operation_type)}
                  </Badge>
                </LabelValue>
              </SimpleGrid>

              <Divider />

              <Text fw={600} size="sm">
                {t("audit.affected_records", {
                  defaultValue: "Affected Records",
                })}
              </Text>

              <Paper withBorder radius="md" style={{ position: "relative" }}>
                <LoadingOverlay
                  visible={bulkDetailLoading}
                  overlayProps={{ blur: 2 }}
                />
                <ScrollArea mah={500}>
                  <Table fz="sm" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>
                          {t("audit.record_id", { defaultValue: "Record ID" })}
                        </Table.Th>
                        <Table.Th>
                          {t("audit.action", { defaultValue: "Action" })}
                        </Table.Th>
                        <Table.Th>
                          {t("audit.changed_fields", {
                            defaultValue: "Changed Fields",
                          })}
                        </Table.Th>
                        <Table.Th>
                          {t("audit.timestamp", { defaultValue: "Timestamp" })}
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {bulkDetailLogs.map((log, i) => (
                        <Table.Tr
                          key={i}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSelectedBulkOp(null);
                            setSelectedLog(log);
                          }}
                        >
                          <Table.Td>
                            <Code>{log.record_id}</Code>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={getActionColor(log.action)}
                              variant="light"
                              size="sm"
                            >
                              {getActionLabel(log.action)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <ChangedFieldsBadges
                              fields={log.changed_fields ?? undefined}
                            />
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {formatDate(log.event_timestamp)}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
                {bulkDetailLogs.length === 0 && !bulkDetailLoading && (
                  <Text ta="center" c="dimmed" py="lg" size="sm">
                    {t("audit.no_detail_entries", {
                      defaultValue:
                        "No individual entries found for this operation",
                    })}
                  </Text>
                )}
              </Paper>
            </Stack>
          )}
        </Drawer>
      </PageShell>
    </>
  );
}
