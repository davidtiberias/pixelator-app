// generateSVG.js

/**
 * Converts an RGB color object to a hex string.
 * @param {object} color - The color object {r, g, b, a}.
 * @returns {string} Hexadecimal color string (e.g., "#RRGGBB").
 */
function rgbToHex(color) {
  const r = Math.round(color.r).toString(16).padStart(2, "0");
  const g = Math.round(color.g).toString(16).padStart(2, "0");
  const b = Math.round(color.b).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

/**
 * Gets the color of a pixel from a Uint8ClampedArray.
 * This is a copy from process.js, as generateSVG operates independently on ImageData.
 * @param {Uint8ClampedArray} pixelsArray - The array containing pixel data.
 * @param {number} x - The X coordinate of the pixel.
 * @param {number} y - The Y coordinate of the pixel.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @returns {object|null} The color object {r, g, b, a} or null if out of bounds.
 */
function getPixelColorFromArray(pixelsArray, x, y, width, height) {
  if (x < 0 || x >= width || y < 0 || y >= height) return null;
  const i = (y * width + x) * 4;
  return {
    r: pixelsArray[i],
    g: pixelsArray[i + 1],
    b: pixelsArray[i + 2],
    a: pixelsArray[i + 3],
  };
}

/**
 * Generates an SVG string from processed ImageData based on pixelation settings.
 * @param {ImageData} imageData - The ImageData object (already includes padding and processing).
 * @param {object} settings - An object containing pixelation settings.
 * @returns {string} The complete SVG string.
 */
export function generateSVG(imageData, settings) {
  const {
    pixelDensity,
    tessellationPattern,
    vectorShape,
    vectorShapeSize,
    shapeRotation, // Degrees
    offsetX,
    offsetY,
    offsetDirection,
    offsetPattern,
    backgroundColor,
    enableEdgeOutline,
    outlineWidth,
    outlineColor,
  } = settings;

  const svgElements = [];
  const svgWidth = imageData.width;
  const svgHeight = imageData.height;
  const sourcePixels = imageData.data; // Use the already processed pixel data

  // Add background rectangle to SVG
  svgElements.push(
    `<rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${backgroundColor}" />`
  );

  // Helper for finding average color from the sourcePixels
  const getAverageColorForBlock = (startX, startY, blockSizeX, blockSizeY) => {
    let r = 0,
      g = 0,
      b = 0,
      a = 0;
    let count = 0;
    for (let y = startY; y < startY + blockSizeY; y++) {
      for (let x = startX; x < startX + blockSizeX; x++) {
        if (x >= 0 && x < svgWidth && y >= 0 && y < svgHeight) {
          const color = getPixelColorFromArray(
            sourcePixels,
            x,
            y,
            svgWidth,
            svgHeight
          );
          if (color) {
            r += color.r;
            g += color.g;
            b += color.b;
            a += color.a;
            count++;
          }
        }
      }
    }
    return count > 0
      ? { r: r / count, g: g / count, b: b / count, a: a / count }
      : { r: 0, g: 0, b: 0, a: 0 };
  };

  const userRotationRadians = shapeRotation * (Math.PI / 180);
  const fillExpansion = 0.5; // Same as in drawShape for consistency

  // Function to generate SVG shape string
  const createSvgShape = (
    x,
    y,
    color,
    size,
    shape,
    rotation,
    fillExpansion,
    enableOutline,
    outlineW,
    outlineC,
    sizeMultiplier
  ) => {
    const effectiveSize = size * sizeMultiplier;
    const currentFillSize = effectiveSize + fillExpansion * 2;
    const currentFillHeight = (currentFillSize * Math.sqrt(3)) / 2;

    let svgShape = "";
    const fillColor = rgbToHex(color);
    const strokeColor = outlineC;
    const strokeWidth = enableOutline ? outlineW : 0;

    const transform = `translate(${x}, ${y}) rotate(${
      rotation * (180 / Math.PI)
    })`;

    let commonAttrs = `fill="${fillColor}"`;
    if (strokeWidth > 0) {
      commonAttrs += ` stroke="${strokeColor}" stroke-width="${strokeWidth}"`;
    }

    switch (shape) {
      case "square":
        svgShape = `<rect x="${-currentFillSize / 2}" y="${
          -currentFillSize / 2
        }" width="${currentFillSize}" height="${currentFillSize}" ${commonAttrs} transform="${transform}" />`;
        break;
      case "circle":
        svgShape = `<circle cx="0" cy="0" r="${
          currentFillSize / 2
        }" ${commonAttrs} transform="${transform}" />`;
        break;
      case "triangle":
        const triPoints = [
          `0,${-currentFillHeight / 2}`,
          `${-currentFillSize / 2},${currentFillHeight / 2}`,
          `${currentFillSize / 2},${currentFillHeight / 2}`,
        ].join(" ");
        svgShape = `<polygon points="${triPoints}" ${commonAttrs} transform="${transform}" />`;
        break;
      case "hexagon":
        const hexPoints = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = currentFillSize * Math.cos(angle);
          const hy = currentFillSize * Math.sin(angle);
          hexPoints.push(`${hx},${hy}`);
        }
        svgShape = `<polygon points="${hexPoints.join(
          " "
        )}" ${commonAttrs} transform="${transform}" />`;
        break;
    }
    return svgShape;
  };

  // Replicate pattern drawing logic for SVG
  switch (tessellationPattern) {
    case "grid":
      for (let y = 0; y < svgHeight; y += pixelDensity) {
        for (let x = 0; x < svgWidth; x += pixelDensity) {
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

          const avgColor = getAverageColorForBlock(
            x,
            y,
            pixelDensity,
            pixelDensity
          );

          svgElements.push(
            createSvgShape(
              x + pixelDensity / 2 + currentOffsetX,
              y + pixelDensity / 2 + currentOffsetY,
              avgColor,
              pixelDensity,
              vectorShape,
              0 + userRotationRadians,
              vectorShape === "square" ? fillExpansion : 0,
              enableEdgeOutline,
              outlineWidth,
              outlineColor,
              vectorShapeSize
            )
          );
        }
      }
      break;
    case "hexagonal":
      const hexSide = pixelDensity;
      const isFlatTopGrid = false; // Always pointy-top for now, matching current pattern_hexagonal.js
      let hexWidth, hexHeight, xStep, yStep, baseRotationAngle;

      hexWidth = hexSide * Math.sqrt(3);
      hexHeight = hexSide * 2;
      xStep = hexWidth;
      yStep = hexHeight * 0.75;
      baseRotationAngle = Math.PI / 6; // Base rotation for pointy-top hex

      const globalOffsetX = hexWidth / 2;
      const globalOffsetY = hexHeight / 2;

      for (let row = -1; ; row++) {
        let yCenter = row * yStep + globalOffsetY;
        if (yCenter - hexHeight / 2 > svgHeight) break;

        let xRowOffset = row % 2 === 0 ? hexWidth / 2 : 0;

        for (let col = -1; ; col++) {
          let xCenter = col * xStep + xRowOffset + globalOffsetX;
          if (xCenter - hexWidth / 2 > svgWidth) break;

          if (xCenter + hexWidth / 2 < 0 || yCenter + hexHeight / 2 < 0) {
            continue;
          }

          const sampleX = Math.max(0, Math.floor(xCenter - hexWidth / 2));
          const sampleY = Math.max(0, Math.floor(yCenter - hexHeight / 2));
          const sampleWidth = hexWidth;
          const sampleHeight = hexHeight;

          const avgColor = getAverageColorForBlock(
            sampleX,
            sampleY,
            sampleWidth,
            sampleHeight
          );

          svgElements.push(
            createSvgShape(
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
            )
          );
        }
      }
      break;
    case "triangular":
      const triSide = pixelDensity;
      const triHeight = (triSide * Math.sqrt(3)) / 2;

      const triGlobalOffsetX = triSide / 2;
      const triGlobalOffsetY = triHeight / 2;

      for (let row = -2; ; row++) {
        let yBase = row * triHeight + triGlobalOffsetY;
        if (yBase > svgHeight + triHeight) break;

        let xOffsetForRow = row % 2 !== 0 ? triSide / 2 : 0;

        for (let col = -2; ; col++) {
          let xBase = col * triSide + xOffsetForRow + triGlobalOffsetX;
          if (xBase > svgWidth + triSide) break;

          const drawX = xBase + triSide / 2;
          const drawY = yBase + triHeight / 2;

          const sampleX = Math.max(0, Math.floor(xBase));
          const sampleY = Math.max(0, Math.floor(yBase));
          const sampleWidth = triSide;
          const sampleHeight = triHeight;

          const avgColor = getAverageColorForBlock(
            sampleX,
            sampleY,
            sampleWidth,
            sampleHeight
          );

          svgElements.push(
            createSvgShape(
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
            )
          );
        }
      }
      break;
    default:
      console.warn(
        `Unknown tessellation pattern for SVG: ${tessellationPattern}`
      );
  }

  return `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
    ${svgElements.join("\n    ")}
</svg>`;
}
