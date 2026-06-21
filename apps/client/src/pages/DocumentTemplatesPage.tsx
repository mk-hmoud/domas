import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import { PageHeader, PageShell, EmptyState } from '@domas/ui';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { Editor as TiptapEditorInstance } from '@tiptap/react';
import { RichTextTemplateEditor } from '../components/document-templates/RichTextTemplateEditor';
import { IconCopy, IconEye, IconPlus, IconRocket, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { documentTemplates } from '@domas/api-client';
import {
  DocumentLanguage,
  DocumentTemplate,
  DocumentType,
  DocumentTypeInfo,
} from '@domas/ts-types';

const DOCUMENT_LANGUAGES: { label: string; value: DocumentLanguage }[] = [
  { label: 'English', value: 'en' },
  { label: 'Türkçe', value: 'tr' },
];

export function DocumentTemplatesPage() {
  const { t } = useTranslation();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const monacoTheme = computedColorScheme === 'dark' ? 'vs-dark' : 'light';
  const [types, setTypes] = useState<DocumentTypeInfo[]>([]);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<DocumentLanguage>('en');
  const [versions, setVersions] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const [editorOpened, setEditorOpened] = useState(false);
  const [editingSeed, setEditingSeed] = useState<DocumentTemplate | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<DocumentLanguage>('en');
  const [name, setName] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [css, setCss] = useState('');
  const [htmlEditMode, setHtmlEditMode] = useState<'visual' | 'code'>('visual');
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const tiptapEditorRef = useRef<TiptapEditorInstance | null>(null);
  const monacoEditorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleTiptapReady = useCallback((editor: TiptapEditorInstance | null) => {
    tiptapEditorRef.current = editor;
  }, []);

  const handleMonacoMount: OnMount = (editor) => {
    monacoEditorRef.current = editor;
  };

  const insertMergeField = (field: string) => {
    if (htmlEditMode === 'visual') {
      tiptapEditorRef.current?.chain().focus().insertContent(field).run();
      return;
    }
    const monacoEditor = monacoEditorRef.current;
    const selection = monacoEditor?.getSelection();
    if (!monacoEditor || !selection) return;
    monacoEditor.executeEdits('insert-merge-field', [
      { range: selection, text: field, forceMoveMarkers: true },
    ]);
    monacoEditor.focus();
  };

  useEffect(() => {
    documentTemplates.listTypes().then((data) => {
      setTypes(data);
      if (data.length > 0) setSelectedType(data[0].documentType);
    });
  }, []);

  const loadVersions = async (type: DocumentType, language: DocumentLanguage) => {
    setLoading(true);
    try {
      const data = await documentTemplates.findVersions(type, language);
      setVersions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedType) loadVersions(selectedType, selectedLanguage);
  }, [selectedType, selectedLanguage]);

  const activeVersion = versions.find((v) => v.isActive) ?? null;
  const currentTypeInfo = types.find((info) => info.documentType === selectedType);

  const openNewVersion = () => {
    setEditingSeed(null);
    setEditingLanguage(selectedLanguage);
    setName('');
    setHtmlBody('<div>\n\n</div>');
    setCss('');
    setHtmlEditMode('visual');
    setEditorOpened(true);
  };

  const openEditCopy = (version: DocumentTemplate) => {
    setEditingSeed(version);
    setEditingLanguage(version.language);
    setName(`${version.name} (copy)`);
    setHtmlBody(version.htmlBody);
    setCss(version.css);
    setHtmlEditMode('visual');
    setEditorOpened(true);
  };

  const handleSave = async () => {
    if (!selectedType || !name.trim() || !htmlBody.trim()) return;
    setSaving(true);
    try {
      await documentTemplates.create({
        documentType: selectedType,
        language: editingLanguage,
        name: name.trim(),
        htmlBody,
        css,
      });
      notifications.show({ title: t('success'), message: t('template_created'), color: 'green' });
      setEditorOpened(false);
      loadVersions(selectedType, selectedLanguage);
    } catch {
      notifications.show({ title: t('error'), message: t('failed_to_save'), color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedType || !htmlBody.trim()) return;
    setPreviewing(true);
    try {
      const blob = await documentTemplates.preview({
        documentType: selectedType,
        language: editingLanguage,
        htmlBody,
        css,
      });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      notifications.show({ title: t('error'), message: t('preview_failed'), color: 'red' });
    } finally {
      setPreviewing(false);
    }
  };

  const handlePublish = async (id: string) => {
    if (!selectedType) return;
    try {
      await documentTemplates.publish(id);
      notifications.show({
        title: t('success'),
        message: t('template_publish_success'),
        color: 'green',
      });
      loadVersions(selectedType, selectedLanguage);
    } catch {
      notifications.show({ title: t('error'), message: t('failed_to_save'), color: 'red' });
    }
  };

  const handleDelete = (version: DocumentTemplate) => {
    modals.openConfirmModal({
      title: t('template_delete_confirm_title'),
      children: <Text size="sm">{t('template_delete_confirm_message')}</Text>,
      labels: { confirm: t('confirm'), cancel: t('cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await documentTemplates.remove(version.id);
          notifications.show({
            title: t('success'),
            message: t('template_deleted'),
            color: 'green',
          });
          if (selectedType) loadVersions(selectedType, selectedLanguage);
        } catch {
          notifications.show({
            title: t('error'),
            message: t('cannot_delete_active_template'),
            color: 'red',
          });
        }
      },
    });
  };

  return (
    <>
      <PageHeader title={t('document_templates')} subtitle={t('document_templates_description')} />
      <PageShell size="xl">
        <Stack gap="md">
          <Group justify="space-between">
            {types.length > 0 && (
              <SegmentedControl
                value={selectedType ?? types[0].documentType}
                onChange={(value) => setSelectedType(value as DocumentType)}
                data={types.map((info) => ({ label: info.label, value: info.documentType }))}
              />
            )}
            <SegmentedControl
              value={selectedLanguage}
              onChange={(value) => setSelectedLanguage(value as DocumentLanguage)}
              data={DOCUMENT_LANGUAGES}
            />
          </Group>

          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="sm">
              <Text fw={600}>{t('version_history')}</Text>
              <Button
                leftSection={<IconPlus size={14} />}
                onClick={openNewVersion}
                disabled={!selectedType}
              >
                {t('new_version')}
              </Button>
            </Group>

            {!activeVersion && (
              <Text size="xs" c="dimmed" mb="sm">
                {t('no_active_version_hint')}
              </Text>
            )}

            {versions.length === 0 && !loading ? (
              <EmptyState title={t('no_records_found')} />
            ) : (
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('name')}</Table.Th>
                    <Table.Th>{t('status')}</Table.Th>
                    <Table.Th>{t('created_at')}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {versions.map((version) => (
                    <Table.Tr key={version.id}>
                      <Table.Td>{version.name}</Table.Td>
                      <Table.Td>
                        {version.isActive ? (
                          <Badge color="green">{t('active')}</Badge>
                        ) : (
                          <Badge color="gray" variant="light">
                            {t('draft')}
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {t('created_by_on', {
                            name: version.createdByName || '—',
                            date: new Date(version.createdAt).toLocaleDateString(),
                          })}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end">
                          <Tooltip label={t('edit_copy')}>
                            <ActionIcon variant="light" onClick={() => openEditCopy(version)}>
                              <IconCopy size={14} />
                            </ActionIcon>
                          </Tooltip>
                          {!version.isActive && (
                            <Tooltip label={t('publish')}>
                              <ActionIcon
                                variant="light"
                                color="green"
                                onClick={() => handlePublish(version.id)}
                              >
                                <IconRocket size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          {!version.isActive && (
                            <Tooltip label={t('delete')}>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => handleDelete(version)}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Stack>

        <Modal
          opened={editorOpened}
          onClose={() => setEditorOpened(false)}
          title={editingSeed ? t('edit_copy') : t('new_version')}
          size="90%"
        >
          <Stack gap="md">
            <TextInput
              label={t('version_name')}
              placeholder={t('version_name_placeholder')}
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              required
            />

            {currentTypeInfo && (
              <Card withBorder p="xs" radius="md">
                <Text size="xs" fw={600} mb={4}>
                  {t('merge_fields')}
                </Text>
                <Text size="xs" c="dimmed" mb={6}>
                  {t('merge_fields_hint')}
                </Text>
                <Group gap={4}>
                  {currentTypeInfo.fields.map((field) => (
                    <Badge
                      key={field}
                      component="button"
                      type="button"
                      onClick={() => insertMergeField(field)}
                      variant="light"
                      ff="monospace"
                      tt="none"
                      style={{ cursor: 'pointer' }}
                    >
                      {field}
                    </Badge>
                  ))}
                </Group>
              </Card>
            )}

            <Tabs defaultValue="html">
              <Tabs.List>
                <Tabs.Tab value="html">{t('html_body')}</Tabs.Tab>
                <Tabs.Tab value="css">{t('css')}</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="html" pt="xs">
                <Stack gap="xs">
                  <SegmentedControl
                    size="xs"
                    value={htmlEditMode}
                    onChange={(value) => setHtmlEditMode(value as 'visual' | 'code')}
                    data={[
                      { label: t('visual_mode'), value: 'visual' },
                      { label: t('code_mode'), value: 'code' },
                    ]}
                    style={{ alignSelf: 'flex-start' }}
                  />
                  {htmlEditMode === 'visual' ? (
                    <RichTextTemplateEditor
                      value={htmlBody}
                      onChange={setHtmlBody}
                      onEditorReady={handleTiptapReady}
                      editorKey={`${editingSeed?.id ?? 'new'}-${editorOpened}`}
                    />
                  ) : (
                    <Editor
                      height="420px"
                      language="html"
                      theme={monacoTheme}
                      value={htmlBody}
                      onChange={(value) => setHtmlBody(value ?? '')}
                      onMount={handleMonacoMount}
                      options={{ minimap: { enabled: false }, fontSize: 13 }}
                    />
                  )}
                </Stack>
              </Tabs.Panel>
              <Tabs.Panel value="css" pt="xs">
                <Editor
                  height="420px"
                  language="css"
                  theme={monacoTheme}
                  value={css}
                  onChange={(value) => setCss(value ?? '')}
                  options={{ minimap: { enabled: false }, fontSize: 13 }}
                />
              </Tabs.Panel>
            </Tabs>

            <Group justify="space-between">
              <Button
                variant="default"
                leftSection={<IconEye size={14} />}
                onClick={handlePreview}
                loading={previewing}
                disabled={!htmlBody.trim()}
              >
                {t('preview')}
              </Button>
              <Group>
                <Button variant="default" onClick={() => setEditorOpened(false)}>
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleSave}
                  loading={saving}
                  disabled={!name.trim() || !htmlBody.trim()}
                >
                  {t('save_draft')}
                </Button>
              </Group>
            </Group>
          </Stack>
        </Modal>
      </PageShell>
    </>
  );
}
