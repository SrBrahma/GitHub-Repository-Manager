import os from 'os';
import vscode from 'vscode';
import { extensionIdentifier } from './consts';

/** Will prefix it with `${extensionIdentifier}.` */
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
