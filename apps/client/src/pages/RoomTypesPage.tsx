import { useEffect, useState } from 'react';
import { Button, Paper, LoadingOverlay } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { roomTypes as roomTypesApi } from '@domas/api-client';
import { RoomType } from '@domas/ts-types';
import { RoomTypesTable, RoomTypeModal, PageHeader, PageShell } from '@domas/ui';

export function RoomTypesPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | undefined>(undefined);

  const fetch = async () => {
    setLoading(true);
    try {
      setData(await roomTypesApi.findAll());
    } catch {
      notifications.show({ color: 'red', message: t('error') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (rt: RoomType) => {
    setEditing(rt);
    setModalOpen(true);
  };

  const handleSubmit = async (values: any, pendingFiles: File[]) => {
    if (editing) {
      await roomTypesApi.update(editing.id, values);
      notifications.show({
        color: 'green',
        message: t('updated_successfully', { defaultValue: 'Updated successfully' }),
      });
    } else {
      const created = await roomTypesApi.create(values);
      for (const file of pendingFiles) {
        await roomTypesApi.uploadImage(created.id, file);
      }
      notifications.show({
        color: 'green',
        message: t('created_successfully', { defaultValue: 'Created successfully' }),
      });
    }
    await fetch();
  };

  const handleDelete = async (rt: RoomType) => {
    try {
      await roomTypesApi.delete(rt.id);
      notifications.show({
        color: 'green',
        message: t('deleted_successfully', { defaultValue: 'Deleted successfully' }),
      });
      await fetch();
    } catch {
      notifications.show({ color: 'red', message: t('error') });
    }
  };

  const handleUploadImage = async (file: File): Promise<RoomType> => {
    const updated = await roomTypesApi.uploadImage(editing!.id, file);
    setEditing(updated);
    setData((prev) => prev.map((rt) => (rt.id === updated.id ? updated : rt)));
    return updated;
  };

  const handleRemoveImage = async (index: number): Promise<RoomType> => {
    const updated = await roomTypesApi.removeImage(editing!.id, index);
    setEditing(updated);
    setData((prev) => prev.map((rt) => (rt.id === updated.id ? updated : rt)));
    return updated;
  };

  return (
    <>
      <PageHeader
        title={t('nav.room_types', { defaultValue: 'Room Types' })}
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            {t('create_room_type', { defaultValue: 'Create Room Type' })}
          </Button>
        }
      />
      <PageShell>
        <Paper withBorder radius="md" style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
          <RoomTypesTable data={data} onEdit={openEdit} onDelete={handleDelete} />
        </Paper>

        <RoomTypeModal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          initialValues={editing}
          onUploadImage={editing ? handleUploadImage : undefined}
          onRemoveImage={editing ? handleRemoveImage : undefined}
        />
      </PageShell>
    </>
  );
}
