import { HexString } from "obsidian"

export interface KaleGraphSettings {
    codeBlockKeyword: string
    render: RenderSettings
}

export interface RenderSettings {
    backgroundColor: HexString
    vertexColor: HexString
    edgeColor: HexString
    bigRadius: number
    vertexRadius: number
    edgeThickness: number
    arrowSize: number
    bendiness: number
}


/**
 * Represents a graph.
 * 
 * `edges` is a list of indices in `vertices` where every other element is the
 * index of the vertex that the edge is from and to repectively.
 */
export interface GraphData {
    flags: Flags
    vertices: Array<Vertex>
    edges: Array<number>
}

export interface Flags {
    directed: boolean
    simple: boolean
    auto: boolean
}

export type Vertex = string

export interface CanvasProperties {
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
}