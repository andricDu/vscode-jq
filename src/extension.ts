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