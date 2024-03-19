/**
 * This is the main file of the application.
 * It creates the initial empty graphs and handles the file selection, attribute selection, data preparation and clustering.
 */

import {BarChart} from "../plots/BarChart.ts";
import {Scatterplot} from "../plots/Scatterplot.ts";
import {ScatterMatrix} from "../plots/ScatterMatrix.ts";
import {cluster, getAttributes, getFilenames, getTimeline, render} from "./backendService.ts";
import {ElbowResult} from "../utils/ElbowResult.js";
import {FakeImageData} from "../utils/RenderResult.js";
import {TimeSpan} from "../utils/TimeSpan.js";

const elbowDomObj = document.getElementById('elbow') as HTMLElement
const timelineDomObj = document.getElementById('timeline') as HTMLElement
const scattermatrixDomObj = document.getElementById('scatterMatrix') as HTMLElement
const attributeSelectorDomObj = document.getElementById('attributeSelector') as HTMLElement
const attributesToClusterDomObj = document.getElementById('attributesToCluster') as HTMLElement
const timeSpanDropdown = document.getElementById('timeSpanSelect') as HTMLSelectElement

let elbow: Scatterplot
let timeline: BarChart
let scattermatrix: ScatterMatrix

let attributeSelection: Map<number, boolean>

let currentFileName: string
let currentElbowResult: ElbowResult
let currentAttributeIndices: number[]


//initialise all graphs
document.addEventListener('DOMContentLoaded', () => {
    elbow = new Scatterplot(elbowDomObj, 500, 300, 30, true)
    elbow.generate()

    timeline = new BarChart(timelineDomObj, 850, 350, 30)
    timeline.generate()

    scattermatrix = new ScatterMatrix(scattermatrixDomObj)
    scattermatrix.generate()

    currentFileName = ''
    currentAttributeIndices = []

    //get all filenames and populate dropdown
    getFilenames().then((filenames: string[]) => {
        const dropdown = document.getElementById('filesSelect') as HTMLSelectElement
        filenames.forEach(filename => {
            const option = document.createElement('option')
            option.value = filename
            option.textContent = filename
            dropdown.append(option)
        })
    })

    //populate dropdown with TimeSpans
    for (const key in TimeSpan) {
        if (!isNaN(Number(key))) {
            const option = document.createElement('option')
            option.value = key
            option.textContent = TimeSpan[key]
            timeSpanDropdown.append(option)
        }
    }
})

/**
 * This function is called when the user selects a file from the dropdown menu and starts the clustering process
 * with selecting the attributes to cluster on.
 *
 * @param filename The name of the file to be loaded
 */
export async function attributeSelector(filename: string): Promise<void> {
    if (currentFileName === filename) {
        attributeSelectorDomObj.hidden = false
        return
    }

    attributeSelection = new Map<number, boolean>()
    attributesToClusterDomObj.innerHTML = ''
    currentFileName = filename
    //parse data
    getAttributes(filename).then((attributes: string[]) => {
        attributes.forEach((attr, index) => {
            attributesToClusterDomObj.append(createCheckbox(attr, index))
        })
        attributeSelectorDomObj.hidden = false
    })
}

/**
 * A wrapper function to hide the attribute selector
 * when the clustering process gets cancelled.
 */
export function cancelClustering() {
    attributeSelectorDomObj.hidden = true
}

/**
 * This function is called when the user has selected the
 * attributes to cluster on and starts the clustering process.
 *
 * @param k The number of clusters to be created
 * @param maxIterations The maximum number of iterations for the clustering algorithm
 * @param batchSize The size of the batch to use for the clustering algorithm
 */
export async function verifyClustering(k: number, maxIterations: number, batchSize: number) {
    attributeSelectorDomObj.hidden = true

    //data prep
    let indices: number[] = []
    attributeSelection.forEach((value, key) => {
        if (value) {
            indices.push(key)
        } else {
            attributeSelection.delete(key)
        }
    })
    //sort indices so caching in backend works
    indices.sort((a, b) => a - b)
    currentAttributeIndices = indices

    //clustering
    console.time('serverTime')
    const promise = cluster(currentFileName, indices, maxIterations, batchSize)
    //presentation
    promise.then(async (result: ElbowResult) => {
        console.timeEnd('serverTime')
        currentElbowResult = result

        //elbow (since the elbow does not change with different k, we only need to update once the clustering is done)
        const elbowData = Array.from({length: currentElbowResult.k.length}).fill(0) as number[]
        currentElbowResult.k.forEach(value => {
            elbowData[value] = currentElbowResult.wcss[value - 1]
        })
        elbow.update(elbowData.slice(1))

        await updateTimeline(parseInt(timeSpanDropdown.value), k, maxIterations, batchSize)
        updateScatterMatrix(k, maxIterations, batchSize)
    })
}

/**
 * This function updates the scatter matrix with the new clustering result and the given k.
 *
 * @param k The number of clusters used for the clustering
 * @param maxIterations The maximum number of iterations for the clustering algorithm
 * @param batchSize The size of the batch to use for the clustering algorithm
 */
export async function updateScatterMatrix(k: number, maxIterations: number, batchSize: number) {
    if (!currentElbowResult) return
    //render
    const imageData: FakeImageData[] = await render(currentFileName, currentAttributeIndices, maxIterations, batchSize, k, scattermatrix.width, scattermatrix.height)
    //scattermatrix
    scattermatrix.update(imageData, currentElbowResult.attributeNames)
}

/**
 * This function updates the timeline with the new clustering result and the given time span.
 *
 * @param timeSpan The time span to be used for the timeline
 * @param k The number of clusters used for the clustering
 * @param maxIterations The maximum number of iterations for the clustering algorithm
 * @param batchSize The size of the batch to use for the clustering algorithm
 */
export async function updateTimeline(timeSpan: number, k: number, maxIterations: number, batchSize: number) {
    //timeline
    const timeLineData = await getTimeline(currentFileName, currentAttributeIndices, maxIterations, batchSize, k, timeSpan)
    timeline.update(timeLineData)
}

/**
 * This function creates a checkbox for the attribute selection.
 *
 * @param attribute the name of the attribute
 * @param index the index of the attribute
 */
function createCheckbox(attribute: string, index: number): HTMLDivElement {
    const div = document.createElement('div')
    const input = document.createElement('input')
    input.id = 'att_' + index
    input.name = 'att_' + attribute
    attributeSelection.set(index, false)
    input.addEventListener('change', (event) => callback(event.target as HTMLInputElement))
    input.type = 'checkbox'
    const label = document.createElement('label')
    label.htmlFor = input.id
    label.textContent = attribute
    div.append(input)
    div.append(label)
    return div
}

/**
 * This function is called when a checkbox is clicked and updates the attribute selection.
 *
 * @param checkbox the checkbox that was clicked
 */
function callback(checkbox: HTMLInputElement) {
    const index = parseInt(checkbox.id.slice(4), 10)
    attributeSelection.set(index, checkbox.checked)
}