import { cancelRender } from "./errors"
import { findCircle } from "./math"
import { INVISIBLE_VERTEX_PREFIX } from "./parser"
import { CanvasProperties, GraphData, RenderSettings, Vertex } from "./types"

/** Draws a kale graph to a canvas. */
export default class KaleGraphRenderer {
    canvas: HTMLCanvasElement
    graph: GraphData
    settings: RenderSettings

    constructor(
        canvas: HTMLCanvasElement,
        graph: GraphData,
        settings: RenderSettings
    ) {
        console.log(graph)
        this.canvas = canvas
        this.graph = graph
        this.settings = settings
    }

    getCanvasProperties(): CanvasProperties {
        const ctx = this.canvas.getContext("2d")
        if (!ctx) {
            cancelRender("Failed to get canvas context", true)
        }
        return {
            ctx: ctx!,
            width: this.canvas.width,
            height: this.canvas.height,
        }
    }

    draw(): HTMLCanvasElement {
        const { ctx, width, height } = this.getCanvasProperties()
        const { flags, vertices, edges } = this.graph

        // Draw background
        ctx.fillStyle = this.settings.backgroundColor
        ctx.fillRect(0, 0, width, height)

        // Draw edges
        const seenEdges: Map<number, Map<number, number>> = new Map()
        for (let i = 0; i < edges.length - 1; i += 2) {
            const fromIndex = edges[i]
            const toIndex = edges[i+1]
            const fromVertex = vertices[fromIndex]
            const toVertex = vertices[toIndex]

            if (!fromVertex || !toVertex) {
                cancelRender(`Undefined vertex in edge`, true)
            }

            // Disallow invisible vertices
            if (
                fromVertex.startsWith(INVISIBLE_VERTEX_PREFIX) ||
                toVertex.startsWith(INVISIBLE_VERTEX_PREFIX)
            ) {
                cancelRender("Edges may not be connected to invisible vertices")
            }

            // Draw edge with bend
            let bend = 0
            if (seenEdges.has(fromIndex)) {
                const seenSubEdges = seenEdges.get(fromIndex)!
                if (seenSubEdges.has(toIndex)) {
                    bend = seenSubEdges.get(toIndex)!
                    seenSubEdges.set(toIndex, bend + 1)
                    if (flags.simple) {
                        continue
                    }

                    this.drawEdge(fromIndex, toIndex, bend)
                    continue
                }
            }
            if (seenEdges.has(toIndex)) {
                const seenSubEdges = seenEdges.get(toIndex)!
                if (seenSubEdges.has(fromIndex)) {
                    bend = seenSubEdges.get(fromIndex)!
                    seenSubEdges.set(fromIndex, bend + 1)
                    if (flags.simple) {
                        continue
                    }

                    this.drawEdge(toIndex, fromIndex, bend, true)
                    continue
                }
            }
            if (bend === 0) {
                let seenSubEdges: Map<number, number>
                if (seenEdges.has(fromIndex)) {
                    seenSubEdges = seenEdges.get(fromIndex)!
                } else {
                    seenSubEdges = new Map()
                    seenEdges.set(fromIndex, seenSubEdges)
                }
                seenSubEdges.set(toIndex, 1)
            }

            this.drawEdge(fromIndex, toIndex, bend)
        }

        // Draw vertices
        for (let i = 0; i < vertices.length; i++) {
            if (vertices[i].startsWith(INVISIBLE_VERTEX_PREFIX)) {
                continue
            }
            this.drawVertex(i)
        }

        return this.canvas
    }

    getCenter(): [number, number] {
        const { width, height } = this.getCanvasProperties()

        // Center odd polygons
        const hasOddVertices = this.graph.vertices.length % 2 === 1
        const oddPolygonOffset = hasOddVertices
            ? (this.settings.bigRadius - this.vertexPosition(0)[1]) / 2
            : 0

        const centerX = width / 2
        const centerY = height / 2 + oddPolygonOffset

        return [centerX, centerY]
    }

    vertexPosition = (i: number) => {
        const { vertices } = this.graph

        const cornerAngle =
            (Math.PI * (2 - vertices.length)) / vertices.length / 2
        const angle = (2 * Math.PI * i) / vertices.length - cornerAngle

        const x = Math.cos(angle) * this.settings.bigRadius
        const y = Math.sin(angle) * this.settings.bigRadius
        return [x, y, angle]
    }

    drawVertex = (i: number) => {
        const { ctx } = this.getCanvasProperties()
        const [centerX, centerY] = this.getCenter()

        const [x, y] = this.vertexPosition(i)
        ctx.beginPath()
        ctx.fillStyle = this.settings.vertexColor
        ctx.arc(
            x + centerX,
            y + centerY,
            this.settings.vertexRadius,
            0,
            2 * Math.PI
        )
        ctx.fill()
        ctx.closePath()

        ctx.font = "20px O"
        ctx.strokeStyle = this.settings.vertexColor
        ctx.fillText(
            this.graph.vertices[i],
            x + centerX + this.settings.vertexRadius,
            y + centerY - this.settings.vertexRadius
        )
    }

    drawEdge = (
        i: number,
        j: number,
        bend: number = 0,
        reverse: boolean = false
    ) => {
        const { ctx } = this.getCanvasProperties()
        const [centerX, centerY] = this.getCenter()
        const { flags, vertices, edges } = this.graph

        const [iX, iY, vertexAngle] = this.vertexPosition(i)
        const [jX, jY] = this.vertexPosition(j)

        ctx.strokeStyle = this.settings.edgeColor
        ctx.lineWidth = this.settings.edgeThickness

        let d =
            i !== j
                ? this.settings.bendiness *
                  Math.ceil(bend / 2) *
                  2 *
                  (-1) ** bend
                : this.settings.bendiness * (bend + 1) * 2

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

                const x = this.settings.arrowSize * Math.cos(angle) + bentX + centerX
                const y = this.settings.arrowSize * Math.sin(angle) + bentY + centerY

                if (k == 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            }
            ctx.closePath()
            ctx.fillStyle = this.settings.edgeColor
            ctx.fill()
        }
    }
}
