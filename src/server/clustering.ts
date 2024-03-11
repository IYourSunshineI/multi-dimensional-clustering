import { kmeans } from 'ml-kmeans';
import {ClusterResult} from "../utils/ClusterResult.ts";

/**
 * Cluster the given data using the k-means algorithm.
 *
 * @param data the data to cluster
 * @param maxIterations the maximum number of iterations for the k-means algorithm
 * @return {Promise<ClusterResult>} the result of the clustering
 */
export async function cluster (data: number[][], maxIterations: number): Promise<ClusterResult> {
    return new Promise<ClusterResult>((resolve, _) => {
        const clusterResult: ClusterResult = {
            data: data,
            attributeNames: [],
            clusterIndices: [],
            wcss: [],
            k: []
        }

        console.time('kmeans')
        for (let k = 1; k <= 10; k++) {
            const res = kmeans(data, k, {initialization: "random", maxIterations: maxIterations})
            clusterResult.clusterIndices.push(res.clusters)
            clusterResult.wcss.push(calculateWCSS(data, res.clusters, res.centroids))
            clusterResult.k.push(k)
        }
        console.timeEnd('kmeans')

        resolve(clusterResult)
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
function calculateWCSS(data: number[][], clusters: number[], centroids: number[][]): number {
    let wcss = 0;
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            wcss += Math.pow(data[i][j] - centroids[clusters[i]][j], 2);
        }
    }
    return wcss;
}