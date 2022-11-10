import execa from 'execa';

/**
 * Get git HEAD branch.
 * For some mysterious git reason, it must be executed inside any git dir.
 * May throw errors.
 * @returns undefined if repository hasn't a remote HEAD, else, returns HEAD name.
 * https://stackoverflow.com/a/50056710/10247962
 * */
export async function getRemoteHead({
  remoteUrl,
  repositoryPath,
}: {
  remoteUrl: string;
  repositoryPath: string;
}): Promise<string | undefined> {
  const gitRemoteShowResult = (
    await execa('git', ['remote', 'show', remoteUrl], { cwd: repositoryPath })
  ).stdout;
  // We used to get the branch by Regexing the HEAD, but it would lend to locale issues as
  // the output is language dependent. We now get the 4th line, after the whitespace, and then the last word.
  /** (unknown) if no branch, = new empty repository. */
  const headFromRemoteShow: '(unknown)' | string | undefined = gitRemoteShowResult
    .split('\n')[3]
    ?.split(' ')
    ?.pop()
    ?.trim();

  if (!headFromRemoteShow)
    throw new Error(
      `'git remote show <remoteUrl>' hasn't returned a HEAD branch! Report this error to the extension author! stdout: "${gitRemoteShowResult}"`,
    );

  if (headFromRemoteShow === '(unknown)') return undefined;

  return headFromRemoteShow;
}

/* Examples of 'git remote show $url'
 * PT-BR
* remoto https://github.com/SrBrahma/GitHub-Repository-Manager.git
  Buscar URL: https://github.com/SrBrahma/GitHub-Repository-Manager.git
  Atirar URL: https://github.com/SrBrahma/GitHub-Repository-Manager.git
  Ramo HEAD: main
  Referências locais configuradas para 'git push':
    1.5.0 publica em 1.5.0 (atualizado)
    main  publica em main  (local desatualizado)

 * DE
* Remote-Repository https://github.com/SrBrahma/GitHub-Repository-Manager.git
  URL zum Abholen: https://github.com/SrBrahma/GitHub-Repository-Manager.git
  URL zum Versenden: https://github.com/SrBrahma/GitHub-Repository-Manager.git
  Hauptbranch: main
  Lokale Referenz konfiguriert für 'git push':
    main versendet nach main (aktuell)
 */
