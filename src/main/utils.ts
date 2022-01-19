import vscode from 'vscode';
import { extensionIdentifier } from './consts';


/** Will prefix it with `${extensionIdentifier}.` */
export async function myExtensionSetContext(context: string, value: any): Promise<void> {
  await vscode.commands.executeCommand('setContext', `${extensionIdentifier}.${context}`, value);
}