import { useEffect, useState } from "react";
import {
  Title,
  Container,
  Table,
  Badge,
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
  Box,
  Menu,
  ActionIcon,
  Code,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconEye,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { students } from "@domas/api-client";
import {
  Student,
  CreateStudentDto,
  PaginatedResult,
  COUNTRIES,
} from "@domas/ts-types";
import { StudentModal } from "@domas/ui";

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
    } catch (error) {
      console.error(error);
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
      fetchData();
      setCreateModalOpened(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async (values: CreateStudentDto) => {
    if (!editingStudent) return;
    try {
      await students.update(editingStudent.id, values);
      fetchData();
      setEditModalOpened(false);
      setEditingStudent(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container size="lg" py="xl" style={{ position: "relative" }}>
      <LoadingOverlay visible={loading} />
      <Group justify="space-between" mb="lg">
        <Title>{t("students", { defaultValue: "Students" })}</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpened(true)}
        >
          {t("create_student", { defaultValue: "Create Student" })}
        </Button>
      </Group>

      <Card withBorder padding="md" radius="md" mb="md">
        <TextInput
          placeholder={t("search_placeholder", { defaultValue: "Search..." })}
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Card>

      <Paper withBorder radius="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                {t("student_number", { defaultValue: "Student Number" })}
              </Table.Th>
              <Table.Th>
                {t("full_name", { defaultValue: "Full Name" })}
              </Table.Th>
              <Table.Th>{t("gender", { defaultValue: "Gender" })}</Table.Th>
              <Table.Th>
                {t("nationality", { defaultValue: "Nationality" })}
              </Table.Th>
              <Table.Th>{t("status", { defaultValue: "Status" })}</Table.Th>
              <Table.Th style={{ width: 80 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.data.map((student) => (
              <Table.Tr
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                style={{ cursor: "pointer" }}
              >
                <Table.Td>{student.studentNumber}</Table.Td>
                <Table.Td>
                  {student.firstName} {student.lastName}
                </Table.Td>
                <Table.Td>{t(student.gender)}</Table.Td>
                <Table.Td>{getCountryName(student.nationalityCode)}</Table.Td>
                <Table.Td>
                  <Badge color={student.isActive ? "green" : "gray"}>
                    {student.isActive ? t("active") : t("inactive")}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={200} withinPortal>
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEye size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                        }}
                      >
                        {t("view_details", { defaultValue: "View Details" })}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStudent(student);
                          setEditModalOpened(true);
                        }}
                      >
                        {t("edit")}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {data.data.length === 0 && !loading && (
          <Text c="dimmed" ta="center" py="xl">
            No students found
          </Text>
        )}
      </Paper>

      <Group justify="flex-end" mt="md">
        <Pagination
          total={Math.ceil(data.total / 10)}
          value={page}
          onChange={setPage}
        />
      </Group>

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
        opened={!!selectedStudent && !editModalOpened} // Avoid overlapping if edit triggered from drawer? No, edit from menu.
        onClose={() => setSelectedStudent(null)}
        title={t("student_details", { defaultValue: "Student Details" })}
        position="right"
        size="md"
      >
        {selectedStudent && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="xl" fw={700}>
                {selectedStudent.firstName} {selectedStudent.lastName}
              </Text>
              <Badge color={selectedStudent.isActive ? "green" : "gray"}>
                {selectedStudent.isActive ? t("active") : t("inactive")}
              </Badge>
            </Group>

            <Box>
              <Text size="xs" c="dimmed">
                {t("student_number")}
              </Text>
              <Text fw={500}>{selectedStudent.studentNumber}</Text>
            </Box>

            <Box>
              <Text size="xs" c="dimmed">
                {t("national_id")}
              </Text>
              <Text fw={500}>{selectedStudent.nationalId}</Text>
            </Box>

            <Box>
              <Text size="xs" c="dimmed">
                {t("birth_date")}
              </Text>
              <Text>
                {selectedStudent.birthDate
                  ? new Date(selectedStudent.birthDate).toLocaleDateString(
                      "en-GB",
                    )
                  : "-"}
              </Text>
            </Box>

            <Box>
              <Text size="xs" c="dimmed">
                {t("email")}
              </Text>
              <Text>{selectedStudent.email || "-"}</Text>
            </Box>

            <Box>
              <Text size="xs" c="dimmed">
                {t("phone_number")}
              </Text>
              <Text>{selectedStudent.phoneNumber || "-"}</Text>
            </Box>

            <Group grow>
              <Box>
                <Text size="xs" c="dimmed">
                  {t("gender")}
                </Text>
                <Text>{t(selectedStudent.gender)}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">
                  {t("nationality")}
                </Text>
                <Text>{getCountryName(selectedStudent.nationalityCode)}</Text>
              </Box>
            </Group>

            {selectedStudent.userId && (
              <Box>
                <Text size="xs" c="dimmed">
                  User ID
                </Text>
                <Code>{selectedStudent.userId}</Code>
              </Box>
            )}

            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={() => {
                setEditingStudent(selectedStudent);
                setEditModalOpened(true);
                // setSelectedStudent(null); // Optional: close drawer when editing
              }}
            >
              {t("edit")}
            </Button>
          </Stack>
        )}
      </Drawer>
    </Container>
  );
}
