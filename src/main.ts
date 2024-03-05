/**
 * This is the main file of the application.
 * It creates the initial empty graphs and handles the file selection, attribute selection, data preparation and clustering.
 */

import {BarChart} from "./plot/BarChart.ts";
import {Scatterplot} from "./plot/Scatterplot.ts";
import {ScatterMatrix} from "./plot/ScatterMatrix.ts";
import {CsvParser} from "./utils/CsvParser.ts";

const elbowDomObj = document.getElementById('elbow') as HTMLElement
const timelineDomObj = document.getElementById('timeline') as HTMLElement
const scattermatrixDomObj = document.getElementById('scatterMatrix') as HTMLElement
const attributeSelectorDomObj = document.getElementById('attributeSelector') as HTMLElement
const attributesToClusterDomObj = document.getElementById('attributesToCluster') as HTMLElement
const timeattributesDomObj = document.getElementById('timeattribute') as HTMLElement

let elbow: Scatterplot
let timeline: BarChart
let scattermatrix: ScatterMatrix

let attributeSelection: Map<number, boolean>
let csvParser: CsvParser


//initialise all graphs
document.addEventListener('DOMContentLoaded', () => {
    elbow = new Scatterplot(elbowDomObj, 500, 300, 30, true)
    elbow.generate()

    timeline = new BarChart(timelineDomObj, 850, 350, 30)
    timeline.generate()

    scattermatrix = new ScatterMatrix(scattermatrixDomObj, 850, 850, 15)
    scattermatrix.generate()
})

/**
 * This function is called when the user selects a file from the dropdown menu and starts the clustering process
 * with selecting the attributes to cluster on.
 *
 * @param filename The name of the file to be loaded
 */
export async function attributeSelector(filename: string): Promise<void> {
    attributeSelection = new Map<number, boolean>()
    //parse data
    csvParser = new CsvParser(filename + '.csv')
    csvParser.parse().then(() => {

        //attribute selector
        csvParser.attributes.forEach((attr, index) => {
            attributesToClusterDomObj.append(createCheckbox(attr, index, true))
            timeattributesDomObj.append(createCheckbox(attr, index, false))
        })
        attributeSelectorDomObj.hidden = false
    })
}

/**
 * A wrapper function to hide the attribute selector
 * when the clustering process gets cancelled.
 */
export function cancelClustering() {
    hideAttributeSelector()
}

/**
 * This function is called when the user has selected the
 * attributes to cluster on and starts the clustering process.
 */
export async function verifyClustering() {
    hideAttributeSelector()
    //data prep
    const prepedData = prepareData()
    //clustering
    console.time('kmeans')
    const promises = dispatchClusterWorkers(prepedData, 100)
    //elbow
    //TODO: implement elbow method
    //presentation scattermatrix
    const attributeNames = csvParser.attributes.map((attr, index) => attributeSelection.get(index) ? attr : null)
        .filter(attr => attr !== null) as string[]

    Promise.all(promises).then((result) => {
        console.timeEnd('kmeans')
        scattermatrix.update(prepedData, attributeNames, result[3][1])
    }).catch((error) => {
        console.error(error)
    })
    //timeline
    //TODO: implement timeline
}

/**
 * This function dispatches the clustering process to the cluster workers.
 * Each worker is responsible for two differnt k values. (1, 10), (2, 9), (3, 8), (4, 7), (5, 6)
 * With this setup the process was measured to be the fastest.
 *
 * @param data the data to be clustered
 * @param maxIterations the maximum number of iterations for the kmeans algorithm
 * @returns an two-dimensional array of the cluster indices for the different k values
 */
function dispatchClusterWorkers(data: any[][], maxIterations: number): Promise<any>[] {
    const clusterPromises = []
    for(let i = 1; i <= 10; i += 2) {
        const promise = new Promise((resolve, reject) => {
            const worker = new Worker('public/clusterWorker.js', {type: 'module'})
            worker.postMessage({data: data, k: i, maxIterations: maxIterations})
            worker.onmessage = (event) => {
                const {clusterIndices} = event.data
                resolve(clusterIndices)
                worker.terminate()
            }
            worker.onerror = (event) => {
                reject(event.message)
            }
        })
        clusterPromises.push(promise)
    }
    return clusterPromises
}

/**
 * This function prepares the data for the clustering process.
 * It filters the data according to the selected attributes.
 *
 * @returns The data to be clustered
 */
function prepareData(): any[][] {
    console.time('prepareData')
    let indices: number[] = []
    attributeSelection.forEach((value, key) => {
        if(value) {
            indices.push(key)
        } else {
            attributeSelection.delete(key)
        }
    })
    const result = csvParser.data.map(d => indices.map(index => d[index]))
    console.timeEnd('prepareData')
    return result
}

/**
 * This function hides the attribute selector and clears the checkboxes.
 */
function hideAttributeSelector() {
    attributeSelectorDomObj.hidden = true
    attributesToClusterDomObj.innerHTML = ''
    timeattributesDomObj.innerHTML = ''
}

/**
 * This function creates a checkbox for the attribute selection.
 *
 * @param attribute the name of the attribute
 * @param index the index of the attribute
 * @param forClustering whether the checkbox is for clustering or not
 */
function createCheckbox(attribute: string, index:number, forClustering: boolean): HTMLDivElement {
    const div = document.createElement('div')
    const input = document.createElement('input')
    if(forClustering) {
        input.id = 'att_' + index
        input.name = 'att_' + attribute
        attributeSelection.set(index, false)
        input.addEventListener('change', (event) => callback(event.target as HTMLInputElement))
    } else {
        input.id = 'time_' + attribute
    }
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