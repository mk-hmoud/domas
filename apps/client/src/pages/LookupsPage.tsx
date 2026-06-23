import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { countries as countriesApi, departments as departmentsApi } from '@domas/api-client';
import { Country, Department } from '@domas/ts-types';
import { PageHeader, PageShell, EmptyState } from '@domas/ui';

export function LookupsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>('countries');

  return (
    <>
      <PageHeader
        title={t('nav.lookups', { defaultValue: 'Countries & Departments' })}
        subtitle={t('lookups_description', {
          defaultValue: 'Manage the nationality and department lists used across student forms.',
        })}
      />
      <PageShell>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="countries">{t('countries', { defaultValue: 'Countries' })}</Tabs.Tab>
            <Tabs.Tab value="departments">
              {t('departments', { defaultValue: 'Departments' })}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="countries" pt="md">
            <CountriesPanel />
          </Tabs.Panel>

          <Tabs.Panel value="departments" pt="md">
            <DepartmentsPanel />
          </Tabs.Panel>
        </Tabs>
      </PageShell>
    </>
  );
}

function CountriesPanel() {
  const { t } = useTranslation();
  const [data, setData] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const [editing, setEditing] = useState<Country | undefined>(undefined);

  const fetchData = async () => {
    setLoading(true);
    try {
      setData(await countriesApi.findAll());
    } catch {
      notifications.show({ color: 'red', message: t('error') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.nameTr.toLowerCase().includes(q),
    );
  }, [data, search]);

  const openCreate = () => {
    setEditing(undefined);
    setModalOpened(true);
  };

  const openEdit = (country: Country) => {
    setEditing(country);
    setModalOpened(true);
  };

  const handleSubmit = async (values: { code: string; nameEn: string; nameTr: string }) => {
    if (editing) {
      await countriesApi.update(editing.code, { nameEn: values.nameEn, nameTr: values.nameTr });
      notifications.show({
        color: 'green',
        message: t('updated_successfully', 'Updated successfully'),
      });
    } else {
      await countriesApi.create(values);
      notifications.show({
        color: 'green',
        message: t('created_successfully', 'Created successfully'),
      });
    }
    setModalOpened(false);
    await fetchData();
  };

  const handleDelete = (country: Country) => {
    modals.openConfirmModal({
      title: t('delete_country', { defaultValue: 'Delete Country' }),
      children: (
        <Text size="sm">
          {t('delete_country_confirm', {
            defaultValue:
              'Delete «{{name}}»? Students with this nationality will block the deletion.',
            name: country.nameEn,
          })}
        </Text>
      ),
      labels: { confirm: t('delete'), cancel: t('cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await countriesApi.delete(country.code);
          notifications.show({
            color: 'green',
            message: t('deleted_successfully', 'Deleted successfully'),
          });
          await fetchData();
        } catch (e: any) {
          notifications.show({
            color: 'red',
            message: e?.response?.data?.user_message || t('error'),
          });
        }
      },
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <TextInput
          placeholder={t('search_placeholder', { defaultValue: 'Search...' })}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={280}
        />
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          {t('create_country', { defaultValue: 'Add Country' })}
        </Button>
      </Group>

      <Paper withBorder radius="md" style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('code', { defaultValue: 'Code' })}</Table.Th>
              <Table.Th>{t('name_en', { defaultValue: 'Name (English)' })}</Table.Th>
              <Table.Th>{t('name_tr', { defaultValue: 'Name (Turkish)' })}</Table.Th>
              <Table.Th style={{ width: 80 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} style={{ padding: 0 }}>
                  <EmptyState title={t('no_records_found', 'No records found')} />
                </Table.Td>
              </Table.Tr>
            ) : (
              filtered.map((country) => (
                <Table.Tr key={country.code}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {country.code}
                    </Text>
                  </Table.Td>
                  <Table.Td>{country.nameEn}</Table.Td>
                  <Table.Td>{country.nameTr}</Table.Td>
                  <Table.Td>
                    <Group justify="flex-end" gap="xs">
                      <Tooltip label={t('edit')}>
                        <ActionIcon variant="subtle" onClick={() => openEdit(country)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t('delete')}>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(country)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <CountryModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleSubmit}
        initialValues={editing}
      />
    </Stack>
  );
}

function CountryModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
}: {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: { code: string; nameEn: string; nameTr: string }) => Promise<void>;
  initialValues?: Country;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialValues;

  const form = useForm({
    initialValues: { code: '', nameEn: '', nameTr: '' },
    validate: {
      code: (v) => (!isEdit && v.trim().length < 2 ? t('field_required', 'Required') : null),
      nameEn: (v) => (v.trim().length < 2 ? t('field_required', 'Required') : null),
      nameTr: (v) => (v.trim().length < 2 ? t('field_required', 'Required') : null),
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues(
        initialValues
          ? { code: initialValues.code, nameEn: initialValues.nameEn, nameTr: initialValues.nameTr }
          : { code: '', nameEn: '', nameTr: '' },
      );
    }
  }, [opened]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await onSubmit({ ...values, code: values.code.trim().toUpperCase() });
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: e?.response?.data?.user_message || t('error'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        isEdit
          ? t('edit_country', { defaultValue: 'Edit Country' })
          : t('create_country', { defaultValue: 'Add Country' })
      }
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={t('code', { defaultValue: 'Code' })}
            description={t('country_code_hint', {
              defaultValue: 'ISO alpha-2/3 code, e.g. TR, GB, TRNC',
            })}
            withAsterisk
            disabled={isEdit}
            maxLength={10}
            {...form.getInputProps('code')}
          />
          <TextInput
            label={t('name_en', { defaultValue: 'Name (English)' })}
            withAsterisk
            {...form.getInputProps('nameEn')}
          />
          <TextInput
            label={t('name_tr', { defaultValue: 'Name (Turkish)' })}
            withAsterisk
            {...form.getInputProps('nameTr')}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? t('save') : t('create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

function DepartmentsPanel() {
  const { t } = useTranslation();
  const [data, setData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const [editing, setEditing] = useState<Department | undefined>(undefined);

  const fetchData = async () => {
    setLoading(true);
    try {
      setData(await departmentsApi.findAll());
    } catch {
      notifications.show({ color: 'red', message: t('error') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (d) => d.nameEn.toLowerCase().includes(q) || d.nameTr.toLowerCase().includes(q),
    );
  }, [data, search]);

  const openCreate = () => {
    setEditing(undefined);
    setModalOpened(true);
  };

  const openEdit = (department: Department) => {
    setEditing(department);
    setModalOpened(true);
  };

  const handleSubmit = async (values: { nameEn: string; nameTr: string }) => {
    if (editing) {
      await departmentsApi.update(editing.nameEn, values);
      notifications.show({
        color: 'green',
        message: t('updated_successfully', 'Updated successfully'),
      });
    } else {
      await departmentsApi.create(values);
      notifications.show({
        color: 'green',
        message: t('created_successfully', 'Created successfully'),
      });
    }
    setModalOpened(false);
    await fetchData();
  };

  const handleDelete = (department: Department) => {
    modals.openConfirmModal({
      title: t('delete_department', { defaultValue: 'Delete Department' }),
      children: (
        <Text size="sm">
          {t('delete_department_confirm', {
            defaultValue:
              'Delete «{{name}}»? Students with this department will block the deletion.',
            name: department.nameEn,
          })}
        </Text>
      ),
      labels: { confirm: t('delete'), cancel: t('cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await departmentsApi.delete(department.nameEn);
          notifications.show({
            color: 'green',
            message: t('deleted_successfully', 'Deleted successfully'),
          });
          await fetchData();
        } catch (e: any) {
          notifications.show({
            color: 'red',
            message: e?.response?.data?.user_message || t('error'),
          });
        }
      },
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <TextInput
          placeholder={t('search_placeholder', { defaultValue: 'Search...' })}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={280}
        />
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          {t('create_department', { defaultValue: 'Add Department' })}
        </Button>
      </Group>

      <Paper withBorder radius="md" style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('name_en', { defaultValue: 'Name (English)' })}</Table.Th>
              <Table.Th>{t('name_tr', { defaultValue: 'Name (Turkish)' })}</Table.Th>
              <Table.Th style={{ width: 80 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={3} style={{ padding: 0 }}>
                  <EmptyState title={t('no_records_found', 'No records found')} />
                </Table.Td>
              </Table.Tr>
            ) : (
              filtered.map((department) => (
                <Table.Tr key={department.nameEn}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {department.nameEn}
                    </Text>
                  </Table.Td>
                  <Table.Td>{department.nameTr}</Table.Td>
                  <Table.Td>
                    <Group justify="flex-end" gap="xs">
                      <Tooltip label={t('edit')}>
                        <ActionIcon variant="subtle" onClick={() => openEdit(department)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t('delete')}>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(department)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <DepartmentModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleSubmit}
        initialValues={editing}
      />
    </Stack>
  );
}

function DepartmentModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
}: {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: { nameEn: string; nameTr: string }) => Promise<void>;
  initialValues?: Department;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialValues;

  const form = useForm({
    initialValues: { nameEn: '', nameTr: '' },
    validate: {
      nameEn: (v) => (v.trim().length < 2 ? t('field_required', 'Required') : null),
      nameTr: (v) => (v.trim().length < 2 ? t('field_required', 'Required') : null),
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues(
        initialValues
          ? { nameEn: initialValues.nameEn, nameTr: initialValues.nameTr }
          : { nameEn: '', nameTr: '' },
      );
    }
  }, [opened]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await onSubmit(values);
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: e?.response?.data?.user_message || t('error'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        isEdit
          ? t('edit_department', { defaultValue: 'Edit Department' })
          : t('create_department', { defaultValue: 'Add Department' })
      }
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={t('name_en', { defaultValue: 'Name (English)' })}
            description={
              isEdit
                ? t('department_rename_hint', {
                    defaultValue: 'Renaming updates this department on all students that have it.',
                  })
                : undefined
            }
            withAsterisk
            {...form.getInputProps('nameEn')}
          />
          <TextInput
            label={t('name_tr', { defaultValue: 'Name (Turkish)' })}
            withAsterisk
            {...form.getInputProps('nameTr')}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? t('save') : t('create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
