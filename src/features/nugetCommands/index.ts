import * as vscode from "vscode";
import { isDotNetSdkAvailable } from "../../utils/dotnetSdk";
import {
  showNugetAddCommand,
  showNugetRemoveCommand,
  showNugetUpdateCommand,
  showReverseNugetSearchCommand,
  toggleIncludePrereleaseSetting,
} from "./nugetCommandHandlers";
import { ReverseNugetSearchProvider } from "./provider";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  if (!(await shouldActivate())) {
    return;
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("dotnetBatteryPack.nuget.addPackage", async () => {
      await showNugetAddCommand();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("dotnetBatteryPack.nuget.updatePackage", async () => {
      await showNugetUpdateCommand();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("dotnetBatteryPack.nuget.removePackage", async () => {
      await showNugetRemoveCommand();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("dotnetBatteryPack.nuget.togglePrerelease", async () => {
      await toggleIncludePrereleaseSetting();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("dotnetBatteryPack.nuget.reverseSearch", async (typeName: string) => {
      await showReverseNugetSearchCommand(typeName);
    })
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider({ language: "csharp" }, new ReverseNugetSearchProvider(), {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    })
  );

  await vscode.commands.executeCommand("setContext", "dotnetBatteryPack.nugetCommands.active", true);
}

export async function deactivate(): Promise<void> {
  await vscode.commands.executeCommand("setContext", "dotnetBatteryPack.nugetCommands.active", true);
}

async function shouldActivate(): Promise<boolean> {
  const config = vscode.workspace.getConfiguration("dotnetBatteryPack.nugetCommands");

  if (!config.get<boolean>("enabled", true)) {
    return false;
  }

  if (!(await isDotNetSdkAvailable())) {
    console.warn("NuGet commands require .NET SDK to be installed.");
    return false;
  }

  return true;
}
