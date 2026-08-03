/**
 * Mock job data for Job Radar page.
 * Shapes match expected backend response — swap data source without touching UI.
 * TODO (Phase 2): Replace with GET /jobs?match=true when backend is ready.
 */
import type { Job } from '@/types/jobs';

export const INITIAL_JOBS: Job[] = [
  {
    id: 1,
    title: 'AI Developer / LLM Engineer',
    company: 'VNG Corporation',
    tagline: 'Internet & Technology',
    logoText: 'VNG',
    logoBg: 'linear-gradient(135deg, #F06A6A, #E5544F)',
    location: 'Ho Chi Minh City',
    address: '182 Le Dai Hanh, District 11, HCMC',
    salary: '$1,200 – $1,800 / mo',
    format: 'hybrid',
    match: 94,
    stage: 'saved',
    isSaved: true,
    postedAgo: '1 hour ago',
    deadlineDays: 14,
    tags: ['Python', 'LangChain', 'FastAPI', 'Agentic AI'],
    skills: ['Python', 'LangChain', 'FastAPI', 'Docker', 'PostgreSQL', 'Vector DB'],
    matchedSkills: ['Python', 'LangChain', 'FastAPI', 'Git', 'REST API'],
    missingSkills: ['Docker', 'VectorDB (Qdrant)'],
    description: `
      <p>VNG is seeking a passionate <strong>AI Developer / LLM Engineer</strong> to join the AI R&D team and directly build next-generation AI Agent systems.</p>
      <br/>
      <h4>Responsibilities:</h4>
      <ul>
        <li>Research and implement Large Language Models (LLMs), RAG &amp; Agentic Workflows.</li>
        <li>Build high-performance REST APIs with Python &amp; FastAPI.</li>
        <li>Optimize vector search and enterprise knowledge storage.</li>
      </ul>
      <br/>
      <h4>Requirements:</h4>
      <ul>
        <li>Graduated or final-year student in Computer Science / IT.</li>
        <li>Proficient in Python, experience with LangChain/LlamaIndex or AI Frameworks.</li>
        <li>Strong algorithmic thinking, proactive in learning new technologies.</li>
      </ul>
    `,
    aiSummary: 'Computer Science developer experienced in designing AI Agentic Workflows and working with Python, FastAPI, and LangChain. Ready to contribute to VNG Corporation\'s AI Agent systems.',
  },
  {
    id: 2,
    title: 'Backend Engineer (Python / FastAPI)',
    company: 'MoMo (M-Service)',
    tagline: 'Fintech & Digital Wallet',
    logoText: 'MM',
    logoBg: 'linear-gradient(135deg, #A50064, #D82D8B)',
    location: 'Ho Chi Minh City',
    address: 'MoMo Tower, Cong Hoa, Tan Binh, HCMC',
    salary: '$1,000 – $1,500 / mo',
    format: 'onsite',
    match: 89,
    stage: 'applied',
    isSaved: false,
    postedAgo: '3 hours ago',
    deadlineDays: 10,
    tags: ['Python', 'FastAPI', 'Microservices', 'PostgreSQL'],
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Kafka', 'Docker'],
    matchedSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Git'],
    missingSkills: ['Redis Cache', 'Kafka'],
    description: `
      <p>MoMo is hiring a <strong>Backend Engineer</strong> to help build highly reliable, high-performance microservices for millions of users.</p>
      <br/>
      <h4>Responsibilities:</h4>
      <ul>
        <li>Develop core payment features using Python &amp; FastAPI.</li>
        <li>Design normalized PostgreSQL databases capable of handling high-load transactions.</li>
      </ul>
    `,
    aiSummary: 'Computer Science student with a solid Python foundation, experienced in building REST APIs with FastAPI and working with PostgreSQL.',
  },
  {
    id: 3,
    title: 'Data Analyst / Product Analyst',
    company: 'Tiki Vietnam',
    tagline: 'E-commerce',
    logoText: 'TK',
    logoBg: 'linear-gradient(135deg, #1A94FF, #0D5CB6)',
    location: 'Remote',
    address: 'Fully remote — nationwide',
    salary: '$800 – $1,200 / mo',
    format: 'remote',
    match: 82,
    stage: 'none',
    isSaved: true,
    postedAgo: '5 hours ago',
    deadlineDays: 8,
    tags: ['SQL', 'Python', 'Power BI', 'A/B Testing'],
    skills: ['SQL', 'Python', 'Power BI', 'Tableau', 'BigQuery'],
    matchedSkills: ['SQL', 'Python', 'Power BI'],
    missingSkills: ['Tableau', 'BigQuery'],
    description: `
      <p>Tiki is expanding its Data &amp; Product Analytics team. You will turn raw data into breakthrough business decisions.</p>
    `,
    aiSummary: 'Experienced in SQL querying and data visualization with Power BI, with a Python foundation for analysis.',
  },
  {
    id: 4,
    title: 'Machine Learning Intern / Fresher',
    company: 'FPT Software',
    tagline: 'AI & Software Outsourcing',
    logoText: 'FPT',
    logoBg: 'linear-gradient(135deg, #F36F21, #BA4A00)',
    location: 'Ho Chi Minh City',
    address: 'Lot T2, Hi-Tech Park, Thu Duc City, HCMC',
    salary: '$500 – $750 / mo',
    format: 'hybrid',
    match: 95,
    stage: 'interview',
    isSaved: false,
    postedAgo: '1 day ago',
    deadlineDays: 20,
    tags: ['Python', 'C++', 'PyTorch', 'Computer Vision'],
    skills: ['Python', 'C++', 'PyTorch', 'OpenCV', 'Linear Algebra'],
    matchedSkills: ['Python', 'C++', 'AI / Algorithm', 'First-Order Logic'],
    missingSkills: ['OpenCV'],
    description: `
      <p>FPT Software is hiring outstanding <strong>ML Intern / Freshers</strong> to work directly with leading AI experts.</p>
    `,
    aiSummary: 'Final-year Computer Science / Data Science student with a solid foundation in Mathematics, Algorithms, and C++/Python programming. Proficient with PyTorch.',
  },
];
