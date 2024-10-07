import {
    App,
    Plugin,
    PluginSettingTab,
    Setting,
    MarkdownPostProcessorContext,
    HexString,
} from "obsidian"

// Remember to rename these classes and interfaces!

interface KaleGraphSettings {
    codeBlockKeyword: string
    render: RenderSettings
}

interface RenderSettings {
    backgroundColor: HexString
    vertexColor: HexString
    edgeColor: HexString
}

const DEFAULT_SETTINGS: KaleGraphSettings = {
    codeBlockKeyword: "kale",
    render: {
        backgroundColor: "#000000",
        vertexColor: "#ffffff",
        edgeColor: "#ffffff",
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
            .addText(text =>
                text
                    .setPlaceholder("Enter your secret")
                    .setValue(this.plugin.settings.codeBlockKeyword)
                    .onChange(async value => {
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

function codeBlockPostProcessor(renderSettings: RenderSettings) {
    return (
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) => {
        const lines = source
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0)
        if (lines.length == 0) return

        const flags: Flags = Object.assign({}, DEFAULT_FLAGS)
        const vertices: Set<Vertex> = new Set()
        const edges: Array<Edge> = []

        for (let line of lines) {
            if (line.startsWith(FLAG_PREFIX)) {
                Object.assign(flags, parseFlags(line.slice(FLAG_PREFIX.length)))
            } else if (EDGE_VALIDATE_PATTERN.test(line)) {
                for (let match of line.matchAll(EDGE_SEARCH_PATTERN)) {
                    edges.push([match[1], match[2]])
                }
            } else {
                for (let match of line.matchAll(VERTEX_SEARCH_PATTERN)) {
                    vertices.add(match[0])
                }
            }
        }

        const flagsList = el.createEl("ul", { text: "Flags" })
        const verticesList = el.createEl("ul", { text: "Vertices" })
        const edgesList = el.createEl("ul", { text: "Edges" })

        Object.entries(flags).forEach(flag => {
            flagsList.createEl("li", { text: `${flag[0]}: ${flag[1]}` })
        })

        vertices.forEach(vertex => {
            verticesList.createEl("li", { text: vertex })
        })

        edges.forEach(edge => {
            edgesList.createEl("li", { text: edge.join(",") })
        })

        renderGraph(el, vertices, edges, renderSettings)
    }
}

function parseFlags(line: string): Partial<Flags> {
    const flags: Partial<Flags> = {}

    if (line.contains("d")) flags.directed = true
    if (line.contains("s")) flags.simple = true

    return flags
}

function renderGraph(
    el: HTMLElement,
    vertices: Set<Vertex>,
    edges: Array<[Vertex, Vertex]>,
    settings: RenderSettings
): HTMLCanvasElement {
    const view = document.querySelector(".cm-sizer")
    if (view == null) {
        cancelRender("Failed to get note width", true)
    }

    const width = view.getBoundingClientRect().width
    const height = 350

    const canvas = el.createEl("canvas", {
        cls: "kale-graph-canvas",
        attr: {
            width: width,
            height: height,
        },
    })
    const ctx = canvas.getContext("2d")
    if (ctx == null) {
        cancelRender("Failed to get canvas context", true)
    }

    // Draw background
    ctx.fillStyle = settings.backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Draw vertices
    const vertexRadius = 10
    const drawVertex = (x: number, y: number) => {
        ctx.beginPath()
        ctx.fillStyle = settings.vertexColor
        ctx.arc(
            x + (width - vertexRadius) / 2,
            y + (height - vertexRadius) / 2,
            vertexRadius,
            0,
            2 * Math.PI
        )
        ctx.fill()
    }

    const bigRadius = height / 2 - 30
    const verticesArray = Array.from(vertices)
    for (let i = 0; i < verticesArray.length; i++) {
        const vertex = verticesArray[i]

        const angle = 2 * Math.PI * i / verticesArray.length
        const x = Math.cos(angle) * bigRadius
        const y = Math.sin(angle) * bigRadius

        drawVertex(x, y)
    }

    return canvas
}

/**
 * Used to declare that something has gone wrong while rendering the markdown
 * post processor.
 */
class CodeBlockPostProccessError extends Error {}
/**
 * Used to declare that something has gone wrong while rendering the markdown
 * post processor which was not caused invalid input/configuration.
 */
class UnexpectedCodeBlockPostProccessError extends CodeBlockPostProccessError {}

/** Shorthand to throw a `CodeBlockPostProccessError`. */
function cancelRender(message?: string, unexpected: boolean = false) {
    throw new (
        unexpected
            ? UnexpectedCodeBlockPostProccessError
            : CodeBlockPostProccessError
    )(message)
}
