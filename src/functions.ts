import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { gemini } from './agent';

const helloWorld = () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from tsmc-career-hack-fcu2ncu-extension!');
}

const selectFile = async (uri: vscode.Uri) => {
    if (!uri) {
        vscode.window.showErrorMessage("No file selected.");
        return;
    }

    try {
        // 讀取檔案內容
        const fileData = await vscode.workspace.fs.readFile(uri);
        const content = Buffer.from(fileData).toString("utf8");

        // 在新的編輯器視窗顯示內容
        const document = await vscode.workspace.openTextDocument({ content });
        await vscode.window.showTextDocument(document);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to read file: ${error}`);
    }
};

const selectContext = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        //取得選取內容
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (selectedText) {
            vscode.window.showInformationMessage(`Selected Code: ${selectedText}`);
        } else {
            vscode.window.showWarningMessage("No text selected.");
        }

        // ✅ 複製選取的程式碼（放入剪貼簿）：
        // vscode.env.clipboard.writeText(selectedText);
        // vscode.window.showInformationMessage("Copied to clipboard!");
        // ✅ 將選取的程式碼寫入檔案：
        // import * as fs from "fs";
        // fs.writeFileSync("selectedCode.txt", selectedText);
        // ✅ 在新的視窗開啟選取的程式碼：
        // vscode.workspace.openTextDocument({ content: selectedText }).then(doc => {
        // vscode.window.showTextDocument(doc);
        // });
    }
};



const optimizeExplorer = async (uri: vscode.Uri) => {
    if (!uri) {
        vscode.window.showErrorMessage("No file selected.");
        return;
    }

    try {
        // 讀取檔案內容
        const fileData = await vscode.workspace.fs.readFile(uri);
        const content = Buffer.from(fileData).toString("utf8");
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor || activeEditor.document.uri.fsPath !== uri.fsPath) {
            // 若不同，則開啟選取的檔案
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document, { preview: false });
        }
        const languageId = activeEditor?.document.languageId || 'plaintext';

    	// 假設這裡是你獲取修正後程式碼的 API
    	const fixedCode = await getOptimizeCode(content);

    	if (!fixedCode) {
    		vscode.window.showErrorMessage('Failed to get fixed code.');
    		return;
    	}
 
       
        const tempDocument = await vscode.workspace.openTextDocument({ 
            language: languageId, // 你可以根據檔案類型修改，例如 'javascript', 'python'
            content: fixedCode 
        });
        
        const tempUri = tempDocument.uri;
        
        // 顯示 Diff 視圖
        await vscode.commands.executeCommand('vscode.diff', uri, tempUri, 'Code Fix Suggestion', {
            viewColumn: vscode.ViewColumn.Beside, // 在右側開啟 Diff
            preserveFocus: true
        });
        
        // const defaultTempDocumentPath = path.join(path.dirname(uri.fsPath) || '', `${path.basename(uri.fsPath).split('.')[0]}_temp_optimize${path.extname(uri.fsPath)}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to read file: ${error}`);
    }
};
const optimizeEditor = async () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showErrorMessage("No editor active.");
        return;
    }
    const selection = activeEditor.selection;
    const selectedText = activeEditor.document.getText(selection);
    if (!selectedText) {
        vscode.window.showWarningMessage("No text selected.");
        return;
    }
    
    try{
        const languageId = activeEditor?.document.languageId || 'plaintext';

    	// 假設這裡是你獲取修正後程式碼的 API
    	const fixedCode = await getOptimizeCode(selectedText);

    	if (!fixedCode) {
    		vscode.window.showErrorMessage('Failed to get fixed code.');
    		return;
    	}
 
       
        const tempDocument = await vscode.workspace.openTextDocument({ 
            language: languageId, // 你可以根據檔案類型修改，例如 'javascript', 'python'
            content: fixedCode 
        });
        
        const tempUri = tempDocument.uri;
        
        // 顯示 Diff 視圖
        await vscode.commands.executeCommand('vscode.diff', activeEditor.document.uri, tempUri, 'Code Fix Suggestion', {
            viewColumn: vscode.ViewColumn.Beside, // 在右側開啟 Diff
            preserveFocus: true
        });
        
        // const defaultTempDocumentPath = path.join(path.dirname(uri.fsPath) || '', `${path.basename(uri.fsPath).split('.')[0]}_temp_optimize${path.extname(uri.fsPath)}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to read file: ${error}`);
    }
};


const convertToExplorer = async (uri: vscode.Uri) => {
    if (!uri) {
        vscode.window.showErrorMessage("No file selected.");
        return;
    }
    vscode.window.showInformationMessage(`Convert file: ${uri.fsPath}`);
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || activeEditor.document.uri.fsPath !== uri.fsPath) {
        // 若不同，則開啟選取的檔案
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document, { preview: false });
    }

    // 讀取 workspace 設定
    interface Enviroment {
        title: string
        language: string
    };
    const config = vscode.workspace.getConfiguration("tsmc-career-hack-fcu2ncu-extension");
    const convertEnvironments: Enviroment[] = config.get<Array<Enviroment>>("convertEnvironments") ?? [];

    // 如果沒有可選的轉換環境，顯示提示
    if (convertEnvironments.length === 0) {
        vscode.window.showInformationMessage("No conversion environments found in settings.");
        return;
    }
    
    // 建立 QuickPick 選單
    const pickItems = convertEnvironments.map((env, index) => ({
        label: env.title,
        description: env.language,
        index: index,
        env: env
    }));

    const selected = await vscode.window.showQuickPick(pickItems, {
        placeHolder: 'Select a conversion environment'
    });
    const env = selected?.env;

    if (selected && env) {
        try {
            // 讀取檔案內容
            const fileData = await vscode.workspace.fs.readFile(uri);
            const content = Buffer.from(fileData).toString("utf8");

            // 假設這裡是你獲取修正後程式碼的 API
            const fixedCode = await getConvertCode(content, env);
    
            if (!fixedCode) {
                vscode.window.showErrorMessage('Failed to get fixed code.');
                return;
            }
     
            const tempDocument = await vscode.workspace.openTextDocument({ 
                language: env.language, // 你可以根據檔案類型修改，例如 'javascript', 'python'
                content: fixedCode 
            });
            
            // 顯示 Diff 視圖
            await vscode.window.showTextDocument(tempDocument, { preview: false, viewColumn: vscode.ViewColumn.Beside });

            
            // const defaultTempDocumentPath = path.join(path.dirname(uri.fsPath) || '', `${path.basename(uri.fsPath).split('.')[0]}_temp_optimize${path.extname(uri.fsPath)}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to read file: ${error}`);
        }

        vscode.window.showInformationMessage(`You selected: ${selected.label} (${selected.description})`);
    }
};

const convertToEditor = async () => {
    const activateEditor = vscode.window.activeTextEditor;
    if (!activateEditor) {
        vscode.window.showErrorMessage("No editor active.");
        return;
    }
    const selection = activateEditor.selection;
    const selectedText = activateEditor.document.getText(selection);
    if (!selectedText) {
        vscode.window.showWarningMessage("No text selected.");
        return;
    }

    vscode.window.showInformationMessage(`Selected Code: ${selectedText}`);

    // 讀取 workspace 設定
    interface Enviroment {
        title: string
        language: string
    };
    const config = vscode.workspace.getConfiguration("tsmc-career-hack-fcu2ncu-extension");
    const convertEnvironments: Enviroment[] = config.get<Array<Enviroment>>("convertEnvironments") ?? [];

    // 如果沒有可選的轉換環境，顯示提示
    if (convertEnvironments.length === 0) {
        vscode.window.showInformationMessage("No conversion environments found in settings.");
        return;
    }

    // 建立 QuickPick 選單
    const pickItems = convertEnvironments.map((env, index) => ({
        label: env.title,
        description: env.language,
        index: index,
        env: env
    }));

    const selected = await vscode.window.showQuickPick(pickItems, {
        placeHolder: 'Select a conversion environment'
    });
    const env = selected?.env;

    if (selected && env) {
        try {
            // 假設這裡是你獲取修正後程式碼的 API
            const fixedCode = await getConvertCode(selectedText, env);
    
            if (!fixedCode) {
                vscode.window.showErrorMessage('Failed to get fixed code.');
                return;
            }
     
            const tempDocument = await vscode.workspace.openTextDocument({ 
                language: env.language, // 你可以根據檔案類型修改，例如 'javascript', 'python'
                content: fixedCode 
            });
            
            // 顯示 Diff 視圖
            await vscode.window.showTextDocument(tempDocument, { preview: false, viewColumn: vscode.ViewColumn.Beside });

            
            // const defaultTempDocumentPath = path.join(path.dirname(uri.fsPath) || '', `${path.basename(uri.fsPath).split('.')[0]}_temp_optimize${path.extname(uri.fsPath)}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to read file: ${error}`);
        }

        vscode.window.showInformationMessage(`You selected: ${selected.label} (${selected.description})`);
    }
};



const detectErrorExplorer = async (uri: vscode.Uri) => {
    if (!uri) {
        vscode.window.showErrorMessage("No file selected.");
        return;
    }
    try {
        // 讀取檔案內容
        const fileData = await vscode.workspace.fs.readFile(uri);
        const content = Buffer.from(fileData).toString("utf8");
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor || activeEditor.document.uri.fsPath !== uri.fsPath) {
            // 若不同，則開啟選取的檔案
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document, { preview: false });
        }
        const languageId = activeEditor?.document.languageId || 'plaintext';

    	// 假設這裡是你獲取修正後程式碼的 API
    	const fixedCode = await getFixCode(content);

    	if (!fixedCode) {
    		vscode.window.showErrorMessage('Failed to get fixed code.');
    		return;
    	}
 
       
        const tempDocument = await vscode.workspace.openTextDocument({ 
            language: languageId, // 你可以根據檔案類型修改，例如 'javascript', 'python'
            content: fixedCode 
        });
        
        const tempUri = tempDocument.uri;
        
        // 顯示 Diff 視圖
        await vscode.commands.executeCommand('vscode.diff', uri, tempUri, 'Code Fix Suggestion', {
            viewColumn: vscode.ViewColumn.Beside, // 在右側開啟 Diff
            preserveFocus: true
        });
        
        // const defaultTempDocumentPath = path.join(path.dirname(uri.fsPath) || '', `${path.basename(uri.fsPath).split('.')[0]}_temp_optimize${path.extname(uri.fsPath)}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to read file: ${error}`);
    }

}

const detectErrorEditor = async () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showErrorMessage("No editor active.");
        return;
    }
    const selection = activeEditor.selection;
    const selectedText = activeEditor.document.getText(selection);
    if (!selectedText) {
        vscode.window.showWarningMessage("No text selected.");
        return;
    }
    
    try{
        const languageId = activeEditor?.document.languageId || 'plaintext';

    	// 假設這裡是你獲取修正後程式碼的 API
    	const fixedCode = await getFixCode(selectedText);

    	if (!fixedCode) {
    		vscode.window.showErrorMessage('Failed to get fixed code.');
    		return;
    	}
 
       
        const tempDocument = await vscode.workspace.openTextDocument({ 
            language: languageId, // 你可以根據檔案類型修改，例如 'javascript', 'python'
            content: fixedCode 
        });
        
        const tempUri = tempDocument.uri;
        
        // 顯示 Diff 視圖
        await vscode.commands.executeCommand('vscode.diff', activeEditor.document.uri, tempUri, 'Code Fix Suggestion', {
            viewColumn: vscode.ViewColumn.Beside, // 在右側開啟 Diff
            preserveFocus: true
        });
        
        // const defaultTempDocumentPath = path.join(path.dirname(uri.fsPath) || '', `${path.basename(uri.fsPath).split('.')[0]}_temp_optimize${path.extname(uri.fsPath)}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to read file: ${error}`);
    }
}

//call llm following 3 function.
const getOptimizeCode = async(originalCode: string) => {
    const prompt = `請幫我在不修改程式邏輯與輸出的前提下優化以下這段程式碼: ${originalCode}，並且只需要輸出優化後的結果，不需要解釋。`
    const result = await gemini(prompt);
    return await  result || originalCode;
}
const getConvertCode = async(originalCode: string, env: any) =>{
    const prompt = `請幫我在不修改程式邏輯與輸出的前提下將以下這段程式碼: ${originalCode}，根據環境設定:${env} 轉換對應的程式語言或版本(例如python to java 、 java9 to java11等)並且只需要輸出轉換後的結果，不需要解釋。`
    const result = await gemini(prompt);
    return await  result || originalCode;
}
const getFixCode = async(originalCode: string) => {
    const prompt = `請幫我在不修改程式邏輯與輸出的前提下將以下這段程式碼: ${originalCode} 的錯誤修正，並且只需要輸出轉換後的結果，不需要解釋。`
    const result = await gemini(prompt);
    return await  result || originalCode;
}


export const explorer = {
    optimize: optimizeExplorer,
    convertTo: convertToExplorer,
    detectError: detectErrorExplorer
}
export const editor = {
    optimize: optimizeEditor,
    convertTo: convertToEditor,
    detectError: detectErrorEditor
}