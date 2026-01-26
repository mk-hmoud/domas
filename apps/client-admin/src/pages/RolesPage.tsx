import { useState, useEffect, useMemo } from 'react';
import { Title, Text, Button, Group, Container, Card, TextInput } from '@mantine/core';
import { IconPlus, IconSearch, IconShield, IconShieldCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { CreateRoleDto, Role, Permission } from '@domas/ts-types';
import { access } from '@domas/api-client';
import { RolesTable, CreateRoleModal, ConfirmDeleteModal } from '@domas/ui';
import { notifications } from '@mantine/notifications';

export function RolesPage() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        access.findAllRoles(),
        access.findAllPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      notifications.show({
        title: t('error'),
        message: t('failed_to_fetch_data'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRoles = useMemo(() => {
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [roles, searchQuery]);

  const handleCreateOrUpdate = async (values: CreateRoleDto) => {
    try {
      if (roleToEdit) {
        await access.updateRole(roleToEdit.id, values);
        notifications.show({
          title: t('success'),
          message: t('role_updated_successfully'),
          color: 'green',
        });
      } else {
        await access.createRole(values);
        notifications.show({
          title: t('success'),
          message: t('role_created_successfully'),
          color: 'green',
        });
      }
      fetchData();
    } catch (error) {
      notifications.show({
        title: t('error'),
        message: t('failed_to_save_role'),
        color: 'red',
      });
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;
    try {
      await access.deleteRole(roleToDelete.id);
      notifications.show({
        title: t('success'),
        message: t('role_deleted_successfully'),
        color: 'green',
      });
      setDeleteModalOpen(false);
      setRoleToDelete(null);
      fetchData();
    } catch (error) {
      notifications.show({
        title: t('error'),
        message: t('failed_to_delete_role'),
        color: 'red',
      });
    }
  };

  const openCreateModal = () => {
    setRoleToEdit(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setRoleToEdit(role);
    setCreateModalOpen(true);
  };

  const openDeleteModal = (role: Role) => {
    setRoleToDelete(role);
    setDeleteModalOpen(true);
  };

  // Stats
  const systemRolesCount = roles.filter((r) => r.isSystemRole).length;
  const customRolesCount = roles.length - systemRolesCount;

  return (
    <Container fluid p="md">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>{t('roles_and_permissions')}</Title>
          <Text c="dimmed" size="sm">
            {t('manage_roles_description')}
          </Text>
        </div>
        <Button leftSection={<IconPlus size={14} />} onClick={openCreateModal}>
          {t('create_role')}
        </Button>
      </Group>

      {/* Stats Cards */}
      <Group mb="lg" grow>
        <Card withBorder padding="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              {t('total_roles')}
            </Text>
            <IconShield size={22} className="text-gray-500" />
          </Group>
          <Group align="flex-end" gap="xs" mt={25}>
            <Text fw={700} size="xl" lh={1}>
              {roles.length}
            </Text>
          </Group>
          <Text c="dimmed" size="xs" mt="sm">
            {systemRolesCount} {t('system_roles')}
          </Text>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              {t('custom_roles')}
            </Text>
            <IconShieldCheck size={22} className="text-gray-500" />
          </Group>
          <Group align="flex-end" gap="xs" mt={25}>
            <Text fw={700} size="xl" lh={1}>
              {customRolesCount}
            </Text>
          </Group>
          <Text c="dimmed" size="xs" mt="sm">
            {t('user_defined_roles')}
          </Text>
        </Card>
      </Group>

      <Card withBorder radius="md" p="md" mb="lg">
        <Group justify="space-between" mb="md">
          <Group>
            <Title order={4}>{t('all_roles')}</Title>
            <Text c="dimmed" size="sm">
              {filteredRoles.length} {t('records_found')}
            </Text>
          </Group>
          <TextInput
            placeholder={t('search_roles')}
            leftSection={<IconSearch size={14} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </Group>

        <RolesTable
          data={filteredRoles}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          loading={loading}
        />
      </Card>

      <CreateRoleModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        roleToEdit={roleToEdit}
        permissions={permissions}
      />

      <ConfirmDeleteModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('delete_role')}
        message={t('delete_role_confirmation', { name: roleToDelete?.name })}
      />
    </Container>
  );
}
