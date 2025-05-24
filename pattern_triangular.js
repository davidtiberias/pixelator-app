// pattern_triangular.js
import { findClosestColor } from "./process.js"; // Import findClosestColor, drawShape is passed as param

export function drawTriangular(ctx, params) {
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
    enableColorLimit,
    dithering,
    vectorShape,
    vectorShapeSize,
    enableEdgeOutline,
    outlineWidth,
    outlineColor,
    shapeRotation,
    // imageMargin is implicitly handled by croppedWidth/Height and drawing loop
  } = settings;

  const triSide = pixelDensity;
  const triHeight = (triSide * Math.sqrt(3)) / 2;

  const fillExpansion = 0.5;
  const globalOffsetX = triSide / 2;
  const globalOffsetY = triHeight / 2;
  const userRotationRadians = shapeRotation * (Math.PI / 180);

  // Iterate over the full padded area (croppedWidth/Height now refers to padded dimensions)
  for (let row = -2; ; row++) {
    let yBase = row * triHeight + globalOffsetY;
    if (yBase > croppedHeight + triHeight) break; // Check against full padded height

    let xOffsetForRow = row % 2 !== 0 ? triSide / 2 : 0;

    for (let col = -2; ; col++) {
      let xBase = col * triSide + xOffsetForRow + globalOffsetX;
      if (xBase > croppedWidth + triSide) break; // Check against full padded width

      const drawX = xBase + triSide / 2;
      const drawY = yBase + triHeight / 2;

      const sampleX = Math.max(0, Math.floor(xBase));
      const sampleY = Math.max(0, Math.floor(yBase));
      const sampleWidth = triSide;
      const sampleHeight = triHeight;

      let avgColor = getAverageColor(
        sampleX,
        sampleY,
        sampleWidth,
        sampleHeight
      );
      if (enableColorLimit && dithering === "none") {
        avgColor = findClosestColor(avgColor, activePalette);
      }

      // x and y coordinates are already relative to the padded canvas
      drawShape(
        ctx,
        drawX,
        drawY,
        avgColor,
        triSide,
        vectorShape,
        0 + userRotationRadians,
        fillExpansion,
        enableEdgeOutline,
        outlineWidth,
        outlineColor,
        vectorShapeSize
      );
    }
  }
}
