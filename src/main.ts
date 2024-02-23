import {Scatterplot} from "./plot/Scatterplot.ts";
import {ScatterMatrix} from "./plot/ScatterMatrix.ts";

const data: number[] = [1, 4.2, 3, 4, 5, 5, 6, 6.2, 8, 9]

const elbowDomObj = document.getElementById('elbow')
if(elbowDomObj) {
    var plot = new Scatterplot(elbowDomObj, 500, 250, 30, true)
    plot.generate(data)
}
const timeLineDomObj = document.getElementById('timeline')
if(timeLineDomObj) {
    var plot = new Scatterplot(timeLineDomObj, 500, 250, 30, false)
    plot.generate(data)
}

//d3.csv('../../datasets/grove_sensors.csv').then(data => {
//    console.log(data.columns.filter(d => typeof data[0][d] === 'number'))
//})

const scatterMatrixDomObj = document.getElementById('scatterMatrix')
const scatterData: number[][] = [
    [9.852058538,4.703398104,9.247549038,0.602536768,3.650031694,0.293323535,-0.526319163],
    [16.79091526,3.255020724,21.00606742,1.130886356,3.602144066,0.502613545,-1.013056551],
    [17.46952058,4.073326897,22.17926192,1.530507075,3.906376517,1.059694119,-1.104309866],
    [14.49093428,5.920092373,9.703370132,1.368818475,3.940593959,0.98097736,-0.954645188],
    [14.37429607,6.105714863,8.789488075,1.027657273,4.00822659,0.783233188,-0.665300868],
    [13.98198529,4.915467607,10.38644376,1.015095006,3.947408116,0.732285081,-0.702976836],
    [16.68705282,4.470372439,18.32498788,1.162394771,4.094625384,0.947556145,-0.673274799],
    [14.60599528,6.233633551,9.044094182,1.360824072,4.1103426,1.121561826,-0.770675824],
    [13.49610712,7.404571202,4.81312651,0.92823478,4.377994168,0.876819023,-0.304644394],
    [12.89686915,6.708000204,4.841838011,0.778300797,4.423448448,0.746037346,-0.221766567],
    [13.22661391,7.485761455,4.095057794,0.760154278,4.547906756,0.74989468,-0.124468851],
    [12.64382266,8.380251902,2.176973168,0.680966451,4.443727602,0.656538199,-0.180756466],
    [10.67910934,9.422040237,0.2310321,0.45503683,4.23725187,0.404632403,-0.208161318],
    [12.8460823,6.839242883,4.213334325,0.62621216,3.171382221,0.01865183,-0.625934325],
    [13.16230607,7.593135472,3.896477068,0.614479815,3.078749071,-0.0385907,-0.613266827],
    [12.12026827,8.694235283,1.520049226,0.630708685,3.148434809,0.004315373,-0.630693922],
    [9.852836272,7.564360084,0.830472221,0.491979029,4.674299189,0.491622182,-0.018734847],
    [17.08905174,2.748233063,23.34753094,0.80773883,4.736107184,0.807511642,0.019156318],
    [19.11823075,3.276042972,31.94084093,1.596040017,4.73076703,1.595770491,0.029330452],
    [19.89950377,2.283631304,37.98534901,1.638951214,4.811722433,1.630871984,0.162535082],
    [18.99888096,3.87056353,28.59211696,1.577748021,4.853482948,1.562069542,0.221872859],
    [15.48223443,5.082757246,14.3884647,1.43662316,4.861167601,1.420752585,0.212951163],
    [15.39036763,5.281806706,13.24421063,1.284608368,4.885158022,1.265483782,0.22083808],
    [15.29001989,5.53084764,11.92470893,1.215200994,4.940364269,1.183758868,0.274642307],
    [15.77602061,4.821328537,13.9952985,1.190053639,4.780108186,1.187325953,0.080527906],
    [14.9367142,7.017448145,8.154365781,1.182367838,4.808131786,1.17695278,0.113030343],
    [10.98677057,8.976198248,0.255450107,0.603318061,6.001561607,0.167671591,0.57955062],
    [12.35081467,6.250501345,4.418635019,0.628634232,0.131863807,-0.082654084,0.623176781],
    [15.69315366,3.740026226,16.31835825,0.884080975,0.061426287,-0.054271667,0.882413597],
    [18.03029033,2.643089671,29.84926395,1.495874739,0.14890336,-0.221918577,1.479321932]
]
if(scatterMatrixDomObj) {
    const scatterMatrix = new ScatterMatrix(scatterMatrixDomObj, 850, 850, 15, ['acce_max', 'acce_min', 'acce_std', 'stride_length', 'step_heading', 'rel_pos_x', 'rel_pos_y']);
    scatterMatrix.generate(scatterData)
}

