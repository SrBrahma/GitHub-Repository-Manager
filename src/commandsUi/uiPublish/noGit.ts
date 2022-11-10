import { initGit } from '../../commands/git/initGit/initGit';
import { pathHasGit } from '../../commands/git/pathHasGit/pathHasGit';
import { User } from '../../store/user';
import type { NewRepository } from '../uiCreateRepo';

export async function preNoGit({ cwd }: { cwd: string }): Promise<void> {
  if (await pathHasGit(cwd)) throw new Error('Project already has .git!');
}

export async function posNoGit({
  cwd,
  newRepository,
}: {
  cwd: string;
  newRepository: NewRepository;
}): Promise<void> {
  await initGit(cwd, {
    remote: {
      owner: newRepository.owner.login,
      repositoryName: newRepository.name,
    },
    commitAllAndPush: {
      token: User.token!, // Already checked above.
    },
    cleanOnError: true,
  });
}
