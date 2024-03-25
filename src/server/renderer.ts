import {FakeImageData} from "../utils/RenderResult.js";
import * as d3 from "d3";
import {colors} from "../utils/Colors.js";
import {StreamCombiner} from "../utils/StreamCombiner.js";

/**
 * This function starts the rendering process
 *
 * @param path the path to the normalized data
 * @param clusterResultPath the path to the clustering result
 * @param selectedAttributeIndices the indices of the selected attributes
 * @param k the number of clusters
 * @param width the width of the canvas
 * @param height the height of the canvas
 */
export async function renderScatterCanvases(path: string, clusterResultPath: string, selectedAttributeIndices: number[], k: number, width: number, height: number) {
    console.time('render')

    const margin = 15
    const cellWidth = Math.trunc((width - (selectedAttributeIndices.length + 1) * margin) / selectedAttributeIndices.length + margin)
    const cellHeight = Math.trunc((height - (selectedAttributeIndices.length + 1) * margin) / selectedAttributeIndices.length + margin)

    const cellAttributes: number[][] = []
    for (let att1 = 0; att1 < selectedAttributeIndices.length; att1++) {
        for (let att2 = att1 + 1; att2 < selectedAttributeIndices.length; att2++) {
            cellAttributes.push([selectedAttributeIndices[att1], selectedAttributeIndices[att2]])
        }
    }

    const results: FakeImageData[] = await render(path, clusterResultPath, cellAttributes, margin, cellWidth, cellHeight)
    console.timeEnd('render')
    return results
}

/**
 * This function renders the cells.
 *
 * @param path the path to the normalized data
 * @param clusterResultPath the path to the clustering result
 * @param selectedAttributeIndices the indices of the selected attributes
 * @param margin the margin of the canvas
 * @param cellWidth the width of the cell
 * @param cellHeight the height of the cell
 */
async function render(path: string, clusterResultPath: string, selectedAttributeIndices: number[][], margin: number, cellWidth: number, cellHeight: number): Promise<FakeImageData[]> {
    const xScale = d3.scaleLinear().domain([0, 1]).range([margin / 2, cellWidth - margin / 2])
    const yScale = d3.scaleLinear().domain([0, 1]).range([cellHeight - margin / 2, margin / 2])

    const pointSize = 2
    const occupied = Array.from({length: selectedAttributeIndices.length}, () => {
        return Array.from({length: cellWidth * cellHeight}, () => false)
    })
    const imageDatas: FakeImageData[] = Array.from({length: selectedAttributeIndices.length}, () => {
        return {
            data: Array.from({length: cellWidth * cellHeight * 4}) as number[],
            colorSpace: 'srgb',
            width: cellWidth,
            height: cellHeight
        }
    })

    const stream = await new StreamCombiner(path, clusterResultPath).getCombinedStream()
    let lineNumber = -2
    stream.on('line', (rawLine: string) => {
        lineNumber++
        if (lineNumber === -1) return

        const data = rawLine.split(',')
        const clusterIndex = parseInt(data[data.length - 1])
        const color = colors[clusterIndex]
        for(let i = 0; i < selectedAttributeIndices.length; i++) {
            const x = Math.round(xScale(parseFloat(data[selectedAttributeIndices[i][0]])))
            const y = Math.round(yScale(parseFloat(data[selectedAttributeIndices[i][1]])))

            const index = y * cellWidth + x
            if (occupied[i][index]) {
                continue
            }

            renderAsCircle(imageDatas[i], x, y, color, pointSize, cellWidth, cellHeight)
            occupied[i][index] = true
        }
    })

    return new Promise<FakeImageData[]>((resolve) => {
        stream.on('close', () => {
            resolve(imageDatas)
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