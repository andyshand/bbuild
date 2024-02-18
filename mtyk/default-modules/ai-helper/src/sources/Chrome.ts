import { type } from "arktype"

const ChromeTab = type({
  filePath: "string",  
})

export const ChromeSource = type({
    activeWindow: {
        tabs: [ChromeTab]
    }    
})

