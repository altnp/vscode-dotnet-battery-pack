import * as vscode from "vscode";
import * as semanticSnippets from "./features/semanticSnippets";
import * as surroundWith from "./features/surroundWith";
import * as nugetCommands from "./features/nugetCommands";

export const name = ".NET Battery Pack";

export async function activate(context: vscode.ExtensionContext) {
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

  try {
    await nugetCommands.activate(context);
  } catch (error) {
    console.error("Failed to activate nuget commands feature:", error);
  }

  context.globalState.update("semanticSnippetsFeature", semanticSnippets);
  context.globalState.update("surroundWithFeature", surroundWith);
  context.globalState.update("nugetCommandsFeature", nugetCommands);
}

export async function deactivate() {
  semanticSnippets.deactivate();
  surroundWith.deactivate();
  nugetCommands.deactivate();
}
