
export async function cluster(data: number[][], k: number, maxIterations: number): Promise<number[]> {
    let xhr = new XMLHttpRequest()
    xhr.open('POST', '/cluster', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    const body = JSON.stringify({data, k, maxIterations})
    console.time('ml-kmeans')
    xhr.send(body)

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = function() {
            if(xhr.readyState == XMLHttpRequest.DONE) {
                console.timeEnd('ml-kmeans')
                resolve(JSON.parse(xhr.responseText))
            }
        }
    })
}