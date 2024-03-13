import * as fs from "fs";
import * as readline from "readline";
import {squaredEuclidean} from "ml-distance-euclidean";
import {Centroid} from "../utils/Centroid.js";
import {hasConverged} from "ml-kmeans/lib/utils.js";
import {default as cloneDeep} from "lodash/cloneDeep.js";
import {Worker, parentPort, workerData} from "worker_threads";
import {ClusterResult, WorkerClusterResult} from "../utils/ClusterResult.js";

const __filename = new URL(import.meta.url);

/**
 * If the script is running as a worker, start the k-means algorithm
 */
parentPort?.on('message', async () => {
    const clusterIndices1 = await kmeans(workerData.path, workerData.selectedAttributeIndices, workerData.k, workerData.maxIterations, workerData.batchSize)
    parentPort?.postMessage({clusterIndices: clusterIndices1, wcss: 0, k: workerData.k})
})

/**
 * This function starts the k-means algorithm with 10 workers and returns the results
 *
 * @param path The path to the file
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param maxIterations The maximum number of iterations for the k-means algorithm
 */
export async function startKmeansForElbow(path: string, selectedAttributeIndices: number[], maxIterations: number, batchSize: number) {
    console.time('onlineKmeans')
    const promises: Promise<WorkerClusterResult>[] = []

    for (let i = 1; i <= 10; i++) {
        const worker = new Worker(__filename, {workerData: {path, selectedAttributeIndices, k: i, maxIterations, batchSize}})
        promises.push(new Promise<WorkerClusterResult>((resolve, reject) => {
            worker.on('message', (message) => {
                resolve(message)
                worker.terminate()
            })

            worker.on('error', (error) => {
                console.error(error)
                reject(error)
            })
        }))
        worker.postMessage('start')
    }

    return new Promise<ClusterResult>((resolve, reject) => {
        Promise.all(promises).then((results) => {
            const clusterResult: ClusterResult = {
                data: [],
                attributeNames: [],
                clusterIndices: Array.from({length: 10}, () => []),
                wcss: Array.from({length: 10}, () => 0),
                k: Array.from({length: 10}, (_, i) => i + 1)
            }

            results.forEach((result) => {
                clusterResult.clusterIndices[result.k - 1] = result.clusterIndices
                clusterResult.wcss[result.k - 1] = result.wcss
            })

            console.timeEnd('onlineKmeans')
            resolve(clusterResult)
        }).catch((error) => {
            reject(error)
        })
    })
}

/**
 * Performs the k-means algorithm
 *
 * @param path The path to the file
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param k The number of centroids
 * @param maxIterations The maximum number of iterations for the k-means algorithm
 * @returns The cluster indices
 */
export async function kmeans(path: string, selectedAttributeIndices: number[], k: number, maxIterations: number, batchSize: number) {
    const numberOfLines = await getNumberOfLines(path)

    let centroids = await initializeCenters(path, selectedAttributeIndices, k)

    let clusterIndices: number[] = Array.from({length: numberOfLines}, () => -1)
    let converged = false
    let stepNumber = 0
    while (!converged && stepNumber < maxIterations) {
        const stepResult = await step(path, selectedAttributeIndices, centroids, clusterIndices, batchSize)
        converged = stepResult.converged
        centroids = stepResult.centroids
        clusterIndices = stepResult.clusterIndices
        //console.log(converged, stepNumber)
        stepNumber++
    }
    if(batchSize > 0) {
        const lastStep = await step(path, selectedAttributeIndices, centroids, clusterIndices)
        clusterIndices = lastStep.clusterIndices
    }

    return clusterIndices
}

/**
 * Perform one step of the k-means algorithm
 *
 * @param path The path to the file
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param centroids The current centroids
 * @param clusterIndices The current cluster indices
 * @returns The updated centroids, cluster indices and whether the algorithm has converged
 */
async function step(path: string, selectedAttributeIndices: number[], centroids: Centroid[], clusterIndices: number[], batchSize?: number) {
    const oldCentroids = cloneDeep(centroids.map((c) => c.pos))
    clusterIndices = await updateClusterIndices(path, selectedAttributeIndices, centroids, clusterIndices, batchSize)
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
 * @param path The path to the file
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param centroids The current centroids
 * @param clusterIndices The current cluster indices
 * @returns The updated cluster indices
 */
async function updateClusterIndices(path: string, selectedAttributeIndices: number[], centroids: Centroid[], clusterIndices: number[], batchSize?: number): Promise<number[]> {
    const fileStream = fs.createReadStream(path)
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    let lineNumber = -2
    rl.on('line', (rawLine) => {
        lineNumber++
        if (lineNumber === -1) return

        //only sample if line is in batch
        if(batchSize) {
            if(batchSize === 0) {
                rl.close()
                return
            }
            if(Math.random() >= .5) return

            batchSize--
        }

        const line = rawLine.split(',').map(parseFloat)
            .filter(value => !isNaN(value))
        //.filter((value, index) => (!isNaN(value) && selectedAttributeIndices.includes(index)))

        const oldClusterIndex = clusterIndices[lineNumber]
        const newClusterIndex = nearestVector(centroids.map(d => d.pos), line)
        clusterIndices[lineNumber] = newClusterIndex
        updateCentroid(centroids, oldClusterIndex, newClusterIndex, line)
    })

    return new Promise((resolve, reject) => {
        rl.on('close', () => {
            rl.close()
            fileStream.close()
            resolve(clusterIndices)
        })

        rl.on('error', (err) => {
            rl.close()
            fileStream.close()
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
    const positions = await reservoirSampling(path, selectedAttributeIndices, k)
    return positions.map((pos) => {
        return {
            pos: pos,
            count: 0
        }
    })
}

/**
 * Reservoir sampling algorithm to get k random centroids
 *
 * @param path The path to the file
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param k The number of centroids to get
 * @returns The k random centroids
 */
async function reservoirSampling(path: string, selectedAttributeIndices: number[], k: number) {
    const fileStream = fs.createReadStream(path)
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

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
            rl.close()
            fileStream.close()
            resolve(centroids)
        })

        rl.on('error', (err) => {
            rl.close()
            fileStream.close()
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
    const fileStream = fs.createReadStream(path)
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    let lineNumber = -1
    rl.on('line', () => {
        lineNumber++
    })

    return new Promise<number>((resolve, reject) => {
        rl.on('close', () => {
            rl.close()
            fileStream.close()
            resolve(lineNumber)
        })

        rl.on('error', (err) => {
            rl.close()
            fileStream.close()
            reject(err)
        })
    })
}