/**
 * Util interface for the result, that the cluster function returns.
 */
export interface ClusterResult {
    attributeNames: string[],
    clusterIndices: number[][],
    wcss: number[],
    k: number[]
}

/**
 * Util interface for the result, that the worker cluster function returns.
 */
export interface WorkerClusterResult {
    clusterIndices: number[],
    wcss: number,
    k: number
}
