import { NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"
import { parseResume } from "@/lib/resume-parser"
import { saveResumeToDatabase } from "@/lib/database"
import { v4 as uuidv4 } from "uuid"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const DEBUG = true // Set to true for detailed logging

export async function POST(request: Request) {
  console.log("=== Starting upload process ===")
  
  // Handle CORS preflight request
  if (request.method === "OPTIONS") {
    console.log("Handling CORS preflight request")
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  }

  try {
    // Test database connection
    console.log("Testing database connection...")
    await prisma.$connect()
    console.log("Database connection successful")
    
    // Print request information for debugging
    if (DEBUG) {
      console.log("Request method:", request.method)
      console.log("Request headers:", Object.fromEntries(request.headers.entries()))
      console.log("Request URL:", request.url)
    }
    
    // Create uploads directory
    const uploadsDir = join(process.cwd(), "uploads")
    console.log("Creating uploads directory:", uploadsDir)
    
    if (!existsSync(uploadsDir)) {
      try {
        await mkdir(uploadsDir, { recursive: true })
        console.log("Uploads directory created")
      } catch (error) {
        console.error("Error creating uploads directory:", error)
        return NextResponse.json(
          { error: "Failed to create uploads directory", details: error instanceof Error ? error.message : "Unknown error" },
          { status: 500 }
        )
      }
    } else {
      console.log("Uploads directory already exists")
    }

    // Get form data
    console.log("Getting form data")
    let formData: FormData
    try {
      formData = await request.formData()
      console.log("Form data keys:", [...formData.keys()])
    } catch (error) {
      console.error("Error parsing form data:", error)
      return NextResponse.json(
        { error: "Failed to parse form data", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 400 }
      )
    }
    
    // Check for files in the form data (supports both 'file' and 'files' keys)
    const file = formData.get("file") as File | null
    const fileEntries = formData.getAll("file") as File[]
    
    // Also check for files under the "files" key (plural)
    const filesPlural = formData.get("files") as File | null
    const filesEntriesPlural = formData.getAll("files") as File[]
    
    let filesToProcess: File[] = []
    
    if (fileEntries && fileEntries.length > 0) {
      filesToProcess = fileEntries
      console.log(`Found ${fileEntries.length} files with key 'file'`)
    } else if (file) {
      filesToProcess = [file]
      console.log("Found single file with key 'file'")
    } else if (filesEntriesPlural && filesEntriesPlural.length > 0) {
      filesToProcess = filesEntriesPlural
      console.log(`Found ${filesEntriesPlural.length} files with key 'files'`)
    } else if (filesPlural) {
      filesToProcess = [filesPlural]
      console.log("Found single file with key 'files'")
    } else {
      console.error("No files received in form data")
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }
    
    console.log(`Processing ${filesToProcess.length} files`)
    
    const results = []
    
    // Process each file
    for (const file of filesToProcess) {
      console.log("Processing file:", {
        name: file.name,
        size: file.size,
        type: file.type
      })

      // Generate unique filename and save file
      const id = uuidv4()
      const uniqueFilename = `${id}-${file.name}`
      const filePath = join(uploadsDir, uniqueFilename)
      console.log("Saving file to:", filePath)
      
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(filePath, buffer)
        console.log("File saved successfully")
      } catch (error) {
        console.error("Error saving file:", error)
        results.push({
          originalName: file.name,
          status: "Error",
          error: "Failed to save file",
          details: error instanceof Error ? error.message : "Unknown error"
        })
        continue // Skip to next file if this one fails
      }

      // Parse resume - now always returns a result, even on error
      console.log("Starting resume parsing for:", file.name)
      let parsedResume
      try {
        const fileData = {
          id,
          originalName: file.name,
          filePath,
          extension: file.name.split(".").pop()?.toLowerCase() || "",
          status: "Processing",
          uploadedAt: new Date().toISOString()
        }
        
        console.log("Calling parseResume with fileData:", JSON.stringify(fileData))
        parsedResume = await parseResume(fileData)
        console.log("Resume parsed successfully, data structure:", Object.keys(parsedResume).join(", "))
      } catch (error) {
        console.error("Unexpected error parsing resume:", error)
        // We should never reach here with our improved error handling in parseResume,
        // but just in case, create a minimal resume object
        parsedResume = {
          id,
          originalName: file.name,
          filePath,
          pdfPath: null,
          extractedText: "Error during parsing: " + (error instanceof Error ? error.message : "Unknown error"),
          name: file.name,
          email: "",
          phone: "",
          location: "",
          title: "",
          summary: "Resume parsing failed with a critical error.",
          skills: [],
          experience: [],
          education: [],
          educationDetails: [],
          certifications: [],
          languages: [],
          experienceLevel: "Unknown",
          status: "Error",
          matchScore: 0,
          matchedSkills: [],
          missingSkills: [],
          experienceMatch: 0,
          educationMatch: 0,
          overallAssessment: "",
          recommendations: [],
          uploadedAt: new Date().toISOString(),
          processingStartedAt: new Date().toISOString(),
          processingCompletedAt: new Date().toISOString()
        }
      }

      // Save to database
      console.log("Saving to database:", file.name)
      try {
        console.log("Resume object for database:", {
          id: parsedResume.id,
          originalName: parsedResume.originalName,
          fields: Object.keys(parsedResume)
        })
        const savedResume = await saveResumeToDatabase(parsedResume)
        console.log("Resume saved to database successfully:", file.name)
        results.push({
          success: true,
          resume: {
            id: savedResume.id,
            originalName: savedResume.originalName,
            name: savedResume.name,
            status: savedResume.status
          }
        })
      } catch (error) {
        console.error("Error saving to database:", error)
        results.push({
          originalName: file.name,
          status: "Error",
          error: "Failed to save resume to database",
          details: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    console.log("Upload process completed successfully")
    return NextResponse.json({
      message: `Processed ${filesToProcess.length} files successfully`,
      results
    })
  } catch (error) {
    console.error("Unhandled error in upload route:", error)
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error",
        message: "The file was received but could not be fully processed. Please try again."
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
