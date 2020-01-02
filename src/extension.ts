/*
 * Copyright (c) 2017 Dusan Andric. All rights reserved.
 *
 * This program and the accompanying materials are made available under the terms of the GNU Public License v3.0.
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as download from 'download';
import * as path from 'path';
import * as child_process from 'child_process';

const OUTPUT_NAME = 'jq output';
const BINARIES = {
    'windows': 'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-win64.exe',
    'mac': 'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-osx-amd64',
    'linux': 'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64'
};
const BIN_DIR = path.join(__dirname, '..', 'bin')
const FILEPATH = path.join(BIN_DIR, /^win/.test(process.platform) ? './jq.exe' : './jq');


export function activate(context: vscode.ExtensionContext) {

    let jq = new JqDialogue();
    let disposable = vscode.commands.registerCommand('extension.jq', () => {
        jq.entryPoint(false);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('extension.jql', () => {
        jq.entryPoint(true);
    });
    context.subscriptions.push(disposable);
}

class JqDialogue {

    public entryPoint(currentLineOnly: boolean) {
        ensureBinary().then(() => {
            this.newDialogue(currentLineOnly);
        });
    }

    public newDialogue(currentLineOnly: boolean) {

        var params = {
            prompt: "Enter a jq statement."
        }

        vscode.window.showInputBox(params).then(statement => {
            if (statement) {
                const json = this.getJson(currentLineOnly);
                if (!json) {
                    this.showError('Large file detected. Unable to process.');
                    return;
                }

                try {
                    const jsonObj = JSON.parse(json);
                    this.executeStatement(statement, jsonObj);
                } catch (e) {
                    this.showError(e.message)
                }
            }
        });

    }

    /** Returns the JSON text from the current document. */
    private getJson(currentLineOnly: boolean): string {
        const editor = vscode.window.activeTextEditor;

        // Check to see if the current document has been hidden from the extension host (large
        // files).
        if (!editor) {
            return undefined;
        }

        if (currentLineOnly) {
            return editor.document.lineAt(editor.selection.active.line).text;
        }

        if (editor.selection.isEmpty) {
            return editor.document.getText();
        }

        return editor.document.getText(editor.selection);
    }

    private executeStatement(statement: string, jsonObj: any) {
        let jq = child_process.spawn(FILEPATH, [statement]);
        jq.stdin.write(JSON.stringify(jsonObj));
        jq.stdin.end();
        let jqOutput = vscode.window.createOutputChannel(OUTPUT_NAME);
        jq.stdout.on('data', data => {
            jqOutput.append(data.toString());
        });
        jqOutput.show();
        jq.stderr.on('data', error => {
            this.showError(error.toString());
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

function ensureBinary() {
    if (!fs.existsSync(BIN_DIR)) {
        fs.mkdirSync(BIN_DIR);
    }

    if (!fs.existsSync(FILEPATH)) {
        let uri;
        if (/^win/.test(process.platform)) {
            uri = BINARIES.windows;
        } else if (/^darwin/.test(process.platform)) {
            uri = BINARIES.mac;
        } else {
            uri = BINARIES.linux;
        }

        return download(uri).then(data => {
            fs.writeFileSync(FILEPATH, data);
            if (!/^win/.test(process.platform)) {
                fs.chmodSync(FILEPATH, '0777');
            }
        });
    }
    console.log('Already exists!');
    return Promise.resolve();
}
