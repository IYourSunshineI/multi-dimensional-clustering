import * as readline from "readline";
import {EventEmitter} from "events";
import * as fs from "fs";

/**
 * Class to combine two streams line by line.
 */
export class StreamCombiner {
    stream1: readline.Interface | undefined
    stream2: readline.Interface | undefined
    bufferSize: number = 10
    buffer1: string[] = []
    buffer2: string[] = []

    constructor(path1: string, path2: string, bufferSize: number = 10) {
        this.bufferSize = bufferSize

        this.stream1 = readline.createInterface({
            input: fs.createReadStream(path1),
            crlfDelay: Infinity
        })
        this.stream2 = readline.createInterface({
            input: fs.createReadStream(path2),
            crlfDelay: Infinity
        })
    }

    /**
     * Get a combined stream from the two input streams.
     * @returns A combined stream.
     */
    public async getCombinedStream() {
        const combinedStream = new EventEmitter()
        let fstDone = false
        let sndDone = false

        const emitLine = () => {
            if (this.buffer1.length > 0 && this.buffer2.length > 0) {
                combinedStream.emit('line', this.buffer1.shift() + ',' + this.buffer2.shift())
            }
            checkBuffer()
        }

        const checkBuffer = () => {
            if (this.buffer1.length >= this.bufferSize) {
                this.stream1?.pause()
            } else {
                this.stream1?.resume()
            }
            if (this.buffer2.length >= this.bufferSize) {
                this.stream2?.pause()
            } else {
                this.stream2?.resume()
            }
        }


        this.stream1?.on('line', (line) => {
            checkBuffer()
            this.buffer1.push(line)
            emitLine()
        })

        this.stream2?.on('line', (line) => {
            checkBuffer()
            this.buffer2.push(line)
            emitLine()
        })

        this.stream1?.on('close', () => {
            fstDone = true
            if (sndDone) {
                combinedStream.emit('close')
            }
        })

        this.stream2?.on('close', () => {
            sndDone = true
            if (fstDone) {
                combinedStream.emit('close')
            }
        })

        return combinedStream
    }
}