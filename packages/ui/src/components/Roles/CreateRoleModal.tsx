import { useState, useEffect, useMemo } from "react";
import {
  TextInput,
  Textarea,
  Button,
  Modal,
  Grid,
  Card,
  Checkbox,
  Group,
  Stack,
  Text,
  Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { CreateRoleDto, Role, Permission } from "@domas/ts-types";

interface CreateRoleModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateRoleDto) => Promise<void>;
  roleToEdit?: Role | null;
  permissions?: Permission[];
}

export function CreateRoleModal({
  opened,
  onClose,
  onSubmit,
  roleToEdit,
  permissions = [],
}: CreateRoleModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateRoleDto>({
    initialValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
    validate: {
      name: (val) => (val.length < 2 ? t("role_name_too_short") : null),
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues({
        name: roleToEdit?.name || "",
        description: roleToEdit?.description || "",
        permissionIds: roleToEdit?.permissions?.map((p) => p.id) || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, roleToEdit]);

  const handleSubmit = async (values: CreateRoleDto) => {
    setLoading(true);
    try {
      await onSubmit(values);
      form.reset();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by resource (e.g., "users.view" -> "users")
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
      const [resource] = p.slug.split(".");
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(p);
    });
    return groups;
  }, [permissions]);

  const getResourceLabel = (resource: string) => {
    // 1. Try nav namespace first (avoids object warning for 'roles', 'audit')
    const navLabel = t(`nav.${resource}`);
    if (typeof navLabel === "string" && navLabel !== `nav.${resource}`) {
      return navLabel;
    }

    // 2. Skip direct translation for known object keys or if it returns object
    if (["roles", "audit"].includes(resource)) {
      return resource.charAt(0).toUpperCase() + resource.slice(1);
    }

    // 3. Try direct translation for others
    const directLabel = t(resource);
    if (typeof directLabel === "string" && directLabel !== resource) {
      return directLabel;
    }

    // 4. Fallback to capitalized key
    return resource.charAt(0).toUpperCase() + resource.slice(1);
  };

  const safeId = (id: unknown): number =>
    parseInt((id as any)?.toString() || "0", 10);

  const getPermissionIds = (): number[] => {
    return (form.values.permissionIds || []).map(safeId);
  };

  const handleGroupToggle = (
    groupPermissions: Permission[],
    checked: boolean,
  ) => {
    const groupIds = groupPermissions.map((p) => safeId(p.id));
    const currentIds = getPermissionIds();

    let newIds: number[];
    if (checked) {
      // Add all missing ids from this group
      const toAdd = groupIds.filter((id) => !currentIds.includes(id));
      newIds = [...currentIds, ...toAdd];
    } else {
      // Remove all ids from this group
      newIds = currentIds.filter((id) => !groupIds.includes(id));
    }

    form.setFieldValue("permissionIds", newIds);
  };

  const isGroupSelected = (groupPermissions: Permission[]) => {
    const groupIds = groupPermissions.map((p) => safeId(p.id));
    const selectedIds = getPermissionIds();
    return groupIds.every((id) => selectedIds.includes(id));
  };

  const isGroupIndeterminate = (groupPermissions: Permission[]) => {
    const groupIds = groupPermissions.map((p) => safeId(p.id));
    const selectedIds = getPermissionIds();
    const selectedCount = groupIds.filter((id) =>
      selectedIds.includes(id),
    ).length;
    return selectedCount > 0 && selectedCount < groupIds.length;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={roleToEdit ? t("edit_role") : t("create_new_role")}
      size="xl"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label={t("name")}
          placeholder="e.g. Building Manager"
          required
          {...form.getInputProps("name")}
        />
        <Textarea
          label={t("description")}
          placeholder={t("role_description_placeholder")}
          mt="md"
          {...form.getInputProps("description")}
        />

        <Text fw={500} mt="xl" mb="md">
          {t("permissions")}
        </Text>

        <Grid>
          {Object.entries(groupedPermissions).map(([resource, groupPerms]) => (
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={resource}>
              <Card withBorder padding="sm" radius="md" h="100%">
                <Group justify="space-between" mb="xs">
                  <Text fw={600} tt="capitalize">
                    {getResourceLabel(resource)}
                  </Text>
                  <Checkbox
                    checked={isGroupSelected(groupPerms)}
                    indeterminate={isGroupIndeterminate(groupPerms)}
                    onChange={(event) =>
                      handleGroupToggle(groupPerms, event.currentTarget.checked)
                    }
                    aria-label={`Select all ${resource} permissions`}
                  />
                </Group>

                <Divider mb="sm" />

                <Stack gap="xs">
                  {groupPerms.map((permission) => (
                    <Checkbox
                      key={permission.id}
                      label={
                        <Group gap="xs">
                          <Text size="sm">
                            {permission.slug.split(".").slice(1).join(".")}
                          </Text>
                          {permission.description && (
                            <Text size="xs" c="dimmed">
                              - {permission.description}
                            </Text>
                          )}
                        </Group>
                      }
                      checked={getPermissionIds().includes(
                        safeId(permission.id),
                      )}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        const currentIds = getPermissionIds();
                        const permId = safeId(permission.id);

                        if (checked) {
                          form.setFieldValue("permissionIds", [
                            ...currentIds,
                            permId,
                          ]);
                        } else {
                          form.setFieldValue(
                            "permissionIds",
                            currentIds.filter((id) => id !== permId),
                          );
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        <Button fullWidth mt="xl" type="submit" loading={loading}>
          {roleToEdit ? t("save_changes") : t("create_role")}
        </Button>
      </form>
    </Modal>
  );
}
