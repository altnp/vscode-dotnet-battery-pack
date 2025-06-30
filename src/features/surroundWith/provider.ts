import * as vscode from "vscode";
import { getIndentString } from "../../utils/indentation";

export class SurroundWithProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    _context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    const actions: vscode.CodeAction[] = [];
    const targetRange = this.getTargetRange(document, range);

    if (!targetRange) {
      return actions;
    }

    actions.push(this.createSurroundWithAction("if", "if", document, targetRange, this.createIfSurround));
    actions.push(this.createSurroundWithAction("for", "for", document, targetRange, this.createForSurround));
    actions.push(
      this.createSurroundWithAction("forEach", "for each", document, targetRange, this.createForEachSurround)
    );
    actions.push(
      this.createSurroundWithAction("tryCatch", "try catch", document, targetRange, this.createTryCatchSurround)
    );
    actions.push(this.createMoreMenuAction(document, targetRange));

    return actions;
  }

  private getTargetRange(document: vscode.TextDocument, range: vscode.Range): vscode.Range | undefined {
    if (!range.isEmpty) {
      return range;
    }

    const line = document.lineAt(range.start.line);
    if (line.isEmptyOrWhitespace) {
      return undefined;
    }

    return new vscode.Range(new vscode.Position(range.start.line, 0), line.range.end);
  }

  private createSurroundWithAction(
    kind: string,
    title: string,
    document: vscode.TextDocument,
    range: vscode.Range,
    surroundFunction: (document: vscode.TextDocument, range: vscode.Range) => vscode.WorkspaceEdit
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(title, vscode.CodeActionKind.Refactor.append(`surround.${kind}`));
    action.edit = surroundFunction(document, range);
    action.isPreferred = false;
    return action;
  }

  private createSurroundEdit(
    document: vscode.TextDocument,
    range: vscode.Range,
    header: string,
    footer: string | string[] | null = null
  ): vscode.WorkspaceEdit {
    const edit = new vscode.WorkspaceEdit();
    const selectedText = document.getText(range);

    const line = document.lineAt(range.start.line);
    const indent = getIndentString();
    const hasLeadingNonWhitespace = !/^\s*$/.test(line.text.substring(0, range.start.character));

    let baseIndent = "";

    if (indent.length > 0) {
      const match = /^(\s*)/.exec(line.text);

      if (match) {
        baseIndent = match[0];
      }
    }

    const lines = selectedText.split("\n");
    const indentedLines = lines.map((ln) => {
      return ln.trim() === "" ? ln : indent + ln;
    });

    if (hasLeadingNonWhitespace) {
      indentedLines[0] = baseIndent + indent + indentedLines[0].trimStart();
    }

    const before = `${baseIndent}${header}\n${baseIndent}{\n`;
    const after = `\n${baseIndent}}`;

    let result = `${before}${indentedLines.join("\n")}${after}`;

    if (footer) {
      result += `\n${baseIndent}${Array.isArray(footer) ? footer.join(`\n${baseIndent}`) : footer}`;
    }

    if (hasLeadingNonWhitespace) {
      result = `\n${result}`;
    }

    edit.replace(document.uri, range, result);
    return edit;
  }

  private createIfSurround = (document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit => {
    return this.createSurroundEdit(document, range, "if (true)");
  };

  private createForSurround = (document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit => {
    return this.createSurroundEdit(document, range, "for (var i = 0; i < COUNT; i++)");
  };

  private createForEachSurround = (document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit => {
    return this.createSurroundEdit(document, range, "foreach (var VARRIABLE in COLLECTION)");
  };

  private createTryCatchSurround = (document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit => {
    return this.createSurroundEdit(document, range, "try", "catch (Exception ex) { }");
  };

  private createTryFinallySurround = (document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit => {
    return this.createSurroundEdit(document, range, "try", "finally { }");
  };

  private createTryCatchFinallySurround = (
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.WorkspaceEdit => {
    return this.createSurroundEdit(document, range, "try", ["catch (Exception ex) { }", "finally { }"]);
  };

  private createWhileSurround = (document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit => {
    return this.createSurroundEdit(document, range, "while (true)");
  };

  private createUsingSurround = (document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit => {
    return this.createSurroundEdit(document, range, "using (var RESOURCE = EXPRESSION)");
  };

  private createLockSurround = (document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit => {
    return this.createSurroundEdit(document, range, "lock (OBJECT)");
  };

  private createIfElseSurround = (document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit => {
    return this.createSurroundEdit(document, range, "if (true)", "else { }");
  };

  private createForReverseSurround = (document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit => {
    return this.createSurroundEdit(document, range, "for (var i = COUNT; i >= 0; i--)");
  };

  private createMoreMenuAction(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction {
    const action = new vscode.CodeAction("more...", vscode.CodeActionKind.Refactor.append("surround.more"));
    action.command = {
      command: "dotnetBatteryPack.surroundWith.showMoreMenu",
      title: "Show More Surround Options",
      arguments: [document.uri, range],
    };
    action.isPreferred = false;
    return action;
  }

  public static getSurroundOptions(): { label: string; kind: string; surroundFunction: string }[] {
    return [
      { label: "if statement", kind: "if", surroundFunction: "createIfSurround" },
      { label: "if/else statement", kind: "ifElse", surroundFunction: "createIfElseSurround" },
      { label: "for loop", kind: "for", surroundFunction: "createForSurround" },
      { label: "for reverse (forr)", kind: "forReverse", surroundFunction: "createForReverseSurround" },
      { label: "foreach loop", kind: "forEach", surroundFunction: "createForEachSurround" },
      { label: "try/catch", kind: "tryCatch", surroundFunction: "createTryCatchSurround" },
      { label: "try/finally", kind: "tryFinally", surroundFunction: "createTryFinallySurround" },
      { label: "try/catch/finally", kind: "tryCatchFinally", surroundFunction: "createTryCatchFinallySurround" },
      { label: "while loop", kind: "while", surroundFunction: "createWhileSurround" },
      { label: "lock statement", kind: "lock", surroundFunction: "createLockSurround" },
      { label: "using statement", kind: "using", surroundFunction: "createUsingSurround" },
    ];
  }

  public applySurroundOption(
    document: vscode.TextDocument,
    range: vscode.Range,
    option: { label: string; kind: string; surroundFunction: string }
  ): vscode.WorkspaceEdit {
    switch (option.surroundFunction) {
      case "createIfSurround":
        return this.createIfSurround(document, range);
      case "createIfElseSurround":
        return this.createIfElseSurround(document, range);
      case "createForSurround":
        return this.createForSurround(document, range);
      case "createForReverseSurround":
        return this.createForReverseSurround(document, range);
      case "createForEachSurround":
        return this.createForEachSurround(document, range);
      case "createTryCatchSurround":
        return this.createTryCatchSurround(document, range);
      case "createTryFinallySurround":
        return this.createTryFinallySurround(document, range);
      case "createTryCatchFinallySurround":
        return this.createTryCatchFinallySurround(document, range);
      case "createWhileSurround":
        return this.createWhileSurround(document, range);
      case "createUsingSurround":
        return this.createUsingSurround(document, range);
      case "createLockSurround":
        return this.createLockSurround(document, range);
      default:
        throw new Error(`Unknown surround function: ${option.surroundFunction}`);
    }
  }
}
