import * as pdfjsLib from 'pdfjs-dist';
import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';

// Configure PDF.js worker
const WORKER_SRC = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.js');
if (typeof window === 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
}

/**
 * Custom PDF parser that uses PDF.js
 * @param dataBuffer PDF file buffer
 * @returns Parsed data with text content
 */
export default async function customPdfParse(dataBuffer: Buffer) {
  try {
    console.log("Loading PDF document with PDF.js");
    
    // Create a temp directory for PDF.js files if needed
    const tempDir = join(process.cwd(), 'temp');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
    const pdfDocument = await loadingTask.promise;
    
    console.log(`PDF loaded with ${pdfDocument.numPages} pages`);
    
    // Extract text from all pages
    let fullText = '';
    
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      console.log(`Processing page ${i}/${pdfDocument.numPages}`);
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      // Concatenate all items' text
      const pageText = textContent.items
        .map(item => 'str' in item ? item.str : '')
        .join(' ');
        
      fullText += pageText + '\n';
    }
    
    console.log(`Extracted ${fullText.length} characters of text`);
    
    // Return data in a format compatible with the original pdf-parse
    return {
      text: fullText,
      metadata: {
        info: await pdfDocument.getMetadata(),
        pageInfo: {
          pageCount: pdfDocument.numPages
        }
      },
      numpages: pdfDocument.numPages,
      numrender: pdfDocument.numPages,
      version: '1.0.0'
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
} 