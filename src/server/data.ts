import * as d3 from "d3"
import * as fs from "fs";
import * as readline from "readline";

/**
 * This function is used to get the attributes of the dataset.
 *
 * @param filename The name of the file to get the attributes from
 * @returns The attributes of the dataset
 */
export async function getAttributes(filename: string) {
    console.time('getAttributes')
    const path = `./public/datasets/${filename}.csv`;
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    return new Promise((resolve, reject) => {
        let firstLine = true
        rl.on('line', (rawLine) => {
            if (!firstLine) return
            firstLine = false
            rl.close()
            console.timeEnd('getAttributes')
            resolve(rawLine.split(','))
        })

        rl.on('error', (err) => {
            console.error(err)
            reject(err)
        })
    })
}

/**
 * This function is used to parse the csv file, only taking the attributes corresponding to the given {@link selectedAttributeIndices}
 * into account and normalize the data.
 *
 * @param filename The name of the file to parse
 * @param selectedAttributeIndices The indices of the attributes to parse
 * @returns The attributes and the normalized data
 */
export async function parseData(filename: string, selectedAttributeIndices: number[]) {
    const fileContent = fs.readFileSync('./public/datasets/' + filename + '.csv', 'utf-8')
    console.time('parseData')
    const data = d3.csvParse(fileContent)
    const attributes = data.columns.map((_, i) => selectedAttributeIndices.includes(i) ? data.columns[i] : null)
        .filter(attr => attr !== null) as string[]

    const parsedData = data.map(d => attributes.map(attr => {
        const parsed = parseFloat(d[attr])
        if(isNaN(parsed)) return d[attr]
        else return parsed
    }))
    console.timeEnd('parseData')
    const normalizedData = normalizeData(attributes, parsedData)
    return {attributes, data: normalizedData}
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