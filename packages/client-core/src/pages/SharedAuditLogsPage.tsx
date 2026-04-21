import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "@domas/ui";
import {
  Table,
  Badge,
  Tabs,
  Card,
  Text,
  Group,
  Select,
  Code,
  ScrollArea,
  Timeline,
  SegmentedControl,
  TextInput,
  Button,
  SimpleGrid,
  MultiSelect,
  Pagination,
  LoadingOverlay,
  Drawer,
  Stack,
  Box,
  Alert,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconDatabase,
  IconUser,
  IconTable,
  IconSearch,
  IconFilter,
  IconCalendar,
  IconClock,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { audit } from "@domas/api-client";
import {
  SuspiciousActivity,
  BulkOperation,
  PaginatedResult,
  AuditLogEntry,
} from "@domas/ts-types";
import { notifications } from "@mantine/notifications";

export function SharedAuditLogsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>("search");
  const [loading, setLoading] = useState(false);

  // Data states
  const [searchResults, setSearchResults] = useState<
    PaginatedResult<AuditLogEntry>
  >({ data: [], total: 0, page: 1, limit: 50 });
  const [suspiciousActivity, setSuspiciousActivity] = useState<
    SuspiciousActivity[]
  >([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Filter states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<string>("50");
  const [datePreset, setDatePreset] = useState<string>("this_week");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Initialize dates on mount based on default preset
  useEffect(() => {
    applyDatePreset("this_week");
  }, []);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const limitNum = parseInt(limit);

      if (activeTab === "search") {
        // Fix: Append end of day time to endDate to ensure "Today" includes logs from today
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
        });
        setSearchResults(result);
      } else if (activeTab === "suspicious") {
        const data = await audit.getSuspiciousActivity();
        setSuspiciousActivity(data);
      } else if (activeTab === "bulk") {
        const data = await audit.getBulkOperations(limitNum);
        setBulkOperations(data);
      }
    } catch (error) {
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
  }, [activeTab, page, limit, dateRange, selectedActions, debouncedSearch]);

  const handleSearchClick = () => {
    setPage(1);
    fetchData();
  };

  // Helper to format date as YYYY-MM-DD in local time to avoid timezone shifts
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
      case "this_week":
        const day = today.getDay() || 7;
        start = new Date(today);
        if (day !== 1) start.setHours(-24 * (day - 1));
        break;
      case "last_week":
        start = new Date(today);
        start.setDate(today.getDate() - 7 - (today.getDay() || 7) + 1);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB");
  };

  const getActionColor = (action?: string) => {
    if (!action) return "gray";
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
    if (!action) return action;
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

  const renderDrawerContent = (log: AuditLogEntry) => {
    if (log.action === "I") {
      return (
        <Stack gap="md">
          <Alert
            color="green"
            title={t("audit.new_data", { defaultValue: "New Data" })}
          >
            <Code block>{JSON.stringify(log.new_values, null, 2)}</Code>
          </Alert>
        </Stack>
      );
    }

    if (log.action === "D") {
      return (
        <Stack gap="md">
          <Alert
            color="red"
            title={t("audit.deleted_data", { defaultValue: "Deleted Data" })}
          >
            <Code block>{JSON.stringify(log.old_values, null, 2)}</Code>
          </Alert>
        </Stack>
      );
    }

    if (log.action === "U") {
      return (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Alert
            color="red"
            title={t("audit.before", { defaultValue: "Before" })}
          >
            <Code block>{JSON.stringify(log.old_values, null, 2)}</Code>
          </Alert>
          <Alert
            color="green"
            title={t("audit.after", { defaultValue: "After" })}
          >
            <Code block>{JSON.stringify(log.new_values, null, 2)}</Code>
          </Alert>
        </SimpleGrid>
      );
    }

    return <Code block>{JSON.stringify(log, null, 2)}</Code>;
  };

  return (
    <>
      <PageHeader
        title={t("nav.audit_logs", { defaultValue: "Audit Logs" })}
        actions={
          <Select
            label={t("audit.rows_per_page", { defaultValue: "Rows per page" })}
            value={limit}
            onChange={(val) => {
              setLimit(val || "50");
              setPage(1);
            }}
            data={["20", "50", "100", "200"]}
            w={130}
          />
        }
      />
      <PageShell size="xl">
        <LoadingOverlay visible={loading} />

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
              {t("audit.search_logs", { defaultValue: "Search Logs" })}
            </Tabs.Tab>
            <Tabs.Tab
              value="suspicious"
              leftSection={<IconAlertTriangle size={16} />}
              color="red"
            >
              {t("audit.suspicious_activity", {
                defaultValue: "Suspicious Activity",
              })}
            </Tabs.Tab>
            <Tabs.Tab value="bulk" leftSection={<IconDatabase size={16} />}>
              {t("audit.bulk_operations", { defaultValue: "Bulk Operations" })}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="search">
            <Card withBorder padding="md" radius="md" mb="md">
              <Text fw={600} mb="sm" c="dimmed">
                {t("audit.filters", { defaultValue: "Filters" })}
              </Text>
              <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="md">
                <TextInput
                  placeholder={t("audit.search_placeholder", {
                    defaultValue: "Search table or User UUID...",
                  })}
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
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
                    setDateRange((prev) => ({ ...prev, end: e.target.value }));
                    setDatePreset("custom");
                    setPage(1);
                  }}
                />
              </SimpleGrid>
              <Group mt="md" justify="space-between">
                <Group>
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
                  {datePreset !== "all" && (
                    <Button
                      variant="subtle"
                      size="xs"
                      color="gray"
                      onClick={() => applyDatePreset("all")}
                    >
                      {t("audit.clear_dates", { defaultValue: "Clear Dates" })}
                    </Button>
                  )}
                </Group>
                <Button
                  onClick={handleSearchClick}
                  leftSection={<IconSearch size={16} />}
                >
                  {t("audit.search", { defaultValue: "Search" })}
                </Button>
              </Group>
            </Card>

            <Card withBorder padding="sm" radius="md">
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>
                        {t("audit.timestamp", { defaultValue: "Timestamp" })}
                      </Table.Th>
                      <Table.Th>
                        {t("audit.user", { defaultValue: "User" })}
                      </Table.Th>
                      <Table.Th>
                        {t("audit.table", { defaultValue: "Table" })}
                      </Table.Th>
                      <Table.Th>
                        {t("audit.action", { defaultValue: "Action" })}
                      </Table.Th>
                      <Table.Th>
                        {t("audit.record_id", { defaultValue: "Record ID" })}
                      </Table.Th>
                      <Table.Th>
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
                            <IconClock size={14} color="gray" />
                            <Text size="sm">
                              {formatDate(log.event_timestamp)}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <IconUser size={14} color="gray" />
                            <Text size="sm" fw={500}>
                              {log.username || "System"}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <IconTable size={14} color="gray" />
                            <Code>{log.table_name}</Code>
                          </Group>
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
                          <Code>{log.record_id}</Code>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            {log.changed_fields
                              ?.slice(0, 3)
                              .map((field: string) => (
                                <Badge
                                  key={field}
                                  size="sm"
                                  variant="outline"
                                  color="gray"
                                >
                                  {field}
                                </Badge>
                              ))}
                            {log.changed_fields &&
                              log.changed_fields.length > 3 && (
                                <Badge size="sm" variant="outline" color="gray">
                                  +{log.changed_fields.length - 3}
                                </Badge>
                              )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
              {searchResults.data.length === 0 && !loading && (
                <Text c="dimmed" ta="center" py="xl">
                  {t("audit.no_logs_found", {
                    defaultValue: "No audit logs found matching criteria",
                  })}
                </Text>
              )}

              <Group justify="flex-end" mt="md">
                <Pagination
                  total={Math.ceil(searchResults.total / parseInt(limit))}
                  value={page}
                  onChange={setPage}
                />
              </Group>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="suspicious">
            <Card withBorder padding="md" radius="md">
              <Timeline
                active={suspiciousActivity.length - 1}
                bulletSize={24}
                lineWidth={2}
              >
                {suspiciousActivity.map((item, index) => (
                  <Timeline.Item
                    key={index}
                    bullet={<IconAlertTriangle size={12} />}
                    title={
                      <Text fw={700} c="red">
                        {item.username} - Multiple Failures
                      </Text>
                    }
                    color="red"
                  >
                    <Text c="dimmed" size="sm">
                      {t("audit.failed_login_attempts", {
                        defaultValue: "Failed login attempts",
                      })}
                      :{" "}
                      <Text span fw={700}>
                        {item.failure_count}
                      </Text>
                    </Text>
                    <Text size="xs" mt={4}>
                      {t("audit.last_attempt", {
                        defaultValue: "Last attempt",
                      })}
                      : {formatDate(item.last_attempt)}
                    </Text>
                    <Group mt={4}>
                      {item.ip_addresses?.map((ip) => (
                        <Code key={ip}>{ip}</Code>
                      ))}
                    </Group>
                  </Timeline.Item>
                ))}
              </Timeline>
              {suspiciousActivity.length === 0 && !loading && (
                <Text c="dimmed" ta="center" py="xl">
                  {t("audit.no_suspicious_activity", {
                    defaultValue: "No suspicious activity detected",
                  })}
                </Text>
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="bulk">
            <Card withBorder padding="sm" radius="md">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      {t("audit.timestamp", { defaultValue: "Timestamp" })}
                    </Table.Th>
                    <Table.Th>
                      {t("audit.operation", { defaultValue: "Operation" })}
                    </Table.Th>
                    <Table.Th>
                      {t("audit.user", { defaultValue: "User" })}
                    </Table.Th>
                    <Table.Th>
                      {t("audit.resource", { defaultValue: "Resource" })}
                    </Table.Th>
                    <Table.Th>
                      {t("audit.affected", { defaultValue: "Affected" })}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bulkOperations.map((op, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>{formatDate(op.event_timestamp)}</Table.Td>
                      <Table.Td>
                        <Badge>{op.operation_type}</Badge>
                      </Table.Td>
                      <Table.Td>{op.username}</Table.Td>
                      <Table.Td>{op.resource_type}</Table.Td>
                      <Table.Td>
                        <Text fw={700}>{op.affected_count}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              {bulkOperations.length === 0 && !loading && (
                <Text c="dimmed" ta="center" py="xl">
                  {t("audit.no_bulk_operations", {
                    defaultValue: "No bulk operations found",
                  })}
                </Text>
              )}
            </Card>
          </Tabs.Panel>
        </Tabs>

        <Drawer
          opened={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={
            <Group>
              <Text fw={700} size="lg">
                {t("audit.log_details", { defaultValue: "Log Details" })}
              </Text>
              <Badge>{selectedLog?.action}</Badge>
              <Code>{selectedLog?.event_id}</Code>
            </Group>
          }
          position="right"
          size="xl"
        >
          {selectedLog && (
            <Stack gap="md">
              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("audit.user", { defaultValue: "User" })}
                  </Text>
                  <Text fw={500}>{selectedLog.username}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("audit.table", { defaultValue: "Table" })}
                  </Text>
                  <Text fw={500}>{selectedLog.table_name}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("audit.record_id", { defaultValue: "Record ID" })}
                  </Text>
                  <Code>{selectedLog.record_id}</Code>
                </Box>
              </Group>

              <Box>
                <Text size="xs" c="dimmed">
                  {t("audit.timestamp", { defaultValue: "Timestamp" })}
                </Text>
                <Text>{formatDate(selectedLog.event_timestamp)}</Text>
              </Box>

              {renderDrawerContent(selectedLog)}
            </Stack>
          )}
        </Drawer>
      </PageShell>
    </>
  );
}
