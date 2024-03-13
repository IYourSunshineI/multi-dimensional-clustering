import express from "express";
import * as fs from "fs";
import * as path from "path"
import ViteExpress from "vite-express";
import bodyparser from "body-parser";
//import { cluster } from './clustering.ts'
import NodeCache from "node-cache";
import {getAttributes, parseData} from "./data.js";
import {ClusterResult, ClusterResultCacheObject} from "../utils/ClusterResult.js";
import {kmeans, startKmeansForElbow} from "./online_kmeans.js";
import {normalizeData} from "../utils/dataNormalizer.js";

const app = express();
const ttl = 60 * 60 //1h
const cache = new NodeCache({stdTTL: ttl})

app.use(bodyparser.json({limit: "500mb"}));
app.use(bodyparser.urlencoded({limit: "500mb", extended: true}));

/**
 * Endpoint to get the filenames of the datasets.
 *
 * @returns The filenames of the datasets
 */
app.get("/filenames", (_, res) => {
    fs.readdir('./public/datasets', (err, files) => {
        if (err) {
            res.status(500).send(err.message)
        } else {
            const filesWithoutExtension = files.map((file) => path.parse(file).name)
            console.log(filesWithoutExtension)
            res.json(filesWithoutExtension)
        }
    })
})

/**
 * Endpoint to get the attributes of a file.
 * The results are cached to improve performance.
 *
 * @param filename The name of the file to get the attributes from
 */
app.get("/attributes", (req, res) => {
    const filename = req.query.filename as string
    const attKey = `attributes-${filename}`

    const value = getAndResetTTL(attKey)
    if (value) {
        //cache hit
        res.send(value)
        return
    }

    getAttributes(filename).then((attributes) => {
        cache.set(attKey, attributes, ttl)
        res.send(attributes)
    }).catch((error) => {
        res.status(500).send(error.message)
    })
})

/**
 * Endpoint to cluster the data.
 * The results are cached to improve performance.
 *
 * @param filename The name of the file to cluster
 * @param selectedAttributeIndices The indices of the attributes to cluster on
 * @param maxIterations The maximum number of iterations for the k-means algorithm
 */
app.get("/cluster", (req, res) => {
    const filename = req.query.filename as string
    const selectedAttributeIndices = (req.query.selectedAttributeIndices as string)
        .split(',')
        .map((index) => parseInt(index))
    const maxIterations = req.query.maxIterations as unknown as number
    const batchSize = req.query.batchSize as unknown as number

    const clusterKey = `cluster-${filename}-${selectedAttributeIndices}-${maxIterations}`

    normalizeData(filename, selectedAttributeIndices).then(() => {
        //console.time('kmeans')
        startKmeansForElbow(`./public/datasets/${filename}_normalized.csv`, selectedAttributeIndices, maxIterations, batchSize).then((clusterResult) => {
            //console.timeEnd('kmeans')
            parseData(filename, selectedAttributeIndices).then((parsedData) => {
                const response: ClusterResult = {
                    data: parsedData.data,
                    attributeNames: parsedData.attributes,
                    clusterIndices: clusterResult.clusterIndices,
                    wcss: [],
                    k: []
                }
                res.send(response)
            })
        })
    })

    /*
    //console.time('asdf')
    //cluster(filename, selectedAttributeIndices, 4, maxIterations).then((clusterResult) => {
    //    //clusterResult.data = parsedData.data
    //    //clusterResult.attributeNames = parsedData.attributes
    //    res.send(clusterResult)
    //    console.timeEnd('asdf')
    //}).catch((error) => {
    //    res.status(500).send(error.message)
    //})

    parseData(filename, selectedAttributeIndices).then((parsedData) => {
        const value = getAndResetTTL(clusterKey) as ClusterResultCacheObject
        if (value) {
            //cache hit
            const response: ClusterResult = {
                data: parsedData.data,
                attributeNames: parsedData.attributes,
                clusterIndices: value.clusterIndices,
                wcss: value.wcss,
                k: value.k
            }
            res.send(response)
            return
        }

        //cluster(parsedData.data, maxIterations).then((clusterResult) => {
        //    clusterResult.attributeNames = parsedData.attributes
        //    const cacheObject: ClusterResultCacheObject = {
        //        clusterIndices: clusterResult.clusterIndices,
        //        wcss: clusterResult.wcss,
        //        k: clusterResult.k
        //    }
        //    cache.set(clusterKey, cacheObject, ttl)
        //    res.send(clusterResult)
        //}).catch((error) => {
        //    res.status(500).send(error.message)
        //})

        calculateClusters(filename, selectedAttributeIndices, maxIterations).then((clusterResult) => {
            const cacheObject: ClusterResultCacheObject = {
                clusterIndices: clusterResult.clusterIndices,
                wcss: clusterResult.wcss,
                k: clusterResult.k
            }
            cache.set(clusterKey, cacheObject, ttl)

            clusterResult.data = parsedData.data
            clusterResult.attributeNames = parsedData.attributes
            res.send(clusterResult)
        }).catch((error) => {
            res.status(500).send(error.message)
        })

        //cluster(filename, selectedAttributeIndices, 4, maxIterations).then((clusterResult) => {
        //    const asdf: ClusterResult = {
        //        data: parsedData.data,
        //        attributeNames: parsedData.attributes,
        //        clusterIndices: [clusterResult],
        //        wcss: [],
        //        k: []
        //    }
        //    res.send(asdf)
        //}).catch((error) => {
        //    res.status(500).send(error.message)
        //})
    }).catch((error) => {
        res.status(500).send(error.message)
    })
    */
});

/**
 * This function gets the value from the cache and resets the TTL
 *
 * @param key The key to get the value from
 * @returns The value from the cache
 */
function getAndResetTTL(key: string) {
    const value = cache.get(key)
    if (value) {
        cache.set(key, value, ttl)
    }
    return value
}

ViteExpress.listen(app, 3000, () =>
    console.log("Server is listening on port 3000..."),
);
