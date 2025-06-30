import * as vscode from "vscode";
import { checkDotNetSdk } from "./utils/dotnetSdk";
import * as semanticSnippets from "./features/semanticSnippets";
import * as surroundWith from "./features/surroundWith";

export const name = ".NET Battery Pack";

export async function activate(context: vscode.ExtensionContext) {
  const isDotNetAvailable = await checkDotNetSdk();

  if (isDotNetAvailable) {
    try {
      await semanticSnippets.activate(context);
    } catch (error) {
      console.error("Failed to activate semantic snippets feature:", error);
    }

    try {
      await surroundWith.activate(context);
    } catch (error) {
      console.error("Failed to activate surround with feature:", error);
    }

    context.globalState.update("semanticSnippetsFeature", semanticSnippets);
    context.globalState.update("surroundWithFeature", surroundWith);
  }
}

export async function deactivate() {
  semanticSnippets.deactivate();
  surroundWith.deactivate();
}
