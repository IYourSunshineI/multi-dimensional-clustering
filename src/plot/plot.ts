import * as d3 from 'd3'

/**
 * Common interface for plots
 *
 * @param container the container holding the plot
 * @param svg the generated svg image
 * @param width the width of the plot
 * @param height the height of the plot
 * @param margin the margin of the plot
 */
export interface Plot {
    container: HTMLElement

    svg: d3.Selection<SVGSVGElement, undefined, null, undefined> | null

    width: number

    height: number

    margin: number

    /**
     * Generates and appends a svg element to the specified {@link container}.
     * If the initial data is provided in the parameter, it will get added to the
     * plot, otherwise the plot will be empty.
     *
     * @param data the initial data
     */
    generate(data?: number[]): void

    /**
     * Updates the data points in this plot
     * @param data the new datapoints
     */
    update(data: number[]) : void
}