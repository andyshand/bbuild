import * as ts from "typescript";

const log = (...args) => console.log("classVarsTransformer", ...args);

function transformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) => {
    log("Transforming file: %s", file.fileName);
    const result = visitNode(file, context);
    return ts.isSourceFile(result) ? result : file;
  };

  function visitNode(
    node: ts.Node,
    context: ts.TransformationContext
  ): ts.Node {
    if (ts.isClassDeclaration(node)) {
      log("Visiting class declaration: %s", node.name?.text);
      return visitClassDeclaration(node);
    }
    return ts.visitEachChild(node, (node) => visitNode(node, context), context);
  }

  function visitClassDeclaration(node: ts.ClassDeclaration): ts.Node {
    log("Visiting class members: %s", node.name?.text);
    const updatedMembers = node.members.reduce((members, member) => {
      if (ts.isPropertyDeclaration(member) && member.type) {
        const typeString = member.type.getText();
        const typePropertyName = ts.createIdentifier(
          `${member.name.getText()}__type`
        );
        const typeProperty = ts.createProperty(
          undefined,
          undefined,
          typePropertyName,
          undefined,
          undefined,
          ts.createStringLiteral(typeString)
        );
        members.push(member, typeProperty);
      } else {
        members.push(member);
      }
      return members;
    }, [] as ts.ClassElement[]);

    const modifiers = node.modifiers.filter(ts.isModifier);

    return ts.updateClassDeclaration(
      node,
      node.decorators,
      modifiers,
      node.name,
      node.typeParameters,
      node.heritageClauses,
      updatedMembers
    );
  }
}

export default transformer;
