importScripts('https://cdn.jsdelivr.net/npm/d3@6.2.0/dist/d3.min.js');

// Listen for messages from the main thread
self.onmessage = function(event) {
    const { data, xDomain, yDomain, cellWidth, cellHeight, margin } = event.data;

    // Perform rendering tasks
    const imageData = renderDataPoints(data, xDomain, yDomain, cellWidth, cellHeight, margin);

    // Send back the rendered data
    self.postMessage({ imageData });
};

function renderDataPoints(data, xDomain, yDomain, cellWidth, cellHeight, margin) {
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
    // const offscreenCanvas = new OffscreenCanvas(cellWidth, cellHeight);
    const offscreenCanvas = new OffscreenCanvas(1080, 1080);
    const offscreenContext = offscreenCanvas.getContext('2d');

    //since we cannot pass the scales to the worker, we need to recreate them
    const xScale = d3.scaleLinear().domain(xDomain).rangeRound([margin / 2, cellWidth - margin / 2]);
    const yScale = d3.scaleLinear().domain(yDomain).range([cellHeight - margin / 2, margin / 2]);

    //render control Points
    //offscreenContext.beginPath();
    //offscreenContext.arc(xScale(0), yScale(0), 3, 0, 2 * Math.PI);
    //offscreenContext.fillStyle = 'black'
//
    //offscreenContext.arc(xScale(1), yScale(1), 3, 0, 2 * Math.PI);
    //offscreenContext.fillStyle = 'black'
    //offscreenContext.fill();
    //offscreenContext.closePath()


    // Render data points on the off-screen canvas
   //for(let index = 0; index < data[0].length; index++) {
   //    offscreenContext.beginPath();
   //    offscreenContext.arc(xScale(data[0][index]), yScale(data[1][index]), 3, 0, 2 * Math.PI);
   //    offscreenContext.fillStyle = colors[data[2][index]]
   //    offscreenContext.fill();
   //    //offscreenContext.strokeStyle = 'black';
   //    //offscreenContext.stroke();
   //    offscreenContext.closePath();
   //}
    const pointSize = 2;
    //const imageData = offscreenContext.getImageData(0, 0, cellWidth, cellHeight);
    const imageData = offscreenContext.getImageData(0, 0, 1080, 1080);
    //console.time('renderAsSquare')
    //for(let index = 0; index < data[0].length; index++) {
    //    const x = Math.round(xScale(data[0][index]));
    //    const y = Math.round(yScale(data[1][index]));
    //    const color = colors[data[2][index]];
//
    //    //renderAsSquare(imageData, x, y, color, pointSize, cellWidth, cellHeight);
    //    renderAsSquare(imageData, x, y, color, pointSize, 1080, 1080);
    //}
    //console.timeEnd('renderAsSquare')

    //console.time('renderAsCircle')
    for(let index = 0; index < data[0].length; index++) {
        const x = Math.round(xScale(data[0][index]));
        const y = Math.round(yScale(data[1][index]));
        const color = colors[data[2][index]];

        //renderAsCircle(imageData, x, y, color, pointSize, cellWidth, cellHeight);
        renderAsCircle(imageData, x, y, color, pointSize, 1080, 1080);
    }
    //console.timeEnd('renderAsCircle')

    // Extract the rendered image data from the off-screen canvas
    //const imageData = offscreenContext.getImageData(0, 0, cellWidth, cellHeight);

    // Return the rendered image data
    return imageData;
}

function renderAsCircle(imageData, x, y, color, pointSize, cellWidth, cellHeight) {
    for (let dx = -pointSize; dx <= pointSize; dx++) {
        for (let dy = -pointSize; dy <= pointSize; dy++) {
            const px = x + dx;
            const py = y + dy;
            if (px >= 0 && px < cellWidth && py >= 0 && py < cellHeight) {
                const distanceSquared = dx * dx + dy * dy;
                if (distanceSquared <= pointSize * pointSize) {
                    const i = (py * cellWidth + px) * 4;
                    imageData.data[i] = parseInt(color.substring(1, 3), 16);
                    imageData.data[i + 1] = parseInt(color.substring(3, 5), 16);
                    imageData.data[i + 2] = parseInt(color.substring(5, 7), 16);
                    imageData.data[i + 3] = 255;
                }
            }
        }
    }
}

function renderAsSquare(imageData, x, y, color, pointSize, cellWidth, cellHeight) {
    for (let dx = -pointSize; dx <= pointSize; dx++) {
        for (let dy = -pointSize; dy <= pointSize; dy++) {
            const px = x + dx;
            const py = y + dy;
            if (px >= 0 && px < cellWidth && py >= 0 && py < cellHeight) {
                const i = (py * cellWidth + px) * 4;
                imageData.data[i] = parseInt(color.substring(1, 3), 16);
                imageData.data[i + 1] = parseInt(color.substring(3, 5), 16);
                imageData.data[i + 2] = parseInt(color.substring(5, 7), 16);
                imageData.data[i + 3] = 255;
            }
        }
    }
}
