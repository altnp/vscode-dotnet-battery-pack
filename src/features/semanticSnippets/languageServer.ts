import * as vscode from "vscode";
import * as path from "path";
import { name as ExtensionName } from "../../extension";
import { LanguageClient, LanguageClientOptions, InsertTextFormat } from "vscode-languageclient/node";
import { CompletionItemFeature } from "vscode-languageclient/lib/common/completion";
import { locateDotRushExtensionPath } from "./dotRushExensionUtils";

export async function startLanguageServer(): Promise<LanguageClient> {
  let command = discoverDotRushLanguageServer();

  var serverOptions = {
    command,
    options: {
      cwd: getCurrentWorkingDirectory(),
    },
  };

  var clientOptions: LanguageClientOptions = {
    documentSelector: [{ pattern: "**/*.cs" }, { pattern: "**/*.xaml" }],
    diagnosticCollectionName: ExtensionName,
    progressOnInitialization: true,
    synchronize: {
      configurationSection: ExtensionName,
    },
    connectionOptions: {
      maxRestartCount: 2,
    },
    middleware: {
      provideCompletionItem: async (document, position, context, token, next) => {
        const result = await next(document, position, context, token);

        if (!result) {
          return result;
        }

        const isSnippet = (item: any) => {
          return item.kind === vscode.CompletionItemKind.Snippet;
        };

        if (Array.isArray(result)) {
          return result.filter(isSnippet);
        }

        if (result.items) {
          result.items = result.items.filter(isSnippet);
        }

        return result;
      },
    },
  };

  let client = new LanguageClient(ExtensionName, ExtensionName, serverOptions, clientOptions);
  (client as any)._features = [];
  client.registerFeature(new CompletionItemFeature(client));
  client.start();

  reloadWorkspace(client);
  return client;
}

function discoverDotRushLanguageServer() {
  let extensionPath = locateDotRushExtensionPath();
  if (!extensionPath) {
    throw new Error("DotRush extension must be installed, but disabled, to load semantic snippets.");
  }

  const serverExecutable = path.join(extensionPath, "extension", "bin", "LanguageServer", "DotRush");
  const serverExtension = process.platform === "win32" ? ".exe" : "";
  return serverExecutable + serverExtension;
}

function getCurrentWorkingDirectory(): string | undefined {
  if (vscode.workspace.workspaceFile !== undefined) {
    return path.dirname(vscode.workspace.workspaceFile.fsPath);
  }

  if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0) {
    return vscode.workspace.workspaceFolders[0].uri.fsPath;
  }
  return undefined;
}

export function reloadWorkspace(client: LanguageClient): void {
  const workspaceFolders = vscode.workspace.workspaceFolders?.map((folder) => ({
    uri: folder.uri.toString(),
    name: folder.name,
  }));

  client.sendNotification("dotrush/reloadWorkspace", {
    workspaceFolders: workspaceFolders,
  });
}
