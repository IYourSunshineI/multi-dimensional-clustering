import * as sklearn from 'sklearn';

export async function cluster(data: number[][], k: number, maxIterations: number){
    // @ts-ignore
    const py = await sklearn.createPythonBridge()
    // @ts-ignore
    const model = new sklearn.KMeans({
        n_clusters: k,
        max_iter: maxIterations,
        n_init: 'auto'
    })
    await model.init(py)

    console.time('sklearn')
    const result = await model.fit_predict({X: data})
    console.timeEnd('sklearn')

    await model.dispose()
    await py.disconnect()

    return result
}