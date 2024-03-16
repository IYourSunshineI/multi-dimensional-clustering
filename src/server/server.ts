import express from "express";
import * as fs from "fs";
import * as path from "path"
import ViteExpress from "vite-express";
import bodyparser from "body-parser";
import NodeCache from "node-cache";
import {getAllAttributes, getAttributes, getNumberOfLines} from "./data.js";
import {ElbowResult} from "../utils/ElbowResult.js";
import {startKmeansForElbow} from "./online_kmeans.js";
import {normalizeData} from "../utils/dataNormalizer.js";
import {renderScatterCanvases} from "./renderer.js";
import * as readline from "readline";
import {calculateTimeline} from "./timeline.js";

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

    getAllAttributes(filename).then((attributes) => {
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

    const clusterKey = `cluster-${filename}-${selectedAttributeIndices}`

    const cachedValue = getAndResetTTL(clusterKey) as ElbowResult
    if (cachedValue) {
        //cache hit
        res.send(cachedValue)
        return
    }

    if (!fs.existsSync(`./public/datasets_normalized/${filename}.csv`)) {
        normalizeData(filename).then(() => {
            startKmeansForElbow(`./public/datasets_normalized/${filename}.csv`, selectedAttributeIndices, maxIterations, batchSize).then((clusterResult) => {
                getAttributes(filename, selectedAttributeIndices).then((attributes) => {
                    const result: ElbowResult = {
                        attributeNames: attributes,
                        wcss: clusterResult.wcss,
                        k: clusterResult.k
                    }
                    cache.set(clusterKey, result, ttl)
                    res.send(result)
                })
            })
        })
    } else {
        startKmeansForElbow(`./public/datasets_normalized/${filename}.csv`, selectedAttributeIndices, maxIterations, batchSize).then((clusterResult) => {
            getAttributes(filename, selectedAttributeIndices).then((attributes) => {
                const result: ElbowResult = {
                    attributeNames: attributes,
                    wcss: clusterResult.wcss,
                    k: clusterResult.k
                }
                cache.set(clusterKey, result, ttl)
                res.send(result)
            })
        })
    }
});


/**
 * Endpoint to render the scatter canvases.
 *
 * @param filename The name of the file to render
 * @param selectedAttributeIndices The indices of the attributes to render
 * @param k The number of clusters
 * @param width The width of the canvas
 * @param height The height of the canvas
 * @returns The image data of the scatter canvases
 */
app.get("/render", (req, res) => {
    const filename = req.query.filename as string
    const selectedAttributeIndices = (req.query.selectedAttributeIndices as string)
        .split(',')
        .map((index) => parseInt(index))
    const k = req.query.k as unknown as number
    const width = req.query.width as unknown as number
    const height = req.query.height as unknown as number

    getNumberOfLines(`./public/clusterResults/${filename}_clusterIndices_selectedAttributeIndices=${selectedAttributeIndices}.csv`).then((numberOfLines) => {
        const fileStream = fs.createReadStream(`./public/clusterResults/${filename}_clusterIndices_selectedAttributeIndices=${selectedAttributeIndices}.csv`)
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        const clusterIndices: number[] = Array.from({length: numberOfLines}).fill(-1) as number[]
        let lineNumber = -2
        rl.on('line', (rawLine) => {
            lineNumber++
            if (lineNumber === -1) return

            const clusterIndex = rawLine.split(',')[k - 1]
            clusterIndices[lineNumber] = parseInt(clusterIndex)
        })

        rl.on('close', () => {
            renderScatterCanvases(`./public/datasets_normalized/${filename}.csv`, selectedAttributeIndices, clusterIndices, width, height).then((imageDatas) => {
                res.send(imageDatas)
            }).catch((error) => {
                console.log(error)
                res.status(500).send(error.message)
            })
        })

        rl.on('error', (error) => {
            res.status(500).send(error.message)
        })
    })

});

/**
 * Endpoint to get the timeline data.
 *
 * @param filename The name of the file to get the timeline from
 * @param selectedAttributeIndices The indices of the selected attributes
 * @param k The number of clusters
 * @param timeSpan The time span (if eg. day is selected the timeline will be grouped by day)
 * @returns The timeline data
 */
app.get("/timeline", (req, res) => {
    const filename = req.query.filename as string
    const selectedAttributeIndices = (req.query.selectedAttributeIndices as string)
        .split(',')
        .map((index) => parseInt(index))
    const k = parseInt(req.query.k as string)
    const timeSpan = parseInt(req.query.timeSpan as string)

    getAllAttributes(filename).then((attributes) => {
        const timeStampIndex = attributes.findIndex((attribute) => attribute.toLowerCase().includes('time'))
        if (timeStampIndex === -1) {
            res.status(500).send('No time attribute found')
            return
        }

        calculateTimeline(`./public/datasets/${filename}.csv`,
            `./public/clusterResults/${filename}_clusterIndices_selectedAttributeIndices=${selectedAttributeIndices}.csv`, k, timeStampIndex, timeSpan)
            .then((timeline) => {
                res.send(timeline)
            }).catch((error) => {
            res.status(500).send(error.message)
        })
    })
})

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
