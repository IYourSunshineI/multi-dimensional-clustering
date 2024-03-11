import {ClusterResult} from "../utils/ClusterResult.ts";


/**
 * This function calls the server to get the filenames of the datasets.
 *
 * @returns The filenames of the datasets
 */
export async function getFilenames(): Promise<string[]> {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', '/filenames', true)
    xhr.send()

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = function() {
            if(xhr.readyState == XMLHttpRequest.DONE) {
                if(xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText))
                } else {
                    reject(xhr.responseText)
                }
            }
        }
    })
}

/**
 * This function calls the server to cluster the data.
 *
 * @param filename The name of the file to cluster
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param maxIterations The maximum number of iterations for the k-means algorithm
 */
export async function cluster(filename: string, selectedAttributeIndices: number[], maxIterations: number): Promise<ClusterResult> {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', `/cluster?filename=${filename}&selectedAttributeIndices=${selectedAttributeIndices}&maxIterations=${maxIterations}`, true)
    xhr.send()

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = function() {
            if(xhr.readyState == XMLHttpRequest.DONE) {
                if(xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText))
                } else {
                    reject(xhr.responseText)
                }
            }
        }
    })
}

/**
 * This function calls the server to get the attributes of a file.
 *
 * @param filename The name of the file to get the attributes from
 * @returns The attributes of the dataset
 */
export async function getAttributes(filename: string) : Promise<string[]> {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', `/attributes?filename=${filename}`, true)
    xhr.send()

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = function() {
            if(xhr.readyState == XMLHttpRequest.DONE) {
                if(xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText))
                } else {
                    reject(xhr.responseText)
                }
            }

        }
    })
}