import { Plugin, MarkdownView, App, Notice, PluginSettingTab, Setting  } from 'obsidian';
import { TypesModal } from '@/src/ui/modal/modal';
import { TypeEffectsField } from '@/src/state-effects/TypeEffects';
import { markdown } from "@codemirror/lang-markdown";
import { tableViewPlugin } from '@/src/ui/view-plugins/tableView';
import { findIndex } from '@/src/plugin-logic/tableLogic';
import { currencyField } from './ui/view-plugins/currencyState';

interface PluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	mySetting: 'default'
}

export default class TablesPlusPlugin extends Plugin {
    settings: PluginSettings;
    async onload() {
    this.registerEditorExtension([tableViewPlugin, TypeEffectsField, currencyField]);
    this.registerEditorExtension(markdown());
    
    console.log('loading plugin')
    let selectedType: string 
    let selectedElement: HTMLElement | null | undefined
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    
    
    // Make sure the user is editing a Markdown file.
    if (view) {
        this.addRibbonIcon('dice', 'Tables Plus', (evt: MouseEvent) => { 
                    
                    if (view.editor.somethingSelected()) {

                        const selection = document.getSelection()
                        if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const selectionContainer = range.commonAncestorContainer;
                            const babyDiv = selectionContainer.nodeType === Node.TEXT_NODE ? selectionContainer.parentElement : selectionContainer as HTMLElement;
                            if(babyDiv) {
                                selectedElement = babyDiv.closest('th')
                                new TypesModal(this.app,view,(type)=>{
                                new Notice(`Selected: ${type}`)
                                selectedType = type
                                const headerRow = selectedElement?.closest("tr")
                                selectedElement?.setAttribute("modified-header", `${type}`);
                                const cellIndex = findIndex(headerRow)
                                selectedElement?.setAttribute("cell-index", `${cellIndex}`);
                            }).open()
                            } else {
                                console.log("Error - No baby div found")
                            }
                        }
                    } else{
                        new Notice("Please select a table header cell!",700)
                    }
                    
                });
    }
    //...
    // This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			//console.log(evt.targetNode?.parentElement);
            // const name = evt.targetNode?.parentElement?.tagName
            // if (name === "TH"){

            // }
		
        // });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));


}
    
    
    async onunload() {
    console.log('unloading plugin')
    }

    async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

//Settings for the plugin
class SampleSettingTab extends PluginSettingTab {
	plugin: TablesPlusPlugin;

	constructor(app: App, plugin: TablesPlusPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('Setting description')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}