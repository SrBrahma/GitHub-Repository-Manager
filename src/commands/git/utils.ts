import Path from 'path';
import fse from 'fs-extra';

/** True if has git, false if don't. */
export function pathHasGit(path: string): Promise<boolean> {
  return fse.pathExists(Path.join(path, '.git'));
}

/** Includes .git on end. */
export function getRepositoryGitUrl(options: {
  owner: string;
  repositoryName: string;
  token?: string;
}): string {
  return options.token
    ? `https://${options.token}@github.com/${options.owner}/${options.repositoryName}.git`
    : `https://github.com/${options.owner}/${options.repositoryName}.git`;
}
