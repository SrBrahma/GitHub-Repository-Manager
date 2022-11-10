import Path from 'path';
import fse from 'fs-extra';

/** True if has git, false if don't. */
export function pathHasGit(path: string): Promise<boolean> {
  return fse.pathExists(Path.join(path, '.git'));
}
