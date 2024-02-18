import * as ts from "typescript";
// import ts from "typescript";
function transformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile): ts.SourceFile => {
      if (!sourceFile.fileName.endsWith(".tsx")) {
        return sourceFile; // Return the source file unchanged
      }

      console.log(`Transforming file: ${sourceFile.fileName}`);

      const visitor: ts.Visitor = (node: ts.Node) => {
        if (
          ts.isFunctionDeclaration(node) &&
          ts.isSourceFile(node.parent) &&
          node.name
        ) {
          const arrowFunction = ts.factory.createArrowFunction(
            undefined,
            undefined,
            node.parameters,
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            node.body!
          );
          return wrapFunctionWithObserver(node.name!.text, arrowFunction);
        } else if (
          ts.isVariableStatement(node) &&
          ts.isSourceFile(node.parent)
        ) {
          const decl = node.declarationList.declarations[0];
          if (decl.initializer && ts.isArrowFunction(decl.initializer)) {
            // Handle both named and default exports
            const isDefaultExport = node.modifiers
              ? node.modifiers.some(
                  (mod) => mod.kind === ts.SyntaxKind.DefaultKeyword
                )
              : false;
            return wrapFunctionWithObserver(
              decl.name.getText(),
              decl.initializer,
              isDefaultExport
            );
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      if (needsObserverImport(sourceFile)) {
        const importStatement = createObserverImport();
        sourceFile = ts.factory.updateSourceFile(sourceFile, [
          importStatement,
          ...sourceFile.statements,
        ]);
      }

      return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
    };
  };
}

function wrapFunctionWithObserver(
  name: string,
  arrowFunction: ts.ArrowFunction,
  isDefault: boolean = false
): ts.VariableStatement | ts.ExportAssignment {
  const callToObserver = ts.factory.createCallExpression(
    ts.factory.createIdentifier("observer"),
    undefined,
    [arrowFunction]
  );

  if (isDefault) {
    return ts.factory.createExportAssignment(undefined, false, callToObserver);
  } else {
    const variableDeclaration = ts.factory.createVariableDeclaration(
      name,
      undefined,
      undefined,
      callToObserver
    );
    return ts.factory.createVariableStatement(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      ts.factory.createVariableDeclarationList(
        [variableDeclaration],
        ts.NodeFlags.Const
      )
    );
  }
}

function needsObserverImport(sourceFile: ts.SourceFile): boolean {
  return !sourceFile.statements.some((s) => {
    if (
      ts.isImportDeclaration(s) &&
      s.moduleSpecifier.getText(sourceFile).includes("@legendapp/state/react")
    ) {
      const namedBindings = s.importClause
        ? s.importClause.namedBindings
        : undefined;
      if (
        namedBindings &&
        ts.isNamedImports(namedBindings) &&
        namedBindings.elements.some((e) => e.name.text === "observer")
      ) {
        return true;
      }
    }
    return false;
  });
}

function createObserverImport(): ts.ImportDeclaration {
  return ts.factory.createImportDeclaration(
    undefined, // modifiers
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier("observer")
        ),
      ])
    ),
    ts.factory.createStringLiteral("@legendapp/state/react")
  );
}

export default transformer;
