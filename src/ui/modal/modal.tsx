import { App, Modal, DropdownComponent, TextComponent, ButtonComponent, Setting, MarkdownView} from 'obsidian'
import { currencies, currencyTypes } from '../view-plugins/currencyState';
import { Badges } from './EnumBadge';
import { Root, createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { saveSelectOptions, getTableEnumOptions } from '@/src/plugin-logic/modalConfigSettings';
import { upsertTableConfigEffect, TableConfigPayload } from '@/src/state-effects/enumEffects';


const ALL_TYPES: Record<string, string> = {
"None":"None",
"Index": "Index",
"Enum": "Enum",
"Money": "Money",
};


export class TypesModal extends Modal {
    root: Root | null = null;
    constructor(app: App, view: MarkdownView | null, tableID: string, selection: string, onSelect:(result: string) => void) {
        super(app);
        let enumType: string
        const editor = view?.editor
        const line = editor?.getCursor().line
        
        const typeSetting = new Setting(this.contentEl).setName('Tables Plus').setDesc('Please select a type for your table column').addDropdown(dropdown=> {
            dropdown.addOptions(ALL_TYPES).onChange((val)=>{
                if (val === "Enum") {
                    onSelect(val)
                    const ENUM_TYPES = new Set<string>()
                    if (editor && line) {
                        const enumTypes = getTableEnumOptions(editor,selection)
                       let et: string[]
                        enumTypes.then((enumvals)=>{
                            enumvals?.forEach((e)=>{
                                ENUM_TYPES.add(e)
                            })
                        }).catch()
                    }
                    const spanEl = this.modalEl.createEl("span")
                    spanEl.id = "modal-enum-badge-element"
                    if (!this.root) {
                        const container = document.getElementById("modal-enum-badge-element");
                        this.root = createRoot(container!)
                      } 
                      this.root?.render(
                        <StrictMode>
                            <Badges props={ENUM_TYPES}/>
                        </StrictMode>
                    );
                    this.setTitle("Configure your options")
                    typeSetting.settingEl.remove()
                    const text = new TextComponent(this.contentEl).setPlaceholder("Enum Name").inputEl
                    const btn = new ButtonComponent(this.contentEl).setButtonText("Add Enum")
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
                    submitbtn.onClick(()=>{
                        if (Array.from(ENUM_TYPES).length >= 0){
                        
                        const columnOptions = Array.from(ENUM_TYPES)
                        if (editor && line) {
                            // @ts-expect-error, not typed
                            const editorView = view.editor.cm as EditorView;
                            const config = saveSelectOptions(editor, line, tableID, columnOptions, selection)
                            const myConfig: TableConfigPayload = {
                                key: tableID,
                                columnName: selection,
                                tableConfig: config
                            }
                            editorView.dispatch({
                                effects: [upsertTableConfigEffect.of(myConfig)]
                            })   
                        }
                        this.close()
                    }
                    });
 
                } else if(val === "Money") {
                    this.setTitle("Please select a currency (or add your own)")
                    const currencySet = new Set();
                    currencySet.add(currencies)
                    typeSetting.settingEl.remove()
                        new DropdownComponent(this.contentEl).addOptions(currencyTypes).onChange((val)=> {
                        if (val == "Add your own") {
                            this.setTitle("Please enter a single character")
                            const currencySymbol = new TextComponent(this.contentEl).setPlaceholder("Currency Symbol - 1 character").inputEl
                            currencySet.add(currencySymbol)
                            const btn  = new ButtonComponent(this.contentEl).setButtonText("Use Currency").onClick(()=>{
                                if (!btn.disabled){
                                currencyTypes[currencySymbol.value] = currencySymbol.value
                                onSelect("Money-"+currencySymbol.value)
                                this.close()
                                }
                                
                            })
                            currencySymbol.addEventListener("keyup",()=>{
                                    if (currencySymbol.value.length === 1) {
                                        btn.setCta()
                                        btn.setDisabled(false)
                                } else {
                                    btn.setDisabled(true)
                                    btn.removeCta()
                                }
                            })
                            
                        } else{
                            onSelect("Money-"+val)
                            this.close()
                        }
                    })
                } else {
                    onSelect(val)
                    this.close()  
                }
                
        });
    });
            
            
    }
}

