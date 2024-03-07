import {attributeSelector, cancelClustering, updatePresentation, verifyClustering} from "./client.ts";

const fileSelector = document.getElementById('filesSelect') as HTMLSelectElement
const startButton = document.getElementById('startButton') as HTMLButtonElement

const attributeSelectionCancelButton = document.getElementById('attributeSelectionCancel') as HTMLButtonElement
const attributeSelectionVerifyButton = document.getElementById('attributeSelectionVerify') as HTMLButtonElement

const kInput = document.getElementById('kNumberInput') as HTMLInputElement
const maxIterationsInput = document.getElementById('IterNumberInput') as HTMLInputElement

let currentFilename: string

currentFilename = fileSelector.value;

fileSelector.addEventListener('change', () => {
    currentFilename = fileSelector.value
})

startButton.addEventListener('click', () => {
    if (currentFilename) {
        attributeSelector(currentFilename)
    }
})

attributeSelectionCancelButton.addEventListener('click', () => {
    cancelClustering()
})

attributeSelectionVerifyButton.addEventListener('click', () => {
    const k = clamp(kInput.valueAsNumber, 1, 10)
    kInput.value = k.toString()
    const maxIter = clamp(maxIterationsInput.valueAsNumber, 1, 10000)
    maxIterationsInput.value = maxIter.toString()

    verifyClustering(k, maxIter)
})

kInput.addEventListener('change', () => {
    const k = clamp(kInput.valueAsNumber, 1, 10)
    kInput.value = k.toString()

    updatePresentation(k)
})

/**
 * This function clamps a number between a minimum and a maximum value.
 *
 * @param num the number to clamp
 * @param min the minimum value
 * @param max the maximum value
 * @returns the clamped number
 */
function clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max)
}
