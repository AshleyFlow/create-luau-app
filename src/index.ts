#!/usr/bin/env node
import * as child_process from "child_process";
import * as config from "../config.json";
import { terminal as term } from "terminal-kit";
import * as path from "path";
import isEmpty from "../util/isEmpty";
import { readFileSync, writeFileSync } from "fs";
import { errorAndExit, getDirectory, getName, getProjectType } from "./prompts";

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

function successMessage(fullDirectory: string) {
  term.green("create-luau-app ran successfully\n");

  term.bold.green("   Run these commands:\n\n");

  if (fullDirectory != process.cwd()) {
    term.bold.underline(
      `'cd ${path.relative(process.cwd(), fullDirectory)}'\n\n`
    );
  }

  term.bold.underline("'yarn install'\n\n");

  term.bold.underline("'aftman install'\n\n");
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

  const name = await getName();
  const directory = await getDirectory({ name });
  const fullDirectory = path.resolve(process.cwd(), directory);

  if (!isEmpty(fullDirectory))
    errorAndExit("The project directory must be empty");

  child_process.execSync(`git clone --depth 1 ${config.git} ${fullDirectory}`, {
    stdio: "inherit",
  });

  successMessage(fullDirectory);

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

  process.exit();
}

start();
