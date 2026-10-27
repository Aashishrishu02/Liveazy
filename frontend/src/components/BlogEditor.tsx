import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import BlogVideo from "./BlogVideo";
import BlogYoutube from "./BlogYoutube";

import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Link as LinkIcon,
  ImagePlus,
  Video,
  Quote,
  Undo2,
  Redo2,
  Trash2,
  Unlink,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

type BlogEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

export default function BlogEditor({ value, onChange }: BlogEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const selectionRef = useRef<{ from: number; to: number } | null>(null);
  const linkSelectionRef = useRef<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),

      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "blog-content-image my-6 max-w-full rounded-xl",
        },
      }),

      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),

      BlogYoutube,
      BlogVideo,
    ],

    content: value || "<p></p>",
    immediatelyRender: false,

    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },

    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[300px] px-4 py-4 outline-none focus:outline-none",
        "aria-label": "Blog article content",
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === (value || "<p></p>")) {
      return;
    }

    editor.commands.setContent(value || "<p></p>");
  }, [editor, value]);

  function selectMedia(type: "image" | "video") {
    if (!editor) return;

    selectionRef.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };

    if (type === "image") {
      imageInputRef.current?.click();
    } else {
      videoInputRef.current?.click();
    }
  }

  async function uploadMedia(file: File, type: "image" | "video") {
    if (!editor) return;

    setUploadError("");

    const maxSize =
      type === "image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;

    const allowedTypes =
      type === "image"
        ? ["image/jpeg", "image/png", "image/webp", "image/gif"]
        : ["video/mp4", "video/webm", "video/quicktime", "video/ogg"];

    if (!allowedTypes.includes(file.type)) {
      setUploadError(
        type === "image"
          ? "Please select a JPG, PNG, WEBP, or GIF image."
          : "Please select an MP4, WEBM, MOV, or OGG video.",
      );
      return;
    }

    if (file.size > maxSize) {
      setUploadError(
        type === "image"
          ? "Image size must not exceed 10 MB."
          : "Video size must not exceed 100 MB.",
      );
      return;
    }

    setUploading(true);

    try {
      const endpoint = type === "image" ? "blog-image" : "blog-video";

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Login session not found. Please sign in to the admin panel again.",
        );
      }

      const response = await fetch(`${API_URL}/upload/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Upload failed (${response.status})`);
      }

      const data = await response.json();

      const mediaUrl =
        data.url || data.imageUrl || data.videoUrl || data.location;

      if (!mediaUrl || typeof mediaUrl !== "string") {
        throw new Error("The upload response did not include a media URL.");
      }

      const savedSelection = selectionRef.current;
      const chain = editor.chain().focus();

      if (savedSelection) {
        chain.setTextSelection(savedSelection);
      }

      if (type === "image") {
        chain
          .setImage({
            src: mediaUrl,
            alt: file.name,
            title: file.name,
          })
          .run();
      } else {
        chain
          .insertContent({
            type: "blogVideo",
            attrs: {
              src: mediaUrl,
              controls: true,
              preload: "metadata",
            },
          })
          .run();
      }

      selectionRef.current = null;
    } catch (error) {
      console.error("Blog media upload failed:", error);

      setUploadError(
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  function insertLink() {
    if (!editor) return;

    const savedSelection = linkSelectionRef.current;
    const currentSelection = editor.state.selection;

    const from = savedSelection?.from ?? currentSelection.from;
    const to = savedSelection?.to ?? currentSelection.to;
    const hasSelectedText = from !== to;

    const previousUrl = editor.getAttributes("link").href as
      | string
      | undefined;

    const urlInput = window.prompt(
      "Enter link URL:",
      previousUrl || "https://",
    );

    if (urlInput === null) {
      linkSelectionRef.current = null;
      return;
    }

    const trimmedUrl = urlInput.trim();

    if (!trimmedUrl) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .extendMarkRange("link")
        .unsetLink()
        .run();

      linkSelectionRef.current = null;
      setUploadError("");
      return;
    }

    try {
      const normalizedUrl =
        /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedUrl)
          ? trimmedUrl
          : `https://${trimmedUrl}`;

      const parsedUrl = new URL(normalizedUrl);

      if (
        !["http:", "https:"].includes(parsedUrl.protocol) ||
        !parsedUrl.hostname.includes(".")
      ) {
        throw new Error("Invalid URL");
      }

      const href = parsedUrl.href;

      if (hasSelectedText) {
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .setMark("link", { href })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .insertContent({
            type: "text",
            text: href,
            marks: [
              {
                type: "link",
                attrs: { href },
              },
            ],
          })
          .run();
      }

      linkSelectionRef.current = null;
      setUploadError("");
    } catch {
      linkSelectionRef.current = null;
      setUploadError("Please enter a valid HTTP or HTTPS URL.");
    }
  }

  function removeSelectedMedia() {
    if (!editor) return;

    const { selection } = editor.state;

    if (
      selection instanceof NodeSelection &&
      ["image", "blogVideo"].includes(selection.node.type.name)
    ) {
      editor.chain().focus().deleteSelection().run();
      return;
    }

    setUploadError("Select an image or uploaded video first.");
  }

  function removeLink() {
    if (!editor) return;

    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  }

  function insertYoutube() {
    if (!editor) return;

    setUploadError("");

    const urlInput = window.prompt("Enter YouTube video URL:");

    if (!urlInput?.trim()) return;

    try {
      const url = new URL(urlInput.trim());
      const host = url.hostname.toLowerCase();

      let videoId = "";

      if (host === "youtu.be") {
        videoId = url.pathname.split("/").filter(Boolean)[0] || "";
      } else if (
        [
          "youtube.com",
          "www.youtube.com",
          "m.youtube.com",
          "youtube-nocookie.com",
          "www.youtube-nocookie.com",
        ].includes(host)
      ) {
        videoId =
          url.searchParams.get("v") ||
          url.pathname.match(
            /^\/(?:embed|shorts|live|v)\/([^/?]+)/,
          )?.[1] ||
          "";
      }

      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        throw new Error("Invalid YouTube URL");
      }

      editor
        .chain()
        .focus()
        .insertContent({
          type: "youtube",
          attrs: {
            src: `https://www.youtube-nocookie.com/embed/${videoId}`,
          },
        })
        .run();
    } catch {
      setUploadError("Please enter a valid YouTube video URL.");
    }
  }

  if (!editor) {
    return (
      <div className="p-4 text-sm text-slate-500">
        Loading editor...
      </div>
    );
  }

  const toolButton =
    "inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) void uploadMedia(file, "image");

          event.currentTarget.value = "";
        }}
      />

      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/ogg"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) void uploadMedia(file, "video");

          event.currentTarget.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3">
        <button
          type="button"
          title="Bold"
          aria-label="Bold"
          className={toolButton}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={17} />
        </button>

        <button
          type="button"
          title="Italic"
          aria-label="Italic"
          className={toolButton}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={17} />
        </button>

        <button
          type="button"
          title="Heading"
          aria-label="Heading"
          className={toolButton}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={17} />
        </button>

        <button
          type="button"
          title="Bullet list"
          aria-label="Bullet list"
          className={toolButton}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={17} />
        </button>

        <button
          type="button"
          title="Numbered list"
          aria-label="Numbered list"
          className={toolButton}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={17} />
        </button>

        <button
          type="button"
          title="Blockquote"
          aria-label="Blockquote"
          className={toolButton}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={17} />
        </button>

        <button
          type="button"
          title="Insert link"
          aria-label="Insert link"
          className={toolButton}
          onMouseDown={(event) => {
            if (editor) {
              linkSelectionRef.current = {
                from: editor.state.selection.from,
                to: editor.state.selection.to,
              };
            }

            event.preventDefault();
          }}
          onClick={insertLink}
        >
          <LinkIcon size={17} />
        </button>

        <button
          type="button"
          title="Upload image"
          aria-label="Upload image"
          className={toolButton}
          disabled={uploading}
          onClick={() => selectMedia("image")}
        >
          <ImagePlus size={17} />
        </button>

        <button
          type="button"
          title="Upload video"
          aria-label="Upload video"
          className={toolButton}
          disabled={uploading}
          onClick={() => selectMedia("video")}
        >
          <Video size={17} />
        </button>

        <button
          type="button"
          title="Embed YouTube"
          className={toolButton}
          onClick={insertYoutube}
        >
          YouTube
        </button>

        <button
          type="button"
          title="Remove selected image/video"
          aria-label="Remove selected image or video"
          className={toolButton}
          onClick={removeSelectedMedia}
        >
          <Trash2 size={17} />
          Remove Media
        </button>

        <button
          type="button"
          title="Remove link"
          aria-label="Remove link"
          className={toolButton}
          onClick={removeLink}
        >
          <Unlink size={17} />
          Remove Link
        </button>

        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          className={toolButton}
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={17} />
        </button>

        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          className={toolButton}
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={17} />
        </button>
      </div>

      {uploading && (
        <p className="border-b border-slate-100 bg-cyan-50 px-4 py-2 text-sm text-cyan-800">
          Media uploading...
        </p>
      )}

      {uploadError && (
        <div className="flex items-start justify-between gap-3 border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="break-words">{uploadError}</span>

          <button
            type="button"
            className="shrink-0"
            onClick={() => setUploadError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
        Images, uploaded videos, and YouTube videos are inserted at the cursor
        position. Each YouTube video has its own ✕ button to remove only that
        video.
      </div>
    </div>
  );
}