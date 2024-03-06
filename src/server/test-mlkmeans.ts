/**
 * This is a web worker that will run the kmeans algorithm in a separate thread.
 */

import { kmeans } from 'ml-kmeans';
import {ClusterResult} from "../client/utils/ClusterResult.js";

export async function syncCluster (data: number[][], k: number, maxIterations: number) {
    return new Promise<ClusterResult[]>((resolve, _) => {
        const results = [];
        const ks = [];

        console.time('kmeans')
        for (let k = 1; k <= 10; k++) {
            const res = kmeans(data, k, {initialization: "random", maxIterations: maxIterations})
            results.push(res)
            ks.push(k)
        }
        console.timeEnd('kmeans')

        console.time('wcss')
        let wcss = results.map(value => calculateWCSS(data, value.clusters, value.centroids));
        console.timeEnd('wcss')

        const clusterResults: ClusterResult[] = [];
        for(let i = 0; i < results.length; i++) {
            clusterResults.push({
                clusterIndices: results[i].clusters,
                wcss: wcss[i],
                k: ks[i]
            })
        }

        resolve(clusterResults)
    })
}

export async function asyncCluster (data: number[][], k: number, maxIterations: number) {
    return new Promise<ClusterResult[]>((resolve, _) => {
        const results = [];
        //const ks = [];

        console.time('kmeans')
        for(let k = 1; k <= 10; k++) {
            const promise = new Promise<ClusterResult>((resolve, _) => {
                const res = kmeans(data, k, { initialization: "random", maxIterations: maxIterations})

                const clusterRes: ClusterResult = {
                    clusterIndices: res.clusters,
                    wcss: calculateWCSS(data, res.clusters, res.centroids),
                    k: k
                }

                resolve(clusterRes)
            })
            results.push(promise)
        }

        Promise.all(results).then(res => {
            console.timeEnd('kmeans')
            resolve(res)
        })
    })
}

/**
 * Calculate the within-cluster sum of squares (WCSS) for a given clustering.
 *
 * @param data the data which was clustered
 * @param clusters the cluster indices for each data point
 * @param centroids the centroids of the clusters
 * @return {number} the WCSS
 */
function calculateWCSS(data: number[][], clusters: number[], centroids: number[][]) {
    let wcss = 0;
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            wcss += Math.pow(data[i][j] - centroids[clusters[i]][j], 2);
        }
    }
    return wcss;
}