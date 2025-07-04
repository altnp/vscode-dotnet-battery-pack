import * as vscode from "vscode";

export class ReverseNugetSearchProvider implements vscode.CodeActionProvider {
  async provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    const cs0246Error = context.diagnostics.find((diagnostic) => diagnostic.code === "CS0246");

    const reSharperError = context.diagnostics.find(
      (diagnostic) => diagnostic.source === "ReSharper" && diagnostic.message.includes("Cannot resolve symbol")
    );

    const diagnostic = cs0246Error || reSharperError;
    if (!diagnostic) {
      return actions;
    }

    const type = document.getText(diagnostic.range);
    if (!type || type.length < 2) {
      return actions;
    }

    const action = new vscode.CodeAction(`Find '${type}' on NuGet.org`, vscode.CodeActionKind.QuickFix);

    action.command = {
      title: "Find Type on NuGet.org",
      command: "dotnetBatteryPack.nuget.reverseSearch",
      arguments: [type],
    };

    action.isPreferred = false;
    actions.push(action);

    return actions;
  }
}
