import { createWorker } from "tesseract.js"
import * as fs from 'fs';
import * as path from 'path';

/**
 * Performs OCR on an image using Tesseract.js
 */
export async function performOcr(imagePath: string): Promise<string> {
  try {
    console.log("Starting OCR for:", imagePath)
    
    // Verify the image exists
    if (!fs.existsSync(imagePath)) {
      console.error("Image file not found:", imagePath);
      return "Image file not found for OCR processing.";
    }
    
    // Create a simple OCR processing message instead of using the worker
    // This is a temporary solution until the Tesseract worker issue is fixed
    console.log("Using simple text extraction instead of OCR due to worker issues");
    
    const imageFilename = path.basename(imagePath);
    return `[OCR processing skipped for ${imageFilename}]\n\nThe resume appears to be an image or scanned document. Text extraction was limited.`;
  } catch (error) {
    console.error("Error performing OCR:", error)
    console.log("Returning empty text due to OCR failure")
    return "OCR processing failed. Using empty text instead."
  }
}
