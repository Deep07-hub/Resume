import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, extname } from 'path';
import extractPdfData from './pdf-parse-fix.js';

/**
 * Text extractor that handles both PDFs and text files
 * Always returns some text, never throws exceptions
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
  try {
    // Check if file exists
    if (!existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // Get file extension
    const fileExt = extname(filePath).toLowerCase();
    const fileName = basename(filePath);
    
    console.log(`Extracting text from ${fileExt} file: ${fileName}`);
    
    // Read file as buffer
    const buffer = await readFile(filePath);
    
    // Handle based on extension
    if (fileExt === '.pdf') {
      return await extractTextFromPdf(buffer, filePath);
    } else if (fileExt === '.docx' || fileExt === '.doc') {
      // For DOC/DOCX, we should have already converted to PDF by this point
      // but we'll try a basic extraction just in case
      console.log(`Attempting to extract text directly from ${fileExt} file: ${fileName}`);
      return await extractBasicText(buffer, filePath);
    } else {
      // For other files, do a naive text extraction
      console.log(`Using basic text extraction for ${fileExt} file: ${fileName}`);
      return await extractBasicText(buffer, filePath);
    }
  } catch (error) {
    console.error(`Error extracting text from file: ${filePath}`, error);
    
    if (error instanceof Error) {
      return `Error extracting text: ${error.message}`;
    } else {
      return 'Error extracting text: Unknown error';
    }
  }
}

/**
 * Extracts text from a PDF file
 * @param buffer Buffer containing the PDF data
 * @param filePath The original file path (for logging)
 * @returns Extracted text
 */
async function extractTextFromPdf(buffer: Buffer, filePath: string): Promise<string> {
  try {
    console.log(`Parsing PDF: ${filePath}`);
    
    // Use the fixed PDF parser that doesn't try to access test files
    const data = await extractPdfData(buffer, filePath);
    
    if (!data || !data.text) {
      console.warn('PDF extraction returned empty or invalid result');
      return 'PDF extraction failed, no text content found.';
    }
    
    // Clean up the text
    let text = data.text.trim();
    
    // If text is too short, it might be a failed extraction
    if (text.length < 50) {
      console.warn('PDF extraction returned very little text, might be a failed extraction');
      return `PDF extraction returned limited text: "${text}". This might indicate a scanned or image-based PDF.`;
    }
    
    console.log(`Successfully extracted ${text.length} characters from PDF`);
    return text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    
    // Provide a helpful error message based on the error
    if (error instanceof Error) {
      if (error.message.includes('file does not exist') || error.message.includes('ENOENT')) {
        return `Error: PDF file not found or inaccessible at ${filePath}`;
      } else if (error.message.includes('encrypted')) {
        return 'Error: PDF is password protected or encrypted';
      } else {
        return `Error parsing PDF: ${error.message}`;
      }
    } else {
      return 'Error parsing PDF: Unknown error';
    }
  }
}

/**
 * Attempts to extract text from a buffer in a basic way
 * Good for text files or as a fallback for other formats
 * @param buffer The file buffer
 * @param filePath The original file path (for logging)
 * @returns Extracted text
 */
async function extractBasicText(buffer: Buffer, filePath: string): Promise<string> {
  try {
    // Try UTF-8 first
    let text = buffer.toString('utf8');
    
    // Clean up the text - remove non-printable characters
    text = text.replace(/[^\x20-\x7E\r\n\t]/g, ' ');
    
    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // If we got meaningful text, return it
    if (text.length > 50) {
      console.log(`Extracted ${text.length} characters using basic text extraction`);
      return text;
    }
    
    // If UTF-8 didn't work well, try Latin1
    text = buffer.toString('latin1');
    text = text.replace(/[^\x20-\x7E\r\n\t]/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    
    // If we still don't have meaningful text, try binary extraction
    if (text.length < 50) {
      console.log('Basic extraction failed, trying binary extraction');
      
      // Look for text patterns in binary data
      const fileContent = buffer.toString('binary');
      const textMatches = fileContent.match(/[A-Za-z0-9\s.,;:'"!?()-]{10,100}/g);
      
      if (textMatches && textMatches.length > 0) {
        text = textMatches.join(' ');
        console.log(`Extracted ${text.length} characters using binary extraction`);
      } else {
        console.warn('Could not extract meaningful text from file');
        text = `Could not extract meaningful text from this file format: ${extname(filePath)}`;
      }
    }
    
    return text;
  } catch (error) {
    console.error('Error in basic text extraction:', error);
    return `Error in text extraction: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
} 