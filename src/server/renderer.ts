import {Worker, parentPort, workerData} from "worker_threads";
import {RenderResult, FakeImageData} from "../utils/RenderResult.js";
import * as d3 from "d3";
import * as fs from "fs";
import * as readline from "readline";
import {colors} from "../utils/Colors.js";

const __filename = new URL(import.meta.url);

/**
 * This function is called when the worker is started.
 * Starts the rendering process in one cell of the scatter matrix.
 */
parentPort?.on("message", async () => {
    const imageData = await render(workerData.path, workerData.selectedAttributeIndices, workerData.clusterIndices, workerData.margin, workerData.cellWidth, workerData.cellHeight)
    parentPort?.postMessage({
        ImageData: imageData,
        index: workerData.index
    })
})

/**
 * This function start one worker for each scatter matrix cell which then renders its cell.
 *
 * @param path the path to the normalized data
 * @param selectedAttributeIndices the indices of the selected attributes
 * @param clusterIndices the indices of the clusters
 * @param width the width of the canvas
 * @param height the height of the canvas
 */
export async function renderScatterCanvases(path: string, selectedAttributeIndices: number[], clusterIndices: number[], width: number, height: number) {
    console.time('render')

    const margin = 15
    const cellWidth = (width - (selectedAttributeIndices.length + 1) * margin) / selectedAttributeIndices.length + margin
    const cellHeight = (height - (selectedAttributeIndices.length + 1) * margin) / selectedAttributeIndices.length + margin

    const cellAttributes: number[][] = []
    for (let att1 = 0; att1 < selectedAttributeIndices.length; att1++) {
        for (let att2 = att1 + 1; att2 < selectedAttributeIndices.length; att2++) {
            cellAttributes.push([selectedAttributeIndices[att1], selectedAttributeIndices[att2]])
        }
    }

    const promises: Promise<RenderResult>[] = []

    cellAttributes.forEach((selectedAttributeIndices, index) => {
        const worker = new Worker(__filename, {
            workerData: {
                path,
                selectedAttributeIndices,
                clusterIndices,
                margin,
                cellWidth,
                cellHeight,
                index
            }
        })
        promises.push(new Promise<RenderResult>((resolve, reject) => {
            worker.on("message", (message) => {
                resolve(message)
                worker.terminate()
            })
            worker.on("error", (error) => {
                reject(error)
            })
        }))
        worker.postMessage('start')
    })

    return new Promise<FakeImageData[]>((resolve, reject) => {
        Promise.all(promises).then((values) => {
            values.sort((a, b) => a.index - b.index)
            resolve(values.map((value) => value.ImageData))
            console.timeEnd('render')
        }).catch((error) => {
            reject(error)
        })
    })
}

/**
 * This function renders one cell.
 *
 * @param path the path to the normalized data
 * @param selectedAttributeIndices the indices of the selected attributes (in this case only two)
 * @param clusterIndices the indices of the clusters
 * @param margin the margin of the canvas
 * @param cellWidth the width of the cell
 * @param cellHeight the height of the cell
 */
async function render(path: string, selectedAttributeIndices: number[], clusterIndices: number[], margin: number, cellWidth: number, cellHeight: number) {
    const xScale = d3.scaleLinear().domain([0, 1]).range([margin / 2, cellWidth - margin / 2])
    const yScale = d3.scaleLinear().domain([0, 1]).range([cellHeight - margin / 2, margin / 2])

    const pointSize = 2
    const imageData: FakeImageData = {
        data: Array.from({length: 1080 * 1080 * 4}).fill(0) as number[],
        colorSpace: 'srgb',
        width: 1080,
        height: 1080
    }

    const fileStream = fs.createReadStream(path)
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    let lineNumber = -2
    rl.on('line', (rawLine) => {
        lineNumber++
        if (lineNumber === -1) return

        const data = rawLine.split(',').filter((_, index) => selectedAttributeIndices.includes(index))
            .map(parseFloat)
            .filter((value) => !isNaN(value))

        const x = Math.round(xScale(data[0]))
        const y = Math.round(yScale(data[1]))
        const color = colors[clusterIndices[lineNumber]]

        renderAsCircle(imageData, x, y, color, pointSize, 1080, 1080)
    })

    return new Promise<FakeImageData>((resolve) => {
        rl.on('close', () => {
            rl.close()
            fileStream.close()
            resolve(imageData)
        })
    })
}

/**
 * This function renders a circle on the canvas.
 *
 * @param imageData the imageData of the canvas
 * @param x the x coordinate of the circle
 * @param y the y coordinate of the circle
 * @param color the color of the circle
 * @param pointSize the size of the circle
 * @param width the width of the canvas
 * @param height the height of the canvas
 */
function renderAsCircle(imageData: FakeImageData, x: number, y: number, color: string, pointSize: number, width: number, height: number) {
    for (let dx = -pointSize; dx <= pointSize; dx++) {
        for (let dy = -pointSize; dy <= pointSize; dy++) {
            const px = x + dx;
            const py = y + dy;
            if (px >= 0 && px < width && py >= 0 && py < height) {
                const distanceSquared = dx * dx + dy * dy;
                if (distanceSquared <= pointSize * pointSize) {
                    const i = (py * width + px) * 4;
                    imageData.data[i] = parseInt(color.substring(1, 3), 16); // R
                    imageData.data[i + 1] = parseInt(color.substring(3, 5), 16); // G
                    imageData.data[i + 2] = parseInt(color.substring(5, 7), 16); // B
                    imageData.data[i + 3] = 255; // A
                }
            }
        }
    }
}