// process.js

// --- Helper Functions (Exported for use by other modules if needed) ---

/**
 * Finds the closest color in a given palette to a target color using Euclidean distance.
 * @param {object} color - The target color {r, g, b, a}.
 * @param {Array<object>} palette - An array of palette colors {r, g, b, a}.
 * @returns {object} The closest color from the palette.
 */
export function findClosestColor(color, palette) {
  let closest = palette[0];
  let minDistance = Infinity;

  for (const pColor of palette) {
    const dr = color.r - pColor.r;
    const dg = color.g - pColor.g;
    const db = color.b - pColor.b;
    const distance = dr * dr + dg * dg + db * db; // Squared Euclidean distance

    if (distance < minDistance) {
      minDistance = distance;
      closest = pColor;
    }
  }
  return closest;
}

/**
 * Generates a simple uniform color palette by distributing colors evenly across the RGB cube.
 * @param {number} numColors - The desired number of colors in the palette.
 * @returns {Array<object>} An array of generated colors {r, g, b, a}.
 */
export function generateUniformPalette(numColors) {
  const palette = [];
  if (numColors <= 0) return palette;

  const numStepsPerChannel = Math.ceil(Math.cbrt(numColors));
  const stepSize = numStepsPerChannel > 1 ? 255 / (numStepsPerChannel - 1) : 0;

  for (let i = 0; i < numStepsPerChannel; i++) {
    const r = Math.round(i * stepSize);
    for (let j = 0; j < numStepsPerChannel; j++) {
      const g = Math.round(j * stepSize);
      for (let k = 0; k < numStepsPerChannel; k++) {
        const b = Math.round(k * stepSize);
        palette.push({ r: r, g: g, b: b, a: 255 });
        if (palette.length >= numColors) return palette;
      }
    }
  }
  while (palette.length < numColors) {
    palette.push({
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
      a: 255,
    });
  }
  return palette.slice(0, numColors);
}

/**
 * Gets the color of a pixel from a Uint8ClampedArray.
 * @param {Uint8ClampedArray|Int32Array} pixelsArray - The array containing pixel data.
 * @param {number} x - The X coordinate of the pixel.
 * @param {number} y - The Y coordinate of the pixel.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @returns {object|null} The color object {r, g, b, a} or null if out of bounds.
 */
export function getPixelColorFromArray(pixelsArray, x, y, width, height) {
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
 * Sets the color of a pixel in a Uint8ClampedArray.
 * @param {Uint8ClampedArray} pixelsArray - The array containing pixel data.
 * @param {number} x - The X coordinate of the pixel.
 * @param {number} y - The Y coordinate of the pixel.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {object} color - The color object {r, g, b, a} to set.
 */
export function setPixelColorInArray(pixelsArray, x, y, width, height, color) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const i = (y * width + x) * 4;
  pixelsArray[i] = Math.max(0, Math.min(255, color.r));
  pixelsArray[i + 1] = Math.max(0, Math.min(255, color.g));
  pixelsArray[i + 2] = Math.max(0, Math.min(255, color.b));
  pixelsArray[i + 3] = Math.max(0, Math.min(255, color.a));
}

/**
 * Applies Floyd-Steinberg dithering to the pixel data.
 * Modifies the original pixelData array in place.
 * @param {Uint8ClampedArray} pixelData - The image pixel data.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {Array<object>} palette - The color palette to quantize to.
 */
export function applyFloydSteinbergDithering(
  pixelData,
  width,
  height,
  palette
) {
  // Create a mutable copy of the pixel data for error propagation
  const pixels = new Int32Array(pixelData.length); // Use Int32Array to handle errors before clamping
  for (let i = 0; i < pixelData.length; i++) {
    pixels[i] = pixelData[i];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const oldColor = getPixelColorFromArray(pixels, x, y, width, height);
      if (!oldColor) continue;

      const newColor = findClosestColor(oldColor, palette);
      setPixelColorInArray(pixelData, x, y, width, height, newColor); // Write quantized color to original pixelData

      const errorR = oldColor.r - newColor.r;
      const errorG = oldColor.g - newColor.g;
      const errorB = oldColor.b - newColor.b;

      // Distribute error
      const distributeError = (dx, dy, weight) => {
        const targetX = x + dx;
        const targetY = y + dy;
        if (
          targetX >= 0 &&
          targetX < width &&
          targetY >= 0 &&
          targetY < height
        ) {
          const i = (targetY * width + targetX) * 4;
          pixels[i] += errorR * weight;
          pixels[i + 1] += errorG * weight;
          pixels[i + 2] += errorB * weight;
        }
      };

      distributeError(1, 0, 7 / 16);
      distributeError(-1, 1, 3 / 16);
      distributeError(0, 1, 5 / 16);
      distributeError(1, 1, 1 / 16);
    }
  }
}

/**
 * Applies Atkinson dithering to the pixel data.
 * Modifies the original pixelData array in place.
 * @param {Uint8ClampedArray} pixelData - The image pixel data.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {Array<object>} palette - The color palette to quantize to.
 */
export function applyAtkinsonDithering(pixelData, width, height, palette) {
  const pixels = new Int32Array(pixelData.length);
  for (let i = 0; i < pixelData.length; i++) {
    pixels[i] = pixelData[i];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const oldColor = getPixelColorFromArray(pixels, x, y, width, height);
      if (!oldColor) continue;

      const newColor = findClosestColor(oldColor, palette);
      setPixelColorInArray(pixelData, x, y, width, height, newColor);

      const errorR = (oldColor.r - newColor.r) / 8;
      const errorG = (oldColor.g - newColor.g) / 8;
      const errorB = (oldColor.b - newColor.b) / 8;

      const distributeError = (dx, dy) => {
        const targetX = x + dx;
        const targetY = y + dy;
        if (
          targetX >= 0 &&
          targetX < width &&
          targetY >= 0 &&
          targetY < height
        ) {
          const i = (targetY * width + targetX) * 4;
          pixels[i] += errorR;
          pixels[i + 1] += errorG;
          pixels[i + 2] += errorB;
        }
      };

      distributeError(1, 0);
      distributeError(2, 0);
      distributeError(-1, 1);
      distributeError(0, 1);
      distributeError(1, 1);
      distributeError(0, 2);
    }
  }
}

/**
 * Applies Ordered (Bayer Matrix) dithering to the pixel data.
 * Modifies the original pixelData array in place.
 * @param {Uint8ClampedArray} pixelData - The image pixel data.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {Array<object>} palette - The color palette to quantize to.
 */
export function applyOrderedDithering(pixelData, width, height, palette) {
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const matrixSize = bayerMatrix.length;
  const maxVal = matrixSize * matrixSize;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const oldColor = getPixelColorFromArray(pixelData, x, y, width, height);
      if (!oldColor) continue;

      const threshold = bayerMatrix[y % matrixSize][x % matrixSize] / maxVal;

      const ditheredColor = {
        r:
          oldColor.r +
          (oldColor.r > 127
            ? (255 - oldColor.r) * threshold
            : -oldColor.r * threshold),
        g:
          oldColor.g +
          (oldColor.g > 127
            ? (255 - oldColor.g) * threshold
            : -oldColor.g * threshold),
        b:
          oldColor.b +
          (oldColor.b > 127
            ? (255 - oldColor.b) * threshold
            : -oldColor.b * threshold),
        a: oldColor.a,
      };

      setPixelColorInArray(
        pixelData,
        x,
        y,
        width,
        height,
        findClosestColor(ditheredColor, palette)
      );
    }
  }
}

/**
 * Draws a specified shape on the canvas context.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {number} x - Center X coordinate for drawing.
 * @param {number} y - Center Y coordinate for drawing.
 * @param {object} color - The fill color {r, g, b, a}.
 * @param {number} size - The base size of the shape (e.g., pixelDensity).
 * @param {string} shape - The shape type ('square', 'circle', 'triangle', 'hexagon').
 * @param {number} [rotation=0] - Rotation in radians for the shape.
 * @param {number} [fillExpansion=0] - Optional: amount to expand fill size to prevent gaps.
 * @param {boolean} enableEdgeOutline - Whether to draw outlines around pixels.
 * @param {number} outlineWidth - The width of the pixel outlines.
 * @param {string} outlineColor - The color of the pixel outlines.
 * @param {number} vectorShapeSizeMultiplier - Multiplier for the shape's size.
 */
export const drawShape = (
  ctx,
  x,
  y,
  color,
  size,
  shape,
  rotation = 0,
  fillExpansion = 0,
  enableEdgeOutline,
  outlineWidth,
  outlineColor,
  vectorShapeSizeMultiplier
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation); // Apply the final rotation received

  ctx.fillStyle = `rgba(${Math.round(color.r)}, ${Math.round(
    color.g
  )}, ${Math.round(color.b)}, ${color.a / 255})`;

  // Apply the multiplier to the base size for the fill
  const effectiveSize = size * vectorShapeSizeMultiplier;
  const currentFillSize = effectiveSize + fillExpansion * 2;
  const currentFillHeight = (currentFillSize * Math.sqrt(3)) / 2; // For triangle

  switch (shape) {
    case "square":
      ctx.fillRect(
        -currentFillSize / 2,
        -currentFillSize / 2,
        currentFillSize,
        currentFillSize
      );
      break;
    case "circle":
      ctx.beginPath();
      ctx.arc(0, 0, currentFillSize / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -currentFillHeight / 2);
      ctx.lineTo(-currentFillSize / 2, currentFillHeight / 2);
      ctx.lineTo(currentFillSize / 2, currentFillHeight / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case "hexagon":
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = currentFillSize * Math.cos(angle);
        const hy = currentFillSize * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(hx, hy);
        } else {
          ctx.lineTo(hx, hy);
        }
      }
      ctx.closePath();
      ctx.fill();
      break;
  }

  if (enableEdgeOutline && outlineWidth > 0) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.lineJoin = "round";

    ctx.beginPath();
    switch (shape) {
      case "square":
        ctx.rect(
          -effectiveSize / 2,
          -effectiveSize / 2,
          effectiveSize,
          effectiveSize
        );
        break;
      case "circle":
        ctx.arc(0, 0, effectiveSize / 2, 0, Math.PI * 2);
        break;
      case "triangle":
        const originalHeight = (effectiveSize * Math.sqrt(3)) / 2;
        ctx.moveTo(0, -originalHeight / 2);
        ctx.lineTo(-effectiveSize / 2, originalHeight / 2);
        ctx.lineTo(effectiveSize / 2, originalHeight / 2);
        ctx.closePath();
        break;
      case "hexagon":
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = effectiveSize * Math.cos(angle);
          const hy = effectiveSize * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(hx, hy);
          } else {
            ctx.lineTo(hx, hy);
          }
        }
        ctx.closePath();
        break;
    }
    ctx.stroke();
  }

  ctx.restore();
};

// --- Pattern Drawing Functions (Imported from separate files) ---
import { drawGrid } from "./pattern_grid.js";
import { drawHexagonal } from "./pattern_hexagonal.js";
import { drawTriangular } from "./pattern_triangular.js";

/**
 * Processes the image data to apply pixelation effects based on provided settings.
 * This function draws the pixelated image onto the canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {ImageData} imageData - The ImageData object of the source image (already includes padding if applicable).
 * @param {number} processedWidth - The width of the image data (cropped source width + 2*margin).
 * @param {number} processedHeight - The height of the image data (cropped source height + 2*margin).
 * @param {object} settings - An object containing all pixelation settings.
 * @returns {Promise<object>} A promise that resolves with an object containing processing results (e.g., finalColorCount, detailedTimings).
 */
export async function processImage(
  ctx,
  imageData,
  processedWidth, // This now includes padding
  processedHeight, // This now includes padding
  settings
) {
  return new Promise((resolve, reject) => {
    try {
      const {
        pixelDensity,
        tessellationPattern,
        vectorShape,
        vectorShapeSize,
        shapeRotation,
        offsetX,
        offsetY,
        offsetDirection,
        offsetPattern,
        backgroundColor,
        enableColorLimit,
        numColors,
        dithering,
        enableEdgeOutline,
        outlineWidth,
        outlineColor,
        imageMargin, // Accepted, but not used for drawing coordinates here
      } = settings;

      const detailedTimings = {};
      let stepStartTime;

      // 1. Canvas Initialization & Background
      stepStartTime = performance.now();
      const canvas = ctx.canvas;
      // Set canvas dimensions to match the processed imageData dimensions (which include padding)
      canvas.width = processedWidth;
      canvas.height = processedHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      detailedTimings.canvasInit = performance.now() - stepStartTime;

      const sourcePixels = new Uint8ClampedArray(imageData.data);
      const sourceWidth = imageData.width; // This is now processedWidth
      const sourceHeight = imageData.height; // This is now processedHeight

      let activePalette = [];
      let finalColorCount = "N/A";

      // 2. Color Palette Generation (if enabled)
      stepStartTime = performance.now();
      if (enableColorLimit) {
        activePalette = generateUniformPalette(numColors);
        finalColorCount = activePalette.length;
      }
      detailedTimings.paletteGen = performance.now() - stepStartTime;

      // 3. Dithering Application (if enabled and color limit is on)
      stepStartTime = performance.now();
      if (enableColorLimit && dithering !== "none") {
        if (dithering === "floyd-steinberg") {
          applyFloydSteinbergDithering(
            sourcePixels,
            sourceWidth,
            sourceHeight,
            activePalette
          );
        } else if (dithering === "atkinson") {
          applyAtkinsonDithering(
            sourcePixels,
            sourceWidth,
            sourceHeight,
            activePalette
          );
        } else if (dithering === "ordered") {
          applyOrderedDithering(
            sourcePixels,
            sourceWidth,
            sourceHeight,
            activePalette
          );
        }
      }
      detailedTimings.dithering = performance.now() - stepStartTime;

      // Helper for finding average color from the (potentially dithered) sourcePixels
      // This now operates on the full processedWidth/Height, including padding
      const getAverageColorForBlock = (
        startX,
        startY,
        blockSizeX,
        blockSizeY
      ) => {
        let r = 0,
          g = 0,
          b = 0,
          a = 0;
        let count = 0;
        for (let y = startY; y < startY + blockSizeY; y++) {
          for (let x = startX; x < startX + blockSizeX; x++) {
            if (x >= 0 && x < sourceWidth && y >= 0 && y < sourceHeight) {
              const index = (y * sourceWidth + x) * 4;
              r += sourcePixels[index];
              g += sourcePixels[index + 1];
              b += sourcePixels[index + 2];
              a += sourcePixels[index + 3];
              count++;
            }
          }
        }
        return count > 0
          ? { r: r / count, g: g / count, b: b / count, a: a / count }
          : { r: 0, g: 0, b: 0, a: 0 };
      };

      // Prepare common parameters to pass to pattern functions
      const commonParams = {
        croppedWidth: processedWidth, // Pass the processed width/height (which includes padding)
        croppedHeight: processedHeight,
        settings, // Pass all settings, including shapeRotation
        getAverageColor: getAverageColorForBlock,
        drawShape: drawShape,
        activePalette,
        findClosestColor: findClosestColor,
      };

      // 4. Main Drawing Loop (Pixel Sampling, Color Finding & Shape Drawing)
      stepStartTime = performance.now();
      switch (tessellationPattern) {
        case "grid":
          drawGrid(ctx, commonParams);
          break;
        case "hexagonal":
          drawHexagonal(ctx, commonParams); // Removed redundant patternType here
          break;
        case "triangular":
          drawTriangular(ctx, commonParams);
          break;
        default:
          console.warn(`Unknown tessellation pattern: ${tessellationPattern}`);
      }
      detailedTimings.shapeDrawing = performance.now() - stepStartTime;

      resolve({
        finalColorCount: finalColorCount,
        detailedTimings: detailedTimings,
      });
    } catch (error) {
      reject(error);
    }
  });
}
