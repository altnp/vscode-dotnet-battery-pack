import * as vscode from "vscode";
import { isAnyExtensionEnabledFromSettings } from "../../utils/extensionCheck";
import * as languageServer from "./languageServer";
import * as path from "path";
import { LanguageClient } from "vscode-languageclient/node";
import { disableCSharpSnippets, enableCSharpSnippets } from "./csharpExtensionUtils";
import { reloadWorkspace } from "./languageServer";
import { locateDotRushExtensionPath } from "./dotRushExensionUtils";

let client: LanguageClient | undefined = undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  if (!shouldActivate()) {
    await enableCSharpSnippets(); // Incase previous activation was not deactivated correctly
    return;
  }

  client = await languageServer.startLanguageServer();
  await disableCSharpSnippets(); // Disbale C# snippets after language server successfully starts
  configureSubscriptions(context);
  await vscode.commands.executeCommand("setContext", "dotnetBatteryPack.semanticSnippets.active", true);
}

export async function deactivate(): Promise<void> {
  await vscode.commands.executeCommand("setContext", "dotnetBatteryPack.semanticSnippets.active", false);
  await enableCSharpSnippets();
  if (client) {
    client.dispose();
    client = undefined;
  }
}

function configureSubscriptions(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("dotnetBatteryPack.reloadWorkspace", () => {
      if (client && client.isRunning()) {
        reloadWorkspace(client);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (e) => {
      const extName = path.extname(e.fileName);
      if (extName !== ".csproj" && extName !== ".props") {
        return;
      }

      if (client && client.isRunning()) {
        console.log("Reloading workspace due to project file change:", e.fileName);
        reloadWorkspace(client);
      }
    })
  );
}

function shouldActivate(): boolean {
  const config = vscode.workspace.getConfiguration("dotnetBatteryPack.semanticSnippets");

  if (!config.get<boolean>("enabled", false)) {
    console.log("Semantic snippets are disabled via settings.");
    return false;
  }

  if (isAnyExtensionEnabledFromSettings(config, "disableWhenExtensions")) {
    console.log("Semantic snippets are disabled due to other extensions being enabled.");
    return false;
  }

  if (!locateDotRushExtensionPath()) {
    vscode.window.showWarningMessage("DotRush extension must be installed, but disabled, to enable semantic snippets.");
    return false;
  }

  return true;
}
