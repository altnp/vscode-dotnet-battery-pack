# .NET Battery Pack VS Code Extension

.NET Battery Pack closes gaps between popular .NET extensions, upgrading your Resharper, C# Dev Kit, and DotRush experience for Visual Studio Code. It brings advanced semantic snippets, surround-with refactorings, and NuGet package management to your workflow.

## Features

- **Semantic Snippets for C#**

  - Context-aware code completions for C# files powered by the DotRush Language Server

  - Only shows snippet completions, filtering out other types

  - Automatically disables built-in C# snippets to avoid duplication

  - > **Warning** > **Requires DotRush extension to be installed, but not enabled.**
    > DotRush Language Server provides the semantic snippets, but the extension itself must remain disabled to avoid conflicts with C# Dev Kit and other extensions.

  - **Enabled by default only when C# Dev Kit is active and DotRush is installed but disabled**

- **Surround With Refactorings**

  - Adds "Surround With" code actions for C# (right-click or lightbulb menu)

  - Supports: if, if/else, for, for reverse, foreach, try/catch, try/finally, try/catch/finally, while, using, lock

  - "More..." menu for additional surround options

  - Works on selected code or current line

  - **Enabled only when C# Dev Kit is not enabled**

- **NuGet Package Commands**

  - Add, update, or remove NuGet packages from projects or solutions

  - Search for packages (optionally include prerelease)

  - Select version to install or update

  - Multi-project/solution support

  - Toggle inclusion of prerelease packages

  - **Enabled by default for all .NET projects**

## Commands

- `.NET Battery Pack: Reload Workspace`
  Reloads the workspace for semantic snippet updates.

- `.NET Battery Pack: Show Surround Options`
  Opens a menu to select a surround-with snippet.

- `.NET Battery Pack: Apply Surround Snippet`
  Applies a selected surround-with snippet to the current selection.

- `NuGet: Add Package`
  Search for and add a NuGet package to selected projects/solutions.

- `NuGet: Update Package`
  Update a NuGet package to a selected version in your projects/solutions.

- `NuGet: Remove Package`
  Remove a NuGet package from selected projects/solutions.

- `NuGet: Toggle Prerelease Packages`
  Toggle whether prerelease NuGet packages are included in search results.

All commands are available from the Command Palette.

## Example Usage

**Surround With Example:**

Select code and choose "Surround With" → "if statement":

```
Console.WriteLine("Hello");
```

becomes

```
if (true)
{
    Console.WriteLine("Hello");
}
```

**NuGet Add Example:**

- Run `NuGet: Add Package`
- Search for `Newtonsoft.Json`
- Select version
- Package is added to your project or solution

## Configuration

- `dotnetBatteryPack.semanticSnippets.enabled`
  Enable semantic snippets for C# files (default: `true`)

- `dotnetBatteryPack.semanticSnippets.disableWhenExtensions`
  List of extension IDs that, if enabled, will disable semantic snippets (default: `["nromanov.dotrush", "JetBrains.resharper-code"]`)

- `dotnetBatteryPack.surroundWith.enabled`
  Enable surround with code actions for C# files (default: `true`)

- `dotnetBatteryPack.surroundWith.disableWhenExtensions`
  List of extension IDs that, if enabled, will disable surround with features (default: `["ms-dotnettools.csharp", "ms-dotnettools.csdevkit"]`)

- `dotnetBatteryPack.nugetCommands.enabled`
  Enable NuGet commands (add, update, remove) for .NET projects (default: `true`)

- `dotnetBatteryPack.nugetCommands.includePrerelease`
  Include prerelease NuGet packages in search results (default: `false`)

## Getting Started

1. Install the extension from the VS Code Marketplace
2. Ensure the DotRush extension is installed (but not enabled) for semantic snippet support
3. Use the provided commands from the Command Palette or context menus

## Release Notes

See [CHANGELOG.md](./CHANGELOG.md) for details.
