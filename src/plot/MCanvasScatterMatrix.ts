//adaped from https://observablehq.com/@d3/brushable-scatterplot-matrix

import * as d3 from "d3";
import {Selection} from "d3";

/**
 * A class to generate a scatter matrix
 * It uses a svg to display the axis and the different cells
 * and a canvas to display the data points which results in better performance
 * since there are no millions of objects in the dom
 *
 * @param container the container to append the scatter matrix to
 * @param svg the svg to display the axis and the different cells
 * @param canvas the canvas to display the data points
 * @param context the context of the canvas
 * @param width the width of the scatter matrix
 * @param height the height of the scatter matrix
 * @param margin the margin between the cells
 */
export class MCanvasScatterMatrix {
    container: HTMLElement;
    svg: Selection<SVGSVGElement, undefined, null, undefined> | null;
    canvas: (HTMLCanvasElement | null)[]
    context: (CanvasRenderingContext2D | null | undefined)[]
    width: number;
    height: number;
    margin: number;

    constructor(container: HTMLElement, width: number, height: number, margin: number) {
        this.container = container
        this.width = width
        this.height = height
        this.margin = margin
        this.svg = null
        this.canvas = []
        this.context = []
    }

    /**
     * Generates the scatter matrix as empty plot
     * uses arbitrariy attributenames and scales for the cells
     */
    generate(): void {
        this.svg = this.generateSvg()
        if (!this.svg) return

        const attributes = ['attribute_0', 'attribute_1', 'attribute_2', 'attribute_3', 'attribute_4', 'attribute_5']

        const cellWidth = (this.width - (attributes.length + 1) * this.margin) / attributes.length + this.margin
        const cellHeight = (this.height - (attributes.length + 1) * this.margin) / attributes.length + this.margin

        //generate canvas
        this.generateCanvas(attributes.length, cellWidth, cellHeight)

        //horizontal scale
        const xScale = attributes.map(_ => d3.scaleLinear()
            .domain([0, 100])
            .rangeRound([this.margin / 2, cellWidth - this.margin / 2]))

        //vertical scale
        const yScale = xScale.map(x => x.copy()
            .range([cellHeight - this.margin / 2, this.margin / 2]))

        //add Axis
        this.addAxis(this.svg, attributes, cellWidth, cellHeight, xScale, yScale)

        //cenerate cells
        this.addCells(this.svg, attributes, cellWidth, cellHeight)

        //add attribute names
        this.addAttributeNames(this.svg, attributes, cellWidth, cellHeight)


        this.container.append(this.svg.node()!)
        const canvasContainer = document.createElement('div')
        canvasContainer.style.width = `${this.width}px`
        canvasContainer.style.height = `${this.height}px`
        this.container.append(canvasContainer!)
        this.canvas.forEach(c => {
            if(c && canvasContainer) canvasContainer.append(c)
        })
    }

    /**
     * Updates the scatter matrix with new data
     *
     * @param data the data to be displayed
     * @param attributes the attributes of the data set
     * @param clusterIndices the cluster indices of each data point
     */
    async update(data: number[][], attributes: string[], clusterIndices: number[]): Promise<void> {
        if(!this.svg) {
            this.svg = this.generateSvg()
            if(!this.svg) return
        }

        //removes children of svg obj
        this.svg.selectAll('g').remove()

        const cellWidth = (this.width - (attributes.length + 1) * this.margin) / attributes.length + this.margin
        const cellHeight = (this.height - (attributes.length + 1) * this.margin) / attributes.length + this.margin

        //horizontal scale
        const xScale = attributes.map((_, i) => d3.scaleLinear()
            // @ts-ignore
            .domain(d3.extent(data.map((value) => value[i])))
            .rangeRound([this.margin / 2, cellWidth - this.margin / 2]))

        //vertical scale
        const yScale = xScale.map(x => x.copy()
            .range([cellHeight - this.margin / 2, this.margin / 2]))

        //add Axis
        this.addAxis(this.svg, attributes, cellWidth, cellHeight, xScale, yScale)

        //cenerate cells
        this.addCells(this.svg, attributes, cellWidth, cellHeight)

        /*
        //reference (original try)
        add data points to cell
        cells.each(function ([i, j]) {
            if (i === j) return
            d3.select(this.parentElement).selectAll('circle')
                .data(data)
                .join('circle')
                .attr('cx', d => xScale[i](d[i]))
                .attr('cy', d => yScale[j](d[j]))
                .attr('r', 3)
                .attr('fill', 'white')
                .attr('stroke', 'blue')
                .attr('stroke-width', 1.5)
        })
        */

        this.context.clearRect(0, 0, this.width, this.height)

        /*
        // multiple webworkers
        const chunkSize = 100
        const chunks: number[][][] = [];
        for(let i = 0; i < data.length; i += chunkSize) {
            chunks.push(data.slice(i, i + chunkSize))
        }
        const dimensions = [this.attributes.length, this.attributes.length]
        const xDomains = xScale.map(x => x.domain())
        const yDomains = yScale.map(y => y.domain())
        const wMargin = this.margin

        const chunkPromises: Promise<any>[] = [];
        console.time('time to Plot')
        chunks.forEach(chunk => {
            const worker = new Worker('../renderWorker.js')

            const promise = new Promise((resolve, reject) => {
                worker.onmessage = (event) => {
                    const { imageData } = event.data
                    resolve(imageData)
                }
            })
            worker.postMessage({ chunk, dimensions, xDomains, yDomains, cellWidth, cellHeight, wMargin })
            chunkPromises.push(promise)
        })

        Promise.all(chunkPromises).then((imageDatas) => {
            imageDatas.forEach(imageData => {
                createImageBitmap(imageData).then((imageBitmap) => {
                    this.context?.drawImage(imageBitmap, 0, 0)
                })
            })
            console.timeEnd('time to Plot')
        })
        */

        // single webworker
        const worker = new Worker('../renderWorker.js')
        const dimensions = [attributes.length, attributes.length]
        const xDomains = xScale.map(x => x.domain())
        const yDomains = yScale.map(y => y.domain())
        const wMargin = this.margin

        console.time('time to Plot')
        worker.postMessage({ chunk: data, clusterIndices, dimensions, xDomains, yDomains, cellWidth, cellHeight, wMargin })
        worker.onmessage = (event) => {
            const { imageData } = event.data
            this.context?.putImageData(imageData, 0, 0)
            worker.terminate()
            console.timeEnd('time to Plot')
        }

        /*
        //async
        const chunkSize = 100
        const chunkPromises = []
        for(let i = 0; i < data.length; i += chunkSize) {
            chunkPromises.push(this.renderDataPoints(data.slice(i, i + chunkSize), cells, xScale, yScale, cellWidth, cellHeight))
        }
        await Promise.all(chunkPromises)

        naive
        cells.each(([i, j]) => {
            if (i === j) return
            data.forEach(d => {
                if(!this.context) return
                this.context.beginPath()
                this.context.arc(xScale[i](d[i]) + cellWidth * i + this.margin, yScale[j](d[j]) + cellHeight * j, 1.5, 0, 2 * Math.PI)
                this.context.fillStyle = 'white'
                this.context.fill()
                this.context.strokeStyle = 'black'
                this.context.stroke()
                this.context.closePath()
            })
        })
        */

        //add attribute names
        this.addAttributeNames(this.svg, attributes, cellWidth, cellHeight)

        this.container.append(this.svg.node()!)
        this.container.append(this.canvas.node()!)
    }

    /**
     * Generates a svg element to append to the container
     *
     * @returns the generated svg
     */
    generateSvg() {
        const svg = d3.create('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr("viewBox", [0, 0, this.width, this.height])
            .attr("style", "max-width: 100%; height: auto;")
            .style('overflow', 'visible')

        if(!svg) {
            console.error('svg could not be created')
            return null
        }
        return svg
    }

    /**
     * Generates a canvas element to append to the container
     *
     * @returns the generated canvas and context
     */
    generateCanvas(dimensions: number, cellWidth: number, cellHeight: number) {
        for(let x = 0; x < dimensions; x++) {
            for(let y = 0; y < dimensions; y++) {
                if(x >= y) continue

                const canvas = document.createElement('canvas')
                canvas.width = cellWidth
                canvas.height = cellHeight
                canvas.style.position = 'absolute'
                canvas.style.transform = `translate(${cellWidth * x + this.margin}px, ${cellHeight * y}px)`

                if(!canvas) {
                    console.error('canvas could not be created')
                    return null
                }

                const context = canvas.getContext('2d')

                if(!context) {
                    console.error('context could not be fetched')
                    return null
                }

                this.canvas.push(canvas)
                this.context.push(context)
            }
        }
    }

    /*
    async renderDataPoints(dataChunk: number[][], cells: any, xScale: any[], yScale: any[], cellWidth: number, cellHeight: number): Promise<void> {
        cells.each(([i, j]) => {
            if (i === j) return;
            dataChunk.forEach(d => {
                if(!this.context) return
                this.context.beginPath();
                this.context.arc(xScale[i](d[i]) + cellWidth * i + this.margin, yScale[j](d[j]) + cellHeight * j, 3, 0, 2 * Math.PI);
                this.context.fillStyle = 'white';
                this.context.fill();
                this.context.strokeStyle = 'black';
                this.context.stroke();
                this.context.closePath();
            });
        });
    }
    */

    /**
     * Generates and appends Axis to the cells
     *
     * @param svg the svg to add the axis to
     * @param attributes the attributes of the data set
     * @param cellWidth the width of the cells
     * @param cellHeight the height of the cells
     * @param xScale the horizontal scale
     * @param yScale the vertical scale
     */
    addAxis(svg: d3.Selection<SVGSVGElement, undefined, null, undefined>, attributes: string[], cellWidth: number, cellHeight: number,
            xScale: any, yScale: any) {
        //generate x-axis
        const self = this
        svg.append('g')
            .selectAll('g')
            .data(xScale)
            .join('g')
            .filter((_, i) => i < attributes.length - 1)
            .attr('transform', (_, i) => `translate(${i * cellWidth + this.margin}, ${this.height - this.margin})`)
            .each(function (x, i, arr) {
                // @ts-ignore
                d3.select(this).call(d3.axisBottom(x).ticks(5))
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
                d3.select(this).call(d3.axisLeft(y).ticks(5))
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
     * @param attributes the attributes of the data set
     * @param cellWidth the width of the cells
     * @param cellHeight the height of the cells
     */
    addCells(svg: Selection<SVGSVGElement, undefined, null, undefined>, attributes: string[], cellWidth: number, cellHeight: number) {
        return svg.append('g')
            .selectAll('g')
            .data(d3.cross(d3.range(attributes.length), d3.range(attributes.length)))
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
     * @param attributes the attributes of the data set
     * @param cellWidth the width of the cells
     * @param cellHeight the height of the cells
     */
    addAttributeNames(svg: Selection<SVGSVGElement, undefined, null, undefined>, attributes: string[], cellWidth: number, cellHeight: number) {
        svg.append('g')
            .style('font', "bold .7rem sans-serif")
            .style('pointer-events', 'none')
            .selectAll('text')
            .data(attributes)
            .join('text')
            .attr('transform', (_, i) => `translate(${i * cellWidth + this.margin}, ${i * cellHeight})`)
            .attr('x', cellWidth / 2)
            .attr('y', cellHeight / 2 + 4)
            .attr('text-anchor', 'middle')
            .attr('vertical-align', 'middle')
            .text(d => d)
    }

}