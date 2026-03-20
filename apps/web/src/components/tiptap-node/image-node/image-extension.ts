import { Image as BaseImage } from "@tiptap/extension-image"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"
import { ImageNodeView } from "./image-node-view"

// Extend the base Image extension with:
// - Resizable React NodeView
// - width attribute persistence
// - Lazy loading & async decoding
// - Paste/drop upload handlers
export const ImageExtension = BaseImage.extend({
  // Make it a block-level draggable node
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const w = element.getAttribute("width") || element.style?.width
          return w ? parseInt(w, 10) || null : null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const h = element.getAttribute("height") || element.style?.height
          return h ? parseInt(h, 10) || null : null
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {}
          return { height: attributes.height }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("imagePasteDropHandler"),
        props: {
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items || [])
            const hasImage = items.some((item) => item.type.startsWith("image/"))

            if (!hasImage) return false

            const files = items
              .filter((item) => item.type.startsWith("image/"))
              .map((item) => item.getAsFile())
              .filter((file): file is File => file !== null)

            if (files.length === 0) return false

            event.preventDefault()

            const { pos } = view.state.selection.$from

            files.forEach(async (file) => {
              if (file.size > MAX_FILE_SIZE) {
                console.error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`)
                return
              }

              try {
                const url = await handleImageUpload(file)
                const node = view.state.schema.nodes.image.create({
                  src: url,
                  alt: file.name.replace(/\.[^/.]+$/, ""),
                  title: file.name.replace(/\.[^/.]+$/, ""),
                })

                const tr = view.state.tr.insert(pos, node)
                view.dispatch(tr)
              } catch (error) {
                console.error("Paste upload failed:", error)
              }
            })

            return true
          },
          handleDrop(view, event, _slice, moved) {
            if (moved) return false

            const files = Array.from(event.dataTransfer?.files || []).filter(
              (file) => file.type.startsWith("image/")
            )

            if (files.length === 0) return false

            event.preventDefault()

            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
            const pos = coordinates ? coordinates.pos : view.state.selection.$from.pos

            files.forEach(async (file) => {
              if (file.size > MAX_FILE_SIZE) {
                console.error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`)
                return
              }

              try {
                const url = await handleImageUpload(file)
                const node = view.state.schema.nodes.image.create({
                  src: url,
                  alt: file.name.replace(/\.[^/.]+$/, ""),
                  title: file.name.replace(/\.[^/.]+$/, ""),
                })

                const tr = view.state.tr.insert(pos, node)
                view.dispatch(tr)
              } catch (error) {
                console.error("Drop upload failed:", error)
              }
            })

            return true
          }
        }
      })
    ]
  }
})
