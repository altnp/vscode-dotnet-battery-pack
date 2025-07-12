import path from "path";
import fs from "fs";
import vscode from "vscode";

export async function disableCSharpSnippets() {
  try {
    const extension = vscode.extensions.getExtension("ms-dotnettools.csharp");

    if (extension) {
      const snippetsDir = path.join(extension.extensionPath, "snippets");
      const snippetPath = path.join(snippetsDir, "csharp.json");
      const disabledDir = path.join(snippetsDir, "disabled");
      const disabledSnippetPath = path.join(disabledDir, "csharp.json");

      if (
        await fs.promises
          .stat(snippetPath)
          .then(() => true)
          .catch(() => false)
      ) {
        let disabledDirExists = false;

        try {
          await fs.promises.stat(disabledDir);
          disabledDirExists = true;
        } catch {
          disabledDirExists = false;
        }

        if (!disabledDirExists) {
          await fs.promises.mkdir(disabledDir);
        }

        await fs.promises.rename(snippetPath, disabledSnippetPath);
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      "Failed to disable C# snippets: " + (error instanceof Error ? error.message : String(error))
    );
  }
}

export async function enableCSharpSnippets() {
  try {
    const extension = vscode.extensions.getExtension("ms-dotnettools.csharp");

    if (extension) {
      const snippetsDir = path.join(extension.extensionPath, "snippets");
      const snippetPath = path.join(snippetsDir, "csharp.json");
      const disabledDir = path.join(snippetsDir, "disabled");
      const disabledSnippetPath = path.join(disabledDir, "csharp.json");

      if (
        (await fs.promises
          .stat(disabledSnippetPath)
          .then(() => true)
          .catch(() => false)) &&
        !(await fs.promises
          .stat(snippetPath)
          .then(() => true)
          .catch(() => false))
      ) {
        await fs.promises.rename(disabledSnippetPath, snippetPath);
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      "Failed to enable C# snippets: " + (error instanceof Error ? error.message : String(error))
    );
  }
}
