import execa from 'execa';

/**
 * Get git HEAD branch.
 * For some mysterious git reason, it must be executed inside any git dir.
 * May throw errors.
 * @returns undefined if repository hasn't a remote HEAD, else, returns HEAD name.
 * https://stackoverflow.com/a/50056710/10247962
 * */
export async function getRemoteHead({ remoteUrl, repositoryPath }: {
  remoteUrl: string;
  repositoryPath: string;
}): Promise<string | undefined> {

  const gitRemoteShowResult = (await execa(
    'git',
    ['remote', 'show', remoteUrl],
    { cwd: repositoryPath })
  ).stdout;
    /** (unknown) if no branch, = new empty repository. Certainly won't be undefined. */
  const headFromRemoteShow: '(unknown)' | string | undefined = gitRemoteShowResult.match(/(?<=HEAD branch:).+/)?.[0]!.trim();

  if (!headFromRemoteShow)
    throw new Error(`'git remote show <remoteUrl>' haven't returned a HEAD branch! Report this error to the extension author!`);

  if (headFromRemoteShow === '(unknown)')
    return undefined;

  return headFromRemoteShow;
}