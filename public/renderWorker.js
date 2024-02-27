importScripts('https://cdn.jsdelivr.net/npm/d3@6.2.0/dist/d3.min.js');

// Listen for messages from the main thread
self.onmessage = function(event) {
    const { chunk, clusterIndices, dimensions, xDomains, yDomains, cellWidth, cellHeight, wMargin } = event.data;

    // Perform rendering tasks
    const imageData = renderDataPoints(chunk, clusterIndices, dimensions, xDomains, yDomains, cellWidth, cellHeight, wMargin);

    // Send back the rendered data
    self.postMessage({ imageData });
};

function renderDataPoints(chunk, clusterIndices, dimensions, xDomain, yDomain, cellWidth, cellHeight, margin) {
    const colors = [
        '#ff0000',
        '#a1ff0a',
        '#147df5',
        '#ff8700',
        '#0aff99',
        '#deff0a',
        '#0aefff',
        '#be0aff',
        '#580aff',
        '#ffd300',
    ]
    // Create an off-screen canvas for rendering
    const offscreenCanvas = new OffscreenCanvas(850, 850);
    const offscreenContext = offscreenCanvas.getContext('2d');

    //since we cannot pass the scales to the worker, we need to recreate them
    const xScale = Array.from({ length: dimensions[0] }, (_, index) => index)
        .map(i => d3.scaleLinear().domain(xDomain[i]).range([margin / 2 + cellWidth * i, cellWidth - margin / 2 + cellWidth * i]));
    const yScale = Array.from({ length: dimensions[1] }, (_, index) => index)
        .map(i => d3.scaleLinear().domain(yDomain[i]).range([cellHeight - margin / 2 + cellHeight * i, margin / 2 + cellHeight * i]));


    // Render data points on the off-screen canvas
    chunk.forEach((d, index) => {
        for(let i = 0; i < dimensions[0]; i++) {
            for(let j = 0; j < dimensions[1]; j++) {
                if (i >= j) continue;
                offscreenContext.beginPath();
                offscreenContext.arc(xScale[i](d[i]) + margin, yScale[j](d[j]), 2.5, 0, 2 * Math.PI);
                offscreenContext.fillStyle = colors[clusterIndices[index]]
                offscreenContext.fill();
                //offscreenContext.strokeStyle = 'black';
                //offscreenContext.stroke();
                offscreenContext.closePath();
            }
        }
    });

    // Extract the rendered image data from the off-screen canvas
    const imageData = offscreenContext.getImageData(0, 0, 850, 850);

    // Return the rendered image data
    return imageData;
}
