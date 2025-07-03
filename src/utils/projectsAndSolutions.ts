import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export async function listSolutionFiles(): Promise<vscode.Uri[]> {
  return [...(await findFilesInWorkspace(".sln")), ...(await findFilesInWorkspace(".slnx"))];
}

export async function listProjectFiles(): Promise<vscode.Uri[]> {
  return findFilesInWorkspace(".csproj");
}

export function findNearestProject(currentFile: string, projectFiles: string[]): string | undefined {
  let minDist = Number.POSITIVE_INFINITY;
  let nearest: string | undefined;

  for (const proj of projectFiles) {
    const rel = path.relative(path.dirname(proj), currentFile);
    const dist = rel.split(path.sep).length;
    if (dist < minDist) {
      minDist = dist;
      nearest = proj;
    }
  }

  return nearest;
}

export async function findProjectsInSolution(slnPath: string): Promise<string[]> {
  const dir = path.dirname(slnPath);
  const content = fs.readFileSync(slnPath, "utf8");
  const matches = Array.from(content.matchAll(/Project\(.*?\) = ".*?", "(.*?)",/g));
  return matches
    .map((m) => path.resolve(dir, m[1].replace(/\\/g, path.sep)))
    .filter((f) => fs.existsSync(f) && f.endsWith(".csproj"));
}

async function findFilesInWorkspace(extension: string): Promise<vscode.Uri[]> {
  const result = await vscode.workspace.findFiles(`**/*${extension}`, null);
  return result.sort((a, b) => path.basename(a.fsPath).localeCompare(path.basename(b.fsPath)));
}
