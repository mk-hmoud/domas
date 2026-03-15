import {
  Modal,
  Select,
  Switch,
  Button,
  Stack,
  Group,
  Alert,
  Text,
  Box,
  Divider,
  Table,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  ApplyInventoryTemplateDto,
  InventoryTemplate,
  InventoryScope,
} from "@domas/ts-types";
import { IconInfoCircle, IconAlertTriangle } from "@tabler/icons-react";

interface ApplyTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: ApplyInventoryTemplateDto) => Promise<void>;
  templates: InventoryTemplate[];
  targetType: "location" | "bed";
  count: number;
  loading?: boolean;
}

export function ApplyTemplateModal({
  opened,
  onClose,
  onSubmit,
  templates,
  targetType,
  count,
  loading = false,
}: ApplyTemplateModalProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";

  const form = useForm<ApplyInventoryTemplateDto>({
    initialValues: {
      templateId: 0,
      replace: false,
    },
    validate: {
      templateId: (val) => (val > 0 ? null : t("field_required")),
    },
  });

  const selectedTemplate = templates.find(
    (t) => t.id === form.values.templateId,
  );

  const filteredTemplates = templates.filter((tpl) => {
    if (targetType === "bed") return tpl.scope === InventoryScope.BED;
    return (
      tpl.scope === InventoryScope.ROOM || tpl.scope === InventoryScope.SHARED
    );
  });

  const handleSubmit = async (values: ApplyInventoryTemplateDto) => {
    await onSubmit(values);
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("apply_blueprint", { defaultValue: "Apply Blueprint" })}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Alert color="blue" icon={<IconInfoCircle size={16} />}>
            {t("apply_template_info", {
              count,
              type: t(targetType === "bed" ? "beds" : "locations"),
              defaultValue: `You are applying a blueprint to ${count} ${targetType === "bed" ? "beds" : "locations"}.`,
            })}
          </Alert>

          <Select
            label={t("select_template", { defaultValue: "Select Blueprint" })}
            placeholder={t("pick_one")}
            data={filteredTemplates.map((tpl) => ({
              value: tpl.id.toString(),
              label: tpl.name,
            }))}
            required
            searchable
            {...form.getInputProps("templateId")}
            onChange={(val) => form.setFieldValue("templateId", Number(val))}
            value={
              form.values.templateId === 0
                ? null
                : form.values.templateId.toString()
            }
          />

          {selectedTemplate && (
            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={5}>
                {t("preview_contents", { defaultValue: "Preview Contents" })}
              </Text>
              <Table
                withColumnBorders
                withTableBorder
                bg="light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))"
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("item")}</Table.Th>
                    <Table.Th style={{ width: 60 }}>{t("qty")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedTemplate.items?.map((item, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>
                        {isTr
                          ? item.itemNameTr || "İsimsiz"
                          : item.itemNameEn || "Unnamed"}
                      </Table.Td>
                      <Table.Td>{item.quantity}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          )}

          <Divider mt="xs" />

          <Box>
            <Switch
              label={t("replace_existing_inventory", {
                defaultValue: "Replace existing inventory?",
              })}
              description={t("replace_mode_description", {
                defaultValue:
                  "If enabled, all current inventory items in the target will be deleted before applying the new blueprint.",
              })}
              {...form.getInputProps("replace", { type: "checkbox" })}
            />
            {form.values.replace && (
              <Alert
                color="red"
                icon={<IconAlertTriangle size={16} />}
                mt="sm"
                variant="light"
              >
                <Text size="xs" fw={500}>
                  {t("warning_destructive_action", {
                    defaultValue:
                      "Warning: This action is destructive and will remove current items!",
                  })}
                </Text>
              </Alert>
            )}
          </Box>

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={loading} color="blue">
              {t("apply_now", { defaultValue: "Apply Blueprint Now" })}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
