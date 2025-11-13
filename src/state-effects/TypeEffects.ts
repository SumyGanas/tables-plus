import { EditorState, StateEffect, Transaction, StateField } from "@codemirror/state"


export const setEnumEffect = StateEffect.define<Record<string, number>>();
export const setMoneyEffect = StateEffect.define<Record<string, number>>();
export const setDateEffect = StateEffect.define<Record<string, number>>(); //TODO
export const setIndexEffect = StateEffect.define<Record<string, number>>();

const resetEffect = StateEffect.define();
export const TypeEffectsField = StateField.define<Record<string, number> | null>({
  
  create(state: EditorState) {
    return null;
  },

  update(value: Record<string, number> | null, transaction: Transaction): Record<string, number> | null {
    let newState = value;
    for (const effect of transaction.effects) {
      if (effect.is(setIndexEffect)) {
        return {
          ...(value || {}),
          ...effect.value,
        }
      } 
      else if (effect.is(setEnumEffect)) {
        return {
          ...(value || {}),
          ...effect.value,
        }
      } 
      else if (effect.is(setMoneyEffect)) {
        return {
          ...(value || {}),
          ...effect.value,
        }
      } 
      else if (effect.is(resetEffect)) {
        newState = null;
      }
    }
    
    return newState;

  },
});

