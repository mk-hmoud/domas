import { useState, useEffect } from "react";
import {
  Title,
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
  Container,
} from "@mantine/core";
import {
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconArchive,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { semesters } from "@domas/api-client";
import {
  Semester,
  CreateSemesterDto,
  UpdateSemesterDto,
  SemesterStatus,
} from "@domas/ts-types";
import { ConfirmDeleteModal, SemesterModal } from "@domas/ui";
import { notifications } from "@mantine/notifications";

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
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(
    null,
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await semesters.findAll({ limit, page });
      setData(result.data);
      setTotal(result.total);
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
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"), // Assuming generic error or add semester specific
        color: "red",
      });
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
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSemester) return;
    try {
      await semesters.remove(selectedSemester.id);
      notifications.show({
        title: t("success"),
        message: t("semester_deleted"),
        color: "green",
      });
      setDeleteModalOpened(false);
      setSelectedSemester(null);
      fetchData();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_delete_role"),
        color: "red",
      });
    }
  };

  const handleUpdateStatus = async (
    semester: Semester,
    status: SemesterStatus,
  ) => {
    try {
      await semesters.updateStatus(semester.id, status);
      notifications.show({
        title: t("success"),
        message: t("semester_toggled"),
        color: "green",
      });
      fetchData();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("error"),
        color: "red",
      });
    }
  };

  const openEditModal = (semester: Semester) => {
    setSelectedSemester(semester);
    setEditModalOpened(true);
  };

  const openDeleteModal = (semester: Semester) => {
    setSelectedSemester(semester);
    setDeleteModalOpened(true);
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
    <Container size="lg" py="xl" style={{ position: "relative" }}>
      <LoadingOverlay visible={loading} />
      <Group justify="space-between" mb="lg">
        <Title order={2}>{t("semesters_page_title")}</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpened(true)}
        >
          {t("create_semester")}
        </Button>
      </Group>

      <Paper withBorder radius="md">
        <Table verticalSpacing="sm">
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
              <Table.Tr key={semester.id}>
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
                <Table.Td>
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
                          handleUpdateStatus(semester, SemesterStatus.ARCHIVED)
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

      <ConfirmDeleteModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedSemester(null);
        }}
        onConfirm={handleDelete}
        title={t("delete_semester_title")}
        message={t("delete_semester_message", {
          name: selectedSemester?.displayName,
        })}
      />
    </Container>
  );
}
