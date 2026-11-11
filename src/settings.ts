import { App, PluginSettingTab, Setting } from "obsidian";
import type DoneMoverPlugin from "../main";
import { DEFAULT_SETTINGS } from "./types";

export class DoneMoverSettingTab extends PluginSettingTab {
	plugin: DoneMoverPlugin;

	constructor(app: App, plugin: DoneMoverPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const s = this.plugin.strings;
		containerEl.empty();

		new Setting(containerEl)
			.setName(s.settingAutoModeName)
			.setDesc(s.settingAutoModeDesc)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoMode).onChange(async (value) => {
					this.plugin.settings.autoMode = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(s.settingHeadingName)
			.setDesc(s.settingHeadingDesc)
			.addText((text) =>
				text
					.setPlaceholder("Done")
					.setValue(this.plugin.settings.doneHeading)
					.onChange(async (value) => {
						this.plugin.settings.doneHeading = value.trim() || "Done";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(s.settingRestoreHeadingName)
			.setDesc(s.settingRestoreHeadingDesc)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.restoreHeading)
					.setValue(this.plugin.settings.restoreHeading)
					.onChange(async (value) => {
						this.plugin.settings.restoreHeading = value.trim() || DEFAULT_SETTINGS.restoreHeading;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(s.settingDateName)
			.setDesc(s.settingDateDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.appendCompletionDate)
					.onChange(async (value) => {
						this.plugin.settings.appendCompletionDate = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(s.settingTaskFilterName)
			.setDesc(s.settingTaskFilterDesc)
			.addText((text) =>
				text
					.setPlaceholder("#task")
					.setValue(this.plugin.settings.taskFilter)
					.onChange(async (value) => {
						this.plugin.settings.taskFilter = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(s.settingExcludedName)
			.setDesc(s.settingExcludedDesc)
			.addTextArea((text) => {
				text
					.setPlaceholder("Templates\nArchiv/2025\nDaily/Scratch.md")
					.setValue(this.plugin.settings.excludedPaths.join("\n"))
					.onChange(async (value) => {
						this.plugin.settings.excludedPaths = value
							.split("\n")
							.map((line) => line.trim())
							.filter((line) => line.length > 0);
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 4;
			});
	}
}
