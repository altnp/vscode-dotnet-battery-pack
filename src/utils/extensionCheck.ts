import * as vscode from "vscode";

export function isAnyExtensionEnabledFromSettings(config: vscode.WorkspaceConfiguration, settingKey: string): boolean {
  const extensionIds: string[] = config.get(settingKey) || [];

  for (const id of extensionIds) {
    const ext = vscode.extensions.getExtension(id);
    if (ext && ext.isActive) {
      return true;
    }
  }

  return false;
}
