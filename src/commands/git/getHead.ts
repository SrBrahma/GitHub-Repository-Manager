import execa from 'execa';

export async function getHeadBranch(cwd: string): Promise<string> {
  // Requires Git >1.8, but will properly error if dettached head, whatever that means.
  // https://stackoverflow.com/a/19147667/10247962 but read other answers. no '-q' here, as it would 'quiet'
  // the stderr.
  return (await execa('git', ['symbolic-ref', '--short', 'HEAD'], { cwd })).stdout;
}