/**
 * Util interface for the result, that the cluster function returns.
 */
export interface ClusterResult {
    data: number[][],
    attributeNames: string[],
    clusterIndices: number[][],
    wcss: number[],
    k: number[]
}

/**
 * Util interface used to cache the result of the clustering.
 */
export interface ClusterResultCacheObject {
    clusterIndices: number[][],
    wcss: number[],
    k: number[]
}
