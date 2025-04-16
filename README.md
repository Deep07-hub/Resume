---
title: Resume Parser & Analyzer
emoji: 📄
colorFrom: blue
colorTo: indigo
sdk: docker
sdk_version: 3.0.0
app_file: app.py
pinned: false
---

# Resume Parser & Analyzer

A modern web application for parsing, analyzing, and matching resumes against job descriptions.

## Features

- **Resume Parsing**: Upload PDF, DOC, or DOCX files and extract structured information
- **Experience Calculation**: Automatically calculates total work experience from resume content
- **Resume Matching**: Match resumes against job descriptions to find the best candidates
- **Dashboard**: Modern UI for managing and analyzing parsed resumes
- **Filtering**: Filter resumes by skills, experience, education, and status

## Technologies

- Next.js
- React
- Prisma (PostgreSQL)
- TypeScript
- Tailwind CSS
- Shadcn UI

## Usage

1. Upload resumes through the dashboard
2. View parsed resume data with extracted information
3. Match resumes against job descriptions
4. Manage candidates with status tracking

## Note for Hugging Face Space Users

This application requires a PostgreSQL database to function properly. If you're using this Space, you may need to configure the database connection in the Space settings.

## Local Development

To run this project locally:

1. Clone the repository
2. Install dependencies with `pnpm install`
3. Set up a PostgreSQL database and update the `.env` file
4. Run the development server with `pnpm dev`

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference 