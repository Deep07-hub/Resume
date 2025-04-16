import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { Experience } from "@/types/resume"
import { calculateTotalExperience } from "@/lib/resume-parser"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const name = url.searchParams.get("name")
    const id = url.searchParams.get("id")
    
    console.log(`Recalculating experience for ${name ? `resume with name containing "${name}"` : id ? `resume with ID "${id}"` : "all resumes"}`)
    
    // Filter condition based on parameters
    const where = name ? {
      name: {
        contains: name,
        mode: 'insensitive' as const,
      }
    } : id ? {
      id: id
    } : {}
    
    // Find resumes matching criteria
    const resumes = await db.resume.findMany({ where })
    
    if (resumes.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: name ? `No resumes found with name containing "${name}"` : id ? `No resume found with ID "${id}"` : "No resumes found" 
      })
    }
    
    console.log(`Found ${resumes.length} resume(s)`)
    
    // Process each resume
    const updates = []
    
    for (const resume of resumes) {
      console.log(`Processing resume: ${resume.name} (ID: ${resume.id})`)
      console.log(`Current total experience: ${resume.totalExperience || 'not set'}`)
      
      try {
        // Recalculate experience
        const totalExperience = calculateTotalExperience(resume.experience as unknown as Experience[])
        console.log(`Newly calculated total experience: ${totalExperience}`)
        
        // Only update if the experience has changed
        if (resume.totalExperience !== totalExperience) {
          // Update the resume
          const updatedResume = await db.resume.update({
            where: { id: resume.id },
            data: { totalExperience }
          })
          
          updates.push({
            id: resume.id,
            name: resume.name,
            previous: resume.totalExperience || 'not set',
            current: updatedResume.totalExperience
          })
          
          console.log(`Updated resume ${resume.id} experience: ${resume.totalExperience || 'not set'} -> ${totalExperience}`)
        } else {
          console.log(`Experience unchanged for resume ${resume.id}: ${totalExperience}`)
          updates.push({
            id: resume.id,
            name: resume.name,
            previous: resume.totalExperience,
            current: resume.totalExperience,
            unchanged: true
          })
        }
      } catch (error) {
        console.error(`Error processing resume ${resume.id}:`, error)
        updates.push({
          id: resume.id,
          name: resume.name,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Processed ${updates.length} resume(s)`,
      updates
    })
  } catch (error) {
    console.error("Error recalculating experience:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Failed to recalculate experience", 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 