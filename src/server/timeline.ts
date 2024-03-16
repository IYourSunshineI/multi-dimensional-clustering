import {TimeDataGroup} from "../utils/TimeDataGroup.js";
import {TimeSpan} from "../utils/TimeSpan.js";
import {StreamCombiner} from "../utils/StreamCombiner.js";


/**
 * This function calculates the timeline of the data.
 * It uses a StreamCombiner to combine the data and the clustering result.
 *
 * @param filePath the path to the data file
 * @param clusterResultPath the path to the clustering result
 * @param k the number of clusters
 * @param timeStampIndex the index of the timestamp attribute
 * @param timeSpan the time span (if eg. day is selected the timeline will be grouped by day)
 * @returns The timeline data
 */
export async function calculateTimeline(filePath: string, clusterResultPath: string, k: number, timeStampIndex: number, timeSpan: TimeSpan): Promise<TimeDataGroup[]> {
    return new Promise(async (resolve, reject) => {
        console.time('calculateTimeline')
        const timeDataGroups: Map<string, TimeDataGroup> = new Map()
        const stream = await new StreamCombiner(filePath, clusterResultPath).getCombinedStream()
        let lineNumber = -2

        stream.on('line', (line: string) => {
            lineNumber++
            if (lineNumber === -1) return

            const data = line.split(',')
            let timestamp = data[timeStampIndex]

            switch (timeSpan) {
                case TimeSpan.DAY:
                    timestamp = timestamp.slice(0, 10)
                    break
                case TimeSpan.HOUR:
                    timestamp = timestamp.slice(0, 13).concat(':00')
                    break
                case TimeSpan.MINUTE:
                    timestamp = timestamp.slice(0, 16)
                    break
                case TimeSpan.SECOND:
                    timestamp = timestamp.slice(0, 19)
                    break
                default:
                    reject(new Error('Invalid time span'))
            }

            const clusterIndex = parseInt(data[data.length - 11 + k])

            if (!timeDataGroups.has(timestamp)) {
                timeDataGroups.set(timestamp, {
                    countPerCluster: Array.from({length: k}).fill(0) as number[],
                    timestamp: timestamp
                })
            } else {
                const timeDataGroup = timeDataGroups.get(timestamp) as TimeDataGroup
                timeDataGroup.countPerCluster[clusterIndex]++
                timeDataGroups.set(timestamp, timeDataGroup)
            }
        })

        stream.on('close', () => {
            const timeDataGroupsArray = Array.from(timeDataGroups.values())
            console.timeEnd('calculateTimeline')
            resolve(timeDataGroupsArray)
        })
    })
}