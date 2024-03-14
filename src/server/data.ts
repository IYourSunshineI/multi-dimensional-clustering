import * as fs from "fs";
import * as readline from "readline";

/**
 * This function is used to get all attributes of the dataset.
 *
 * @param filename The name of the file to get the attributes from
 * @returns The attributes of the dataset
 */
export async function getAllAttributes(filename: string): Promise<string[]> {
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

export async function getAttributes(filename: string, indices: number[]): Promise<string[]> {
    const attributes = await getAllAttributes(filename)
    return indices.map((index) => attributes[index])
}



/**
 * Get the number of lines in a file
 * (not including the first line, which is assumed to be the header)
 *
 * @param path The path to the file
 * @returns The number of lines in the file
 */
export async function getNumberOfLines(path: string) {
    const fileStream = fs.createReadStream(path)
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    let lineNumber = -1
    rl.on('line', () => {
        lineNumber++
    })

    return new Promise<number>((resolve, reject) => {
        rl.on('close', () => {
            rl.close()
            fileStream.close()
            resolve(lineNumber)
        })

        rl.on('error', (err) => {
            rl.close()
            fileStream.close()
            reject(err)
        })
    })
}