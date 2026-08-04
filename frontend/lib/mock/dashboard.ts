/**
 * Mock data for Dashboard / Applications page.
 * All shapes match backend response schemas — swap data source without touching UI.
 * TODO (Giai đoạn 2): Replace with real API calls when backend services are ready.
 */
import type { DashboardStats, PipelineData, Recommendation } from '@/types/dashboard';

// ---------------------------------------------------------------------------
// Metric Cards — TODO: replace with GET /reports/stats
// ---------------------------------------------------------------------------
export const MOCK_STATS: DashboardStats = {
  avgAtsScore: 84,
  atsTrend: 6,
  tailoredCvCount: 14,
  totalApplied: 32,
  interviewsScheduled: 4,
};

// ---------------------------------------------------------------------------
// Application Pipeline — TODO: replace with GET /applications?groupBy=status
// ---------------------------------------------------------------------------
export const MOCK_PIPELINE: PipelineData = {
  saved: [
    {
      id: 'saved-1',
      jobTitle: 'Senior AI Engineer',
      company: 'VNG',
      location: 'Hà Nội',
      logoColor: '#f06a6a',
      logoLetter: 'V',
      applicationStatus: 'not_applied',
      atsScore: 92,
      cvLabel: '+ Create CV',
      dateLabel: 'Saved 1 day ago',
    },
    {
      id: 'saved-2',
      jobTitle: 'Backend Engineer',
      company: 'Shopee',
      location: 'TP.HCM',
      logoColor: '#4573d2',
      logoLetter: 'S',
      applicationStatus: 'not_applied',
      atsScore: 74,
      cvLabel: '+ Create CV',
      dateLabel: 'Saved 2 days ago',
    },
    {
      id: 'saved-3',
      jobTitle: 'ML Engineer',
      company: 'Grab',
      location: 'Remote',
      logoColor: '#9d7ad9',
      logoLetter: 'G',
      applicationStatus: 'not_applied',
      atsScore: 81,
      cvLabel: 'Existing CV →',
      dateLabel: 'Saved 3 days ago',
    },
  ],
  applied: [
    {
      id: 'applied-1',
      jobTitle: 'Backend Engineer',
      company: 'MoMo',
      location: 'TP.HCM',
      logoColor: '#d0327d',
      logoLetter: 'M',
      applicationStatus: 'pending',
      atsScore: 85,
      cvLabel: 'View CV →',
      dateLabel: 'Applied 4 days ago',
    },
    {
      id: 'applied-2',
      jobTitle: 'Data Engineer',
      company: 'Techcombank',
      location: 'Hà Nội',
      logoColor: '#1a94d6',
      logoLetter: 'T',
      applicationStatus: 'under_review',
      atsScore: 88,
      cvLabel: 'View CV →',
      dateLabel: 'Applied 6 days ago',
    },
  ],
  interviewing: [
    {
      id: 'interview-1',
      jobTitle: 'AI Developer',
      company: 'VNG',
      location: 'Hà Nội',
      logoColor: '#f06a6a',
      logoLetter: 'V',
      applicationStatus: 'scheduled',
      interviewDate: '2026-08-08',
      atsScore: 78,
      cvLabel: 'View CV →',
      dateLabel: 'Round 2 · 8 Aug',
    },
  ],
  offer: [
    {
      id: 'offer-1',
      jobTitle: 'Backend Engineer',
      company: 'FPT Software',
      location: 'Hà Nội',
      logoColor: '#f26e21',
      logoLetter: 'F',
      applicationStatus: 'offer',
      atsScore: 90,
      cvLabel: 'View CV →',
      dateLabel: 'Offer 1 day ago',
    },
  ],
  rejected: [
    {
      id: 'rejected-1',
      jobTitle: 'Data Analyst',
      company: 'Tiki',
      location: 'TP.HCM',
      logoColor: '#1a94d6',
      logoLetter: 'T',
      applicationStatus: 'rejected',
      atsScore: 58,
      cvLabel: 'View CV →',
      dateLabel: 'Rejected 5 days ago',
    },
  ],
};

// ---------------------------------------------------------------------------
// AI Recommendations — TODO: replace with GET /reports/recommendations
// ---------------------------------------------------------------------------
export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-1',
    type: 'warning',
    title: 'Thiếu kỹ năng quan trọng',
    body: '3 vị trí đang nhắm tới yêu cầu <b>Docker / CI-CD</b> nhưng chưa có trong profile của bạn.',
    actionLabel: 'Thêm kỹ năng',
    actionHref: '/profile-setup',
  },
  {
    id: 'rec-2',
    type: 'action',
    title: 'Cập nhật Master Profile',
    body: 'Thêm dự án gần nhất để các CV tailored luôn dùng thông tin mới nhất.',
    actionLabel: 'Cập nhật profile',
    actionHref: '/profile-setup',
  },
  {
    id: 'rec-3',
    type: 'info',
    title: 'ATS Score tăng 6%',
    body: 'CV của bạn đang cải thiện. Tiếp tục tối ưu từ khoá cho từng vị trí để tăng thêm.',
    actionLabel: 'Xem chi tiết',
    actionHref: '/jobs',
  },
];
