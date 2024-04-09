import { terminal as term } from "terminal-kit";
import { ProjectType, projectTypes } from ".";

export function errorAndExit(msg?: string): never {
  if (msg) {
    term.bold.red(msg + "\n");
  } else {
    term.bold.red("Failed\n");
  }

  process.exit(process.exitCode);
}

export async function getName(): Promise<string> {
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

export async function getDirectory(context: { name: string }): Promise<string> {
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

export async function getProjectType() {
  term.clear();

  return new Promise<ProjectType>((res) => {
    term.gridMenu(
      projectTypes,
      {
        y: 1,
        style: term.inverse,
        selectedStyle: term.dim.magenta.bgGray,
      },
      (error, response) => {
        if (error) errorAndExit();
        if (projectTypes[response.selectedIndex] === ProjectType.Cancel)
          errorAndExit("Canceled command");

        term("\n");
        res(projectTypes[response.selectedIndex]);
      }
    );
  });
}
