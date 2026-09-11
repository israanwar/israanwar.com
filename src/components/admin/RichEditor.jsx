import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo,
} from "lucide-react";

export function RichEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value ?? "",
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  if (!editor) return null;

  const Btn = ({ cmd, active, children, title }) => (
    <button
      type="button"
      onClick={cmd}
      className={active ? "is-active" : ""}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="wpx__editor">
      <div className="wpx__editor-toolbar">
        <Btn cmd={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold size={13} /></Btn>
        <Btn cmd={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic size={13} /></Btn>
        <Btn cmd={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strike"><Strikethrough size={13} /></Btn>
        <Btn cmd={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2"><Heading2 size={13} /></Btn>
        <Btn cmd={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3"><Heading3 size={13} /></Btn>
        <Btn cmd={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bulleted list"><List size={13} /></Btn>
        <Btn cmd={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list"><ListOrdered size={13} /></Btn>
        <Btn cmd={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote"><Quote size={13} /></Btn>
        <Btn cmd={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={13} /></Btn>
        <Btn cmd={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={13} /></Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
