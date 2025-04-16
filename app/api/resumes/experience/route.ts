import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const name = url.searchParams.get("name")
    
    if (!name) {
      return NextResponse.json({ error: "Name parameter is required" }, { status: 400 })
    }
    
    console.log(`Getting experience for resume with name: ${name}`)
    
    // Find the resume by name
    const resume = await db.resume.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        totalExperience: true
      }
    })
    
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }
    
    console.log(`Found resume: ${resume.name}, total experience: ${resume.totalExperience}`)
    
    return NextResponse.json({
      success: true,
      experience: resume.totalExperience,
      id: resume.id
    })
  } catch (error) {
    console.error("Error getting resume experience:", error)
    return NextResponse.json({ error: "Failed to get resume experience" }, { status: 500 })
  }
} 