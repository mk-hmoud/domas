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
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { semesters } from "@domas/api-client";
import {
  Semester,
  CreateSemesterDto,
  UpdateSemesterDto,
} from "@domas/ts-types";
import { ConfirmDeleteModal, SemesterModal } from "@domas/ui";

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
      console.error(error);
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
      fetchData();
      setCreateModalOpened(false);
    } catch (error) {
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (values: UpdateSemesterDto) => {
    if (!selectedSemester) return;
    setModalLoading(true);
    try {
      await semesters.update(selectedSemester.id, values);
      fetchData();
      setEditModalOpened(false);
      setSelectedSemester(null);
    } catch (error) {
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSemester) return;
    try {
      await semesters.remove(selectedSemester.id);
      setDeleteModalOpened(false);
      setSelectedSemester(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleActive = async (semester: Semester) => {
    try {
      await semesters.toggleActive(semester.id);
      fetchData();
    } catch (error) {
      console.error(error);
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
    return new Date(dateString).toLocaleDateString();
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
              <Table.Th>{t("is_active")}</Table.Th>
              <Table.Th style={{ width: 80 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((semester) => (
              <Table.Tr key={semester.id}>
                <Table.Td fw={500}>{semester.name}</Table.Td>
                <Table.Td>{formatDate(semester.startDate.toString())}</Table.Td>
                <Table.Td>{formatDate(semester.endDate.toString())}</Table.Td>
                <Table.Td>
                  {semester.isActive ? (
                    <Badge color="green" variant="light">
                      {t("active")}
                    </Badge>
                  ) : (
                    <Badge color="gray" variant="light">
                      Inactive
                    </Badge>
                  )}
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
                      <Menu.Item
                        leftSection={
                          semester.isActive ? (
                            <IconX size={14} />
                          ) : (
                            <IconCheck size={14} />
                          )
                        }
                        onClick={() => handleToggleActive(semester)}
                      >
                        {semester.isActive ? "Deactivate" : "Activate"}
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
        message={t("delete_semester_message", { name: selectedSemester?.name })}
      />
    </Container>
  );
}
