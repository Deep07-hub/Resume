export interface Experience {
  title: string
  company: string
  duration: string
  description: string
}

export interface Education {
  degree: string
  institution: string
  year: string
}

export interface Resume {
  id: string
  originalName: string
  filePath: string
  pdfPath?: string | null
  extractedText?: string | null
  name: string
  email: string
  phone: string
  location: string
  title: string
  summary: string
  skills: string[]
  experience: Experience[]
  education: string[]
  educationDetails: Education[]
  certifications: string[]
  languages: string[]
  experienceLevel: string
  totalExperience?: string // Total work experience in years and months
  status: string
  matchScore?: number | null
  matchedSkills: string[]
  missingSkills: string[]
  experienceMatch?: number | null
  educationMatch?: number | null
  overallAssessment?: string | null
  recommendations: string[]
  uploadedAt: string
  processingStartedAt?: string | null
  processingCompletedAt: string | null
}
