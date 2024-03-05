import {kmeans} from 'ml-kmeans';

self.onmessage = function (event) {
    const { data, k , maxIterations } = event.data;

    console.log(k, 11 - k)
    const result = kmeans(data, k, { initialization: "kmeans++", maxIterations: maxIterations }).clusters;
    const asdf = kmeans(data, 11-k, { initialization: "kmeans++", maxIterations: maxIterations }).clusters;

    self.postMessage({ result: 'asdf' });
}