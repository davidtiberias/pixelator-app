// pattern_grid.js
import { findClosestColor } from "./process.js"; // Import findClosestColor, drawShape is passed as param

export function drawGrid(ctx, params) {
  // Accept ctx as a direct argument
  const {
    croppedWidth, // This now includes padding from process.js
    croppedHeight, // This now includes padding from process.js
    settings,
    getAverageColor,
    drawShape, // drawShape is now passed as a parameter
    activePalette,
  } = params;

  const {
    pixelDensity,
    offsetX,
    offsetY,
    offsetDirection,
    offsetPattern,
    vectorShape,
    enableColorLimit,
    dithering,
    vectorShapeSize,
    enableEdgeOutline,
    outlineWidth,
    outlineColor,
    shapeRotation,
    // imageMargin is implicitly handled by croppedWidth/Height and drawing loop
  } = settings;

  const squareFillExpansion = 0.5;
  const userRotationRadians = shapeRotation * (Math.PI / 180);

  // Iterate over the full padded area (croppedWidth/Height now refers to padded dimensions)
  for (let y = 0; y < croppedHeight; y += pixelDensity) {
    for (let x = 0; x < croppedWidth; x += pixelDensity) {
      let currentOffsetX = 0;
      let currentOffsetY = 0;

      const row = Math.floor(y / pixelDensity);
      const col = Math.floor(x / pixelDensity);

      if (offsetPattern === "alternating") {
        if (offsetDirection === "horizontal" && row % 2 !== 0) {
          currentOffsetX = offsetX;
        }
        if (offsetDirection === "vertical" && col % 2 !== 0) {
          currentOffsetY = offsetY;
        }
        if (offsetDirection === "checkerboard" && (row + col) % 2 !== 0) {
          currentOffsetX = offsetX;
          currentOffsetY = offsetY;
        }
      } else if (offsetPattern === "random") {
        if (
          offsetDirection === "horizontal" ||
          offsetDirection === "checkerboard"
        ) {
          currentOffsetX = Math.random() * offsetX;
        }
        if (
          offsetDirection === "vertical" ||
          offsetDirection === "checkerboard"
        ) {
          currentOffsetY = Math.random() * offsetY;
        }
      }

      let avgColor = getAverageColor(x, y, pixelDensity, pixelDensity);

      if (enableColorLimit && dithering === "none") {
        avgColor = findClosestColor(avgColor, activePalette);
      }

      // x and y coordinates are already relative to the padded canvas
      drawShape(
        ctx,
        x + pixelDensity / 2 + currentOffsetX,
        y + pixelDensity / 2 + currentOffsetY,
        avgColor,
        pixelDensity,
        vectorShape,
        0 + userRotationRadians,
        vectorShape === "square" ? squareFillExpansion : 0,
        enableEdgeOutline,
        outlineWidth,
        outlineColor,
        vectorShapeSize
      );
    }
  }
}
