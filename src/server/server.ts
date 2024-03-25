import express from "express";
import * as fs from "fs";
import * as path from "path"
import ViteExpress from "vite-express";
import bodyparser from "body-parser";
import NodeCache from "node-cache";
import {getAllAttributes, getAttributes} from "./data.js";
import {ElbowResult} from "../utils/ElbowResult.js";
import {startKmeansForElbow} from "./online_kmeans.js";
import {normalizeData} from "../utils/dataNormalizer.js";
import {renderScatterCanvases} from "./renderer.js";
import {calculateTimeline} from "./timeline.js";

const app = express();
const ttl = 60 * 30 //.5h
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
app.get("/cluster", async (req, res) => {
    const filename = req.query.filename as string
    const selectedAttributeIndices = (req.query.selectedAttributeIndices as string)
        .split(',')
        .map((index) => parseInt(index))
    const maxIterations = req.query.maxIterations as unknown as number
    const batchSize = req.query.batchSize as unknown as number

    const elbowResultPath = `./public/results/clusterWcssResults/${filename}_wcss_selectedAttributeIndices=${selectedAttributeIndices}_maxIterations=${maxIterations}_batchSize=${batchSize}.json`
    if (fs.existsSync(elbowResultPath)) {
        const elbowResult = JSON.parse(fs.readFileSync(elbowResultPath, 'utf8'))
        res.send(elbowResult)
        return
    }

    if (!fs.existsSync(`./public/results/datasets_normalized/${filename}.csv`)) {
        await normalizeData(filename)
    }

    startKmeansForElbow(`./public/results/datasets_normalized/${filename}.csv`, selectedAttributeIndices, maxIterations, batchSize).then((clusterResult) => {
        getAttributes(filename, selectedAttributeIndices).then((attributes) => {
            const result: ElbowResult = {
                attributeNames: attributes,
                wcss: clusterResult.wcss,
                k: clusterResult.k
            }

            const writeStream = fs.createWriteStream(elbowResultPath)
            writeStream.write(JSON.stringify(result))
            writeStream.end()

            writeStream.on('error', (error) => {
                console.error(error.message)
                res.status(500).send(error.message)
            })

            writeStream.on('finish', () => {
                res.send(result)
            })
        })
    })
});


/**
 * Endpoint to render the scatter canvases.
 *
 * @param filename The name of the file to render
 * @param selectedAttributeIndices The indices of the attributes to render
 * @param maxIterations The maximum number of iterations for the k-means algorithm
 * @param batchSize The size of the batch to use for the k-means algorithm
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
    const maxIterations = parseInt(req.query.maxIterations as string)
    const batchSize = parseInt(req.query.batchSize as string)
    const k = req.query.k as unknown as number
    const width = req.query.width as unknown as number
    const height = req.query.height as unknown as number

    const renderResultPath = `./public/results/renderResults/${filename}_scatterMatrix_k=${k}_selectedAttributeIndices=${selectedAttributeIndices}_maxIterations=${maxIterations}_batchSize=${batchSize}.json`
    if (fs.existsSync(renderResultPath)) {
        const imageDatas = JSON.parse(fs.readFileSync(renderResultPath, 'utf8'))
        res.send(imageDatas)
        return
    }


    renderScatterCanvases(`./public/results/datasets_normalized/${filename}.csv`,
        `./public/results/clusterIndexResults/${filename}_clusterIndices_k=${k}_selectedAttributeIndices=${selectedAttributeIndices}_maxIterations=${maxIterations}_batchSize=${batchSize}.csv`,
        selectedAttributeIndices, width, height).then((imageDatas) => {
        const writeStream = fs.createWriteStream(renderResultPath)
        writeStream.write(JSON.stringify(imageDatas))
        writeStream.end()

        writeStream.on('error', (error) => {
            console.error(error.message)
            res.status(500).send(error.message)
        })

        writeStream.on('finish', () => {
            res.send(imageDatas)
        })
    }).catch((error) => {
        console.log(error)
        res.status(500).send(error.message)
    })
});

/**
 * Endpoint to get the timeline data.
 *
 * @param filename The name of the file to get the timeline from
 * @param selectedAttributeIndices The indices of the selected attributes
 * @param maxIterations The maximum number of iterations for the k-means algorithm
 * @param batchSize The size of the batch to use for the k-means algorithm
 * @param k The number of clusters
 * @param timeSpan The time span (if e.g. day is selected the timeline will be grouped by day)
 * @returns The timeline data
 */
app.get("/timeline", (req, res) => {
    const filename = req.query.filename as string
    if (!filename) {
        res.status(400).send('No filename provided')
        return
    }
    const selectedAttributeIndices = (req.query.selectedAttributeIndices as string)
        .split(',')
        .map((index) => parseInt(index))
    const maxIterations = parseInt(req.query.maxIterations as string)
    const batchSize = parseInt(req.query.batchSize as string)
    const k = parseInt(req.query.k as string)
    const timeSpan = parseInt(req.query.timeSpan as string)

    const timelinePath = `./public/results/timelineResults/${filename}_timeline_k=${k}_timespan=${timeSpan}_selectedAttributeIndices=${selectedAttributeIndices}_maxIterations=${maxIterations}_batchSize=${batchSize}.json`
    if (fs.existsSync(timelinePath)) {
        const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'))
        res.send(timeline)
        return
    }

    getAllAttributes(filename).then((attributes) => {
        const timeStampIndex = attributes.findIndex((attribute) => attribute.toLowerCase().includes('time'))
        if (timeStampIndex === -1) {
            res.status(500).send('No time attribute found')
            return
        }

        calculateTimeline(`./public/datasets/${filename}.csv`,
            `./public/results/clusterIndexResults/${filename}_clusterIndices_k=${k}_selectedAttributeIndices=${selectedAttributeIndices}_maxIterations=${maxIterations}_batchSize=${batchSize}.csv`, k, timeStampIndex, timeSpan)
            .then((timeline) => {
                const writeStream = fs.createWriteStream(timelinePath)
                writeStream.write(JSON.stringify(timeline))
                writeStream.end()

                writeStream.on('error', (error) => {
                    console.error(error.message)
                    res.status(500).send(error.message)
                })

                writeStream.on('finish', () => {
                    res.send(timeline)
                })
            }).catch((error) => {
            res.status(500).send(error.message)
        })
    })
})

/**
 * Endpoint to clear the history.
 */
app.get('/clearHistory', (_, res) => {
    const directories = ['clusterIndexResults', 'clusterWcssResults', 'renderResults', 'timelineResults', 'datasets_normalized']
    directories.forEach((directory) => {
        fs.readdirSync(`./public/results/${directory}`).forEach((file) => {
            if (!file.includes('info.md')) {
                fs.unlinkSync(`./public/results/${directory}/${file}`)
            }
        })
    })
    res.status(204)
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
