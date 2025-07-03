import { spawn } from "child_process";

export async function isDotNetSdkAvailable(): Promise<boolean> {
  try {
    return new Promise((resolve) => {
      const dotnet = spawn("dotnet", ["--version"], { stdio: "pipe" });
      dotnet.on("close", (code: number) => {
        resolve(code === 0);
      });
      dotnet.on("error", () => {
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

export async function runDotnetCommand(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("dotnet", args, { cwd });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `dotnet exited with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}
