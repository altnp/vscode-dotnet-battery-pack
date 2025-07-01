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

    actions.push(this.createSurroundWithAction("if", "if", document, targetRange));
    actions.push(this.createSurroundWithAction("for", "for", document, targetRange));
    actions.push(this.createSurroundWithAction("forEach", "for each", document, targetRange));
    actions.push(this.createSurroundWithAction("tryCatch", "try catch", document, targetRange));
    actions.push(this.createMoreMenuAction(document, targetRange));

    return actions;
  }

  public async applySnippetSurround(document: vscode.TextDocument, range: vscode.Range, kind: string): Promise<void> {
    const snippet = this.createSnippetForKind(kind, document, range);

    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.uri.toString() === document.uri.toString()) {
      await editor.insertSnippet(snippet, range);
      await this.enterInsertModeIfVimEnabled();
    }
  }

  public static getSupportedSurroundSnippets(): { label: string; kind: string }[] {
    return [
      { label: "if statement", kind: "if" },
      { label: "if/else statement", kind: "ifElse" },
      { label: "for loop", kind: "for" },
      { label: "for reverse (forr)", kind: "forReverse" },
      { label: "foreach loop", kind: "forEach" },
      { label: "try/catch", kind: "tryCatch" },
      { label: "try/finally", kind: "tryFinally" },
      { label: "try/catch/finally", kind: "tryCatchFinally" },
      { label: "while loop", kind: "while" },
      { label: "lock statement", kind: "lock" },
      { label: "using statement", kind: "using" },
    ];
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
    range: vscode.Range
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(title, vscode.CodeActionKind.Refactor.append(`surround.${kind}`));
    action.command = {
      command: "dotnetBatteryPack.surroundWith.applySnippet",
      title: title,
      arguments: [document.uri, range, kind],
    };
    action.isPreferred = false;
    return action;
  }

  private createSnippetForKind(kind: string, document: vscode.TextDocument, range: vscode.Range): vscode.SnippetString {
    switch (kind) {
      case "if":
        return this.createSurroundSnippet(document, range, "if (${1:true})");
      case "ifElse":
        return this.createSurroundSnippet(document, range, "if (${1:true})", ["else", "{", "\t${2}", "}"]);
      case "for":
        return this.createSurroundSnippet(document, range, "for (var ${1:i} = 0; ${1:i} < ${2:COUNT}; ${1:i}++)");
      case "forReverse":
        return this.createSurroundSnippet(document, range, "for (var ${1:i} = ${2:COUNT} - 1; ${1:i} >= 0; ${1:i}--)");
      case "forEach":
        return this.createSurroundSnippet(document, range, "foreach (var ${1:variable} in ${2:COLLECTION})");
      case "tryCatch":
        return this.createSurroundSnippet(document, range, "try", [
          "catch (${1:Exception} ${2:ex})",
          "{",
          "\t${3}",
          "}",
        ]);
      case "tryFinally":
        return this.createSurroundSnippet(document, range, "try", ["finally", "{", "\t${1}", "}"]);
      case "tryCatchFinally":
        return this.createSurroundSnippet(document, range, "try", [
          "catch (${1:Exception} ${2:ex})",
          "{",
          "\t${3}",
          "}",
          "finally",
          "{",
          "\t${4}",
          "}",
        ]);
      case "while":
        return this.createSurroundSnippet(document, range, "while (${1:true})");
      case "using":
        return this.createSurroundSnippet(document, range, "using (var ${1:resource} = ${2:EXPRESSION})");
      case "lock":
        return this.createSurroundSnippet(document, range, "lock (${1:OBJECT})");
      default:
        throw new Error(`Unknown surround kind: ${kind}`);
    }
  }

  private createSurroundSnippet(
    document: vscode.TextDocument,
    range: vscode.Range,
    header: string,
    footer: string | string[] | null = null
  ): vscode.SnippetString {
    const selectedText = document.getText(range);

    const line = document.lineAt(range.start.line);
    const indent = getIndentString();
    const hasLeadingNonWhitespace = !/^\s*$/.test(line.text.substring(0, range.start.character));

    let baseIndent = "";
    const lineText = line.text.substring(range.start.character);
    const match = /^(\s*)/.exec(lineText);
    if (match) {
      baseIndent = match[0];
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

    return new vscode.SnippetString(result);
  }

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

  private async enterInsertModeIfVimEnabled(): Promise<void> {
    try {
      const vimExtension = vscode.extensions.getExtension("vscodevim.vim");

      if (vimExtension && vimExtension.isActive) {
        await vscode.commands.executeCommand("extension.vim_insert");
      }
    } catch (error) {
      console.error("Error entering insert mode in Vim:", error);
    }
  }
}
