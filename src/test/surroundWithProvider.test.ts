import * as assert from "assert";
import * as vscode from "vscode";
import { SurroundWithProvider } from "../features/surroundWith/provider";

suite("SurroundWithProvider.applySnippetSurround", () => {
  let provider: SurroundWithProvider;
  let document: vscode.TextDocument;
  let editor: vscode.TextEditor;

  async function setupDoc(text: string, language: string = "csharp") {
    document = await vscode.workspace.openTextDocument({ content: text, language });
    editor = await vscode.window.showTextDocument(document);
  }

  const EOL = "\r\n";

  setup(async () => {
    provider = new SurroundWithProvider();
  });

  test("Non-indented line (top level statement) - if", async () => {
    await setupDoc('Console.WriteLine("Hello");');
    const range = new vscode.Range(0, 0, 0, 27);
    await provider.applySnippetSurround(document, range, "if");
    const result = editor.document.getText();
    assert.strictEqual(result, `if (true)${EOL}{${EOL}    Console.WriteLine("Hello");${EOL}}`);
  });

  test("Indented inside method - for", async () => {
    await setupDoc('    Console.WriteLine("Hi");');
    const range = new vscode.Range(0, 4, 0, 28);
    await provider.applySnippetSurround(document, range, "for");
    const result = editor.document.getText();
    assert.strictEqual(
      result,
      `    for (var i = 0; i < COUNT; i++)${EOL}    {${EOL}        Console.WriteLine("Hi");${EOL}    }`
    );
  });

  test("Range selects whole line including whitespace - forEach", async () => {
    let indent = "    ";
    await setupDoc(`${indent}var x = 1;`);
    const range = new vscode.Range(0, 0, 0, 14);
    await provider.applySnippetSurround(document, range, "forEach");
    const result = editor.document.getText();
    assert.strictEqual(
      result,
      `${indent}foreach (var variable in COLLECTION)${EOL}${indent}{${EOL}${indent}${indent}var x = 1;${EOL}${indent}}`
    );
  });

  test("Range selects just non-whitespace - tryCatch", async () => {
    let indent = "    ";
    await setupDoc(`${indent}throw ex;`);
    const range = new vscode.Range(0, 4, 0, 13);
    await provider.applySnippetSurround(document, range, "tryCatch");
    const result = editor.document.getText();
    assert.strictEqual(
      result,
      `${indent}try${EOL}${indent}{${EOL}${indent}${indent}throw ex;${EOL}${indent}}${EOL}${indent}catch (Exception ex)${EOL}${indent}{${EOL}${indent}${indent}${EOL}${indent}}`
    );
  });

  test("Basic test for using statement", async () => {
    await setupDoc("resource.Dispose();");
    const range = new vscode.Range(0, 0, 0, 19);
    await provider.applySnippetSurround(document, range, "using");
    const result = editor.document.getText();
    assert.strictEqual(result, `using (var resource = EXPRESSION)${EOL}{${EOL}    resource.Dispose();${EOL}}`);
  });
});
