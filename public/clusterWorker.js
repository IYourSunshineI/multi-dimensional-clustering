/**
 * This is a web worker that will run the kmeans algorithm in a separate thread.
 */

import { kmeans } from 'ml-kmeans';

self.onmessage = function (event) {
    const { data, k , maxIterations } = event.data;

    const results = [];
    results.push(kmeans(data, k, { initialization: "kmeans++", maxIterations: maxIterations }));
    results.push(kmeans(data, 11-k, { initialization: "kmeans++", maxIterations: maxIterations }));

    console.time('wcss')
    let wcss = results.map(value => calculateWCSS(data, value.clusters, value.centroids));
    console.timeEnd('wcss')
    console.log(wcss)

    self.postMessage({ clusterIndices: results.map(value => value.clusters), wcss: wcss, k: [k, 11 - k] });
}

/**
 * Calculate the within-cluster sum of squares (WCSS) for a given clustering.
 *
 * @param data the data which was clustered
 * @param clusters the cluster indices for each data point
 * @param centroids the centroids of the clusters
 * @return {number} the WCSS
 */
function calculateWCSS(data, clusters, centroids) {
    let wcss = 0;
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            wcss += Math.pow(data[i][j] - centroids[clusters[i]][j], 2);
        }
    }
    return wcss;
}