import skmeans from "skmeans";

export async function kmeans(data: number[][], k: number, maxIterations: number): Promise<number[]> {
    //console.time('kmeans')
    //const result = skmeans(data, k, 'kmpp', maxIterations)
    //console.timeEnd('kmeans')
    //return result.idxs

    return new Promise((resolve, _) => {
        const clusterIndices = skmeans(data, k, 'kmpp', maxIterations).idxs
        resolve(clusterIndices)
    })
}