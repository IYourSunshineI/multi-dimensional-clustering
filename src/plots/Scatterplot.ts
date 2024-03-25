//adapted from https://observablehq.com/@d3/connected-scatterplot/2?intent=fork

import * as d3 from "d3";
import {Selection} from "d3";

/**
 * A class to generate a scatterplot
 *
 * @param container the container to append the scatterplot to
 * @param svg the svg to display the scatterplot
 * @param width the width of the scatterplot
 * @param height the height of the scatterplot
 * @param margin the margin of the scatterplot
 * @param connected whether the scatterplot should be connected
 */
export class Scatterplot {
    container: HTMLElement
    svg: Selection<SVGSVGElement, undefined, null, undefined> | null
    width: number
    height: number
    margin: number
    connected: boolean

    constructor(container: HTMLElement, width: number, height: number, margin: number, connected: boolean = false) {
        this.container = container
        this.svg = null
        this.width = width
        this.height = height
        this.margin = margin
        this.connected = connected
    }

    /**
     * Generates the scatterplot as empty plot
     * uses arbitrary scales
     */
    generate(): void {
        this.svg = this.generateSvg()
        if(!this.svg) return

        //arbitrary axis
        const xAxis = d3.scaleLinear()
            .domain([0, 100])
            .range([this.margin, this.width - this.margin])

        const yAxis = d3.scaleLinear()
            .domain([0, 100])
            .range([this.height - this.margin, this.margin])

        this.addAxis(this.svg, xAxis, yAxis)

        this.container.append(this.svg.node()!)
    }

    /**
     * Updates the scatterplot with new data
     *
     * @param data the data to update the scatterplot with
     */
    update(data: number[]): void {
        if(!this.svg) {
            this.svg = this.generateSvg()
            if(!this.svg) return
        }

        //removes children of svg obj
        this.svg.selectAll('g').remove()
        this.svg.selectAll('path').remove()

        const xScale = d3.scaleLinear()
            .domain([1, data.length])
            .range([this.margin, this.width - this.margin])

        const yScale = d3.scaleLinear()
            .domain(d3.extent(data) as number[])
            .range([this.height - this.margin, this.margin])


        this.addAxis(this.svg, xScale, yScale)

        if(this.connected) {
            //line
            this.svg.append('path')
                .datum(data)
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('stroke-width', 1.5)
                .attr('d', d3.line<number>().x((_, i) => xScale(i + 1)).y(d => yScale(d)))
        }

        //dots
        this.svg.append('g')
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5)
            .selectAll('circle')
            .data(data)
            .join('circle')
            .attr('cx', (_, i) => xScale(i + 1))
            .attr('cy', yScale)
            .attr('r', 3)


        this.container.append(this.svg.node()!)
    }

    /**
     * Generates a svg element to append to the container
     *
     * @returns the svg object
     */
    generateSvg() {
        const svg = d3.create('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr("viewBox", [0, 0, this.width, this.height])
            .attr("style", "max-width: 100%; height: auto;")
            .style('overflow', 'visible')

        if(!svg) {
            console.error('Could not create svg')
            return null
        }
        return svg
    }

    /**
     * Generates and appends axis for the scatterplot
     *
     * @param svg the svg to add the axis to
     * @param xScale the x-axis scale
     * @param yScale the y-axis scale
     */
    addAxis(svg: Selection<SVGSVGElement, undefined, null, undefined>, xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) {
        svg.append('g')
            .attr('transform', `translate(0, ${this.height - this.margin})`)
            .call(d3.axisBottom(xScale))
            //create grid
            .call(g => g.select('.domain').remove())
            .call(g => g.selectAll('.tick line').clone()
                .attr('y2', -this.height + this.margin)
                .attr('stroke-opacity', .1))
            //create axis name
            .call(g => g.append('text')
                .attr('x', this.width - 4)
                .attr('y', - 4)
                .attr('font-weight', 'bold')
                .attr('text-anchor', 'end')
                .attr('fill', 'currentColor')
                .text('# Clusters'))

        svg.append('g')
            .attr('transform', `translate(${this.margin}, 0)`)
            .call(d3.axisLeft(yScale))
            //create grid
            .call(g => g.select('.domain').remove())
            .call(g => g.selectAll('.tick line').clone()
                .attr('x2', this.width)
                .attr('stroke-opacity', .1))
            //create axis name
            .call(g => g.select('.tick:last-of-type text').clone()
                .attr('x', 4)
                .attr('text-weight', 'bold')
                .attr('text-anchor', 'start')
                .text('Inertia'))
    }
}