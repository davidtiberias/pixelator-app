// script.js
import {
  UI,
  initUI,
  showErrorMessage,
  hideErrorMessage,
  showLoadingIndicator,
  hideLoadingIndicator,
  showProcessingIndicator,
  hideProcessingIndicator,
  showCanvasPlaceholder,
  hideCanvasPlaceholder,
  showImagePreview,
  hideImagePreview,
  setProcessingState,
  updateRatioUI,
  updatePatternUI,
  showImageInfo,
  updateOriginalImageInfo,
  updateOutputImageInfo,
} from "./ui.js";
import { processImage } from "./process.js";
import {
  UI_Stats,
  initStatsUI,
  updateTotalProcessingTime,
  updateDetailedTimings,
  updateFinalColorCount,
  clearStats,
} from "./stats.js";
import { generateSVG } from "./generateSVG.js"; // New: Import generateSVG

// --- Global Variables ---
let originalImage = new Image();
let currentAspectRatio = "original";
let customRatioValue = 1;
let currentImageLoaded = false;
let ctx;

let isShowingOriginal = false; // State for toggle button
// Store cropping parameters to be reused for drawing original and processed images
let currentCropParams = { sx: 0, sy: 0, sWidth: 0, sHeight: 0 };
let currentImageMargin = 0; // Global variable for image margin

// New: Store the last processed ImageData and settings for SVG generation
let lastProcessedImageData = null;
let lastProcessedSettings = null;

// --- Utility Functions ---

/**
 * Calculates the source crop parameters based on original image dimensions and selected aspect ratio.
 * @param {number} originalWidth - The original width of the image.
 * @param {number} originalHeight - The original height of the image.
 * @param {string} aspectRatio - The selected aspect ratio ('1:1', '16:9', '4:3', 'original', 'custom').
 * @param {number} customRatio - The custom ratio value if aspectRatio is 'custom'.
 * @returns {object} An object containing sx, sy, sWidth, sHeight for cropping.
 */
function calculateCropParameters(
  originalWidth,
  originalHeight,
  aspectRatio,
  customRatio
) {
  let sx = 0,
    sy = 0,
    sWidth = originalWidth,
    sHeight = originalHeight;
  const originalRatio = originalWidth / originalHeight;

  let targetRatio = originalRatio; // Default to original

  if (aspectRatio === "1:1") {
    targetRatio = 1;
  } else if (aspectRatio === "16:9") {
    targetRatio = 16 / 9;
  } else if (aspectRatio === "4:3") {
    targetRatio = 4 / 3;
  } else if (aspectRatio === "custom") {
    targetRatio = customRatio;
  }

  if (originalRatio > targetRatio) {
    // Image is wider than target ratio, crop horizontally
    sWidth = originalHeight * targetRatio;
    sx = (originalWidth - sWidth) / 2;
  } else if (originalRatio < targetRatio) {
    // Image is taller than target ratio, crop vertically
    sHeight = originalWidth / targetRatio;
    sy = (originalHeight - sHeight) / 2;
  }
  // If ratios are equal, no cropping needed (sx, sy remain 0, sWidth, sHeight remain original)

  return { sx, sy, sWidth, sHeight };
}

/**
 * Resizes the canvas to fit the aspect ratio and container, considering padding.
 * @param {number} originalContentWidth - The width of the cropped image content.
 * @param {number} originalContentHeight - The height of the cropped image content.
 * @param {number} margin - The margin to add around the content.
 */
function resizeCanvas(originalContentWidth, originalContentHeight, margin) {
  if (!UI.imageCanvas || !UI.imageCanvas.parentElement) {
    console.error("Canvas or its parent element not found for resizing.");
    return;
  }

  let targetWidth, targetHeight;
  const containerWidth = UI.imageCanvas.parentElement.clientWidth;
  const containerHeight = UI.imageCanvas.parentElement.clientHeight;

  // Calculate effective dimensions including margin for aspect ratio calculation
  const effectiveSourceWidth = originalContentWidth + 2 * margin;
  const effectiveSourceHeight = originalContentHeight + 2 * margin;
  const effectiveRatio = effectiveSourceWidth / effectiveSourceHeight;

  // Calculate dimensions to fit within container while maintaining the effective aspect ratio
  if (containerWidth / containerHeight > effectiveRatio) {
    targetHeight = containerHeight;
    targetWidth = containerHeight * effectiveRatio;
  } else {
    targetWidth = containerWidth;
    targetHeight = containerWidth / effectiveRatio;
  }

  // Set canvas drawing buffer size
  UI.imageCanvas.width = targetWidth;
  UI.imageCanvas.height = targetHeight;
  // Set canvas display size (CSS pixels)
  UI.imageCanvas.style.width = `${targetWidth}px`;
  UI.imageCanvas.style.height = `${targetHeight}px`;
}

/**
 * Draws the original (cropped and scaled) image onto the canvas, including margin.
 */
function drawOriginalImageOnCanvas() {
  if (!currentImageLoaded || !originalImage.complete) {
    showErrorMessage("No original image to display.");
    return;
  }

  hideErrorMessage();
  hideCanvasPlaceholder();
  clearStats(); // Clear stats when showing original
  UI_Stats.statsContainer.classList.add("hidden"); // Hide stats container

  ctx.clearRect(0, 0, UI.imageCanvas.width, UI.imageCanvas.height);

  // Calculate content dimensions on the main canvas
  const contentWidthOnCanvas = UI.imageCanvas.width - 2 * currentImageMargin;
  const contentHeightOnCanvas = UI.imageCanvas.height - 2 * currentImageMargin;

  // Draw the original image centered within the padded area
  ctx.drawImage(
    originalImage,
    currentCropParams.sx,
    currentCropParams.sy,
    currentCropParams.sWidth,
    currentCropParams.sHeight,
    currentImageMargin, // X offset for padding
    currentImageMargin, // Y offset for padding
    contentWidthOnCanvas,
    contentHeightOnCanvas
  );

  isShowingOriginal = true;
  UI.toggleImageBtn.textContent = "Show Processed";
  setProcessingState(false, true, true, false, false); // Not processing, allow PNG, allow toggle, NO SVG, NO ICO
}

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  initStatsUI();
  ctx = UI.imageCanvas.getContext("2d");

  /**
   * Main pixelation function.
   */
  async function pixelateImage() {
    if (!currentImageLoaded) {
      showErrorMessage("Please load an image first.");
      return;
    }

    hideErrorMessage();
    setProcessingState(true, false, false, false, false); // Indicate processing, hide all download/toggle initially
    hideCanvasPlaceholder();
    UI_Stats.statsContainer.classList.add("hidden"); // Hide stats during processing
    clearStats(); // Clear previous stats

    // Update currentImageMargin from UI
    currentImageMargin = Math.max(0, parseInt(UI.imageMarginInput.value) || 0); // Ensure non-negative

    // Create a temporary canvas to get pixel data from the original image (cropped + margin)
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    // Set tempCanvas dimensions to include margin
    const tempCanvasWidth = currentCropParams.sWidth + 2 * currentImageMargin;
    const tempCanvasHeight = currentCropParams.sHeight + 2 * currentImageMargin;
    tempCanvas.width = tempCanvasWidth;
    tempCanvas.height = tempCanvasHeight;

    // Draw the cropped original image onto the tempCanvas with margin offset
    tempCtx.drawImage(
      originalImage,
      currentCropParams.sx,
      currentCropParams.sy,
      currentCropParams.sWidth,
      currentCropParams.sHeight,
      currentImageMargin, // Destination X on tempCanvas
      currentImageMargin, // Destination Y on tempCanvas
      currentCropParams.sWidth, // Destination Width on tempCanvas
      currentCropParams.sHeight // Destination Height on tempCanvas
    );

    // Get pixel data from the tempCanvas (this imageData now includes the margin)
    const imageData = tempCtx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );

    // Collect all settings from UI elements
    const settings = {
      pixelDensity: parseInt(UI.mainSizeInput.value),
      tessellationPattern: UI.tessellationPatternSelect.value,
      vectorShape: UI.vectorShapeSelect.value,
      vectorShapeSize: parseFloat(UI.vectorShapeSizeInput.value),
      shapeRotation: parseFloat(UI.shapeRotationInput.value),
      offsetX: parseInt(UI.offsetXInput.value),
      offsetY: parseInt(UI.offsetYInput.value),
      offsetDirection: UI.offsetDirectionSelect.value,
      offsetPattern: UI.offsetPatternSelect.value,
      backgroundColor: UI.backgroundColorPicker.value,
      enableColorLimit: UI.enableColorLimit.checked,
      numColors: parseInt(UI.numColorsInput.value),
      dithering: UI.ditheringSelect.value,
      enableEdgeOutline: UI.enableEdgeOutline.checked,
      outlineWidth: parseInt(UI.outlineWidthInput.value),
      outlineColor: UI.outlineColorPicker.value,
      imageMargin: currentImageMargin, // Pass margin to process.js (though not strictly needed for drawing)
    };

    const startTime = performance.now();
    try {
      // Pass the imageData and its dimensions (which now include margin)
      const { finalColorCount, detailedTimings } = await processImage(
        ctx,
        imageData,
        tempCanvas.width,
        tempCanvas.height,
        settings
      );
      const endTime = performance.now();
      const processingDuration = endTime - startTime;

      // Update output dimensions after pixelation (should reflect padded canvas size)
      updateOutputImageInfo(UI.imageCanvas.width, UI.imageCanvas.height);

      // Store processed data for SVG generation
      lastProcessedImageData = ctx.getImageData(
        0,
        0,
        UI.imageCanvas.width,
        UI.imageCanvas.height
      );
      lastProcessedSettings = settings;

      // Update statistics
      if (UI.showStatsToggle.checked) {
        UI_Stats.statsContainer.classList.remove("hidden");
      }
      updateTotalProcessingTime(processingDuration);
      updateDetailedTimings(detailedTimings);
      updateFinalColorCount(finalColorCount);

      isShowingOriginal = false; // We are now showing the processed image
      UI.toggleImageBtn.textContent = "Show Original"; // Update button text
    } catch (error) {
      console.error("Error during image processing:", error);
      showErrorMessage("An error occurred during pixelation: " + error.message);
      UI_Stats.statsContainer.classList.add("hidden");
    } finally {
      setProcessingState(false, true, true, true, true); // Hide processing and enable all download/toggle buttons
    }
  }

  /**
   * Loads an image from a given source (file or URL) and handles caching for URLs.
   * @param {File|string} source - The File object or URL string.
   * @param {string} type - 'file' or 'url' or 'default'.
   */
  async function loadImage(source, type) {
    hideErrorMessage();
    showLoadingIndicator();
    clearStats();
    UI_Stats.statsContainer.classList.add("hidden");

    try {
      let imageUrl;
      let fileSize = 0;

      if (type === "file") {
        const file = source;
        fileSize = file.size / 1024; // KB
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(new Error("Failed to read file."));
          reader.readAsDataURL(file);
        });
      } else {
        const response = await fetch(source);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        fileSize = blob.size / 1024; // KB
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) =>
            reject(new Error("Failed to convert blob to Data URL."));
          reader.readAsDataURL(blob);
        });
      }

      originalImage.onload = async () => {
        currentImageLoaded = true;
        showImagePreview(imageUrl);

        showImageInfo();
        updateOriginalImageInfo(
          originalImage.width,
          originalImage.height,
          fileSize
        );

        // Get current margin from UI
        currentImageMargin = Math.max(
          0,
          parseInt(UI.imageMarginInput.value) || 0
        ); // Ensure non-negative

        // Calculate and store crop parameters based on original image and current aspect ratio
        currentCropParams = calculateCropParameters(
          originalImage.width,
          originalImage.height,
          currentAspectRatio,
          customRatioValue
        );
        // Resize canvas based on effective source dimensions *including margin*
        resizeCanvas(
          currentCropParams.sWidth,
          currentCropParams.sHeight,
          currentImageMargin
        );

        await pixelateImage(); // Always show processed first after loading
        hideLoadingIndicator();
        UI.toggleImageBtn.disabled = false; // Enable toggle button after first processing
      };
      originalImage.onerror = () => {
        throw new Error(
          "Could not load image. It might be corrupted or an invalid format."
        );
      };
      originalImage.crossOrigin = "Anonymous";
      originalImage.src = imageUrl;
    } catch (error) {
      showErrorMessage(`Error loading image: ${error.message}`);
      hideLoadingIndicator();
      hideImagePreview();
      currentImageLoaded = false;
      updateOriginalImageInfo(0, 0, 0);
      updateOutputImageInfo(0, 0);
      clearStats();
      UI_Stats.statsContainer.classList.add("hidden");
      UI.toggleImageBtn.disabled = true; // Disable toggle button on error
    }
  }

  // --- Event Listeners ---

  // Image Upload (File)
  UI.imageUpload.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      loadImage(file, "file");
    }
  });

  // Image Upload (URL)
  UI.loadImageFromUrlBtn.addEventListener("click", () => {
    const url = UI.imageUrlInput.value.trim();
    if (url) {
      loadImage(url, "url");
    } else {
      showErrorMessage("Please enter an image URL.");
    }
  });

  // Load Default Image
  UI.loadDefaultImageBtn.addEventListener("click", () => {
    const defaultImageUrl = "https://picsum.photos/2560/1440";
    loadImage(defaultImageUrl, "default");
  });

  // Drag and Drop for image upload area
  UI.imageUploadArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    UI.imageUploadArea.classList.add("drag-over");
  });

  UI.imageUploadArea.addEventListener("dragleave", (event) => {
    event.preventDefault();
    UI.imageUploadArea.classList.remove("drag-over");
  });

  UI.imageUploadArea.addEventListener("drop", (event) => {
    event.preventDefault();
    UI.imageUploadArea.classList.remove("drag-over");
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      UI.imageUpload.files = files;
      UI.imageUpload.dispatchEvent(new Event("change"));
    }
  });

  // Image Margin Input
  UI.imageMarginInput.addEventListener("input", async () => {
    currentImageMargin = Math.max(0, parseInt(UI.imageMarginInput.value) || 0); // Ensure non-negative
    if (currentImageLoaded) {
      resizeCanvas(
        currentCropParams.sWidth,
        currentCropParams.sHeight,
        currentImageMargin
      );
      if (isShowingOriginal) {
        drawOriginalImageOnCanvas();
      } else if (UI.realtimePreviewToggle.checked) {
        await pixelateImage();
      }
    }
  });

  // Aspect Ratio Buttons
  document
    .querySelectorAll("#aspect-ratio-buttons button")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        updateRatioUI(button, button.dataset.ratio === "custom");
        currentAspectRatio = button.dataset.ratio;
        if (currentImageLoaded) {
          // Recalculate crop parameters
          currentCropParams = calculateCropParameters(
            originalImage.width,
            originalImage.height,
            currentAspectRatio,
            customRatioValue
          );
          // Resize canvas based on effective source dimensions *including margin*
          resizeCanvas(
            currentCropParams.sWidth,
            currentCropParams.sHeight,
            currentImageMargin
          );

          // If showing original, redraw original. Else, if real-time preview, re-pixelate.
          if (isShowingOriginal) {
            drawOriginalImageOnCanvas();
          } else if (UI.realtimePreviewToggle.checked) {
            await pixelateImage();
          }
        }
      });
    });

  // Custom Ratio Button
  UI.customRatioBtn.addEventListener("click", () => {
    updateRatioUI(UI.customRatioBtn, true);
    currentAspectRatio = "custom";
    UI.imageRatioInput.focus();
  });

  // Custom Ratio Input
  UI.imageRatioInput.addEventListener("input", async () => {
    const value = UI.imageRatioInput.value.trim();
    if (value.includes(":")) {
      const parts = value.split(":");
      const num1 = parseFloat(parts[0]);
      const num2 = parseFloat(parts[1]);
      if (!isNaN(num1) && !isNaN(num2) && num2 !== 0) {
        customRatioValue = num1 / num2;
      } else {
        customRatioValue = 1;
      }
    } else {
      const num = parseFloat(value);
      if (!isNaN(num) && num !== 0) {
        customRatioValue = num;
      } else {
        customRatioValue = 1;
      }
    }
    if (currentImageLoaded) {
      // Recalculate crop parameters
      currentCropParams = calculateCropParameters(
        originalImage.width,
        originalImage.height,
        currentAspectRatio,
        customRatioValue
      );
      // Resize canvas based on effective source dimensions *including margin*
      resizeCanvas(
        currentCropParams.sWidth,
        currentCropParams.sHeight,
        currentImageMargin
      );

      if (isShowingOriginal) {
        drawOriginalImageOnCanvas();
      } else if (UI.realtimePreviewToggle.checked) {
        await pixelateImage();
      }
    }
  });

  // Process Image Button
  UI.processImageBtn.addEventListener("click", pixelateImage);

  // Toggle Original/Processed Image Button
  UI.toggleImageBtn.addEventListener("click", async () => {
    if (!currentImageLoaded) {
      showErrorMessage("No image loaded to toggle.");
      return;
    }
    if (isShowingOriginal) {
      await pixelateImage(); // Switch to processed
    } else {
      drawOriginalImageOnCanvas(); // Switch to original
    }
  });

  // Download Image (PNG) Button
  if (UI.downloadImageBtn) {
    // Defensive check
    UI.downloadImageBtn.addEventListener("click", () => {
      if (currentImageLoaded) {
        const link = document.createElement("a");
        link.download = "pixelated_image.png";
        link.href = UI.imageCanvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        showErrorMessage("No image to download.");
      }
    });
  }

  // New: Download SVG Button
  if (UI.downloadSvgBtn) {
    // Defensive check
    UI.downloadSvgBtn.addEventListener("click", () => {
      if (lastProcessedImageData && lastProcessedSettings) {
        try {
          const svgString = generateSVG(
            lastProcessedImageData,
            lastProcessedSettings
          );
          const blob = new Blob([svgString], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = "pixelated_image.svg";
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url); // Clean up
        } catch (error) {
          console.error("Error generating SVG:", error);
          showErrorMessage(
            "An error occurred while generating SVG: " + error.message
          );
        }
      } else {
        showErrorMessage("No processed image data available for SVG download.");
      }
    });
  }

  // New: Download ICO Button (generates a small PNG and renames it)
  if (UI.downloadIcoBtn) {
    // Defensive check
    UI.downloadIcoBtn.addEventListener("click", () => {
      if (lastProcessedImageData) {
        try {
          // Create a temporary canvas for the ICO (small PNG) export
          const icoCanvas = document.createElement("canvas");
          const icoCtx = icoCanvas.getContext("2d");
          const icoSize = 64; // Common ICO size, can be made configurable

          icoCanvas.width = icoSize;
          icoCanvas.height = icoSize;

          // Draw the last processed image data onto the ICO canvas, scaling it down
          icoCtx.drawImage(
            UI.imageCanvas, // Use the visible canvas as source for simplicity
            0,
            0,
            UI.imageCanvas.width,
            UI.imageCanvas.height, // Source rectangle
            0,
            0,
            icoSize,
            icoSize // Destination rectangle
          );

          const link = document.createElement("a");
          link.download = "pixelated_icon.ico"; // Rename to .ico
          link.href = icoCanvas.toDataURL("image/png"); // Still a PNG data URL
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          // Note: This generates a PNG file with an .ico extension.
          // True multi-resolution .ico file generation requires a dedicated library or server-side processing.
        } catch (error) {
          console.error("Error generating ICO (PNG) file:", error);
          showErrorMessage(
            "An error occurred while generating the ICO file: " + error.message
          );
        }
      } else {
        showErrorMessage("No processed image data available for ICO download.");
      }
    });
  }

  // Clear Canvas / Reset Button
  UI.clearCanvasBtn.addEventListener("click", () => {
    currentImageLoaded = false;
    originalImage = new Image();
    ctx.clearRect(0, 0, UI.imageCanvas.width, UI.imageCanvas.height);
    showCanvasPlaceholder();
    hideImagePreview();
    hideErrorMessage();
    hideLoadingIndicator();
    hideProcessingIndicator();
    setProcessingState(false, false, false, false, false); // All buttons disabled

    isShowingOriginal = false; // Reset toggle state
    UI.toggleImageBtn.textContent = "Show Original"; // Reset button text

    updateOriginalImageInfo(0, 0, 0);
    updateOutputImageInfo(0, 0);
    clearStats();
    UI_Stats.statsContainer.classList.add("hidden");

    // Reset all settings to defaults
    UI.imageMarginInput.value = 0;
    currentImageMargin = 0;

    UI.mainSizeInput.value = 20;
    UI.tessellationPatternSelect.value = "grid";
    UI.vectorShapeSelect.value = "square";
    UI.vectorShapeSizeInput.value = 1.0;
    UI.shapeRotationInput.value = 0;
    UI.backgroundColorPicker.value = "#000000";
    UI.offsetXInput.value = 0;
    UI.offsetYInput.value = 0;
    UI.offsetDirectionSelect.value = "none";
    UI.offsetPatternSelect.value = "none";
    UI.enableColorLimit.checked = false;
    UI.numColorsInput.value = 16;
    UI.numColorsInput.disabled = true;
    UI.ditheringSelect.value = "none";
    UI.ditheringSelect.disabled = true;
    UI.enableEdgeOutline.checked = false;
    UI.outlineWidthInput.value = 1;
    UI.outlineWidthInput.disabled = true;
    UI.outlineColorPicker.value = "#000000";
    UI.outlineColorPicker.disabled = true;
    UI.realtimePreviewToggle.checked = true;
    UI.showStatsToggle.checked = true;

    currentAspectRatio = "original";
    customRatioValue = 1;
    currentCropParams = { sx: 0, sy: 0, sWidth: 0, sHeight: 0 }; // Reset crop params
    updateRatioUI(
      document.querySelector(
        '#aspect-ratio-buttons button[data-ratio="original"]'
      ),
      false
    );
    UI.imageRatioInput.value = "";

    updatePatternUI(UI.tessellationPatternSelect.value);

    // Clear stored processed data for SVG
    lastProcessedImageData = null;
    lastProcessedSettings = null;
  });

  // Color Limiting Enable/Disable
  UI.enableColorLimit.addEventListener("change", async () => {
    UI.numColorsInput.disabled = !UI.enableColorLimit.checked;
    UI.ditheringSelect.disabled = !UI.enableColorLimit.checked;
    if (
      UI.realtimePreviewToggle.checked &&
      currentImageLoaded &&
      !isShowingOriginal
    ) {
      await pixelateImage();
    }
  });

  // Edge Outline Enable/Disable
  UI.enableEdgeOutline.addEventListener("change", async () => {
    UI.outlineWidthInput.disabled = !UI.enableEdgeOutline.checked;
    UI.outlineColorPicker.disabled = !UI.enableEdgeOutline.checked;
    if (
      UI.realtimePreviewToggle.checked &&
      currentImageLoaded &&
      !isShowingOriginal
    ) {
      await pixelateImage();
    }
  });

  // Real-time Preview Toggle
  UI.realtimePreviewToggle.addEventListener("change", async () => {
    if (
      UI.realtimePreviewToggle.checked &&
      currentImageLoaded &&
      !isShowingOriginal
    ) {
      await pixelateImage();
    }
  });

  // Show Stats Toggle
  UI.showStatsToggle.addEventListener("change", () => {
    if (
      UI.showStatsToggle.checked &&
      currentImageLoaded &&
      !isShowingOriginal
    ) {
      // Only show if processed and checked
      UI_Stats.statsContainer.classList.remove("hidden");
    } else {
      UI_Stats.statsContainer.classList.add("hidden");
    }
  });

  // Event listeners for settings changes (for real-time preview)
  const settingsControls = [
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
    UI.numColorsInput,
    UI.ditheringSelect,
    UI.outlineWidthInput,
    UI.outlineColorPicker,
  ];

  settingsControls.forEach((control) => {
    control.addEventListener("input", async () => {
      if (
        UI.realtimePreviewToggle.checked &&
        currentImageLoaded &&
        !isShowingOriginal
      ) {
        await pixelateImage();
      }
    });
    control.addEventListener("change", async () => {
      if (
        UI.realtimePreviewToggle.checked &&
        currentImageLoaded &&
        !isShowingOriginal
      ) {
        await pixelateImage();
      }
      if (control === UI.tessellationPatternSelect) {
        updatePatternUI(UI.tessellationPatternSelect.value);
      }
    });
  });

  // Initial setup
  hideImagePreview();
  showCanvasPlaceholder();
  clearStats();
  if (!UI.showStatsToggle.checked) {
    UI_Stats.statsContainer.classList.add("hidden");
  }
  setProcessingState(false, false, false, false, false); // All download/toggle buttons disabled initially

  // Trigger a resize on window load and resize to ensure canvas fits
  window.addEventListener("resize", async () => {
    if (currentImageLoaded && originalImage.width && originalImage.height) {
      // Recalculate canvas size based on current content crop and margin
      resizeCanvas(
        currentCropParams.sWidth,
        currentCropParams.sHeight,
        currentImageMargin
      );

      // Then redraw based on current display state
      if (isShowingOriginal) {
        drawOriginalImageOnCanvas();
      } else {
        await pixelateImage();
      }
    }
  });

  // Initialize offset details section state based on default tessellation pattern
  updatePatternUI(UI.tessellationPatternSelect.value);
  // Set default active ratio button
  updateRatioUI(
    document.querySelector(
      '#aspect-ratio-buttons button[data-ratio="original"]'
    ),
    false
  );
});
