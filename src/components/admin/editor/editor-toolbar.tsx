"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  MonitorPlay,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Table as TableIcon,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Sticky toolbar. Grouped by job — inline marks, blocks, alignment, media,
 * history — so the shape is scannable rather than one long row of glyphs.
 */
export function EditorToolbar({
  editor,
  onUploadImage,
}: {
  editor: Editor;
  onUploadImage: (file: File) => Promise<void>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      await onUploadImage(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-card/95 sticky top-28 z-20 flex flex-wrap items-center gap-1 rounded-t-lg border-b p-2 shadow-xs backdrop-blur">
      <Group>
        <Tool
          label="Bold"
          icon={Bold}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <Tool
          label="Italic"
          icon={Italic}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <Tool
          label="Underline"
          icon={Underline}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <Tool
          label="Strikethrough"
          icon={Strikethrough}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <Tool
          label="Inline code"
          icon={Code}
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />
      </Group>

      <Group>
        <Tool
          label="Heading 2"
          icon={Heading2}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <Tool
          label="Heading 3"
          icon={Heading3}
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        />
        <Tool
          label="Heading 4"
          icon={Heading4}
          active={editor.isActive("heading", { level: 4 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
        />
      </Group>

      <Group>
        <Tool
          label="Bullet list"
          icon={List}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <Tool
          label="Numbered list"
          icon={ListOrdered}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <Tool
          label="Quote"
          icon={Quote}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <Tool
          label="Code block"
          icon={SquareCode}
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <Tool
          label="Divider"
          icon={Minus}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
      </Group>

      <Group>
        <Tool
          label="Align left"
          icon={AlignLeft}
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        />
        <Tool
          label="Align centre"
          icon={AlignCenter}
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        />
        <Tool
          label="Align right"
          icon={AlignRight}
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        />
      </Group>

      <Group>
        <Tool
          label="Link"
          icon={LinkIcon}
          active={editor.isActive("link")}
          onClick={() => promptForLink(editor)}
        />
        <Tool
          label="Remove link"
          icon={Unlink}
          disabled={!editor.isActive("link")}
          onClick={() =>
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
          }
        />
      </Group>

      <Group>
        <Tool
          label={uploading ? "Uploading image" : "Insert image"}
          icon={uploading ? Loader2 : ImagePlus}
          spinning={uploading}
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        />
        <Tool
          label="Embed video"
          icon={MonitorPlay}
          onClick={() => promptForVideo(editor)}
        />
        <Tool
          label="Insert table"
          icon={TableIcon}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        />
      </Group>

      <Group>
        <Tool
          label="Undo"
          icon={Undo2}
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <Tool
          label="Redo"
          icon={Redo2}
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </Group>

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => {
          void pickImage(e.target.files?.[0]);
          // Reset so picking the same file twice still fires a change.
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 not-last:border-r not-last:pr-1.5">
      {children}
    </div>
  );
}

function Tool({
  label,
  icon: Icon,
  onClick,
  active,
  disabled,
  spinning,
}: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  spinning?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(active && "bg-muted text-foreground")}
    >
      <Icon className={cn("size-3.5", spinning && "animate-spin")} />
    </Button>
  );
}

function promptForLink(editor: Editor) {
  const existing = editor.getAttributes("link").href as string | undefined;
  const input = window.prompt("Link URL", existing ?? "https://");

  if (input === null || input.trim() === "") return;

  // Reject now what the server would strip anyway, and say why.
  let url: URL;
  try {
    url = new URL(input, window.location.origin);
  } catch {
    toast.error("That does not look like a valid URL.");
    return;
  }

  if (!["http:", "https:", "mailto:"].includes(url.protocol)) {
    toast.error("Links must be http, https or mailto.");
    return;
  }

  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: url.href })
    .run();
}

function promptForVideo(editor: Editor) {
  const input = window.prompt("YouTube or Vimeo URL");
  if (!input) return;

  // The server only frames YouTube and Vimeo, so anything else would vanish
  // on save. Better to refuse it here than to lose it silently.
  const allowed =
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i;
  if (!allowed.test(input.trim())) {
    toast.error("Only YouTube and Vimeo links can be embedded.");
    return;
  }

  editor.commands.setYoutubeVideo({ src: input.trim() });
}
