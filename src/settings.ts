import { Plugin, MarkdownView, App, Notice, PluginSettingTab  } from 'obsidian';
import TablesPlusPlugin from './main';

//Settings for the plugin
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