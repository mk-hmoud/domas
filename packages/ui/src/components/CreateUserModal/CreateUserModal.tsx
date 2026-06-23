import { useState, useEffect } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Modal,
  ActionIcon,
  Tooltip,
  rem,
  Group,
  Switch,
  Checkbox,
  Stack,
  Text,
  Divider,
  Badge,
  Select,
  Box,
  Loader,
  ComboboxItem,
  CloseButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure, useDebouncedValue } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { CreateUserDto, UpdateUserDto, User, Role } from "@domas/ts-types";
import {
  IconRefresh,
  IconEye,
  IconEyeOff,
  IconMapPin,
} from "@tabler/icons-react";
import { locations as locationsApi } from "@domas/api-client";

interface CreateUserModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (
    values:
      | (CreateUserDto & { locationIds?: number[] })
      | (UpdateUserDto & { roleIds?: number[] }),
  ) => Promise<void>;
  userToEdit?: User | null;
  availableRoles?: Role[];
}

export function CreateUserModal({
  opened,
  onClose,
  onSubmit,
  userToEdit,
  availableRoles = [],
}: CreateUserModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [visible, { toggle }] = useDisclosure(false);

  // Location picker state (create mode only)
  const [selectedLocations, setSelectedLocations] = useState<
    { id: number; name: string }[]
  >([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [debouncedLocationSearch] = useDebouncedValue(locationSearch, 300);
  const [locationOptions, setLocationOptions] = useState<
    (ComboboxItem & { path?: string })[]
  >([]);
  const [locationSearching, setLocationSearching] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      password: "",
      isActive: true,
      roleIds: [] as string[],
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : t("invalid_email")),
      password: (val) => {
        if (userToEdit && !val) return null; // Password optional on edit
        return val.length < 6 ? t("password_too_short") : null;
      },
    },
  });

  useEffect(() => {
    if (opened) {
      if (userToEdit) {
        form.setValues({
          email: userToEdit.email,
          firstName: userToEdit.firstName || "",
          lastName: userToEdit.lastName || "",
          phoneNumber: userToEdit.phoneNumber || "",
          password: "",
          isActive: userToEdit.isActive,
          roleIds: userToEdit.roles?.map((r) => r.id.toString()) || [],
        });
      } else {
        form.reset();
        setSelectedLocations([]);
        setLocationSearch("");
        setLocationOptions([]);
      }
    }
  }, [opened, userToEdit]);

  useEffect(() => {
    if (!debouncedLocationSearch.trim()) {
      setLocationOptions([]);
      return;
    }
    const selectedIds = new Set(selectedLocations.map((l) => l.id));
    let cancelled = false;
    setLocationSearching(true);
    locationsApi
      .search(debouncedLocationSearch, true)
      .then((results) => {
        if (cancelled) return;
        setLocationOptions(
          results
            .filter((loc) => !selectedIds.has(loc.id))
            .map((loc) => ({
              value: loc.id.toString(),
              label: loc.name,
              path: loc.locationPath,
            })),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLocationSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedLocationSearch, selectedLocations]);

  const handleAddLocation = (value: string | null) => {
    if (!value) return;
    const opt = locationOptions.find((o) => o.value === value);
    if (!opt) return;
    setSelectedLocations((prev) => [
      ...prev,
      { id: parseInt(value, 10), name: opt.label },
    ]);
    setLocationSearch("");
    setLocationOptions([]);
  };

  const handleRemoveLocation = (id: number) => {
    setSelectedLocations((prev) => prev.filter((l) => l.id !== id));
  };

  const generatePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    const length = 12;
    let password = "";
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length];
    }
    form.setFieldValue("password", password);
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      if (userToEdit) {
        // Update user
        const payload: UpdateUserDto & { roleIds: number[] } = {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber,
          isActive: values.isActive,
          roleIds: values.roleIds.map((id) => parseInt(id)),
        };
        if (values.password) {
          payload.password = values.password;
        }
        await onSubmit(payload);
      } else {
        // Create user
        const payload: CreateUserDto & { locationIds?: number[] } = {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber,
          roleIds: values.roleIds.map((id) => parseInt(id)),
          locationIds: selectedLocations.map((l) => l.id),
        };
        if (values.password) {
          payload.password = values.password;
        }
        await onSubmit(payload);
      }
      form.reset();
      onClose();
    } catch (error) {
      // Error handling is up to parent, but we stop loading
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={userToEdit ? t("edit_user") : t("create_new_user")}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Group grow mb="md">
          <TextInput
            label={t("first_name", { defaultValue: "First Name" })}
            placeholder="John"
            {...form.getInputProps("firstName")}
          />
          <TextInput
            label={t("last_name", { defaultValue: "Last Name" })}
            placeholder="Doe"
            {...form.getInputProps("lastName")}
          />
        </Group>

        <TextInput
          label={t("phone_number", { defaultValue: "Phone Number" })}
          placeholder="+90 123 456 7890"
          mb="md"
          {...form.getInputProps("phoneNumber")}
        />

        <TextInput
          label={t("email")}
          placeholder="user@example.com"
          required
          {...form.getInputProps("email")}
        />

        <PasswordInput
          label={t("password")}
          description={userToEdit ? t("leave_blank_keep_password") : undefined}
          placeholder={t("your_password")}
          required={!userToEdit}
          mt="md"
          visible={visible}
          onVisibilityChange={toggle}
          rightSectionWidth={70}
          rightSection={
            <Group gap={0}>
              <Tooltip
                label={visible ? t("hide_password") : t("show_password")}
              >
                <ActionIcon variant="subtle" color="gray" onClick={toggle}>
                  {visible ? (
                    <IconEyeOff style={{ width: rem(16), height: rem(16) }} />
                  ) : (
                    <IconEye style={{ width: rem(16), height: rem(16) }} />
                  )}
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t("generate_password")}>
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={generatePassword}
                >
                  <IconRefresh style={{ width: rem(16), height: rem(16) }} />
                </ActionIcon>
              </Tooltip>
            </Group>
          }
          {...form.getInputProps("password")}
        />

        <Checkbox.Group
          label={t("user_roles")}
          mt="md"
          {...form.getInputProps("roleIds")}
        >
          <Stack gap="xs" mt="xs">
            {availableRoles.map((role) => (
              <Checkbox
                key={role.id}
                value={role.id.toString()}
                label={
                  <div>
                    <Text size="sm" fw={500}>
                      {role.name}
                    </Text>
                    {role.description && (
                      <Text size="xs" c="dimmed">
                        {role.description}
                      </Text>
                    )}
                  </div>
                }
                styles={{
                  body: { alignItems: "flex-start" },
                }}
              />
            ))}
          </Stack>
        </Checkbox.Group>

        {!userToEdit && (
          <>
            <Divider
              label={t("assigned_locations", "Assigned Locations")}
              labelPosition="left"
              mt="md"
              mb="xs"
            />

            {selectedLocations.length > 0 && (
              <Group gap="xs" mb="xs">
                {selectedLocations.map((loc) => (
                  <Badge
                    key={loc.id}
                    variant="outline"
                    pr={4}
                    rightSection={
                      <CloseButton
                        size="xs"
                        radius="xl"
                        variant="transparent"
                        onClick={() => handleRemoveLocation(loc.id)}
                      />
                    }
                  >
                    {loc.name}
                  </Badge>
                ))}
              </Group>
            )}

            <Select
              placeholder={t(
                "add_location_placeholder",
                "Search to assign a location...",
              )}
              data={locationOptions}
              value={null}
              onChange={handleAddLocation}
              searchable
              searchValue={locationSearch}
              onSearchChange={setLocationSearch}
              nothingFoundMessage={
                locationSearching
                  ? t("searching", "Searching...")
                  : t("no_locations_found", "No locations found")
              }
              rightSection={locationSearching ? <Loader size={16} /> : null}
              filter={({ options }) => options}
              renderOption={({ option }) => (
                <Group gap="sm" wrap="nowrap">
                  <IconMapPin size={16} opacity={0.5} />
                  <Box>
                    <Text size="sm">{option.label}</Text>
                    {(option as ComboboxItem & { path?: string }).path && (
                      <Text size="xs" c="dimmed">
                        {(option as ComboboxItem & { path?: string }).path}
                      </Text>
                    )}
                  </Box>
                </Group>
              )}
            />
          </>
        )}

        {userToEdit && (
          <Switch
            label={t("active")}
            mt="md"
            checked={form.values.isActive}
            {...form.getInputProps("isActive", { type: "checkbox" })}
          />
        )}

        <Button fullWidth mt="xl" type="submit" loading={loading}>
          {userToEdit ? t("save_changes") : t("create_user")}
        </Button>
      </form>
    </Modal>
  );
}
