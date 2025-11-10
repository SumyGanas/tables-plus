import { App, PluginSettingTab, Setting  } from 'obsidian';
import TablesPlusPlugin from './main';

export class TablesPlusSettingTab extends PluginSettingTab {
	plugin: TablesPlusPlugin;

	constructor(app: App, plugin: TablesPlusPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		
	}
}