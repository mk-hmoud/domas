import { useEffect } from 'react';
import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { RichTextEditor } from '@mantine/tiptap';
import {
  IconTable,
  IconTableMinus,
  IconColumnInsertRight,
  IconRowInsertBottom,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface RichTextTemplateEditorProps {
  value: string;
  onChange: (html: string) => void;
  onEditorReady?: (editor: Editor | null) => void;
  editorKey: string;
}

export function RichTextTemplateEditor({
  value,
  onChange,
  onEditorReady,
  editorKey,
}: RichTextTemplateEditorProps) {
  const { t } = useTranslation();

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Underline,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Link,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content: value,
      onUpdate: ({ editor }) => onChange(editor.getHTML()),
    },
    [editorKey],
  );

  useEffect(() => {
    onEditorReady?.(editor ?? null);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

  return (
    <RichTextEditor editor={editor}>
      <RichTextEditor.Toolbar sticky stickyOffset={0}>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
          <RichTextEditor.Strikethrough />
          <RichTextEditor.ClearFormatting />
          <RichTextEditor.Code />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H1 />
          <RichTextEditor.H2 />
          <RichTextEditor.H3 />
          <RichTextEditor.H4 />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Blockquote />
          <RichTextEditor.Hr />
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.AlignLeft />
          <RichTextEditor.AlignCenter />
          <RichTextEditor.AlignRight />
          <RichTextEditor.AlignJustify />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Control
            onClick={() =>
              editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            aria-label={t('insert_table')}
            title={t('insert_table')}
          >
            <IconTable size={16} stroke={1.5} />
          </RichTextEditor.Control>
          <RichTextEditor.Control
            onClick={() => editor?.chain().focus().addColumnAfter().run()}
            aria-label={t('add_table_column')}
            title={t('add_table_column')}
          >
            <IconColumnInsertRight size={16} stroke={1.5} />
          </RichTextEditor.Control>
          <RichTextEditor.Control
            onClick={() => editor?.chain().focus().addRowAfter().run()}
            aria-label={t('add_table_row')}
            title={t('add_table_row')}
          >
            <IconRowInsertBottom size={16} stroke={1.5} />
          </RichTextEditor.Control>
          <RichTextEditor.Control
            onClick={() => editor?.chain().focus().deleteTable().run()}
            aria-label={t('delete_table')}
            title={t('delete_table')}
          >
            <IconTableMinus size={16} stroke={1.5} />
          </RichTextEditor.Control>
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Undo />
          <RichTextEditor.Redo />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
