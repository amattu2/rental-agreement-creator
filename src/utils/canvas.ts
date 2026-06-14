/**
 * A utility function to check if a canvas is blank (i.e., has no content on it).
 *
 * @param canvas The HTMLCanvasElement to check.
 * @returns true if the canvas is blank, false otherwise.
 */
export const isCanvasBlank = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d");
  if (!context || canvas.width === 0 || canvas.height === 0) {
    return true;
  }

  const pixelBuffer = new Uint32Array(
    context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
  );

  return !pixelBuffer.some((color) => color !== 0);
};
