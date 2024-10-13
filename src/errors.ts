/**
 * Base class used to identify Kale Graph errors.
 */
export abstract class KaleError extends Error {}

/**
 * Used to declare that something went wrong while rendering a kale graph.
 */
export class RenderError extends KaleError {
    name = "RenderError"
}
/**
 * Used to declare that something went wrong while rendering a kale graph which
 * was not caused invalid user input/configuration.
 */
export class UnexpectedRenderError extends RenderError {
    name = "UnexpectedRenderError"
}

/** Shorthand to throw a `RenderError`. */
export function cancelRender(message?: string, unexpected: boolean = false) {
    throw new (unexpected ? UnexpectedRenderError : RenderError)(message)
}

/**
 * Used to declare that something went wrong while parsing kale code.
 */
export class ParseError extends KaleError {
    name = "ParseError"
}
/**
 * Used to declare that something went wrong while parsing kale code which was
 * not caused invalid user input/configuration.
 */
export class UnexpectedParseError extends ParseError {
    name = "UnexpectedParseError"
}

/** Shorthand to throw a `ParseError`. */
export function cancelParse(message?: string, unexpected: boolean = false) {
    throw new (unexpected ? UnexpectedParseError : ParseError)(message)
}

export function renderError(el: Element, e: Error): HTMLElement {
    const error: HTMLParagraphElement = el.createEl("p", {
        cls: "kale-graph-error",
    })
    if (e instanceof RenderError) {
        if (e instanceof UnexpectedRenderError) {
            error.setText("An unexpected error occured while rendering graph:")
            error.createEl("pre", {
                text: e.message,
            })

            promptReport(error)
        } else {
            error.setText("An error occured while rendering graph:")
            error.createEl("pre", {
                text: e.message,
            })
        }
    } else if (e instanceof ParseError) {
        if (e instanceof UnexpectedParseError) {
            error.setText(
                "An unexpected error occured while parsing kale code:"
            )
            error.createEl("pre", {
                text: e.message,
            })
            promptReport(error)
        } else {
            error.setText("An error occured while parsing kale code:")
            error.createEl("pre", {
                text: e.message,
            })
        }
    } else {
        error.setText("An unexpected error occured:")
        error.createEl("pre", {
            text: e.stack,
        })
        promptReport(error)
    }

    return error
}

function promptReport(el: Element) {
    const report = el.createEl("p", {
        text: "Please ",
    })
    report.createEl("a", {
        href: "https://github.com/olillin/kale-graph/issues/new?assignees=&labels=bug&projects=&template=bug_report.md&title=",
        text: "report this issue on GitHub",
    })
}
