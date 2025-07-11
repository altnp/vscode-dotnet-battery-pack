import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { runDotnetCommand } from "../../utils/dotnetSdk";
import { findProjectsInSolution, listProjectFiles } from "../../utils/projectsAndSolutions";
import { getNugetPackageVersions, searchNugetPackages, searchNugetPackagesByType } from "./nugetSearch";
import { selectProjectOrSolutionFiles } from "./projectPicker";

export async function showNugetAddCommand() {
  const config = vscode.workspace.getConfiguration("dotnetBatteryPack.nugetCommands");
  const includePrerelease = config.get<boolean>("includePrerelease", false);

  const targets = await getSelectedProjectOrSolutionFiles();
  if (!targets) {
    return;
  }
  const projectFiles: string[] = await expandToProjects(targets);

  let input = await vscode.window.showInputBox({
    prompt: "Enter NuGet package name",
    placeHolder: "e.g. Newtonsoft.Json or MyPackage",
  });
  if (!input) {
    return;
  }

  let selectedPackage;
  while (!selectedPackage) {
    const results = await searchNugetPackages(input, includePrerelease);

    if (!results.length) {
      input = await vscode.window.showInputBox({
        prompt: "No package found. Enter another package name",
        placeHolder: "e.g. Newtonsoft.Json or MyPackage",
      });
      if (!input) {
        return;
      }
      continue;
    }

    const pick = await vscode.window.showQuickPick(
      results.map((pkg) => ({ label: pkg.id, detail: pkg.version })),
      { placeHolder: "Select a NuGet package" }
    );

    if (!pick) {
      input = await vscode.window.showInputBox({
        prompt: "No package selected. Enter another package name",
        placeHolder: "e.g. Newtonsoft.Json or MyPackage",
      });
      if (!input) {
        return;
      }
      continue;
    }
    selectedPackage = results.find((pkg) => pkg.id === pick.label);
  }

  const versions = await getNugetPackageVersions(selectedPackage.id, includePrerelease);
  if (!versions.length) {
    vscode.window.showWarningMessage(`No versions found for package ${selectedPackage.id}`);
    return;
  }

  const selectedVersion = await vscode.window.showQuickPick(
    versions.map((v) => ({ label: v })),
    { placeHolder: `Select version of ${selectedPackage.id} to install` }
  );

  if (!selectedVersion) {
    return;
  }

  try {
    await Promise.all(
      projectFiles.map((proj) =>
        runDotnetCommand(
          ["add", proj, "package", selectedPackage.id, "--version", selectedVersion.label].filter(Boolean),
          path.dirname(proj)
        )
      )
    );

    vscode.window.showInformationMessage(
      `Installed ${selectedPackage.id} (${selectedVersion.label}) to ${
        targets.length === 1 ? path.basename(targets[0]) : "all selected projects"
      }.`
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed to add NuGet package:", error);
    }
  }

  await reloadDotRush();
}

export async function showNugetUpdateCommand() {
  const targets = await getSelectedProjectOrSolutionFiles();
  if (!targets) {
    return;
  }
  let projectFiles: string[] = await expandToProjects(targets);

  const allPackages = new Set<string>();
  await Promise.all(
    projectFiles.map(async (proj) => {
      try {
        const pkgs = await getPackagesFromProject(proj);
        pkgs.forEach((p) => allPackages.add(p));
      } catch {}
    })
  );
  if (allPackages.size === 0) {
    vscode.window.showWarningMessage("No NuGet packages found in selected projects.");
    return;
  }

  const sortedPackages = Array.from(allPackages).sort((a, b) => a.localeCompare(b));
  let pick = await vscode.window.showQuickPick(
    sortedPackages.map((p) => ({ label: p })),
    { placeHolder: "Select a package to update" }
  );
  if (!pick) {
    return;
  }

  const config = vscode.workspace.getConfiguration("dotnetBatteryPack.nugetCommands");
  const includePrerelease = config.get<boolean>("includePrerelease", false);
  let pkgName = pick.label.trim();
  let versions: string[] = [];
  versions = await getNugetPackageVersions(pkgName, includePrerelease);
  if (!versions.length) {
    vscode.window.showWarningMessage(`No versions found for package ${pkgName}`);
    return;
  }

  const versionPick = await vscode.window.showQuickPick(
    versions.map((v) => ({ label: v })),
    { placeHolder: `Select version to update ${pkgName} to` }
  );
  if (!versionPick) {
    return;
  }

  try {
    await Promise.all(
      projectFiles.map(async (proj) => {
        const pkgs = await getPackagesFromProject(proj);
        if (pkgs.includes(pick.label)) {
          await runDotnetCommand(
            ["add", proj, "package", pkgName, "--version", versionPick.label].filter(Boolean),
            path.dirname(proj)
          );
        }
      })
    );
    vscode.window.showInformationMessage(
      `Updated ${pkgName} to ${versionPick.label} in ${
        projectFiles.length === 1 ? path.basename(projectFiles[0]) : "all selected projects"
      }.`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to update NuGet package: ${error instanceof Error ? error.message : error}`);
  }

  await reloadDotRush();
}

export async function showNugetRemoveCommand() {
  const targets = await getSelectedProjectOrSolutionFiles();
  if (!targets) {
    return;
  }
  let projectFiles: string[] = await expandToProjects(targets);

  const allPackages = new Set<string>();
  await Promise.all(
    projectFiles.map(async (proj) => {
      try {
        const pkgs = await getPackagesFromProject(proj);
        pkgs.forEach((p) => allPackages.add(p));
      } catch {}
    })
  );

  if (allPackages.size === 0) {
    vscode.window.showWarningMessage("No NuGet packages found in selected projects.");
    return;
  }

  const sortedPackages = Array.from(allPackages).sort((a, b) => a.localeCompare(b));
  let pick = await vscode.window.showQuickPick(
    sortedPackages.map((p) => ({ label: p })),
    { placeHolder: "Select a package to remove" }
  );

  if (!pick) {
    return;
  }

  try {
    await Promise.all(
      projectFiles.map(async (proj) => {
        const pkgs = await getPackagesFromProject(proj);
        if (pkgs.includes(pick.label)) {
          await runDotnetCommand(["remove", proj, "package", pick.label], path.dirname(proj));
        }
      })
    );
    vscode.window.showInformationMessage(
      `Removed ${pick.label} from ${targets.length === 1 ? path.basename(targets[0]) : "all selected projects"}.`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to remove NuGet package: ${error instanceof Error ? error.message : error}`);
  }

  await reloadDotRush();
}

export async function toggleIncludePrereleaseSetting() {
  const config = vscode.workspace.getConfiguration("dotnetBatteryPack.nugetCommands");
  const current = config.get<boolean>("includePrerelease", false);
  await config.update("includePrerelease", !current, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(`Include prerelease packages is now ${!current ? "enabled" : "disabled"}.`);
}

export async function showReverseNugetSearchCommand(typeName: string) {
  const config = vscode.workspace.getConfiguration("dotnetBatteryPack.nugetCommands");
  const includePrerelease = config.get<boolean>("includePrerelease", false);

  const results = await searchNugetPackagesByType(typeName, includePrerelease);

  if (!results.length) {
    vscode.window.showWarningMessage(`No NuGet packages found containing type '${typeName}'.`);
    return;
  }

  const pick = await vscode.window.showQuickPick(
    results.map((pkg) => ({
      label: pkg.id,
      pkg: pkg,
    })),
    {
      placeHolder: `Select a package containing '${typeName}'`,
      matchOnDescription: true,
      matchOnDetail: true,
    }
  );

  if (!pick) {
    return;
  }

  let pkgName = pick.label.trim();
  let versions = await getNugetPackageVersions(pkgName, includePrerelease);
  if (!versions.length) {
    vscode.window.showWarningMessage(`No versions found for package ${pkgName}`);
    return;
  }
  const versionPick = await vscode.window.showQuickPick(
    versions.map((v) => ({ label: v })),
    { placeHolder: `Select version to update ${pkgName} to` }
  );

  if (!versionPick) {
    return;
  }

  const targets = await getSelectedProjectOrSolutionFiles();
  if (!targets) {
    return;
  }

  const projectFiles: string[] = await expandToProjects(targets);

  try {
    await Promise.all(
      projectFiles.map((proj) =>
        runDotnetCommand(
          ["add", proj, "package", pkgName, "--version", versionPick.label].filter(Boolean),
          path.dirname(proj)
        )
      )
    );
    vscode.window.showInformationMessage(
      `Installed ${pkgName} (${versionPick.label}) to ${
        targets.length === 1 ? path.basename(targets[0]) : "all selected projects"
      }.`
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to install NuGet package: ${error instanceof Error ? error.message : error}`
    );
  }

  await reloadDotRush();
}

async function reloadDotRush() {
  const dotRushExtension = vscode.extensions.getExtension("nromanov.dotrush");
  if (dotRushExtension && dotRushExtension.isActive) {
    try {
      await vscode.commands.executeCommand("dotrush.reloadWorkspace");

      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        const documentUri = activeEditor.document.uri;
        const selection = activeEditor.selection;
      }
    } catch (error) {}
  }
}

async function expandToProjects(targets: string[]): Promise<string[]> {
  const projects: string[] = [];
  for (const t of targets) {
    if (t.endsWith(".sln")) {
      projects.push(...(await findProjectsInSolution(t)));
    } else if (t.endsWith(".csproj")) {
      projects.push(t);
    }
  }
  return projects;
}

async function getPackagesFromProject(csprojPath: string): Promise<string[]> {
  const content = fs.readFileSync(csprojPath, "utf8");
  const matches = Array.from(content.matchAll(/<PackageReference[^>]*Include="([^"]+)"/g));
  return matches.map((m) => m[1]);
}

async function getSelectedProjectOrSolutionFiles(): Promise<string[] | undefined> {
  let targets: string[] | undefined = await listProjectFiles().then((uris) => uris.map((uri) => uri.fsPath));

  if (!targets || targets.length === 0) {
    vscode.window.showErrorMessage(`No projects found in the workspace.`);
    return;
  }

  if (targets && targets.length > 1) {
    targets = await selectProjectOrSolutionFiles();
  }

  if (!targets || targets.length === 0) {
    return;
  }

  return targets;
}
