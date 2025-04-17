import { v4 as uuidv4 } from "uuid";
import { parseResumeWithLLM } from "./llm-parser";
import { calculateTotalExperience } from "./resume-parser";
import type { Experience as ResumeExperience, Education as ResumeEducation } from "@/types/resume";
import { Logger } from './logger';
// Fix for the missing OpenAI module - check if it's installed
try {
  require('openai');
} catch (e) {
  console.error("OpenAI package is not installed. Please install it with: npm install openai");
}

// Create dynamic OpenAI import to handle the module not being found during type checking
// Use a typing workaround to avoid the "Cannot find module" error
interface OpenAIInstance {
  chat: {
    completions: {
      create: (params: any) => Promise<any>;
    }
  }
}

// The actual OpenAI implementation is loaded at runtime
let OpenAI: { new(config: { apiKey: string }): OpenAIInstance } | undefined;
try {
  // Dynamic require to avoid TypeScript errors with missing module
  const openaiModule = require('openai');
  OpenAI = openaiModule.OpenAI;
} catch (e) {
  console.warn("OpenAI package not loaded. Resume parsing will use fallback methods.");
}

// Define the ParsedResume interface
interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  skills: string[];
  experience: ResumeExperience[];
  education: string[];
  educationDetails: ResumeEducation[];
  certifications: string[];
  languages: string[];
  experienceLevel: string;
  totalYearsExperience: string;
  resumeText: string;
  parsedText: string;
  confidenceScore: number;
  matchScore: number;
  originalFileName: string;
  fileExtension: string;
  fileSize: number;
  overallAssessment: string;
  recommendations: string[];
  parsingMethod: string;
  uploadedAt: string;
  processingStartedAt: string;
  processingCompletedAt: string;
}

interface ResumeTextInput {
  id: string;
  originalName: string;
  fileBuffer: Buffer;
  extension: string;
  uploadedAt: Date;
}

interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

// Initialize OpenAI client conditionally
let openai: any = null;
if (process.env.OPENAI_API_KEY && OpenAI) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (e) {
    console.error("Error initializing OpenAI client:", e);
  }
}

// Constants for parsing
const MAX_TEXT_LENGTH = 75000;

/**
 * Sanitizes text by removing null bytes and other problematic characters
 */
function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  
  // Remove null bytes (0x00) which cause PostgreSQL UTF-8 encoding errors
  return text.replace(/\0/g, '')
    // Also remove other potentially problematic control characters
    .replace(/[\u0001-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    // Replace any remaining invalid UTF-8 sequences with a space
    .replace(/[\uD800-\uDFFF]/g, ' ')
    // Trim whitespace
    .trim();
}

/**
 * Sanitizes an array of strings
 */
function sanitizeArray(array: string[] | null | undefined): string[] {
  if (!array || !Array.isArray(array)) return [];
  return array.map(item => sanitizeText(item)).filter(Boolean);
}

/**
 * Sanitizes an object by cleaning all string properties
 */
function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
        return sanitizeText(item);
      }
      return sanitizeObject(item);
    }) as unknown as T;
  }
  
  // Handle objects
  const result = {} as any;
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (typeof value === 'string') {
      result[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      result[key] = sanitizeObject(value);
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Extracts basic information using regex patterns
 */
function extractWithRegex(text: string): Partial<ParsedResume> {
  console.log("Using regex fallback parser");
  
  // Try to extract name - look for patterns like "Name:" or at the beginning
  let name = "";
  const namePatterns = [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/,            // First Last
    /\b[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+\b/,    // First M. Last
    /name:?\s*([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i,  // Name: First Last
    /(?:^|\n)([A-Z][a-z]+(?: [A-Z][a-z]+){1,2})(?:\n|$)/,  // Name at beginning of line
    /(?:CV|Resume|Curriculum Vitae) of ([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i,  // Resume of Name
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && (match[1] || match[0])) {
      name = match[1] || match[0];
      name = name.replace(/name:?\s*/i, "").trim();
      break;
    }
  }
  
  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : "";
  
  // Extract phone number - improved patterns
  const phonePatterns = [
    /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,  // (123) 456-7890
    /\b\d{10}\b/,  // 1234567890
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,  // 123-456-7890
    /\b(\+\d{1,3}[-.\s]?)?\d{1,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/,  // International formats
    /(?:Phone|Tel|Mobile|Cell):?\s*([+\d()\s.-]{7,})/i,  // Phone: +1 (123) 456-7890
  ];
  
  let phone = "";
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match && (match[1] || match[0])) {
      phone = match[1] || match[0];
      break;
    }
  }
  
  // Extract location
  const locationPatterns = [
    /(?:Address|Location|Based in):?\s*([A-Za-z0-9\s.,'-]+(?:,\s*[A-Za-z]{2})?\s*\d{5}(?:-\d{4})?)/i,  // Address: City, State ZIP
    /\b([A-Za-z\s-]+,\s*[A-Za-z]{2}(?:\s*\d{5})?)\b/,  // City, State ZIP
    /\b([A-Za-z\s-]+,\s*[A-Za-z\s]+)\b/,  // City, Country
  ];
  
  let location = "";
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && (match[1] || match[0])) {
      location = match[1] || match[0];
      location = location.replace(/(?:Address|Location|Based in):?\s*/i, "").trim();
      break;
    }
  }
  
  // Extract skills - common technical skills with more keywords
  const skillKeywords = [
    // Programming languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Go',
    'Rust', 'Kotlin', 'Scala', 'Perl', 'Haskell', 'Lua', 'R', 'MATLAB', 'Groovy', 'Objective-C',
    // Frontend
    'React', 'Angular', 'Vue', 'Svelte', 'jQuery', 'Next.js', 'Gatsby', 'HTML', 'CSS', 'SASS', 
    'LESS', 'Bootstrap', 'Tailwind', 'Material UI', 'Webpack', 'Babel', 'ESLint',
    // Backend
    'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel', 'ASP.NET', 'Rails', 'FastAPI',
    'Symfony', 'NestJS', 'Deno', 'GraphQL', 'REST API', 'WebSockets', 'Microservices', 'gRPC',
    // Databases
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'DynamoDB', 'Cassandra', 'Redis', 'SQLite', 'Oracle',
    'MariaDB', 'Firebase', 'Supabase', 'Elasticsearch', 'Neo4j', 'CouchDB', 'InfluxDB',
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Jenkins', 'GitHub Actions',
    'Terraform', 'Ansible', 'Puppet', 'Chef', 'Prometheus', 'Grafana', 'ELK Stack',
    // AI & Data Science
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
    'Scikit-learn', 'Keras', 'NLTK', 'Computer Vision', 'NLP', 'Big Data', 'Data Mining',
    // Project Management
    'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence', 'Project Management', 'Product Management',
    'Team Leadership', 'Communication', 'Problem Solving', 'Critical Thinking',
    // Operating Systems & environments
    'Linux', 'Unix', 'Windows', 'MacOS', 'Android', 'iOS', 'Mobile Development',
    // Testing
    'Testing', 'QA', 'Unit Testing', 'Integration Testing', 'Jest', 'Mocha', 'Cypress',
    'Selenium', 'JUnit', 'TestNG', 'Pytest', 'TDD', 'BDD',
    // Other tech
    'Blockchain', 'Ethereum', 'Smart Contracts', 'Solidity', 'Web3', 'IoT', 'AR/VR',
    'Game Development', 'Unity', 'Unreal Engine',
  ];
  
  const skills: string[] = [];
  
  // First, look for "Skills" section
  const skillsSection = text.match(/(?:Technical\s+)?Skills:?(?:\s*:)?\s*([^\n]+(?:\n[^\n]+)*)/i);
  if (skillsSection && skillsSection[1]) {
    const skillText = skillsSection[1];
    for (const skill of skillKeywords) {
      if (new RegExp('\\b' + skill + '\\b', 'i').test(skillText)) {
        if (!skills.includes(skill)) {
          skills.push(skill);
        }
      }
    }
  }
  
  // Then, scan the whole document
  for (const skill of skillKeywords) {
    if (new RegExp('\\b' + skill + '\\b', 'i').test(text)) {
      if (!skills.includes(skill)) {
        skills.push(skill);
      }
    }
  }
  
  // Try to determine experience level
  let experienceLevel = "Not specified";
  
  // Look for years of experience
  const expYearsPatterns = [
    /(\d+)\+?\s*(?:years|yrs)(?:\s*of\s*experience)?/i,
    /experience:?\s*(\d+)\+?\s*(?:years|yrs)/i,
    /(?:with|having)\s+(\d+)\+?\s*(?:years|yrs)/i,
  ];
  
  let years = 0;
  for (const pattern of expYearsPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const foundYears = parseInt(match[1]);
      if (foundYears > years) {
        years = foundYears;
      }
    }
  }
  
  if (years > 0) {
    if (years >= 0 && years <= 2) {
      experienceLevel = "Entry Level";
    } else if (years > 2 && years <= 5) {
      experienceLevel = "Mid Level";
    } else if (years > 5 && years <= 10) {
      experienceLevel = "Senior";
    } else if (years > 10) {
      experienceLevel = "Executive";
    }
  } else {
    // Look for keywords
    if (/\b(?:senior|lead|principal|staff|architect|manager|director)\b/i.test(text)) {
      experienceLevel = "Senior";
    } else if (/\b(?:junior|entry|graduate|intern|trainee)\b/i.test(text)) {
      experienceLevel = "Entry Level";
    }
  }
  
  // Extract education
  const educationPatterns = [
    /(?:B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|Ph\.?D\.?|Bachelor|Master|Doctor|MBA|BSc|MSc|BEng|MEng)/i,
  ];
  
  const education: string[] = [];
  
  // First try to find education section
  const eduSection = text.match(/Education:?(?:\s*:)?\s*([^\n]+(?:\n[^\n]+)*)/i);
  if (eduSection && eduSection[1]) {
    const eduText = eduSection[1];
    for (const pattern of educationPatterns) {
      const matches = eduText.match(new RegExp(pattern.source, 'gi'));
      if (matches) {
        for (const match of matches) {
          if (!education.includes(match)) {
            education.push(match);
          }
        }
      }
    }
  }
  
  // Then scan the whole document
  for (const pattern of educationPatterns) {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    if (matches) {
      for (const match of matches) {
        if (!education.includes(match)) {
          education.push(match);
        }
      }
    }
  }
  
  // Try to extract educational institutions
  const eduInstitutions = text.match(/(?:University|College|Institute|School) of ([A-Za-z\s&]+)/gi);
  if (eduInstitutions) {
    for (const institution of eduInstitutions) {
      if (!education.includes(institution)) {
        education.push(institution);
      }
    }
  }
  
  // Try to find job titles
  const titlePatterns = [
    /\b(?:Senior|Lead|Principal|Staff|Junior|Associate)?\s*(?:Software|Frontend|Backend|Full Stack|DevOps|Cloud|Data|Machine Learning|AI|Mobile|Web|UI\/UX|QA|Test)?\s*(?:Engineer|Developer|Architect|Scientist|Analyst|Manager|Director|Specialist|Designer)\b/i,
    /\b(?:CTO|CEO|CIO|CFO|COO|VP of [A-Za-z]+)\b/i,
    /\bTitle:?\s*([^\n]+)/i,
    /\bPosition:?\s*([^\n]+)/i,
    /\bRole:?\s*([^\n]+)/i,
  ];
  
  let title = "";
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && (match[1] || match[0])) {
      title = match[1] || match[0];
      title = title.replace(/(?:Title|Position|Role):?\s*/i, "").trim();
      break;
    }
  }
  
  // Extract summary or objective
  const summaryPatterns = [
    /(?:Summary|Profile|Objective|About):?(?:\s*:)?\s*([^\n]+(?:\n[^\n]+){0,3})/i,
    /(?:^|\n\n)([A-Za-z,.\s]{40,}?)(?:\n\n|$)/,
  ];
  
  let summary = "";
  for (const pattern of summaryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      summary = match[1].trim();
      summary = summary.replace(/(?:Summary|Profile|Objective|About):?(?:\s*:)?\s*/i, "").trim();
      break;
    }
  }
  
  // If no summary found, create one from the beginning of the text
  if (!summary && text.length > 100) {
    // Get first paragraph (assuming it might be a summary)
    const firstPara = text.split(/\n\s*\n/)[0];
    if (firstPara && firstPara.length > 50 && firstPara.length < 500) {
      summary = firstPara;
    } else {
      // Or just take the first 200 characters
      summary = text.substring(0, 200) + "...";
    }
  }
  
  // Extract work experience
  const experiences: ResumeExperience[] = [];
  
  // Look for work experience section
  const expSection = text.match(/(?:Work\s+)?Experience:?(?:\s*:)?\s*([^\n]+(?:\n[^\n]+)*)/i);
  if (expSection && expSection[1]) {
    const expText = expSection[1];
    // Try to find company and title pairs
    const companyMatches = expText.match(/(?:^|\n)([A-Z][A-Za-z\s.,&]+)(?:\n|,\s*|\s*-\s*)((?:Senior|Lead|Principal|Staff|Junior)?\s*[A-Za-z\s]+)(?:\n|,\s*|\s*-\s*)(\d{1,2}\/\d{4}|\d{4})\s*(?:-|to|–)\s*(\d{1,2}\/\d{4}|\d{4}|Present)/ig);
    
    if (companyMatches) {
      for (const match of companyMatches) {
        const parts = match.split(/\n|,\s*|\s*-\s*/);
        if (parts.length >= 3) {
          const company = parts[0].trim();
          const jobTitle = parts[1].trim();
          const duration = parts.slice(2).join(" - ").trim();
          
          experiences.push({
            company,
            title: jobTitle,
            duration,
            description: "" // We don't parse description in regex mode
          });
        }
      }
    }
  }
  
  // Sanitize all extracted data
  return {
    name: sanitizeText(name),
    email: sanitizeText(email),
    phone: sanitizeText(phone),
    location: sanitizeText(location),
    title: sanitizeText(title),
    summary: sanitizeText(summary),
    skills: sanitizeArray(skills),
    experience: experiences,
    education: sanitizeArray(education),
    educationDetails: [],
    certifications: [],
    languages: [],
    experienceLevel: sanitizeText(experienceLevel),
    totalYearsExperience: years > 0 ? years.toString() : ""
  };
}

/**
 * Different extraction methods based on file type
 */
async function extractTextFromFile(buffer: Buffer, extension: string): Promise<{ text: string, success: boolean }> {
  if (extension === 'pdf') {
    console.log("PDF detected - using specialized text extraction");
    const extractedText = extractTextFromPdfBuffer(buffer);
    return { 
      text: extractedText, 
      success: Boolean(extractedText && extractedText.length > 100) 
    };
  } else if (extension === 'docx') {
    console.log("DOCX detected - using specialized text extraction");
    try {
      const extractedText = await extractTextFromDocxBuffer(buffer);
      return {
        text: extractedText,
        success: Boolean(extractedText && extractedText.length > 100)
      };
    } catch (error) {
      console.error("Error extracting text from DOCX:", error);
      return { text: "", success: false };
    }
  } else {
    // For non-PDF files, try direct string conversion first
    console.log("Non-PDF/DOCX document - attempting direct text extraction");
    const extractedText = buffer.toString('utf-8');
    
    // Check if we got readable text or binary garbage
    const hasReadableText = /[a-zA-Z]{5,}/.test(extractedText);
    return { text: extractedText, success: hasReadableText };
  }
}

/**
 * Parses resume text in a serverless environment
 * Instead of file paths, this takes the file buffer directly
 */
export async function parseResumeText(input: ResumeTextInput): Promise<ParsedResume> {
  const { id, originalName, fileBuffer, extension, uploadedAt } = input;
  
  console.log("=== Starting serverless resume parsing ===");
  try {
    console.log(`Processing file: ${originalName} (${extension})`);
    
    // Extract text from buffer
    let extractedText = "";
    const fileSize = fileBuffer.byteLength;
    console.log(`File size: ${fileSize} bytes`);
    
    try {
      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(fileBuffer);
      
      // First try direct text extraction for text-based formats
      const extraction = await extractTextFromFile(buffer, extension);
      let textExtractionSuccess = extraction.success;
      extractedText = extraction.text;
      
      // If direct extraction failed, try to extract readable portions
      if (!textExtractionSuccess) {
        console.log("Primary extraction failed - attempting to extract readable portions");
        extractedText = extractReadableText(buffer);
        
        // Check if we were able to extract something useful
        if (extractedText.length < 100) {
          console.log("WARNING: Very little text could be extracted from this file");
        }
      }
      
      // Sanitize the extracted text
      extractedText = sanitizeText(extractedText);
      
      // Log a sample of the extracted text for debugging
      console.log(`Extracted ${extractedText.length} characters of text`);
      console.log("TEXT SAMPLE:", extractedText.substring(0, 500).replace(/\n/g, " "));
    } catch (extractError) {
      console.error("Error extracting text from buffer:", extractError);
      extractedText = "Text extraction failed.";
    }
    
    // Add filename metadata to provide context for parsing
    const contextInfo = `\n\nFile Information:\nFilename: ${originalName}\nFile type: ${extension}\nUploaded: ${uploadedAt}\n`;
    
    // If text extraction is insufficient, use a placeholder
    if (!extractedText || extractedText.length < 100) {
      console.log("Text extraction insufficient, using file metadata only");
      extractedText = `This appears to be a ${extension.toUpperCase()} document that couldn't be fully parsed.` + contextInfo;
    } else {
      console.log("Text extraction successful, adding file metadata");
      extractedText += contextInfo;
    }

    // Try to parse with DeepSeek - pass just the text, filename is extracted from the text itself
    try {
      console.log('Attempting to parse resume with DeepSeek', { resumeId: id });
      const parsedData = await parseWithDeepSeek(extractedText);
      console.log('Successfully parsed resume with DeepSeek', { resumeId: id });
      return parsedData;
    } catch (deepSeekError) {
      console.error('Error parsing with DeepSeek, falling back to regex', { error: deepSeekError, resumeId: id });
      
      // Try OpenAI as backup if available and DeepSeek failed
      if (openai) {
        try {
          console.log('Attempting to parse resume with OpenAI as backup', { resumeId: id });
          const parsedData = await parseWithOpenAI(extractedText, originalName);
          console.log('Successfully parsed resume with OpenAI', { resumeId: id });
          return parsedData;
        } catch (openaiError) {
          console.error('Error parsing with OpenAI, falling back to regex', { error: openaiError, resumeId: id });
        }
      }
    }
    
    // Fallback to regex parsing
    console.log('Using regex parsing for resume', { resumeId: id });
    const regexResults = extractWithRegex(extractedText);
    
    // Merge regex results with LLM results (prefer regex for empty fields)
    const parsedData = {
      ...regexResults,
      name: regexResults.name || getNameFromFilename(originalName),
      email: regexResults.email || "",
      phone: regexResults.phone || "",
      title: regexResults.title || "",
      skills: regexResults.skills && regexResults.skills.length ? regexResults.skills : [],
      experience: [] as ResumeExperience[],
      education: regexResults.education && regexResults.education.length ? regexResults.education : [],
      experienceLevel: regexResults.experienceLevel && typeof regexResults.experienceLevel === "string" && 
                     regexResults.experienceLevel !== "Not specified" ? 
                     regexResults.experienceLevel : "Not specified"
    };
    
    // Calculate total experience
    const totalExperience = calculateTotalExperience(parsedData.experience);
    console.log("Total experience calculated:", totalExperience);

    // Return the parsed resume
    return {
      name: sanitizeText(parsedData.name) || "Unknown",
      email: sanitizeText(parsedData.email) || "",
      phone: sanitizeText(parsedData.phone) || "",
      location: sanitizeText(parsedData.location) || "",
      title: sanitizeText(parsedData.title) || "",
      summary: sanitizeText(parsedData.summary) || "",
      skills: sanitizeArray(parsedData.skills || []),
      experience: parsedData.experience || [],
      education: sanitizeArray(parsedData.education || []),
      educationDetails: parsedData.educationDetails || [],
      certifications: [],
      languages: [],
      experienceLevel: sanitizeText(parsedData.experienceLevel || "Not specified"),
      totalYearsExperience: sanitizeText(totalExperience.toString()),
      resumeText: sanitizeText(extractedText),
      parsedText: sanitizeText(extractedText),
      confidenceScore: 0.8,
      matchScore: 0,
      originalFileName: originalName,
      fileExtension: extension,
      fileSize: fileBuffer.byteLength,
      overallAssessment: "",
      recommendations: [],
      parsingMethod: "Regex",
      uploadedAt: new Date(uploadedAt).toISOString(),
      processingStartedAt: new Date().toISOString(),
      processingCompletedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in parseResumeText', { error, resumeId: id });
    throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Attempts to extract text from a PDF buffer using various methods
 * This is an improved implementation for extracting text from PDF buffers
 */
function extractTextFromPdfBuffer(buffer: Buffer): string {
  try {
    // Try to use pdf-parse if it's available
    let pdfText = "";
    try {
      // Dynamic import to handle the module not being found during type checking
      const pdfParse = require('pdf-parse');
      const data = pdfParse(buffer);
      
      if (data && typeof data.then === 'function') {
        // It's a Promise, wait for it to resolve
        data.then((result: any) => {
          if (result && result.text) {
            pdfText = result.text;
          }
        }).catch(() => {
          // Silently fail and continue with fallback methods
        });
      }
    } catch (e) {
      // If pdf-parse fails, continue with our fallback methods
      console.log("pdf-parse not available or failed, using fallback methods");
    }
    
    // If we got text from pdf-parse, return it
    if (pdfText && pdfText.length > 100) {
      return pdfText;
    }
    
    // Basic PDF text extraction based on pattern matching
    const pdfString = buffer.toString('binary');
    let extractedText = '';
    
    // Find text objects in the PDF (improved pattern matching)
    const textObjects = pdfString.match(/\((?:[^()\\]|\\[()]|\\\\|\\.)*\)/g) || [];
    
    // Process each text object
    for (const textObj of textObjects) {
      // Remove the parentheses and decode basic PDF character escapes
      let text = textObj.slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\')
        .replace(/\\(\d{3})/g, (match, octal) => {
          return String.fromCharCode(parseInt(octal, 8));
        });
        
      // Add to extracted text if it contains readable content
      if (/[a-zA-Z0-9]{2,}/.test(text)) {
        extractedText += text + ' ';
      }
    }
    
    // Try to extract Unicode text as well (common in newer PDFs)
    const unicodeMatches = pdfString.match(/<[0-9A-Fa-f]+>/g) || [];
    for (const match of unicodeMatches) {
      try {
        // Convert hex to text
        const hex = match.slice(1, -1);
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
          bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        const text = Buffer.from(bytes).toString('utf-8');
        if (/[a-zA-Z0-9]{2,}/.test(text)) {
          extractedText += text + ' ';
        }
      } catch (e) {
        // Ignore errors in Unicode extraction
      }
    }
    
    // Look for stream objects which may contain text
    const streamMatches = pdfString.match(/stream\s+([\s\S]*?)\s+endstream/g) || [];
    for (const streamData of streamMatches) {
      try {
        // Extract readable text from streams
        const textMatches = streamData.match(/[A-Za-z0-9\s.,;:'"!?@#$%^&*()[\]{}_+=<>/-]{4,}/g) || [];
        for (const text of textMatches) {
          if (/[a-zA-Z]{3,}/.test(text)) {
            extractedText += ' ' + text;
          }
        }
      } catch (e) {
        // Ignore errors in stream extraction
      }
    }
    
    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')       // Replace multiple spaces with a single space
      .replace(/(\w)\s+(?=[.,])/g, '$1') // Remove spaces before punctuation
      .trim();
    
    return extractedText;
  } catch (e) {
    console.error("Error in PDF text extraction:", e);
    return "";
  }
}

/**
 * Attempts to extract readable text from a binary buffer
 * Focuses on extracting English text patterns
 */
function extractReadableText(buffer: Buffer): string {
  // Convert to binary string 
  const binaryStr = buffer.toString('binary');
  
  // Look for sequences of printable ASCII characters (more flexible pattern)
  const textMatches = binaryStr.match(/[A-Za-z0-9\s.,;:'"!?@#$%^&*()[\]{}_+=<>/-]{4,}/g) || [];
  
  // Also look for email patterns specifically
  const emailMatches = binaryStr.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
  
  // Extract potential names (sequences of words starting with capital letters)
  const nameMatches = binaryStr.match(/(?:[A-Z][a-z]{1,20}\s+){1,4}/g) || [];
  
  // Join all matches with spaces and sanitize
  return sanitizeText([...textMatches, ...emailMatches, ...nameMatches].join(' '));
}

// Helper function to extract a name from a filename
function getNameFromFilename(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // Replace underscores and hyphens with spaces
  const nameWithSpaces = nameWithoutExt.replace(/[_-]/g, " ");
  
  // Capitalize first letter of each word
  return nameWithSpaces
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

async function parseWithOpenAI(text: string, fileName: string): Promise<ParsedResume> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  
  // Truncate text if too long
  const maxLength = 14000; // Adjust as needed for model limits
  const truncatedText = text.length > maxLength ? 
    text.substring(0, maxLength) + '...[text truncated due to length]' : 
    text;
  
  const prompt = `
  Extract structured information from the following resume text. 
  Return a JSON object with the following fields:
  - name: Full name of the candidate
  - email: Email address 
  - phone: Phone number
  - location: Location/address information
  - totalYearsExperience: Number of years of experience (approximate if not explicit)
  - skills: Array of technical and soft skills
  - experience: Array of work experiences, each with:
    - company: Company name
    - position: Job title
    - startDate: Start date (format as YYYY-MM or YYYY if only year is available)
    - endDate: End date (format as YYYY-MM, YYYY, or "Present")
    - description: Brief description of responsibilities
  - educationDetails: Array of education entries, each with:
    - institution: Name of school/university
    - degree: Degree obtained
    - fieldOfStudy: Major/field of study
    - startDate: Start date (format as YYYY-MM or YYYY)
    - endDate: End date (format as YYYY-MM or YYYY)
  - summary: Brief professional summary or objective

  Resume text:
  ${truncatedText}

  Name from filename (if needed): ${getNameFromFilename(fileName)}
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a resume parsing assistant that extracts structured information from resume text. Return only valid JSON without explanation."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  const responseContent = completion.choices[0].message.content;
  if (!responseContent) {
    throw new Error('Empty response from OpenAI');
  }

  try {
    const parsedData = JSON.parse(responseContent);
    
    // Process experience and education dates for consistency
    let processedExperience: ResumeExperience[] = [];
    if (parsedData.experience && Array.isArray(parsedData.experience)) {
      processedExperience = parsedData.experience.map((exp: any) => {
        return {
          company: exp.company || '',
          title: exp.position || '',
          duration: `${exp.startDate || ''} - ${exp.endDate || ''}`,
          description: exp.description || ''
        };
      });
    }

    let processedEducation: any[] = [];
    if (parsedData.educationDetails && Array.isArray(parsedData.educationDetails)) {
      processedEducation = parsedData.educationDetails.map((edu: any) => {
        return {
          ...edu,
          startDate: edu.startDate || '',
          endDate: edu.endDate || ''
        };
      });
    }

    // Ensure totalExperience is a number
    let expYears = 0;
    if (typeof parsedData.totalYearsExperience === 'string') {
      const match = parsedData.totalYearsExperience.match(/\d+(\.\d+)?/);
      expYears = match ? parseFloat(match[0]) : 0;
    } else if (typeof parsedData.totalYearsExperience === 'number') {
      expYears = parsedData.totalYearsExperience;
    }

    return {
      name: parsedData.name || getNameFromFilename(fileName) || 'Unknown',
      email: parsedData.email || '',
      phone: parsedData.phone || '',
      location: parsedData.location || '',
      title: '',
      summary: parsedData.summary || '',
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      experience: processedExperience,
      education: [],
      educationDetails: processedEducation,
      certifications: [],
      languages: [],
      experienceLevel: "Not specified",
      totalYearsExperience: expYears.toString(),
      resumeText: text,
      parsedText: text,
      confidenceScore: 0.9,
      matchScore: 0,
      originalFileName: fileName,
      fileExtension: '',
      fileSize: 0,
      overallAssessment: '',
      recommendations: [],
      parsingMethod: "OpenAI",
      uploadedAt: new Date().toISOString(),
      processingStartedAt: new Date().toISOString(),
      processingCompletedAt: new Date().toISOString()
    };
  } catch (error) {
    Logger.error('Error parsing OpenAI response', { error, response: responseContent });
    throw new Error(`Failed to parse OpenAI response: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Check if the text is suitable for processing
 * @param text The text to check
 * @returns Boolean indicating if the text is suitable
 */
function isValidText(text: unknown): boolean {
  if (typeof text !== 'string' || !text) return false;
  const trimmedText = text.trim();
  return trimmedText.length > 10;
}

/**
 * Extracts text from a DOCX buffer
 */
async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    // Try to use mammoth if available
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (e) {
      // Try docx-parser as fallback
      try {
        const DocxParser = require('docx-parser');
        return new Promise<string>((resolve, reject) => {
          try {
            DocxParser.parseDocx(buffer, (text: string) => {
              resolve(text || "");
            });
          } catch (err) {
            reject(err);
          }
        });
      } catch (e2) {
        console.error("Error with docx-parser:", e2);
        return fallbackDocxExtraction(buffer);
      }
    }
  } catch (e) {
    console.error("Error in DOCX text extraction:", e);
    return fallbackDocxExtraction(buffer);
  }
}

/**
 * Fallback method for extracting text from DOCX files
 */
function fallbackDocxExtraction(buffer: Buffer): string {
  try {
    // Convert buffer to string and look for text patterns
    const docxStr = buffer.toString('binary');
    let extractedText = '';
    
    // Extract words from the binary content (look for patterns in DOCX XML)
    const wordMatches = docxStr.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
    for (const match of wordMatches) {
      const textMatch = match.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
      if (textMatch && textMatch[1]) {
        extractedText += textMatch[1] + ' ';
      }
    }
    
    // Look for paragraphs
    const paraMatches = docxStr.match(/<w:p[^>]*>.*?<\/w:p>/g) || [];
    for (const para of paraMatches) {
      const textMatches = para.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      for (const match of textMatches) {
        const textMatch = match.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
        if (textMatch && textMatch[1]) {
          extractedText += textMatch[1] + ' ';
        }
      }
      extractedText += '\n';
    }
    
    return extractedText.trim();
  } catch (e) {
    console.error("Error in fallback DOCX extraction:", e);
    return "";
  }
}

/**
 * Uses DeepSeek to parse resume text
 */
export async function parseWithDeepSeek(text: string): Promise<ParsedResume> {
  console.log("Starting DeepSeek resume parsing");
  
  // Validate input text
  if (!isValidText(text)) {
    throw new Error("Invalid text input for DeepSeek parsing");
  }
  
  try {
    // Ensure text is reasonably sized
    let truncatedText = text;
    if (text.length > MAX_TEXT_LENGTH) {
      console.log(`Text too long for DeepSeek (${text.length}), truncating to ${MAX_TEXT_LENGTH} chars`);
      truncatedText = text.substring(0, MAX_TEXT_LENGTH);
    }
    
    // Prepare the prompt for DeepSeek
    const prompt = generateDeepSeekPrompt(truncatedText);
    
    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant for parsing resumes. Extract the structured information from the text provided." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });
    
    // Parse the response
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Invalid DeepSeek response", data);
      throw new Error("Invalid response from DeepSeek");
    }
    
    const assistantResponse = data.choices[0].message.content;
    
    // Try to extract JSON from the response
    const extractedJson = extractJsonFromString(assistantResponse);
    
    if (!extractedJson) {
      console.error("Failed to extract JSON from DeepSeek response");
      throw new Error("Failed to extract JSON from DeepSeek response");
    }
    
    // Sanitize and transform the parsed data
    const parsedResume = transformDeepSeekResponse(extractedJson, text);
    console.log("DeepSeek parsing complete");
    
    return parsedResume;
  } catch (error) {
    console.error("Error during DeepSeek parsing:", error);
    throw error;
  }
}

/**
 * Generate a prompt for DeepSeek to parse a resume
 */
function generateDeepSeekPrompt(text: string): string {
  // Extract filename from text metadata for use in the prompt
  let fileName = "resume";
  const filenameMatch = text.match(/Filename: ([^\n]+)/);
  if (filenameMatch && filenameMatch[1]) {
    fileName = filenameMatch[1];
  }
  
  return `
I need to extract structured information from this resume text. 
Focus ONLY on information that is explicitly present in the text - DO NOT invent or guess any information.

Resume Text:
${text}

Extract the following information in a clean JSON structure WITH THESE EXACT FIELDS:
- name: Full name of the candidate
- email: Email address
- phone: Phone number with country code if available
- location: City, State, or Country
- title: Current or most recent job title
- summary: Brief career summary or objective
- skills: Array of technical and soft skills (only include clearly stated skills)
- experience: Array of work experiences with:
  * company: Company name
  * title: Job title
  * startDate: Start date (in format MM/YYYY or YYYY)
  * endDate: End date or "Present" if current role
  * description: Job description or responsibilities
  * duration: Duration of this role (e.g., "2 years 3 months")
- education: Array of degrees or qualifications
- educationDetails: Array of education details with:
  * institution: School or university name
  * degree: Degree name
  * field: Field of study
  * startDate: Start date (YYYY format)
  * endDate: End date (YYYY format) or "Present"
  * year: Graduation year (YYYY format) - this is critical for compatibility
- certifications: Array of certifications
- languages: Array of languages
- experienceLevel: "Entry Level" (0-2 years), "Mid Level" (3-5 years), "Senior Level" (6-9 years), "Executive Level" (10+ years), or "Not specified"

IMPORTANT GUIDELINES:
1. If you find ABSOLUTELY NO information for a field, use empty strings for text fields or empty arrays for array fields. DO NOT make up information.
2. For the name field, use the filename or other context clues if the name isn't explicitly visible: ${getNameFromFilename(fileName)}
3. Format all dates consistently as MM/YYYY or YYYY. Use "Present" for current positions.
4. Keep skills as individual items without descriptions or proficiency levels.
5. For education details, ALWAYS include the "year" field even if you have to derive it from startDate/endDate.
6. Make sure each experience entry has BOTH a company and title field, even if brief.
7. The output must be a valid, properly formatted JSON object.

Return ONLY the JSON object with no additional text or explanations.`;
}

/**
 * Extract JSON from a string that might contain markdown or other text
 */
function extractJsonFromString(text: string): any {
  let jsonText = text.trim();
  
  // Try to extract JSON if it's wrapped in code blocks or has other text
  const jsonStartIndex = jsonText.indexOf("{");
  const jsonEndIndex = jsonText.lastIndexOf("}");
  
  if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
    jsonText = jsonText.substring(jsonStartIndex, jsonEndIndex + 1);
  } else if (jsonText.includes("```json")) {
    // Handle markdown code blocks
    jsonText = jsonText.split("```json")[1].split("```")[0].trim();
  } else if (jsonText.includes("```")) {
    // Handle generic code blocks
    jsonText = jsonText.split("```")[1].split("```")[0].trim();
  }

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Failed to parse JSON from response:", error);
    return null;
  }
}

/**
 * Transform the DeepSeek response into a standardized ParsedResume
 */
function transformDeepSeekResponse(parsedData: any, originalText: string): ParsedResume {
  // Calculate total experience
  let expYears = 0;
  if (parsedData.experience && Array.isArray(parsedData.experience)) {
    // Try to extract years from experience entries
    for (const exp of parsedData.experience) {
      const durationMatch = exp.duration?.match(/(\d+)\s*years?/i);
      if (durationMatch && durationMatch[1]) {
        expYears += parseInt(durationMatch[1]);
      }
    }
  }
  
  if (expYears === 0 && parsedData.experienceLevel) {
    // Estimate from experience level
    if (parsedData.experienceLevel === "Entry Level") expYears = 1;
    else if (parsedData.experienceLevel === "Mid Level") expYears = 4;
    else if (parsedData.experienceLevel === "Senior Level") expYears = 8;
    else if (parsedData.experienceLevel === "Executive Level") expYears = 12;
  }
  
  // Extract filename from text metadata
  let fileName = "resume";
  const filenameMatch = originalText.match(/Filename: ([^\n]+)/);
  if (filenameMatch && filenameMatch[1]) {
    fileName = filenameMatch[1];
  }
  
  // Process experience entries
  const processedExperience: ResumeExperience[] = 
    (parsedData.experience || []).map((exp: any) => ({
      company: sanitizeText(exp.company || ""),
      title: sanitizeText(exp.title || ""),
      duration: sanitizeText(exp.duration || ""),
      description: sanitizeText(exp.description || ""),
      startDate: sanitizeText(exp.startDate || ""),
      endDate: sanitizeText(exp.endDate || "")
    }));

  // Process education details
  const processedEducation: ResumeEducation[] = 
    (parsedData.educationDetails || []).map((edu: any) => ({
      institution: sanitizeText(edu.institution || ""),
      degree: sanitizeText(edu.degree || ""),
      year: sanitizeText(edu.year || ""),
      field: sanitizeText(edu.field || ""),
      startDate: sanitizeText(edu.startDate || ""),
      endDate: sanitizeText(edu.endDate || "")
    }));

  return {
    name: sanitizeText(parsedData.name) || getNameFromFilename(fileName) || "Unknown",
    email: sanitizeText(parsedData.email) || "",
    phone: sanitizeText(parsedData.phone) || "",
    location: sanitizeText(parsedData.location) || "",
    title: sanitizeText(parsedData.title) || "",
    summary: sanitizeText(parsedData.summary) || "",
    skills: sanitizeArray(parsedData.skills || []),
    experience: processedExperience,
    education: sanitizeArray(parsedData.education || []),
    educationDetails: processedEducation,
    certifications: sanitizeArray(parsedData.certifications || []),
    languages: sanitizeArray(parsedData.languages || []),
    experienceLevel: sanitizeText(parsedData.experienceLevel || "Not specified"),
    totalYearsExperience: expYears.toString(),
    resumeText: sanitizeText(originalText),
    parsedText: sanitizeText(originalText),
    confidenceScore: 0.9,
    matchScore: 0,
    originalFileName: fileName,
    fileExtension: '',
    fileSize: 0,
    overallAssessment: '',
    recommendations: [],
    parsingMethod: "DeepSeek",
    uploadedAt: new Date().toISOString(),
    processingStartedAt: new Date().toISOString(),
    processingCompletedAt: new Date().toISOString()
  };
} 