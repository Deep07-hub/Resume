import * as pdfjs from 'pdfjs-dist';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

// Configure the PDF.js worker
const WORKER_PATH = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.js');
if (typeof window === 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_PATH;
}

/**
 * A simplified PDF text extractor using PDF.js
 */
export async function extractTextFromPdfFile(pdfPath: string): Promise<string> {
  console.log("=== Starting simplified PDF text extraction ===");
  
  try {
    console.log("PDF path:", pdfPath);
    
    if (!existsSync(pdfPath)) {
      console.error("PDF file does not exist:", pdfPath);
      throw new Error(`PDF file does not exist: ${pdfPath}`);
    }
    
    console.log("Reading file...");
    const data = await readFile(pdfPath);
    console.log(`Read ${data.length} bytes`);
    
    return await extractTextFromPdfBuffer(data);
  } catch (error) {
    console.error("Error extracting text from PDF file:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from PDF file: ${error.message}`);
    }
    throw new Error("Failed to extract text from PDF file");
  }
}

/**
 * Extract text from a PDF buffer using PDF.js
 */
export async function extractTextFromPdfBuffer(data: Buffer): Promise<string> {
  try {
    console.log(`Processing PDF buffer of size ${data.length} bytes`);
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    console.log(`PDF loaded successfully with ${pdfDocument.numPages} pages`);
    
    let fullText = '';
    
    // Process each page
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      console.log(`Processing page ${i}/${pdfDocument.numPages}`);
      
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text from page
      const pageText = textContent.items
        .map(item => 'str' in item ? item.str : '')
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    console.log(`Extracted ${fullText.length} characters of text`);
    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF buffer:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from PDF buffer: ${error.message}`);
    }
    throw new Error("Failed to extract text from PDF buffer");
  }
} 