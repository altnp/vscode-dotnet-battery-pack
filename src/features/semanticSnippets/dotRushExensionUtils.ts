import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";

export function locateDotRushExtensionPath(): string {
  let extension = vscode.extensions.getExtension("nromanov.dotrush");

  if (extension) {
    return extension.extensionPath;
  }

  let extDir = getExtensionsDir();
  if (!fs.existsSync(extDir)) {
    return "";
  }

  let dirs = fs.readdirSync(extDir);
  let found = dirs.find((d) => d.toLowerCase().startsWith("nromanov.dotrush"));
  if (!found) {
    return "";
  }

  return path.join(extDir, found);
}

function getExtensionsDir(): string {
  if (process.env.VSCODE_PORTABLE) {
    return path.join(process.env.VSCODE_PORTABLE, "extensions");
  }

  return path.join(process.env.HOME || process.env.USERPROFILE || "", ".vscode", "extensions");
}
