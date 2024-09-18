#!/usr/bin/env node
import { simpleGit } from "simple-git";
import { terminal as term } from "terminal-kit";
import * as path from "path";
import isEmpty from "../util/isEmpty";
import { readFileSync, writeFileSync } from "fs";
import {
  errorAndExit,
  getDirectory,
  getName,
  getPackageManager,
  getProjectType,
} from "./prompts";
import { exit } from "process";

export enum PackageManager {
  NPM = "npm",
  PNPM = "pnpm",
  Bun = "bun",
  Yarn = "yarn",
  Cancel = "cancel",
}

export const packageManagers = [
  PackageManager.NPM,
  PackageManager.PNPM,
  PackageManager.Bun,
  PackageManager.Yarn,
  PackageManager.Cancel,
];

export enum ProjectType {
  LuneWeb = "luneweb",
  TauriApp = "(legacy) tauri-app",
  ElectronApp = "(legacy) electron-app",
  Library = "library",
  Cancel = "cancel",
}

export const projectTypes = [
  ProjectType.LuneWeb,
  ProjectType.TauriApp,
  ProjectType.ElectronApp,
  ProjectType.Library,
  ProjectType.Cancel,
];

export const projectTypeRepos: {
  [K in ProjectType]: string;
} = {
  [ProjectType.LuneWeb]: "https://github.com/LuneWeb/Template.git",
  [ProjectType.ElectronApp]:
    "https://github.com/AshleyFlow/lune-electron-template.git",
  [ProjectType.TauriApp]:
    "https://github.com/AshleyFlow/lune-tauri-template.git",
  [ProjectType.Library]: "",
  [ProjectType.Cancel]: "",
};

function successMessage(context: {
  fullDirectory: string;
  packageManager: PackageManager;
  type: ProjectType;
}) {
  term.green("create-luau-app ran successfully\n");

  term.bold.green("   Run these commands:\n\n");

  if (context.fullDirectory != process.cwd()) {
    term.bold.underline(
      `'cd ${path.relative(process.cwd(), context.fullDirectory)}'\n`
    );
  }

  let packageManagerInstallText: string = "yarn install";

  switch (context.packageManager) {
    case PackageManager.NPM:
      packageManagerInstallText = "npm install";
      break;
    case PackageManager.PNPM:
      packageManagerInstallText = "pnpm install";
      break;
    case PackageManager.Bun:
      packageManagerInstallText = "bun install";
      break;
    case PackageManager.Yarn:
      packageManagerInstallText = "yarn install";
      break;
  }

  term.bold.underline(`'${packageManagerInstallText}'\n`);

  if (context.type === ProjectType.TauriApp) {
    term.bold.underline(
      `'cd tauri && ${packageManagerInstallText} && cd ..'\n`
    );
  }

  if (context.type === ProjectType.LuneWeb) {
    term.bold.underline("'rokit install'\n");
  } else {
    term.bold.underline("'aftman install'\n");
    term.bold.yellow("'npx npmluau'\n");
  }
}

async function start() {
  const type = await getProjectType();

  if (type === ProjectType.Library) {
    term.bold
      .red(
        "Generator for library is not implemented yet, read how to create a library here: "
      )
      .bgMagenta.white(
        "https://github.com/HighFlowey/lune-electron-template?tab=readme-ov-file#creating-packages\n"
      );

    errorAndExit("Canceled command");
  }

  const packageManager = await getPackageManager();
  const name = await getName();
  const directory = await getDirectory({ name });
  const fullDirectory = path.resolve(process.cwd(), directory);

  if (!isEmpty(fullDirectory))
    errorAndExit("The project directory must be empty");

  const git = simpleGit();
  const repo = projectTypeRepos[type];

  if (repo.length === 0) {
    exit(0);
  }

  await git.clone(repo, fullDirectory, {
    "--depth": "1",
  });

  const packageJsonPath = path.resolve(fullDirectory, "package.json");
  let packageJson = JSON.parse(readFileSync(packageJsonPath).toString());

  const packageJsonScripts: {
    [key: string]: string;
  } = packageJson.scripts ?? {};

  Object.keys(packageJsonScripts).forEach((key) => {
    const value = packageJsonScripts[key];
    packageJsonScripts[key] = value.replace("yarn", packageManager);
  });

  if (type === ProjectType.ElectronApp) {
    packageJson.name = name;
    packageJson.description = "";
    packageJson.version = "1.0.0";
    packageJson.author = "";
    packageJson.license = undefined;
    writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, "\t"),
      "utf8"
    );
  } else if (type === ProjectType.TauriApp) {
    {
      packageJson.name = name;
      packageJson.description = "";
      packageJson.version = "1.0.0";
      packageJson.author = "";
      packageJson.license = undefined;
      writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, "\t"),
        "utf8"
      );
    }

    {
      const secondPackageJsonPath = path.resolve(fullDirectory, "package.json");
      let secondPackageJson = JSON.parse(
        readFileSync(secondPackageJsonPath).toString()
      );
      secondPackageJson.name = name;
      writeFileSync(
        secondPackageJsonPath,
        JSON.stringify(secondPackageJson, null, "\t"),
        "utf8"
      );
    }

    {
      const tauriJsonPath = path.resolve(
        fullDirectory,
        "tauri/src-tauri/tauri.conf.json"
      );
      let tauriJson = JSON.parse(readFileSync(tauriJsonPath).toString());
      tauriJson.package.productName = name;
      tauriJson.build.beforeDevCommand = `${packageManager} dev`;
      tauriJson.build.beforeBuildCommand = `${packageManager} build`;
      writeFileSync(
        tauriJsonPath,
        JSON.stringify(tauriJson, null, "\t"),
        "utf8"
      );
    }
  }

  successMessage({
    fullDirectory,
    packageManager,
    type,
  });

  process.exit();
}

start();
