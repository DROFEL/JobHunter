import type { ProfileSettingsDTO } from "@/api/schemas/profileSettings.ts"
import type { SavedJobDTO } from "@/api/schemas/savedJob.ts"
import type { ResumeTemplateDTO } from "@/api/schemas/resumeTemplate.ts"

// In-memory store — this is the single source of mock data for the entire app.
// MSW handlers read and mutate these objects; React Query keeps the UI in sync.
export const db: { jobs: SavedJobDTO[]; profile: ProfileSettingsDTO; templates: ResumeTemplateDTO[] } = {
  profile: {
    profile: {
      name: "",
      email: "",
      phone: "",
      github: "",
      linkedin: "",
    },
    education: [
      {
        id: "edu-1",
        school: "York University",
        degree: "BSc Computer Science",
        year: "Expected August 2026",
      },
    ],
    skillPool: [
      "React",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "Accessibility",
      "Node.js",
      "Design Systems",
      "Testing",
      "Git",
    ],
    languages: [],
    experienceContext: "",
    applicationContext: "",
  },

  jobs: [
    {
      id: "job-1",
      title: "Senior Frontend Developer",
      company: "Northstar Labs",
      location: "Toronto, ON",
      posted: "2 days ago",
      salary: "$140k - $150k",
      employmentType: "Hybrid",
      summary:
        "Seeking a frontend engineer who can turn complex product workflows into polished, high-conversion interfaces using React, TypeScript, and design systems.",
      url: "https://jobs.example.com/northstar-senior-frontend",
      saved: true,
      status: "Applied",
      resume: {
        position: "Senior Frontend Engineer",
        summary:
          "Frontend engineer with 6+ years of experience translating product strategy into refined, accessible interfaces. I partner closely with design, write maintainable TypeScript, and ship features that improve activation and retention.",
        targetPosition: "Senior Frontend Developer",
        targetCompany: "Northstar Labs",
        jobPostingLink: "https://jobs.example.com/northstar-senior-frontend",
        aiJobSummary:
          "Seeking a frontend engineer who can turn complex product workflows into polished, high-conversion interfaces using React, TypeScript, and design systems.",
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
        enabledLanguageIds: [],
      },
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
      status: "Found",
      resume: {
        position: "",
        summary: "",
        targetPosition: "Product Engineer",
        targetCompany: "Arc Studio",
        jobPostingLink: "https://jobs.example.com/arc-product-engineer",
        aiJobSummary:
          "Looking for a product-minded engineer comfortable owning UX details, shipping quickly, and collaborating deeply with design and growth teams.",
        experiences: [],
        projects: [],
        skillTypes: [],
        enabledLanguageIds: [],
      },
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
      status: "Interview",
      resume: {
        position: "",
        summary: "",
        targetPosition: "React Developer",
        targetCompany: "Clearpath Health",
        jobPostingLink: "https://jobs.example.com/clearpath-react",
        aiJobSummary:
          "Join a healthcare platform modernizing patient-facing tools with accessible, performant React experiences and measurable product improvements.",
        experiences: [],
        projects: [],
        skillTypes: [],
        enabledLanguageIds: [],
      },
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
      status: "Found",
      resume: {
        position: "",
        summary: "",
        targetPosition: "UI Engineer",
        targetCompany: "Atlas Commerce",
        jobPostingLink: "https://jobs.example.com/atlas-ui-engineer",
        aiJobSummary:
          "Build reusable UI foundations, collaborate with brand design, and elevate a commerce product with motion, responsiveness, and maintainable patterns.",
        experiences: [],
        projects: [],
        skillTypes: [],
        enabledLanguageIds: [],
      },
    },
  ],

  templates: [
    {
      id: "template-1",
      name: "Senior Frontend Engineer",
      data: {
        position: "Senior Frontend Engineer",
        summary:
          "Frontend engineer with 6+ years of experience translating product strategy into refined, accessible interfaces. I partner closely with design, write maintainable TypeScript, and ship features that improve activation and retention.",
        targetPosition: "",
        targetCompany: "",
        jobPostingLink: "",
        aiJobSummary: "",
        experiences: [
          {
            id: "experience-1",
            company: "Lumen Digital",
            duration: "Jan 2021 - Present",
            points: [
              { id: "point-1", text: "Led a redesign of the self-serve onboarding flow, increasing completion rate by 18% while reducing support tickets." },
              { id: "point-2", text: "Built shared React and Tailwind primitives that reduced duplicate UI code across three teams." },
            ],
          },
          {
            id: "experience-2",
            company: "Nova Commerce",
            duration: "May 2019 - Dec 2020",
            points: [
              { id: "point-3", text: "Owned storefront performance initiatives that cut median page load time from 3.8s to 2.1s." },
            ],
          },
        ],
        projects: [
          {
            id: "project-1",
            name: "Hiring Funnel Dashboard",
            description: "Created a React dashboard for recruiting operations with actionable conversion insights and recruiter-friendly filters.",
          },
        ],
        skillTypes: [
          { id: "skill-type-1", name: "Frontend", skills: ["React", "TypeScript", "Tailwind CSS", "Accessibility"] },
          { id: "skill-type-2", name: "Product & Collaboration", skills: ["Design Systems", "Experimentation"] },
        ],
        enabledLanguageIds: [],
      },
    },
    {
      id: "template-2",
      name: "Full Stack Engineer",
      data: {
        position: "Full Stack Engineer",
        summary:
          "Full stack engineer comfortable across the entire web stack — from API design to React interfaces. I enjoy building systems that are both robust and delightful to use.",
        targetPosition: "",
        targetCompany: "",
        jobPostingLink: "",
        aiJobSummary: "",
        experiences: [
          {
            id: "exp-fs-1",
            company: "Lumen Digital",
            duration: "Jan 2021 - Present",
            points: [
              { id: "pt-fs-1", text: "Designed and shipped a multi-tenant billing API handling 50k+ transactions per month." },
              { id: "pt-fs-2", text: "Built responsive React dashboards backed by FastAPI services, reducing operational overhead for the support team." },
            ],
          },
        ],
        projects: [],
        skillTypes: [
          { id: "st-fs-1", name: "Frontend", skills: ["React", "TypeScript", "Tailwind CSS"] },
          { id: "st-fs-2", name: "Backend", skills: ["Node.js", "Python", "PostgreSQL"] },
        ],
        enabledLanguageIds: [],
      },
    },
  ],
}
