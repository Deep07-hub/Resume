// Import our fixed PDF parser that handles the test file issue
import extractPdfData from './pdf-parse-fix';

/**
 * Wrapper for pdf-parse library to avoid hardcoded test file reference
 * @param dataBuffer Buffer containing PDF data
 * @param filePath Optional file path for context
 * @returns Parsed PDF data
 */
export default async function customPdfParse(dataBuffer: Buffer, filePath: string = '') {
  return await extractPdfData(dataBuffer, filePath);
} 