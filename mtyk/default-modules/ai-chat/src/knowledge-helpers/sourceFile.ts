import * as ts from "typescript";

type FnType = (fileContents: string, shouldExpandSymbol: (symbolName: string) => boolean) => string;

export const getFilteredSourceFile: FnType = (fileContents, shouldExpandSymbol) => {
  const sourceFile = ts.createSourceFile("temp.ts", fileContents, ts.ScriptTarget.ES2015, true);

  const collapseNode = (node: ts.Node): string => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const symbolName = node.name.getText(sourceFile);
      if (!shouldExpandSymbol(symbolName)) {
        return `/* ${symbolName} */`;
      }
    }

    return node
      .getChildren(sourceFile)
      .map((child) => collapseNode(child))
      .join("");
  };

  return collapseNode(sourceFile);
};
