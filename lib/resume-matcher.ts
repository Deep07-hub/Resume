/**
 * Matches a resume against a job description using DeepSeek LLM
 */
export async function matchResumeToJD(resume: any, jobDescription: string): Promise<any> {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY || "sk-02f34bd0ea4849e8a4232bc656e28727"
    const apiUrl = "https://api.deepseek.com/v1/chat/completions"

    // Create a simplified resume text for the LLM
    const resumeText = `
      Name: ${resume.name}
      Title: ${resume.title}
      Skills: ${resume.skills.join(", ")}
      Experience: ${resume.experience
        .map((exp) => `${exp.title} at ${exp.company} (${exp.duration}): ${exp.description}`)
        .join("\n")}
      Education: ${resume.education.join(", ")}
      Certifications: ${resume.certifications.join(", ")}
      Languages: ${resume.languages.join(", ")}
    `

    const prompt = `
      You are an expert HR recruiter. Analyze how well the candidate's resume matches the job description.
      
      Job Description:
      ${jobDescription}
      
      Candidate's Resume:
      ${resumeText}
      
      Provide the following in JSON format:
      1. matchScore: A score from 0 to 100 indicating how well the resume matches the job description
      2. matchedSkills: An array of skills from the resume that match the job description
      3. missingSkills: An array of important skills mentioned in the job description that are missing from the resume
      4. experienceMatch: A score from 0 to 100 indicating how well the candidate's experience matches the job requirements
      5. educationMatch: A score from 0 to 100 indicating how well the candidate's education matches the job requirements
      6. overallAssessment: A brief assessment of the candidate's fit for the position
      7. recommendations: Suggestions for what the candidate could improve to better match the job requirements
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
            content: "You are an expert HR recruiter that evaluates how well candidates match job descriptions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`)
    }

    const data = await response.json()
    const matchContent = data.choices[0].message.content

    // Extract the JSON object from the response
    let matchResult
    try {
      // The LLM might return the JSON with markdown code blocks, so we need to extract it
      const jsonMatch = matchContent.match(/```json\n([\s\S]*?)\n```/) ||
        matchContent.match(/```\n([\s\S]*?)\n```/) || [null, matchContent]

      const jsonString = jsonMatch[1] || matchContent
      matchResult = JSON.parse(jsonString)
    } catch (error) {
      console.error("Error parsing LLM match response as JSON:", error)
      console.log("Raw LLM response:", matchContent)

      // Fallback to a basic structure if parsing fails
      matchResult = {
        matchScore: 0,
        matchedSkills: [],
        missingSkills: [],
        experienceMatch: 0,
        educationMatch: 0,
        overallAssessment: "Unable to assess match",
        recommendations: ["Unable to generate recommendations"],
      }
    }

    return matchResult
  } catch (error) {
    console.error("Error matching resume to job description:", error)
    throw new Error("Failed to match resume to job description")
  }
}
