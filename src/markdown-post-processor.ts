import { MarkdownPostProcessorContext } from "obsidian"
import { RenderSettings } from "./types"
import { parseSource } from "./parser"
import KaleGraphRenderer from "./graph-renderer"
import { renderError as showError } from "./errors"

export default function codeBlockPostProcessor(renderSettings: RenderSettings) {
    return (
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) => {
        let canvas: HTMLCanvasElement|null = null
        try {
            const graph = parseSource(source)

            canvas = el.createEl("canvas", {
                cls: "kale-graph-canvas",
            })
            canvas.width = 700
            canvas.height = 350

            const renderer = new KaleGraphRenderer(
                canvas,
                graph,
                renderSettings
            )
            renderer.draw()
        } catch (e) {
            if (canvas) {
                el.removeChild(canvas)
            }
            showError(el, e)
        }
    }
}
