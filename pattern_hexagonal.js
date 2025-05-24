// pattern_hexagonal.js
import { findClosestColor } from "./process.js"; // Import findClosestColor, drawShape is passed as param

export function drawHexagonal(ctx, params) {
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
    tessellationPattern, // Now correctly destructuring tessellationPattern from settings
    // imageMargin is implicitly handled by croppedWidth/Height and drawing loop
  } = settings;

  const hexSide = pixelDensity;
  let hexWidth, hexHeight, xStep, yStep, baseRotationAngle;
  // Use tessellationPattern from settings to determine grid type
  const isFlatTopGrid =
    tessellationPattern === "hexagonal-flat-column-staggered";

  if (isFlatTopGrid) {
    hexWidth = hexSide * 2;
    hexHeight = hexSide * Math.sqrt(3);
    xStep = hexWidth * 0.75;
    yStep = hexHeight;
    baseRotationAngle = 0;
  } else {
    hexWidth = hexSide * Math.sqrt(3);
    hexHeight = hexSide * 2;
    xStep = hexWidth;
    yStep = hexHeight * 0.75;
    baseRotationAngle = Math.PI / 6; // Base rotation for pointy-top hex
  }

  const fillExpansion = 0.5;
  const globalOffsetX = hexWidth / 2;
  const globalOffsetY = hexHeight / 2;
  const userRotationRadians = shapeRotation * (Math.PI / 180);

  if (isFlatTopGrid) {
    // Iterate over the full padded area (croppedWidth/Height now refers to padded dimensions)
    for (let col = -1; ; col++) {
      let xCenter = col * xStep + globalOffsetX;
      if (xCenter - hexWidth / 2 > croppedWidth) break; // Check against full padded width

      let yColOffset = col % 2 === 0 ? hexHeight / 2 : 0;

      for (let row = -1; ; row++) {
        let yCenter = row * yStep + yColOffset + globalOffsetY;
        if (yCenter - hexHeight / 2 > croppedHeight) break; // Check against full padded height

        if (xCenter + hexWidth / 2 < 0 || yCenter + hexHeight / 2 < 0) {
          continue;
        }

        const sampleX = Math.max(0, Math.floor(xCenter - hexWidth / 2));
        const sampleY = Math.max(0, Math.floor(yCenter - hexHeight / 2));
        const sampleWidth = hexWidth;
        const sampleHeight = hexHeight;

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
          xCenter,
          yCenter,
          avgColor,
          hexSide,
          vectorShape,
          baseRotationAngle + userRotationRadians,
          fillExpansion,
          enableEdgeOutline,
          outlineWidth,
          outlineColor,
          vectorShapeSize
        );
      }
    }
  } else {
    // Pointy-top Hexagonal Grid with Row Staggering
    // Iterate over the full padded area (croppedWidth/Height now refers to padded dimensions)
    for (let row = -1; ; row++) {
      let yCenter = row * yStep + globalOffsetY;
      if (yCenter - hexHeight / 2 > croppedHeight) break; // Check against full padded height

      let xRowOffset = row % 2 === 0 ? hexWidth / 2 : 0;

      for (let col = -1; ; col++) {
        let xCenter = col * xStep + xRowOffset + globalOffsetX;
        if (xCenter - hexWidth / 2 > croppedWidth) break; // Check against full padded width

        if (xCenter + hexWidth / 2 < 0 || yCenter + hexHeight / 2 < 0) {
          continue;
        }

        const sampleX = Math.max(0, Math.floor(xCenter - hexWidth / 2));
        const sampleY = Math.max(0, Math.floor(yCenter - hexHeight / 2));
        const sampleWidth = hexWidth;
        const sampleHeight = hexHeight;

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
          xCenter,
          yCenter,
          avgColor,
          hexSide,
          vectorShape,
          baseRotationAngle + userRotationRadians,
          fillExpansion,
          enableEdgeOutline,
          outlineWidth,
          outlineColor,
          vectorShapeSize
        );
      }
    }
  }
}
