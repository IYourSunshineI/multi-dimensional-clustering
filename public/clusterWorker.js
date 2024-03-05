/**
 * This is a web worker that will run the kmeans algorithm in a separate thread.
 */

import {kmeans} from 'ml-kmeans';

self.onmessage = function (event) {
    const { data, k , maxIterations } = event.data;

    const results = [];
    results.push(kmeans(data, k, { initialization: "kmeans++", maxIterations: maxIterations }).clusters);
    results.push(kmeans(data, 11-k, { initialization: "kmeans++", maxIterations: maxIterations }).clusters);

    self.postMessage({ clusterIndices: results });
}