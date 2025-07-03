import * as vscode from "vscode";
import * as path from "path";
import { findNearestProject, listProjectFiles, listSolutionFiles } from "../../utils/projectsAndSolutions";

export async function selectProjectOrSolutionFiles(): Promise<string[] | undefined> {
  const solutionFiles = await listSolutionFiles();
  const projectFiles = await listProjectFiles();

  if (projectFiles.length === 0 && solutionFiles.length === 0) {
    vscode.window.showErrorMessage("No project or solution files found.");
    return undefined;
  }

  const items: vscode.QuickPickItem[] = [];

  if (solutionFiles.length > 0) {
    items.push({ label: "Solutions", kind: vscode.QuickPickItemKind.Separator });
    items.push(...solutionFiles.map((it) => new ProjectOrSolutionItem(it.fsPath)));
  }

  if (projectFiles.length > 0) {
    items.push({ label: "Projects", kind: vscode.QuickPickItemKind.Separator });
    items.push(...projectFiles.map((it) => new ProjectOrSolutionItem(it.fsPath)));
  }

  let activeItem: vscode.QuickPickItem | undefined;

  const editor = vscode.window.activeTextEditor;

  if (editor && projectFiles.length > 0) {
    const currentFile = editor.document.uri.fsPath;
    const projectPaths = projectFiles.map((p) => p.fsPath);
    const nearest = findNearestProject(currentFile, projectPaths);
    if (nearest) {
      activeItem = items.find((it: any) => it.item === nearest);
    }
  }

  return await new Promise((resolve) => {
    const qp = vscode.window.createQuickPick();
    qp.items = items;
    qp.canSelectMany = true;
    qp.placeholder = "Select target project(s) or solution(s)";
    if (activeItem) {
      qp.selectedItems = [activeItem];
    }
    qp.onDidAccept(() => {
      const selected = qp.selectedItems.map((it: any) => it.item);
      qp.hide();
      resolve(selected);
    });
    qp.onDidHide(() => {
      resolve(undefined);
    });
    qp.show();
  });
}

class ProjectOrSolutionItem implements vscode.QuickPickItem {
  label: string;
  description: string;
  item: string;

  constructor(targetPath: string) {
    this.description = vscode.workspace.asRelativePath(targetPath);
    this.item = targetPath;
    const ext = path.extname(targetPath);
    const icon = ext === ".solution" ? "$(file-symlink-directory)" : "$(file-code)";
    const name = path.basename(targetPath, ext);
    this.label = `${icon} ${name}`;
  }
}
