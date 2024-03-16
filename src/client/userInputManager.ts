import {attributeSelector, cancelClustering, updateScatterMatrix, updateTimeline, verifyClustering} from "./client.ts";

const fileSelector = document.getElementById('filesSelect') as HTMLSelectElement
const timeSpanSelector = document.getElementById('timeSpanSelect') as HTMLSelectElement
const startButton = document.getElementById('startButton') as HTMLButtonElement

const attributeSelectionCancelButton = document.getElementById('attributeSelectionCancel') as HTMLButtonElement
const attributeSelectionVerifyButton = document.getElementById('attributeSelectionVerify') as HTMLButtonElement

const kInput = document.getElementById('kNumberInput') as HTMLInputElement
const maxIterationsInput = document.getElementById('IterNumberInput') as HTMLInputElement
const batchSizeInput = document.getElementById('BatchSizeInput') as HTMLInputElement

startButton.addEventListener('click', () => {
    if (fileSelector.value) {
        attributeSelector(fileSelector.value)
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
    const batchSize = clamp(batchSizeInput.valueAsNumber, 0, Infinity)
    batchSizeInput.value = batchSize.toString()

    verifyClustering(k, maxIter, batchSize)
})

kInput.addEventListener('change', () => {
    const k = clamp(kInput.valueAsNumber, 1, 10)
    kInput.value = k.toString()

    updateScatterMatrix(k)
    updateTimeline(parseInt(timeSpanSelector.value), k)
})

maxIterationsInput.addEventListener('change', () => {
    const maxIter = clamp(maxIterationsInput.valueAsNumber, 1, 10000)
    maxIterationsInput.value = maxIter.toString()
})

batchSizeInput.addEventListener('change', () => {
    const batchSize = clamp(batchSizeInput.valueAsNumber, 0, Infinity)
    batchSizeInput.value = batchSize.toString()
})

timeSpanSelector.addEventListener('change', () => {
    updateTimeline(parseInt(timeSpanSelector.value), kInput.valueAsNumber)
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
