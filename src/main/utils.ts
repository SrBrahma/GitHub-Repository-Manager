import os from 'os';
import vscode from 'vscode';

export const extensionIdentifier = 'githubRepoMgr';

/** Will prefix it with `${extensionIdentifier}.` Is it required? */
export async function myExtensionSetContext(
  context: string,
  value: any,
): Promise<void> {
  await vscode.commands.executeCommand(
    'setContext',
    `${extensionIdentifier}.${context}`,
    value,
  );
}
export function replaceTildeToHomedir(uri: string): string {
  return uri.replace(/^~/, os.homedir());
}

// export const channel = vscode.window.createOutputChannel('GitHub Repository Manager');
