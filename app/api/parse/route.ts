import { type NextRequest, NextResponse } from "next/server"
import { convertDocToPdf } from "@/lib/document-converter"
import { convertPdfToImages } from "@/lib/pdf-to-image"
import { extractTextFromPdf } from "@/lib/pdf-parser"
import { performOcr } from "@/lib/ocr-service"
import { parseResumeWithLLM } from "@/lib/llm-parser"
import { saveResumeToDatabase } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting resume parsing process...")
    const { file } = await request.json()

    if (!file || !file.path) {
      console.error("Invalid file data received:", file)
      return NextResponse.json({ error: "Invalid file data" }, { status: 400 })
    }

    console.log(`Processing file: ${file.id} (${file.originalName})`)

    // Update status to processing
    const resumeData = {
      ...file,
      status: "processing",
      processingStartedAt: new Date().toISOString(),
    }

    // Step 1: Convert DOC/DOCX to PDF if needed
    let pdfPath = file.path
    if (file.extension === "doc" || file.extension === "docx") {
      console.log("Converting DOC/DOCX to PDF...")
      pdfPath = await convertDocToPdf(file.path)
      resumeData.pdfPath = pdfPath
      console.log("Conversion completed:", pdfPath)
    }

    // Step 2: Extract text directly from PDF
    console.log("Extracting text from PDF...")
    let extractedText = await extractTextFromPdf(pdfPath)
    console.log(`Extracted ${extractedText.length} characters from PDF`)

    // Step 3: Convert PDF to images for OCR if text extraction is insufficient
    if (!extractedText || extractedText.length < 100) {
      console.log("Text extraction insufficient, attempting OCR...")
      const imagePaths = await convertPdfToImages(pdfPath)
      resumeData.imagePaths = imagePaths

      // Step 4: Perform OCR on images
      console.log("Performing OCR on images...")
      const ocrResults = await Promise.all(imagePaths.map((imagePath) => performOcr(imagePath)))
      extractedText = ocrResults.join("\n\n")
      console.log(`OCR completed, extracted ${extractedText.length} characters`)
    }

    resumeData.extractedText = extractedText

    // Step 5: Parse resume with LLM
    console.log("Parsing resume with LLM...")
    const parsedResume = await parseResumeWithLLM(extractedText)
    console.log("LLM parsing completed")

    // Step 6: Save to database
    console.log("Saving parsed resume to database...")
    const finalResumeData = {
      ...resumeData,
      ...parsedResume,
      status: "parsed",
      processingCompletedAt: new Date().toISOString(),
    }

    await saveResumeToDatabase(finalResumeData)
    console.log("Resume saved to database successfully")

    return NextResponse.json({
      message: "Resume parsed successfully",
      resume: finalResumeData,
    })
  } catch (error) {
    console.error("Error parsing resume:", error)
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 })
  }
}
