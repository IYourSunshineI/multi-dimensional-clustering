//adaped from https://observablehq.com/@d3/brushable-scatterplot-matrix

import * as d3 from "d3";
import {Selection} from "d3";

/**
 * A class to generate a scatter matrix
 * It uses a svg to display the axis and the different cells
 * and multiple canvases to display the data points which results in better performance
 * since there are no millions of objects in the dom
 *
 * @param container the container to append the scatter matrix to
 * @param svg the svg to display the axis and the different cells
 * @param canvasContainer the container to append the canvases to
 * @param canvas the canvases to display the data points (one for each cell)
 * @param context the contexts of the canvases
 * @param width the width of the scatter matrix
 * @param height the height of the scatter matrix
 * @param margin the margin between the cells
 */
export class ScatterMatrix {
    container: HTMLElement;
    svg: Selection<SVGSVGElement, undefined, null, undefined> | null;
    canvasContainer: HTMLElement | null;
    canvas: (HTMLCanvasElement | null)[]
    context: (CanvasRenderingContext2D | null | undefined)[]
    width: number;
    height: number;
    margin: number;

    constructor(container: HTMLElement) {
        this.container = container
        this.canvasContainer = null
        this.width = container.clientWidth
        this.height = container.clientHeight
        this.margin = 15
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
    }

    /**
     * Updates the scatter matrix with new data
     *
     * @param data the data to be displayed
     * @param attributes the attributes of the data set
     * @param clusterIndices the cluster indices of each data point
     */
    async update(data: number[][], attributes: string[], clusterIndices: number[]): Promise<void> {
        //we call this at first so the svg is generated while the data is beeing prepared
        const prepedData = this.prepareData(data, attributes, clusterIndices)

        this.svg?.remove()
        this.svg = this.generateSvg()
        if(!this.svg) return

        //removes children of svg obj
        this.svg.selectAll('g').remove()

        const cellWidth = (this.width - (attributes.length + 1) * this.margin) / attributes.length + this.margin
        const cellHeight = (this.height - (attributes.length + 1) * this.margin) / attributes.length + this.margin

        //delete old stuff if there is any
        this.canvasContainer?.remove()
        this.canvas.forEach(c => c?.remove())
        this.context = []
        this.generateCanvas(attributes.length, cellWidth, cellHeight)

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
        cells.each(function ([i, j]) {
            if (i === j) return
            d3.select(this.parentElement).selectAll('circle')
                .data(data)
                .join('circle')
                .attr('cx', d => xScale[i](d[i]))
                .attr('cy', d => yScale[j](d[j]))
                .attr('r', 1)
                .attr('fill', 'white')
                .attr('stroke', 'blue')
                .attr('stroke-width', 1.5)
        })
        */

        // multiple webworkers
        const chunkPromises: Promise<any>[] = [];

        console.time('time to Plot')
        //await could be removed but for the timer to show the correct time it is needed
        await prepedData.then(data => {
            data.forEach((domainData, i) => {
                this.context[i]?.clearRect(0, 0, this.width, this.height)
                const worker = new Worker('../renderWorker.js')

                const promise = new Promise((resolve, _) => {
                    worker.onmessage = (event) => {
                        //when the worker is done put image data on corresponding canvas
                        const { imageData } = event.data
                        this.context[i]?.putImageData(imageData, 0, 0)
                        resolve('ok')
                        worker.terminate()
                    }
                })

                const xDomain = xScale[domainData[3][0]].domain()
                const yDomain = yScale[domainData[3][1]].domain()
                worker.postMessage({ data: domainData, xDomain, yDomain, cellWidth, cellHeight, margin: this.margin })
                chunkPromises.push(promise)
            })
        })

        //wait for all workers to finish, then take time
        Promise.all(chunkPromises).then(() => {
            console.timeEnd('time to Plot')
        })

        //add attribute names
        this.addAttributeNames(this.svg, attributes, cellWidth, cellHeight)

        this.container.append(this.svg.node()!)
    }

    /**
     * Prepares the data to be sent to the webworkers
     *
     * This function maps the 2-dimensional data array to a 3-dimensional data array.
     * The original 2-dimensional array is essentially the same as the raw csv file
     * The 3-dimensional array is a collection of 2-dimensional arrays, each containing a combination of two of the initial attributes.
     * The third dimension is used to determine which cell the combination corresponds to.
     *
     * @param data the data to be prepared
     * @param attributes the attributes of the data set
     * @param clusterIndices the cluster indices of each data point
     */
    async prepareData(data: number[][], attributes: string[], clusterIndices: number[]): Promise<number[][][]> {
        return new Promise<number[][][]>((resolve, _) => {
            console.time('prepare chunks')
            const columns = attributes.map((_, i) => data.map(row => row[i]))
            const prepedData: number[][][] = Array.from({length: (columns.length * (columns.length - 1) / 2)}, () => [])
            let index = 0
            for(let att1 = 0; att1 < columns.length; att1++) {
                for(let att2 = 0; att2 < columns.length; att2++) {
                    if(att1 >= att2) continue
                    const x = columns[att1]
                    const y = columns[att2]
                    prepedData[index].push(x)
                    prepedData[index].push(y)
                    prepedData[index].push(clusterIndices)
                    prepedData[index].push([att1, att2])
                    index++
                }
            }
            console.timeEnd('prepare chunks')

            resolve(prepedData)
        })
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
            .attr("style", "max-width: 100%; height: 100%;")
            .style('overflow', 'visible')

        if(!svg) {
            console.error('svg could not be created')
            return null
        }
        return svg
    }

    /**
     * Creates a canvas container and appends one canvas for each cell to it.
     * The canvases and the corresponding contexts are stored in the corresponding arrays
     *
     * @param dimensions the number of dimensions of the data set
     * @param cellWidth the width of the cells
     * @param cellHeight the height of the cells
     */
    generateCanvas(dimensions: number, cellWidth: number, cellHeight: number): void {
        const canvasContainer = document.createElement('div')
        canvasContainer.id = 'canvasContainer'
        canvasContainer.style.width = `${this.width}px`
        canvasContainer.style.height = `${this.height}px`
        this.container.append(canvasContainer!)

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
                }

                const context = canvas.getContext('2d')

                if(!context) {
                    console.error('context could not be fetched')
                }

                canvasContainer.append(canvas)
                this.canvas.push(canvas)
                this.context.push(context)
            }
        }
        this.canvasContainer = canvasContainer
    }

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