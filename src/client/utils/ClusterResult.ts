/**
 * Util interface for the result, that the clusterWorker returns.
 */
export interface ClusterResult {
    clusterIndices: number[],
    wcss: number,
    k: number
}