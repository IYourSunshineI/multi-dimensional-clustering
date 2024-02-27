import skmeans from "skmeans";

export function kmeans(data: number[][], k: number, maxIterations: number): number[] {
    console.time('kmeans')
    const result = skmeans(data, k, 'kmpp', maxIterations)
    console.timeEnd('kmeans')
    return result.idxs
}