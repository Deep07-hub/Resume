import { type NextRequest, NextResponse } from "next/server"
import { getAllJobDescriptions, createJobDescription } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const jobDescriptions = await getAllJobDescriptions()
    return NextResponse.json(jobDescriptions)
  } catch (error) {
    console.error("Error fetching job descriptions:", error)
    return NextResponse.json({ error: "Failed to fetch job descriptions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const jobDescription = await request.json()

    if (!jobDescription.title || !jobDescription.description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    const newJobDescription = await createJobDescription(jobDescription)
    return NextResponse.json(newJobDescription)
  } catch (error) {
    console.error("Error creating job description:", error)
    return NextResponse.json({ error: "Failed to create job description" }, { status: 500 })
  }
}
