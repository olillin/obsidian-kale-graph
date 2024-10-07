import { App, Plugin, PluginSettingTab, Setting } from 'obsidian'

// Remember to rename these classes and interfaces!

interface KaleGraphSettings {
    codeBlockKeyword: string
}

const DEFAULT_SETTINGS: KaleGraphSettings = {
    codeBlockKeyword: 'kale'
}

export default class KaleGraph extends Plugin {
    settings: KaleGraphSettings

    async onload() {
        await this.loadSettings()

        // This adds a settings tab so the user can configure various aspects
        // of the plugin.
        this.addSettingTab(new KaleGraphSettingTab(this.app, this))

        this.registerMarkdownCodeBlockProcessor(
            this.settings.codeBlockKeyword,
            markdownPostProcessor
        )
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        )
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }
}

class KaleGraphSettingTab extends PluginSettingTab {
    plugin: KaleGraph

    constructor(app: App, plugin: KaleGraph) {
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void {
        const {containerEl} = this

        containerEl.empty()

        containerEl.createEl('h2', 'Code blocks')
        new Setting(containerEl)
            .setName('Kale Graph Keyword')
            .setDesc('Will render a kale graph view if provided as the '
                    +'language of a code block.')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue(this.plugin.settings.codeBlockKeyword)
                .onChange(async (value) => {
                    this.plugin.settings.codeBlockKeyword = value
                    await this.plugin.saveSettings()
                }))
    }
}

function markdownPostProcessor(source, el, ctx) {
    const rows = source.split("\n").filter((row) => row.length > 0);

    const table = el.createEl("table");
    const body = table.createEl("tbody");

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split(",");

      const row = body.createEl("tr");

      for (let j = 0; j < cols.length; j++) {
        row.createEl("td", { text: cols[j] });
      }
    }
}