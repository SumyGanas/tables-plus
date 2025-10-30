import { App, Modal, DropdownComponent, TextComponent, ButtonComponent, Setting, MarkdownView} from 'obsidian'
import { currencies, currencyTypes } from '../view-plugins/currencyState';
import { Badges } from './EnumBadge';
import { Root, createRoot } from 'react-dom/client';
import { StrictMode } from 'react';

const ALL_TYPES: Record<string, string> = {
"None":"None",
"Index": "Index",
"Enum": "Enum",
"Money": "Money",
};

const ENUM_TYPES: string[] = []

export class TypesModal extends Modal {
    root: Root | null = null;
    constructor(app: App, view: MarkdownView | null, onSelect:(result: string) => void) {
        super(app);
        let enumType: string
        const typeSetting = new Setting(this.contentEl).setName('Tables Plus').setDesc('Please select a type for your table column').addDropdown(dropdown=> {
            dropdown.addOptions(ALL_TYPES).onChange((val)=>{
                //onSelect(val)
                if (val === "Enum") {
                    this.setTitle("Add Enums")
                    typeSetting.settingEl.remove()
                    const text = new TextComponent(this.contentEl).setPlaceholder("Enum Name").inputEl
                    const btn = new ButtonComponent(this.contentEl).setButtonText("Add Enum")
                    btn.onClick(()=>{
                        if (text.value.length > 0){
                        ENUM_TYPES.push(text.value)
                        this.root = createRoot(this.modalEl.createEl("span"));
                        this.root?.render(
                            <StrictMode>
                                <Badges prop={text.value}/>
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
                    // new DropdownComponent(this.modalEl).addOptions().onChange((enum: string)=>{
                    //     enumType = enum
                    // })
                } else {
                    onSelect(val)
                    this.close()  
                }
 

                
        });
    });
            
            
    }
}

