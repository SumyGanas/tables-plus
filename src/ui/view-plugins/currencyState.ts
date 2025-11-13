
import { StateEffect, StateField, EditorState, Transaction} from "@codemirror/state"
import { EditorView } from '@codemirror/view';

export const currencyEffects = StateEffect.define<Set<string>>();
export const currencyField = StateField.define<Set<string>>({
    create(state: EditorState): Set<string> {
      return currencySet;
    },
    update(val: Set<string>, transaction: Transaction): Set<string> {
      let newState = val;
  
      for (const effect of transaction.effects) {
        if (effect.is(currencyEffects)) {
          newState = effect.value;
        }
      }
      return newState;
    },
  });
export function addCurrencies(view: EditorView, currencies: Set<string>) {
    view.dispatch({
      effects: [currencyEffects.of(currencies)],
    });
  }

export const currencies = ["$","€","£","¥","₩","₹","₱"]
export const currencySet = new Set<string>();
currencies.forEach((c)=>{
    currencySet.add(c)
})

export const currencyTypes: Record<string, string> = {
    "-":"None",
    "$":"$",
    "€":"€",
    "£":"£",
    "¥":"¥",
    "₩":"₩",
    "₹":"₹",
    "₱":"₱",
    "Add your own":"Add your own"
}