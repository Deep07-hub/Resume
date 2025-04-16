-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "pdfPath" TEXT,
    "extractedText" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "title" TEXT,
    "summary" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "education" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "educationDetails" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceLevel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "matchScore" INTEGER,
    "matchedSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "missingSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceMatch" INTEGER,
    "educationMatch" INTEGER,
    "overallAssessment" TEXT,
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStartedAt" TIMESTAMP(3),
    "processingCompletedAt" TIMESTAMP(3),

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceLevel" TEXT,
    "educationRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "department" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Resume_status_idx" ON "Resume"("status");

-- CreateIndex
CREATE INDEX "Resume_skills_idx" ON "Resume"("skills");

-- CreateIndex
CREATE INDEX "Resume_experienceLevel_idx" ON "Resume"("experienceLevel");

-- CreateIndex
CREATE INDEX "JobDescription_requiredSkills_idx" ON "JobDescription"("requiredSkills");

-- CreateIndex
CREATE INDEX "JobDescription_experienceLevel_idx" ON "JobDescription"("experienceLevel");
