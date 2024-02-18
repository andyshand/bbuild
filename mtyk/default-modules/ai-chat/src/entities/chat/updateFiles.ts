import { FileTree } from "../../actions/Action";

const updateFiles = function updateFiles(messages?) {
	const working = [...(this.files ?? [])];
	const addFileIfNotExists = (path: string) => {
		const existing = working.find((f) => f.path === path);
		if (!existing) {
			// Add the file
			working.push({
				path,
			});
		}
	};
	for (const message of messages ?? this.messages) {
		if (message.actions?.length) {
			for (const action of message.actions) {
				if (action.type === "create-file" || action.type === "edit-file") {
					const path = action.location.path;
					if (path) {
						addFileIfNotExists(path);
					}
				} else if (action.type === "create-files") {
					// Do something similar
					const tree = action.tree;
					const createFilesFromTree = (fileTree: FileTree, rootPath: string) => {
						for (const [key, value] of Object.entries(fileTree)) {
							const fullPath = `${rootPath}/${key}`;

							if (value === null) {
								addFileIfNotExists(fullPath);
								// await fse.createFile(fullPath);
							} else {
								createFilesFromTree(value, fullPath);
							}
						}
					};
					createFilesFromTree(tree, "");
				}
			}
		}
	}

	this.files = working;
};

export default updateFiles;
