import * as vscode from "vscode";

export function getIndentString(): string {
  const editor = vscode.window.activeTextEditor;

  if (editor) {
    const options = editor.options;
    if (options.insertSpaces && typeof options.tabSize === "number") {
      return " ".repeat(options.tabSize);
    }
    if (!options.insertSpaces) {
      return "\t";
    }
  }

  const editorConfig = vscode.workspace.getConfiguration("editor");
  const insertSpaces = editorConfig.get("insertSpaces", true);
  const tabSize = editorConfig.get("tabSize", 2);

  if (insertSpaces) {
    return " ".repeat(tabSize);
  }

  return "\t";
}
