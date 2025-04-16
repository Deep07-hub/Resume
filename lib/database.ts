import { PrismaClient } from "@prisma/client"
import type { Resume, Experience, Education } from "@/types/resume"

// Initialize Prisma client
const prisma = new PrismaClient()

// Simple in-memory cache with expiration
class SimpleCache<T> {
  private cache: Map<string, { data: T; expiry: number }> = new Map();
  
  set(key: string, value: T, ttlMs: number): void {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { data: value, expiry });
    
    // Schedule cleanup
    setTimeout(() => {
      this.cache.delete(key);
    }, ttlMs);
  }
  
  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (cached.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Initialize cache for filtered resume results
const filterResultsCache = new SimpleCache<Resume[]>();

/**
 * Saves a parsed resume to the database
 */
export async function saveResumeToDatabase(resumeData: Resume): Promise<Resume> {
  try {
    console.log("Saving resume to database:", resumeData)
    
    // Log essential resume properties to verify data integrity
    console.log("Resume ID:", resumeData.id);
    console.log("Resume Fields Present:", {
      originalName: !!resumeData.originalName,
      filePath: !!resumeData.filePath,
      name: !!resumeData.name,
      skills: Array.isArray(resumeData.skills) ? resumeData.skills.length : 'not an array',
      experience: Array.isArray(resumeData.experience) ? resumeData.experience.length : 'not an array',
      totalExperience: resumeData.totalExperience || 'not specified',
      status: resumeData.status,
      uploadedAt: resumeData.uploadedAt
    });
    
    const savedResume = await prisma.resume.upsert({
      where: { id: resumeData.id },
      update: {
        originalName: resumeData.originalName,
        filePath: resumeData.filePath,
        pdfPath: resumeData.pdfPath,
        extractedText: resumeData.extractedText,
        name: resumeData.name,
        email: resumeData.email,
        phone: resumeData.phone,
        location: resumeData.location,
        title: resumeData.title,
        summary: resumeData.summary,
        skills: resumeData.skills,
        experience: resumeData.experience as any,
        education: resumeData.education,
        educationDetails: resumeData.educationDetails as any,
        certifications: resumeData.certifications,
        languages: resumeData.languages,
        experienceLevel: resumeData.experienceLevel,
        totalExperience: resumeData.totalExperience,
        status: resumeData.status,
        matchScore: resumeData.matchScore,
        matchedSkills: resumeData.matchedSkills,
        missingSkills: resumeData.missingSkills,
        experienceMatch: resumeData.experienceMatch,
        educationMatch: resumeData.educationMatch,
        overallAssessment: resumeData.overallAssessment,
        recommendations: resumeData.recommendations,
        processingStartedAt: resumeData.processingStartedAt ? new Date(resumeData.processingStartedAt) : null,
        processingCompletedAt: resumeData.processingCompletedAt ? new Date(resumeData.processingCompletedAt) : null,
      },
      create: {
        id: resumeData.id,
        originalName: resumeData.originalName,
        filePath: resumeData.filePath,
        pdfPath: resumeData.pdfPath,
        extractedText: resumeData.extractedText,
        name: resumeData.name,
        email: resumeData.email,
        phone: resumeData.phone,
        location: resumeData.location,
        title: resumeData.title,
        summary: resumeData.summary,
        skills: resumeData.skills,
        experience: resumeData.experience as any,
        education: resumeData.education,
        educationDetails: resumeData.educationDetails as any,
        certifications: resumeData.certifications,
        languages: resumeData.languages,
        experienceLevel: resumeData.experienceLevel,
        totalExperience: resumeData.totalExperience,
        status: resumeData.status,
        matchScore: resumeData.matchScore,
        matchedSkills: resumeData.matchedSkills,
        missingSkills: resumeData.missingSkills,
        experienceMatch: resumeData.experienceMatch,
        educationMatch: resumeData.educationMatch,
        overallAssessment: resumeData.overallAssessment,
        recommendations: resumeData.recommendations,
        uploadedAt: new Date(resumeData.uploadedAt),
        processingStartedAt: resumeData.processingStartedAt ? new Date(resumeData.processingStartedAt) : null,
        processingCompletedAt: resumeData.processingCompletedAt ? new Date(resumeData.processingCompletedAt) : null,
      },
    })

    console.log("Successfully saved resume:", savedResume)
    return {
      ...savedResume,
      uploadedAt: savedResume.uploadedAt.toISOString(),
      processingStartedAt: savedResume.processingStartedAt?.toISOString() || null,
      processingCompletedAt: savedResume.processingCompletedAt?.toISOString() || null,
      experience: savedResume.experience as unknown as Experience[],
      educationDetails: savedResume.educationDetails as unknown as Education[],
    } as Resume
  } catch (error) {
    console.error("Error saving resume to database:", error)
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Check for Prisma-specific errors
      if (error.name === 'PrismaClientKnownRequestError' || error.name === 'PrismaClientValidationError') {
        console.error("This is a Prisma error. Check your schema and data types.");
      }
    }
    
    throw error
  }
}

/**
 * Gets all resumes from the database
 */
export async function getAllResumes(): Promise<Resume[]> {
  try {
    console.log("Fetching all resumes from database")
    const resumes = await prisma.resume.findMany({
      orderBy: { uploadedAt: "desc" },
    })
    console.log(`Found ${resumes.length} resumes`)

    return resumes.map((resume) => ({
      ...resume,
      uploadedAt: resume.uploadedAt.toISOString(),
      processingStartedAt: resume.processingStartedAt?.toISOString() || null,
      processingCompletedAt: resume.processingCompletedAt?.toISOString() || null,
      experience: resume.experience as unknown as Experience[],
      educationDetails: resume.educationDetails as unknown as Education[],
    })) as Resume[]
  } catch (error) {
    console.error("Error fetching all resumes:", error)
    throw error
  }
}

interface ResumeFilters {
  skills?: string[]
  experience?: string[]
  education?: string[]
  status?: string[]
  search?: string
  jdId?: string
}

/**
 * Gets filtered resumes from the database
 */
export async function getFilteredResumes(filters: ResumeFilters): Promise<Resume[]> {
  try {
    console.log("Fetching filtered resumes with filters:", filters)
    
    // Implement a simple in-memory cache for repeated filter requests (5 minute TTL)
    const cacheKey = JSON.stringify(filters);
    const cachedResults = filterResultsCache.get(cacheKey);
    if (cachedResults) {
      console.log("Returning cached results for filter query");
      return cachedResults;
    }
    
    // Build optimized where clause
    const whereConditions: any[] = [];
    
    // Use individual conditions in an AND array for better index usage
    if (filters.skills?.length) {
      whereConditions.push({ skills: { hasSome: filters.skills } });
    }
    
    if (filters.experience?.length) {
      whereConditions.push({ experienceLevel: { in: filters.experience } });
    }
    
    if (filters.education?.length) {
      whereConditions.push({ education: { hasSome: filters.education } });
    }
    
    if (filters.status?.length) {
      whereConditions.push({ status: { in: filters.status } });
    }
    
    if (filters.search) {
      // Perform a separate search condition
      whereConditions.push({
        OR: [
          { originalName: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { skills: { hasSome: [filters.search] } }
        ]
      });
    }
    
    // Create the final where clause
    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
    
    console.log("Optimized query structure:", JSON.stringify(where, null, 2));
    
    // Limit fields returned to improve query performance
    const resumes = await prisma.resume.findMany({
      where,
      orderBy: { uploadedAt: 'desc' }
    });
    
    console.log(`Found ${resumes.length} filtered resumes`);
    
    // Convert dates to strings for the Resume interface
    const results = resumes.map(resume => ({
      ...resume,
      uploadedAt: resume.uploadedAt.toISOString(),
      processingStartedAt: resume.processingStartedAt?.toISOString() || null,
      processingCompletedAt: resume.processingCompletedAt?.toISOString() || null,
      experience: resume.experience as unknown as Experience[],
      educationDetails: resume.educationDetails as unknown as Education[],
    })) as Resume[];
    
    // Store in cache with 5 minute TTL
    filterResultsCache.set(cacheKey, results, 5 * 60 * 1000);
    
    return results;
  } catch (error) {
    console.error("Error fetching filtered resumes:", error)
    throw error
  }
}

/**
 * Gets a resume by ID
 */
export async function getResumeById(id: string): Promise<Resume | null> {
  try {
    const resume = await prisma.resume.findUnique({
      where: { id },
    })
    
    if (!resume) return null

    // Convert dates to strings for the Resume interface
    return {
      ...resume,
      uploadedAt: resume.uploadedAt.toISOString(),
      processingStartedAt: resume.processingStartedAt?.toISOString() || null,
      processingCompletedAt: resume.processingCompletedAt?.toISOString() || null,
      experience: resume.experience as unknown as Experience[],
      educationDetails: resume.educationDetails as unknown as Education[],
    } as Resume
  } catch (error) {
    console.error("Error getting resume by ID:", error)
    throw error
  }
}

/**
 * Updates a resume's status
 */
export async function updateResumeStatus(id: string, status: string): Promise<Resume> {
  try {
    const updatedResume = await prisma.resume.update({
      where: { id },
      data: { status },
    })
    
    // Convert dates to strings for the Resume interface
    return {
      ...updatedResume,
      uploadedAt: updatedResume.uploadedAt.toISOString(),
      processingStartedAt: updatedResume.processingStartedAt?.toISOString() || null,
      processingCompletedAt: updatedResume.processingCompletedAt?.toISOString() || null,
      experience: updatedResume.experience as unknown as Experience[],
      educationDetails: updatedResume.educationDetails as unknown as Education[],
    } as Resume
  } catch (error) {
    console.error("Error updating resume status:", error)
    throw error
  }
}

interface MatchResult {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  experienceMatch: number
  educationMatch: number
  overallAssessment: string
  recommendations: string[]
}

/**
 * Updates a resume's match results
 */
export async function updateResumeMatch(id: string, matchResult: MatchResult): Promise<Resume> {
  try {
    const updatedResume = await prisma.resume.update({
      where: { id },
      data: matchResult,
    })
    
    // Convert dates to strings for the Resume interface
    return {
      ...updatedResume,
      uploadedAt: updatedResume.uploadedAt.toISOString(),
      processingStartedAt: updatedResume.processingStartedAt?.toISOString() || null,
      processingCompletedAt: updatedResume.processingCompletedAt?.toISOString() || null,
      experience: updatedResume.experience as unknown as Experience[],
      educationDetails: updatedResume.educationDetails as unknown as Education[],
    } as Resume
  } catch (error) {
    console.error("Error updating resume match:", error)
    throw error
  }
}

/**
 * Deletes a resume
 */
export async function deleteResume(id: string): Promise<Resume> {
  try {
    const deletedResume = await prisma.resume.delete({
      where: { id },
    })
    
    // Convert dates to strings for the Resume interface
    return {
      ...deletedResume,
      uploadedAt: deletedResume.uploadedAt.toISOString(),
      processingStartedAt: deletedResume.processingStartedAt?.toISOString() || null,
      processingCompletedAt: deletedResume.processingCompletedAt?.toISOString() || null,
      experience: deletedResume.experience as unknown as Experience[],
      educationDetails: deletedResume.educationDetails as unknown as Education[],
    } as Resume
  } catch (error) {
    console.error("Error deleting resume:", error)
    throw error
  }
}

/**
 * Gets all job descriptions
 */
export async function getAllJobDescriptions() {
  try {
    return await prisma.jobDescription.findMany({
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    console.error("Error getting all job descriptions:", error)
    throw error
  }
}

/**
 * Gets a job description by ID
 */
export async function getJobDescriptionById(id: string) {
  try {
    return await prisma.jobDescription.findUnique({
      where: { id },
    })
  } catch (error) {
    console.error("Error getting job description by ID:", error)
    throw error
  }
}

/**
 * Creates a new job description
 */
export async function createJobDescription(jobDescription: any) {
  try {
    return await prisma.jobDescription.create({
      data: jobDescription,
    })
  } catch (error) {
    console.error("Error creating job description:", error)
    throw error
  }
}

/**
 * Updates a job description
 */
export async function updateJobDescription(id: string, updates: any) {
  try {
    return await prisma.jobDescription.update({
      where: { id },
      data: updates,
    })
  } catch (error) {
    console.error("Error updating job description:", error)
    throw error
  }
}

/**
 * Deletes a job description
 */
export async function deleteJobDescription(id: string) {
  try {
    await prisma.jobDescription.delete({
      where: { id },
    })
    return true
  } catch (error) {
    console.error("Error deleting job description:", error)
    return false
  }
}
