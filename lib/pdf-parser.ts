import { readFile } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"
import customPdfParse from "./pdf-parse-wrapper"

/**
 * Extracts text from a PDF file
 */
export async function extractTextFromPdf(pdfPath: string): Promise<string> {
  console.log("=== Starting PDF text extraction ===")
  try {
    console.log("1. Reading PDF file:", pdfPath)
    
    // Verify file exists
    console.log("2. Checking if file exists")
    if (!existsSync(pdfPath)) {
      console.error("PDF file does not exist:", pdfPath)
      throw new Error(`PDF file does not exist: ${pdfPath}`)
    }
    console.log("3. File exists")

    console.log("4. Reading file into buffer")
    const dataBuffer = await readFile(pdfPath)
    console.log("5. Buffer size:", dataBuffer.length)

    console.log("6. Parsing PDF content")
    const data = await customPdfParse(dataBuffer, pdfPath)
    console.log("7. PDF parsed successfully")

    if (!data.text || data.text.length === 0) {
      console.warn("8. No text extracted from PDF")
      return ""
    }

    console.log("8. Extracted text length:", data.text.length)
    return data.text
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`)
    }
    throw new Error("Failed to extract text from PDF")
  }
}
