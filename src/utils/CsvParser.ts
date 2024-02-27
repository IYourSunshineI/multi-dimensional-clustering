import * as d3 from 'd3';
export class CsvParser {
    datasetsPath: string = '../../datasets/';
    fileName: string;
    public attributes: string[] = [];
    public data: any[][] = [];

    constructor(filePath: string) {
        this.fileName = filePath;
    }

    async parse(attributes: string[]) {
        console.time('csvParse')
        await d3.csv(this.datasetsPath + this.fileName)
            .then(data => {
                this.attributes = attributes
                this.data = data.map(d => attributes.map(attr => {
                    const parsed = parseFloat(d[attr])
                    if(isNaN(parsed)) return d[attr]
                    else return parsed
                }))
                console.timeEnd('csvParse')
            });
        //this.normalize()
    }

    normalize() {
        //normalize using d3
        const columns = this.attributes.map((_, i) => this.data.map(d => d[i]))
        const minmax = columns.map(d => d3.extent(d))
        this.data = this.data.map(d => d.map((val, i) => (val - minmax[i][0]) / (minmax[i][1] - minmax[i][0])))
    }
}