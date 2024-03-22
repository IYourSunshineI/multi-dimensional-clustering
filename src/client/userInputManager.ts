import {attributeSelector, cancelClustering, updateScatterMatrix, updateTimeline, verifyClustering} from "./client.ts";
import {clearHistory} from "./backendService.js";

const fileSelector = document.getElementById('filesSelect') as HTMLSelectElement
const timeSpanSelector = document.getElementById('timeSpanSelect') as HTMLSelectElement
const startButton = document.getElementById('startButton') as HTMLButtonElement
const clearHistoryButton = document.getElementById('clearHistoryButton') as HTMLButtonElement

const attributeSelectionCancelButton = document.getElementById('attributeSelectionCancel') as HTMLButtonElement
const attributeSelectionVerifyButton = document.getElementById('attributeSelectionVerify') as HTMLButtonElement

const kInput = document.getElementById('kNumberInput') as HTMLInputElement
const maxIterationsInput = document.getElementById('IterNumberInput') as HTMLInputElement
const batchSizeInput = document.getElementById('BatchSizeInput') as HTMLInputElement

const loadingSymbol = document.getElementById('loading-symbol') as HTMLElement

startButton.addEventListener('click', () => {
    if (fileSelector.value) {
        attributeSelector(fileSelector.value)
    }
})

clearHistoryButton.addEventListener('click', () => {
    const confirmation = confirm('Are you sure you want to delete all past results?')
    if (confirmation) {
        clearHistory()
        location.reload()
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

    loadingSymbol.classList.remove('hidden')
    verifyClustering(k, maxIter, batchSize).then(() => {
        loadingSymbol.classList.add('hidden')
    })
})

kInput.addEventListener('change', () => {
    const k = clamp(kInput.valueAsNumber, 1, 10)
    kInput.value = k.toString()
    const maxIter = clamp(maxIterationsInput.valueAsNumber, 1, Infinity)
    maxIterationsInput.value = maxIter.toString()
    const batchSize = clamp(batchSizeInput.valueAsNumber, 0, Infinity)
    batchSizeInput.value = batchSize.toString()

    loadingSymbol.classList.remove('hidden')
    const promises = []
    promises.push(updateScatterMatrix(k, maxIter, batchSize))
    promises.push(updateTimeline(parseInt(timeSpanSelector.value), k, maxIter, batchSize))
    Promise.all(promises).then(() => {
        loadingSymbol.classList.add('hidden')
    })
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
    loadingSymbol.classList.remove('hidden')
    updateTimeline(parseInt(timeSpanSelector.value), kInput.valueAsNumber, maxIterationsInput.valueAsNumber, batchSizeInput.valueAsNumber).then(() => {
        loadingSymbol.classList.add('hidden')
    })
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
