import fse from 'fs-extra';
import Path from 'path';

/** True if has git, false if don't. */
export function pathHasGit(path: string): Promise<boolean> {
  return fse.pathExists(Path.join(path, '.git'));
}