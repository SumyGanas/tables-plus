import { Plugin, MarkdownView, Notice } from 'obsidian';
import { TypesModal } from '@/src/ui/modal/modal';
import { TypeEffectsField } from '@/src/state-effects/TypeEffects';
import { markdown } from "@codemirror/lang-markdown";
import { tableViewPlugin } from '@/src/ui/view-plugins/tableView';
import { findIndex } from '@/src/plugin-logic/tableLogic';
import { currencyField } from './ui/view-plugins/currencyState';
import { tableConfigStateField } from './state-effects/enumEffects';
import { Table } from './plugin-logic/modalConfigSettings';
//import {  placeholders, createPlaceholderPostProcessor } from './ui/view-plugins/enumButtons';


export default class TablesPlusPlugin extends Plugin {
    async onload() {
    await this.loadSettings()

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    this.registerEditorExtension([tableViewPlugin, TypeEffectsField, currencyField, tableConfigStateField]);
    this.registerEditorExtension(markdown());
    // this.registerMarkdownPostProcessor(
    //     createPlaceholderPostProcessor(this.app)
    //   );
    
    let selectedElement: HTMLElement | null | undefined
    
    if (view) {
        this.addRibbonIcon('sheet', 'Tables plus', () => { 
                    if (view.editor.somethingSelected()) {
                        const selection = document.getSelection()
                        if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const selectionContainer = range.commonAncestorContainer;
                            const babyDiv = selectionContainer.nodeType === Node.TEXT_NODE ? selectionContainer.parentElement : selectionContainer as HTMLElement;
                            if(babyDiv) {
                                selectedElement = babyDiv.closest('th')
                                const selectedtext = selection.toString()
                                //const TableID = getTableId(view.editor)
                                const table = babyDiv.closest("table")
                                if (table){
                                    const tableObj = new Table(view.editor)
                                    const config = tableObj.getTableConf()
                                    if (config === null || config === undefined || config.tableId === null || config.tableId === undefined){
                                        tableObj.newConfigBlock(view.editor.getCursor().line)
                                    }                                    
                                    new TypesModal(this.app,view,tableObj,selectedtext,(type)=>{
                                        new Notice(`Selected: ${type}`)
                                        selectedElement?.setAttribute("modified-header", `${type}`);
                                        const headerRow = selectedElement?.closest("tr")
                                        const cellIndex = findIndex(headerRow)
                                        selectedElement?.setAttribute("cell-index", `${cellIndex}`);
                                        }).open()
                                }
                            }
                        }
                    } else{
                        new Notice("Please select a table header cell!",700)
                    }
                    
                });

    }

		//this.addSettingTab(new TablesPlusSettingTab(this.app, this));

		this.registerInterval(window.setInterval(() => 5 * 60 * 1000));

    }

    async onunload() {
        //unload function for future instance creation by a setting
    }

    async loadSettings() {
		//this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		//await this.saveData(this.settings);
	}
}



