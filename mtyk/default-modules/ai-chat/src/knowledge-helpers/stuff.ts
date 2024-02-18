// import * as fs from 'fs';
// import * as path from 'path';
// import * as ts from 'typescript';
// import * as glob from 'glob';
// import simpleGit, { SimpleGit } from 'simple-git';

// type File = {
//   path: string;
//   contents: string;
//   language: string;
//   fileName: string;
//   exports: Export[];
//   imports: Import[];
// };

// type Symbol = {
//   type: 'variable' | 'function' | 'react-component' | 'other' | 'class';
// };

// type Export = {
//   name: string;
//   symbol: Symbol;
// };

// type Import = {
//   name: string;
//   symbol: Symbol;
//   path: string;
// };

// async function getFilesFromGitRepo(repoPath: string): Promise<File[]> {
//   const git: SimpleGit = simpleGit(repoPath);
//   const status = await git.status();
//   const tsFiles = glob.sync('**/*.+(ts|tsx)', {
//     cwd: repoPath,
//     ignore: status.ignored.map((file) => path.join(repoPath, file)),
//   });

//   return Promise.all(
//     tsFiles.map(async (file) => {
//       const filePath = path.join(repoPath, file);
//       const contents = fs.readFileSync(filePath, 'utf-8');
//       const sourceFile = ts.createSourceFile(
//         filePath,
//         contents,
//         ts.ScriptTarget.Latest,
//         true
//       );

//       return {
//         path: filePath,
//         contents,
//         language: path.extname(file).substring(1),
//         fileName: path.basename(file),
//         exports: extractExports(sourceFile),
//         imports: extractImports(sourceFile),
//       };
//     })
//   );
// }

// function extractExports(sourceFile: ts.SourceFile): Export[] {
//   const exports: Export[] = [];

//   ts.forEachChild(sourceFile, (node) => {
//     if (ts.isExportDeclaration(node)) {
//       node.exportClause?.elements.forEach((element) => {
//         exports.push({
//           name: element.name.getText(),
//           symbol: {
//             type: 'other', // You can improve this part to determine the correct symbol type
//           },
//         });
//       });
//     }
//   });

//   return exports;
// }

// function extractImports(sourceFile: ts.SourceFile): Import[] {
//   const imports: Import[] = [];

//   ts.forEachChild(sourceFile, (node) => {
//     if (ts.isImportDeclaration(node)) {
//       const importPath = node.moduleSpecifier.getText().replace(/['"`]/g, '');
//       node.importClause?.namedBindings?.forEachChild((element) => {
//         if (ts.isImportSpecifier(element)) {
//           imports.push({
//             name: element.name.getText(),
//             symbol: {
//               type: 'other', // You can improve this part to determine the correct symbol type
//             },
//             path: importPath,
//           });
//         }
//       });
//     }
//   });

//   return imports;
// }

// // Usage example:
// (async () => {
//   const files = await getFilesFromGitRepo('/path/to/your/git/repo');
//   console.log(files);
// })();
