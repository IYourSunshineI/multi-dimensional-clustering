import * as d3 from "d3"
import * as fs from "fs";

/**
 * This function is used to get the attributes of the dataset.
 *
 * @param filename The name of the file to get the attributes from
 * @returns The attributes of the dataset
 */
export async function getAttributes(filename: string) {
    console.time('getAttributes')
    const fileContent = fs.readFileSync('./public/datasets/' + filename + '.csv', 'utf-8')
    const data = d3.csvParse(fileContent)
    console.timeEnd('getAttributes')
    return data.columns
}

/**
 * This function is used to parse the csv file and normalize the data.
 *
 * @param filename The name of the file to parse
 * @returns The normalized data
 */
export async function parseData(filename: string) {
    const fileContent = fs.readFileSync('./public/datasets/' + filename + '.csv', 'utf-8')
    console.time('parseData')
    const data = d3.csvParse(fileContent)
    const attributes = data.columns
    const parsedData = data.map(d => attributes.map(attr => {
        const parsed = parseFloat(d[attr])
        if(isNaN(parsed)) return d[attr]
        else return parsed
    }))
    console.timeEnd('parseData')
    return normalizeData(attributes, parsedData)
}

/**
 * This function normalizes the data, so the clustering process can
 * produce resonable results.
 *
 * @param attributes The attributes of the dataset
 * @param data The data of the dataset
 */
function normalizeData(attributes: string[], data: any[][]) {
    console.time('normalizeData')
    const columns = attributes.map((_, i) => data.map(d => d[i]))
    const minmax = columns.map(d => d3.extent(d))
    data = data.map(d => d.map((val, i) => {
        if(minmax[i][1] === minmax[i][0] || minmax[i][0] === Infinity || minmax[i][1] === Infinity) return 0
        return (val - minmax[i][0]) / (minmax[i][1] - minmax[i][0])
    }))
    console.timeEnd('normalizeData')
    return data
}