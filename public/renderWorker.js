importScripts('https://cdn.jsdelivr.net/npm/d3@6.2.0/dist/d3.min.js');

// Listen for messages from the main thread
self.onmessage = function(event) {
    const { data, xDomain, yDomain, cellWidth, cellHeight, margin } = event.data;

    // Perform rendering tasks
    const imageData = renderDataPoints(data, xDomain, yDomain, cellWidth, cellHeight, margin);

    // Send back the rendered data
    self.postMessage({ imageData });
};

/**
 * Renders the data points on an off-screen canvas and returns the image data
 *
 * @param data The data points to render
 * @param xDomain The x domain of the data
 * @param yDomain The y domain of the data
 * @param cellWidth The width of the cell
 * @param cellHeight The height of the cell
 * @param margin The margin around the cell
 * @return {ImageData} The rendered image data
 */
function renderDataPoints(data, xDomain, yDomain, cellWidth, cellHeight, margin) {
    const colors = [
        '#ff6666',
        '#3388ff',
        '#99cc66',
        '#ff9966',
        '#33cccc',
        '#6666cc',
        '#ff66ff',
        '#ffcc66'
    ]
    // Create an off-screen canvas for rendering
    const offscreenCanvas = new OffscreenCanvas(1080, 1080);
    const offscreenContext = offscreenCanvas.getContext('2d');

    //since we cannot pass the scales to the worker, we need to recreate them
    const xScale = d3.scaleLinear().domain(xDomain).rangeRound([margin / 2, cellWidth - margin / 2]);
    const yScale = d3.scaleLinear().domain(yDomain).range([cellHeight - margin / 2, margin / 2]);

    const pointSize = 2;
    const imageData = offscreenContext.getImageData(0, 0, 1080, 1080);

    for(let index = 0; index < data[0].length; index++) {
        const x = Math.round(xScale(data[0][index]));
        const y = Math.round(yScale(data[1][index]));
        const color = colors[data[2][index]];

        renderAsCircle(imageData, x, y, color, pointSize, 1080, 1080);
    }

    return imageData;
}

/**
 * Renders a circle on the image data
 *
 * @param imageData The image data to render on
 * @param x The x coordinate of the center of the circle
 * @param y The y coordinate of the center of the circle
 * @param color The color of the circle
 * @param pointSize The size of the circle
 * @param cellWidth The width of the cell
 * @param cellHeight The height of the cell
 */
function renderAsCircle(imageData, x, y, color, pointSize, cellWidth, cellHeight) {
    for (let dx = -pointSize; dx <= pointSize; dx++) {
        for (let dy = -pointSize; dy <= pointSize; dy++) {
            const px = x + dx;
            const py = y + dy;
            if (px >= 0 && px < cellWidth && py >= 0 && py < cellHeight) {
                const distanceSquared = dx * dx + dy * dy;
                if (distanceSquared <= pointSize * pointSize) {
                    const i = (py * cellWidth + px) * 4;
                    imageData.data[i] = parseInt(color.substring(1, 3), 16); // R
                    imageData.data[i + 1] = parseInt(color.substring(3, 5), 16); // G
                    imageData.data[i + 2] = parseInt(color.substring(5, 7), 16); // B
                    imageData.data[i + 3] = 255; // A
                }
            }
        }
    }
}