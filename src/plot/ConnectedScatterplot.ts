import * as d3 from "d3";
import {Selection} from "d3";
import {Plot} from "./plot.ts";

/**
 * A class to generate a connected scatterplot
 */
export class ConnectedScatterplot implements Plot {
    container: HTMLElement
    svg: Selection<SVGSVGElement, undefined, null, undefined> | null
    width: number
    height: number
    margin: number

    constructor(container: HTMLElement, width: number, height: number, margin: number) {
        this.container = container
        this.svg = null
        this.width = width
        this.height = height
        this.margin = margin
    }

    generate(data?: number[]): void {
        this.svg = d3.create('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr("viewBox", [0, 0, this.width, this.height])
            .attr("style", "max-width: 100%; height: auto;");


        if (data) {
            //if data is provided, add initial data to the plot
            this.update(data)
            return
        }

        //arbitrary axis
        const xAxis = d3.scaleLinear()
            .domain([0, 100])
            .range([this.margin, this.width - this.margin])

        const yAxis = d3.scaleLinear()
            .domain([0, 100])
            .range([this.height - this.margin, this.margin])

        this.generateAxis(this.svg, xAxis, yAxis)

        this.container.append(this.svg.node()!)
    }

    update(data: number[]): void {
        if (!this.svg) return

        //removes children of svg obj
        this.svg.selectAll('g').remove()

        const xAxis = d3.scaleLinear()
            .domain([data.length, 1])
            .range([this.margin, this.width - this.margin])

        const yAxis = d3.scaleLinear()
            .domain(d3.extent(data) as number[])
            .range([this.height - this.margin, this.margin])


        this.generateAxis(this.svg, xAxis, yAxis)

        //line
        this.svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5)
            .attr('d', d3.line<number>().x((_, i) => xAxis(i + 1)).y(d => yAxis(d)))

        //dots
        this.svg.append('g')
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5)
        .selectAll('circle')
        .data(data)
        .join('circle')
            .attr('cx', (_, i) => xAxis(i + 1))
            .attr('cy', yAxis)
            .attr('r', 3)


        this.container.append(this.svg.node()!)
    }

    /**
     * Generates and appends axis for the scatterplot
     *
     * @param svg the svg to add the axis to
     * @param xAxis the x-axis scale
     * @param yAxis the y-axis scale
     */
    generateAxis(svg: Selection<SVGSVGElement, undefined, null, undefined>, xAxis: d3.ScaleLinear<number, number>, yAxis: d3.ScaleLinear<number, number>) {
        svg.append('g')
            .attr('transform', `translate(0, ${this.height - this.margin})`)
            .call(d3.axisBottom(xAxis))
            //create grid
            .call(g => g.select('.domain').remove())
            .call(g => g.selectAll('.tick line').clone()
                .attr('y2', -this.height)
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
            .call(d3.axisLeft(yAxis))
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