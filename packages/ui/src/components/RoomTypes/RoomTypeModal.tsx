import { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  ActionIcon,
  Text,
  TagsInput,
  Box,
  Image,
  SimpleGrid,
  CloseButton,
  NumberInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconPlus, IconPhoto } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  RoomType,
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
} from "@domas/ts-types";

export interface RoomTypeModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoomTypeDto | UpdateRoomTypeDto) => Promise<void>;
  initialValues?: RoomType;
}

export function RoomTypeModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
}: RoomTypeModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      galleryUrls: [] as string[],
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
      setUrlInput("");
      if (initialValues) {
        form.setValues({
          name: initialValues.name,
          description: initialValues.description ?? "",
          galleryUrls: initialValues.galleryUrls ?? [],
          amenities: initialValues.amenities ?? [],
          capacity: initialValues.capacity,
        });
      } else {
        form.reset();
      }
    }
  }, [opened]);

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    form.setFieldValue("galleryUrls", [...form.values.galleryUrls, trimmed]);
    setUrlInput("");
  };

  const removeUrl = (index: number) => {
    form.setFieldValue(
      "galleryUrls",
      form.values.galleryUrls.filter((_, i) => i !== index),
    );
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await onSubmit({
        name: values.name,
        description: values.description || undefined,
        galleryUrls: values.galleryUrls,
        amenities: values.amenities,
        capacity: values.capacity,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
            placeholder={t("capacity_placeholder", {
              defaultValue: "e.g. 2",
            })}
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

          {/* Gallery URLs */}
          <Box>
            <Text size="sm" fw={500} mb={6}>
              {t("gallery_photos", { defaultValue: "Gallery Photos" })}
            </Text>
            <Group gap="xs" align="flex-end">
              <TextInput
                style={{ flex: 1 }}
                placeholder={t("paste_image_url", {
                  defaultValue: "Paste image URL...",
                })}
                leftSection={<IconPhoto size={16} />}
                value={urlInput}
                onChange={(e) => setUrlInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrl();
                  }
                }}
              />
              <ActionIcon
                variant="filled"
                size="lg"
                onClick={addUrl}
                disabled={!urlInput.trim()}
              >
                <IconPlus size={16} />
              </ActionIcon>
            </Group>

            {form.values.galleryUrls.length > 0 && (
              <SimpleGrid cols={3} mt="sm" spacing="xs">
                {form.values.galleryUrls.map((url, i) => (
                  <Box key={i} style={{ position: "relative" }}>
                    <Image
                      src={url}
                      height={80}
                      radius="sm"
                      fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='80'%3E%3Crect fill='%23eee' width='100' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='11'%3ENo preview%3C/text%3E%3C/svg%3E"
                    />
                    <CloseButton
                      size="xs"
                      style={{ position: "absolute", top: 2, right: 2 }}
                      onClick={() => removeUrl(i)}
                    />
                  </Box>
                ))}
              </SimpleGrid>
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
