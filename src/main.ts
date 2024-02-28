import {Scatterplot} from "./plot/Scatterplot.ts";
import {BarChart} from "./plot/BarChart.ts";
import {TimeDataGroup} from "./utils/TimeDataGroup.ts";
import {CsvParser} from "./utils/CsvParser.ts";
import {kmeans} from "./clustering/kMeans.ts";
import {MCanvasScatterMatrix} from "./plot/MCanvasScatterMatrix.ts";

const data: number[] = [1, 4.2, 3, 4, 5, 5, 6, 6.2, 8, 9]

const elbowDomObj = document.getElementById('elbow')
if(elbowDomObj) {
    var plot = new Scatterplot(elbowDomObj, 500, 250, 30, true)
    plot.update(data)
}

const timeData: TimeDataGroup[] = [
    {countPerCluster: [5, 3, 2], timestamp: 'day1'},
    {countPerCluster: [7, 1, 2], timestamp: 'day2'},
    {countPerCluster: [3, 7, 0], timestamp: 'day3'},
    {countPerCluster: [4, 4, 2], timestamp: 'day4'},
    {countPerCluster: [5, 3, 2], timestamp: 'day5'},
    {countPerCluster: [7, 1, 2], timestamp: 'day6'},
    {countPerCluster: [3, 7, 0], timestamp: 'day7'},
    {countPerCluster: [4, 4, 2], timestamp: 'day8'},
    {countPerCluster: [5, 3, 2], timestamp: 'day9'},
    {countPerCluster: [7, 1, 2], timestamp: 'day10'},
    {countPerCluster: [3, 7, 0], timestamp: 'day11'},
    {countPerCluster: [4, 4, 2], timestamp: 'day12'},
    {countPerCluster: [5, 3, 2], timestamp: 'day13'},
    {countPerCluster: [7, 1, 2], timestamp: 'day14'},
    {countPerCluster: [3, 7, 0], timestamp: 'day15'},
]

const timeLineDomObj = document.getElementById('timeline')
if(timeLineDomObj) {
    var asdf = new BarChart(timeLineDomObj, 850, 250, 30)
    asdf.update(timeData)
}

const scatterMatrixDomObj = document.getElementById('scatterMatrix')

const centrifugalPumpsAttributes = ['machine_id', 'value_ISO','value_DEMO','value_ACC','value_P2P','valueTEMP']
const centrifugalPumps = 'centrifugal_pumps.csv'
const groveSensorsAttributes = ['Temperature','Humidity','Air Quality','Light','Loudness']
const groveSensors = 'grove_sensors.csv'
const sensordataAttributes = ['acce_max','acce_min','acce_std','stride_length','step_heading','rel_pos_x','rel_pos_y']
const sensordata = 'sensordata.csv'


const csvReader = new CsvParser(sensordata)
csvReader.parse(sensordataAttributes).then(() => {
    const clusterIndices = kmeans(csvReader.data, 4, 100)

    if(scatterMatrixDomObj) {
        const scatterMatrix = new MCanvasScatterMatrix(scatterMatrixDomObj, 850, 850, 15);
        //scatterMatrix.generate()
        scatterMatrix.update(csvReader.data, csvReader.attributes, clusterIndices)
    }
})
