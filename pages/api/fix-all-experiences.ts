import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { Experience } from '@/types/resume';
import { calculateTotalExperience } from '@/lib/resume-parser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all resumes
    const resumes = await db.resume.findMany();
    
    console.log(`Found ${resumes.length} resumes to process`);
    const results = [];

    // Process each resume
    for (const resume of resumes) {
      console.log(`\n===== Processing resume: ${resume.name} (ID: ${resume.id}) =====`);
      console.log(`Current experience: ${resume.totalExperience || 'not set'}`);

      try {
        // Recalculate experience
        const totalExperience = calculateTotalExperience(resume.experience as unknown as Experience[]);
        
        if (resume.totalExperience !== totalExperience) {
          // Update the resume
          const updatedResume = await db.resume.update({
            where: { id: resume.id },
            data: { totalExperience }
          });
          
          results.push({
            id: resume.id,
            name: resume.name,
            previous: resume.totalExperience || 'not set',
            current: updatedResume.totalExperience,
            changed: true
          });
          
          console.log(`Updated experience: ${resume.totalExperience || 'not set'} → ${totalExperience}`);
        } else {
          results.push({
            id: resume.id,
            name: resume.name,
            experience: resume.totalExperience,
            changed: false
          });
          
          console.log(`Experience unchanged: ${totalExperience}`);
        }
      } catch (error) {
        console.error(`Error processing resume ${resume.id}:`, error);
        results.push({
          id: resume.id,
          name: resume.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${resumes.length} resumes`,
      results
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process resumes',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 