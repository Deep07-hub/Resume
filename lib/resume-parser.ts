import { convertDocToPdf } from "./document-converter"
import { convertPdfToImages } from "./pdf-to-image"
import { extractTextFromFile } from "./simple-text-parser"
import { performOcr } from "./ocr-service"
import { parseResumeWithLLM } from "./llm-parser"
import type { Resume, Experience } from "@/types/resume"
import { existsSync } from "fs"
import { v4 as uuidv4 } from "uuid"

interface FileData {
  id: string
  originalName: string
  filePath: string
  extension: string
  status: string
  uploadedAt: string
}

// Function to calculate total years of experience
export function calculateTotalExperience(experiences: Experience[]): string {
  if (!experiences || experiences.length === 0) {
    console.log("No experiences provided, returning 0 years");
    return "0 years";
  }
  
  console.log(`Processing ${experiences.length} experience entries:`);
  experiences.forEach((exp, i) => {
    console.log(`  [${i+1}] ${exp.title || 'No title'} at ${exp.company || 'No company'}: "${exp.duration || 'No duration'}"`);
  });
  
  let totalMonths = 0;
  let hasValidDurations = false;
  let attemptedParsing = false;
  
  // Process each experience entry
  for (const exp of experiences) {
    if (!exp.duration) {
      console.log(`Skipping experience with no duration: ${exp.title || 'Unknown position'}`);
      continue;
    }
    
    console.log(`Processing: "${exp.duration}" for ${exp.title || 'Unknown position'}`);
    attemptedParsing = true;
    
    // Clean the duration string - remove commas, multiple spaces, and standardize hyphens
    const cleanDuration = exp.duration.replace(/,/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/–|—/g, '-')
      .trim();
    
    // Try multiple approaches to parse the duration
    
    // Approach 1: Look for explicit year/month mentions (e.g., "2 years 5 months")
    const yearPattern = /(\d+\.?\d*)\s*(?:year|yr|y)s?/i;
    const monthPattern = /(\d+\.?\d*)\s*(?:month|mon|m)s?/i;
    
    const yearMatch = cleanDuration.match(yearPattern);
    const monthMatch = cleanDuration.match(monthPattern);
    
    if (yearMatch || monthMatch) {
      console.log(`  Found explicit year/month format`);
      if (yearMatch) {
        const years = parseFloat(yearMatch[1]);
        totalMonths += years * 12;
        console.log(`    Added ${years} years (${years * 12} months)`);
      }
      
      if (monthMatch) {
        const months = parseFloat(monthMatch[1]);
        totalMonths += months;
        console.log(`    Added ${months} months`);
      }
      
      hasValidDurations = true;
      continue;
    }
    
    // Approach 2: Date ranges with various formats
    try {
      // Format: "Month Year - Month Year" or with "to" instead of "-"
      const dateRangePattern = /([a-z]+\s+\d{4})\s*[-to]+\s*([a-z]+\s+\d{4}|present|current|now)/i;
      const dateRangeMatch = cleanDuration.match(dateRangePattern);
      
      // Format: "Month Year - Present" (special case)
      const currentDatePattern = /([a-z]+\s+\d{4})\s*[-to]+\s*(present|current|now)/i;
      const currentDateMatch = cleanDuration.match(currentDatePattern);
      
      // Format: "Year - Year" or "Year to Present"
      const yearRangePattern = /(\d{4})\s*[-to]+\s*(\d{4}|present|current|now)/i;
      const yearRangeMatch = cleanDuration.match(yearRangePattern);
      
      // Format: "MM/YYYY - MM/YYYY" or "MM-YYYY - MM-YYYY"
      const numericDatePattern = /(\d{1,2})[\/\-](\d{4})\s*[-to]+\s*(\d{1,2})[\/\-](\d{4}|present|current|now)/i;
      const numericDateMatch = cleanDuration.match(numericDatePattern);
      
      // Format: "Month Year" (single date, assume until present)
      const singleDatePattern = /^([a-z]+\s+\d{4})$/i;
      const singleDateMatch = cleanDuration.match(singleDatePattern);
      
      // Format: "Year" (single year, assume until present)
      const singleYearPattern = /^(\d{4})$/i;
      const singleYearMatch = cleanDuration.match(singleYearPattern);
      
      if (dateRangeMatch || currentDateMatch) {
        // Extract dates from "Month Year - Month Year" format
        const match = dateRangeMatch || currentDateMatch;
        console.log(`  Matched date range: "${match?.[1]}" to "${match?.[2]}"`);
        
        if (match) {
          const startDate = parseDate(match[1]);
          let endDate: Date | null = null;
          
          if (/present|current|now/i.test(match[2])) {
            endDate = new Date(); // Current date
            console.log(`    End date is present/current: ${endDate.toISOString().slice(0,10)}`);
          } else {
            endDate = parseDate(match[2]);
          }
          
          if (startDate && endDate) {
            // Calculate difference in months
            const monthCount = calculateMonthsBetweenDates(startDate, endDate);
            
            if (monthCount >= 0) {
              totalMonths += monthCount;
              hasValidDurations = true;
              console.log(`    Added ${monthCount} months (from ${startDate.toISOString().slice(0,10)} to ${endDate.toISOString().slice(0,10)})`);
            } else {
              console.log(`    Invalid negative duration: ${monthCount} months`);
            }
          }
        }
      } 
      else if (yearRangeMatch) {
        // Extract years from "Year - Year" format
        console.log(`  Matched year range: "${yearRangeMatch[1]}" to "${yearRangeMatch[2]}"`);
        
        const startYear = parseInt(yearRangeMatch[1]);
        let endYear: number;
        
        if (/present|current|now/i.test(yearRangeMatch[2])) {
          endYear = new Date().getFullYear();
          console.log(`    End year is current year: ${endYear}`);
        } else {
          endYear = parseInt(yearRangeMatch[2]);
        }
        
        if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
          const yearDiff = endYear - startYear;
          const monthCount = yearDiff * 12;
          totalMonths += monthCount;
          hasValidDurations = true;
          console.log(`    Added ${monthCount} months (${yearDiff} years) from ${startYear} to ${endYear}`);
        } else {
          console.log(`    Invalid years or range: ${startYear} to ${endYear}`);
        }
      }
      else if (numericDateMatch) {
        // Extract dates from "MM/YYYY - MM/YYYY" format
        console.log(`  Matched numeric date range: ${numericDateMatch[0]}`);
        
        const startMonth = parseInt(numericDateMatch[1]) - 1; // Months are 0-indexed in JS
        const startYear = parseInt(numericDateMatch[2]);
        
        let endMonth: number;
        let endYear: number;
        
        if (/present|current|now/i.test(numericDateMatch[4])) {
          const now = new Date();
          endMonth = now.getMonth();
          endYear = now.getFullYear();
        } else {
          endMonth = parseInt(numericDateMatch[3]) - 1;
          endYear = parseInt(numericDateMatch[4]);
        }
        
        if (!isNaN(startMonth) && !isNaN(startYear) && !isNaN(endMonth) && !isNaN(endYear)) {
          const startDate = new Date(startYear, startMonth, 1);
          const endDate = new Date(endYear, endMonth, 1);
          
          if (endDate >= startDate) {
            const monthCount = calculateMonthsBetweenDates(startDate, endDate);
            totalMonths += monthCount;
            hasValidDurations = true;
            console.log(`    Added ${monthCount} months from ${startDate.toISOString().slice(0,10)} to ${endDate.toISOString().slice(0,10)}`);
          } else {
            console.log(`    Invalid date range: end date before start date`);
          }
        } else {
          console.log(`    Invalid numeric date components: ${startMonth}/${startYear} - ${endMonth}/${endYear}`);
        }
      }
      else if (singleDateMatch) {
        // Process a single date (e.g., "January 2020") - assume it's ongoing
        console.log(`  Matched single date: "${singleDateMatch[1]}"`);
        const startDate = parseDate(singleDateMatch[1]);
        
        if (startDate) {
          const endDate = new Date(); // Current date
          const monthCount = calculateMonthsBetweenDates(startDate, endDate);
          
          if (monthCount >= 0) {
            totalMonths += monthCount;
            hasValidDurations = true;
            console.log(`    Added ${monthCount} months (from ${startDate.toISOString().slice(0,10)} to present)`);
          }
        }
      }
      else if (singleYearMatch) {
        // Process a single year (e.g., "2020") - assume it's ongoing
        console.log(`  Matched single year: "${singleYearMatch[1]}"`);
        const startYear = parseInt(singleYearMatch[1]);
        const currentYear = new Date().getFullYear();
        
        if (!isNaN(startYear) && startYear <= currentYear) {
          // Assume it's been from January of that year until now
          const startDate = new Date(startYear, 0, 1); // January 1st
          const endDate = new Date(); // Current date
          const monthCount = calculateMonthsBetweenDates(startDate, endDate);
          
          if (monthCount >= 0) {
            totalMonths += monthCount;
            hasValidDurations = true;
            console.log(`    Added ${monthCount} months (from ${startDate.toISOString().slice(0,10)} to present)`);
          }
        }
      }
      else {
        // Approach 3: Try to extract any years from the text as a last resort
        const yearsInText = cleanDuration.match(/\b(19|20)\d{2}\b/g);
        if (yearsInText && yearsInText.length >= 2) {
          console.log(`  Found years in text: ${yearsInText.join(', ')}`);
          
          // Take first and last years
          const startYear = parseInt(yearsInText[0]);
          const endYear = parseInt(yearsInText[yearsInText.length - 1]);
          
          if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
            const yearDiff = endYear - startYear;
            const monthCount = yearDiff * 12;
            totalMonths += monthCount;
            hasValidDurations = true;
            console.log(`    Added ${monthCount} months (${yearDiff} years) from extracted years ${startYear}-${endYear}`);
          }
        } 
        // Approach 4: Check if it's just a single number (years of experience)
        else if (/^[\d\.]+$/.test(cleanDuration.trim())) {
          const years = parseFloat(cleanDuration.trim());
          if (!isNaN(years) && years > 0) {
            const monthCount = Math.round(years * 12);
            totalMonths += monthCount;
            hasValidDurations = true;
            console.log(`    Found numerical value: ${years} years (${monthCount} months)`);
          }
        }
        // Approach 5: Check for duration expressions like "X+ years", "over X years", etc.
        else {
          const durationExprMatch = cleanDuration.match(/(?:over|more than|about|approximately|around|nearly|almost|(\d+)\+)\s*(\d+\.?\d*)\s*(?:year|yr|y)s?/i);
          if (durationExprMatch) {
            const years = parseFloat(durationExprMatch[2]);
            if (!isNaN(years) && years > 0) {
              const monthCount = Math.round(years * 12);
              totalMonths += monthCount;
              hasValidDurations = true;
              console.log(`    Found duration expression: at least ${years} years (${monthCount} months)`);
            }
          } else {
            console.log(`  Could not parse duration format: "${cleanDuration}"`);
          }
        }
      }
    } catch (error) {
      console.error(`  Error processing duration "${exp.duration}":`, error);
    }
  }
  
  if (!hasValidDurations) {
    // If we couldn't parse any durations but have experience entries and attempted parsing
    if (experiences.length > 0 && attemptedParsing) {
      // Assume average job length of 2 years per position
      const estimatedMonths = experiences.length * 24;
      console.log(`No valid durations found, estimating based on ${experiences.length} positions (${estimatedMonths} months)`);
      totalMonths = estimatedMonths;
    } else {
      console.log(`No valid durations found, returning "Unknown"`);
      return "Unknown";
    }
  }
  
  // Calculate years and months from total months
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  // Format the output
  let result: string;
  if (years === 0) {
    result = `${months} month${months !== 1 ? 's' : ''}`;
  } else if (months === 0) {
    result = `${years} year${years !== 1 ? 's' : ''}`;
  } else {
    result = `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
  }
  
  console.log(`Total experience calculated: ${result} (${totalMonths} months)`);
  return result;
}

// Helper function to calculate months between two dates
function calculateMonthsBetweenDates(start: Date, end: Date): number {
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  return (yearDiff * 12) + monthDiff;
}

// Helper function to parse a date string
function parseDate(dateStr: string): Date | null {
  const parts = dateStr.trim().split(/\s+/);
  
  if (parts.length >= 2) {
    // Format: "Month Year"
    const monthName = parts[0].toLowerCase();
    const year = parseInt(parts[parts.length - 1]);
    
    if (!isNaN(year)) {
      const monthIndex = getMonthIndex(monthName);
      if (monthIndex !== -1) {
        return new Date(year, monthIndex, 1);
      }
    }
  }
  
  // Try alternate formats if month-year parsing failed
  
  // Try MM/YYYY or MM-YYYY format
  const numericDateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{4})/);
  if (numericDateMatch) {
    const month = parseInt(numericDateMatch[1]) - 1; // 0-indexed months
    const year = parseInt(numericDateMatch[2]);
    if (!isNaN(month) && !isNaN(year) && month >= 0 && month < 12) {
      return new Date(year, month, 1);
    }
  }
  
  console.warn(`  Failed to parse date string: "${dateStr}"`);
  return null;
}

// Helper function to convert month name to index
function getMonthIndex(monthName: string): number {
  const monthMap: {[key: string]: number} = {
    'january': 0, 'jan': 0,
    'february': 1, 'feb': 1, 
    'march': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'may': 4,
    'june': 5, 'jun': 5,
    'july': 6, 'jul': 6,
    'august': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'december': 11, 'dec': 11
  };
  
  // First try direct lookup
  if (monthName.toLowerCase() in monthMap) {
    return monthMap[monthName.toLowerCase()];
  }
  
  // Try with first 3 characters
  const prefix = monthName.substring(0, 3).toLowerCase();
  if (prefix in monthMap) {
    return monthMap[prefix];
  }
  
  return -1;
}

export async function parseResume(fileData: FileData): Promise<Resume> {
  console.log("=== Starting resume parsing ===")
  try {
    console.log("1. Starting resume parsing for file:", fileData.id)
    
    // Verify file exists
    console.log("2. Checking if file exists:", fileData.filePath)
    if (!existsSync(fileData.filePath)) {
      console.error("File does not exist:", fileData.filePath)
      return createBasicResume(fileData, `File does not exist: ${fileData.filePath}. Cannot process this resume.`)
    }
    console.log("3. File exists")
    
    // Step 1: Convert DOC/DOCX to PDF if needed
    let pdfPath = fileData.filePath
    try {
      if (fileData.extension === "doc" || fileData.extension === "docx") {
        console.log("4. Converting DOC/DOCX to PDF...")
        pdfPath = await convertDocToPdf(fileData.filePath)
        console.log("5. Conversion completed:", pdfPath)
      } else {
        console.log("4. File is already PDF, no conversion needed")
      }
    } catch (conversionError) {
      console.error("Error converting document to PDF:", conversionError)
      pdfPath = fileData.filePath
    }

    // Step 2: Extract text directly from PDF or file
    console.log("6. Extracting text from file...")
    let extractedText = ""
    try {
      extractedText = await extractTextFromFile(pdfPath)
      console.log("7. Extracted text length:", extractedText.length)
    } catch (extractionError) {
      console.error("Error extracting text:", extractionError)
      extractedText = `Text extraction failed: ${extractionError instanceof Error ? extractionError.message : "Unknown error"}`
    }

    // Add filename and metadata to extracted text to provide context
    let contextInfo = `\n\nFile Information:\nFilename: ${fileData.originalName}\nFile type: ${fileData.extension}\nUploaded: ${fileData.uploadedAt}\n`;
    
    // If text extraction failed or returned very little text, use a placeholder
    if (!extractedText || extractedText.length < 100) {
      console.log("8. Text extraction insufficient, using file metadata only")
      extractedText = `This appears to be a ${fileData.extension.toUpperCase()} document that couldn't be fully parsed.` + contextInfo;
    } else {
      console.log("8. Text extraction successful, adding file metadata")
      extractedText += contextInfo;
    }

    // Step 5: Parse resume with LLM
    console.log("9. Parsing resume with LLM...")
    let parsedData = null
    try {
      parsedData = await parseResumeWithLLM(extractedText)
      console.log("10. LLM parsing completed")
    } catch (llmError) {
      console.error("Error parsing with LLM:", llmError)
      // Create minimal parsed data with the file name as the person's name
      parsedData = {
        name: getNameFromFilename(fileData.originalName),
        email: "",
        phone: "",
        location: "",
        title: "",
        summary: "Resume parsing failed, but the document was saved. Please try re-uploading or processing manually.",
        skills: [],
        experience: [],
        education: [],
        educationDetails: [],
        certifications: [],
        languages: [],
        experienceLevel: "Not specified"
      }
    }
    
    // Calculate total experience
    const totalExperience = calculateTotalExperience(parsedData.experience || []);
    console.log("Total experience calculated:", totalExperience);

    // Return the parsed resume
    console.log("11. Returning parsed resume")
    return {
      id: fileData.id,
      originalName: fileData.originalName,
      filePath: fileData.filePath,
      pdfPath: pdfPath !== fileData.filePath ? pdfPath : null,
      extractedText,
      name: parsedData.name || fileData.originalName,
      email: parsedData.email || "",
      phone: parsedData.phone || "",
      location: parsedData.location || "",
      title: parsedData.title || "",
      summary: parsedData.summary || "",
      skills: parsedData.skills || [],
      experience: parsedData.experience || [],
      education: parsedData.education || [],
      educationDetails: parsedData.educationDetails || [],
      certifications: parsedData.certifications || [],
      languages: parsedData.languages || [],
      experienceLevel: parsedData.experienceLevel || "Not specified",
      totalExperience,
      status: "Processed",
      matchScore: 0,
      matchedSkills: [],
      missingSkills: [],
      experienceMatch: 0,
      educationMatch: 0,
      overallAssessment: "",
      recommendations: [],
      uploadedAt: fileData.uploadedAt,
      processingStartedAt: new Date().toISOString(),
      processingCompletedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error("Error parsing resume:", error)
    return createBasicResume(fileData, `Failed to parse resume: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Helper function to create a basic resume object when parsing fails
function createBasicResume(fileData: FileData, errorMessage: string): Resume {
  return {
    id: fileData.id,
    originalName: fileData.originalName,
    filePath: fileData.filePath,
    pdfPath: null,
    extractedText: errorMessage,
    name: getNameFromFilename(fileData.originalName),
    email: "",
    phone: "",
    location: "",
    title: "",
    summary: "Error during resume processing. " + errorMessage,
    skills: [],
    experience: [],
    education: [],
    educationDetails: [],
    certifications: [],
    languages: [],
    experienceLevel: "Unknown",
    totalExperience: "Unknown",
    status: "Error",
    matchScore: 0,
    matchedSkills: [],
    missingSkills: [],
    experienceMatch: 0,
    educationMatch: 0,
    overallAssessment: "",
    recommendations: [],
    uploadedAt: fileData.uploadedAt,
    processingStartedAt: new Date().toISOString(),
    processingCompletedAt: new Date().toISOString()
  }
}

// Helper function to extract a name from a filename
function getNameFromFilename(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "")
  
  // Replace underscores and hyphens with spaces
  const nameWithSpaces = nameWithoutExt.replace(/[_-]/g, " ")
  
  // Capitalize first letter of each word
  return nameWithSpaces
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
} 