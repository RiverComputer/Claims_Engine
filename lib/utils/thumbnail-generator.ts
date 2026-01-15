/**
 * Utility functions for generating thumbnails from PDFs and Excel files
 */

import * as fs from "fs";
import * as path from "path";
import { readFile } from "fs/promises";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import * as ExcelJS from "exceljs";
import { createCanvas, loadImage } from "canvas";

// Configure pdfjs-dist to work in Node.js
// For Node.js, we can use the built-in worker or disable it
try {
  const pdfjsWorkerPath = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerPath;
} catch (error) {
  // Fallback: use the minified worker
  try {
    const pdfjsWorkerPath = require.resolve("pdfjs-dist/build/pdf.worker.min.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerPath;
  } catch (e) {
    // If worker not found, disable worker (slower but works)
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
  }
}

/**
 * Generate a thumbnail from the first page of a PDF file
 */
export async function generatePdfThumbnail(
  pdfPath: string,
  width: number = 400,
  height: number = 300
): Promise<string | null> {
  try {
    const data = await readFile(pdfPath);
    // Convert Buffer to Uint8Array as required by pdfjs-dist
    const uint8Array = new Uint8Array(data);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    // Get the first page
    const page = await pdf.getPage(1);

    // Set up canvas for rendering
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min(width / viewport.width, height / viewport.height);
    const scaledViewport = page.getViewport({ scale });

    const canvas = createCanvas(scaledViewport.width, scaledViewport.height);
    const context = canvas.getContext("2d");

    // Render PDF page to canvas
    await page.render({
      canvasContext: context as any,
      viewport: scaledViewport,
    }).promise;

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL("image/png");
    return dataUrl;
  } catch (error) {
    console.warn(`Could not generate PDF thumbnail for ${pdfPath}:`, error);
    return null;
  }
}

/**
 * Generate a thumbnail from the first sheet of an Excel file
 */
export async function generateExcelThumbnail(
  excelPath: string,
  width: number = 400,
  height: number = 300
): Promise<string | null> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);

    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return null;
    }

    // Get dimensions
    const rowCount = Math.min(worksheet.rowCount, 10); // Limit to 10 rows for thumbnail
    const colCount = Math.min(worksheet.columnCount, 8); // Limit to 8 columns

    // Calculate cell dimensions
    const cellWidth = Math.floor(width / colCount);
    const cellHeight = Math.floor(height / rowCount);
    const fontSize = Math.max(10, Math.min(cellWidth / 8, 12));

    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Set background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Set font
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Draw grid and content
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;

    for (let row = 1; row <= rowCount; row++) {
      const y = (row - 1) * cellHeight;

      for (let col = 1; col <= colCount; col++) {
        const x = (col - 1) * cellWidth;
        const cell = worksheet.getCell(row, col);

        // Draw cell border
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        // Draw cell content
        if (cell.value !== null && cell.value !== undefined) {
          const cellValue = String(cell.value);
          ctx.fillStyle = "#000000";

          // Truncate long text
          const maxWidth = cellWidth - 4;
          let displayText = cellValue;
          const metrics = ctx.measureText(displayText);
          if (metrics.width > maxWidth) {
            while (ctx.measureText(displayText + "...").width > maxWidth && displayText.length > 0) {
              displayText = displayText.slice(0, -1);
            }
            displayText += "...";
          }

          ctx.fillText(displayText, x + 2, y + 2);
        }
      }
    }

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL("image/png");
    return dataUrl;
  } catch (error) {
    console.warn(`Could not generate Excel thumbnail for ${excelPath}:`, error);
    return null;
  }
}

