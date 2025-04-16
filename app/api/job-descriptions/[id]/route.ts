import { type NextRequest, NextResponse } from "next/server"
import { getJobDescriptionById, updateJobDescription, deleteJobDescription } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobDescription = await getJobDescriptionById(params.id)
    
    if (!jobDescription) {
      return NextResponse.json({ error: "Job description not found" }, { status: 404 })
    }
    
    return NextResponse.json(jobDescription)
  } catch (error) {
    console.error("Error fetching job description:", error)
    return NextResponse.json({ error: "Failed to fetch job description" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const updatedJobDescription = await updateJobDescription(params.id, updates)
    
    if (!updatedJobDescription) {
      return NextResponse.json({ error: "Job description not found" }, { status: 404 })
    }
    
    return NextResponse.json(updatedJobDescription)
  } catch (error) {
    console.error("Error updating job description:", error)
    return NextResponse.json({ error: "Failed to update job description" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteJobDescription(params.id)
    
    if (!deleted) {
      return NextResponse.json({ error: "Job description not found" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "Job description deleted successfully" })
  } catch (error) {
    console.error("Error deleting job description:", error)
    return NextResponse.json({ error: "Failed to delete job description" }, { status: 500 })
  }
} 