/**
 * Util interface for the result, that the cluster function returns.
 */
export interface ElbowResult {
    attributeNames: string[],
    wcss: number[],
    k: number[]
}

/**
 * Util interface for the result, that the worker cluster function returns.
 */
export interface WorkerElbowResult {
    clusterIndices: number[],
    wcss: number,
    k: number
}