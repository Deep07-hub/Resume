import type { Resume } from "@/types/resume"

export const mockResumes: Resume[] = [
  {
    id: "1",
    name: "Alex Johnson",
    title: "Senior Frontend Developer",
    email: "alex.johnson@example.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    summary:
      "Experienced frontend developer with 6+ years of experience building responsive and accessible web applications. Specialized in React and TypeScript with a focus on performance optimization and component design systems.",
    skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Redux", "Jest", "Webpack"],
    experience: [
      {
        title: "Senior Frontend Developer",
        company: "TechCorp Inc.",
        duration: "2020 - Present",
        description:
          "Lead developer for the company's main product dashboard. Implemented a component library that reduced development time by 40%. Mentored junior developers and conducted code reviews.",
      },
      {
        title: "Frontend Developer",
        company: "WebSolutions LLC",
        duration: "2017 - 2020",
        description:
          "Developed and maintained multiple client websites. Improved site performance by 30% through code optimization and modern build tools.",
      },
    ],
    education: ["Bachelor's", "Master's"],
    educationDetails: [
      {
        degree: "Master's in Computer Science",
        institution: "Stanford University",
        year: "2017",
      },
      {
        degree: "Bachelor's in Software Engineering",
        institution: "UC Berkeley",
        year: "2015",
      },
    ],
    certifications: ["AWS Certified Developer", "Google Cloud Professional"],
    languages: ["English", "Spanish"],
    experienceLevel: "Senior",
    status: "Shortlisted",
  },
  {
    id: "2",
    name: "Samantha Lee",
    title: "Full Stack Developer",
    email: "samantha.lee@example.com",
    phone: "(555) 987-6543",
    location: "New York, NY",
    summary:
      "Full stack developer with 4 years of experience building web applications with React, Node.js, and MongoDB. Strong focus on creating clean, maintainable code and delivering exceptional user experiences.",
    skills: ["React", "Node.js", "JavaScript", "MongoDB", "Express", "GraphQL", "CSS", "Git"],
    experience: [
      {
        title: "Full Stack Developer",
        company: "InnovateTech",
        duration: "2019 - Present",
        description:
          "Developed and maintained multiple client-facing applications. Implemented new features and optimized existing codebase for better performance.",
      },
      {
        title: "Junior Web Developer",
        company: "Digital Solutions",
        duration: "2017 - 2019",
        description:
          "Assisted in the development of web applications. Collaborated with designers to implement UI/UX designs.",
      },
    ],
    education: ["Bachelor's"],
    educationDetails: [
      {
        degree: "Bachelor's in Computer Science",
        institution: "NYU",
        year: "2017",
      },
    ],
    certifications: ["MongoDB Certified Developer"],
    languages: ["English", "Korean"],
    experienceLevel: "Mid Level",
    status: "Reviewed",
  },
  {
    id: "3",
    name: "Michael Rodriguez",
    title: "Backend Developer",
    email: "michael.r@example.com",
    phone: "(555) 234-5678",
    location: "Austin, TX",
    summary:
      "Backend developer specializing in Python and Django with 3 years of experience. Passionate about building scalable and efficient server-side applications.",
    skills: ["Python", "Django", "Flask", "SQL", "PostgreSQL", "Docker", "AWS", "Redis"],
    experience: [
      {
        title: "Backend Developer",
        company: "DataSystems Inc.",
        duration: "2020 - Present",
        description:
          "Designed and implemented RESTful APIs. Optimized database queries resulting in 50% faster response times.",
      },
      {
        title: "Junior Python Developer",
        company: "TechStart",
        duration: "2018 - 2020",
        description:
          "Developed internal tools and scripts to automate processes. Contributed to the company's main product backend.",
      },
    ],
    education: ["Bachelor's"],
    educationDetails: [
      {
        degree: "Bachelor's in Computer Engineering",
        institution: "University of Texas",
        year: "2018",
      },
    ],
    certifications: ["AWS Certified Solutions Architect"],
    languages: ["English", "Spanish"],
    experienceLevel: "Mid Level",
    status: "New",
  },
  {
    id: "4",
    name: "Emily Chen",
    title: "UX/UI Designer",
    email: "emily.chen@example.com",
    phone: "(555) 345-6789",
    location: "Seattle, WA",
    summary:
      "Creative UX/UI designer with 5 years of experience creating user-centered designs for web and mobile applications. Skilled in user research, wireframing, and prototyping.",
    skills: ["Figma", "Adobe XD", "Sketch", "User Research", "Wireframing", "Prototyping", "HTML", "CSS"],
    experience: [
      {
        title: "Senior UX/UI Designer",
        company: "DesignHub",
        duration: "2021 - Present",
        description:
          "Lead designer for multiple client projects. Conducted user research and usability testing to inform design decisions.",
      },
      {
        title: "UX Designer",
        company: "CreativeSolutions",
        duration: "2018 - 2021",
        description:
          "Created wireframes, prototypes, and high-fidelity designs for web and mobile applications. Collaborated closely with development teams.",
      },
    ],
    education: ["Bachelor's", "Master's"],
    educationDetails: [
      {
        degree: "Master's in Human-Computer Interaction",
        institution: "University of Washington",
        year: "2018",
      },
      {
        degree: "Bachelor's in Graphic Design",
        institution: "Rhode Island School of Design",
        year: "2016",
      },
    ],
    certifications: ["Certified User Experience Professional"],
    languages: ["English", "Mandarin"],
    experienceLevel: "Senior",
    status: "Shortlisted",
  },
  {
    id: "5",
    name: "David Wilson",
    title: "DevOps Engineer",
    email: "david.w@example.com",
    phone: "(555) 456-7890",
    location: "Chicago, IL",
    summary:
      "DevOps engineer with 4+ years of experience in CI/CD pipeline implementation, infrastructure automation, and cloud services. Strong background in AWS and Kubernetes.",
    skills: ["AWS", "Kubernetes", "Docker", "Jenkins", "Terraform", "Linux", "Python", "Bash"],
    experience: [
      {
        title: "DevOps Engineer",
        company: "CloudTech Solutions",
        duration: "2019 - Present",
        description:
          "Implemented and maintained CI/CD pipelines. Managed cloud infrastructure and optimized deployment processes.",
      },
      {
        title: "Systems Administrator",
        company: "TechSupport Inc.",
        duration: "2017 - 2019",
        description:
          "Managed on-premise servers and network infrastructure. Assisted in the migration to cloud services.",
      },
    ],
    education: ["Bachelor's"],
    educationDetails: [
      {
        degree: "Bachelor's in Information Technology",
        institution: "University of Illinois",
        year: "2017",
      },
    ],
    certifications: ["AWS Certified DevOps Engineer", "Certified Kubernetes Administrator"],
    languages: ["English"],
    experienceLevel: "Mid Level",
    status: "New",
  },
  {
    id: "6",
    name: "Olivia Martinez",
    title: "Data Scientist",
    email: "olivia.m@example.com",
    phone: "(555) 567-8901",
    location: "Boston, MA",
    summary:
      "Data scientist with expertise in machine learning, statistical analysis, and data visualization. 3 years of experience working with large datasets and developing predictive models.",
    skills: ["Python", "R", "SQL", "Machine Learning", "TensorFlow", "Pandas", "NumPy", "Tableau"],
    experience: [
      {
        title: "Data Scientist",
        company: "AnalyticsPro",
        duration: "2020 - Present",
        description:
          "Developed machine learning models for customer segmentation and churn prediction. Created data visualizations to communicate insights to stakeholders.",
      },
      {
        title: "Data Analyst",
        company: "DataInsights",
        duration: "2018 - 2020",
        description:
          "Analyzed customer data to identify trends and patterns. Generated reports and dashboards for executive team.",
      },
    ],
    education: ["Master's", "PhD"],
    educationDetails: [
      {
        degree: "Master's in Data Science",
        institution: "MIT",
        year: "2018",
      },
      {
        degree: "Bachelor's in Statistics",
        institution: "Boston University",
        year: "2016",
      },
    ],
    certifications: ["TensorFlow Developer Certificate", "IBM Data Science Professional"],
    languages: ["English", "Portuguese"],
    experienceLevel: "Mid Level",
    status: "Reviewed",
  },
  {
    id: "7",
    name: "James Taylor",
    title: "Mobile Developer",
    email: "james.t@example.com",
    phone: "(555) 678-9012",
    location: "Portland, OR",
    summary:
      "Mobile developer with 5+ years of experience in iOS and Android development. Proficient in Swift, Kotlin, and React Native for cross-platform applications.",
    skills: ["Swift", "Kotlin", "React Native", "Java", "JavaScript", "Firebase", "Git", "XCode"],
    experience: [
      {
        title: "Senior Mobile Developer",
        company: "AppWorks",
        duration: "2019 - Present",
        description:
          "Lead developer for multiple iOS and Android applications. Implemented new features and improved app performance.",
      },
      {
        title: "iOS Developer",
        company: "MobileTech",
        duration: "2016 - 2019",
        description:
          "Developed and maintained iOS applications. Collaborated with design and backend teams to implement new features.",
      },
    ],
    education: ["Bachelor's"],
    educationDetails: [
      {
        degree: "Bachelor's in Computer Science",
        institution: "Oregon State University",
        year: "2016",
      },
    ],
    certifications: ["Apple Certified iOS Developer"],
    languages: ["English"],
    experienceLevel: "Senior",
    status: "Rejected",
  },
  {
    id: "8",
    name: "Sophia Kim",
    title: "QA Engineer",
    email: "sophia.k@example.com",
    phone: "(555) 789-0123",
    location: "Denver, CO",
    summary:
      "QA engineer with 3 years of experience in manual and automated testing. Skilled in test planning, execution, and defect tracking to ensure high-quality software releases.",
    skills: ["Selenium", "Cypress", "JavaScript", "JIRA", "TestRail", "API Testing", "SQL", "Agile"],
    experience: [
      {
        title: "QA Engineer",
        company: "QualityTech",
        duration: "2020 - Present",
        description:
          "Developed and executed test plans for web applications. Implemented automated testing frameworks to improve test coverage.",
      },
      {
        title: "Junior QA Tester",
        company: "SoftwareSolutions",
        duration: "2018 - 2020",
        description:
          "Performed manual testing of web and mobile applications. Documented and tracked defects using JIRA.",
      },
    ],
    education: ["Bachelor's"],
    educationDetails: [
      {
        degree: "Bachelor's in Information Systems",
        institution: "University of Colorado",
        year: "2018",
      },
    ],
    certifications: ["ISTQB Certified Tester"],
    languages: ["English", "Korean"],
    experienceLevel: "Mid Level",
    status: "New",
  },
]
