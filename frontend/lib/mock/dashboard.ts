/**
 * Mock data for Dashboard page.
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
      jobTitle: 'AI Developer',
      company: 'VNG',
      location: 'Hồ Chí Minh',
      applicationStatus: 'not_applied',
    },
    {
      id: 'saved-2',
      jobTitle: 'Data Analyst',
      company: 'Tiki',
      location: 'Remote',
      applicationStatus: 'not_applied',
    },
    {
      id: 'saved-3',
      jobTitle: 'Backend Engineer',
      company: 'MoMo',
      location: 'Hồ Chí Minh',
      applicationStatus: 'not_applied',
    },
    {
      id: 'saved-4',
      jobTitle: 'DevOps Engineer',
      company: 'Zalo',
      location: 'Hồ Chí Minh',
      applicationStatus: 'not_applied',
    },
  ],
  applied: [
    {
      id: 'applied-1',
      jobTitle: 'Python Backend',
      company: 'Axon Active',
      location: 'Đà Nẵng',
      applicationStatus: 'pending',
    },
    {
      id: 'applied-2',
      jobTitle: 'Frontend Developer',
      company: 'Shopee',
      location: 'Hồ Chí Minh',
      applicationStatus: 'under_review',
    },
    {
      id: 'applied-3',
      jobTitle: 'QA Engineer',
      company: 'Grab',
      location: 'Hà Nội',
      applicationStatus: 'pending',
    },
    {
      id: 'applied-4',
      jobTitle: 'Full Stack Developer',
      company: 'KMS Technology',
      location: 'Hồ Chí Minh',
      applicationStatus: 'under_review',
    },
    {
      id: 'applied-5',
      jobTitle: 'Cloud Engineer',
      company: 'FPT',
      location: 'Remote',
      applicationStatus: 'pending',
    },
  ],
  interviewing: [
    {
      id: 'interview-1',
      jobTitle: 'ML Engineer Intern',
      company: 'FPT Software',
      location: 'Hà Nội',
      applicationStatus: 'scheduled',
      interviewDate: '2026-07-14',
    },
    {
      id: 'interview-2',
      jobTitle: 'Product Analyst',
      company: 'VNPay',
      location: 'Hồ Chí Minh',
      applicationStatus: 'final_round',
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
