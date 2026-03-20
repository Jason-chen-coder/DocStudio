"use client"

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { useCallback, useRef, useState } from "react"
import { Check, ChevronDown, Copy, ClipboardCheck } from "lucide-react"

/**
 * Supported languages for the dropdown.
 * Grouped by category for the UI, but rendered as a flat list.
 */
const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "scala", label: "Scala" },
  { value: "r", label: "R" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "graphql", label: "GraphQL" },
  { value: "plaintext", label: "Plain Text" },
] as const

function getLabelForLanguage(lang: string | null | undefined): string {
  if (!lang) return "Plain Text"
  const found = LANGUAGES.find((l) => l.value === lang)
  return found ? found.label : lang
}

export function CodeBlockNodeView({
  node,
  updateAttributes,
  extension,
  editor,
}: NodeViewProps) {
  const language = node.attrs.language as string | null
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isEditable = editor.isEditable

  const handleLanguageChange = useCallback(
    (lang: string) => {
      updateAttributes({ language: lang === "plaintext" ? null : lang })
      setIsOpen(false)
      setFilter("")
    },
    [updateAttributes],
  )

  const handleCopy = useCallback(() => {
    const text = node.textContent
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [node])

  const toggleDropdown = useCallback(() => {
    if (!isEditable) return
    setIsOpen((prev) => {
      const next = !prev
      if (next) {
        setFilter("")
        // Focus the filter input after opening
        setTimeout(() => inputRef.current?.focus(), 0)
      }
      return next
    })
  }, [isEditable])

  const filteredLanguages = LANGUAGES.filter((l) =>
    l.label.toLowerCase().includes(filter.toLowerCase()) ||
    l.value.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <NodeViewWrapper className="code-block-wrapper" data-language={language}>
      {/* Top bar */}
      <div
        className="code-block-topbar"
        contentEditable={false}
      >
        {/* Language selector */}
        <div className="code-block-lang-select" ref={dropdownRef}>
          <button
            type="button"
            className="code-block-lang-btn"
            onClick={toggleDropdown}
            title={isEditable ? "切换语言" : undefined}
          >
            <span>{getLabelForLanguage(language)}</span>
            {isEditable && <ChevronDown size={12} style={{ opacity: 0.5 }} />}
          </button>

          {isOpen && (
            <>
              {/* Click-away overlay */}
              <div
                className="code-block-overlay"
                onClick={() => { setIsOpen(false); setFilter("") }}
              />
              <div className="code-block-dropdown">
                <div className="code-block-dropdown-search">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="搜索语言..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setIsOpen(false)
                        setFilter("")
                      }
                      if (e.key === "Enter" && filteredLanguages.length > 0) {
                        handleLanguageChange(filteredLanguages[0].value)
                      }
                    }}
                  />
                </div>
                <div className="code-block-dropdown-list">
                  {filteredLanguages.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      className={`code-block-dropdown-item ${
                        (language === lang.value || (!language && lang.value === "plaintext"))
                          ? "active"
                          : ""
                      }`}
                      onClick={() => handleLanguageChange(lang.value)}
                    >
                      <span>{lang.label}</span>
                      {(language === lang.value || (!language && lang.value === "plaintext")) && (
                        <Check size={14} />
                      )}
                    </button>
                  ))}
                  {filteredLanguages.length === 0 && (
                    <div className="code-block-dropdown-empty">无匹配语言</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Copy button */}
        <button
          type="button"
          className="code-block-copy-btn"
          onClick={handleCopy}
          title="复制代码"
        >
          {copied ? <ClipboardCheck size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Code content — lowlight decorations apply here */}
      <pre>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
