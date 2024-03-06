import {ClusterResult} from "../utils/ClusterResult.ts";

/**
 * This function calls the server to cluster the data.
 *
 * @param data The data to cluster
 * @param maxIterations The maximum number of iterations
 * @returns The result of the clustering
 */
export async function cluster(data: number[][], maxIterations: number): Promise<ClusterResult[]> {
    let xhr = new XMLHttpRequest()
    xhr.open('POST', '/cluster', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    const body = JSON.stringify({data, maxIterations})
    console.time('ml-kmeans')
    xhr.send(body)

    return new Promise((resolve, _) => {
        xhr.onreadystatechange = function() {
            if(xhr.readyState == XMLHttpRequest.DONE) {
                console.timeEnd('ml-kmeans')
                resolve(JSON.parse(xhr.responseText))
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
                    console.log(JSON.parse(xhr.responseText))
                    resolve(JSON.parse(xhr.responseText))
                } else {
                    reject(xhr.responseText)
                }
            }

        }
    })
}