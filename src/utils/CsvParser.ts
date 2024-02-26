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
    }
}