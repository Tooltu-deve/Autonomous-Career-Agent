import { MasterProfileData } from '@/types/profile';

export const MOCK_PROFILE_DATA: MasterProfileData = {
  id: '24127489',
  name: 'Minh Tran',
  headline: 'Computer Science Senior @ HCMUS · AI & Backend Engineer',
  location: 'TP. Hồ Chí Minh',
  institution: 'Đại học Khoa Học Tự Nhiên',
  email: 'minh.tran@hcmus.edu.vn',
  avatarInitials: 'MT',
  completionPercent: 95,
  atsScorePercent: 95,
  summary:
    'Sinh viên năm cuối ngành Khoa Học Máy Tính (HCMUS) với định hướng trở thành AI Engineer / Backend Developer. Có nền tảng toán học & giải thuật vững chắc, kinh nghiệm thực chiến phát triển các giải pháp LLM Workflows, RAG Architecture và RESTful Backend Microservices (FastAPI, Python, SQL). Đã có kinh nghiệm làm việc thực tế tại các công ty công nghệ và mong muốn đóng góp vào các dự án AI quy mô lớn.',
  experiences: [
    {
      id: 'exp-1',
      role: 'AI Developer Intern',
      company: 'VNG Corporation · R&D Center',
      period: '6/2025 – Hiện tại (8 tháng)',
      location: 'TP. Hồ Chí Minh',
      bullets: [
        'Nghiên cứu và phát triển AI Agent tự động hóa xử lý tài liệu doanh nghiệp sử dụng LangChain và OpenAI API.',
        'Tối ưu hóa hệ thống RAG (Retrieval-Augmented Generation) giảm độ trễ phản hồi từ 4.2s xuống 1.5s.',
        'Xây dựng Async API Service bằng FastAPI và Qdrant Vector Database.',
      ],
      tags: ['Python', 'FastAPI', 'LangChain', 'VectorDB'],
      logoText: 'VNG',
      logoBg: '#FCE8E6',
      logoColor: '#E5544F',
    },
    {
      id: 'exp-2',
      role: 'Backend Engineer Intern',
      company: 'FPT Software',
      period: '12/2024 – 5/2025 (6 tháng)',
      location: 'TP. Hồ Chí Minh',
      bullets: [
        'Tham gia phát triển các API microservices xử lý dữ liệu người dùng cho dự án thị trường Nhật Bản.',
        'Tối ưu hóa câu truy vấn PostgreSQL giúp cải thiện 30% thời gian phản hồi cho các báo cáo dữ liệu lớn.',
      ],
      tags: ['Python', 'PostgreSQL', 'Docker'],
      logoText: 'FPT',
      logoBg: '#EAF0FC',
      logoColor: '#4573D2',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'CareerNav AI Agent',
      description:
        'Hệ thống AI Agent tự động tìm kiếm công việc, chấm điểm ATS và tailoring CV tự động dựa trên RAG architecture.',
      tags: ['Python', 'RAG', 'LLM'],
    },
    {
      id: 'proj-2',
      title: 'Smart Traffic Cam Analysis',
      description:
        'Ứng dụng Computer Vision đếm mật độ giao thông real-time từ camera giao thông sử dụng YOLOv8 & OpenCV.',
      tags: ['PyTorch', 'YOLOv8', 'OpenCV'],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Cử nhân Khoa Học Máy Tính',
      institution: 'Đại học Khoa Học Tự Nhiên — ĐHQG TP.HCM',
      period: '2022 – 2026 (Dự kiến tốt nghiệp T9/2026)',
      details: 'GPA: 3.65 / 4.0 (Giỏi)',
      icon: '🎓',
    },
  ],
  skills: [
    {
      title: 'Chuyên môn cao (Expert)',
      level: 'expert',
      skills: ['Python', 'FastAPI', 'SQL / Postgres', 'Git & GitHub'],
    },
    {
      title: 'Thành thạo (Advanced)',
      level: 'advanced',
      skills: ['LangChain', 'RAG System', 'Docker', 'RESTful API', 'C++'],
    },
    {
      title: 'Ngoại ngữ',
      level: 'normal',
      skills: ['Tiếng Anh (TOEIC 850)', 'Tiếng Việt (Mẹ đẻ)'],
    },
  ],
  preferences: {
    targetRole: 'AI Developer / Backend',
    workType: 'Hybrid / Remote',
    salaryExpectation: '25M – 35M ₫',
    location: 'TP. Hồ Chí Minh',
  },
};
