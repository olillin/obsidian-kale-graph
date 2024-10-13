import {
    App,
    Plugin,
    PluginSettingTab,
    Setting,
    SliderComponent,
    TextComponent,
} from "obsidian"
import { KaleGraphSettings } from "./types"
import codeBlockPostProcessor from "./markdown-post-processor"

const DEFAULT_SETTINGS: KaleGraphSettings = {
    codeBlockKeyword: "kale",
    render: {
        backgroundColor: "#000000",
        vertexColor: "#ffffff",
        edgeColor: "#ffffff",
        bigRadius: 145,
        vertexRadius: 5,
        edgeThickness: 2,
        arrowSize: 7,
        bendiness: 10,
    },
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
            codeBlockPostProcessor(this.settings.render)
        )
    }

    onunload() {}

    async loadSettings() {
        const data = (await this.loadData()) ?? {}

        const documentStyle = getComputedStyle(document.body)
        const codeBackgroundColor =
            documentStyle.getPropertyValue("--code-background")
        const textColor = documentStyle.getPropertyValue("--text-normal")

        DEFAULT_SETTINGS.render.backgroundColor = codeBackgroundColor
        DEFAULT_SETTINGS.render.vertexColor = textColor
        DEFAULT_SETTINGS.render.edgeColor = textColor

        this.settings = Object.assign({}, DEFAULT_SETTINGS, data)
        this.settings.render = Object.assign(
            {},
            DEFAULT_SETTINGS.render,
            data.render
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
        const { containerEl: container } = this

        container.empty()

        new Setting(container)
            .setName("Code block keyword")
            .setDesc(
                "Will render a kale graph if provided as the language of a " +
                    "code block."
            )
            .addText(text =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.codeBlockKeyword)
                    .setValue(this.plugin.settings.codeBlockKeyword)
                    .onChange(async value => {
                        this.plugin.settings.codeBlockKeyword = value
                        await this.plugin.saveSettings()
                    })
            )
        this.displayAppearanceSettings(container)
    }

    displayAppearanceSettings(container: HTMLElement) {
        new Setting(container).setName("Appearance").setHeading()
        new Setting(container).setName("Background color").addText(text =>
            text
                .setPlaceholder(DEFAULT_SETTINGS.render.backgroundColor)
                .setValue(this.plugin.settings.render.backgroundColor)
                .onChange(async value => {
                    this.plugin.settings.render.backgroundColor = value
                    await this.plugin.saveSettings()
                })
        )
        new Setting(container).setName("Vertex color").addText(text =>
            text
                .setPlaceholder(DEFAULT_SETTINGS.render.vertexColor)
                .setValue(this.plugin.settings.render.vertexColor)
                .onChange(async value => {
                    this.plugin.settings.render.vertexColor = value
                    await this.plugin.saveSettings()
                })
        )
        new Setting(container).setName("Edge color").addText(text =>
            text
                .setPlaceholder(DEFAULT_SETTINGS.render.edgeColor)
                .setValue(this.plugin.settings.render.edgeColor)
                .onChange(async value => {
                    this.plugin.settings.render.edgeColor = value
                    await this.plugin.saveSettings()
                })
        )
        new Setting(container).setName("Advanced").setHeading()
        new SliderSetting(container, DEFAULT_SETTINGS.render.vertexRadius)
            .setName("Vertex radius")
            .setValue(this.plugin.settings.render.vertexRadius)
            .onChange(async value => {
                this.plugin.settings.render.vertexRadius = value
                await this.plugin.saveSettings()
            })
            .slider.setLimits(0, 15, 0.1)

        new SliderSetting(container, DEFAULT_SETTINGS.render.edgeThickness)
            .setName("Edge thickness")
            .setValue(this.plugin.settings.render.edgeThickness)
            .onChange(async value => {
                this.plugin.settings.render.edgeThickness = value
                await this.plugin.saveSettings()
            })
            .slider.setLimits(0, 15, 0.1)

        new SliderSetting(container, DEFAULT_SETTINGS.render.arrowSize)
            .setName("Arrow size")
            .setValue(this.plugin.settings.render.arrowSize)
            .onChange(async value => {
                this.plugin.settings.render.arrowSize = value
                await this.plugin.saveSettings()
            })
            .slider.setLimits(0, 15, 0.1)
        new SliderSetting(container, DEFAULT_SETTINGS.render.bendiness)
            .setName("Bendiness")
            .setDesc(
                "How dramatically lines on the same edge should bend around each other"
            )
            .setValue(this.plugin.settings.render.bendiness)
            .onChange(async value => {
                this.plugin.settings.render.bendiness = value
                await this.plugin.saveSettings()
            })
            .slider.setLimits(0, 30, 1)
    }
}

class SliderSetting extends Setting {
    cbs: Array<(value: number) => void> = []
    text: TextComponent
    slider: SliderComponent
    value: number

    constructor(containerEl: HTMLElement, defaultValue: number = 1) {
        super(containerEl)

        this.addText(text => {
            this.text = text
            text.setPlaceholder(defaultValue.toString())
        }).addSlider(slider => {
            this.slider = slider
            slider.setInstant(true)
        })
        this.setValue(defaultValue)

        this.text.onChange(async value => {
            const numberValue = parseFloat(value)
            if (isNaN(numberValue)) {
                return
            }
            this.slider.setValue(numberValue)
            this.onChanged()
        })
        this.slider.onChange(async value => {
            this.text.setValue(value.toString())
            this.onChanged()
        })
    }

    setValue(value: number) {
        this.text.setValue(value.toString())
        this.slider.setValue(value)
        return this
    }

    getValue(): number {
        return this.slider.getValue()
    }

    onChange(cb: (value: number) => void) {
        this.cbs.push(cb)
        return this
    }

    onChanged() {
        let value = this.getValue()
        this.cbs.forEach(async cb => {
            await cb(value)
        })
        return this
    }
}
