import {
    MarkdownPostProcessorContext,
    HexString,
} from 'obsidian'

export interface RenderSettings {
    backgroundColor: HexString
    vertexColor: HexString
    edgeColor: HexString
}

export interface Flags {
    directed: boolean
    simple: boolean
}

export const DEFAULT_FLAGS: Flags = {
    directed: false,
    simple: false,
}

export const FLAG_PREFIX = "-"

export type Vertex = string
export type Edge = [Vertex, Vertex]

export const EDGE_VALIDATE_PATTERN =
    /^[({[]?([({[]\s*(\w+?\s*[,]\s*\w+?)\s*[)}\]](\s*[,]\s*)?)+[)}\]]?$/
export const EDGE_SEARCH_PATTERN = /[({[]\s*(\w+?)\s*[,]\s*(\w+?)\s*[)}\]]/g
export const VERTEX_SEARCH_PATTERN = /\w+/g

export default function codeBlockPostProcessor(renderSettings: RenderSettings) {
    return (
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) => {
        // Parse source
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

        // Render
        renderGraph(el, vertices, edges, flags.directed, renderSettings)
    }
}

export function parseFlags(line: string): Partial<Flags> {
    const flags: Partial<Flags> = {}

    if (line.contains("d")) flags.directed = true
    if (line.contains("s")) flags.simple = true

    return flags
}

export function renderGraph(
    el: HTMLElement,
    vertices: Set<Vertex>,
    edges: Array<[Vertex, Vertex]>,
    directed: boolean = false,
    settings: RenderSettings
): HTMLCanvasElement {
    const view = document.querySelector(".cm-sizer")
    if (!view) {
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
    if (!ctx) {
        cancelRender("Failed to get canvas context", true)
    }

    // Draw background
    ctx.fillStyle = settings.backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Draw vertices
    const verticesArray = Array.from(vertices)

    const bigRadius = height / 2 - 30
    const vertexPosition = (i: number) => {
        const angle = (2 * Math.PI * i) / verticesArray.length
        const x = Math.cos(angle) * bigRadius
        const y = Math.sin(angle) * bigRadius
        return [x, y, angle]
    }

    const vertexRadius = 5
    const centerX = (width - vertexRadius) / 2
    const centerY = (height - vertexRadius) / 2
    const drawVertex = (i: number) => {
        const [x, y] = vertexPosition(i)
        ctx.beginPath()
        ctx.fillStyle = settings.vertexColor
        ctx.arc(x + centerX, y + centerY, vertexRadius, 0, 2 * Math.PI)
        ctx.fill()

        ctx.font = "20px O"
        ctx.strokeStyle = settings.vertexColor
        ctx.textRendering = "optimizeLegibility"
        ctx.fillText(
            verticesArray[i],
            x + centerX + vertexRadius,
            y + centerY - vertexRadius
        )
    }

    const edgeThickness = 2
    const arrowSize = 7
    const drawEdge = (i: number, j: number) => {
        const [iX, iY] = vertexPosition(i)
        const [jX, jY] = vertexPosition(j)

        ctx.strokeStyle = settings.edgeColor
        ctx.lineWidth = edgeThickness
        ctx.moveTo(iX + centerX, iY + centerY)
        ctx.lineTo(jX + centerX, jY + centerY)
        ctx.stroke()

        // Draw arrow
        if (directed) {
            const lineCenterX = (iX + jX) / 2 + centerX
            const lineCenterY = (iY + jY) / 2 + centerY

            let arrowAngle = Math.atan2(jY - iY, jX - iX)

            ctx.beginPath()
            for (let k = 0; k < 3; k++) {
                const angle = (k / 3) * 2 * Math.PI + arrowAngle
                const x = arrowSize * Math.cos(angle) + lineCenterX
                const y = arrowSize * Math.sin(angle) + lineCenterY

                if (k == 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            }
            ctx.closePath()
            ctx.fillStyle = settings.edgeColor
            ctx.fill()
        }
    }

    for (let i = 0; i < verticesArray.length; i++) {
        drawVertex(i)
    }
    for (const [u, v] of edges) {
        const i = verticesArray.indexOf(u)
        if (i == -1) cancelRender(`Invalid vertex ${u} in edge (${u}, ${v})`)

        const j = verticesArray.indexOf(v)
        if (j == -1) cancelRender(`Invalid vertex ${v} in edge (${u}, ${v})`)

        drawEdge(i, j)
    }

    return canvas
}

/**
 * Used to declare that something has gone wrong while rendering the markdown
 * post processor.
 */
export class CodeBlockPostProccessError extends Error {}
/**
 * Used to declare that something has gone wrong while rendering the markdown
 * post processor which was not caused invalid input/configuration.
 */
export class UnexpectedCodeBlockPostProccessError extends CodeBlockPostProccessError {}

/** Shorthand to throw a `CodeBlockPostProccessError`. */
function cancelRender(message?: string, unexpected: boolean = false) {
    throw new (
        unexpected
            ? UnexpectedCodeBlockPostProccessError
            : CodeBlockPostProccessError
    )(message)
}
