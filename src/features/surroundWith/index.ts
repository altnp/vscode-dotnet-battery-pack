import * as vscode from "vscode";
import { isAnyExtensionEnabledFromSettings } from "../../utils/extensionCheck";
import { SurroundWithProvider } from "./provider";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  if (!shouldActivate()) {
    return;
  }

  const provider = new SurroundWithProvider();
  const disposable = vscode.languages.registerCodeActionsProvider({ scheme: "file", language: "csharp" }, provider, {
    providedCodeActionKinds: [vscode.CodeActionKind.Refactor],
  });

  const commandDisposable = vscode.commands.registerCommand(
    "dotnetBatteryPack.surroundWith.showMoreMenu",
    async (documentUri: vscode.Uri, range: vscode.Range) => {
      const document = await vscode.workspace.openTextDocument(documentUri);
      const snippets = SurroundWithProvider.getSupportedSurroundSnippets();

      const quickPickItems = snippets.map((snippet) => ({
        label: snippet.label,
        description: snippet.kind,
        option: snippet,
      }));

      const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: "Select a surround option",
        title: "Surround With",
      });

      if (selected) {
        await provider.applySnippetSurround(document, range, selected.option.kind);
      }
    }
  );

  const snippetCommandDisposable = vscode.commands.registerCommand(
    "dotnetBatteryPack.surroundWith.applySnippet",
    async (documentUri: vscode.Uri, range: vscode.Range, kind: string) => {
      const document = await vscode.workspace.openTextDocument(documentUri);
      await provider.applySnippetSurround(document, range, kind);
    }
  );

  context.subscriptions.push(disposable, commandDisposable, snippetCommandDisposable);
  await vscode.commands.executeCommand("setContext", "dotnetBatteryPack.surroundWith.active", true);
}

export async function deactivate(): Promise<void> {
  await vscode.commands.executeCommand("setContext", "dotnetBatteryPack.surroundWith.active", false);
}

function shouldActivate(): boolean {
  const config = vscode.workspace.getConfiguration("dotnetBatteryPack.surroundWith");

  if (!config.get<boolean>("enabled", true)) {
    console.log("Surround with is disabled via settings.");
    return false;
  }

  if (isAnyExtensionEnabledFromSettings(config, "disableWhenExtensions")) {
    console.log("Surround with is disabled due to other extensions being enabled.");
    return false;
  }

  return true;
}
