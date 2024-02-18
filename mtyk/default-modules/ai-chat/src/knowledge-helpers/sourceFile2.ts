import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { Export, Import, Symbol } from './Export';

export function readGitIgnore(repoPath: string): string {
  const gitIgnorePath = path.join(repoPath, '.gitignore');
  if (fs.existsSync(gitIgnorePath)) {
    return fs.readFileSync(gitIgnorePath, 'utf-8');
  }
  return '';
}

export function extractExports(sourceFile: ts.SourceFile): Export[] {
  const exports: Export[] = [];

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && 'elements' in node.exportClause) {
        node.exportClause?.elements.forEach((element) => {
          exports.push({
            name: element.name.getText(),
            symbol: {
              type: determineSymbolType(element),
            },
          });
        });
      }
    }
  });

  return exports;
}

export function extractImports(sourceFile: ts.SourceFile): Import[] {
  const imports: Import[] = [];

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const importPath = node.moduleSpecifier.getText().replace(/['"`]/g, '');
      node.importClause?.namedBindings?.forEachChild((element) => {
        if (ts.isImportSpecifier(element)) {
          imports.push({
            name: element.name.getText(),
            symbol: {
              type: determineSymbolType(element),
            },
            path: importPath,
          });
        }
      });
    }
  });

  return imports;
}

function determineSymbolType(node: ts.Node): Symbol['type'] {
  // You can improve this function to determine a more accurate symbol type based on the TypeScript AST nodes.
  return 'other';
}