import React, { useRef, useState } from "react"
import classNames from "classnames"

import { useSharedHistoryContext } from "./contexts/SharedHistoryContext"

import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { AutoScrollPlugin } from "@lexical/react/LexicalAutoScrollPlugin"
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"

import AutoLinkPlugin from "./plugins/AutoLinkPlugin"
import ClickableLinkPlugin from "./plugins/ClickableLinkPlugin"
import FloatingLinkEditorPlugin from "./plugins/FloatingLinkEditorPlugin"
import KeywordsPlugin from "./plugins/KeywordsPlugin"
import ToolbarPlugin from "./plugins/ToolbarPlugin"

const Editor: React.FC<{
  value: string
  onChange: (_: string) => void
  inputClassName: string | undefined
}> = ({ value, onChange, inputClassName = "" }) => {
  const { historyState } = useSharedHistoryContext()
  const scrollRef = useRef(null)

  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement>()

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  return (
    <div className="editor-shell">
      <ToolbarPlugin value={value} />
      <HistoryPlugin externalHistoryState={historyState} />
      <AutoFocusPlugin />
      <HashtagPlugin />
      <KeywordsPlugin />
      <ListPlugin />
      <AutoLinkPlugin />
      <AutoScrollPlugin scrollRef={scrollRef} />
      <LinkPlugin />
      <ClearEditorPlugin />
      <RichTextPlugin
        contentEditable={
          <div className="editor-scroller">
            <div className="editor" ref={onRef}>
              <ContentEditable
                className={classNames(
                  inputClassName,
                  "rounded-t-none border-t-0"
                )}
                style={{ marginTop: 0 }}
              />
            </div>
          </div>
        }
        placeholder={""}
      />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <ClickableLinkPlugin />
      <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
      <OnChangePlugin
        onChange={(state) => {
          state.read(() => {
            onChange($convertToMarkdownString(TRANSFORMERS))
          })
        }}
      />
    </div>
  )
}

export default Editor
