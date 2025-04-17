import { type NextRequest, NextResponse } from "next/server"
import { prisma, testDatabaseConnection } from "@/lib/database"
import { Logger } from "@/lib/logger"
import { Prisma } from '@prisma/client'

/**
 * Get all resumes or filtered resumes
 */
export async function GET(request: NextRequest) {
  try {
    Logger.info("Starting GET /api/resumes request")
    
    // Test database connection first
    const isConnected = await testDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: "Unable to connect to the database" 
      }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'uploadedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const resumes = await prisma.resume.findMany({
      where: {
        ...(search ? {
          OR: [
            { originalName: { contains: search, mode: 'insensitive' } },
            { extractedText: { contains: search, mode: 'insensitive' } }
          ]
        } : {}),
        ...(status ? { status } : {})
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    })

    Logger.info(`Successfully fetched ${resumes.length} resumes`)
    return NextResponse.json(resumes)
  } catch (error) {
    Logger.error("Unexpected error in resumes API route:", error)
    return NextResponse.json({ 
      error: "Failed to process resume request", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    Logger.info("Starting POST /api/resumes request")
    
    // Test database connection first
    const isConnected = await testDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: "Unable to connect to the database" 
      }, { status: 503 })
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.originalName || !data.filePath) {
      return NextResponse.json(
        { error: 'Missing required fields: originalName and filePath are required' },
        { status: 400 }
      )
    }

    // Create resume with only the fields that match the schema
    const resumeData: Prisma.ResumeCreateInput = {
      originalName: data.originalName,
      filePath: data.filePath,
      pdfPath: data.pdfPath || null,
      extractedText: data.extractedText || null,
      name: data.name || null,
      email: data.email || null,
      phone: data.phone || null,
      location: data.location || null,
      title: data.title || null,
      summary: data.summary || null,
      skills: data.skills || [],
      experience: data.experience || [],
      education: data.education || [],
      educationDetails: data.educationDetails || [],
      certifications: data.certifications || [],
      languages: data.languages || [],
      experienceLevel: data.experienceLevel || 'Unknown',
      totalExperience: data.totalExperience || 'Unknown',
      status: data.status || 'New',
      matchScore: data.matchScore || null,
      matchedSkills: data.matchedSkills || [],
      missingSkills: data.missingSkills || [],
      experienceMatch: data.experienceMatch || null,
      educationMatch: data.educationMatch || null,
      overallAssessment: data.overallAssessment || null,
      recommendations: data.recommendations || [],
      parsingMethod: data.parsingMethod || 'LLM',
      processingStartedAt: data.processingStartedAt || null,
      processingCompletedAt: data.processingCompletedAt || null
    }

    const resume = await prisma.resume.create({
      data: resumeData
    })

    Logger.info(`Successfully created resume with ID: ${resume.id}`)
    return NextResponse.json(resume)
  } catch (error) {
    Logger.error("Error uploading resume:", error)
    return NextResponse.json(
      { error: 'Failed to upload resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    )
  }
}
