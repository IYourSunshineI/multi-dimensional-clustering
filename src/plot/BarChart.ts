//adapted from https://d3-graph-gallery.com/graph/barplot_stacked_basicWide.html

import {Plot} from "./Plot.ts";
import * as d3 from "d3";
import {Selection} from "d3";
import {TimeDataGroup} from "../objects/TimeDataGroup.ts";

export class BarChart implements Plot {
    container: HTMLElement;
    svg: Selection<SVGSVGElement, undefined, null, undefined> | null;
    width: number;
    height: number;
    margin: number;

    constructor(container: HTMLElement, width: number, height: number, margin: number) {
        this.container = container
        this.svg = null
        this.width = width
        this.height = height
        this.margin = margin
    }

    generate(data?: TimeDataGroup[]): void {
        this.svg = d3.create('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr("viewBox", [0, 0, this.width, this.height])
            .attr("style", "max-width: 100%; height: auto;")

        if (data) {
            this.update(data)
            return
        }

        const xScale = d3.scaleBand()
            .domain(['day1', 'day2', 'day3', 'day4', 'day5'])
            .range([this.margin, this.width - this.margin]);

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([this.height - this.margin, this.margin]);

        this.addAxis(this.svg, xScale, yScale)

        this.container.append(this.svg.node()!)
    }

    update(data: TimeDataGroup[]): void {
        if(!this.svg) return

        //removes children of svg obj
        this.svg.selectAll('g').remove()

        const xScale = d3.scaleBand()
            .domain(data.map(value => value.timestamp))
            .range([this.margin, this.width - this.margin])

        const yScale = d3.scaleLinear()
            .domain([0,
                //takes the first timestamp and sums up all the counts (since we are not losing datapoints from one day to the other)
                data[0].countPerCluster.reduce((a, b) => a + b, 0)])
            .range([this.height - this.margin, this.margin])

        this.addAxis(this.svg, xScale, yScale)

        const color = d3.scaleOrdinal()
            .domain(['0', data[0].countPerCluster.length.toString()])
            .range(d3.schemeCategory10)

        const stackedData = d3.stack()
            // @ts-ignore
            //takes the clusterIndices as keys (all datapoints have the same amount of clusters)
            .keys(data[0].countPerCluster.map((value, index) => index))
            // @ts-ignore
            (data.map(value => value.countPerCluster))

        this.svg.append('g')
            .selectAll('g')
            .data(stackedData)
            .join('g')
            //@ts-ignore
            .attr('fill', d => color(d.key))
            .selectAll('rect')
            .data(d => d)
            .join('rect')
            .attr('x', (_, i) => xScale(data[i].timestamp)! + 10)
            .attr('y', d => yScale(d[1]))
            .attr('height', d => yScale(d[0]) - yScale(d[1]))
            .attr('width', xScale.bandwidth() - 20)
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5)

        this.container.append(this.svg.node()!)
    }



    /**
     * Generates and appends axis for the scatterplot
     *
     * @param svg the svg to add the axis to
     * @param xScale the x-axis scale
     * @param yScale the y-axis scale
     */
    addAxis(svg: Selection<SVGSVGElement, undefined, null, undefined>, xScale: d3.ScaleBand<string>, yScale: d3.ScaleLinear<number, number>) {
        svg.append('g')
            .attr('transform', `translate(0, ${this.height - this.margin})`)
            .call(d3.axisBottom(xScale))
            .call(g => g.select('.domain').remove())

        svg.append('g')
            .attr('transform', `translate(${this.margin}, 0)`)
            .call(d3.axisLeft(yScale))
            .call(g => g.select('.domain').remove())
            .call(g => g.selectAll('.tick line').clone()
                .attr('x2', this.width)
                .attr('stroke-opacity', 0.1))
    }
}