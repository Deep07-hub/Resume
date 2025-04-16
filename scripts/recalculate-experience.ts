import { PrismaClient } from '@prisma/client';
import type { Experience } from '@/types/resume';
import { calculateTotalExperience } from '@/lib/resume-parser';

const prisma = new PrismaClient();

// Function to update the total experience for a specific resume
async function updateResumeExperience(name: string) {
  try {
    console.log(`Looking for resume with name containing: "${name}"`);
    
    // Find the resume by name
    const resume = await prisma.resume.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });

    if (!resume) {
      console.error(`Resume for ${name} not found`);
      return;
    }

    console.log(`Found resume: ${resume.name} (ID: ${resume.id})`);
    console.log(`Current total experience: ${resume.totalExperience}`);
    
    // Recalculate the total experience
    const totalExperience = calculateTotalExperience(resume.experience as unknown as Experience[]);
    console.log(`Newly calculated total experience: ${totalExperience}`);
    
    // Update the resume with the new total experience
    const updatedResume = await prisma.resume.update({
      where: { id: resume.id },
      data: { totalExperience },
    });
    
    console.log(`Updated resume with new total experience: ${updatedResume.totalExperience}`);
  } catch (error) {
    console.error('Error updating resume experience:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Update Lais Mendonça's resume
updateResumeExperience('Lais Mendonça')
  .then(() => console.log('Done'))
  .catch(console.error); 