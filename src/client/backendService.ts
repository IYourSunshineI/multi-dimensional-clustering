import {ClusterResult} from "../utils/ClusterResult.ts";

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