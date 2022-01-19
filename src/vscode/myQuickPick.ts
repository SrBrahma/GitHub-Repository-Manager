import vscode from 'vscode';



type SelectedItem = {label: string; detail: string | undefined; description: string | undefined};


/** vscode.window.showQuickPick() is fast but weak. createQuickPick is good, but too complex to be used quickly.
 *
 * Here we merge the two good good points of each one! */
export async function myQuickPick(options: {
  items: vscode.QuickPickItem[];
  title?: string;
  ignoreFocusOut?: boolean;
}): Promise<SelectedItem | undefined> {

  const quickPick = vscode.window.createQuickPick();

  if (options.title) quickPick.title = options.title;
  if (options.ignoreFocusOut) quickPick.ignoreFocusOut = options.ignoreFocusOut;

  quickPick.items = options.items;

  quickPick.show();

  const selection = await new Promise<SelectedItem | undefined>((resolve) => {
    quickPick.onDidHide(() => {resolve(undefined);});
    quickPick.onDidChangeSelection((e) => {
      const innerSelection = e[0];
      if (!innerSelection)
        return resolve(undefined); // won't happen but just type checking
      resolve({
        label: innerSelection.label,
        description: innerSelection.description,
        detail: innerSelection.detail,
      });
    });
  });
  quickPick.dispose();

  return selection;
}