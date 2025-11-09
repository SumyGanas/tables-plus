import { Plugin, MarkdownView, App, Notice, PluginSettingTab, Setting  } from 'obsidian';
import { TypesModal } from '@/src/ui/modal/modal';
import { TypeEffectsField } from '@/src/state-effects/TypeEffects';
import { markdown } from "@codemirror/lang-markdown";
import { tableViewPlugin } from '@/src/ui/view-plugins/tableView';
import { findIndex } from '@/src/plugin-logic/tableLogic';
import { currencyField } from './ui/view-plugins/currencyState';
import { tableConfigStateField } from './state-effects/enumEffects';
import { getTableId } from './plugin-logic/modalConfigSettings';
import { placeholderViewPlugin, placeholders } from './ui/view-plugins/enumButtons';
import { createPlaceholderPostProcessor } from './ui/view-plugins/enumButtons';

interface PluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	mySetting: 'default'
}

export default class TablesPlusPlugin extends Plugin {
    settings: PluginSettings;
    async onload() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    this.registerEditorExtension([tableViewPlugin, TypeEffectsField, currencyField, tableConfigStateField, placeholderViewPlugin, placeholders]);
    this.registerEditorExtension(markdown());
    this.registerMarkdownPostProcessor(
        createPlaceholderPostProcessor(this.app)
      );
    // this.registerMarkdownCodeBlockProcessor(
    //     'table-config', // The name of your code block
    //     (source, el, ctx) => {
    //       console.log("code-block registered")
    //       ctx.addChild(
    //         new TableConfigRenderer(el, source, ctx, this)
    //       );
    //     }
    //   );
    
    console.log('loading plugin')
    
    let selectedElement: HTMLElement | null | undefined
    
    
    
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
                                
                            
                            } else {
                                console.log("Error - No baby div found")
                            }
                        }
                    } else{
                        new Notice("Please select a table header cell!",700)
                    }
                    
                });

                // this.addCommand({
                //     id:"aaaaaaaaa",
                //     name:"aaaaaaaaaa",
                //     editorCallback(editor, view) {
                //         // @ts-ignore, not typed
		        //         const editorView = view.editor.cm as EditorView;
                //         if (!editorView) return;
                //         const selection = editorView.state.selection.main;
                //         if (selection.empty) {
                //         // Optional: handle no selection (e.g., insert at cursor)
                //         // For this example, we'll just return
                //         console.log("No selection, command aborted.");
                //         return;
                //         }
                //         editorView.dispatch({
                //             effects: [
                //               addObsidianWidgetEffect.of({
                //                 from: selection.from,
                //                 to: selection.to,
                //               }),
                //             ],
                //           });
                //     }
                // })
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

