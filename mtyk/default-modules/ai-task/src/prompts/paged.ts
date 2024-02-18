import { assert } from "modules/errors/index"
import { times } from "remeda"
import { Model } from "../getCompletionNoStream"
import { getOutput, promptGPT3, promptGPT3Curie, ts } from "../transform"

const chunkStr = (str: string, chunkSize: number) => {
	const chunks: string[] = []
	for (let i = 0; i < str.length; i += chunkSize) {
		chunks.push(str.substr(i, chunkSize))
	}
	return chunks
}

const theprompt = (_opts: {
	input: string
	pageSize?: number
	eachPage?: string | ((page: string, i: number) => string)
	task: string
	summarise?: string
	model?: Model
}) => {
	const opts = {
		pageSize: 1000,
		eachPage: "With my goal in mind, I can draw the following conclusions about the following page:\n -",
		..._opts,
	}

	const { summarise, eachPage, task, input, pageSize, model, ...rest } = opts

	// TODO below is hacky
	const gptOpts = model ? { model, ...rest } : undefined

	assert(!!task, "task is required")
	const pages = chunkStr(input, pageSize)

	const prompts = pages.map((page, i) => {
		const pagePrompt = `My goal is to ${task}.
        
    The following is the contents of page ${i + 1} out of ${pages.length}:
${ts(page)}

${typeof eachPage === "string" ? eachPage : eachPage(page, i)}${promptGPT3({
	key: "page" + i,
	gpt: gptOpts,
})}
`
		return pagePrompt
	})

	const summarizeAllSummaries = `My goal is to ${task}. Here are the notes I've made for each page: ${
		pages.length
	}${times(pages.length, (i) => `\n\nPage ${i + 1}:\n${getOutput(`page${i}`)}`).join("\n")}
  
  ${summarise ?? "I can concisely summarise my findings as follows:"}${promptGPT3({ key: "output", gpt: gptOpts })}  
  `

	return [...prompts, summarizeAllSummaries]
}

export default theprompt

// setTimeout(() => {
//   // Do stuff
//   runPromptChain(
//     theprompt({
//       code: `Troubleshooting
//       This page offers troubleshooting tips, solutions to known problems, and tricks - often contributed by our Community members. Don't see a fix to your problem here? Let us know by opening an issue!

//       WARNING

//       WebContainers won't run properly (or at all) if cookie blockers, third-party or browser built-in ones, are enabled. Check the on('error') event and StackBlitz docs to learn more.

//       Slow boot time
//       To improve your project's boot time, pass both package-lock.json and package.json to the file system. Without package-lock.json Turbo, our npm client, first generates a fresh lockfile and only then downloads dependencies, resulting in a slower boot time.

//       Tip from the community

//       SvelteKit bypasses Turbo install by bundling the files so they can be cached and written straight to the virtual file system. Including package-lock.json was not an ideal solution given that different sections of their tutorial have different dependencies.

//       Alternatively, you can create and populate the node_modules folder yourself if you want your app to be runnable via script commands like npm run.

//       Turbo fails to load
//       In case lockfile resolution times out, you will see the following error:

//       Access to fetch at [URL] from origin [URL] has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled

//       To prevent the timeout, add package-lock.json to the file system which will speed up the dependency installation. For more information, see the "Slow boot time" tip.

//       Proxy error
//       If the boot() is called more than once, you may see the following error:

//       Uncaught (in promise) Error: Proxy has been released and is not usable

//       Make sure that boot() is only called once, even in the presence of HMR (hot module replacement).

//       WebContainers not loading and postMessage error
//       If all repeat requests are served without any headers and with the 304 status, access to SharedArrayBuffers will be denied. For example, if you're getting the following error message:

//       Uncaught (in promise) Error: Failed to execute ‘postMessage’ on ‘Worker’: SharedArrayBuffer transfer requires self.crossOriginIsolated.

//       You might have not set the COOP/COEP headers. If you have, make sure to restart the dev server and then refresh the preview page with a hard refresh (cmd+shift+r on MacOS and ctrl+shift+r on Windows).

//       Tip from the community

//       Solid.js developers added the following snippet to the Vite plugins array to include a plugin that always adds CORS in their Vite-based app:

//       js
//          {
//             name: 'add-cors',

//             configureServer(server) {
//               server.middlewares.use((_req, res, next) => {
//                 res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
//                 res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
//                 res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
//                 next();
//               });
//             },
//           },
//       For deployment, they used netlify _headers file.

//       Embedding cross-origin-isolated site
//       In order to embed a cross-origin-isolated site, make sure that both the embed and embedder have the same COOP/COEP settings. The WebContainer API requires require-corp so both need to be set up as require-corp. Additionally, add allow="cross-origin-isolated" as an attribute on the embedded iframe.

//       To learn more, check out this article about COOP/COEP.`,
//       eachPage: `From looking at the contents of this page, I can conclude the following:\n- `,
//       pageSize: 1000,
//       task: `summarizing the contents of this web page`,
//     })
//   )
// }, 2000)
