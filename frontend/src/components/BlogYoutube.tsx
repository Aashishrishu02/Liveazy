import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { X } from "lucide-react";

function getYouTubeEmbedUrl(src: string): string {
  try {
    const url = new URL(src);
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
        url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/)?.[1] ||
        "";
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return "";
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  } catch {
    return "";
  }
}

function YoutubeVideoView({ deleteNode, node }: NodeViewProps) {
  const embedUrl = getYouTubeEmbedUrl(String(node.attrs.src || ""));

  if (!embedUrl) {
    return (
      <NodeViewWrapper className="my-6 rounded-lg border border-red-200 p-3 text-sm text-red-600">
        Invalid YouTube video URL.
        <button
          type="button"
          className="ml-3 underline"
          onMouseDown={(event) => event.preventDefault()}
          onClick={deleteNode}
        >
          Remove video
        </button>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="blog-youtube-node group relative my-6 w-full">
      <button
        type="button"
        title="Remove this YouTube video"
        aria-label="Remove this YouTube video"
        className="absolute -right-2 -top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
        onMouseDown={(event) => event.preventDefault()}
        onClick={deleteNode}
      >
        <X size={20} />
      </button>

      <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
        <iframe
          src={embedUrl}
          title="YouTube video"
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </NodeViewWrapper>
  );
}

const BlogYoutube = Node.create({
  name: "youtube",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-youtube-video]",
        getAttrs: (element) => {
          const wrapper = element as HTMLElement;
          const iframe = wrapper.querySelector("iframe");
          const src = iframe?.getAttribute("src") || "";

          return src ? { src } : false;
        },
      },
      {
        tag: "iframe[src]",
        getAttrs: (element) => {
          const src = (element as HTMLIFrameElement).getAttribute("src") || "";

          return getYouTubeEmbedUrl(src) ? { src } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const embedUrl = getYouTubeEmbedUrl(String(HTMLAttributes.src || ""));

    return [
      "div",
      mergeAttributes({
        "data-youtube-video": "",
      }),
      [
        "iframe",
        {
          src: embedUrl,
          title: "YouTube video",
          width: "640",
          height: "360",
          allowfullscreen: "true",
          frameborder: "0",
          loading: "lazy",
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeVideoView);
  },
});

export default BlogYoutube;
