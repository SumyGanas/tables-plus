import { EditorState, StateEffect, Transaction, StateField } from "@codemirror/state"

export const setEnumListEffect = StateEffect.define<string[]>();

export const EnumEffects = StateField.define<string[]>({
    create(state: EditorState) {
      return [];
    },
  
    update(value: string[], transaction: Transaction):  string[]{
        let enums = value
        for (const effect of transaction.effects) {
        if (effect.is(setEnumListEffect)) {
            enums = effect.value
            return enums
    }
  }
return enums },
});
  
  