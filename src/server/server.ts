import express from "express";
import ViteExpress from "vite-express";
import bodyparser from "body-parser";
import { syncCluster } from './clustering.ts'

const app = express();

app.use(bodyparser.json({ limit: "500mb" }));
app.use(bodyparser.urlencoded({ limit: "500mb", extended: true}));

app.get("/hello", (_, res) => {
  res.send("Hello Vite + TypeScript!");
});

app.post("/cluster", (req, res) => {
  syncCluster(req.body.data, req.body.maxIterations).then((result) => {
    res.send(result)
  }).catch((error) => {
    res.send(error)
  })
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
