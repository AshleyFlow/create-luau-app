#!/usr/bin/env node
import * as child_process from "child_process";
import * as config from "../config.json";
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

export enum PackageManager {
  NPM = "npm",
  PNPM = "pnpm",
  Yarn = "yarn",
  Cancel = "cancel",
}

export const packageManagers = [
  PackageManager.NPM,
  PackageManager.PNPM,
  PackageManager.Yarn,
  PackageManager.Cancel,
];

export enum ProjectType {
  TauriApp = "tauri-app",
  ElectronApp = "electron-app",
  Library = "library",
  Cancel = "cancel",
}

export const projectTypes = [
  ProjectType.TauriApp,
  ProjectType.ElectronApp,
  ProjectType.Library,
  ProjectType.Cancel,
];

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

  term.bold.underline("'aftman install'\n");

  term.bold.yellow("'npx npmluau'\n");
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

  child_process.execSync(
    `git clone --depth 1 ${
      type === ProjectType.TauriApp ? config.tauri : config.electron
    } ${fullDirectory}`,
    {
      stdio: "inherit",
    }
  );

  if (type === ProjectType.ElectronApp) {
    const packageJsonPath = path.resolve(fullDirectory, "package.json");
    let packageJson = JSON.parse(readFileSync(packageJsonPath).toString());
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
      const packageJsonPath = path.resolve(fullDirectory, "package.json");
      let packageJson = JSON.parse(readFileSync(packageJsonPath).toString());
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
