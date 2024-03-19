import { EditorContent, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { useEffect } from 'react'

function TipTap(props: {
  onChange?: (value: any) => void
  onChangeText?: (value: string) => void
  onChangeHTML?: (value: string) => void
  value?: any
  extensions?: any[]
  editorRef?: any
  children?: any
  beforeEditor?: (editor: any) => any
  afterEditor?: (editor: any) => any
}) {
  const {
    onChange,
    value,
    onChangeText,
    onChangeHTML,
    extensions,
    beforeEditor,
    afterEditor,
    editorRef,
  } = props
  const editor = useEditor({
    autofocus: true,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
      }),

      ...(extensions ?? []),
    ],

    // triggered on every change
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onChange?.(json)

      const html = editor.getHTML()
      // Render html offscreen and then get innerText
      const div = document.createElement('div')
      div.style.position = 'absolute'
      div.style.left = '-9999px'
      div.style.top = '-9999px'
      div.innerHTML = html
      document.body.appendChild(div)
      const text = div.innerText
      document.body.removeChild(div)
      onChangeText?.(text)
      onChangeHTML?.(html)
    },
    content: value,
  })

  useEffect(() => {
    if (editor) {
      if (JSON.stringify({ value }) !== JSON.stringify(editor.getJSON())) {
        // editor.commands.setContent(value)
      }
    }
  }, [JSON.stringify({ value }), editor])

  return (
    <>
      {beforeEditor?.(editor)}
      <EditorContent editor={editor} />
      {afterEditor?.(editor)}
    </>
  )
}

export default TipTap

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["tiptap"]) {
console.warn(`Duplicate module tiptap imported. This can lead to bugs.`);
}
globalStore["tiptap"] = true;
 
// --- END INJECTED CODE ---