import { type NextRequest, NextResponse } from "next/server"
import { getAllResumes, getFilteredResumes } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const skills = searchParams.getAll("skills")
    const experience = searchParams.getAll("experience")
    const education = searchParams.getAll("education")
    const status = searchParams.getAll("status")
    const search = searchParams.get("search") || ""
    const jdId = searchParams.get("jdId") || ""

    // If we have filters, use the filtered query
    if (skills.length > 0 || experience.length > 0 || education.length > 0 || status.length > 0 || search || jdId) {
      const filters = {
        skills,
        experience,
        education,
        status,
        search,
        jdId,
      }

      const resumes = await getFilteredResumes(filters)
      return NextResponse.json(resumes)
    }

    // Otherwise, get all resumes
    const resumes = await getAllResumes()
    return NextResponse.json(resumes)
  } catch (error) {
    console.error("Error fetching resumes:", error)
    return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 })
  }
}
