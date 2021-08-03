import execa from 'execa';

/** Throw error if path hasn't git. */
export async function gitHasRemote(path: string): Promise<boolean> {
  /** returns '' if no remote, 'origin' if origin remote, 'origin\norigin2' for 2 remotes. On windows certainly
   * may include \r. */
  const { stdout } = await execa('git', ['remote', 'show'], { cwd: path });
  return !!stdout;
}