import {attributeSelector, cancelClustering, verifyClustering} from "./main.ts";

const fileSelector = document.getElementById('filesSelect') as HTMLSelectElement
const startButton = document.getElementById('startButton') as HTMLButtonElement

const attributeSelectionCancelButton = document.getElementById('attributeSelectionCancel') as HTMLButtonElement
const attributeSelectionVerifyButton = document.getElementById('attributeSelectionVerify') as HTMLButtonElement
let currentFilename: string

currentFilename = fileSelector.value;

fileSelector.addEventListener('change', (event) => {
    currentFilename = ((event.target) as HTMLSelectElement).value
})

startButton.addEventListener('click', () => {
    if(currentFilename) {
        attributeSelector(currentFilename)
    }
})

attributeSelectionCancelButton.addEventListener('click', () => {
    cancelClustering()
})

attributeSelectionVerifyButton.addEventListener('click', () => {
    verifyClustering()
})