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
