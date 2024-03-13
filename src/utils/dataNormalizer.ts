import * as fs from "fs";
import * as readline from "readline";

/**
 * Normalizes the data in the given file and writes the normalized data to a new file.
 *
 * @param filename the name of the file to normalize
 */
export async function normalizeData(filename: string) {
    return new Promise<void>((resolve, reject) => {
        console.time('normalizeData')
        let fileStream = fs.createReadStream(`./public/datasets/${filename}.csv`)
        let rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let minValues: number[] = []
        let maxValues: number[] = []
        let lineNumber = -2
        rl.on('line', (rawLine) => {
            lineNumber++
            if (lineNumber === -1) return

            const line = rawLine.split(',').map(parseFloat)
                //.filter((value, index) => (!isNaN(value) && selectedAttributeIndices.includes(index)))

            for (let i = 0; i < line.length; i++) {
                if (lineNumber === 0) {
                    minValues.push(line[i])
                    maxValues.push(line[i])
                } else {
                    if (line[i] < minValues[i]) minValues[i] = line[i]
                    if (line[i] > maxValues[i]) maxValues[i] = line[i]
                }
            }
        })

        rl.on('close', () => {
            const writeStream = fs.createWriteStream(`./public/datasets/${filename}_normalized.csv`)
            fileStream = fs.createReadStream(`./public/datasets/${filename}.csv`)
            rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            let lineNumber = -2
            rl.on('line', (rawLine) => {
                lineNumber++
                if (lineNumber === -1) {
                    const line = rawLine.split(',')//.filter((_, index) => selectedAttributeIndices.includes(index))
                    writeStream.write(line + '\n')
                    return
                }

                const line = rawLine.split(',').map(parseFloat)
                    //.filter((value, index) => (!isNaN(value) && selectedAttributeIndices.includes(index)))
                const normalizedLine = line.map((value, i) => {
                    const mappedValue = (value - minValues[i]) / (maxValues[i] - minValues[i])
                    return isNaN(mappedValue) ? .5 : mappedValue
                })
                writeStream.write(normalizedLine.join(',') + '\n')
            })

            rl.on('close', () => {
                writeStream.close()
                console.timeEnd('normalizeData')
                resolve()
            })

            rl.on('error', (err) => {
                console.error(err)
                reject(err)
            })
        })

        rl.on('error', (err) => {
            console.error(err)
            reject(err)
        })
    })
}