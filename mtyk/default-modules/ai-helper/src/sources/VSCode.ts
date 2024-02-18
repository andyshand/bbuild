import { type } from "arktype"
const VSCodeEditor = type({
  filePath: "string",  
})

export const VSCodeSource = type({
    activeWindow: {
        activeEditor: VSCodeEditor,
        tabs: [VSCodeEditor]
    }    
})

