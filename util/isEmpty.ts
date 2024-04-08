import { existsSync, readdirSync } from "fs";

export default function (directory: string): boolean {
  if (!existsSync(directory)) return true;

  let files = readdirSync(directory);

  if (files.length <= 0) {
    return true;
  }

  return false;
}
