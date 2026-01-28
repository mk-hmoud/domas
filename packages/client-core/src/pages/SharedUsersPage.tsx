import { useEffect, useState } from "react";
import {
  Title,
  Button,
  Group,
  Container,
  Pagination,
  Text,
  Drawer,
  Stack,
  Badge,
  Box,
} from "@mantine/core";
import { IconPlus, IconEdit } from "@tabler/icons-react";
import { users, access } from "@domas/api-client";
import {
  User,
  CreateUserDto,
  PaginatedResult,
  UpdateUserDto,
  Role,
} from "@domas/ts-types";
import { CreateUserModal, UsersTable } from "@domas/ui";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

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
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [activePage, setPage] = useState(1);
  const [modalOpened, setModalOpened] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const fetchData = async (page: number) => {
    try {
      const [result, rolesResult] = await Promise.all([
        users.findAll({ page, limit: 10, roles: role }),
        access.findAllRoles(),
      ]);
      setPaginatedData(result);
      setAvailableRoles(rolesResult);
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

  const handleCreateOrUpdateUser = async (
    values: CreateUserDto | (UpdateUserDto & { roleIds?: number[] }),
  ) => {
    try {
      if (userToEdit) {
        const { roleIds, ...updateData } = values as UpdateUserDto & {
          roleIds?: number[];
        };
        await users.update(userToEdit.id, updateData);

        // Sync roles if provided
        if (roleIds) {
          const currentRoleIds = userToEdit.roles?.map((r) => r.id) || [];
          const rolesToAssign = roleIds.filter(
            (id) => !currentRoleIds.includes(id),
          );
          const rolesToRevoke = currentRoleIds.filter(
            (id) => !roleIds.includes(id),
          );

          await Promise.all([
            ...rolesToAssign.map((id) => access.assignRole(userToEdit.id, id)),
            ...rolesToRevoke.map((id) => access.revokeRole(userToEdit.id, id)),
          ]);
        }

        notifications.show({
          title: t("success"),
          message: t("user_updated_successfully", "User updated successfully"),
          color: "green",
        });
      } else {
        await users.create(values as CreateUserDto);
        notifications.show({
          title: t("success"),
          message: t("user_created_successfully", "User created successfully"),
          color: "green",
        });
      }
      await fetchData(activePage);
      setModalOpened(false);
      setUserToEdit(null);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t(
          userToEdit ? "failed_to_update_user" : "failed_to_create_user",
        ),
        color: "red",
      });
    }
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
      if (viewUser?.id === user.id) setViewUser(null);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("delete_error", "Failed to delete user"),
        color: "red",
      });
    }
  };

  const confirmDelete = (user: User) => {
    modals.openConfirmModal({
      title: t("delete_user_title"),
      children: (
        <Text size="sm">{t("delete_user_message", { email: user.email })}</Text>
      ),
      labels: { confirm: t("confirm"), cancel: t("cancel") },
      confirmProps: { color: "red" },
      onConfirm: () => handleDeleteUser(user),
    });
  };

  const openCreateModal = () => {
    setUserToEdit(null);
    setModalOpened(true);
  };

  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setModalOpened(true);
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <Title>{t(title)}</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={openCreateModal}>
          {t("create_user")}
        </Button>
      </Group>

      <UsersTable
        data={paginatedData?.data || []}
        onDelete={confirmDelete}
        onEdit={openEditModal}
        onRowClick={setViewUser}
      />

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
        onClose={() => {
          setModalOpened(false);
          setUserToEdit(null);
        }}
        onSubmit={handleCreateOrUpdateUser}
        userToEdit={userToEdit}
        availableRoles={availableRoles}
      />

      <Drawer
        opened={!!viewUser}
        onClose={() => setViewUser(null)}
        title={
          <Text fw={700} size="lg">
            {t("user_details", { defaultValue: "User Details" })}
          </Text>
        }
        position="right"
        size="md"
      >
        {viewUser && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="xl" fw={700}>
                {viewUser.email}
              </Text>
              <Badge color={viewUser.isActive ? "green" : "gray"}>
                {viewUser.isActive ? t("active") : t("inactive")}
              </Badge>
            </Group>

            <Box>
              <Text size="xs" c="dimmed">
                {t("user_id", { defaultValue: "User ID" })}
              </Text>
              <Text size="sm" style={{ wordBreak: "break-all" }}>
                {viewUser.id}
              </Text>
            </Box>

            <Group grow>
              <Box>
                <Text size="xs" c="dimmed">
                  {t("created_at")}
                </Text>
                <Text>{new Date(viewUser.createdAt).toLocaleDateString()}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">
                  {t("updated_at")}
                </Text>
                <Text>{new Date(viewUser.updatedAt).toLocaleDateString()}</Text>
              </Box>
            </Group>

            {viewUser.isRecoveryAdmin && (
              <Badge color="red" variant="filled" fullWidth>
                Recovery Admin
              </Badge>
            )}

            <Box>
              <Text size="xs" c="dimmed" mb={4}>
                {t("user_roles")}
              </Text>
              <Group gap="xs">
                {viewUser.roles && viewUser.roles.length > 0 ? (
                  viewUser.roles.map((role) => (
                    <Badge key={role.id} variant="outline">
                      {role.name}
                    </Badge>
                  ))
                ) : (
                  <Text size="sm" c="dimmed">
                    -
                  </Text>
                )}
              </Group>
            </Box>

            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={() => {
                openEditModal(viewUser);
                setViewUser(null);
              }}
              mt="xl"
            >
              {t("edit_user", { defaultValue: "Edit User" })}
            </Button>
          </Stack>
        )}
      </Drawer>
    </Container>
  );
}
