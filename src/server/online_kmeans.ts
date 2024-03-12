import * as fs from "fs";
import * as readline from "readline";
import {squaredEuclidean} from "ml-distance-euclidean";
import {Centroid} from "../utils/Centroid.js";
import {hasConverged} from "ml-kmeans/lib/utils.js";
import {default as cloneDeep} from "lodash/cloneDeep.js";

/**
 * Performs the k-means algorithm
 *
 * @param path The path to the file
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param k The number of centroids
 * @param maxIterations The maximum number of iterations for the k-means algorithm
 * @returns The cluster indices
 */
export async function kmeans(path: string, selectedAttributeIndices: number[], k: number, maxIterations: number) {
    console.time('get#Line')
    const numberOfLines = await getNumberOfLines(path)
    console.timeEnd('get#Line')

    console.time('reservoirSampling')
    let centroids = await initializeCenters(path, selectedAttributeIndices, k)
    console.timeEnd('reservoirSampling')

    let clusterIndices: number[] = Array.from({length: numberOfLines}, () => -1)
    let converged = false
    let stepNumber = 0
    console.time('sequentialKMeans')
    while (!converged && stepNumber < maxIterations) {
        const stepResult = await step(path, selectedAttributeIndices, k, centroids, clusterIndices)
        converged = stepResult.converged
        centroids = stepResult.centroids
        clusterIndices = stepResult.clusterIndices
        stepNumber++
        console.log(converged, stepNumber)
    }
    console.timeEnd('sequentialKMeans')

    return clusterIndices
}

/**
 * Perform one step of the k-means algorithm
 *
 * @param path The path to the file
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param k The number of centroids
 * @param centroids The current centroids
 * @param clusterIndices The current cluster indices
 * @returns The updated centroids, cluster indices and whether the algorithm has converged
 */
async function step(path: string, selectedAttributeIndices: number[], k: number, centroids: Centroid[], clusterIndices: number[]) {
    const oldCentroids = cloneDeep(centroids.map((c) => c.pos))
    clusterIndices = await updateClusterIndices(getReadlineStream(path), selectedAttributeIndices, centroids, clusterIndices)
    const newCentroids = centroids.map((c) => c.pos)
    let converged = hasConverged(newCentroids, oldCentroids, squaredEuclidean, 1e-6)

    return {
        centroids: centroids,
        clusterIndices: clusterIndices,
        converged: converged
    }
}

/**
 * Update the cluster indices of the data points
 *
 * @param rl The readline interface for the file
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param centroids The current centroids
 * @param clusterIndices The current cluster indices
 * @returns The updated cluster indices
 */
async function updateClusterIndices(rl: readline.Interface, selectedAttributeIndices: number[], centroids: Centroid[], clusterIndices: number[]): Promise<number[]> {
    let lineNumber = -2
    let allLinesProcessed = false

    rl.on('line', (rawLine) => {
        lineNumber++
        if (lineNumber === -1) return

        const line = rawLine.split(',').map(parseFloat)
            .filter(value => !isNaN(value))
        //.filter((value, index) => (!isNaN(value) && selectedAttributeIndices.includes(index)))

        const oldClusterIndex = clusterIndices[lineNumber]
        const newClusterIndex = nearestVector(centroids.map(d => d.pos), line)
        clusterIndices[lineNumber] = newClusterIndex
        updateCentroid(centroids, oldClusterIndex, newClusterIndex, line)
    })
    //console.log(centroids)
    //async function processLine() {
    //    for await (const rawLine of rl) {
    //        lineNumber++
    //        if (lineNumber === -1) continue
//
    //        const line = rawLine.split(',').map(parseFloat)
    //            .filter(value => !isNaN(value))
    //            //.filter((value, index) => (!isNaN(value) && selectedAttributeIndices.includes(index)))
//
    //        const oldClusterIndex = clusterIndices[lineNumber]
    //        const newClusterIndex = nearestVector(centroids.map(d => d.pos), line)
    //        clusterIndices[lineNumber] = newClusterIndex
    //        updateCentroid(centroids, oldClusterIndex, newClusterIndex, line)
    //    }
    //    allLinesProcessed = true
    //    rl.close()
    //}
//
    //await processLine()
    //console.log(centroids)

    return new Promise((resolve, reject) => {
        //if(allLinesProcessed) {
        //    resolve(clusterIndices)
        //}

        rl.on('close', () => {
            resolve(clusterIndices)
        })

        rl.on('error', (err) => {
            reject(err)
        })
    })
}

/**
 * Update the centroid of a cluster
 *
 * @param centroids the centroids
 * @param oldClusterIndex the index of the old cluster centroid
 * @param newClusterIndex the index of the new cluster centroid
 * @param data the data point to update the centroid with
 */
function updateCentroid(centroids: Centroid[], oldClusterIndex: number, newClusterIndex: number, data: number[]) {
    //if the data point is already in the correct cluster, do nothing
    if (oldClusterIndex === newClusterIndex) return

    //only remove from old centroid if it was already assigned to a cluster
    if (oldClusterIndex !== -1) {
        const oldCentroid = centroids[oldClusterIndex]
        //update pos of old centroid
        for (let i = 0; i < data.length; i++) {
            oldCentroid.pos[i] = (oldCentroid.pos[i] * oldCentroid.count - data[i]) / (oldCentroid.count - 1)
        }
        oldCentroid.count--
        centroids[oldClusterIndex] = oldCentroid
    }

    const newCentroid = centroids[newClusterIndex]
    //update pos of new centroid
    newCentroid.count++
    for (let i = 0; i < data.length; i++) {
        newCentroid.pos[i] = newCentroid.pos[i] + ((data[i] - newCentroid.pos[i]) / newCentroid.count)
    }
    centroids[newClusterIndex] = newCentroid
}

/**
 * Find the index of the nearest centroid to a vector
 *
 * @param centroids the centroids to compare to
 * @param vector the vector to compare
 * @returns the index of the nearest centroid
 */
function nearestVector(centroids: number[][], vector: number[]) {
    let index = -1
    let minDistance = Infinity
    for (let i = 0; i < centroids.length; i++) {
        const distance = squaredEuclidean(centroids[i], vector)
        if (distance < minDistance) {
            minDistance = distance
            index = i
        }
    }
    return index
}

/**
 * Initialize the centroids
 *
 * @param path The path to the file
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param k The number of centroids to get
 * @returns The k random centroids
 */
async function initializeCenters(path: string, selectedAttributeIndices: number[], k: number) {
    const rl = getReadlineStream(path)
    const positions = reservoirSampling(rl, selectedAttributeIndices, k)

    return new Promise<Centroid[]>((resolve, reject) => {
        positions.then((centroids) => {
            resolve(centroids.map((pos) => {
                return {
                    pos: pos,
                    count: 0
                }
            }))
        }).catch((err) => {
            reject(err)
        })
    })
}

/**
 * Reservoir sampling algorithm to get k random centroids
 *
 * @param rl The readline interface for the file
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param k The number of centroids to get
 * @returns The k random centroids
 */
async function reservoirSampling(rl: readline.Interface, selectedAttributeIndices: number[], k: number) {
    const centroids: number[][] = []
    let lineNumber = -2

    rl.on('line', (rawLine) => {
        lineNumber++
        if (lineNumber === -1) return

        //filter out non-numeric values and only take the selected attributes into account
        const line = rawLine.split(',').map(parseFloat)
            .filter(value => !isNaN(value))
        //.filter((value, index) => (!isNaN(value) && selectedAttributeIndices.includes(index)))

        if (lineNumber < k) {
            centroids.push(line)
        } else {
            const randomIndex = Math.floor(Math.random() * lineNumber)
            if (randomIndex < k) {
                centroids[randomIndex] = line
            }
        }
    })

    return new Promise<number[][]>((resolve, reject) => {
        rl.on('close', () => {
            resolve(centroids)
        })

        rl.on('error', (err) => {
            reject(err)
        })
    })
}

/**
 * Get the number of lines in a file
 * (not including the first line, which is assumed to be the header)
 *
 * @param path The path to the file
 * @returns The number of lines in the file
 */
async function getNumberOfLines(path: string) {
    const rl = getReadlineStream(path)
    let lineNumber = -1
    rl.on('line', () => {
        lineNumber++
    })

    return new Promise<number>((resolve, reject) => {
        rl.on('close', () => {
            resolve(lineNumber)
        })

        rl.on('error', (err) => {
            reject(err)
        })
    })
}

/**
 * Get a readline interface for a file
 *
 * @param path The path to the file
 * @returns A readline interface for the file
 */
function getReadlineStream(path: string) {
    const fileStream = fs.createReadStream(path)
    return readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })
}