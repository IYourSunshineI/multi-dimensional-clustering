import express from "express";
import ViteExpress from "vite-express";
import bodyparser from "body-parser";
import { syncCluster } from './clustering.ts'
import NodeCache from "node-cache";
import { getAttributes } from "./data.js";

const app = express();
const ttl = 60 * 60 //1h
const cache = new NodeCache({ stdTTL: ttl })

app.use(bodyparser.json({ limit: "500mb" }));
app.use(bodyparser.urlencoded({ limit: "500mb", extended: true}));

/**
 * Endpoint to get the attributes of a file
 *
 * @param filename The name of the file to get the attributes from
 */
app.get("/attributes", (req, res) => {
    const filename = req.query.filename as string
    const attKey = `attributes-${filename}`

    const value = getAndResetTTL(attKey)
    if(value) {
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

app.post("/cluster", (req, res) => {
  syncCluster(req.body.data, req.body.maxIterations).then((result) => {
    res.send(result)
  }).catch((error) => {
    res.send(error)
  })
});

/**
 * This function gets the value from the cache and resets the TTL
 *
 * @param key The key to get the value from
 * @returns The value from the cache
 */
function getAndResetTTL(key: string) {
    const value = cache.get(key)
    if(value) {
        cache.set(key, value, ttl)
    }
    return value
}

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
