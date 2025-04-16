import type { Resume, Experience, Education } from "@/types/resume"

interface ParsedResume {
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
}

/**
 * Parses resume text using DeepSeek LLM
 */
export async function parseResumeWithLLM(resumeText: string): Promise<ParsedResume> {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY || "sk-02f34bd0ea4849e8a4232bc656e28727"
    const apiUrl = "https://api.deepseek.com/v1/chat/completions"

    const prompt = `
      You are an expert resume parser. Extract the following information from the resume text below:
      
      1. Full Name
      2. Email Address (primary)
      3. Phone Number (primary)
      4. Location/Address
      5. Current Job Title
      6. Professional Summary
      7. Skills (as a list)
      8. Work Experience (for each position: title, company, duration, and description)
      9. Education (list of degrees/qualifications)
      10. Education Details (for each institution: degree, institution name, and graduation year)
      11. Certifications (as a list)
      12. Languages (as a list)
      13. Experience Level (Entry Level, Mid Level, Senior, or Executive)
      
      Format the output as a JSON object with these fields:
      {
        "name": string,
        "email": string,
        "phone": string,
        "location": string,
        "title": string,
        "summary": string,
        "skills": string[],
        "experience": [{ "title": string, "company": string, "duration": string, "description": string }],
        "education": string[],
        "educationDetails": [{ "degree": string, "institution": string, "year": string }],
        "certifications": string[],
        "languages": string[],
        "experienceLevel": string
      }
      
      If any information is missing, use empty strings for text fields and empty arrays for lists.
      
      Resume Text:
      ${resumeText}
    `

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert resume parser that extracts structured information from resume text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`)
    }

    const data = await response.json()
    const parsedContent = data.choices[0].message.content

    // Extract the JSON object from the response
    let parsedResume: ParsedResume
    try {
      // The LLM might return the JSON with markdown code blocks, so we need to extract it
      const jsonMatch = parsedContent.match(/```json\n([\s\S]*?)\n```/) ||
        parsedContent.match(/```\n([\s\S]*?)\n```/) || [null, parsedContent]

      const jsonString = jsonMatch[1] || parsedContent
      const rawParsed = JSON.parse(jsonString)

      // Ensure all required fields are present with correct types
      parsedResume = {
        name: rawParsed.name || "",
        email: rawParsed.email || "",
        phone: rawParsed.phone || "",
        location: rawParsed.location || "",
        title: rawParsed.title || "",
        summary: rawParsed.summary || "",
        skills: Array.isArray(rawParsed.skills) ? rawParsed.skills : [],
        experience: Array.isArray(rawParsed.experience) ? rawParsed.experience.map((exp: any) => ({
          title: exp.title || "",
          company: exp.company || "",
          duration: exp.duration || "",
          description: exp.description || "",
        })) : [],
        education: Array.isArray(rawParsed.education) ? rawParsed.education : [],
        educationDetails: Array.isArray(rawParsed.educationDetails) ? rawParsed.educationDetails.map((edu: any) => ({
          degree: edu.degree || "",
          institution: edu.institution || "",
          year: edu.year || "",
        })) : [],
        certifications: Array.isArray(rawParsed.certifications) ? rawParsed.certifications : [],
        languages: Array.isArray(rawParsed.languages) ? rawParsed.languages : [],
        experienceLevel: rawParsed.experienceLevel || "Not specified",
      }
    } catch (error) {
      console.error("Error parsing LLM response as JSON:", error)
      console.log("Raw LLM response:", parsedContent)

      // Fallback to a basic structure if parsing fails
      parsedResume = {
        name: "",
        email: "",
        phone: "",
        location: "",
        title: "",
        summary: "",
        skills: [],
        experience: [],
        education: [],
        educationDetails: [],
        certifications: [],
        languages: [],
        experienceLevel: "Not specified",
      }
    }

    return parsedResume
  } catch (error) {
    console.error("Error parsing resume with LLM:", error)
    throw new Error("Failed to parse resume with LLM")
  }
}
