import { NextRequest, NextResponse } from "next/server"
import { getResumeById, updateResumeMatch } from "@/lib/database"
import { db } from "@/lib/db"
import { Resume } from "@/types/resume"

// Function to match skills between resume and job description
function matchSkills(resumeSkills: string[], jobDescription: string) {
  const normalizedJobDesc = jobDescription.toLowerCase()
  
  const matchedSkills = resumeSkills.filter(skill => 
    normalizedJobDesc.includes(skill.toLowerCase())
  )
  
  const missingSkills = resumeSkills.filter(skill => 
    !normalizedJobDesc.includes(skill.toLowerCase())
  )
  
  return {
    matchedSkills,
    missingSkills,
    matchPercentage: resumeSkills.length > 0 
      ? Math.round((matchedSkills.length / resumeSkills.length) * 100) 
      : 0
  }
}

// Function to calculate experience match
function matchExperience(resumeExperience: any[], jobDescription: string) {
  if (!resumeExperience || resumeExperience.length === 0) return 0
  
  const normalizedJobDesc = jobDescription.toLowerCase()
  let matchCount = 0
  
  resumeExperience.forEach(exp => {
    // Check if job title or company or responsibilities match
    if (
      (exp.title && normalizedJobDesc.includes(exp.title.toLowerCase())) ||
      (exp.company && normalizedJobDesc.includes(exp.company.toLowerCase())) ||
      (exp.responsibilities && exp.responsibilities.some((resp: string) => 
        normalizedJobDesc.includes(resp.toLowerCase())
      ))
    ) {
      matchCount++
    }
  })
  
  return Math.round((matchCount / resumeExperience.length) * 100)
}

// Function to calculate education match
function matchEducation(resumeEducation: any[], jobDescription: string) {
  if (!resumeEducation || resumeEducation.length === 0) return 0
  
  const normalizedJobDesc = jobDescription.toLowerCase()
  let matchCount = 0
  
  resumeEducation.forEach(edu => {
    // Check if degree or institution or field of study match
    if (
      (edu.degree && normalizedJobDesc.includes(edu.degree.toLowerCase())) ||
      (edu.institution && normalizedJobDesc.includes(edu.institution.toLowerCase())) ||
      (edu.fieldOfStudy && normalizedJobDesc.includes(edu.fieldOfStudy.toLowerCase()))
    ) {
      matchCount++
    }
  })
  
  return Math.round((matchCount / resumeEducation.length) * 100)
}

// Generate overall match score
function calculateOverallMatch(skillsMatch: number, experienceMatch: number, educationMatch: number) {
  // Weights for different components
  const skillsWeight = 0.5
  const experienceWeight = 0.3
  const educationWeight = 0.2
  
  return Math.round(
    (skillsMatch * skillsWeight) +
    (experienceMatch * experienceWeight) +
    (educationMatch * educationWeight)
  )
}

// Generate recommendations based on match results
function generateRecommendations(matchResults: any) {
  const recommendations = []
  
  if (matchResults.skillsMatch.matchPercentage < 50) {
    recommendations.push("Highlight more relevant skills that match the job requirements.")
  }
  
  if (matchResults.experienceMatch < 50) {
    recommendations.push("Tailor your work experience to better align with the job description.")
  }
  
  if (matchResults.educationMatch < 50) {
    recommendations.push("Emphasize education details that are relevant to this position.")
  }
  
  if (matchResults.overallMatch < 50) {
    recommendations.push("Consider applying for positions that better match your current profile.")
  } else if (matchResults.overallMatch < 70) {
    recommendations.push("Your profile is moderately matched to this job. Highlight your strengths in your cover letter.")
  } else {
    recommendations.push("Strong match! Emphasize your relevant experience in your application.")
  }
  
  return recommendations
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeId, jobDescription } = body
    
    if (!resumeId || !jobDescription) {
      return NextResponse.json(
        { error: "Resume ID and job description are required" },
        { status: 400 }
      )
    }
    
    // Get resume from database
    const resume = await db.resume.findUnique({
      where: { id: resumeId }
    })
    
    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      )
    }
    
    // Perform matching
    const skillsMatch = matchSkills(resume.skills || [], jobDescription)
    const experienceMatch = matchExperience(resume.experience || [], jobDescription)
    const educationMatch = matchEducation(resume.education || [], jobDescription)
    
    const overallMatch = calculateOverallMatch(
      skillsMatch.matchPercentage,
      experienceMatch,
      educationMatch
    )
    
    // Generate assessment based on overall match
    let overallAssessment = "";
    if (overallMatch >= 80) {
      overallAssessment = "Excellent match! This candidate strongly aligns with the job requirements.";
    } else if (overallMatch >= 60) {
      overallAssessment = "Good match. This candidate meets most of the job requirements.";
    } else if (overallMatch >= 40) {
      overallAssessment = "Moderate match. This candidate meets some key requirements but has gaps in others.";
    } else {
      overallAssessment = "Low match. This candidate may not be suitable for this particular role.";
    }
    
    // Create match result object
    const matchResult = {
      matchScore: overallMatch,
      matchedSkills: skillsMatch.matchedSkills,
      missingSkills: skillsMatch.missingSkills,
      experienceMatch,
      educationMatch,
      overallAssessment,
      recommendations: generateRecommendations({
        skillsMatch,
        experienceMatch,
        educationMatch,
        overallMatch
      })
    }
    
    // Save match results to database
    await updateResumeMatch(resumeId, matchResult);
    
    return NextResponse.json({ 
      success: true, 
      matchResults: {
        skillsMatch,
        experienceMatch,
        educationMatch,
        overallMatch,
        overallAssessment,
        recommendations: matchResult.recommendations
      }
    })
  } catch (error) {
    console.error("Error in match API:", error)
    return NextResponse.json(
      { error: "Failed to match resume with job description" },
      { status: 500 }
    )
  }
}

// Helper function to extract skills from text
function extractSkillsFromText(text: string): string[] {
  // Common technical skills to look for
  const commonSkills = [
    "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", 
    "Python", "Java", "C#", ".NET", "PHP", "Ruby", "Swift", "Kotlin",
    "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Oracle",
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "DevOps",
    "HTML", "CSS", "SASS", "LESS", "Bootstrap", "Tailwind",
    "Git", "CI/CD", "Agile", "Scrum", "Jira", "REST API", "GraphQL",
    "Machine Learning", "AI", "Data Science", "Big Data", "Hadoop", "Spark",
    "Mobile Development", "iOS", "Android", "React Native", "Flutter",
    "Testing", "QA", "Selenium", "Jest", "Mocha", "Cypress",
    "Project Management", "Team Leadership", "Communication",
    "Excel", "Word", "PowerPoint", "Power BI", "Tableau",
    "Clinical Data Management", "Clinical Research", "Data Analysis",
    "Medidata Rave", "Oracle Clinical", "CDISC", "SDTM", "ADaM",
    "Regulatory Compliance", "GCP", "ICH", "FDA", "EMA",
    "Risk Management", "Quality Assurance", "Audit", "Inspection",
    "SAS", "R", "SPSS", "Statistics", "Biostatistics",
    "Medical Writing", "Protocol Development", "CRF Design",
    "Pharmacovigilance", "Drug Safety", "Adverse Events",
    "Electronic Data Capture", "EDC", "eCRF", "eTMF",
    "Clinical Operations", "Site Management", "Monitoring",
    "Data Governance", "KPI", "KQI", "KRI", "Metrics"
  ]
  
  const extractedSkills = new Set<string>()
  
  // Check for common skills in the text
  commonSkills.forEach(skill => {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      extractedSkills.add(skill)
    }
  })
  
  // Look for skills that might be listed with bullet points
  const bulletPointRegex = /[•\-\*]\s*([A-Za-z0-9\s\/\+\#\.]+)/g
  let match
  while ((match = bulletPointRegex.exec(text)) !== null) {
    const potentialSkill = match[1].trim()
    if (potentialSkill.length > 3 && potentialSkill.length < 30) {
      extractedSkills.add(potentialSkill)
    }
  }
  
  return Array.from(extractedSkills)
}
