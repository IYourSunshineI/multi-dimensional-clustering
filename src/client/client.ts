/**
 * This is the main file of the application.
 * It creates the initial empty graphs and handles the file selection, attribute selection, data preparation and clustering.
 */

import {BarChart} from "../plots/BarChart.ts";
import {Scatterplot} from "../plots/Scatterplot.ts";
import {ScatterMatrix} from "../plots/ScatterMatrix.ts";
import {getAttributes, cluster} from "./backendService.ts";
import {ClusterResult} from "../utils/ClusterResult.js";

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

let currentFileName: string


//initialise all graphs
document.addEventListener('DOMContentLoaded', () => {
    elbow = new Scatterplot(elbowDomObj, 500, 300, 30, true)
    elbow.generate()

    timeline = new BarChart(timelineDomObj, 850, 350, 30)
    timeline.generate()

    scattermatrix = new ScatterMatrix(scattermatrixDomObj, 850, 850, 15)
    scattermatrix.generate()

    currentFileName = ''
})

/**
 * This function is called when the user selects a file from the dropdown menu and starts the clustering process
 * with selecting the attributes to cluster on.
 *
 * @param filename The name of the file to be loaded
 */
export async function attributeSelector(filename: string): Promise<void> {
    currentFileName = filename
    attributeSelection = new Map<number, boolean>()
    //parse data
    getAttributes(filename).then((attributes: string[]) => {
        attributes.forEach((attr, index) => {
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
    let indices: number[] = []
    attributeSelection.forEach((value, key) => {
        if(value) {
            indices.push(key)
        } else {
            attributeSelection.delete(key)
        }
    })

    //clustering
    console.time('serverTime')
    const promise = cluster(currentFileName, indices, 100)
    //presentation
    promise.then((result: ClusterResult) => {
        console.timeEnd('serverTime')

        //elbow
        const elbowData = Array.from({length: result.k.length}).fill(0) as number[]
        result.k.forEach(value => {
            elbowData[value] = result.wcss[value - 1]
        })
        elbow.update(elbowData.slice(1))

        //scattermatrix
        scattermatrix.update(result.data, result.attributeNames, result.clusterIndices[3])

        //timeline
        //TODO: implement timeline
    })
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