import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "@domas/ui";
import {
  Card,
  Text,
  Group,
  Pagination,
  LoadingOverlay,
  Button,
  TextInput,
  Paper,
  Drawer,
  Stack,
  Code,
  Badge,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconBrandWhatsapp,
  IconMail,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { students } from "@domas/api-client";
import {
  Student,
  CreateStudentDto,
  PaginatedResult,
  COUNTRIES,
} from "@domas/ts-types";
import {
  StudentModal,
  StudentsTable,
  BulkActionsBar,
  ComposeEmailModal,
  LabelValue,
  EmptyState,
} from "@domas/ui";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

export function SharedStudentsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PaginatedResult<Student>>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(false);
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [composeEmailOpened, setComposeEmailOpened] = useState(false);

  // Filter states
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const getCountryName = (code?: string) => {
    if (!code) return "-";
    const country = COUNTRIES.find(([c]) => c === code);
    return country ? country[1] : code;
  };

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
      const result = await students.findAll({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
      });
      setData(result);
      setSelectedIds([]); // Clear selection on fetch
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
  }, [page, debouncedSearch]);

  const handleCreate = async (values: CreateStudentDto) => {
    try {
      await students.create(values);
      notifications.show({
        title: t("success"),
        message: t("student_created", "Student created successfully"),
        color: "green",
      });
      fetchData();
      setCreateModalOpened(false);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    }
  };

  const handleUpdate = async (values: CreateStudentDto) => {
    if (!editingStudent) return;
    try {
      await students.update(editingStudent.id, values);
      notifications.show({
        title: t("success"),
        message: t("student_updated", "Student updated successfully"),
        color: "green",
      });
      fetchData();
      setEditModalOpened(false);
      setEditingStudent(null);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    }
  };

  const handleDelete = (student: Student) => {
    modals.openConfirmModal({
      title: t("delete_student", { defaultValue: "Delete Student" }),
      children: (
        <Text size="sm">
          {t("delete_student_confirmation", {
            defaultValue: "Are you sure you want to delete this student?",
            name: `${student.firstName} ${student.lastName}`,
          })}
        </Text>
      ),
      labels: { confirm: t("confirm"), cancel: t("cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await students.delete(student.id);
          notifications.show({
            title: t("success"),
            message: t("student_delete_success"),
            color: "green",
          });
          fetchData();
        } catch (error) {
          notifications.show({
            title: t("error"),
            message: t("student_delete_error"),
            color: "red",
          });
        }
      },
    });
  };

  // Bulk Actions
  const handleToggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const handleToggleSelectAll = () => {
    const allIds = data.data.map((s) => s.id);
    const allSelected = allIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((current) => current.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedIds((current) => Array.from(new Set([...current, ...allIds])));
    }
  };

  const handleBulkDelete = () => {
    modals.openConfirmModal({
      title: t("delete_confirm_count", { count: selectedIds.length }),
      children: (
        <Text size="sm">
          {t("delete_confirm_count", { count: selectedIds.length })}
        </Text>
      ),
      labels: { confirm: t("confirm"), cancel: t("cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await students.deleteMany({ ids: selectedIds });
          notifications.show({
            title: t("success"),
            message: t("student_delete_success"),
            color: "green",
          });
          fetchData();
        } catch (error) {
          notifications.show({
            title: t("error"),
            message: t("student_delete_error"),
            color: "red",
          });
        }
      },
    });
  };

  const handleBulkStatusUpdate = (isActive: boolean) => {
    modals.openConfirmModal({
      title: isActive
        ? t("activate_students", { defaultValue: "Activate Students" })
        : t("deactivate_students", { defaultValue: "Deactivate Students" }),
      children: (
        <Text size="sm">
          {t("bulk_status_confirm", {
            count: selectedIds.length,
            status: isActive ? t("active") : t("inactive"),
            defaultValue: `Are you sure you want to set ${selectedIds.length} students to ${isActive ? "Active" : "Inactive"}?`,
          })}
        </Text>
      ),
      labels: { confirm: t("confirm"), cancel: t("cancel") },
      onConfirm: async () => {
        try {
          await students.updateStatusMany({ ids: selectedIds, isActive });
          notifications.show({
            title: t("success"),
            message: t("status_updated", {
              defaultValue: "Status updated successfully",
            }),
            color: "green",
          });
          fetchData();
        } catch (error) {
          notifications.show({
            title: t("error"),
            message: t("failed_to_update_status", {
              defaultValue: "Failed to update status",
            }),
            color: "red",
          });
        }
      },
    });
  };

  const handleToggleStatus = async (student: Student) => {
    try {
      await students.updateStatus(student.id, !student.isActive);
      notifications.show({
        title: t("success"),
        message: t("status_updated", {
          defaultValue: "Status updated successfully",
        }),
        color: "green",
      });
      fetchData();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_update_status", {
          defaultValue: "Failed to update status",
        }),
        color: "red",
      });
    }
  };

  return (
    <>
      <PageHeader
        title={t("students", { defaultValue: "Students" })}
        actions={
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpened(true)}
          >
            {t("create_student", { defaultValue: "Create Student" })}
          </Button>
        }
      />
      <PageShell>
        <Card withBorder padding="md" radius="md" mb="md">
          <TextInput
            placeholder={t("search_placeholder", { defaultValue: "Search..." })}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </Card>

        <Paper withBorder radius="md" style={{ position: "relative" }}>
          <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
          <StudentsTable
            data={data.data}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
            onToggleSelectAll={handleToggleSelectAll}
            onSelect={setSelectedStudent}
            onEdit={(student) => {
              setEditingStudent(student);
              setEditModalOpened(true);
            }}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
          {data.data.length === 0 && !loading && (
            <EmptyState
              title={t("no_students_found", {
                defaultValue: "No students found",
              })}
            />
          )}
        </Paper>

        <Group justify="flex-end" mt="md">
          <Pagination
            total={Math.ceil(data.total / 10)}
            value={page}
            onChange={setPage}
          />
        </Group>

        <BulkActionsBar
          selectedCount={selectedIds.length}
          onDelete={handleBulkDelete}
          onActivate={() => handleBulkStatusUpdate(true)}
          onDeactivate={() => handleBulkStatusUpdate(false)}
          onSendEmail={() => setComposeEmailOpened(true)}
          onClear={() => setSelectedIds([])}
        />

        <StudentModal
          opened={createModalOpened}
          onClose={() => setCreateModalOpened(false)}
          onSubmit={handleCreate}
        />

        <StudentModal
          opened={editModalOpened}
          onClose={() => {
            setEditModalOpened(false);
            setEditingStudent(null);
          }}
          onSubmit={handleUpdate}
          initialValues={editingStudent}
        />

        <Drawer
          opened={!!selectedStudent && !editModalOpened}
          onClose={() => setSelectedStudent(null)}
          title={t("student_details", { defaultValue: "Student Details" })}
          position="right"
          size="md"
        >
          {selectedStudent && (
            <Stack gap="lg">
              <Group justify="space-between" align="flex-start">
                <Text fw={700} size="md">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </Text>
                <Badge color={selectedStudent.isActive ? "green" : "gray"}>
                  {selectedStudent.isActive ? t("active") : t("inactive")}
                </Badge>
              </Group>

              <Group grow>
                <LabelValue label={t("student_number")}>
                  {selectedStudent.studentNumber}
                </LabelValue>
                <LabelValue label={t("national_id")}>
                  {selectedStudent.nationalId}
                </LabelValue>
              </Group>

              <Group grow>
                <LabelValue label={t("gender")}>
                  {t(selectedStudent.gender)}
                </LabelValue>
                <LabelValue label={t("nationality")}>
                  {getCountryName(selectedStudent.nationalityCode)}
                </LabelValue>
              </Group>

              <LabelValue label={t("birth_date")}>
                {selectedStudent.birthDate
                  ? new Date(selectedStudent.birthDate).toLocaleDateString(
                      "en-GB",
                    )
                  : "—"}
              </LabelValue>

              <LabelValue label={t("email")}>
                {selectedStudent.email || "—"}
              </LabelValue>

              <Group grow>
                <LabelValue label={t("phone_number")}>
                  {selectedStudent.phoneNumber || "—"}
                </LabelValue>
                <LabelValue
                  label={t("whatsapp_number", { defaultValue: "WhatsApp" })}
                >
                  {selectedStudent.whatsappNumber ? (
                    <Group gap="xs">
                      <Text size="sm" fw={500}>
                        {selectedStudent.whatsappNumber}
                      </Text>
                      <Button
                        size="compact-xs"
                        color="green"
                        variant="light"
                        leftSection={<IconBrandWhatsapp size={12} />}
                        onClick={() =>
                          window.open(
                            `https://wa.me/${selectedStudent.whatsappNumber!.replace(/\D/g, "")}`,
                            "_blank",
                          )
                        }
                      >
                        {t("open", { defaultValue: "Open" })}
                      </Button>
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </LabelValue>
              </Group>

              {selectedStudent.userId && (
                <LabelValue label="User ID">
                  <Code>{selectedStudent.userId}</Code>
                </LabelValue>
              )}

              <Group grow>
                <Button
                  variant="light"
                  leftSection={<IconEdit size={16} />}
                  onClick={() => {
                    setEditingStudent(selectedStudent);
                    setEditModalOpened(true);
                  }}
                >
                  {t("edit")}
                </Button>
                {selectedStudent.email && (
                  <Button
                    variant="light"
                    color="blue"
                    leftSection={<IconMail size={16} />}
                    onClick={() => {
                      window.open(`mailto:${selectedStudent.email}`, "_blank");
                    }}
                  >
                    {t("email_verb", { defaultValue: "Email" })}
                  </Button>
                )}
              </Group>
            </Stack>
          )}
        </Drawer>

        <ComposeEmailModal
          opened={composeEmailOpened}
          onClose={() => setComposeEmailOpened(false)}
          resolveDto={{ scope: "list", studentIds: selectedIds }}
        />
      </PageShell>
    </>
  );
}
