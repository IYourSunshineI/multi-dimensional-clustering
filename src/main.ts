import {ConnectedScatterplot} from "./plot/ConnectedScatterplot.ts";

const data: number[] = [1, 4.2, 3, 4, 5, 5, 6, 6.2, 8, 9]

const elbowDomObj = document.getElementById('elbow')
if(elbowDomObj) {
        var plot = new ConnectedScatterplot(elbowDomObj, 500, 250, 30)
    plot.generate(data)
}

