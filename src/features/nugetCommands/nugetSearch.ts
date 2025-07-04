import { runDotnetCommand } from "../../utils/dotnetSdk";
import { getWorkspaceRoot } from "../../utils/workspace";
import { compareVersions } from "compare-versions";

export async function searchNugetPackages(
  query: string,
  includePrerelease: boolean
): Promise<{ id: string; version: string }[]> {
  const args = ["package", "search", query, "--take", "5", "--format", "json"];

  if (includePrerelease) {
    args.push("--prerelease");
  }

  const stdout = await runDotnetCommand(args, getWorkspaceRoot());
  const json = JSON.parse(stdout).searchResult;
  const sources = json || [];

  const packages = sources.flatMap((source: any) =>
    source.packages.map((pkg: any) => ({
      id: pkg.id,
      version: pkg.version,
    }))
  );

  const seen = new Set<string>();
  const uniquePackages = packages.filter((pkg: any) => {
    if (seen.has(pkg.id)) {
      return false;
    }
    seen.add(pkg.id);
    return true;
  });

  return uniquePackages;
}

export async function getNugetPackageVersions(id: string, includePrerelease: boolean): Promise<string[]> {
  const args = ["package", "search", id, "--exact-match", "--format", "json"];

  if (includePrerelease) {
    args.push("--prerelease");
  }

  const stdout = await runDotnetCommand(args, getWorkspaceRoot());
  const json = JSON.parse(stdout).searchResult;
  const sources = json || [];

  let versionList: string[] = sources.flatMap((source: any) => source.packages.map((pkg: any) => pkg.version));

  versionList.sort((a, b) => compareVersions(b, a));

  let seen = new Set<string>();
  versionList = versionList.filter((v) => {
    if (seen.has(v)) {
      return false;
    }
    seen.add(v);
    return true;
  });

  const majorMap = new Map<number, string[]>();
  for (const v of versionList) {
    const major = Number(v.split(".")[0]);
    if (!majorMap.has(major)) {
      majorMap.set(major, []);
    }
    majorMap.get(major)!.push(v);
  }

  const result: string[] = [];
  const sortedMajors = Array.from(majorMap.keys()).sort((a, b) => b - a);
  if (sortedMajors.length > 0) {
    const topMajor = sortedMajors[0];
    result.push(...majorMap.get(topMajor)!.slice(0, 3));
    for (let i = 1; i < Math.min(majorMap.size, 4); i++) {
      result.push(majorMap.get(sortedMajors[i])![0]);
    }
  }

  return result;
}

export async function searchNugetPackagesByType(
  typeName: string,
  includePrerelease: boolean = false
): Promise<{ id: string }[]> {
  const url = `https://resharper-nugetsearch.jetbrains.com/api/v1/find-type?name=${encodeURIComponent(
    typeName
  )}&allowPrerelease=${includePrerelease}&caseSensitive=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !(data as any).packages || !Array.isArray((data as any).packages)) {
      return [];
    }

    return (data as any).packages.slice(0, 10).map((item: any) => ({
      id: item.id,
    }));
  } catch (error) {
    console.error("Failed to search for type:", error);
    return [];
  }
}
