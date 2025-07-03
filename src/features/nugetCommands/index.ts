import * as vscode from "vscode";
import { isDotNetSdkAvailable } from "../../utils/dotnetSdk";
import {
  showNugetAddCommand,
  showNugetRemoveCommand,
  showNugetUpdateCommand,
  toggleIncludePrereleaseSetting,
} from "./nugetCommandHandlers";

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
