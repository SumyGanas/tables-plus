import { App, PluginSettingTab, Setting  } from 'obsidian';
import TablesPlusPlugin from './main';


interface PluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	mySetting: 'default',
}

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