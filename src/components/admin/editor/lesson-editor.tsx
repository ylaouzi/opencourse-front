"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "./editor-toolbar";

/**
 * The lesson writing surface.
 *
 * The extension set and the server's allowlist (`sanitizeLessonHtml`) are one
 * vocabulary: everything this editor can insert survives a save, and anything
 * it cannot insert is stripped on the way in. Adding an extension here without
 * widening the allowlist means the markup silently disappears — keep the two
 * in step.
 */
export function LessonEditor({
  value,
  onChange,
  onUploadImage,
}: {
  value: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const editor = useEditor({
    // Required under the App Router, or TipTap warns about a hydration mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        // Mirrors the server: no javascript:/data: URL ever gets a mark.
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Image.configure({
        allowBase64: false, // base64 would bloat the row; uploads get a URL
        HTMLAttributes: { class: "lesson-image" },
      }),
      Youtube.configure({
        nocookie: true, // matches the server's preferred host
        modestBranding: true,
        width: 640,
        height: 360,
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Lesson body",
        "data-placeholder": "Write your lesson content here...",
        class: cn(
          "lesson-prose min-h-[60vh] max-w-none px-6 pt-6 pb-24 sm:px-10",
          "focus:outline-none scroll-mt-44 relative",
        ),
      },
      handleDrop(view, event) {
        // Dropping an image straight onto the page is the fastest path from
        // "I have a screenshot" to "it is in the lesson".
        const file = event.dataTransfer?.files?.[0];
        if (!file?.type.startsWith("image/")) return false;

        event.preventDefault();
        void insertUploadedImage(file);
        return true;
      },
      handlePaste(view, event) {
        const file = event.clipboardData?.files?.[0];
        if (!file?.type.startsWith("image/")) return false;

        event.preventDefault();
        void insertUploadedImage(file);
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  async function insertUploadedImage(file: File) {
    const url = await onUploadImage(file);
    editor?.chain().focus().setImage({ src: url }).run();
  }

  // Replaces the document when a different lesson is loaded into this editor.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="bg-muted min-h-[60vh] animate-pulse rounded-lg border" />
    );
  }

  return (
    <div className="bg-card rounded-lg border">
      <EditorToolbar editor={editor} onUploadImage={insertUploadedImage} />
      <div
        className="cursor-text"
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.commands.focus("end");
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
