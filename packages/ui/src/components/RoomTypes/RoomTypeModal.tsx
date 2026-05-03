import { useEffect, useRef, useState } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  TagsInput,
  Box,
  Image,
  SimpleGrid,
  CloseButton,
  NumberInput,
  ActionIcon,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconPhoto, IconUpload } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  RoomType,
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
} from "@domas/ts-types";

export interface RoomTypeModalProps {
  opened: boolean;
  onClose: () => void;
  // pendingFiles is populated only in create mode (no initialValues)
  onSubmit: (
    data: CreateRoomTypeDto | UpdateRoomTypeDto,
    pendingFiles: File[],
  ) => Promise<void>;
  initialValues?: RoomType;
  onUploadImage?: (file: File) => Promise<RoomType>;
  onRemoveImage?: (index: number) => Promise<RoomType>;
}

export function RoomTypeModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
  onUploadImage,
  onRemoveImage,
}: RoomTypeModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Edit mode: pre-signed URLs from the server
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  // Create mode: local File objects + object URL previews
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!initialValues;

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      amenities: [] as string[],
      capacity: undefined as number | undefined,
    },
    validate: {
      name: (v) =>
        v.trim().length < 2
          ? t("validation_name_short", { defaultValue: "Name too short" })
          : null,
      capacity: (v) =>
        v == null || v < 1
          ? t("validation_capacity_required", {
              defaultValue: "Capacity is required",
            })
          : null,
    },
  });

  useEffect(() => {
    if (opened) {
      if (initialValues) {
        form.setValues({
          name: initialValues.name,
          description: initialValues.description ?? "",
          amenities: initialValues.amenities ?? [],
          capacity: initialValues.capacity,
        });
        setGalleryUrls(initialValues.galleryUrls ?? []);
      } else {
        form.reset();
        setGalleryUrls([]);
      }
      // Clear pending files whenever modal opens
      pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
      setPendingFiles([]);
      setPendingPreviews([]);
    }
  }, [opened]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (isEditMode && onUploadImage) {
      // Edit: upload immediately
      setUploadingIndex(-1);
      try {
        const updated = await onUploadImage(file);
        setGalleryUrls(updated.galleryUrls ?? []);
      } finally {
        setUploadingIndex(null);
      }
    } else {
      // Create: store locally
      const preview = URL.createObjectURL(file);
      setPendingFiles((prev) => [...prev, file]);
      setPendingPreviews((prev) => [...prev, preview]);
    }
  };

  const handleRemove = async (index: number) => {
    if (isEditMode) {
      if (!onRemoveImage) return;
      setUploadingIndex(index);
      try {
        const updated = await onRemoveImage(index);
        setGalleryUrls(updated.galleryUrls ?? []);
      } finally {
        setUploadingIndex(null);
      }
    } else {
      URL.revokeObjectURL(pendingPreviews[index]);
      setPendingFiles((prev) => prev.filter((_, i) => i !== index));
      setPendingPreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await onSubmit(
        {
          name: values.name,
          description: values.description || undefined,
          amenities: values.amenities,
          capacity: values.capacity,
        },
        pendingFiles,
      );
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const displayUrls = isEditMode ? galleryUrls : pendingPreviews;
  const isUploading = uploadingIndex !== null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        initialValues
          ? t("edit_room_type", { defaultValue: "Edit Room Type" })
          : t("create_room_type", { defaultValue: "Create Room Type" })
      }
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={t("name")}
            withAsterisk
            {...form.getInputProps("name")}
          />

          <Textarea
            label={t("description", { defaultValue: "Description" })}
            placeholder={t("room_type_description_placeholder", {
              defaultValue:
                "e.g. A spacious corner room with a great campus view...",
            })}
            minRows={3}
            autosize
            {...form.getInputProps("description")}
          />

          <NumberInput
            label={t("capacity", { defaultValue: "Capacity (beds per room)" })}
            placeholder={t("capacity_placeholder", { defaultValue: "e.g. 2" })}
            withAsterisk
            min={1}
            max={8}
            {...form.getInputProps("capacity")}
          />

          <TagsInput
            label={t("amenities", { defaultValue: "Amenities" })}
            placeholder={t("amenities_placeholder", {
              defaultValue: "Type and press Enter — e.g. WiFi, AC, Mini Fridge",
            })}
            {...form.getInputProps("amenities")}
          />

          {/* Gallery */}
          <Box>
            <Group justify="space-between" mb={6}>
              <Text size="sm" fw={500}>
                {t("gallery_photos", { defaultValue: "Gallery Photos" })}
              </Text>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <ActionIcon
                variant="light"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title={t("upload_photo", { defaultValue: "Upload photo" })}
              >
                {uploadingIndex === -1 ? (
                  <Loader size={12} />
                ) : (
                  <IconUpload size={14} />
                )}
              </ActionIcon>
            </Group>

            {displayUrls.length > 0 ? (
              <SimpleGrid cols={3} spacing="xs">
                {displayUrls.map((url, i) => (
                  <Box key={i} style={{ position: "relative" }}>
                    <Image
                      src={url}
                      height={80}
                      radius="sm"
                      fit="cover"
                      fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='80'%3E%3Crect fill='%23eee' width='100' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='11'%3ENo preview%3C/text%3E%3C/svg%3E"
                    />
                    {uploadingIndex === i ? (
                      <Box
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(255,255,255,0.7)",
                          borderRadius: 4,
                        }}
                      >
                        <Loader size="xs" />
                      </Box>
                    ) : (
                      <CloseButton
                        size="xs"
                        style={{ position: "absolute", top: 2, right: 2 }}
                        onClick={() => handleRemove(i)}
                        disabled={isUploading}
                      />
                    )}
                  </Box>
                ))}
              </SimpleGrid>
            ) : (
              <Box
                style={{
                  border: "1px dashed var(--mantine-color-default-border)",
                  borderRadius: 8,
                  padding: "20px 12px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <IconPhoto
                  size={24}
                  style={{
                    color: "var(--mantine-color-dimmed)",
                    marginBottom: 4,
                  }}
                />
                <Text size="xs" c="dimmed">
                  {t("click_to_upload_photo", {
                    defaultValue: "Click to upload a photo",
                  })}
                </Text>
              </Box>
            )}
          </Box>

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {initialValues ? t("save") : t("create")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
