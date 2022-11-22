/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

 import type { LexicalEditor } from "lexical"

 import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link"
 import {
   $isListNode,
   INSERT_ORDERED_LIST_COMMAND,
   INSERT_UNORDERED_LIST_COMMAND,
   ListNode,
   REMOVE_LIST_COMMAND,
 } from "@lexical/list"
 import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
 import {
   $createHeadingNode,
   $isHeadingNode,
   HeadingTagType,
 } from "@lexical/rich-text"
 import { $wrapNodes } from "@lexical/selection"
 import {
   $findMatchingParent,
   $getNearestNodeOfType,
   mergeRegister,
 } from "@lexical/utils"
 import {
   $createParagraphNode,
   $getSelection,
   $isRangeSelection,
   $isRootOrShadowRoot,
   CAN_REDO_COMMAND,
   CAN_UNDO_COMMAND,
   COMMAND_PRIORITY_CRITICAL,
   FORMAT_TEXT_COMMAND,
   REDO_COMMAND,
   SELECTION_CHANGE_COMMAND,
   UNDO_COMMAND,
 } from "lexical"
 import { useCallback, useEffect, useState } from "react"
 import * as React from "react"
 
 import DropDown, { DropDownItem } from "../ui/DropDown"
 import { getSelectedNode } from "../utils/getSelectedNode"
 import { sanitizeUrl } from "../utils/sanitizeUrl"
 
 const CAN_USE_DOM: boolean =
   typeof window !== "undefined" &&
   typeof window.document !== "undefined" &&
   typeof window.document.createElement !== "undefined"
 
 const IS_APPLE: boolean =
   CAN_USE_DOM && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
 
 const blockTypeToBlockName = {
   bullet: "Bulleted List",
   h3: "Heading",
  //  h2: "Heading 2",
  //  h3: "Heading 3",
   check: "Check List",
   number: "Numbered List",
   paragraph: "Normal",
 }
 
 function dropDownActiveClass(active: boolean) {
   if (active) return "active dropdown-item-active"
   else return ""
 }
 
 function BlockFormatDropDown({
   editor,
   blockType,
   disabled = false,
   value,
 }: {
   blockType: keyof typeof blockTypeToBlockName
   editor: LexicalEditor
   disabled?: boolean
   value: string
 }): JSX.Element {
   const formatParagraph = () => {
     if (blockType !== "paragraph" && value) {
       editor.update(() => {
         const selection = $getSelection()
 
         if ($isRangeSelection(selection)) {
           $wrapNodes(selection, () => $createParagraphNode())
         }
       })
     }
   }
 
   const formatHeading = (headingSize: HeadingTagType) => {
     if (blockType !== headingSize && value) {
       editor.update(() => {
         const selection = $getSelection()
 
         if ($isRangeSelection(selection)) {
           $wrapNodes(selection, () => $createHeadingNode(headingSize))
         }
       })
     }
   }
 
   return (
     <DropDown
       disabled={disabled}
       buttonClassName="toolbar-item block-controls"
       buttonIconClassName={"icon block-type " + blockType}
       buttonLabel={blockTypeToBlockName[blockType]}
       buttonAriaLabel="Formatting options for text style"
     >
       <DropDownItem
         className={"item " + dropDownActiveClass(blockType === "paragraph")}
         onClick={formatParagraph}
       >
         <i className="icon paragraph" />
         <span className="text">Normal</span>
       </DropDownItem>
       {/* Markdown Editor allows for H1 #HP-1610 */}
       {/* <DropDownItem
         className={"item " + dropDownActiveClass(blockType === "h1")}
         onClick={() => formatHeading("h1")}
       >
         <i className="icon h1" />
         <span className="text">Heading</span>
       </DropDownItem>
       <DropDownItem
         className={"item " + dropDownActiveClass(blockType === "h2")}
         onClick={() => formatHeading("h2")}
       >
         <i className="icon h2" />
         <span className="text">Heading 2</span>
       </DropDownItem> */}
       <DropDownItem
         className={"item " + dropDownActiveClass(blockType === "h3")}
         onClick={() => formatHeading("h3")}
       >
         <i className="icon title" />
         <span className="text">Heading</span>
       </DropDownItem>
     </DropDown>
   )
 }
 
 function Divider(): JSX.Element {
   return <div className="divider" />
 }
 
 export default function ToolbarPlugin({
   value,
 }: {
   value: string
 }): JSX.Element {
   const [editor] = useLexicalComposerContext()
   const [activeEditor, setActiveEditor] = useState(editor)
   const [blockType, setBlockType] =
     useState<keyof typeof blockTypeToBlockName>("paragraph")
   const [listType, setListType] = useState("")
   const [isLink, setIsLink] = useState(false)
   const [isBold, setIsBold] = useState(false)
   const [isItalic, setIsItalic] = useState(false)
   const [canUndo, setCanUndo] = useState(false)
   const [canRedo, setCanRedo] = useState(false)
   const [isEditable, setIsEditable] = useState(() => editor.isEditable())
 
   const updateToolbar = useCallback(() => {
     const selection = $getSelection()
     if ($isRangeSelection(selection)) {
       const anchorNode = selection.anchor.getNode()
       let element =
         anchorNode.getKey() === "root"
           ? anchorNode
           : $findMatchingParent(anchorNode, (e) => {
               const parent = e.getParent()
               return parent !== null && $isRootOrShadowRoot(parent)
             })
 
       if (element === null) {
         element = anchorNode.getTopLevelElementOrThrow()
       }
 
       const elementKey = element.getKey()
       const elementDOM = activeEditor.getElementByKey(elementKey)
 
       // Update text format
       setIsBold(selection.hasFormat("bold"))
       setIsItalic(selection.hasFormat("italic"))
 
       // Update links
       const node = getSelectedNode(selection)
       const parent = node.getParent()
       if ($isLinkNode(parent) || $isLinkNode(node)) {
         setIsLink(true)
       } else {
         setIsLink(false)
       }
 
       if (elementDOM !== null) {
         if ($isListNode(element)) {
           const parentList = $getNearestNodeOfType<ListNode>(
             anchorNode,
             ListNode
           )
           const type = parentList
             ? parentList.getListType()
             : element.getListType()
           if (type === "bullet" || type === "number") setListType(type)
           else setBlockType(type)
         } else {
           const type = $isHeadingNode(element)
             ? element.getTag()
             : element.getType()
           if (type in blockTypeToBlockName) {
             setBlockType(type as keyof typeof blockTypeToBlockName)
           }
         }
       }
     }
   }, [activeEditor])
 
   useEffect(() => {
     return editor.registerCommand(
       SELECTION_CHANGE_COMMAND,
       (_payload, newEditor) => {
         updateToolbar()
         setActiveEditor(newEditor)
         return false
       },
       COMMAND_PRIORITY_CRITICAL
     )
   }, [editor, updateToolbar])
 
   useEffect(() => {
     return mergeRegister(
       editor.registerEditableListener((editable) => {
         setIsEditable(editable)
       }),
       activeEditor.registerUpdateListener(({ editorState }) => {
         editorState.read(() => {
           updateToolbar()
         })
       }),
       activeEditor.registerCommand<boolean>(
         CAN_UNDO_COMMAND,
         (payload) => {
           setCanUndo(payload)
           return false
         },
         COMMAND_PRIORITY_CRITICAL
       ),
       activeEditor.registerCommand<boolean>(
         CAN_REDO_COMMAND,
         (payload) => {
           setCanRedo(payload)
           return false
         },
         COMMAND_PRIORITY_CRITICAL
       )
     )
   }, [activeEditor, editor, updateToolbar])
 
   const insertLink = useCallback(() => {
     if (!isLink) {
       editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl("https://"))
     } else {
       editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
     }
   }, [editor, isLink])
 
   const formatBulletList = () => {
     if (listType !== "bullet") {
       editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
     } else {
       editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
     }
   }
 
   const formatNumberedList = () => {
     if (listType !== "number") {
       editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
     } else {
       editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
     }
   }
 
   return (
     <div className="toolbar">
       <button
         type="button"
         disabled={!canUndo || !isEditable}
         onClick={() => {
           activeEditor.dispatchCommand(UNDO_COMMAND, undefined)
         }}
         title={IS_APPLE ? "Undo (⌘Z)" : "Undo (Ctrl+Z)"}
         className="toolbar-item spaced"
         aria-label="Undo"
       >
         <i className="format undo" />
       </button>
       <button
         type="button"
         disabled={!canRedo || !isEditable}
         onClick={() => {
           activeEditor.dispatchCommand(REDO_COMMAND, undefined)
         }}
         title={IS_APPLE ? "Redo (⌘Y)" : "Redo (Ctrl+Y)"}
         className="toolbar-item"
         aria-label="Redo"
       >
         <i className="format redo" />
       </button>
       <Divider />
       {blockType in blockTypeToBlockName && activeEditor === editor && (
         <>
           <BlockFormatDropDown
             disabled={!isEditable}
             blockType={blockType}
             editor={editor}
             value={value}
           />
           <Divider />
         </>
       )}
       <button
         type="button"
         disabled={!isEditable}
         onClick={() => {
           activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
         }}
         className={"toolbar-item spaced " + (isBold ? "active" : "")}
         title={IS_APPLE ? "Bold (⌘B)" : "Bold (Ctrl+B)"}
         aria-label={`Format text as bold. Shortcut: ${
           IS_APPLE ? "⌘B" : "Ctrl+B"
         }`}
       >
         <i className="format bold" />
       </button>
       <button
         type="button"
         disabled={!isEditable}
         onClick={() => {
           activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
         }}
         className={"toolbar-item spaced " + (isItalic ? "active" : "")}
         title={IS_APPLE ? "Italic (⌘I)" : "Italic (Ctrl+I)"}
         aria-label={`Format text as italics. Shortcut: ${
           IS_APPLE ? "⌘I" : "Ctrl+I"
         }`}
       >
         <i className="format italic" />
       </button>
       <button
         type="button"
         disabled={!isEditable}
         onClick={insertLink}
         className={"toolbar-item spaced " + (isLink ? "active" : "")}
         aria-label="Insert link"
         title="Insert link"
       >
         <i className="format link" />
       </button>
       <Divider />
       {activeEditor === editor && (
         <>
           <button
             type="button"
             disabled={!isEditable}
             onClick={formatBulletList}
             className={"toolbar-item spaced " + (isLink ? "active" : "")}
             aria-label="Bullet List"
             title="Bullet List"
           >
             <i className="format bullet-list" />
           </button>
           <button
             type="button"
             disabled={!isEditable}
             onClick={formatNumberedList}
             className={"toolbar-item spaced " + (isLink ? "active" : "")}
             aria-label="Numbered List"
             title="Numbered List"
           >
             <i className="format numbered-list" />
           </button>
         </>
       )}
     </div>
   )
 }
 