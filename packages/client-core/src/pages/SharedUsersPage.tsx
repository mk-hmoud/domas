import { useEffect, useState } from "react";
import {
  Title,
  Button,
  Group,
  Container,
  Pagination,
  Text,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { users } from "@domas/api-client";
import { User, CreateUserDto, PaginatedResult } from "@domas/ts-types";
import { CreateUserModal, UsersTable, DeleteUserModal } from "@domas/ui";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";

interface SharedUsersPageProps {
  title?: string;
  role?: string[];
}

export function SharedUsersPage({
  title = "nav.all_users",
  role,
}: SharedUsersPageProps) {
  const { t } = useTranslation();
  const [paginatedData, setPaginatedData] =
    useState<PaginatedResult<User> | null>(null);
  const [activePage, setPage] = useState(1);
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchData = async (page: number) => {
    try {
      const result = await users.findAll({ page, limit: 10, roles: role });
      setPaginatedData(result);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
        color: "red",
      });
    }
  };

  const roleKey = role?.join(",") || "";
  useEffect(() => {
    fetchData(activePage);
  }, [activePage, roleKey]);

  const handleCreateUser = async (values: CreateUserDto) => {
    try {
      await users.create(values);
      notifications.show({
        title: t("success"),
        message: t("user_created_successfully", "User created successfully"),
        color: "green",
      });
      await fetchData(activePage);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_create_user", "Failed to create user"),
        color: "red",
      });
    }
  };

  const confirmDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpened(true);
  };

  const handleDeleteUser = async (user: User) => {
    try {
      await users.delete(user.id);
      notifications.show({
        title: t("success"),
        message: t("delete_success", "User deleted successfully"),
        color: "green",
      });
      await fetchData(activePage);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("delete_error", "Failed to delete user"),
        color: "red",
      });
    }
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <Title>{t(title)}</Title>
        <Button
          leftSection={<IconPlus size={14} />}
          onClick={() => setModalOpened(true)}
        >
          {t("create_user")}
        </Button>
      </Group>

      <UsersTable data={paginatedData?.data || []} onDelete={confirmDelete} />

      {paginatedData?.data.length === 0 && (
        <Text ta="center" mt="xl" c="dimmed">
          No users found.
        </Text>
      )}

      {paginatedData && paginatedData.total > paginatedData.limit && (
        <Group justify="center" mt="xl">
          <Pagination
            total={Math.ceil(paginatedData.total / paginatedData.limit)}
            value={activePage}
            onChange={setPage}
          />
        </Group>
      )}

      <CreateUserModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleCreateUser}
      />

      <DeleteUserModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={handleDeleteUser}
        user={selectedUser}
      />
    </Container>
  );
}
