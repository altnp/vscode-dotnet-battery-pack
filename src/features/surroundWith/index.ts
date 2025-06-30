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
      const options = SurroundWithProvider.getSurroundOptions();

      const quickPickItems = options.map((option) => ({
        label: option.label,
        description: option.kind,
        option: option,
      }));

      const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: "Select a surround option",
        title: "Surround With",
      });

      if (selected) {
        const edit = provider.applySurroundOption(document, range, selected.option);
        await vscode.workspace.applyEdit(edit);
      }
    }
  );

  context.subscriptions.push(disposable, commandDisposable);
  await vscode.commands.executeCommand("setContext", "dotnetBatteryPack.surroundWith.active", true);
}

export async function deactivate(): Promise<void> {}

async function shouldActivate(): Promise<boolean> {
  await vscode.commands.executeCommand("setContext", "dotnetBatteryPack.surroundWith.active", false);
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
