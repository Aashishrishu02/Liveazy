
import { Node, mergeAttributes } from "@tiptap/core";

const BlogVideo = Node.create({
  name: "blogVideo",

  group: "block",

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
      preload: {
        default: "metadata",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "video[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: true,
        preload: "metadata",
        playsinline: true,
        class: "my-6 w-full max-w-3xl rounded-xl",
      }),
    ];
  },
});

export default BlogVideo;
