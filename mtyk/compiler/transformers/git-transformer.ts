import * as ts from "typescript";

import { execSync } from "child_process";

function getGitHash() {
  return execSync("git rev-parse HEAD", {
    cwd: __dirname,
  })
    .toString()
    .trim();
}
const hash = getGitHash();
console.log(`Injecting git hash: ${hash}`);

function injectGitHashTransformer() {
  return (context: ts.TransformationContext) => {
    const visit: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
      if (ts.isSourceFile(node)) {
        const gitHashDeclaration = ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                "GIT_COMMIT_HASH",
                undefined,
                undefined,
                ts.factory.createStringLiteral(hash)
              ),
            ],
            ts.NodeFlags.Const
          )
        );
        const updatedStatements = ts.factory.createNodeArray([
          gitHashDeclaration,
          ...node.statements,
        ]);
        return ts.factory.updateSourceFile(node, updatedStatements);
      }
      return ts.visitEachChild(node, visit, context);
    };
    return (node: ts.SourceFile) => ts.visitNode(node, visit);
  };
}

export default injectGitHashTransformer;
