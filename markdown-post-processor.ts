import { MarkdownPostProcessorContext, HexString, arrayBufferToBase64 } from "obsidian"

export interface RenderSettings {
    backgroundColor: HexString
    vertexColor: HexString
    edgeColor: HexString
    vertexRadius: number
    edgeThickness: number
    arrowSize: number
    bendiness: number
}

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
    if (line.contains("a")) flags.auto = true

    return flags
}

export function renderCodeBlock(
    source: string,
    settings: RenderSettings
): Node {
    try {
        const graph = parseSource(source)
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

export interface Flags {
    directed: boolean
    simple: boolean
    auto: boolean
}

export const DEFAULT_FLAGS: Flags = {
    directed: false,
    simple: false,
    auto: false,
}

export type Vertex = string
export type Edge = [Vertex, Vertex]

interface GraphData {
    flags: Flags
    vertices: Set<Vertex>
    edges: Array<Edge>
}

export const COMMENT_PATTERN = /\/\/.+/
export const FLAG_PREFIX = "-"

export const EDGE_VALIDATE_PATTERN =
    /^(\(\s*(\w+?\s*[,]\s*\w+?)\s*\)(\s*[,]\s*)?)+$/
export const EDGE_SEARCH_PATTERN = /\(\s*(\w+?)\s*[,]\s*(\w+?)\s*\)/g
export const PATH_VALIDATE_PATTERN = /^(\w+\s*-\s*)*\w+\s*$/
export const PATH_SEARCH_PATTERN = /\w+(?=\s*(-|$))/g
export const VERTEX_VALIDATE_PATTERN = /^(\w+\s*,\s*)*\w+\s*,?$/
export const VERTEX_SEARCH_PATTERN = /\w+(?=\s*(,|$))/g

export const INVISIBLE_VERTEX_PREFIX = "_"

export function parseSource(source: string): GraphData {
    const lines = source
        .split("\n")
        .map(line => line.replace(COMMENT_PATTERN, "").trim())
        .filter(line => line.length > 0)

    const flags: Flags = Object.assign({}, DEFAULT_FLAGS)
    const vertices: Set<Vertex> = new Set()
    const edges: Array<Edge> = []

    let firstLine = true
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        if (firstLine && line.startsWith(FLAG_PREFIX)) {
            // Flags
            Object.assign(flags, parseFlags(line.slice(FLAG_PREFIX.length)))
        } else if (EDGE_VALIDATE_PATTERN.test(line)) {
            // Edges
            for (let match of line.matchAll(EDGE_SEARCH_PATTERN)) {
                edges.push([match[1], match[2]])
            }
        } else if (VERTEX_VALIDATE_PATTERN.test(line)) {
            // Vertices
            for (let match of line.matchAll(VERTEX_SEARCH_PATTERN)) {
                let vertex: Vertex = match[0]
                if (
                    vertex.startsWith(INVISIBLE_VERTEX_PREFIX) &&
                    vertices.has(vertex)
                ) {
                    vertex += random()
                }
                vertices.add(vertex)
            }
        } else if (PATH_VALIDATE_PATTERN.test(line)) {
            // Paths
            let lastVertex: Vertex | null = null
            for (let match of line.matchAll(PATH_SEARCH_PATTERN)) {
                const vertex: Vertex = match[0]
                if (lastVertex) {
                    edges.push([lastVertex, vertex])
                }
                lastVertex = vertex
            }
        } else {
            cancelRender(`Invalid input on line ${i + 1}`)
        }
        firstLine = false
    }

    if (flags.auto) {
        for (const [u, v] of edges) {
            vertices.add(u)
            vertices.add(v)
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

    const nullableCtx = canvas.getContext("2d")
    if (!nullableCtx) {
        cancelRender("Failed to get canvas context", true)
    }
    let ctx: CanvasRenderingContext2D = nullableCtx as CanvasRenderingContext2D

    // Draw background
    ctx.fillStyle = settings.backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Draw vertices
    const verticesArray = Array.from(vertices)

    const bigRadius = height / 2 - 30
    const cornerAngle = (Math.PI * (2 - verticesArray.length)) / verticesArray.length
    const vertexPosition = (i: number) => {
        const angle = (2 * Math.PI * i) / verticesArray.length -
            cornerAngle / 2
        const x = Math.cos(angle) * bigRadius
        const y = Math.sin(angle) * bigRadius
        return [x, y, angle]
    }

    const centerX = (width - settings.vertexRadius) / 2
    var centerY = (height - settings.vertexRadius) / 2
    // Center odd polygons
    if (verticesArray.length % 2 === 1) {
        centerY += (bigRadius - vertexPosition(0)[1]) / 2
    }

    const drawVertex = (i: number) => {
        const [x, y] = vertexPosition(i)
        ctx.beginPath()
        ctx.fillStyle = settings.vertexColor
        ctx.arc(x + centerX, y + centerY, settings.vertexRadius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()

        ctx.font = "20px O"
        ctx.strokeStyle = settings.vertexColor
        ctx.fillText(
            verticesArray[i],
            x + centerX + settings.vertexRadius,
            y + centerY - settings.vertexRadius
        )
    }

    const drawEdge = (
        i: number,
        j: number,
        bend: number = 0,
        reverse: boolean = false
    ) => {
        const [iX, iY, vertexAngle] = vertexPosition(i)
        const [jX, jY] = vertexPosition(j)

        ctx.strokeStyle = settings.edgeColor
        ctx.lineWidth = settings.edgeThickness

        let d =
            i !== j
                ? settings.bendiness * Math.ceil(bend / 2) * 2 * (-1) ** bend
                : settings.bendiness * (bend + 1) * 2

        const edgeAngle = Math.atan2(jY - iY, jX - iX)
        const tangentAngle = edgeAngle + Math.PI / 2
        const tangentX = Math.cos(tangentAngle)
        const tangentY = Math.sin(tangentAngle)

        const middleX = (iX + jX) / 2
        const middleY = (iY + jY) / 2

        const bentX = middleX + tangentX * d
        const bentY = middleY + tangentY * d

        const [circleX, circleY, r] =
            i !== j
                ? findCircle(iX, iY, jX, jY, bentX, bentY)
                : [
                      (iX + bentX) / 2,
                      (iY + bentY) / 2,
                      Math.sqrt((iX - bentX) ** 2 + (iY - bentY) ** 2) / 2,
                  ]

        const iAngle = Math.atan2(iY - circleY, iX - circleX)
        const jAngle = Math.atan2(jY - circleY, jX - circleX)
        ctx.beginPath()
        if (d === 0) {
            ctx.moveTo(iX + centerX, iY + centerY)
            ctx.lineTo(jX + centerX, jY + centerY)
        } else {
            ctx.arc(
                circleX + centerX, //
                circleY + centerY,
                r,
                (d > 0 ? jAngle : iAngle) + 2 * Math.PI,
                d > 0 ? iAngle : jAngle
            )
        }
        ctx.stroke()

        // Draw arrow
        if (flags.directed) {
            ctx.beginPath()
            for (let k = 0; k < 3; k++) {
                let angle = (k / 3) * 2 * Math.PI + edgeAngle
                if (reverse) {
                    angle += Math.PI
                }

                const x = settings.arrowSize * Math.cos(angle) + bentX + centerX
                const y = settings.arrowSize * Math.sin(angle) + bentY + centerY

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

    // Draw edges
    const seenEdges: Map<Vertex, Map<Vertex, number>> = new Map()
    for (const [u, v] of edges) {
        // Disallow invisible vertices
        if (
            u.startsWith(INVISIBLE_VERTEX_PREFIX) ||
            v.startsWith(INVISIBLE_VERTEX_PREFIX)
        ) {
            cancelRender("Edges may not be connected to invisible vertices")
        }

        // Get indices
        const i = verticesArray.indexOf(u)
        if (i == -1) cancelRender(`Undefined vertex ${u} in edge (${u}, ${v})`)

        const j = verticesArray.indexOf(v)
        if (j == -1) cancelRender(`Undefined vertex ${v} in edge (${u}, ${v})`)

        // Draw edge with bend
        let bend = 0
        if (seenEdges.has(u)) {
            const seenSubEdges = seenEdges.get(u)!
            if (seenSubEdges.has(v)) {
                bend = seenSubEdges.get(v)!
                seenSubEdges.set(v, bend + 1)
                if (graph.flags.simple) {
                    continue
                }

                drawEdge(i, j, bend)
                continue
            }
        }
        if (seenEdges.has(v)) {
            const seenSubEdges = seenEdges.get(v)!
            if (seenSubEdges.has(u)) {
                bend = seenSubEdges.get(u)!
                seenSubEdges.set(u, bend + 1)
                if (graph.flags.simple) {
                    continue
                }

                drawEdge(j, i, bend, true)
                continue
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

        drawEdge(i, j, bend)
    }
    // Draw vertices
    for (let i = 0; i < verticesArray.length; i++) {
        if (verticesArray[i].startsWith(INVISIBLE_VERTEX_PREFIX)) {
            continue
        }
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

function random() {
    return Math.random().toString(36).substring(2)
}

// https://www.geeksforgeeks.org/equation-of-circle-when-three-points-on-the-circle-are-given/
/**
 * Find the circle on which the given three points lie.
 * Returns [centerX, centerY, radius]
 */
function findCircle(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
): [number, number, number] {
    var x12 = x1 - x2
    var x13 = x1 - x3

    var y12 = y1 - y2
    var y13 = y1 - y3

    var y31 = y3 - y1
    var y21 = y2 - y1

    var x31 = x3 - x1
    var x21 = x2 - x1

    //x1^2 - x3^2
    var sx13 = Math.pow(x1, 2) - Math.pow(x3, 2)

    // y1^2 - y3^2
    var sy13 = Math.pow(y1, 2) - Math.pow(y3, 2)

    var sx21 = Math.pow(x2, 2) - Math.pow(x1, 2)
    var sy21 = Math.pow(y2, 2) - Math.pow(y1, 2)

    var f =
        (sx13 * x12 + sy13 * x12 + sx21 * x13 + sy21 * x13) /
        (2 * (y31 * x12 - y21 * x13))
    var g =
        (sx13 * y12 + sy13 * y12 + sx21 * y13 + sy21 * y13) /
        (2 * (x31 * y12 - x21 * y13))

    var c = -Math.pow(x1, 2) - Math.pow(y1, 2) - 2 * g * x1 - 2 * f * y1

    // eqn of circle be
    // x^2 + y^2 + 2*g*x + 2*f*y + c = 0
    // where centre is (h = -g, k = -f) and radius r
    // as r^2 = h^2 + k^2 - c
    var h = -g
    var k = -f
    var sqr_of_r = h * h + k * k - c

    // r is the radius
    var r = Math.sqrt(sqr_of_r)

    return [h, k, r]
}
