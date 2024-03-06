/**
 * This is a web worker that will run the kmeans algorithm in a separate thread.
 */

import { kmeans } from 'ml-kmeans';
import {ClusterResult} from "../client/utils/ClusterResult.js";

export async function cluster (data: number[][], k: number, maxIterations: number) {
    return new Promise<ClusterResult[]>((resolve, _) => {
        const results = [];
        //const ks = [];

        console.time('kmeans')
        for(let k = 1; k <= 10; k++) {
            const promise = new Promise<ClusterResult>((resolve, _) => {
                const res = kmeans(data, k, { initialization: "kmeans++", maxIterations: maxIterations})

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

        //console.timeEnd('kmeans')
//
        //console.time('wcss')
        //let wcss = results.map(value => calculateWCSS(data, value.clusters, value.centroids));
        //console.timeEnd('wcss')
//
        //resolve({clusterIndices: results.map(value => value.clusters),
        //    wcss: wcss,
        //    k: ks
        //})
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