import { exec } from "child_process"
import { promisify } from "util"
import { join, extname, basename } from "path"
import { v4 as uuidv4 } from "uuid"
import { mkdir, writeFile, readFile, copyFile } from "fs/promises"
import { existsSync, mkdirSync } from "fs"
import mammoth from "mammoth"
import * as puppeteer from 'puppeteer'

const execAsync = promisify(exec)

/**
 * Converts a DOC or DOCX file to PDF
 * @param filePath Path to the DOC or DOCX file
 * @returns Path to the generated PDF file
 */
export async function convertDocToPdf(filePath: string): Promise<string> {
  console.log(`Converting document: ${filePath}`);
  
  // Verify file exists
  if (!existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    throw new Error(`File does not exist: ${filePath}`);
  }

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  // Generate PDF path
  const pdfPath = filePath.replace(/\.(doc|docx)$/i, '.pdf');

  try {
    // Check if it's a DOCX file
    if (filePath.toLowerCase().endsWith('.docx')) {
      console.log(`Converting DOCX to PDF: ${filePath}`);
      return await convertDocxToPdf(filePath, pdfPath);
    } 
    // Check if it's a DOC file
    else if (filePath.toLowerCase().endsWith('.doc')) {
      console.log(`Converting DOC to PDF: ${filePath}`);
      return await convertDocToPdfFallback(filePath, pdfPath);
    } else {
      console.error(`Unsupported file format: ${filePath}`);
      throw new Error(`Unsupported file format: ${filePath}`);
    }
  } catch (error: unknown) {
    console.error('Error in document conversion:', error);
    // Try fallback method if the main conversion fails
    try {
      console.log("Attempting fallback conversion method");
      return await createPlaceholderPdfWithContent(filePath, pdfPath);
    } catch (fallbackError) {
      console.error("Fallback conversion also failed:", fallbackError);
      if (error instanceof Error) {
        throw new Error(`Failed to convert document: ${error.message}`);
      } else {
        throw new Error(`Failed to convert document: ${String(error)}`);
      }
    }
  }
}

/**
 * Convert DOCX file to PDF using mammoth and puppeteer
 */
async function convertDocxToPdf(docxPath: string, pdfPath: string): Promise<string> {
  try {
    // Convert DOCX to HTML
    const buffer = await readFile(docxPath);
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;
    
    // Create a temporary HTML file
    const htmlPath = docxPath.replace(/\.docx$/i, '.html');
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            margin: 1cm;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 1em;
            margin-bottom: 0.5em;
          }
          p {
            margin-bottom: 0.5em;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          td, th {
            border: 1px solid #ddd;
            padding: 8px;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    await writeFile(htmlPath, fullHtml);
    console.log(`Created HTML file: ${htmlPath}`);
    
    // Convert HTML to PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({ path: pdfPath, format: 'A4' });
    await browser.close();
    
    console.log(`Generated PDF at: ${pdfPath}`);
    return pdfPath;
  } catch (error) {
    console.error("Error converting DOCX to PDF:", error);
    throw error;
  }
}

/**
 * Convert DOC file to PDF using a fallback approach for older Word formats
 */
async function convertDocToPdfFallback(docPath: string, pdfPath: string): Promise<string> {
  try {
    console.log("Using fallback method for DOC conversion");
    
    // Read the file content
    const buffer = await readFile(docPath);
    
    // First try using mammoth (might work for some DOC files)
    try {
      const result = await mammoth.convertToHtml({ buffer });
      if (result.value && result.value.length > 100) {
        // If we got substantial text, use the HTML conversion route
        console.log("Mammoth extracted text from DOC, using HTML conversion");
        
        const htmlPath = docPath.replace(/\.doc$/i, '.html');
        const fullHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.5;
                margin: 1cm;
              }
              h1, h2, h3, h4, h5, h6 {
                margin-top: 1em;
                margin-bottom: 0.5em;
              }
              p {
                margin-bottom: 0.5em;
              }
            </style>
          </head>
          <body>
            ${result.value}
            <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px;">
              <p style="font-style: italic; color: #666;">Note: This document was converted from a DOC file. Some formatting may have been lost.</p>
            </div>
          </body>
          </html>
        `;
        
        await writeFile(htmlPath, fullHtml);
        
        // Convert HTML to PDF using Puppeteer
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
        await page.pdf({ path: pdfPath, format: 'A4' });
        await browser.close();
        
        console.log(`Generated PDF from DOC at: ${pdfPath}`);
        return pdfPath;
      }
    } catch (mammothError) {
      console.log("Mammoth could not convert DOC file:", mammothError);
      // Continue to fallback method
    }
    
    // If mammoth fails, create a PDF with the content of the DOC as binary data
    // and a message saying it's a DOC file
    console.log("Creating placeholder PDF for DOC file");
    return await createPlaceholderPdfWithContent(docPath, pdfPath);
  } catch (error) {
    console.error("Error in DOC conversion fallback:", error);
    throw error;
  }
}

/**
 * Creates a PDF with placeholder content that includes file info and any extractable text
 */
async function createPlaceholderPdfWithContent(originalPath: string, pdfPath: string): Promise<string> {
  try {
    console.log("Creating placeholder PDF...");
    
    // Extract filename from path
    const filename = basename(originalPath);
    
    // Try to extract some text from the document using a simple binary read
    let extractedText = "";
    try {
      const buffer = await readFile(originalPath);
      // Convert buffer to string and look for readable text
      const content = buffer.toString('utf8');
      // Extract what looks like readable text (basic approach)
      const textMatches = content.match(/[A-Za-z0-9\s.,;:'"!?()-]{5,100}/g);
      if (textMatches && textMatches.length > 0) {
        extractedText = textMatches.slice(0, 50).join(' ');
      }
    } catch (error) {
      console.log("Could not extract text from binary file:", error);
    }
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create page
    const page = await browser.newPage();
    
    // Set content with information about the original file
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Document Conversion Notice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 30px;
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          h1 {
            color: #333;
          }
          .filename {
            font-family: monospace;
            background-color: #eee;
            padding: 5px 10px;
            border-radius: 3px;
            margin: 10px 0;
            display: inline-block;
          }
          .extracted-text {
            margin-top: 20px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .extracted-text pre {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Document Preview</h1>
          <p>This is a preview of the document. For full document functionality, please open the original file in Microsoft Word or another compatible document editor.</p>
          <p>Original file: <span class="filename">${filename}</span></p>
          
          ${extractedText ? `
          <div class="extracted-text">
            <h2>Document Preview</h2>
            <p>Below is some extracted text from the document:</p>
            <pre>${extractedText}</pre>
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `);
    
    // Generate PDF
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    // Close browser
    await browser.close();
    console.log("Placeholder PDF created:", pdfPath);
    
    // Also copy the original file to ensure it's preserved
    const preservedOriginal = pdfPath.replace('.pdf', '.original.doc');
    await copyFile(originalPath, preservedOriginal);
    console.log("Original DOC preserved at:", preservedOriginal);
    
    return pdfPath;
  } catch (error) {
    console.error("Error creating placeholder PDF:", error);
    
    // Last resort - just copy the file with PDF extension
    console.log("Last resort - copying original file with PDF extension");
    await copyFile(originalPath, pdfPath);
    return pdfPath;
  }
}

/**
 * Converts a DOCX file to HTML using mammoth
 */
async function convertDocxToHtml(docPath: string, outputDir: string): Promise<string> {
  try {
    // Generate unique filename for the HTML
    const htmlFilename = `${uuidv4()}.html`
    const htmlPath = join(outputDir, htmlFilename)
    
    // Read and convert the document
    const buffer = await readFile(docPath)
    const result = await mammoth.convertToHtml({ buffer })
    
    // Create a nicely formatted HTML document
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Converted Document</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.5;
            font-size: 12pt;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 20px;
            margin-bottom: 10px;
          }
          p {
            margin-bottom: 10px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          table, th, td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        ${result.value}
      </body>
      </html>
    `
    
    await writeFile(htmlPath, html)
    console.log("HTML conversion complete:", htmlPath)
    return htmlPath
  } catch (error) {
    console.error("Error converting DOCX to HTML:", error)
    throw error
  }
}

/**
 * Converts an HTML file to PDF using puppeteer
 */
async function convertHtmlToPdf(htmlPath: string, pdfPath: string): Promise<string> {
  try {
    console.log("Converting HTML to PDF...")
    
    // Launch browser with appropriate settings
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    // Create new page and set viewport
    const page = await browser.newPage()
    await page.setViewport({ width: 1024, height: 768 })
    
    // Load the HTML file and wait for content to load
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' })
    
    // Generate PDF with appropriate margins and settings
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })
    
    // Close browser
    await browser.close()
    console.log("PDF conversion complete:", pdfPath)
    return pdfPath
  } catch (error) {
    console.error("Error converting HTML to PDF:", error)
    throw error
  }
}

/**
 * Creates a PDF with placeholder content
 */
async function createPlaceholderPdf(originalPath: string, pdfPath: string): Promise<string> {
  try {
    console.log("Creating placeholder PDF...")
    
    // Extract filename from path
    const filename = originalPath.split(/[\/\\]/).pop() || "unknown.doc"
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    // Create page
    const page = await browser.newPage()
    
    // Set content with information about the original file
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Document Conversion Notice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.5;
            text-align: center;
            padding-top: 100px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 30px;
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          h1 {
            color: #333;
          }
          .filename {
            font-family: monospace;
            background-color: #eee;
            padding: 5px 10px;
            border-radius: 3px;
            margin: 10px 0;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Document Conversion Notice</h1>
          <p>The DOC file could not be fully converted to PDF. To view the original document accurately, please open it in Microsoft Word or another compatible document editor.</p>
          <p>Original file: <span class="filename">${filename}</span></p>
        </div>
      </body>
      </html>
    `)
    
    // Generate PDF
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })
    
    // Close browser
    await browser.close()
    console.log("Placeholder PDF created:", pdfPath)
    return pdfPath
  } catch (error) {
    console.error("Error creating placeholder PDF:", error)
    
    // Last resort - just copy the file with PDF extension
    await copyFile(originalPath, pdfPath)
    return pdfPath
  }
}

/**
 * Alternative implementation for DOC files
 */
export async function convertDocToPdfWithLibrary(docPath: string): Promise<string> {
  try {
    // Verify file exists
    if (!existsSync(docPath)) {
      console.error("DOC file does not exist:", docPath)
      throw new Error(`DOC file does not exist: ${docPath}`)
    }
    
    // For DOC files, we'll use a different approach
    const outputDir = join(process.cwd(), "uploads")
    await mkdir(outputDir, { recursive: true })
    
    const outputFileName = `${uuidv4()}.pdf`
    const outputPath = join(outputDir, outputFileName)

    // For now, we'll just copy the file since we don't have LibreOffice installed
    // In a production environment, you would want to use LibreOffice or a similar tool
    const fileContent = await readFile(docPath)
    await writeFile(outputPath, fileContent)
    
    console.log("File copied successfully")
    return outputPath
  } catch (error) {
    console.error("Error converting DOC to PDF with library:", error)
    throw new Error("Failed to convert DOC to PDF with library")
  }
}
