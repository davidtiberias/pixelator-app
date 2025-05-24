// ui.js

// UI object to hold references to DOM elements
export const UI = {};

/**
 * Initializes the UI object by getting references to all necessary DOM elements.
 * This function should be called once the DOM is fully loaded.
 */
export function initUI() {
  // Image Source Section
  UI.imagePreview = document.getElementById("imagePreview");
  UI.noImageText = document.getElementById("noImageText");
  UI.originalDimensions = document.getElementById("originalDimensions");
  UI.originalFileSize = document.getElementById("originalFileSize");
  UI.outputDimensions = document.getElementById("outputDimensions");
  UI.imageUpload = document.getElementById("imageUpload");
  UI.imageUploadArea = document.getElementById("image-upload-area");
  UI.imageUrlInput = document.getElementById("imageUrlInput");
  UI.loadImageFromUrlBtn = document.getElementById("loadImageFromUrlBtn");
  UI.loadDefaultImageBtn = document.getElementById("loadDefaultImageBtn");

  // Main Controls
  UI.processImageBtn = document.getElementById("processImageBtn");
  UI.toggleImageBtn = document.getElementById("toggleImageBtn");
  UI.downloadImageBtn = document.getElementById("downloadImageBtn");
  UI.downloadSvgBtn = document.getElementById("downloadSvgBtn"); // New: SVG download button
  UI.downloadIcoBtn = document.getElementById("downloadIcoBtn"); // New: ICO download button
  UI.clearCanvasBtn = document.getElementById("clearCanvasBtn");

  // Debugging: Check if downloadIcoBtn is found
  if (!UI.downloadIcoBtn) {
    console.error(
      "UI.downloadIcoBtn is null. Element with ID 'downloadIcoBtn' not found."
    );
  }

  // Canvas Area
  UI.imageCanvas = document.getElementById("imageCanvas");
  UI.canvasPlaceholder = document.getElementById("canvas-placeholder");
  UI.errorMessage = document.getElementById("errorMessage");
  UI.loadingIndicator = document.getElementById("loadingIndicator");
  UI.processingIndicator = document.getElementById("processingIndicator");

  // Settings - General
  UI.imageMarginInput = document.getElementById("imageMarginInput");

  // Settings - Aspect Ratio
  UI.aspectRatioButtons = document.getElementById("aspect-ratio-buttons");
  UI.customRatioBtn = document.getElementById("customRatioBtn");
  UI.imageRatioInput = document.getElementById("imageRatioInput");

  // Settings - Pixelation Style
  UI.mainSizeInput = document.getElementById("mainSizeInput");
  UI.tessellationPatternSelect = document.getElementById(
    "tessellationPatternSelect"
  );
  UI.vectorShapeSelect = document.getElementById("vectorShapeSelect");
  UI.vectorShapeSizeInput = document.getElementById("vectorShapeSizeInput");
  UI.shapeRotationInput = document.getElementById("shapeRotationInput");

  // Settings - Offset (Grid Pattern Only)
  UI.offsetXInput = document.getElementById("offsetXInput");
  UI.offsetYInput = document.getElementById("offsetYInput");
  UI.offsetDirectionSelect = document.getElementById("offsetDirectionSelect");
  UI.offsetPatternSelect = document.getElementById("offsetPatternSelect");

  // Settings - Color Palette
  UI.enableColorLimit = document.getElementById("enableColorLimit");
  UI.numColorsInput = document.getElementById("numColorsInput");
  UI.ditheringSelect = document.getElementById("ditheringSelect");

  // Settings - Edge Outline
  UI.enableEdgeOutline = document.getElementById("enableEdgeOutline");
  UI.outlineWidthInput = document.getElementById("outlineWidthInput");
  UI.outlineColorPicker = document.getElementById("outlineColorPicker");

  // Settings - General (continued)
  UI.backgroundColorPicker = document.getElementById("backgroundColorPicker");
  UI.realtimePreviewToggle = document.getElementById("realtimePreviewToggle");
  UI.showStatsToggle = document.getElementById("showStatsToggle");
}

/**
 * Displays an error message to the user.
 * @param {string} message - The error message to display.
 */
export function showErrorMessage(message) {
  UI.errorMessage.textContent = message;
  UI.errorMessage.style.display = "block";
}

/**
 * Hides the error message.
 */
export function hideErrorMessage() {
  UI.errorMessage.style.display = "none";
  UI.errorMessage.textContent = "";
}

/**
 * Shows the loading indicator.
 */
export function showLoadingIndicator() {
  UI.loadingIndicator.style.display = "block";
}

/**
 * Hides the loading indicator.
 */
export function hideLoadingIndicator() {
  UI.loadingIndicator.style.display = "none";
}

/**
 * Shows the processing indicator.
 */
export function showProcessingIndicator() {
  UI.processingIndicator.style.display = "block";
}

/**
 * Hides the processing indicator.
 */
export function hideProcessingIndicator() {
  UI.processingIndicator.style.display = "none";
}

/**
 * Shows the canvas placeholder text.
 */
export function showCanvasPlaceholder() {
  UI.canvasPlaceholder.style.display = "block";
  UI.imageCanvas.style.display = "none";
}

/**
 * Hides the canvas placeholder text.
 */
export function hideCanvasPlaceholder() {
  UI.canvasPlaceholder.style.display = "none";
  UI.imageCanvas.style.display = "block";
}

/**
 * Shows the image preview.
 * @param {string} src - The source URL for the image preview.
 */
export function showImagePreview(src) {
  UI.imagePreview.src = src;
  UI.imagePreview.style.display = "block";
  UI.noImageText.style.display = "none";
}

/**
 * Hides the image preview.
 */
export function hideImagePreview() {
  UI.imagePreview.style.display = "none";
  UI.imagePreview.src = ""; // Clear the source
  UI.noImageText.style.display = "block";
}

/**
 * Sets the processing state, enabling/disabling buttons as appropriate.
 * @param {boolean} isProcessing - True if processing is active, false otherwise.
 * @param {boolean} allowDownload - True if PNG download button should be enabled.
 * @param {boolean} allowToggle - True if toggle button should be enabled.
 * @param {boolean} allowSvgDownload - True if SVG download button should be enabled.
 * @param {boolean} allowIcoDownload - True if ICO download button should be enabled.
 */
export function setProcessingState(
  isProcessing,
  allowDownload,
  allowToggle,
  allowSvgDownload,
  allowIcoDownload
) {
  UI.processImageBtn.disabled = isProcessing;
  UI.downloadImageBtn.disabled = !allowDownload;
  UI.downloadSvgBtn.disabled = !allowSvgDownload;
  UI.downloadIcoBtn.disabled = !allowIcoDownload; // New: Disable/enable ICO button
  UI.toggleImageBtn.disabled = !allowToggle;
  UI.clearCanvasBtn.disabled = isProcessing;

  // Disable all settings controls during processing
  const settingsControls = [
    UI.imageMarginInput,
    UI.mainSizeInput,
    UI.tessellationPatternSelect,
    UI.vectorShapeSelect,
    UI.vectorShapeSizeInput,
    UI.shapeRotationInput,
    UI.offsetXInput,
    UI.offsetYInput,
    UI.offsetDirectionSelect,
    UI.offsetPatternSelect,
    UI.backgroundColorPicker,
    UI.enableColorLimit,
    UI.numColorsInput,
    UI.ditheringSelect,
    UI.enableEdgeOutline,
    UI.outlineWidthInput,
    UI.outlineColorPicker,
    UI.realtimePreviewToggle,
    UI.showStatsToggle,
    // Aspect Ratio buttons
    ...Array.from(UI.aspectRatioButtons.children),
    UI.customRatioBtn,
    UI.imageRatioInput,
  ];

  settingsControls.forEach((control) => {
    // Only disable if it's not the color limit or edge outline checkbox,
    // or if the linked input is already disabled by the checkbox.
    if (control === UI.numColorsInput || control === UI.ditheringSelect) {
      control.disabled = isProcessing || !UI.enableColorLimit.checked;
    } else if (
      control === UI.outlineWidthInput ||
      control === UI.outlineColorPicker
    ) {
      control.disabled = isProcessing || !UI.enableEdgeOutline.checked;
    } else if (control === UI.imageRatioInput) {
      control.disabled =
        isProcessing || UI.customRatioBtn.dataset.active !== "true";
    } else {
      control.disabled = isProcessing;
    }
  });

  if (isProcessing) {
    showProcessingIndicator();
  } else {
    hideProcessingIndicator();
  }
}

/**
 * Updates the UI for aspect ratio buttons.
 * @param {HTMLElement} activeBtn - The button that should be marked as active.
 * @param {boolean} enableCustomInput - Whether the custom ratio input should be enabled.
 */
export function updateRatioUI(activeBtn, enableCustomInput) {
  Array.from(UI.aspectRatioButtons.children).forEach((btn) => {
    btn.classList.remove("active");
    btn.dataset.active = "false"; // Custom data attribute for tracking active state
  });
  activeBtn.classList.add("active");
  activeBtn.dataset.active = "true";

  UI.imageRatioInput.readOnly = !enableCustomInput;
  UI.imageRatioInput.disabled = !enableCustomInput;
  if (!enableCustomInput) {
    UI.imageRatioInput.value = "";
  }
}

/**
 * Updates the visibility and disabled state of offset controls based on the selected pattern.
 * @param {string} pattern - The selected tessellation pattern.
 */
export function updatePatternUI(pattern) {
  const offsetControls = [
    UI.offsetXInput,
    UI.offsetYInput,
    UI.offsetDirectionSelect,
    UI.offsetPatternSelect,
  ];
  const offsetDetails =
    document.querySelector("details > summary").parentElement; // Get the parent <details> element

  const isGridPattern = pattern === "grid";
  if (isGridPattern) {
    offsetDetails.removeAttribute("disabled");
    offsetControls.forEach((control) => (control.disabled = false));
  } else {
    offsetDetails.setAttribute("disabled", "true");
    offsetControls.forEach((control) => {
      control.disabled = true;
      // Reset values if disabled to avoid unexpected behavior
      if (control.tagName === "INPUT") control.value = 0;
      if (control.tagName === "SELECT") control.value = "none";
    });
  }
}

/**
 * Updates the original image information displayed in the UI.
 * @param {number} width - Original image width.
 * @param {number} height - Original image height.
 * @param {number} fileSizeKB - Original image file size in KB.
 */
export function updateOriginalImageInfo(width, height, fileSizeKB) {
  UI.originalDimensions.textContent = `Original: ${width}x${height} px`;
  UI.originalFileSize.textContent = `Size: ${fileSizeKB.toFixed(2)} KB`;
}

/**
 * Updates the output image information displayed in the UI.
 * @param {number} width - Output image width.
 * @param {number} height - Output image height.
 */
export function updateOutputImageInfo(width, height) {
  UI.outputDimensions.textContent = `Output: ${width}x${height} px`;
}

/**
 * Shows the image info block.
 */
export function showImageInfo() {
  document.getElementById("image-info").style.display = "block";
}

/**
 * Hides the image info block.
 */
export function hideImageInfo() {
  document.getElementById("image-info").style.display = "none";
}
