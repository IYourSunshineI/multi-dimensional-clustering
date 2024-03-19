import {ElbowResult} from "../utils/ElbowResult.ts";
import {FakeImageData} from "../utils/RenderResult.js";
import {TimeSpan} from "../utils/TimeSpan.js";
import {TimeDataGroup} from "../utils/TimeDataGroup.js";


/**
 * This function calls the server to get the filenames of the datasets.
 *
 * @returns The filenames of the datasets
 */
export async function getFilenames(): Promise<string[]> {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', '/filenames', true)
    xhr.send()

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText))
                } else {
                    reject(xhr.responseText)
                }
            }
        }
    })
}

/**
 * This function calls the server to cluster the data.
 *
 * @param filename The name of the file to cluster
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param maxIterations The maximum number of iterations for the k-means algorithm
 * @param batchSize The size of the batch to use for the k-means algorithm
 */
export async function cluster(filename: string, selectedAttributeIndices: number[], maxIterations: number, batchSize: number): Promise<ElbowResult> {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', `/cluster?filename=${filename}&selectedAttributeIndices=${selectedAttributeIndices}&maxIterations=${maxIterations}&batchSize=${batchSize}`, true)
    xhr.send()

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText))
                } else {
                    reject(xhr.responseText)
                }
            }
        }
    })
}

/**
 * This function calls the server to render the data.
 *
 * @param filename the name of the file to render
 * @param selectedAttributeIndices the indices of the selected attributes
 * @param maxIterations the maximum number of iterations for the k-means algorithm
 * @param batchSize the size of the batch to use for the k-means algorithm
 * @param k the number of clusters
 * @param width the width of the canvas
 * @param height the height of the canvas
 */
export async function render(filename: string, selectedAttributeIndices: number[], maxIterations: number, batchSize: number, k: number, width: number, height: number): Promise<FakeImageData[]> {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', `/render?filename=${filename}&selectedAttributeIndices=${selectedAttributeIndices}&maxIterations=${maxIterations}&batchSize=${batchSize}&k=${k}&width=${width}&height=${height}`, true)
    xhr.send()

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText))
                } else {
                    reject(xhr.responseText)
                }
            }
        }
    })
}

/**
 * This function calls the server to get the timeline of the data.
 *
 * @param filename the name of the file to get the timeline from
 * @param selectedAttributeIndices the indices of the selected attributes
 * @param maxIterations the maximum number of iterations for the k-means algorithm
 * @param batchSize the size of the batch to use for the k-means algorithm
 * @param k the number of clusters
 * @param timeSpan the time span (if eg. day is selected the timeline will be grouped by day)
 */
export async function getTimeline(filename: string, selectedAttributeIndices: number[], maxIterations: number, batchSize: number, k: number, timeSpan: TimeSpan): Promise<TimeDataGroup[]> {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', `/timeline?filename=${filename}&selectedAttributeIndices=${selectedAttributeIndices}&maxIterations=${maxIterations}&batchSize=${batchSize}&k=${k}&timeSpan=${timeSpan}`, true)
    xhr.send()

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText))
                } else {
                    reject(xhr.responseText)
                }
            }
        }
    })
}

/**
 * This function calls the server to get the attributes of a file.
 *
 * @param filename The name of the file to get the attributes from
 * @returns The attributes of the dataset
 */
export async function getAttributes(filename: string): Promise<string[]> {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', `/attributes?filename=${filename}`, true)
    xhr.send()

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText))
                } else {
                    reject(xhr.responseText)
                }
            }

        }
    })
}