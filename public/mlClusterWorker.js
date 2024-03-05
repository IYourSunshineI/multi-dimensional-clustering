import {kmeans} from 'ml-kmeans';

self.onmessage = function (event) {
    const { data, k , maxIterations } = event.data;

    console.log(k, 11 - k)
    const results = []
    results.push(kmeans(data, k, { initialization: "kmeans++", maxIterations: maxIterations }).clusters)
    results.push(kmeans(data, 11-k, { initialization: "kmeans++", maxIterations: maxIterations }).clusters)

    self.postMessage({ clusterIndices: results });
}