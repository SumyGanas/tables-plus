import { App, Modal, DropdownComponent, TextComponent, ButtonComponent, Setting, MarkdownView, Notice, Editor} from 'obsidian'
import { currencies, currencyTypes } from '../view-plugins/currencyState';
import { Badges } from './EnumBadge';
import { Root, createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { Table } from '@/src/plugin-logic/modalConfigSettings';
import { upsertTableConfigEffect, TableConfigPayload } from '@/src/state-effects/enumEffects';
import { EnumClearConfirmationModal } from './confirmationModal';
import TablesPlusPlugin from '@/src/main';


const ALL_TYPES: Record<string, string> = {
"None":"None",
"Index": "Index",
"Enum": "Enum",
"Money": "Money",
};


export class TypesModal extends Modal {
    root: Root | null = null;
    plugin: TablesPlusPlugin;
    
    constructor(app: App, view: MarkdownView | null, table: Table, selection: string, onSelect:(result: string) => void, plugin: TablesPlusPlugin) {
        super(app);
        this.plugin = plugin;
        const editor = view?.editor
        const line = editor?.getCursor().line
        this.contentEl.addClass("tp-modal-content")
        const typeSetting = new Setting(this.contentEl).setName('Tables plus').setDesc('Please select a type for your table column.').addDropdown(dropdown=> {
            dropdown.addOptions(ALL_TYPES).onChange((val)=>{
                if (val === "Enum") {
                    this.handleEnumSelection(table, selection, onSelect, view, line, typeSetting, editor);
                } else if(val === "Money") {
                    this.setTitle("Please select a currency (or add your own).")
                    const currencySet = new Set();
                    currencySet.add(currencies)
                    typeSetting.settingEl.remove()
                        const currencyDropdown = new DropdownComponent(this.contentEl).addOptions(currencyTypes)
                        currencyDropdown.selectEl.addClass("tp-modal-dropdown-currency")
                        currencyDropdown.onChange((currencyVal)=> {
                        if (currencyVal == "Add your own") {
                            currencyDropdown.selectEl.disabled = true
                            const stylesToApply = {
                                color: 'lightgrey', 
                                borderColor: 'rgba(118, 118, 118, 0.3);',
                                opacity: '0.7',
                                cursor: 'not-allowed'
                            }
                            currencyDropdown.selectEl.setCssStyles(stylesToApply)
                            this.setTitle("Please enter a currency symbol.")
                            const textbox = new TextComponent(this.contentEl).setPlaceholder("E.g., $.")
                            const currencySymbol = textbox.inputEl
                            currencySymbol.addClass("tp-modal-input")
                            currencySet.add(currencySymbol)
                            const btn  = new ButtonComponent(this.contentEl).setButtonText("Use currency").setClass("tp-modal-button-currency")
                            btn.onClick(()=>{
                                if (!btn.disabled){
                                currencyTypes[currencySymbol.value] = currencySymbol.value
                                table.removeColumnConfig(selection).then(() => {
                                    onSelect("Money-"+currencySymbol.value)
                                    this.close()
                                })
                                }
                                
                            })
                            currencySymbol.addEventListener("keyup",()=>{
                                    if (currencySymbol.value.length === 1) {
                                        btn.setCta()
                                        btn.setTooltip("")
                                        btn.setDisabled(false)
                                } else {
                                    btn.setDisabled(true)
                                    btn.setTooltip("Please enter a single character!")
                                    btn.removeCta()
                                }
                            })
                            
                        } else{
                            table.removeColumnConfig(selection).then(() => {
                                onSelect("Money-"+currencyVal)
                                this.close()
                            })
                        }
                    })
                } else {
                    table.removeColumnConfig(selection).then(() => {
                        onSelect(val)
                        this.close()
                    })
                }
                
        });
    });

    typeSetting.setClass("tp-modal-config-setting")
    }

    private async handleEnumSelection(
        table: Table, 
        selection: string, 
        onSelect: (result: string) => void,
        view: MarkdownView | null,
        line: number | undefined,
        typeSetting: Setting,
        editor: Editor | undefined
    ) {
        const existingEnums = await table.getTableEnumOptions(selection);
        const hasExistingEnumConfig = existingEnums && existingEnums.length > 0;
        
        if (hasExistingEnumConfig) {
            this.proceedWithEnum(table, selection, onSelect, view, line, typeSetting, editor);
            return;
        }

        if (this.plugin.skipEnumClearConfirmationThisSession) {
            const cellIndex = table.findColumnIndexByHeader(selection);
            if (cellIndex >= 0) {
                table.clearColumnCells(cellIndex);
            }
            this.proceedWithEnum(table, selection, onSelect, view, line, typeSetting, editor);
            return;
        }

        const cellIndex = table.findColumnIndexByHeader(selection);
        const dataCount = table.countColumnData(cellIndex);
        
        if (dataCount === 0) {
            this.proceedWithEnum(table, selection, onSelect, view, line, typeSetting, editor);
        } else {
            const confirmModal = new EnumClearConfirmationModal(
                this.app,
                selection,
                dataCount,
                (skipFuture) => {
                    if (skipFuture) {
                        this.plugin.skipEnumClearConfirmationThisSession = true;
                    }
                    table.clearColumnCells(cellIndex);
                    this.proceedWithEnum(table, selection, onSelect, view, line, typeSetting, editor);
                },
                () => {
                    this.close();
                }
            );
            confirmModal.open();
        }
    }

    private proceedWithEnum(
        table: Table, 
        selection: string, 
        onSelect: (result: string) => void,
        view: MarkdownView | null,
        line: number | undefined,
        typeSetting: Setting,
        editor: Editor | undefined
    ) {
        const ENUM_TYPES = new Set<string>()
        if (editor && line) {
            const enums = table.getTableEnumOptions(selection)
            enums.then((enumvals)=>{
                if (enumvals.length)
                enumvals.forEach((e)=>{
                    ENUM_TYPES.add(e)
                })
            }).catch(()=>{
                new Notice(`There's been an issue. Please try again.`)
            })
        }
        const spanEl = this.modalEl.createEl("span")
        spanEl.id = "modal-enum-badge-element"
        if (!this.root) {
            const container = document.getElementById("modal-enum-badge-element");
            if (container) this.root = createRoot(container)
          } 
          this.root?.render(
            <StrictMode>
                <Badges props={ENUM_TYPES}/>
            </StrictMode>
        );
        this.setTitle("Configure your options")
        typeSetting.settingEl.remove()
        const text = new TextComponent(this.contentEl).setPlaceholder("Enum name").inputEl
        text.addClass("tp-modal-input")
        const btn = new ButtonComponent(this.contentEl).setButtonText("Add enum")
        btn.setClass("tp-modal-button")
        
        btn.onClick(()=>{
            if (text.value.length > 0){
                ENUM_TYPES.add(text.value)
                
            this.root?.render(
                <StrictMode>
                    <Badges props={ENUM_TYPES}/>
                </StrictMode>
            );
            
            text.value = ''
            }  
            
        });


        text.addEventListener("input",()=>{
          if (text.value.length > 0) {
            btn.setCta()   
        } else { 
            btn.removeCta()
        }  
        })

        const submitbtn = new ButtonComponent(this.contentEl).setButtonText("Submit").setCta()
        submitbtn.setClass("tp-modal-button")
        submitbtn.onClick(()=>{
            if (Array.from(ENUM_TYPES).length >= 0){
            const columnOptions = Array.from(ENUM_TYPES)
            if (editor && line) {
                // @ts-expect-error, not typed
                const editorView = view.editor.cm as EditorView;
                const configPromise = table.saveSelectOptions(columnOptions, selection)
                configPromise.then(()=>{
                    table.getTableConfig().then((updatedConfig)=>{
                        const myConfig: TableConfigPayload = {
                            position: updatedConfig.position || 0,
                            columnName: selection,
                            tableConfig: {
                                columns: updatedConfig.TableConfig?.columns || []
                            }
                        }
                        editorView.dispatch({
                            effects: [upsertTableConfigEffect.of(myConfig)]
                        })
                        onSelect("Enum");
                    })
                }).catch((error: Error)=>{
                    if (error.name === "TypeError") {
                        return 
                    }
                })
                      
            }
            this.close()
        }
        });
    }
}
