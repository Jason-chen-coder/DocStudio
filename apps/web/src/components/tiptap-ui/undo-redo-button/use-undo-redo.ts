"use client"

import { useCallback, useEffect, useState } from "react"
import { type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Lib ---
import { isNodeTypeSelected } from "@/lib/tiptap-utils"

// --- Icons ---
import { Redo2Icon } from "@/components/tiptap-icons/redo2-icon"
import { Undo2Icon } from "@/components/tiptap-icons/undo2-icon"

export type UndoRedoAction = "undo" | "redo"

/**
 * Configuration for the history functionality
 */
export interface UseUndoRedoConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * The history action to perform (undo or redo).
   */
  action: UndoRedoAction
  /**
   * Whether the button should hide when action is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful action execution.
   */
  onExecuted?: () => void
}

export const UNDO_REDO_SHORTCUT_KEYS: Record<UndoRedoAction, string> = {
  undo: "mod+z",
  redo: "mod+shift+z",
}

export const historyActionLabels: Record<UndoRedoAction, string> = {
  undo: "Undo",
  redo: "Redo",
}

export const historyIcons = {
  undo: Undo2Icon,
  redo: Redo2Icon,
}

/**
 * Checks if a history action can be executed
 */
export function canExecuteUndoRedoAction(
  editor: Editor | null,
  action: UndoRedoAction
): boolean {
  if (!editor || !editor.isEditable) return false
  if (isNodeTypeSelected(editor, ["image"])) return false

  try {
    // Tiptap v3 UndoRedo uses 'historyUndo' / 'historyRedo' commands.
    // Tiptap v2 History used 'undo' / 'redo'.
    // Use bracket notation to avoid TypeScript CanCommands type constraints
    // while still being safe at runtime via the typeof guard.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const can = editor.can() as Record<string, any>
    if (action === "undo") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return typeof can["historyUndo"] === "function" ? (can["historyUndo"]() as boolean)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        : typeof can["undo"] === "function" ? (can["undo"]() as boolean)
        : false
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return typeof can["historyRedo"] === "function" ? (can["historyRedo"]() as boolean)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        : typeof can["redo"] === "function" ? (can["redo"]() as boolean)
        : false
    }
  } catch {
    return false
  }
}

/**
 * Executes a history action on the editor
 */
export function executeUndoRedoAction(
  editor: Editor | null,
  action: UndoRedoAction
): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canExecuteUndoRedoAction(editor, action)) return false

  const chain = editor.chain().focus()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = chain as Record<string, any>
  try {
    if (action === "undo") {
      return typeof c["historyUndo"] === "function"
        ? c["historyUndo"]().run()
        : chain.undo().run()
    } else {
      return typeof c["historyRedo"] === "function"
        ? c["historyRedo"]().run()
        : chain.redo().run()
    }
  } catch {
    return false
  }
}

/**
 * Determines if the history button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
  action: UndoRedoAction
}): boolean {
  const { editor, hideWhenUnavailable, action } = props

  if (!editor || !editor.isEditable) return false

  if (hideWhenUnavailable && !editor.isActive("code")) {
    return canExecuteUndoRedoAction(editor, action)
  }

  return true
}

/**
 * Custom hook that provides history functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MySimpleUndoButton() {
 *   const { isVisible, handleAction } = useHistory({ action: "undo" })
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleAction}>Undo</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedRedoButton() {
 *   const { isVisible, handleAction, label } = useHistory({
 *     editor: myEditor,
 *     action: "redo",
 *     hideWhenUnavailable: true,
 *     onExecuted: () => console.log('Action executed!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleAction}
 *       aria-label={label}
 *     >
 *       Redo
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useUndoRedo(config: UseUndoRedoConfig) {
  const {
    editor: providedEditor,
    action,
    hideWhenUnavailable = false,
    onExecuted,
  } = config

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canExecute = canExecuteUndoRedoAction(editor, action)

  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable, action }))
    }

    handleUpdate()

    editor.on("transaction", handleUpdate)

    return () => {
      editor.off("transaction", handleUpdate)
    }
  }, [editor, hideWhenUnavailable, action])

  const handleAction = useCallback(() => {
    if (!editor) return false

    const success = executeUndoRedoAction(editor, action)
    if (success) {
      onExecuted?.()
    }
    return success
  }, [editor, action, onExecuted])

  return {
    isVisible,
    handleAction,
    canExecute,
    label: historyActionLabels[action],
    shortcutKeys: UNDO_REDO_SHORTCUT_KEYS[action],
    Icon: historyIcons[action],
  }
}
