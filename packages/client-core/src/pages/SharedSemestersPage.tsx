import { useState, useEffect } from "react";
import { PageHeader, PageShell } from "@domas/ui";
import {
  Button,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Text,
  LoadingOverlay,
  Menu,
  Pagination,
  Drawer,
  Stack,
  Box,
  NumberInput,
  Divider,
} from "@mantine/core";
import {
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconArchive,
  IconCurrencyLira,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { semesters } from "@domas/api-client";
import {
  Semester,
  SemesterRoomPricingRow,
  CreateSemesterDto,
  UpdateSemesterDto,
  SemesterStatus,
} from "@domas/ts-types";
import { SemesterModal } from "@domas/ui";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { handleApiError } from "../utils/api-error-handler";

export function SharedSemestersPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(
    null,
  );
  const [viewSemester, setViewSemester] = useState<Semester | null>(null);

  // ─── Pricing matrix state ─────────────────────────────────────────────────────
  const [pricingRows, setPricingRows] = useState<SemesterRoomPricingRow[]>([]);
  const [pricingEdits, setPricingEdits] = useState<
    Record<number, { priceTry: number | string; priceForeign: number | string }>
  >({});
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);

  const fetchPricing = async (semesterId: number) => {
    setPricingLoading(true);
    try {
      const rows = await semesters.getPricing(semesterId);
      setPricingRows(rows);
      const edits: typeof pricingEdits = {};
      rows.forEach((row) => {
        edits[row.roomTypeId] = {
          priceTry: row.priceTry ?? "",
          priceForeign: row.priceForeign ?? "",
        };
      });
      setPricingEdits(edits);
    } catch {
      // silently ignore
    } finally {
      setPricingLoading(false);
    }
  };

  useEffect(() => {
    if (viewSemester) fetchPricing(viewSemester.id);
    else {
      setPricingRows([]);
      setPricingEdits({});
    }
  }, [viewSemester?.id]);

  const handleSavePricing = async () => {
    if (!viewSemester) return;
    setPricingSaving(true);
    try {
      const items = pricingRows
        .map((row) => {
          const edit = pricingEdits[row.roomTypeId];
          const priceTry = Number(edit?.priceTry);
          if (!edit || isNaN(priceTry) || priceTry < 0) return null;
          const priceForeign =
            edit.priceForeign !== "" && edit.priceForeign != null
              ? Number(edit.priceForeign)
              : null;
          return { roomTypeId: row.roomTypeId, priceTry, priceForeign };
        })
        .filter(
          (item): item is NonNullable<typeof item> =>
            item !== null && item.priceTry > 0,
        );
      await semesters.setPricing(viewSemester.id, { items });
      notifications.show({
        title: t("success"),
        message: t("semester.pricing_saved", {
          defaultValue: "Pricing saved successfully",
        }),
        color: "green",
      });
      await fetchPricing(viewSemester.id);
    } catch (error) {
      handleApiError(
        error,
        t("semester.failed_to_save_pricing", {
          defaultValue: "Failed to save pricing",
        }),
      );
    } finally {
      setPricingSaving(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await semesters.findAll({ limit, page });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      handleApiError(error, t("failed_to_fetch_data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleCreate = async (values: CreateSemesterDto) => {
    setModalLoading(true);
    try {
      await semesters.create(values);
      notifications.show({
        title: t("success"),
        message: t("semester_created"),
        color: "green",
      });
      fetchData();
      setCreateModalOpened(false);
    } catch (error) {
      handleApiError(error, t("failed_to_save_role"));
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (values: UpdateSemesterDto) => {
    if (!selectedSemester) return;
    setModalLoading(true);
    try {
      await semesters.update(selectedSemester.id, values);
      notifications.show({
        title: t("success"),
        message: t("semester_updated"),
        color: "green",
      });
      fetchData();
      setEditModalOpened(false);
      setSelectedSemester(null);
    } catch (error) {
      handleApiError(error, t("failed_to_save_role"));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (semester: Semester) => {
    try {
      await semesters.remove(semester.id);
      notifications.show({
        title: t("success"),
        message: t("semester_deleted"),
        color: "green",
      });
      fetchData();
    } catch (error) {
      handleApiError(error, t("failed_to_delete_role"));
    }
  };

  const handleUpdateStatus = (semester: Semester, status: SemesterStatus) => {
    const getConfirmationMessage = () => {
      switch (status) {
        case SemesterStatus.ACTIVE:
          return t("semester.status_change_active_message");
        case SemesterStatus.CLOSED:
          return t("semester.status_change_close_message");
        case SemesterStatus.ARCHIVED:
          return t("semester.status_change_archive_message");
        default:
          return t("semester.status_change_message", {
            status: t(`semester.statuses.${status}`),
          });
      }
    };

    modals.openConfirmModal({
      title: t("semester.confirm_status_change"),
      children: <Text size="sm">{getConfirmationMessage()}</Text>,
      labels: { confirm: t("confirm"), cancel: t("cancel") },
      confirmProps: {
        color: status === SemesterStatus.ARCHIVED ? "red" : "blue",
      },
      onConfirm: async () => {
        try {
          await semesters.updateStatus(semester.id, status);
          notifications.show({
            title: t("success"),
            message: t("semester.status_updated_successfully"),
            color: "green",
          });
          fetchData();
        } catch (error) {
          handleApiError(error, t("semester.failed_to_update_status"));
        }
      },
    });
  };

  const openEditModal = (semester: Semester) => {
    setSelectedSemester(semester);
    setEditModalOpened(true);
  };

  const openDeleteModal = (semester: Semester) => {
    modals.openConfirmModal({
      title: t("delete_semester_title"),
      children: (
        <Text size="sm">
          {t("delete_semester_message", {
            name: semester.displayName,
          })}
        </Text>
      ),
      labels: { confirm: t("confirm"), cancel: t("cancel") },
      confirmProps: { color: "red" },
      onConfirm: () => handleDelete(semester),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const getStatusColor = (status: SemesterStatus) => {
    switch (status) {
      case SemesterStatus.ACTIVE:
        return "green";
      case SemesterStatus.OPEN:
        return "blue";
      case SemesterStatus.PLANNED:
        return "yellow";
      case SemesterStatus.CLOSED:
        return "gray";
      case SemesterStatus.ARCHIVED:
        return "dark";
      default:
        return "gray";
    }
  };

  return (
    <>
      <PageHeader
        title={t("semesters_page_title")}
        actions={
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpened(true)}
          >
            {t("create_semester")}
          </Button>
        }
      />
      <PageShell>
        <LoadingOverlay visible={loading} />

        <Paper withBorder radius="md">
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("semester_name")}</Table.Th>
                <Table.Th>{t("start_date")}</Table.Th>
                <Table.Th>{t("end_date")}</Table.Th>
                <Table.Th>{t("status")}</Table.Th>
                <Table.Th style={{ width: 80 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((semester) => (
                <Table.Tr
                  key={semester.id}
                  onClick={() => setViewSemester(semester)}
                  style={{ cursor: "pointer" }}
                >
                  <Table.Td fw={500}>
                    {semester.displayName ||
                      `${semester.academicYear} ${semester.type}`}
                  </Table.Td>
                  <Table.Td>{formatDate(semester.startDate)}</Table.Td>
                  <Table.Td>{formatDate(semester.endDate)}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={getStatusColor(semester.status)}
                      variant="light"
                    >
                      {t(`semester.statuses.${semester.status}`)}
                    </Badge>
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={() => openEditModal(semester)}
                        >
                          {t("edit")}
                        </Menu.Item>

                        <Menu.Label>{t("status")}</Menu.Label>
                        <Menu.Item
                          leftSection={<IconCheck size={14} />}
                          onClick={() =>
                            handleUpdateStatus(semester, SemesterStatus.ACTIVE)
                          }
                          disabled={semester.status === SemesterStatus.ACTIVE}
                        >
                          {t("semester.actions.set_active")}
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconX size={14} />}
                          onClick={() =>
                            handleUpdateStatus(semester, SemesterStatus.CLOSED)
                          }
                          disabled={semester.status === SemesterStatus.CLOSED}
                        >
                          {t("semester.actions.close")}
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconArchive size={14} />}
                          onClick={() =>
                            handleUpdateStatus(
                              semester,
                              SemesterStatus.ARCHIVED,
                            )
                          }
                          disabled={semester.status === SemesterStatus.ARCHIVED}
                        >
                          {t("semester.actions.archive")}
                        </Menu.Item>

                        <Menu.Divider />
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => openDeleteModal(semester)}
                        >
                          {t("delete")}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {data.length === 0 && !loading && (
            <Text c="dimmed" ta="center" py="xl">
              No semesters found
            </Text>
          )}
        </Paper>

        <Group justify="flex-end" mt="md">
          <Pagination
            total={Math.ceil(total / limit)}
            value={page}
            onChange={setPage}
          />
        </Group>

        <SemesterModal
          opened={createModalOpened}
          onClose={() => setCreateModalOpened(false)}
          onSubmit={handleCreate}
          loading={modalLoading}
          lastSemester={data.length > 0 ? data[0] : undefined}
        />

        <SemesterModal
          opened={editModalOpened}
          onClose={() => {
            setEditModalOpened(false);
            setSelectedSemester(null);
          }}
          onSubmit={handleUpdate}
          initialValues={selectedSemester}
          loading={modalLoading}
        />

        <Drawer
          opened={!!viewSemester}
          onClose={() => setViewSemester(null)}
          title={
            <Text fw={700} size="lg">
              {t("semester_label", { defaultValue: "Semester" })}
            </Text>
          }
          position="right"
          size="md"
        >
          {viewSemester && (
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="xl" fw={700}>
                  {viewSemester.displayName ||
                    `${viewSemester.academicYear} ${viewSemester.type}`}
                </Text>
                <Badge color={getStatusColor(viewSemester.status)}>
                  {t(`semester.statuses.${viewSemester.status}`)}
                </Badge>
              </Group>

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("start_date")}
                  </Text>
                  <Text>{formatDate(viewSemester.startDate)}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("end_date")}
                  </Text>
                  <Text>{formatDate(viewSemester.endDate)}</Text>
                </Box>
              </Group>

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("semester.booking_start", {
                      defaultValue: "Booking Start",
                    })}
                  </Text>
                  <Text>
                    {viewSemester.bookingStartDate
                      ? formatDate(viewSemester.bookingStartDate)
                      : "-"}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("semester.booking_end", { defaultValue: "Booking End" })}
                  </Text>
                  <Text>
                    {viewSemester.bookingEndDate
                      ? formatDate(viewSemester.bookingEndDate)
                      : "-"}
                  </Text>
                </Box>
              </Group>

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("semester.deposit_try", {
                      defaultValue: "Deposit (TRY)",
                    })}
                  </Text>
                  <Text>{viewSemester.depositAmountTry}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("semester.deposit_foreign", {
                      defaultValue: "Deposit (Foreign)",
                    })}
                  </Text>
                  <Text>
                    {viewSemester.depositAmountForeign}{" "}
                    {viewSemester.foreignCurrencyCode}
                  </Text>
                </Box>
              </Group>

              <Box>
                <Text size="xs" c="dimmed">
                  {t("semester.max_room_changes", {
                    defaultValue: "Max Room Changes",
                  })}
                </Text>
                <Text>
                  {viewSemester.maxRoomChanges != null
                    ? viewSemester.maxRoomChanges
                    : t("unlimited", { defaultValue: "Unlimited" })}
                </Text>
              </Box>

              <Divider
                label={
                  <Group gap={6}>
                    <IconCurrencyLira size={14} />
                    <Text size="sm" fw={500}>
                      {t("semester.room_pricing", {
                        defaultValue: "Room Type Pricing",
                      })}
                    </Text>
                  </Group>
                }
                labelPosition="left"
              />

              <Box style={{ position: "relative" }}>
                <LoadingOverlay visible={pricingLoading} />
                {pricingRows.length === 0 && !pricingLoading ? (
                  <Text size="sm" c="dimmed">
                    {t("semester.no_room_types", {
                      defaultValue:
                        "No room types defined yet. Create room types first.",
                    })}
                  </Text>
                ) : (
                  <Table withTableBorder withColumnBorders fz="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>
                          {t("room_type", { defaultValue: "Room Type" })}
                        </Table.Th>
                        <Table.Th>
                          {t("capacity", { defaultValue: "Cap." })}
                        </Table.Th>
                        <Table.Th>
                          {t("semester.price_try", {
                            defaultValue: "Price (TRY)",
                          })}
                        </Table.Th>
                        <Table.Th>
                          {t("semester.price_foreign", {
                            defaultValue: `Price (${viewSemester.foreignCurrencyCode})`,
                          })}
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {pricingRows.map((row) => (
                        <Table.Tr key={row.roomTypeId}>
                          <Table.Td>{row.roomTypeName}</Table.Td>
                          <Table.Td>{row.capacity}</Table.Td>
                          <Table.Td>
                            <NumberInput
                              size="xs"
                              min={0}
                              placeholder="0"
                              value={
                                pricingEdits[row.roomTypeId]?.priceTry ?? ""
                              }
                              onChange={(v) =>
                                setPricingEdits((prev) => ({
                                  ...prev,
                                  [row.roomTypeId]: {
                                    ...prev[row.roomTypeId],
                                    priceTry: v,
                                  },
                                }))
                              }
                            />
                          </Table.Td>
                          <Table.Td>
                            <NumberInput
                              size="xs"
                              min={0}
                              placeholder="—"
                              value={
                                pricingEdits[row.roomTypeId]?.priceForeign ?? ""
                              }
                              onChange={(v) =>
                                setPricingEdits((prev) => ({
                                  ...prev,
                                  [row.roomTypeId]: {
                                    ...prev[row.roomTypeId],
                                    priceForeign: v,
                                  },
                                }))
                              }
                            />
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Box>

              {pricingRows.length > 0 && (
                <Button
                  size="sm"
                  loading={pricingSaving}
                  onClick={handleSavePricing}
                >
                  {t("semester.save_pricing", {
                    defaultValue: "Save Pricing",
                  })}
                </Button>
              )}

              <Divider />

              <Button
                variant="light"
                leftSection={<IconEdit size={16} />}
                onClick={() => {
                  openEditModal(viewSemester);
                  setViewSemester(null); // Close drawer when editing
                }}
              >
                {t("edit")}
              </Button>
            </Stack>
          )}
        </Drawer>
      </PageShell>
    </>
  );
}
