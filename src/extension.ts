// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as functions from './functions';
import { gemini } from './agent';

// vscode.workspace.onDidChangeConfiguration((event) => {
// 	if (event.affectsConfiguration("myExtension.enableFeature")) {
// 		const config = vscode.workspace.getConfiguration("myExtension");
// 		const enableFeature = config.get<boolean>("enableFeature");
// 		console.log("Feature enabled changed to:", enableFeature);
// 	}
// });


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "tsmc-career-hack-fcu2ncu-extension" is now active!');

	const commandList = [
		{ command: 'tsmc-career-hack-fcu2ncu-extension.explorer.convertTo', callback: functions.explorer.convertTo },
		{ command: 'tsmc-career-hack-fcu2ncu-extension.explorer.optimize', callback: functions.explorer.optimize },
		{ command: 'tsmc-career-hack-fcu2ncu-extension.explorer.detectError', callback: functions.explorer.detectError },
		{ command: 'tsmc-career-hack-fcu2ncu-extension.editor.convertTo', callback: functions.editor.convertTo },
		{ command: 'tsmc-career-hack-fcu2ncu-extension.editor.optimize', callback: functions.editor.optimize },
		{ command: 'tsmc-career-hack-fcu2ncu-extension.editor.detectError', callback: functions.editor.detectError },
		{ command: 'tsmc-career-hack-fcu2ncu-extension.gemini', callback: ()=>gemini("hello")}
	]

	for (const { command, callback } of commandList) {
		const disposable = vscode.commands.registerCommand(command, callback);
		context.subscriptions.push(disposable);
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }
