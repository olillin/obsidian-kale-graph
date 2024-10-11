import { MarkdownPostProcessorContext, HexString } from "obsidian"

export interface RenderSettings {
    backgroundColor: HexString
    vertexColor: HexString
    edgeColor: HexString
    vertexRadius: number
    edgeThickness: number
    arrowSize: number
    bendiness: number
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
        const graphEl = renderCodeBlock(source, renderSettings)
        el.appendChild(graphEl)
    }
}

export function parseFlags(line: string): Partial<Flags> {
    const flags: Partial<Flags> = {}

    if (line.contains("d")) flags.directed = true
    if (line.contains("s")) flags.simple = true

    return flags
}

export function renderCodeBlock(
    source: string,
    settings: RenderSettings
): Node {
    const graph = parseSource(source)

    // Render
    try {
        return renderGraph(graph, settings)
    } catch (e) {
        const error: HTMLParagraphElement = document.createElement("p")
        error.className = "kale-graph-error"

        if (
            !(e instanceof CodeBlockPostProccessError) ||
            e instanceof UnexpectedCodeBlockPostProccessError
        ) {
            error.innerHTML =
                "An unexpected error occured while rendering graph:"

            const pre = document.createElement("pre")
            pre.innerHTML = e.toString()
            error.appendChild(pre)

            const report = document.createElement("p")
            report.innerHTML =
                "Please report this issue at " +
                '<a href="https://github.com/olillin/kale-graph/issues">' +
                "https://github.com/olillin/kale-graph/issues</a>"
            pre.appendChild(report)
        } else {
            error.innerHTML = "An error occured while rendering graph:"

            const pre = document.createElement("pre")
            pre.innerHTML = e.message
            error.appendChild(pre)
        }
        return error
    }
}

interface GraphData {
    flags: Flags
    vertices: Set<Vertex>
    edges: Array<Edge>
}

export function parseSource(source: string): GraphData {
    const lines = source
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)

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

    return { flags, vertices, edges }
}

export function renderGraph(graph: GraphData, settings: RenderSettings): Node {
    const { flags, vertices, edges } = graph

    const documentStyle = getComputedStyle(document.body)
    const width = parseInt(documentStyle.getPropertyValue("--file-line-width"))
    const height = 350

    const canvas = document.createElement("canvas")
    canvas.classList.add("kale-graph-canvas")
    canvas.width = width
    canvas.height = height

    let ctx = canvas.getContext("2d")
    if (!ctx) {
        cancelRender("Failed to get canvas context", true)
    }
    ctx = ctx as CanvasRenderingContext2D

    // Draw background
    ctx.fillStyle = settings.backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Draw vertices
    const verticesArray = Array.from(vertices)

    const bigRadius = height / 2 - 30
    const vertexPosition = (i: number) => {
        const angle =
            (2 * Math.PI * i) / verticesArray.length -
            (Math.PI * (2 - verticesArray.length)) / verticesArray.length / 2
        const x = Math.cos(angle) * bigRadius
        const y = Math.sin(angle) * bigRadius
        return [x, y, angle]
    }

    const centerX = (width - settings.vertexRadius) / 2
    const centerY = (height - settings.vertexRadius) / 2
    const drawVertex = (i: number) => {
        const [x, y] = vertexPosition(i)
        ctx.beginPath()
        ctx.fillStyle = settings.vertexColor
        ctx.arc(x + centerX, y + centerY, settings.vertexRadius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()

        ctx.font = "20px O"
        ctx.strokeStyle = settings.vertexColor
        ctx.textRendering = "optimizeLegibility"
        ctx.fillText(
            verticesArray[i],
            x + centerX + settings.vertexRadius,
            y + centerY - settings.vertexRadius
        )
    }

    const drawEdge = (i: number, j: number, bend: number = 0) => {
        const [iX, iY] = vertexPosition(i)
        const [jX, jY] = vertexPosition(j)

        ctx.strokeStyle = settings.edgeColor
        ctx.lineWidth = settings.edgeThickness

        const d =
            bend > 0 //
                ? (-1) ** bend * settings.bendiness / bend
                : Infinity
        console.log(bend, settings.bendiness, d)

        const edgeAngle = Math.atan2(jY - iY, jX - iX)
        const tangentAngle = edgeAngle + Math.PI / 2
        const tangentX = Math.cos(tangentAngle)
        const tangentY = Math.sin(tangentAngle)

        const middleX = (iX + jX) / 2
        const middleY = (iY + jY) / 2
        const arcX = middleX + tangentX * d
        const arcY = middleY + tangentY * d

        const r = Math.sqrt((arcX - iX) ** 2 + (arcY - iY) ** 2)
        const iAngle = Math.atan2(iY - arcY, iX - arcX)
        const jAngle = Math.atan2(jY - arcY, jX - arcX)
        ctx.beginPath()
        if (Math.abs(d) === Infinity) {
            ctx.moveTo(iX + centerX, iY + centerY)
            ctx.lineTo(jX + centerX, jY + centerY)
        } else {
            ctx.arc(
                arcX + centerX, //
                arcY + centerY,
                r,
                d > 0 ? iAngle : jAngle,
                d > 0 ? jAngle : iAngle
            )
        }
        ctx.stroke()

        // Draw arrow
        if (flags.directed) {
            const offsetX = Math.abs(d) !== Infinity ? tangentX * (d - r) : 0
            const offsetY = Math.abs(d) !== Infinity ? tangentY * (d - r) : 0
            const arrowX = middleX + offsetX + centerX
            const arrowY = middleY + offsetY + centerY

            ctx.beginPath()
            for (let k = 0; k < 3; k++) {
                const angle = (k / 3) * 2 * Math.PI + edgeAngle
                const x = settings.arrowSize * Math.cos(angle) + arrowX
                const y = settings.arrowSize * Math.sin(angle) + arrowY

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

    const seenEdges: Map<Vertex, Map<Vertex, number>> = new Map()
    for (const [u, v] of edges) {
        let bend = 0
        if (seenEdges.has(u)) {
            const seenSubEdges = seenEdges.get(u)!
            if (seenSubEdges.has(v)) {
                bend = seenSubEdges.get(v)!
                seenSubEdges.set(v, bend + 1)
            }
        }
        if (seenEdges.has(v)) {
            const seenSubEdges = seenEdges.get(v)!
            if (seenSubEdges.has(u)) {
                bend = seenSubEdges.get(u)!
                seenSubEdges.set(u, bend + 1)
            }
        }
        if (bend === 0) {
            let seenSubEdges: Map<Vertex, number>
            if (seenEdges.has(u)) {
                seenSubEdges = seenEdges.get(u)!
            } else {
                seenSubEdges = new Map()
                seenEdges.set(u, seenSubEdges)
            }
            seenSubEdges.set(v, 1)
        }
        console.log(bend)

        const i = verticesArray.indexOf(u)
        if (i == -1) cancelRender(`Undefined vertex ${u} in edge (${u}, ${v})`)

        const j = verticesArray.indexOf(v)
        if (j == -1) cancelRender(`Undefined vertex ${v} in edge (${u}, ${v})`)

        drawEdge(i, j, bend)
    }
    for (let i = 0; i < verticesArray.length; i++) {
        drawVertex(i)
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
