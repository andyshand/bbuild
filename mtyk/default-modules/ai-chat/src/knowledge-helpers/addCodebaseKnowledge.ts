import chokidar from "chokidar"
import { depFn, keyDep } from "modules/deps"
import { IEntityManager, upsert } from "modules/entities"
import p from "path"
import { Knowledge } from ".."
import { KnowledgeRepresentation } from "../entities/KnowledgeRepresentation"
import extractTypes from "./extractTypes"
import { getFileFromGitRepo } from "./getFilesFromGitRepo"

export default depFn(
	{
		path: keyDep("path"),
		category: keyDep("category"),
		entityManager: keyDep<IEntityManager>("entityManager"),
		extensions: keyDep<string[]>("extensions", { optional: true }),
	},
	async ({ path: repoPath, category, entityManager, extensions }) => {
		// const files = await getFilesFromGitRepo(repoPath);

		const processFile = async (file: any) => {
			const filePath = file.path
			// Infer category here because some repos contain symlinks to other repos
			let cat = category

			const startsWithModules = filePath.indexOf("modules") === 0
			const module = filePath.split("/")[1]

			if (module === "design-cloud") {
				cat = "dc"
			} else if (startsWithModules && module) {
				cat = `modules/${module}`
			} else if (filePath.indexOf("modules/entities") >= 0) {
				cat = "modules/entities"
			} else if (filePath.indexOf("modules/ai-chat") >= 0) {
				cat = "modules/ai-chat"
			} else if (filePath.indexOf("modules/entities-client") >= 0) {
				cat = "modules/entities-client"
			} else if (filePath.indexOf("modules/deps") >= 0) {
				cat = "modules/deps"
			}
			const fullPath = p.join(repoPath, file.path)
			const rep: KnowledgeRepresentation = {
				content: file.contents,
				version: "1",
				location: { path: file.path, fullPath },
				id: file.path,
				type: "file",
			}

			const fileName = file.path.split("/").pop()
			const withoutExt = fileName.split(".").slice(0, -1).join(".")
			const az = withoutExt.replace(/[^a-zA-Z0-9]/g, "")
			const knowledgeRep = (await upsert(entityManager)(
				"Knowledge",
				{ about: withoutExt, category: cat },
				{
					about: [file.path, az, withoutExt],
					representations: [rep],
					category: cat,
					knowledge: [],
				},
			)) as Knowledge

			for (const type of extractTypes(fullPath)) {
				const typeRep: KnowledgeRepresentation = {
					content: type.text,
					version: "1",
					location: { path: file.path, fullPath },
					id: `${file.path}#${type.name}`,
					type: "type",
				}
				const typeKnowledge = (await upsert(entityManager)(
					"Knowledge",
					{ about: type.name, category: cat },
					{
						about: [type.name],
						representations: [typeRep],
						category: cat,
						knowledge: [],
					},
				)) as Knowledge
				typeKnowledge.addOrUpdateRepresentation(typeRep)
			}

			console.log(`Added knowledge about ${withoutExt} from ${file.path}`)
			knowledgeRep.addOrUpdateRepresentation(rep)
		}

		// for (const file of files) {
		//   await processFile(file);
		// }

		// Watch the codebase for file changes
		const watcher = chokidar.watch(`**/*.+(${extensions ?? ["ts", "tsx", "md"].join("|")})`, {
			cwd: repoPath,
			ignored: [/node_modules/, /\.map$/, /\.d\.ts$/],
			persistent: true,
			// ignoreInitial: category !== "student-portal",
			ignoreInitial: true,
		})

		watcher
			.on("add", async (p) => {
				console.log(`File ${p} has been added`)
				// const relativePath = path.relative(repoPath, p);
				const file = await getFileFromGitRepo(repoPath, p)
				if (file) {
					await processFile(file)
				}
			})
			.on("change", async (p) => {
				console.log(`File ${p} has been changed`)
				// const relativePath = path.relative(repoPath, p);
				const file = await getFileFromGitRepo(repoPath, p)
				if (file) {
					await processFile(file)
				}
			})
			.on("unlink", (filePath) => {
				console.log(`File ${filePath} has been removed`)

				// You can add logic to remove the knowledge representation if needed
			})
	},
)
