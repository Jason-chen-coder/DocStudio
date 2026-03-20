import { Extension } from '@tiptap/core'
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, undo, redo, ySyncPluginKey, yUndoPluginKey } from 'y-prosemirror'
import { UndoManager } from 'yjs'
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

  addStorage() {
    return {
      undoManager: null as UndoManager | null,
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
    const syncPlugin = ySyncPlugin(fragment)
    plugins.push(syncPlugin)

    // ── Update Batching (50ms debounce) ─────────────────────────────────────
    if (this.options.provider) {
      const provider = this.options.provider
      const ydoc = this.options.document
      let batchTimer: ReturnType<typeof setTimeout> | null = null

      const flushBatch = () => {
        batchTimer = null
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

      ydoc.on('update', batchedUpdateHandler)

      this.options.document.on('destroy', () => {
        if (batchTimer !== null) clearTimeout(batchTimer)
        ydoc.off('update', batchedUpdateHandler)
      })
    }

    // 2. Cursor Plugin (replaces @tiptap/extension-collaboration-cursor)
    if (this.options.provider && this.options.user) {
      const awareness = this.options.provider.awareness

      if (awareness) {
        // Generate a semi-transparent version of the user color for selection highlight
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }

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
            // Remote selection decoration: use the user's color at 25% opacity
            selectionBuilder: (user: any) => {
              return {
                class: 'yjs-cursor-selection',
                style: `--yjs-selection-color: ${hexToRgba(user.color || '#6495ED', 0.25)}`,
              }
            },
          })
        )
      }
    }

    // 3. Undo/Redo Plugin — create UndoManager manually to guarantee
    //    trackedOrigins matches the actual syncPlugin instance.
    //    This avoids the PluginKey instance mismatch that occurs when
    //    bundlers create multiple copies of y-prosemirror.
    const undoManager = new UndoManager(fragment, {
      trackedOrigins: new Set([ySyncPluginKey, syncPlugin]),
      captureTransaction: (tr: any) => tr.meta.get('addToHistory') !== false,
    })
    this.storage.undoManager = undoManager
    plugins.push(yUndoPlugin({ undoManager }))

    return plugins
  },

  addCommands() {
    return {
      undo: () => ({ state, dispatch }: { state: any; dispatch: any }) => {
        if (!dispatch) {
          // Dry-run for can() check
          return this.storage.undoManager
            ? this.storage.undoManager.undoStack.length > 0
            : false
        }
        return undo(state)
      },
      redo: () => ({ state, dispatch }: { state: any; dispatch: any }) => {
        if (!dispatch) {
          // Dry-run for can() check
          return this.storage.undoManager
            ? this.storage.undoManager.redoStack.length > 0
            : false
        }
        return redo(state)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-z': () => undo(this.editor.view.state),
      'Mod-y': () => redo(this.editor.view.state),
      'Shift-Mod-z': () => redo(this.editor.view.state),
    }
  },
})
