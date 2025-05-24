// stats.js

export const UI_Stats = {};

/**
 * Initializes the UI_Stats object by getting references to all necessary DOM elements for statistics.
 * This function should be called once the DOM is fully loaded.
 */
export function initStatsUI() {
  UI_Stats.statsContainer = document.getElementById("statsContainer");
  UI_Stats.processingTime = document.getElementById("processingTime");
  UI_Stats.canvasInitTime = document.getElementById("canvasInitTime"); // New
  UI_Stats.paletteGenTime = document.getElementById("paletteGenTime"); // New
  UI_Stats.ditheringTime = document.getElementById("ditheringTime"); // New
  UI_Stats.shapeDrawingTime = document.getElementById("shapeDrawingTime"); // New
  UI_Stats.finalColorCount = document.getElementById("finalColorCount");
}

/**
 * Updates the total processing time displayed in the UI.
 * @param {number} timeMs - The total processing time in milliseconds.
 */
export function updateTotalProcessingTime(timeMs) {
  UI_Stats.processingTime.textContent = `Total Processing Time: ${timeMs.toFixed(
    2
  )} ms`;
}

/**
 * Updates the detailed processing times for each step in the UI.
 * @param {object} timings - An object containing detailed timing statistics.
 * @param {number} [timings.canvasInit] - Time for canvas initialization.
 * @param {number} [timings.paletteGen] - Time for palette generation.
 * @param {number} [timings.dithering] - Time for dithering application.
 * @param {number} [timings.shapeDrawing] - Time for shape drawing loop.
 */
export function updateDetailedTimings(timings) {
  UI_Stats.canvasInitTime.textContent = `Canvas Init: ${
    timings.canvasInit !== undefined
      ? timings.canvasInit.toFixed(2) + " ms"
      : "N/A"
  }`;
  UI_Stats.paletteGenTime.textContent = `Palette Gen: ${
    timings.paletteGen !== undefined
      ? timings.paletteGen.toFixed(2) + " ms"
      : "N/A"
  }`;
  UI_Stats.ditheringTime.textContent = `Dithering: ${
    timings.dithering !== undefined
      ? timings.dithering.toFixed(2) + " ms"
      : "N/A"
  }`;
  UI_Stats.shapeDrawingTime.textContent = `Shape Drawing: ${
    timings.shapeDrawing !== undefined
      ? timings.shapeDrawing.toFixed(2) + " ms"
      : "N/A"
  }`;
}

/**
 * Updates the final color count displayed in the UI.
 * @param {number|string} count - The final number of colors or 'N/A'.
 */
export function updateFinalColorCount(count) {
  UI_Stats.finalColorCount.textContent = `Final Colors: ${count}`;
}

/**
 * Clears all displayed statistics.
 */
export function clearStats() {
  UI_Stats.processingTime.textContent = "Total Processing Time: -";
  UI_Stats.canvasInitTime.textContent = "Canvas Init: -"; // Clear new elements
  UI_Stats.paletteGenTime.textContent = "Palette Gen: -"; // Clear new elements
  UI_Stats.ditheringTime.textContent = "Dithering: -"; // Clear new elements
  UI_Stats.shapeDrawingTime.textContent = "Shape Drawing: -"; // Clear new elements
  UI_Stats.finalColorCount.textContent = "Final Colors: -";
}
