import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Create job descriptions
  const jobDescriptions = [
    {
      id: uuidv4(),
      title: 'Full Stack Developer',
      description: `We are looking for a Full Stack Developer with experience in modern web technologies. 
      The ideal candidate will have strong knowledge of JavaScript/TypeScript, React, and Node.js. 
      This role involves developing both frontend and backend components for our web applications.`,
      requiredSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL'],
      preferredSkills: ['Next.js', 'GraphQL', 'Docker', 'AWS'],
      experienceLevel: 'Mid Level',
      educationRequirements: ['Bachelor\'s in Computer Science or related field'],
      department: 'Engineering',
      location: 'Remote'
    },
    {
      id: uuidv4(),
      title: 'Data Scientist',
      description: `We're seeking a Data Scientist to join our analytics team. 
      The successful candidate will analyze large datasets and build predictive models to help drive business decisions. 
      Experience with machine learning, statistical analysis, and data visualization is required.`,
      requiredSkills: ['Python', 'Machine Learning', 'SQL', 'Data Analysis'],
      preferredSkills: ['TensorFlow', 'PyTorch', 'R', 'Tableau'],
      experienceLevel: 'Senior',
      educationRequirements: ['Master\'s in Data Science, Statistics, or related field'],
      department: 'Data',
      location: 'Hybrid'
    },
    {
      id: uuidv4(),
      title: 'DevOps Engineer',
      description: `We are looking for a DevOps Engineer to help us build and maintain our cloud infrastructure. 
      The ideal candidate will have experience with containerization, CI/CD pipelines, and infrastructure as code. 
      This role will focus on automation, monitoring, and optimizing deployment workflows.`,
      requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'],
      preferredSkills: ['Terraform', 'Ansible', 'Prometheus', 'ELK Stack'],
      experienceLevel: 'Mid Level',
      educationRequirements: ['Bachelor\'s in Computer Science or equivalent experience'],
      department: 'Infrastructure',
      location: 'Remote'
    }
  ];

  for (const jobDescription of jobDescriptions) {
    await prisma.jobDescription.create({
      data: jobDescription
    }).catch(e => {
      console.error(`Failed to create job description "${jobDescription.title}":`, e);
    });
  }

  console.log('Database has been seeded with job descriptions');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 