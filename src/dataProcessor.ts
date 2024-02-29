import {BarChart} from "./plot/BarChart.ts";
import {Scatterplot} from "./plot/Scatterplot.ts";
import {ScatterMatrix} from "./plot/ScatterMatrix.ts";

const elbowDomObj = document.getElementById('elbow') as HTMLElement
const timelineDomObj = document.getElementById('timeline') as HTMLElement
const scattermatrixDomObj = document.getElementById('scatterMatrix') as HTMLElement

let elbow: Scatterplot
let timeline: BarChart
let scattermatrix: ScatterMatrix


//initialise all graphs
document.addEventListener('DOMContentLoaded', () => {
    elbow = new Scatterplot(elbowDomObj, 500, 300, 30, true)
    elbow.generate()

    timeline = new BarChart(timelineDomObj, 850, 350, 30)
    timeline.generate()

    scattermatrix = new ScatterMatrix(scattermatrixDomObj, 850, 850, 15)
    scattermatrix.generate()
})

export async function start(filename: string): Promise<void> {
    console.log(filename)
}