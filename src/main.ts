import {Scatterplot} from "./plot/Scatterplot.ts";
import {ScatterMatrix} from "./plot/ScatterMatrix.ts";

const data: number[] = [1, 4.2, 3, 4, 5, 5, 6, 6.2, 8, 9]

const elbowDomObj = document.getElementById('elbow')
if(elbowDomObj) {
    var plot = new Scatterplot(elbowDomObj, 500, 250, 30, true)
    plot.generate(data)
}

//d3.csv('../../datasets/grove_sensors.csv').then(data => {
//    console.log(data.columns.filter(d => typeof data[0][d] === 'number'))
//})

const scatterMatrixDomObj = document.getElementById('scatterMatrix')
const scatterData: number[][] = [
    [37.94,28.94,75,644,106],
    [37.94,29,75,645,145],
    [37.88,28.88,75,644,146],
    [37.72,28.94,75,646,139],
    [37.69,29.19,75,644,155],
    [37.78,29.06,75,644,163],
    [37.91,29,75,644,153],
    [38.06,28.88,75,643,149]
]
if(scatterMatrixDomObj) {
    var scatterMatrix = new ScatterMatrix(scatterMatrixDomObj, 900, 900, 30, ['Temperature','Humidity','Air Quality','Light','Loudness'])
    scatterMatrix.generate(scatterData)
}

