    import * as d3 from 'd3';

/**
 * This class is used to parse the provided csv files.
 *
 * @param datasetsPath The path to the datasets folder
 * @param fileName The name of the file to be parsed
 * @param attributes The attributes of the dataset
 * @param data The data of the dataset
 */
export class CsvParser {
    datasetsPath: string = '../../datasets/';
    fileName: string;
    public attributes: string[] = [];
    public data: any[][] = [];

    constructor(filePath: string) {
        this.fileName = filePath;
    }

    /**
     * This function is used to parse the csv file and normalize the data.
     */
    async parse() {
        console.time('csvParse')
        await d3.csv(this.datasetsPath + this.fileName)
            .then(data => {
                this.attributes = data.columns
                this.data = data.map(d => this.attributes.map(attr => {
                    const parsed = parseFloat(d[attr])
                    if(isNaN(parsed)) return d[attr]
                    else return parsed
                }))
                console.timeEnd('csvParse')
            });
        this.normalize()
    }

    /**
     * This function normalizes the data, so the clustering process can
     * produce resonable results.
     */
    normalize() {
        //normalize using d3
        const columns = this.attributes.map((_, i) => this.data.map(d => d[i]))
        const minmax = columns.map(d => d3.extent(d))
        this.data = this.data.map(d => d.map((val, i) => {
            if(minmax[i][1] === minmax[i][0]) return 0
            return (val - minmax[i][0]) / (minmax[i][1] - minmax[i][0])
        }))
    }
}