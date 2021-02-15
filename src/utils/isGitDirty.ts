// based on / copied https://github.com/JPeer264/node-is-git-dirty/blob/main/index.ts
// git diff-index --quiet HEAD https://unix.stackexchange.com/a/394674/447527
import execa from 'execa';

export type IsGitDirty = 'clean' | 'dirty' | 'error';
export async function isGitDirty(gitDirPath: string): Promise<IsGitDirty> {
  try {
    // const { stdout } = await execa('git', ['status', '--short'], { cwd: gitDirPath });
    // const dirty = stdout.length > 0;

    await execa('git', ['diff-index', '--quiet', 'HEAD'], { cwd: gitDirPath });
    return 'clean';

    // const dirty = !!exitCode;
    // return dirty ? 'dirty' : 'clean';
  } catch (err) {
    return 'dirty';
    // console.error(`Error getting local repository dirty status. Repository path = ${gitDirPath} , error = ${err}`);
    // return 'error';
  }
}