import type { ResumeData, SavedJob } from "@/components/resume-workbench/types.ts"

export const savedJobs: SavedJob[] = [
  {
    id: "job-1",
    title: "Senior Frontend Developer",
    company: "Northstar Labs",
    location: "Toronto, ON",
    posted: "2 days ago",
    salary: "$140k - $165k",
    employmentType: "Hybrid",
    summary:
      "Seeking a frontend engineer who can turn complex product workflows into polished, high-conversion interfaces using React, TypeScript, and design systems.",
    url: "https://jobs.example.com/northstar-senior-frontend",
    saved: true,
  },
  {
    id: "job-2",
    title: "Product Engineer",
    company: "Arc Studio",
    location: "Remote",
    posted: "5 days ago",
    salary: "$125k - $150k",
    employmentType: "Remote",
    summary:
      "Looking for a product-minded engineer comfortable owning UX details, shipping quickly, and collaborating deeply with design and growth teams.",
    url: "https://jobs.example.com/arc-product-engineer",
    saved: true,
  },
  {
    id: "job-3",
    title: "React Developer",
    company: "Clearpath Health",
    location: "New York, NY",
    posted: "1 week ago",
    salary: "$118k - $136k",
    employmentType: "On-site",
    summary:
      "Join a healthcare platform modernizing patient-facing tools with accessible, performant React experiences and measurable product improvements.",
    url: "https://jobs.example.com/clearpath-react",
    saved: true,
  },
  {
    id: "job-4",
    title: "UI Engineer",
    company: "Atlas Commerce",
    location: "Austin, TX",
    posted: "3 days ago",
    salary: "$132k - $148k",
    employmentType: "Hybrid",
    summary:
      "Build reusable UI foundations, collaborate with brand design, and elevate a commerce product with motion, responsiveness, and maintainable patterns.",
    url: "https://jobs.example.com/atlas-ui-engineer",
    saved: false,
  },
]

export const initialResumeData: ResumeData = {
  name: "",
  email: "",
  phone: "",
  github: "",
  linkedin: "",
  position: "Senior Frontend Engineer",
  summary:
    "Frontend engineer with 6+ years of experience translating product strategy into refined, accessible interfaces. I partner closely with design, write maintainable TypeScript, and ship features that improve activation and retention.",
  targetPosition: savedJobs[0].title,
  targetCompany: savedJobs[0].company,
  jobPostingLink: savedJobs[0].url,
  aiJobSummary: savedJobs[0].summary,
  experiences: [
    {
      id: "experience-1",
      company: "Lumen Digital",
      duration: "Jan 2021 - Present",
      points: [
        {
          id: "point-1",
          text: "Led a redesign of the self-serve onboarding flow, increasing completion rate by 18% while reducing support tickets.",
        },
        {
          id: "point-2",
          text: "Built shared React and Tailwind primitives that reduced duplicate UI code across three teams.",
        },
      ],
    },
    {
      id: "experience-2",
      company: "Nova Commerce",
      duration: "May 2019 - Dec 2020",
      points: [
        {
          id: "point-3",
          text: "Owned storefront performance initiatives that cut median page load time from 3.8s to 2.1s.",
        },
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "University of Waterloo",
      degree: "B.S. in Computer Science",
      year: "2019",
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "Hiring Funnel Dashboard",
      description:
        "Created a React dashboard for recruiting operations with actionable conversion insights and recruiter-friendly filters.",
    },
  ],
  skillTypes: [
    {
      id: "skill-type-1",
      name: "Frontend",
      skills: ["React", "TypeScript", "Tailwind CSS", "Accessibility"],
    },
    {
      id: "skill-type-2",
      name: "Product & Collaboration",
      skills: ["Design Systems", "Experimentation"],
    },
  ],
}
