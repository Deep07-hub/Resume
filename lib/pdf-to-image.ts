import { exec } from "child_process"
import { promisify } from "util"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import { mkdir } from "fs/promises"
import { existsSync } from "fs"
import { access } from "fs/promises"

const execAsync = promisify(exec)

/**
 * Converts a PDF file to a series of images
 */
export async function convertPdfToImages(pdfPath: string): Promise<string[]> {
  try {
    console.log("Converting PDF to images:", pdfPath)
    
    // Create output directory
    const outputDirName = uuidv4()
    const outputDir = join(process.cwd(), "uploads", "images", outputDirName)
    
    await mkdir(outputDir, { recursive: true })
    console.log("Created output directory:", outputDir)
    
    // For now, we'll just return the PDF path as we're bypassing image conversion
    // This is a temporary solution until we implement a proper PDF to image conversion
    console.log("PDF to image conversion is disabled. Returning empty image array.")
    return []
  } catch (error) {
    console.error("Error converting PDF to images:", error)
    // Return empty array instead of throwing error
    return []
  }
}

/**
 * Alternative implementation using a Node.js library
 * This can be used if Ghostscript is not available
 */
export async function convertPdfToImagesWithLibrary(pdfPath: string): Promise<string[]> {
  try {
    console.log("Converting PDF to images with library:", pdfPath)
    
    // Verify PDF file exists
    if (!existsSync(pdfPath)) {
      console.error("PDF file does not exist:", pdfPath)
      throw new Error(`PDF file does not exist: ${pdfPath}`)
    }
    
    // Create the images directory if it doesn't exist
    const imagesDir = join(process.cwd(), "uploads", "images")
    await mkdir(imagesDir, { recursive: true })
    
    // Create a unique directory for this conversion
    const outputDir = join(imagesDir, uuidv4())
    await mkdir(outputDir, { recursive: true })
    
    console.log("Created output directory:", outputDir)

    // For now, we'll just return the PDF path since we can extract text directly
    // In a production environment, you would want to use a proper PDF to image library
    return [pdfPath]
  } catch (error) {
    console.error("Error converting PDF to images with library:", error)
    throw new Error("Failed to convert PDF to images with library")
  }
}
