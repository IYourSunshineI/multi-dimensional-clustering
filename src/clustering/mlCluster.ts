import * as mlkmeans from 'ml-kmeans';

export async function cluster(data: number[][], k: number, maxIterations: number): Promise<number[]> {
    return new Promise((resolve, _) => {
        const clusterIndices = mlkmeans.kmeans(data, k, { initialization: "kmeans++", maxIterations: maxIterations}).clusters
        resolve(clusterIndices)
    })
}