import { Image as BaseImage } from "@tiptap/extension-image"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// Extend the base Image extension to add lazy loading and async decoding.
// This means images below the fold are not downloaded until the user scrolls
// to them, reducing initial page load time and memory usage significantly.
export const ImageExtension = BaseImage.extend({
  // Override the default renderHTML to inject lazy loading attributes
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      "img",
      {
        ...HTMLAttributes,
        loading: "lazy",       // native browser lazy loading
        decoding: "async",     // decode off main thread
      },
    ]
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
            
            // Upload files directly and then insert image nodes
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
            
            // Try to find the position where the image was dropped
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
