import { NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"
import { parseResume } from "@/lib/resume-parser"
import { PrismaClient, Prisma } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"
import { Logger } from "@/lib/logger"

// Initialize Prisma client
const prisma = new PrismaClient()

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Ensure upload directory exists
const UPLOAD_DIR = join(process.cwd(), "uploads")

// Check if we're running on Vercel
const IS_VERCEL = process.env.VERCEL === "1";

// Import types
import type { Resume } from "@/types/resume";

/**
 * Sanitizes a string for PostgreSQL by removing null bytes and other problematic characters
 */
function sanitizeForPostgres(str: string | null | undefined): string {
  if (!str) return "";
  
  // Remove null bytes (0x00) which cause PostgreSQL UTF-8 encoding errors
  return str.replace(/\0/g, '')
    // Also remove other potentially problematic control characters
    .replace(/[\u0001-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    // Replace any remaining invalid UTF-8 sequences with a space
    .replace(/[\uD800-\uDFFF]/g, ' ')
    // Trim whitespace
    .trim();
}

/**
 * Sanitizes an array of strings
 */
function sanitizeArray(array: string[] | null | undefined): string[] {
  if (!array || !Array.isArray(array)) return [];
  return array.map(item => sanitizeForPostgres(item)).filter(Boolean);
}

/**
 * Converts an object to a Prisma InputJsonValue
 */
function toPrismaJson(obj: unknown): Prisma.InputJsonValue {
  if (obj === null) return {};
  return obj as Prisma.InputJsonValue;
}

/**
 * Upload route handler
 */
export async function POST(request: Request) {
  Logger.info("=== Starting resume upload process ===");
  
  // Create uploads directory only if not on Vercel (since Vercel has an ephemeral filesystem)
  if (!IS_VERCEL) {
    try {
      // Ensure uploads directory exists
      if (!existsSync(UPLOAD_DIR)) {
        try {
          await mkdir(UPLOAD_DIR, { recursive: true });
          Logger.info("Uploads directory created successfully");
        } catch (error) {
          Logger.error("Error creating uploads directory:", error);
          return NextResponse.json(
            { error: "Failed to create uploads directory", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
          );
        }
      }
    } catch (error) {
      // Ignore directory check errors on Vercel
      Logger.warn("Directory check failed, but continuing (likely on Vercel):", error);
    }
  }
  
  // Parse the multipart form data
  const formData = await request.formData();
  Logger.debug("Form data received");
  
  // Get the files from the form data
  const files = formData.getAll('files') as File[];
  Logger.info(`Received ${files.length} files`);
  
  if (!files || files.length === 0) {
    Logger.warn("No files were uploaded");
    return NextResponse.json({ 
      success: false, 
      error: "No files were uploaded" 
    }, { status: 400 });
  }
  
  // Process and validate files
  const results = [];
  const filesToProcess = [];
  
  for (const file of files) {
    // Check file type
    const fileType = file.type.toLowerCase();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Check both MIME type and file extension
    const isValidType = 
      // Check MIME types
      fileType === "application/pdf" || 
      fileType === "application/msword" || 
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      // For cases where browser doesn't correctly identify MIME type, check extensions
      fileExtension === 'pdf' || 
      fileExtension === 'doc' || 
      fileExtension === 'docx';
    
    Logger.debug(`Validating file ${file.name}:`, { type: fileType, extension: fileExtension, valid: isValidType });
    
    if (!isValidType) {
      Logger.warn(`Invalid file type: ${fileType}`);
      results.push({
        originalName: file.name,
        status: "Error",
        error: "Invalid file type",
        details: "Only PDF, DOC, or DOCX files are allowed"
      });
      continue;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      Logger.warn(`File too large: ${file.size} bytes`);
      results.push({
        originalName: file.name,
        status: "Error",
        error: "File too large",
        details: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
      continue;
    }
    
    filesToProcess.push(file);
  }
  
  Logger.info(`${filesToProcess.length} files passed validation`);
  
  // Process each file
  for (const file of filesToProcess) {
    Logger.info(`Processing file: ${file.name} (${file.size} bytes)`);
    
    try {
      // 1. Generate a unique ID for this resume
      const id = uuidv4();
      
      // 2. Get file extension from name
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      
      // 3. Save file to uploads directory with unique name or to memory if on Vercel
      const uniqueFilename = `${id}-${file.name}`;
      let filePath = "";
      
      try {
        // Convert file to buffer 
        const buffer = Buffer.from(await file.arrayBuffer());
        
        if (IS_VERCEL) {
          // On Vercel, we don't save to disk but process in memory
          // We'll pass a temporary path just to identify the file
          filePath = `/tmp/${uniqueFilename}`;
          Logger.info(`Running on Vercel, processing file in memory: ${uniqueFilename}`);
          
          // Create custom fileData for in-memory processing
          const fileData = {
            id,
            originalName: file.name,
            filePath: filePath, // This is just a placeholder
            extension,
            status: "Processing",
            uploadedAt: new Date().toISOString(),
            buffer // Pass the buffer for in-memory processing
          };
          
          // 5. Parse the resume (using memory processing)
          Logger.info(`Starting in-memory resume parsing workflow for ${file.name}`);
          const parsedResume = await parseResumeInMemory(fileData);
          Logger.info(`Resume parsed successfully in memory: ${parsedResume.name}`);
          
          // Process resume data and save to DB
          processAndSaveResume(parsedResume, results);
        } else {
          // On local/non-Vercel environment, save to file as before
          filePath = join(UPLOAD_DIR, uniqueFilename);
          await writeFile(filePath, buffer);
          Logger.info(`File saved to: ${filePath}`);
          
          // 4. Create file data object for the parser
          const fileData = {
            id,
            originalName: file.name,
            filePath,
            extension,
            status: "Uploaded",
            uploadedAt: new Date().toISOString()
          };
          
          // 5. Parse the resume (this handles conversion, text extraction, OCR if needed, and LLM parsing)
          Logger.info(`Starting resume parsing workflow for ${file.name}`);
          const parsedResume = await parseResume(fileData);
          Logger.info(`Resume parsed successfully: ${parsedResume.name}`);
          
          // Process resume data and save to DB
          processAndSaveResume(parsedResume, results);
        }
      } catch (error) {
        Logger.error("Error processing file:", error);
        results.push({
          originalName: file.name,
          status: "Error",
          error: "Failed to process file",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    } catch (error) {
      Logger.error("Error in file processing loop:", error);
      results.push({
        originalName: file.name,
        status: "Error",
        error: "Failed to process file",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  
  Logger.info("Upload process completed successfully");
  return NextResponse.json({ success: true, results });
}

/**
 * Helper function to process a parsed resume and save it to the database
 */
async function processAndSaveResume(parsedResume: Resume, results: any[]): Promise<void> {
  try {
    // 6. Convert experience and educationDetails to Prisma compatible format
    const experience = [];
    if (Array.isArray(parsedResume.experience)) {
      for (const exp of parsedResume.experience) {
        experience.push(toPrismaJson(exp));
      }
    }
    
    const educationDetails = [];
    if (Array.isArray(parsedResume.educationDetails)) {
      for (const edu of parsedResume.educationDetails) {
        educationDetails.push(toPrismaJson(edu));
      }
    }
    
    // 7. Sanitize and prepare data for database storage
    const sanitizedData = {
      id: parsedResume.id,
      originalName: sanitizeForPostgres(parsedResume.originalName),
      filePath: sanitizeForPostgres(parsedResume.filePath),
      pdfPath: parsedResume.pdfPath ? sanitizeForPostgres(parsedResume.pdfPath) : null,
      extractedText: sanitizeForPostgres(parsedResume.extractedText),
      name: sanitizeForPostgres(parsedResume.name),
      email: sanitizeForPostgres(parsedResume.email),
      phone: sanitizeForPostgres(parsedResume.phone),
      location: sanitizeForPostgres(parsedResume.location),
      title: sanitizeForPostgres(parsedResume.title),
      summary: sanitizeForPostgres(parsedResume.summary),
      skills: sanitizeArray(parsedResume.skills),
      experience,
      education: sanitizeArray(parsedResume.education),
      educationDetails,
      certifications: sanitizeArray(parsedResume.certifications),
      languages: sanitizeArray(parsedResume.languages),
      experienceLevel: sanitizeForPostgres(parsedResume.experienceLevel),
      totalExperience: sanitizeForPostgres(parsedResume.totalExperience),
      status: sanitizeForPostgres(parsedResume.status),
      matchScore: parsedResume.matchScore,
      matchedSkills: sanitizeArray(parsedResume.matchedSkills),
      missingSkills: sanitizeArray(parsedResume.missingSkills),
      experienceMatch: parsedResume.experienceMatch,
      educationMatch: parsedResume.educationMatch,
      overallAssessment: sanitizeForPostgres(parsedResume.overallAssessment),
      recommendations: sanitizeArray(parsedResume.recommendations),
      uploadedAt: new Date(parsedResume.uploadedAt),
      processingStartedAt: parsedResume.processingStartedAt ? new Date(parsedResume.processingStartedAt) : null,
      processingCompletedAt: parsedResume.processingCompletedAt ? new Date(parsedResume.processingCompletedAt) : null
    };
    
    // 8. Save to database
    Logger.debug(`Saving parsed resume to database: ${sanitizedData.id}`);
    await prisma.resume.create({
      data: sanitizedData
    });
    
    Logger.info("Resume saved to database successfully");
    
    // 9. Add to results
    results.push({
      id: parsedResume.id,
      originalName: parsedResume.originalName,
      status: "Success",
      name: parsedResume.name,
      parsedData: {
        name: parsedResume.name,
        email: parsedResume.email,
        skills: parsedResume.skills.length
      }
    });
  } catch (error) {
    Logger.error("Error saving resume to database:", error);
    results.push({
      originalName: parsedResume.originalName,
      status: "Error",
      error: "Failed to save resume to database",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Parse resume directly from buffer for in-memory processing on Vercel
 */
async function parseResumeInMemory(fileData: { 
  id: string; 
  originalName: string; 
  filePath: string; 
  extension: string; 
  status: string; 
  uploadedAt: string;
  buffer: Buffer;
}): Promise<Resume> {
  // Use a direct text extraction approach without saving files
  try {
    Logger.info(`Starting in-memory parsing for ${fileData.originalName}`);
    
    // Skip the file conversion step since we're in memory
    
    // Extract text directly from the buffer
    let extractedText = "";
    
    if (fileData.extension === "pdf") {
      // Use a method to extract text directly from PDF buffer
      extractedText = await extractTextFromBuffer(fileData.buffer, fileData.extension);
    } else if (fileData.extension === "doc" || fileData.extension === "docx") {
      // For Word docs, we might need to use a different approach or library
      // For now, we'll use a placeholder until we implement the proper extraction
      extractedText = `This is a ${fileData.extension.toUpperCase()} document processed in memory.`;
    }
    
    Logger.info(`Extracted ${extractedText.length} characters from ${fileData.originalName}`);
    
    // Add filename and metadata to extracted text to provide context
    let contextInfo = `\n\nFile Information:\nFilename: ${fileData.originalName}\nFile type: ${fileData.extension}\nUploaded: ${fileData.uploadedAt}\n`;
    extractedText += contextInfo;
    
    // Parse the resume with LLM
    Logger.info("Parsing resume with LLM...");
    const parsedData = await parseResumeWithLLM(extractedText);
    Logger.info("LLM parsing completed");
    
    // Calculate total experience
    const totalExperience = calculateTotalExperience(parsedData.experience || []);
    
    // Return the parsed resume with placeholder paths
    return {
      id: fileData.id,
      originalName: fileData.originalName,
      filePath: fileData.filePath, // This is a placeholder path
      pdfPath: null,
      extractedText,
      name: parsedData.name || fileData.originalName,
      email: parsedData.email || "",
      phone: parsedData.phone || "",
      location: parsedData.location || "",
      title: parsedData.title || "",
      summary: parsedData.summary || "",
      skills: parsedData.skills || [],
      experience: parsedData.experience || [],
      education: parsedData.education || [],
      educationDetails: parsedData.educationDetails || [],
      certifications: parsedData.certifications || [],
      languages: parsedData.languages || [],
      experienceLevel: parsedData.experienceLevel || "Not specified",
      totalExperience,
      status: "Processed",
      matchScore: 0,
      matchedSkills: [],
      missingSkills: [],
      experienceMatch: 0,
      educationMatch: 0,
      overallAssessment: "",
      recommendations: [],
      uploadedAt: fileData.uploadedAt,
      processingStartedAt: new Date().toISOString(),
      processingCompletedAt: new Date().toISOString()
    };
  } catch (error) {
    Logger.error("Error in memory parsing:", error);
    
    // Return a basic resume object on error
    return {
      id: fileData.id,
      originalName: fileData.originalName,
      filePath: fileData.filePath,
      pdfPath: null,
      extractedText: `Error processing file: ${error instanceof Error ? error.message : "Unknown error"}`,
      name: fileData.originalName,
      email: "",
      phone: "",
      location: "",
      title: "",
      summary: "Error during in-memory resume processing.",
      skills: [],
      experience: [],
      education: [],
      educationDetails: [],
      certifications: [],
      languages: [],
      experienceLevel: "Unknown",
      totalExperience: "Unknown",
      status: "Error",
      matchScore: 0,
      matchedSkills: [],
      missingSkills: [],
      experienceMatch: 0,
      educationMatch: 0,
      overallAssessment: "",
      recommendations: [],
      uploadedAt: fileData.uploadedAt,
      processingStartedAt: new Date().toISOString(),
      processingCompletedAt: new Date().toISOString()
    };
  }
}

/**
 * Extract text directly from a buffer
 */
async function extractTextFromBuffer(buffer: Buffer, extension: string): Promise<string> {
  if (extension === "pdf") {
    try {
      // Use pdf-parse to extract text directly from the buffer
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error: any) {
      Logger.error("PDF parsing error:", error);
      return `PDF parsing error: ${error.message}`;
    }
  }
  
  // For other file types, return placeholder
  return `Text extraction from ${extension} buffers not implemented yet.`;
}

// Import required functions from other modules
import { parseResumeWithLLM } from "@/lib/llm-parser";
import { calculateTotalExperience } from "@/lib/resume-parser";
