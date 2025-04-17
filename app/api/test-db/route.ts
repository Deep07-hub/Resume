import { NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'
import { Logger } from "@/lib/logger"

// Create a new Prisma client instance to ensure we're using the correct connection
const prisma = new PrismaClient()

export async function GET() {
  try {
    Logger.info("Testing Neon database connection...")
    
    // Try to connect to the database
    await prisma.$connect()
    Logger.info("Neon database connection successful")
    
    // Test basic query
    const resumeCount = await prisma.resume.count()
    Logger.info(`Found ${resumeCount} resumes in database`)

    // Test simple create operation with minimal fields
    const testId = `test-${Date.now()}`
    const testResume = await prisma.resume.create({
      data: {
        id: testId,
        originalName: "test-file.pdf",
        filePath: "/test/path/test-file.pdf",
        status: "Test",
        skills: ["test"],
        matchScore: 0,
        experienceMatch: 0,
        educationMatch: 0
      }
    })
    Logger.info("Created test resume:", testId)

    // Test reading
    const resumes = await prisma.resume.findMany()

    // Clean up test data
    await prisma.resume.delete({
      where: { id: testId }
    })
    Logger.info("Deleted test resume:", testId)

    return NextResponse.json({
      success: true,
      message: "Neon database connection and operations successful",
      resumeCount,
      testData: {
        created: testResume,
        allResumes: resumes
      }
    })
  } catch (error) {
    Logger.error("Error testing Neon database:", error)
    
    let errorDetails: string | object = "Unknown error"
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorDetails
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 