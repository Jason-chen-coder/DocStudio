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
    const plugins = []

    if (!this.options.document) {
      return plugins
    }

    // 1. Sync Plugin (replaces @tiptap/extension-collaboration)
    const fragment = this.options.document.getXmlFragment(this.options.field)
    plugins.push(ySyncPlugin(fragment))

    // 2. Cursor Plugin (replaces @tiptap/extension-collaboration-cursor)
    if (this.options.provider && this.options.user) {
      const awareness = this.options.provider.awareness
      
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
