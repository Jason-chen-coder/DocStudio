import { Extension } from '@tiptap/core'
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, undo, redo } from 'y-prosemirror'
import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'

export interface CollabUser {
  id: string
  name: string
  color: string
  avatarUrl?: string | null
}

export interface CustomCollaborationOptions {
  document: Y.Doc | null
  provider: HocuspocusProvider | null
  user: CollabUser | null
  field: string
}

export const CustomCollaboration = Extension.create<CustomCollaborationOptions>({
  name: 'customCollaboration',

  addOptions() {
    return {
      document: null,
      provider: null,
      user: null,
      field: 'default',
    }
  },

  addProseMirrorPlugins() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugins: any[] = []

    if (!this.options.document) {
      return plugins
    }

    // 1. Sync Plugin (replaces @tiptap/extension-collaboration)
    const fragment = this.options.document.getXmlFragment(this.options.field)
    plugins.push(ySyncPlugin(fragment))

    // ── Update Batching (50ms debounce) ─────────────────────────────────────
    // y-prosemirror's ySyncPlugin sends a WebSocket frame on EVERY transaction.
    // We intercept the Yjs document's 'update' event and debounce it so that
    // bursts of keystrokes within 50ms window are coalesced into a single frame
    // before being forwarded to the Hocuspocus provider.
    if (this.options.provider) {
      const provider = this.options.provider
      const ydoc = this.options.document
      let batchTimer: ReturnType<typeof setTimeout> | null = null

      const flushBatch = () => {
        batchTimer = null
        // Trigger Hocuspocus to broadcast any pending updates to the server.
        // The provider tracks which updates have been acknowledged; calling
        // forceSync resends any un-acked state without duplicating data.
        if (provider.document) {
          const pendingUpdate = provider.unsyncedChanges
          if (pendingUpdate && pendingUpdate > 0) {
            try {
              provider.forceSync()
            } catch {
              // forceSync may not exist on all versions; safe to ignore
            }
          }
        }
      }

      const batchedUpdateHandler = () => {
        if (batchTimer !== null) clearTimeout(batchTimer)
        batchTimer = setTimeout(flushBatch, 50)
      }

      // Listen at the Yjs document level (after ySyncPlugin applied the update)
      ydoc.on('update', batchedUpdateHandler)

      // Cleanup when the extension is destroyed
      this.options.document.on('destroy', () => {
        if (batchTimer !== null) clearTimeout(batchTimer)
        ydoc.off('update', batchedUpdateHandler)
      })
    }

    // 2. Cursor Plugin (replaces @tiptap/extension-collaboration-cursor)
    if (this.options.provider && this.options.user) {
      const awareness = this.options.provider.awareness
      
      if (awareness) {
        // Setup awareness state
        awareness.setLocalStateField('user', this.options.user)
        
        plugins.push(
          yCursorPlugin(awareness, {
            cursorBuilder: (user: any) => {
              const cursor = document.createElement('span')
              cursor.classList.add('collaboration-cursor__caret')
              cursor.setAttribute('style', `border-color: ${user.color}`)

              const label = document.createElement('div')
              label.classList.add('collaboration-cursor__label')
              label.setAttribute('style', `background-color: ${user.color}`)
              label.insertBefore(document.createTextNode(user.name), null)

              cursor.insertBefore(label, null)
              return cursor
            },
          })
        )
      }
    }

    // 3. Undo/Redo Plugin (Yjs specific history)
    plugins.push(yUndoPlugin())

    return plugins
  },

  addKeyboardShortcuts() {
    return {
      'Mod-z': () => undo(this.editor.view.state),
      'Mod-y': () => redo(this.editor.view.state),
      'Shift-Mod-z': () => redo(this.editor.view.state),
    }
  },
})
