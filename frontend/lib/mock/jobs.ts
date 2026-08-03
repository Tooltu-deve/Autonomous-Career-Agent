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
    location: 'TP. Hồ Chí Minh',
    address: '182 Lê Đại Hành, Quận 11, TP.HCM',
    salary: '30M – 45M ₫',
    format: 'hybrid',
    match: 94,
    stage: 'saved',
    isSaved: true,
    postedAgo: '1 giờ trước',
    deadlineDays: 14,
    tags: ['Python', 'LangChain', 'FastAPI', 'Agentic AI'],
    skills: ['Python', 'LangChain', 'FastAPI', 'Docker', 'PostgreSQL', 'Vector DB'],
    matchedSkills: ['Python', 'LangChain', 'FastAPI', 'Git', 'REST API'],
    missingSkills: ['Docker', 'VectorDB (Qdrant)'],
    description: `
      <p>VNG đang tìm kiếm <strong>AI Developer / LLM Engineer</strong> nhiệt huyết để gia nhập đội ngũ R&D AI, trực tiếp xây dựng hệ thống AI Agent thế hệ mới.</p>
      <br/>
      <h4>Trách nhiệm công việc:</h4>
      <ul>
        <li>Nghiên cứu và triển khai các mô hình Large Language Models (LLMs), RAG &amp; Agentic Workflows.</li>
        <li>Xây dựng Backend REST API hiệu năng cao với Python &amp; FastAPI.</li>
        <li>Tối ưu hóa vector search và lưu trữ tri thức doanh nghiệp.</li>
      </ul>
      <br/>
      <h4>Yêu cầu ứng viên:</h4>
      <ul>
        <li>Tốt nghiệp hoặc sinh viên năm cuối chuyên ngành Khoa học Máy tính / CNTT.</li>
        <li>Thành thạo Python, kinh nghiệm với LangChain/LlamaIndex hoặc các AI Frameworks.</li>
        <li>Tư duy thuật toán tốt, chủ động học hỏi công nghệ mới.</li>
      </ul>
    `,
    aiSummary: 'Lập trình viên Computer Science có kinh nghiệm thiết kế AI Agentic Workflows và làm việc với Python, FastAPI, LangChain. Sẵn sàng đóng góp vào hệ thống AI Agent tại VNG Corporation.',
  },
  {
    id: 2,
    title: 'Backend Engineer (Python / FastAPI)',
    company: 'MoMo (M-Service)',
    tagline: 'Fintech & Digital Wallet',
    logoText: 'MM',
    logoBg: 'linear-gradient(135deg, #A50064, #D82D8B)',
    location: 'TP. Hồ Chí Minh',
    address: 'MoMo Tower, Cộng Hòa, Tân Bình, TP.HCM',
    salary: '25M – 38M ₫',
    format: 'onsite',
    match: 89,
    stage: 'applied',
    isSaved: false,
    postedAgo: '3 giờ trước',
    deadlineDays: 10,
    tags: ['Python', 'FastAPI', 'Microservices', 'PostgreSQL'],
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Kafka', 'Docker'],
    matchedSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Git'],
    missingSkills: ['Redis Cache', 'Kafka'],
    description: `
      <p>MoMo tuyển dụng <strong>Backend Engineer</strong> tham gia xây dựng hệ thống microservices có độ tin cậy và hiệu năng cao cho hàng triệu người dùng.</p>
      <br/>
      <h4>Trách nhiệm công việc:</h4>
      <ul>
        <li>Phát triển các tính năng thanh toán cốt lõi sử dụng Python &amp; FastAPI.</li>
        <li>Thiết kế cơ sở dữ liệu PostgreSQL chuẩn hóa, xử lý giao dịch tải cao.</li>
      </ul>
    `,
    aiSummary: 'Sinh viên Computer Science có nền tảng Python vững chắc, kinh nghiệm xây dựng REST API bằng FastAPI và làm việc với PostgreSQL.',
  },
  {
    id: 3,
    title: 'Data Analyst / Product Analyst',
    company: 'Tiki Vietnam',
    tagline: 'E-commerce',
    logoText: 'TK',
    logoBg: 'linear-gradient(135deg, #1A94FF, #0D5CB6)',
    location: 'Remote',
    address: 'Làm việc từ xa — toàn quốc',
    salary: '20M – 30M ₫',
    format: 'remote',
    match: 82,
    stage: 'none',
    isSaved: true,
    postedAgo: '5 giờ trước',
    deadlineDays: 8,
    tags: ['SQL', 'Python', 'Power BI', 'A/B Testing'],
    skills: ['SQL', 'Python', 'Power BI', 'Tableau', 'BigQuery'],
    matchedSkills: ['SQL', 'Python', 'Power BI'],
    missingSkills: ['Tableau', 'BigQuery'],
    description: `
      <p>Tiki đang mở rộng đội ngũ Data &amp; Product Analytics. Bạn sẽ biến dữ liệu thô thành các quyết định kinh doanh đột phá.</p>
    `,
    aiSummary: 'Có kinh nghiệm truy vấn SQL và trực quan hóa dữ liệu bằng Power BI, cùng nền tảng Python cho phân tích.',
  },
  {
    id: 4,
    title: 'Machine Learning Intern / Fresher',
    company: 'FPT Software',
    tagline: 'AI & Software Outsourcing',
    logoText: 'FPT',
    logoBg: 'linear-gradient(135deg, #F36F21, #BA4A00)',
    location: 'TP. Hồ Chí Minh',
    address: 'Lô T2, Khu Công nghệ cao, TP. Thủ Đức, TP.HCM',
    salary: '12M – 18M ₫',
    format: 'hybrid',
    match: 95,
    stage: 'interview',
    isSaved: false,
    postedAgo: '1 ngày trước',
    deadlineDays: 20,
    tags: ['Python', 'C++', 'PyTorch', 'Computer Vision'],
    skills: ['Python', 'C++', 'PyTorch', 'OpenCV', 'Linear Algebra'],
    matchedSkills: ['Python', 'C++', 'AI / Algorithm', 'First-Order Logic'],
    missingSkills: ['OpenCV'],
    description: `
      <p>FPT Software tuyển dụng <strong>ML Intern / Fresher</strong> xuất sắc, làm việc trực tiếp với các chuyên gia AI hàng đầu.</p>
    `,
    aiSummary: 'Sinh viên năm cuối ngành Khoa học Máy tính / Khoa học Dữ liệu có nền tảng Toán, Thuật toán và Lập trình C++/Python vững chắc. Thành thạo PyTorch.',
  },
];
