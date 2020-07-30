import * as vscode from 'vscode';

const useStatementRegexp = /^(\s)?use ([^;\s]+)(\sas\s)?([^;]+)?;$/;

function addUseStatement(fqcn: string, lines: string[]): { lines: string[], useAs: string } {
  const namespaceIndex = lines.findIndex(line => /\s?namespace\s([^;]+);/.test(line));
  const alreadyUsedIndex = lines.map(line => line.search(`use ${fqcn.replace(/\\/g, '\\\\')}[\\s;]`)).findIndex(index => index >= 0);

  const classNamespace = fqcn.split('\\').slice(0, -1).join('\\');
  const className = fqcn.split('\\').pop() as string;
  let useAs = className;
  let addSpaceBefore = false;

  lines.reverse();
  let lastUseStatement = Math.abs(lines.findIndex(line => useStatementRegexp.test(line)) - lines.length) - 1;
  lines.reverse();
  if (lines.length === lastUseStatement) {
    // no use statements yet
    lastUseStatement = namespaceIndex;
    addSpaceBefore = true;
  }

  // Already in the same namespace, no need to add use statement
  if (namespaceIndex >= 0 && lines[namespaceIndex].search(`namespace ${classNamespace.replace(/\\/g, '\\\\')};`) >= 0) {
    return { lines, useAs };
  }

  // Class has already been imported, no need to add use statement
  if (alreadyUsedIndex >= 0) {
    const matches = lines[alreadyUsedIndex].match(useStatementRegexp) as string[];
    useAs = matches[4] || useAs;

    return { lines, useAs };
  }

  const useStatements = lines.filter(line => line.search(useStatementRegexp) >= 0);
  let conflict = false;
  do {
    conflict = false;
    for (let i = 0; i < useStatements.length; i += 1) {
      const matches = useStatements[i].match(useStatementRegexp) as string[];
      if (matches[4] === useAs) {
        useAs += 'Alt';
        conflict = true;
        break;
      }
    }
  } while (conflict);

  // Add the use statement
  let stmt = `use ${fqcn}`;
  if (className !== useAs) {
    stmt += ` as ${useAs}`;
  }
  if (addSpaceBefore) {
    stmt = `\n${stmt}`;
  }
  lines.splice(lastUseStatement + 1, 0, `${stmt};`);

  return { lines, useAs };
}

function simplifyFqcn(fqcn: string, useAs: string, lines: string[]): string[] {
  for (let i = 0; i < lines.length; i += 1) {
    if (useStatementRegexp.test(lines[i])) {
      continue;
    }

    lines[i] = lines[i].replace(fqcn, useAs);
  }

  return lines;
}

export default (fqcn: string, editor: vscode.TextEditor | undefined) => {
  editor?.edit((editBuilder) => {
    const currentText = editor.document.getText();
    // save the carrier return when joining the lines
    const carrierReturn = /\r\n/.test(currentText) ? '\r\n' : '\n';

    let lines = editor.document.getText().split(/\r?\n/);

    const useStmtResult = addUseStatement(fqcn, lines);
    lines = useStmtResult.lines;
    let useAs = useStmtResult.useAs;
    lines = simplifyFqcn(fqcn, useAs, lines);

    editBuilder.replace(
      new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(lines.length - 1, lines[lines.length - 1].length)),
      lines.join(carrierReturn),
    );
  });
};
