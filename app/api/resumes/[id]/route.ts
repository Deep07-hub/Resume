import { type NextRequest, NextResponse } from "next/server"
import { getResumeById, updateResumeStatus, deleteResume } from "@/lib/database"

export async function GET(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { params } = context
    const id = params.id
    
    console.log("Fetching resume by ID:", id)
    const resume = await getResumeById(id)

    if (!resume) {
      console.log("Resume not found with ID:", id)
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    console.log("Successfully fetched resume:", resume.id, resume.name)
    return NextResponse.json(resume)
  } catch (error) {
    console.error("Error fetching resume:", error)
    return NextResponse.json({ error: "Failed to fetch resume" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { params } = context
    const id = params.id
    
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const updatedResume = await updateResumeStatus(id, status)

    if (!updatedResume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    return NextResponse.json(updatedResume)
  } catch (error) {
    console.error("Error updating resume:", error)
    return NextResponse.json({ error: "Failed to update resume" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  try {
    const { params } = context
    const id = params.id
    
    const result = await deleteResume(id)

    if (!result) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Resume deleted successfully" })
  } catch (error) {
    console.error("Error deleting resume:", error)
    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 })
  }
}
