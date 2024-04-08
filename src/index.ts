#!/usr/bin/env node
import * as child_process from "child_process";
import * as config from "../config.json";
import { Terminal, terminal as term } from "terminal-kit";
import * as path from "path";
import isEmpty from "../util/isEmpty";
import { readFileSync, writeFileSync } from "fs";

const projectTypes = ["app", "library", "cancel"];

function errorAndExit(msg?: string): never {
  if (msg) {
    term.bold.red(msg + "\n");
  } else {
    term.bold.red("Failed\n");
  }

  process.exit(process.exitCode);
}

async function getName(): Promise<string> {
  return new Promise<string>((res) => {
    term.yellow("Project name: ");

    term.inputField(
      {
        default: "lune-electron",
      },
      (error, name) => {
        if (error || !name) errorAndExit();
        term("\n");
        res(name);
      }
    );
  });
}

async function getDirectory(context: { name: string }): Promise<string> {
  const autoComplete = [".", context.name];

  return new Promise<string>((res) => {
    term.yellow("Project directory: ");

    term.inputField(
      {
        autoComplete,
        autoCompleteMenu: true,
        default: context.name,
      },
      (error, directory) => {
        if (!directory) directory = ".";
        if (error) errorAndExit();
        term("\n");
        res(directory);
      }
    );
  });
}

async function getProjectType() {
  term.clear();

  return new Promise<Terminal.GridMenuResponse>((res) => {
    term.gridMenu(
      projectTypes,
      {
        y: 1,
        style: term.inverse,
        selectedStyle: term.dim.magenta.bgGray,
      },
      (error, response) => {
        if (error) errorAndExit();
        if (projectTypes[response.selectedIndex] === "cancel")
          errorAndExit("Canceled command");

        term("\n");
        res(response);
      }
    );
  });
}

async function start() {
  const type = await getProjectType();
  if (projectTypes[type.selectedIndex] === "library") {
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

  console.log(fullDirectory);
  console.log(process.cwd());

  term.green("create-luau-app was ran successfully\n");

  if (fullDirectory != process.cwd()) {
    term.bold.underline(
      `run 'cd ${path.relative(process.cwd(), fullDirectory)}'`
    );

    term.bold(" and then --->> ");
  }

  term.bold.underline(
    "use your favorite package manager to install all the dependencies, for example: 'yarn install'\n"
  );

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
