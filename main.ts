import {
    App,
    Plugin,
    PluginSettingTab,
    Setting,
    MarkdownPostProcessorContext,
} from "obsidian"

// Remember to rename these classes and interfaces!

interface KaleGraphSettings {
    codeBlockKeyword: string
}

const DEFAULT_SETTINGS: KaleGraphSettings = {
    codeBlockKeyword: "kale",
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

    onunload() {}

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
        const { containerEl } = this

        containerEl.empty()

        containerEl.createEl("h2", "Code blocks")
        new Setting(containerEl)
            .setName("Kale Graph Keyword")
            .setDesc(
                "Will render a kale graph view if provided as the " +
                    "language of a code block."
            )
            .addText((text) =>
                text
                    .setPlaceholder("Enter your secret")
                    .setValue(this.plugin.settings.codeBlockKeyword)
                    .onChange(async (value) => {
                        this.plugin.settings.codeBlockKeyword = value
                        await this.plugin.saveSettings()
                    })
            )
    }
}

interface Flags {
    directed: boolean
    simple: boolean
}

const DEFAULT_FLAGS: Flags = {
    directed: false,
    simple: false,
}

const FLAG_PREFIX = "-"

type Vertex = string
type Edge = [Vertex, Vertex]

const EDGE_VALIDATE_PATTERN =
    /^[({[]?([({[]\s*(\w+?\s*[,]\s*\w+?)\s*[)}\]](\s*[,]\s*)?)+[)}\]]?$/g
const EDGE_SEARCH_PATTERN = /[({[]\s*(\w+?)\s*[,]\s*(\w+?)\s*[)}\]]/g
const VERTEX_SEARCH_PATTERN = /\w+/g

function markdownPostProcessor(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
) {
    const lines = source
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    if (lines.length == 0) return

    const flags: Flags = Object.assign({}, DEFAULT_FLAGS)
    const vertices: Array<Vertex> = []
    const edges: Array<Edge> = []

    for (let line of lines) {
        if (line.startsWith(FLAG_PREFIX)) {
            Object.assign(flags, parseFlags(line))
        } else if (EDGE_VALIDATE_PATTERN.test(line)) {
            for (let match of line.matchAll(EDGE_SEARCH_PATTERN)) {
                edges.push([match[1], match[2]])
            }
        } else {
            for (let match of line.matchAll(VERTEX_SEARCH_PATTERN)) {
                vertices.push(match[0])
            }
        }
    }

    const flagsList = el.createEl("ul", { text: "Flags" })
    const verticesList = el.createEl("ul", { text: "Vertices" })
    const edgesList = el.createEl("ul", { text: "Edges" })

    Object.entries(flags).forEach((flag) => {
        flagsList.createEl("li", { text: `${flag[0]}: ${flag[1]}` })
    })

    vertices.forEach((vertex) => {
        verticesList.createEl("li", { text: vertex })
    })

    console.log(edges)
    edges.forEach((edge) => {
        edgesList.createEl("li", { text: edge.join(",") })
    })
}

function parseFlags(line: string): Partial<Flags> {
    const flags: Partial<Flags> = {}

    if (line.contains("d")) flags.directed = true
    if (line.contains("s")) flags.simple = true

    return flags
}
