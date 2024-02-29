import {start} from "./dataProcessor.ts";

const fileSelector = document.getElementById('filesSelect') as HTMLSelectElement
const startButton = document.getElementById('startButton') as HTMLButtonElement
let currentFilename: string

currentFilename = fileSelector.value;
fileSelector.addEventListener('change', (event) => {
    currentFilename = ((event.target) as HTMLSelectElement).value
})

startButton.addEventListener('click', () => {
    if(currentFilename) {
        start(currentFilename)
    }
})