import './index.css';

import React, { useState } from 'react';
import classNames from 'classnames';

import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown"
import { CodeNode } from "@lexical/code"
import { HashtagNode } from "@lexical/hashtag"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { ListItemNode, ListNode } from "@lexical/list"
import { MarkNode } from "@lexical/mark"
import { OverflowNode } from "@lexical/overflow"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"

import { DropDownProvider } from "./contexts/DropDownContext"
import { SharedHistoryContext } from "./contexts/SharedHistoryContext"
import { KeywordNode } from "./nodes/KeywordNode"
import Editor from './Editor';

type MarkdownEditorProps = {
  name?: string
  value?: string
  onChange: (value: string, name?: string) => void
  label?: string
  className?: string
  labelClassName?: string
  inputClassName?: string
  error?: string
  errorClassName?: string
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  name,
  value: defaultValue = "",
  onChange: handleChange,
  label,
  className = "",
  labelClassName,
  inputClassName,
  error,
  errorClassName,
}) => {
  const [value, setValue] = useState(defaultValue)

  const onChange = (v: string) => {
    handleChange(v, name)
    setValue(v)
  }

  return (
    <div className={className}>
      {label && (
        <label className={classNames(labelClassName || "ml-1 capitalize font-semibold placeholder-gray-200")}>
          {label}
        </label>
      )}
      <LexicalComposer
        initialConfig={{
          namespace: "editor",
          onError: (error) => {
            throw error
          },
          nodes: [
            HeadingNode,
            ListNode,
            ListItemNode,
            QuoteNode,
            CodeNode,
            HashtagNode,
            AutoLinkNode,
            LinkNode,
            OverflowNode,
            MarkNode,
            KeywordNode,
          ],
          editorState: () => $convertFromMarkdownString(value, TRANSFORMERS),
        }}
      >
        <SharedHistoryContext>
          <DropDownProvider>
            <Editor
              value={value}
              onChange={onChange}
              inputClassName={inputClassName}
            />
          </DropDownProvider>
        </SharedHistoryContext>
      </LexicalComposer>
      {error && <div className={errorClassName}>{error}</div>}
    </div>
  )
};
