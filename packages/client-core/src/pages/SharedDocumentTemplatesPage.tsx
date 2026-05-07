import { useCallback, useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Code,
  Divider,
  Group,
  NumberInput,
  ScrollArea,
  Select,
  Stack,
  SegmentedControl,
  Tabs,
  Text,
  Textarea,
  Checkbox,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconChevronDown,
  IconChevronUp,
  IconDeviceFloppy,
  IconInfoCircle,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { PageHeader } from "@domas/ui";
import { documentTemplates as api } from "@domas/api-client";
import type {
  DocumentSection,
  DocumentTemplate,
  RulesListSection,
  SignatureRowSection,
  SpacerSection,
  TextSection,
} from "@domas/ts-types";

// ─── Placeholder reference ────────────────────────────────────────────────────

const CHECK_IN_PLACEHOLDERS = [
  "{{student.fullName}}",
  "{{student.studentNumber}}",
  "{{room.name}}",
  "{{bed.label}}",
  "{{staff.fullName}}",
  "{{manager.fullName}}",
  "{{now}}",
];

const CHECK_OUT_PLACEHOLDERS = [
  ...CHECK_IN_PLACEHOLDERS,
  "{{deposit.total}} (via deposit_info section)",
  "{{deposit.deductions}} (via deposit_info section)",
  "{{deposit.refund}} (via deposit_info section)",
];

function PlaceholdersPanel({ type }: { type: string }) {
  const [open, setOpen] = useState(false);
  const vars =
    type === "check_in" ? CHECK_IN_PLACEHOLDERS : CHECK_OUT_PLACEHOLDERS;
  return (
    <Card withBorder p="sm" mb="md">
      <Group
        justify="space-between"
        style={{ cursor: "pointer" }}
        onClick={() => setOpen((o) => !o)}
      >
        <Group gap="xs">
          <IconInfoCircle size={16} />
          <Text size="sm" fw={500}>
            Available Placeholders
          </Text>
        </Group>
        {open ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
      </Group>
      <Collapse in={open}>
        <Divider my="xs" />
        <Group gap="xs">
          {vars.map((v) => (
            <Code key={v}>{v}</Code>
          ))}
        </Group>
      </Collapse>
    </Card>
  );
}

// ─── Section editors ──────────────────────────────────────────────────────────

function TextSectionEditor({
  section,
  onChange,
}: {
  section: TextSection;
  onChange: (s: TextSection) => void;
}) {
  return (
    <Card withBorder p="sm">
      <Group justify="space-between" mb="xs" wrap="wrap" gap="xs">
        <Badge variant="outline" color="blue" size="sm">
          text
        </Badge>
        <Group gap="xs">
          <Checkbox
            label="Bold"
            size="xs"
            checked={!!section.bold}
            onChange={(e) =>
              onChange({ ...section, bold: e.currentTarget.checked })
            }
          />
          <Checkbox
            label="Underline"
            size="xs"
            checked={!!section.underline}
            onChange={(e) =>
              onChange({ ...section, underline: e.currentTarget.checked })
            }
          />
          <Select
            size="xs"
            w={100}
            placeholder="Align"
            value={section.align ?? "left"}
            data={["left", "center", "right", "justify"]}
            onChange={(v) =>
              onChange({
                ...section,
                align: (v as TextSection["align"]) ?? "left",
              })
            }
          />
          <NumberInput
            size="xs"
            w={70}
            min={7}
            max={20}
            placeholder="Size"
            value={section.fontSize ?? 10}
            onChange={(v) => onChange({ ...section, fontSize: Number(v) })}
          />
        </Group>
      </Group>
      <Textarea
        value={section.content}
        autosize
        minRows={2}
        onChange={(e) =>
          onChange({ ...section, content: e.currentTarget.value })
        }
      />
    </Card>
  );
}

function RulesListSectionEditor({
  section,
  onChange,
}: {
  section: RulesListSection;
  onChange: (s: RulesListSection) => void;
}) {
  const update = (i: number, value: string) => {
    const items = [...section.items];
    items[i] = value;
    onChange({ ...section, items });
  };
  const remove = (i: number) => {
    onChange({
      ...section,
      items: section.items.filter((_, idx) => idx !== i),
    });
  };
  const add = () => {
    const n = section.items.length + 1;
    onChange({ ...section, items: [...section.items, `${n}. `] });
  };

  return (
    <Card withBorder p="sm">
      <Group justify="space-between" mb="xs">
        <Badge variant="outline" color="grape" size="sm">
          rules_list
        </Badge>
        <Text size="xs" c="dimmed">
          {section.items.length} items
        </Text>
      </Group>
      <Stack gap="xs">
        {section.items.map((item, i) => (
          <Group key={i} align="flex-start" gap="xs">
            <Textarea
              style={{ flex: 1 }}
              value={item}
              autosize
              minRows={1}
              onChange={(e) => update(i, e.currentTarget.value)}
            />
            <ActionIcon
              color="red"
              variant="subtle"
              mt={4}
              onClick={() => remove(i)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        ))}
        <Button
          size="xs"
          variant="subtle"
          leftSection={<IconPlus size={14} />}
          onClick={add}
          w="fit-content"
        >
          Add item
        </Button>
      </Stack>
    </Card>
  );
}

function SpacerSectionEditor({
  section,
  onChange,
}: {
  section: SpacerSection;
  onChange: (s: SpacerSection) => void;
}) {
  return (
    <Card withBorder p="xs" bg="gray.0">
      <Group gap="xs">
        <Badge variant="outline" color="gray" size="sm">
          spacer
        </Badge>
        <NumberInput
          size="xs"
          w={70}
          min={0.5}
          max={5}
          step={0.5}
          value={section.lines ?? 1}
          onChange={(v) => onChange({ ...section, lines: Number(v) })}
        />
        <Text size="xs" c="dimmed">
          lines
        </Text>
      </Group>
    </Card>
  );
}

function SignatureRowEditor({
  section,
  onChange,
}: {
  section: SignatureRowSection;
  onChange: (s: SignatureRowSection) => void;
}) {
  const updateLabel = (i: number, label: string) => {
    const columns = section.columns.map((col, idx) =>
      idx === i ? { ...col, label } : col,
    );
    onChange({ ...section, columns });
  };

  return (
    <Card withBorder p="sm">
      <Badge variant="outline" color="indigo" size="sm" mb="xs">
        signature_row
      </Badge>
      <Group grow gap="xs">
        {section.columns.map((col, i) => (
          <Stack key={i} gap={4}>
            <Text size="xs" c="dimmed">
              Col {i + 1} label
            </Text>
            <Textarea
              size="xs"
              value={col.label}
              autosize
              minRows={1}
              onChange={(e) => updateLabel(i, e.currentTarget.value)}
            />
            <Text size="xs" c="dimmed">
              data: {col.nameVar}
            </Text>
          </Stack>
        ))}
      </Group>
    </Card>
  );
}

function DynamicSectionBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    inventory_table: "teal",
    liability_table: "orange",
    deposit_info: "violet",
    page_break: "dark",
  };
  return (
    <Card withBorder p="xs" bg="gray.0">
      <Badge color={colorMap[type] ?? "gray"} variant="light">
        {type.replace(/_/g, " ")}
      </Badge>
    </Card>
  );
}

function SectionEditor({
  section,
  onChange,
}: {
  section: DocumentSection;
  onChange: (s: DocumentSection) => void;
}) {
  switch (section.type) {
    case "text":
      return (
        <TextSectionEditor
          section={section}
          onChange={onChange as (s: TextSection) => void}
        />
      );
    case "rules_list":
      return (
        <RulesListSectionEditor
          section={section}
          onChange={onChange as (s: RulesListSection) => void}
        />
      );
    case "spacer":
      return (
        <SpacerSectionEditor
          section={section}
          onChange={onChange as (s: SpacerSection) => void}
        />
      );
    case "signature_row":
      return (
        <SignatureRowEditor
          section={section}
          onChange={onChange as (s: SignatureRowSection) => void}
        />
      );
    case "inventory_table":
    case "liability_table":
    case "deposit_info":
    case "page_break":
      return <DynamicSectionBadge type={section.type} />;
    default:
      return null;
  }
}

// ─── Template editor ──────────────────────────────────────────────────────────

function TemplateEditor({ template }: { template: DocumentTemplate }) {
  const [sections, setSections] = useState<DocumentSection[]>(
    template.sections,
  );
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setSections(template.sections);
    setIsDirty(false);
  }, [template.id]);

  const updateSection = useCallback(
    (index: number, section: DocumentSection) => {
      setSections((prev) => {
        const next = [...prev];
        next[index] = section;
        return next;
      });
      setIsDirty(true);
    },
    [],
  );

  const save = async () => {
    setSaving(true);
    try {
      await api.update(template.id, { sections });
      setIsDirty(false);
      notifications.show({
        title: "Saved",
        message: `${template.title} updated successfully.`,
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save template.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {sections.length} sections
        </Text>
        <Button
          size="sm"
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={save}
          loading={saving}
          disabled={!isDirty}
        >
          Save Changes
        </Button>
      </Group>

      <ScrollArea.Autosize mah="calc(100vh - 280px)">
        <Stack gap="xs" pr={4}>
          {sections.map((section, i) => (
            <SectionEditor
              key={i}
              section={section}
              onChange={(s) => updateSection(i, s)}
            />
          ))}
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SharedDocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<"check_in" | "check_out">(
    "check_in",
  );
  const [activeLang, setActiveLang] = useState<"TR" | "EN">("EN");

  useEffect(() => {
    api
      .getAll()
      .then(setTemplates)
      .catch(() =>
        notifications.show({
          title: "Error",
          message: "Failed to load templates.",
          color: "red",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const current = templates.find(
    (t) => t.type === activeType && t.language === activeLang,
  );

  return (
    <Box>
      <PageHeader
        title="Document Templates"
        subtitle="Edit the content sections of check-in and check-out contracts."
      />

      <PlaceholdersPanel type={activeType} />

      <Tabs
        value={activeType}
        onChange={(v) => setActiveType(v as "check_in" | "check_out")}
        mb="md"
      >
        <Tabs.List>
          <Tabs.Tab value="check_in">Check-In Contract</Tabs.Tab>
          <Tabs.Tab value="check_out">Check-Out Form</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Group mb="md">
        <Text size="sm" fw={500}>
          Language:
        </Text>
        <SegmentedControl
          size="sm"
          value={activeLang}
          onChange={(v) => setActiveLang(v as "TR" | "EN")}
          data={[
            { label: "English (EN)", value: "EN" },
            { label: "Turkish (TR)", value: "TR" },
          ]}
        />
      </Group>

      {loading ? (
        <Text c="dimmed" size="sm">
          Loading templates…
        </Text>
      ) : current ? (
        <TemplateEditor key={current.id} template={current} />
      ) : (
        <Text c="dimmed" size="sm">
          No template found for this type and language.
        </Text>
      )}
    </Box>
  );
}
