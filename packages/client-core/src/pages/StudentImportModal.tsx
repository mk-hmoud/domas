import { useState } from "react";
import {
  Modal,
  Stack,
  Group,
  Button,
  FileInput,
  Switch,
  Badge,
  Paper,
  ScrollArea,
  Table,
} from "@mantine/core";
import { IconDownload, IconUpload, IconEye } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { imports as importsApi, students } from "@domas/api-client";
import { notifications } from "@mantine/notifications";
import { ImportResultDto } from "@domas/ts-types";

interface StudentImportModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StudentImportModal({
  opened,
  onClose,
  onSuccess,
}: StudentImportModalProps) {
  const { t } = useTranslation();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDryRun, setImportDryRun] = useState(true);
  const [importUpdateExisting, setImportUpdateExisting] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultDto | null>(
    null,
  );

  const handleClose = () => {
    setImportFile(null);
    setImportDryRun(true);
    setImportUpdateExisting(false);
    setImportResult(null);
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      await students.downloadImportTemplate();
    } catch {
      notifications.show({
        title: t("error"),
        message: t("action_failed", { defaultValue: "Action failed" }),
        color: "red",
      });
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    try {
      const result = await importsApi.bulkImport({
        file: importFile,
        dryRun: importDryRun,
        updateExisting: importUpdateExisting,
      });
      setImportResult(result);
      if (!importDryRun && result.success) {
        notifications.show({
          title: t("success"),
          message: t("import_complete", {
            defaultValue: "Import complete: {{count}} students imported",
            count: result.summary.successful,
          }),
          color: "green",
        });
        onSuccess();
      }
    } catch {
      notifications.show({
        title: t("error"),
        message: t("import_failed", { defaultValue: "Import failed" }),
        color: "red",
      });
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("import_students", { defaultValue: "Import Students" })}
      size="xl"
    >
      <Stack gap="md">
        <Group justify="flex-end">
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconDownload size={14} />}
            onClick={handleDownloadTemplate}
          >
            {t("download_template", { defaultValue: "Download Template" })}
          </Button>
        </Group>

        <FileInput
          label={t("select_excel_file", {
            defaultValue: "Select Excel file (.xlsx)",
          })}
          placeholder={t("click_to_browse", {
            defaultValue: "Click to browse…",
          })}
          accept=".xlsx,.xls"
          value={importFile}
          onChange={(f) => {
            setImportFile(f);
            setImportResult(null);
          }}
          leftSection={<IconUpload size={16} />}
          clearable
        />

        <Group>
          <Switch
            label={t("dry_run_label", {
              defaultValue: "Validate only (dry run)",
            })}
            checked={importDryRun}
            onChange={(e) => {
              setImportDryRun(e.currentTarget.checked);
              setImportResult(null);
            }}
          />
          <Switch
            label={t("update_existing_label", {
              defaultValue: "Update existing students",
            })}
            checked={importUpdateExisting}
            onChange={(e) => setImportUpdateExisting(e.currentTarget.checked)}
          />
        </Group>

        {importResult && (
          <Stack gap="xs">
            <Group gap="xs">
              <Badge color="blue">
                {t("total")}: {importResult.summary.total}
              </Badge>
              <Badge color="green">
                {t("success")}: {importResult.summary.successful}
              </Badge>
              {importResult.summary.failed > 0 && (
                <Badge color="red">
                  {t("failed")}: {importResult.summary.failed}
                </Badge>
              )}
              {importResult.summary.skipped > 0 && (
                <Badge color="gray">
                  {t("skipped")}: {importResult.summary.skipped}
                </Badge>
              )}
            </Group>

            {importResult.results.some((r) => r.status !== "success") && (
              <Paper withBorder radius="md">
                <ScrollArea mah={280}>
                  <Table fz="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t("row", { defaultValue: "Row" })}</Table.Th>
                        <Table.Th>{t("student_number")}</Table.Th>
                        <Table.Th>{t("name")}</Table.Th>
                        <Table.Th>{t("status")}</Table.Th>
                        <Table.Th>{t("error")}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {importResult.results
                        .filter((r) => r.status !== "success")
                        .map((r) => (
                          <Table.Tr key={r.row}>
                            <Table.Td>{r.row}</Table.Td>
                            <Table.Td>{r.data.studentNumber}</Table.Td>
                            <Table.Td>
                              {r.data.firstName} {r.data.lastName}
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                size="xs"
                                color={r.status === "skipped" ? "gray" : "red"}
                              >
                                {r.status}
                              </Badge>
                            </Table.Td>
                            <Table.Td c="red">{r.error ?? "—"}</Table.Td>
                          </Table.Tr>
                        ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            )}
          </Stack>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button
            leftSection={
              importDryRun ? <IconEye size={16} /> : <IconUpload size={16} />
            }
            onClick={handleImport}
            loading={importLoading}
            disabled={!importFile}
            color={importDryRun ? "blue" : "green"}
          >
            {importDryRun
              ? t("validate", { defaultValue: "Validate" })
              : t("import", { defaultValue: "Import" })}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
