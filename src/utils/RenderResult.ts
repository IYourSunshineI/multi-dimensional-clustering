/**
 * Util interface for the result of the render function
 */
export interface RenderResult {
    ImageData: FakeImageData,
    index: number
}

/**
 * Image Data type for the render function
 */
export type FakeImageData = {
    data: number[],
    colorSpace: PredefinedColorSpace,
    width: number,
    height: number
}

