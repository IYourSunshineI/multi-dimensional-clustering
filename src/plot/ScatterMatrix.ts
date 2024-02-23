//taken and adaped from https://observablehq.com/@d3/brushable-scatterplot-matrix

import {Plot} from "./plot.ts";
import * as d3 from "d3";
import {Selection} from "d3";

/**
 * A class to generate a scatter matrix
 *
 * @param attributes the attributes of the data set
 */
export class ScatterMatrix implements Plot {
    container: HTMLElement;
    svg: Selection<SVGSVGElement, undefined, null, undefined> | null;
    width: number;
    height: number;
    margin: number;
    attributes: string[];

    constructor(container: HTMLElement, width: number, height: number, margin: number, attributes: string[] = ['attribute_0', 'attribute_1', 'attribute_2']) {
        this.container = container
        this.width = width
        this.height = height
        this.margin = margin
        this.svg = null
        this.attributes = attributes
    }

    generate(data?: number[][]): void {
        this.svg = d3.create('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr("viewBox", [0, 0, this.width, this.height])
            .attr("style", "max-width: 100%; height: auto;");

        if (data) {
            this.update(data)
            return
        }

        const cellWidth = (this.width - (this.attributes.length + 1) * this.margin) / this.attributes.length + this.margin
        const cellHeight = (this.height - (this.attributes.length + 1) * this.margin) / this.attributes.length + this.margin

        //horizontal scale
        const xScale = this.attributes.map(_ => d3.scaleLinear()
            .domain([0, 100])
            .rangeRound([this.margin / 2, cellWidth - this.margin / 2]))

        //vertical scale
        const yScale = xScale.map(x => x.copy()
            .range([cellHeight - this.margin / 2, this.margin / 2]))

        //add Axis
        this.addAxis(this.svg, cellWidth, cellHeight, xScale, yScale)

        //cenerate cells
        this.addCells(this.svg, cellWidth, cellHeight)

        //add attribute names
        this.addAttributeNames(this.svg, cellWidth, cellHeight)


        this.container.append(this.svg.node()!)
    }

    update(data: number[][]): void {
        if (!this.svg) return

        const cellWidth = (this.width - (this.attributes.length + 1) * this.margin) / this.attributes.length + this.margin
        const cellHeight = (this.height - (this.attributes.length + 1) * this.margin) / this.attributes.length + this.margin

        //horizontal scale
        const xScale = this.attributes.map((_, i) => d3.scaleLinear()
            // @ts-ignore
            .domain(d3.extent(data.map((value) => value[i])))
            .rangeRound([this.margin / 2, cellWidth - this.margin / 2]))

        //vertical scale
        const yScale = xScale.map(x => x.copy()
            .range([cellHeight - this.margin / 2, this.margin / 2]))

        //add Axis
        this.addAxis(this.svg, cellWidth, cellHeight, xScale, yScale)

        //cenerate cells
        const cells = this.addCells(this.svg, cellWidth, cellHeight)

        //add data points to cell
        cells.each(function ([i, j]) {
            if (i === j) return
            d3.select(this.parentElement).selectAll('circle')
                .data(data)
                .join('circle')
                .attr('cx', d => xScale[i](d[i]))
                .attr('cy', d => yScale[j](d[j]))
                .attr('r', 3)
                .attr('fill', 'white')
                .attr('stroke', 'black')
                .attr('stroke-width', 1.5)
        })

        //add attribute names
        this.addAttributeNames(this.svg, cellWidth, cellHeight)

        this.container.append(this.svg.node()!)
    }

    /**
     * Generates and appends Axis to the cells
     *
     * @param svg the svg to add the axis to
     * @param cellWidth the width of the cells
     * @param cellHeight the height of the cells
     * @param xScale the horizontal scale
     * @param yScale the vertical scale
     */
    addAxis(svg: d3.Selection<SVGSVGElement, undefined, null, undefined>, cellWidth: number, cellHeight: number,
            xScale: any, yScale: any) {
        //generate x-axis
        const self = this
        svg.append('g')
            .selectAll('g')
            .data(xScale)
            .join('g')
            .filter((_, i) => i < this.attributes.length - 1)
            .attr('transform', (_, i) => `translate(${i * cellWidth + this.margin}, ${this.height - this.margin})`)
            .each(function (x, i, arr) {
                // @ts-ignore
                d3.select(this).call(d3.axisBottom(x).ticks(6))
                    .call(g => g.select('.domain').remove())
                    .call(g => g.selectAll('.tick line').clone()
                        .attr('y2',  -cellHeight * (arr.length - i) + self.margin / 2 - 5)
                        .attr('stroke-opacity', 0.1))
            })

        //generate y-axis
        svg.append('g')
            .selectAll('g')
            .data(yScale)
            .join('g')
            .filter((_, i) => i !== 0)
            .attr('transform', (_, i) => `translate(${this.margin}, ${(i + 1) * cellHeight})`)
            .each(function (y, i) {
                // @ts-ignore
                d3.select(this).call(d3.axisLeft(y).ticks(6))
                    .call(g => g.select('.domain').remove())
                    .call(g => g.selectAll('.tick line').clone()
                        .attr('x2', cellWidth * (i + 1) - self.margin / 2 + 5)
                        .attr('stroke-opacity', 0.1))
            })
    }

    /**
     * Generates and appends cells to the svg
     *
     * @param svg the svg to add the cells to
     * @param cellWidth the width of the cells
     * @param cellHeight the height of the cells
     */
    addCells(svg: Selection<SVGSVGElement, undefined, null, undefined>, cellWidth: number, cellHeight: number) {
        return svg.append('g')
            .selectAll('g')
            .data(d3.cross(d3.range(this.attributes.length), d3.range(this.attributes.length)))
            .join('g')
            .filter(([i, j]) => i <= j)
            .attr('transform', ([i, j]) => `translate(${i * cellWidth + this.margin}, ${j * cellHeight})`)
            .append('rect')
            .attr('fill', 'none')
            .attr('stroke', 'rgba(0,0,0,.5)')
            .attr('x', this.margin / 2 - 5)
            .attr('y', this.margin / 2 - 5)
            .attr('width', cellWidth - this.margin + 10)
            .attr('height', cellHeight - this.margin + 10)
    }

    /**
     * Generates and appends attribute names to the svg
     *
     * @param svg the svg to add the attribute names to
     * @param cellWidth the width of the cells
     * @param cellHeight the height of the cells
     */
    addAttributeNames(svg: Selection<SVGSVGElement, undefined, null, undefined>, cellWidth: number, cellHeight: number) {
        svg.append('g')
            .style('font', "bold .7rem sans-serif")
            .style('pointer-events', 'none')
            .selectAll('text')
            .data(this.attributes)
            .join('text')
            .attr('transform', (_, i) => `translate(${i * cellWidth + this.margin}, ${i * cellHeight})`)
            .attr('x', cellWidth / 2)
            .attr('y', cellHeight / 2 + 4)
            .attr('text-anchor', 'middle')
            .attr('vertical-align', 'middle')
            .text(d => d)
    }

}