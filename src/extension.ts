// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as php from './php';

const walkSync = require('walk-sync');
const { Worker } = require('worker_threads');

import FileParserWorkerData from './worker/FileParserWorkerData';
import FileParserWorkerResult, { NewFileParserWorkerResult } from './worker/FileParserWorkerResult';
import scanWorkspaces from './commands/scanWorkspaces';
import addImport from './commands/addImport';

// Extension-global variables
let nsBasePaths: {
	[key: string]: { [key: string]: string },
} = {};

let cache = NewFileParserWorkerResult();

export function activate(context: vscode.ExtensionContext) {
	console.log('Activating PHP: UI');
	scanWorkspaces(vscode.workspace.workspaceFolders ?? []).then(result => cache = result);

	const subscriptions: vscode.Disposable[] = [];

	subscriptions.push(vscode.commands.registerCommand('php-intellisense-use.scan', async () => {
		cache = await scanWorkspaces(vscode.workspace.workspaceFolders ?? []);
	}));

	// IntelliSense
	subscriptions.push(vscode.languages.registerCompletionItemProvider({
		scheme: 'file',
		language: 'php',
	}, {
		provideCompletionItems(doc, pos, token, ctx) {
			// const lines = doc.getText().split('\n');
			const line = doc.lineAt(pos.line);
			const beforePos = line.text.substr(0, pos.character);
			let canBeMethod = false;
			let canBeClass = true;

			if (/(::|->)(\w+)?$/.test(beforePos) && !/\sas\s(\w+)/.test(beforePos)) {
				canBeMethod = true;
				canBeClass = false;
			}

			const result: vscode.CompletionItem[] = [];
			const lastWord = beforePos.split(/[():,;\s)]+/).pop() || '';
			if (canBeClass) {
				cache.classes.filter(cls => cls.fqcn.indexOf(lastWord) >= 0).forEach(cls => {
					const namespace = cls.fqcn.split('\\');
					const className = namespace.pop() || '';

					const item = new vscode.CompletionItem(className, vscode.CompletionItemKind.Class);
					item.detail = namespace.join('\\');
					item.documentation = cls.documentation;
					item.insertText = cls.fqcn;

					item.command = {
						title: 'Add import',
						command: 'php-intellisense-use.add_import',
						arguments: [cls.fqcn],
					};

					result.push(item);
				});
			}

			// NOTE: WIP (TODO: filter classes by obj type)
			// if (canBeMethod) {
			// 	cache.classes.forEach(cls => {
			// 		cls.methods.filter(m => !(m.isConstructor || m.isDestructor || m.isPrivate || m.isProtected)).forEach(method => {
			// 			const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
			// 			item.documentation = method.documentation;

			// 			result.push(item);
			// 		});
			// 	});
			// }

			return result;
		}
	}));

	subscriptions.push(vscode.commands.registerCommand('php-intellisense-use.add_import', (fqcn) => {
		addImport(fqcn, vscode.window.activeTextEditor);
	}));

}

export function deactivate() {
	nsBasePaths = {};
}
