/**
 * author: Dusan Andric
 */
'use strict';

import * as vscode from 'vscode';
import { run } from 'node-jq';
import { join } from 'path';

const OUTPUT_NAME = 'jq output';

export function activate(context: vscode.ExtensionContext) {

    let jq = new JqDialogue();
    let disposable = vscode.commands.registerCommand('extension.jq', () => {
        jq.newDialogue();
    });

    context.subscriptions.push(disposable);
}

class JqDialogue {

    public newDialogue() {

        var params = {
            prompt: "Enter a jq statement."
        }

        vscode.window.showInputBox(params).then(statement => {
            if (statement) {
                var json = vscode.window.activeTextEditor.document.getText();
                
                var jsonObj;
                try {
                    jsonObj = JSON.parse(json);
                    this.executeStatement(statement, jsonObj);
                } catch (e) {
                    this.showError(e.message)
                }

            }
        });

    }

    private executeStatement(statement: string, jsonObj: any) {
        run(statement, jsonObj, { input: 'json', output: 'pretty'}).then( output => {
            console.log(output);
            let jqOutput = vscode.window.createOutputChannel(OUTPUT_NAME);
            jqOutput.append(output);
            jqOutput.show();
        }).catch(reason => {
            this.showError(reason.message);
        });
    }

    private showError(message: string) {
        let errorOutput = vscode.window.createOutputChannel(OUTPUT_NAME);
        errorOutput.append(message);
        errorOutput.show();
    }

}

export function deactivate() {
}