import { NextRequest, NextResponse } from "next/server"
import { updateResumeStatus } from "@/lib/database"

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id
    const { status } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Resume ID is required" },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses = ["New", "Reviewed", "Shortlisted", "Rejected", "Processed", "Processing", "Failed"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    console.log(`Updating resume status: ID=${id}, status=${status}`)
    
    // Update the resume status using the database module
    const resume = await updateResumeStatus(id, status)
    
    console.log(`Resume status updated successfully: ID=${id}`)

    return NextResponse.json({ success: true, resume })
  } catch (error) {
    console.error("Error updating resume status:", error)
    return NextResponse.json(
      { error: "Failed to update resume status" },
      { status: 500 }
    )
  }
} 