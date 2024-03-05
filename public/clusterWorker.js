import skmeans from 'skmeans';

self.onmessage = function(event) {
    const { data, k, maxIterations } = event.data;

    console.log(k, 11 - k)
    const result = skmeans(data, k, 'kmpp', maxIterations).idxs
    const asdf = skmeans(data, 11 - k, 'kmpp', maxIterations).idxs

    self.postMessage({ clusterIndices: 'asdf' });
}
