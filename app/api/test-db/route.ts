import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log("Testing database connection...")
    
    // Try to connect to the database
    await prisma.$connect()
    console.log("Database connection successful")
    
    // Test basic query
    const resumeCount = await prisma.resume.count()
    console.log(`Found ${resumeCount} resumes in database`)

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
    console.log("Created test resume:", testId)

    // Clean up test data
    await prisma.resume.delete({
      where: { id: testId }
    })
    console.log("Deleted test resume:", testId)

    return NextResponse.json({
      success: true,
      message: "Database connection and operations successful",
      resumeCount
    })
  } catch (error) {
    console.error("Error testing database:", error)
    
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