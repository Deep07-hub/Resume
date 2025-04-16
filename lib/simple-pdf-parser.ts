import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import pdfParseFix from './pdf-parse-fix.js';

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPdfFile(pdfPath: string): Promise<string> {
  console.log("=== Starting PDF text extraction ===");
  
  try {
    console.log("PDF path:", pdfPath);
    
    if (!existsSync(pdfPath)) {
      console.error("PDF file does not exist:", pdfPath);
      throw new Error(`PDF file does not exist: ${pdfPath}`);
    }
    
    console.log("Reading file...");
    const dataBuffer = await readFile(pdfPath);
    console.log(`Read ${dataBuffer.length} bytes`);
    
    console.log("Parsing PDF...");
    const data = await pdfParseFix(dataBuffer);
    console.log("PDF parsed successfully");
    
    if (!data.text || data.text.length === 0) {
      console.warn("No text extracted from PDF");
      return "";
    }
    
    console.log(`Extracted ${data.text.length} characters of text`);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF file:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from PDF file: ${error.message}`);
    }
    throw new Error("Failed to extract text from PDF file");
  }
} 