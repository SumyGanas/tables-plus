import { Plugin, MarkdownView, App, Notice, PluginSettingTab  } from 'obsidian';
import { TypesModal } from '@/src/ui/modal/modal';
import { TypeEffectsField } from '@/src/state-effects/TypeEffects';
import { markdown } from "@codemirror/lang-markdown";
import { tableViewPlugin } from '@/src/ui/view-plugins/tableView';
import { findIndex } from '@/src/plugin-logic/tableLogic';
import { currencyField } from './ui/view-plugins/currencyState';
import { tableConfigStateField } from './state-effects/enumEffects';
import { getTableId } from './plugin-logic/modalConfigSettings';
import {  placeholders } from './ui/view-plugins/enumButtons';
import { createPlaceholderPostProcessor } from './ui/view-plugins/enumButtons';
import { TablesPlusSettingTab } from './settings';

interface PluginSettings {
	mySetting: string;
    hideBlocks: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
	mySetting: 'default',
    hideBlocks: false,
}

export default class TablesPlusPlugin extends Plugin {
    settings: PluginSettings;
    styleEl: HTMLElement;
    async onload() {
    await this.loadSettings()

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    this.registerEditorExtension([tableViewPlugin, TypeEffectsField, currencyField, tableConfigStateField, placeholders]);
    this.registerEditorExtension(markdown());
    this.registerMarkdownPostProcessor(
        createPlaceholderPostProcessor(this.app)
      );
    
    let selectedElement: HTMLElement | null | undefined

    this.styleEl = document.head.createEl("style", {
        attr: { id: "tables-plus-styles" },
      });
    
    if (view) {
        this.addRibbonIcon('dice', 'Tables Plus', (evt: MouseEvent) => { 
                    if (view.editor.somethingSelected()) {
                        const selection = document.getSelection()
                        if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const selectionContainer = range.commonAncestorContainer;
                            const babyDiv = selectionContainer.nodeType === Node.TEXT_NODE ? selectionContainer.parentElement : selectionContainer as HTMLElement;
                            if(babyDiv) {
                                let tableID: string = ""
                                selectedElement = babyDiv.closest('th')
                                const selectedtext = selection.toString()
                                const TableID = getTableId(view.editor)
                                const table = babyDiv.closest("table")
                                
                                TableID.then((c)=>{
                                    tableID = c
                                    if (table) table.id = c
                                    if (tableID.length > 0){
                                        new TypesModal(this.app,view,tableID,selectedtext,(type)=>{
                                        new Notice(`Selected: ${type}`)
                                        selectedElement?.setAttribute("modified-header", `${type}`);
                                        const headerRow = selectedElement?.closest("tr")
                                        const cellIndex = findIndex(headerRow)
                                        selectedElement?.setAttribute("cell-index", `${cellIndex}`);
                                        }).open()
                                    } 
                                })

                            }
                        }
                    } else{
                        new Notice("Please select a table header cell!",700)
                    }
                    
                });

    }

		this.addSettingTab(new TablesPlusSettingTab(this.app, this));

		this.registerInterval(window.setInterval(() => 5 * 60 * 1000));

    }

    async onunload() {
    }

    async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}



