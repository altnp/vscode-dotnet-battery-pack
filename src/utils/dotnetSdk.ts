import * as vscode from "vscode";
import { spawn } from "child_process";

export async function checkDotNetSdk(): Promise<boolean> {
  const isAvailable = await isDotNetSdkAvailable();
  if (!isAvailable) {
    vscode.window.showWarningMessage(
      ".NET SDK not found. Some features will be disabled. Please install the .NET SDK to enable all functionality."
    );
  }
  return isAvailable;
}

async function isDotNetSdkAvailable(): Promise<boolean> {
  try {
    return new Promise((resolve) => {
      const dotnet = spawn("dotnet", ["--version"], { stdio: "pipe" });
      dotnet.on("close", (code: number) => {
        resolve(code === 0);
      });
      dotnet.on("error", () => {
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}
