import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

// vi.mock được hoist lên đầu file, nên mọi thứ nó dùng phải khai báo trong
// vi.hoisted — biến const thường sẽ chưa khởi tạo tại thời điểm mock chạy.
const { router, putProfile, getProfile, getPreferences, MockApiError } =
  vi.hoisted(() => {
    class MockApiError extends Error {
      status: number;
      constructor(status: number, message = "err") {
        super(message);
        this.status = status;
      }
    }
    return {
      // Phải là object ỔN ĐỊNH: hook có useEffect với dep [router]. Trả về
      // object mới mỗi render sẽ làm effect chạy lại vô hạn.
      router: { push: vi.fn(), replace: vi.fn() },
      putProfile: vi.fn(),
      getProfile: vi.fn(),
      getPreferences: vi.fn(),
      MockApiError,
    };
  });

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/lib/api", () => ({
  ApiError: MockApiError,
  getToken: () => "token",
  putProfile,
  getProfile,
  getPreferences,
}));

import { useProfileSetup } from "../_hooks/useProfileSetup";
import type { ProfileResponse } from "@/types/api";

/** Wizard trống như của user vừa đăng ký, phone sai định dạng. */
async function mountWithBadPhone() {
  // Chưa có profile trên server -> wizard giữ state rỗng.
  getProfile.mockRejectedValue(new MockApiError(404));
  getPreferences.mockRejectedValue(new MockApiError(404));
  putProfile.mockResolvedValue({});

  const view = renderHook(() => useProfileSetup());
  await waitFor(() => expect(getProfile).toHaveBeenCalled());

  act(() => {
    view.result.current.setData((d) => ({ ...d, phone: "0901234567" }));
  });
  return view;
}

/** Wizard trống, phone hợp lệ — dùng cho các test cần save thành công. */
async function mountWithValidPhone() {
  getProfile.mockRejectedValue(new MockApiError(404));
  getPreferences.mockRejectedValue(new MockApiError(404));
  putProfile.mockResolvedValue({});

  const view = renderHook(() => useProfileSetup());
  await waitFor(() => expect(getProfile).toHaveBeenCalled());

  act(() => {
    view.result.current.setData((d) => ({ ...d, phone: "+84 901 234 567" }));
  });
  return view;
}

/** Profile tối thiểu từ server, override từng phần theo test. */
function makeProfile(
  overrides: Partial<ProfileResponse> = {},
): ProfileResponse {
  return {
    id: "profile-1",
    user_id: "user-1",
    headline: null,
    summary: null,
    location: null,
    phone: null,
    github_url: null,
    linkedin_url: null,
    preferred_template: "classic",
    experiences: [],
    educations: [],
    certifications: [],
    skills: [],
    ...overrides,
  };
}

/** Wizard nạp một profile có sẵn từ server (getProfile resolve thay vì 404). */
async function mountWithProfile(profile: ProfileResponse) {
  getProfile.mockResolvedValue(profile);
  getPreferences.mockRejectedValue(new MockApiError(404));
  putProfile.mockResolvedValue({});

  const view = renderHook(() => useProfileSetup());
  await waitFor(() => expect(getProfile).toHaveBeenCalled());
  return view;
}

/** Wizard với phone hợp lệ nhưng một dòng chứng chỉ có tên mà thiếu tháng/năm. */
async function mountWithBadCertification() {
  const view = await mountWithValidPhone();

  act(() => {
    view.result.current.setData((d) => ({
      ...d,
      certifications: [
        {
          id: "cert-bad",
          title: "AWS Certified Developer",
          month: "",
          year: "",
        },
      ],
    }));
  });
  return view;
}

beforeEach(() => {
  vi.clearAllMocks();
  // goToStep gọi window.scrollTo — jsdom chưa cài đặt hàm này.
  vi.stubGlobal("scrollTo", vi.fn());
});

describe("useProfileSetup — Skip vs Complete", () => {
  it("Skip lưu được dù phone sai định dạng", async () => {
    const { result } = await mountWithBadPhone();

    act(() => {
      result.current.skipAndFinish();
    });

    await waitFor(() => expect(putProfile).toHaveBeenCalledTimes(1));
    expect(result.current.errors).toEqual({});
  });

  it("Complete thì chặn lại và báo lỗi phone", async () => {
    const { result } = await mountWithBadPhone();

    act(() => {
      result.current.completeSetup();
    });

    await waitFor(() => expect(result.current.errors.phone).toBeDefined());
    expect(putProfile).not.toHaveBeenCalled();
    expect(result.current.step).toBe(1);
  });

  it("Complete lưu được khi phone hợp lệ", async () => {
    const { result } = await mountWithBadPhone();

    act(() => {
      result.current.setData((d) => ({ ...d, phone: "+84 901 234 567" }));
    });
    act(() => {
      result.current.completeSetup();
    });

    await waitFor(() => expect(putProfile).toHaveBeenCalledTimes(1));
    expect(result.current.errors).toEqual({});
  });
});

describe("useProfileSetup — toProfileUpdate certification shape", () => {
  it("gửi certifications đúng shape, lọc dòng trống, display_order liền mạch từ mảng đã lọc", async () => {
    const { result } = await mountWithValidPhone();

    act(() => {
      result.current.setData((d) => ({
        ...d,
        certifications: [
          // Dòng trống hoàn toàn — phải bị lọc bỏ, không tính vào display_order.
          { id: "blank", title: "", month: "", year: "" },
          {
            id: "cert-1",
            title: "  Zzyzx Certified Cloud Wizard  ",
            month: "05",
            year: "2024",
          },
          {
            id: "cert-2",
            title: "Quixotic Blockchain Specialist",
            month: "01",
            year: "2020",
          },
        ],
      }));
    });

    act(() => {
      result.current.completeSetup();
    });

    await waitFor(() => expect(putProfile).toHaveBeenCalledTimes(1));
    const body = putProfile.mock.calls[0][0];

    expect(body.certifications).toEqual([
      {
        title: "Zzyzx Certified Cloud Wizard",
        obtain_date: "2024-05-01",
        display_order: 0,
      },
      {
        title: "Quixotic Blockchain Specialist",
        obtain_date: "2020-01-01",
        display_order: 1,
      },
    ]);
  });
});

describe("useProfileSetup — chứng chỉ thiếu tháng/năm", () => {
  it("Complete thì chặn lại, báo lỗi certifications và nhảy về step 2", async () => {
    const { result } = await mountWithBadCertification();

    act(() => {
      result.current.completeSetup();
    });

    await waitFor(() =>
      expect(result.current.errors.certifications).toBeDefined(),
    );
    expect(result.current.errors.certifications?.["cert-bad"]).toBeDefined();
    expect(putProfile).not.toHaveBeenCalled();
    expect(result.current.step).toBe(2);
  });

  it("Skip vẫn lưu được dù chứng chỉ thiếu tháng/năm", async () => {
    const { result } = await mountWithBadCertification();

    act(() => {
      result.current.skipAndFinish();
    });

    await waitFor(() => expect(putProfile).toHaveBeenCalledTimes(1));
    expect(result.current.errors).toEqual({});
  });
});

describe("useProfileSetup — nạp dòng kinh nghiệm cũ (isCurrent)", () => {
  it("dòng cũ thiếu cả start_date lẫn end_date -> KHÔNG phải đang làm", async () => {
    const { result } = await mountWithProfile(
      makeProfile({
        experiences: [
          {
            id: "e1",
            title: "Legacy Co",
            organization: "Legacy Corp",
            start_date: null,
            end_date: null,
            description: null,
          },
        ],
      }),
    );

    const row = result.current.data.experiences.find((e) => e.id === "e1");
    expect(row?.isCurrent).toBe(false);
  });

  it("dòng có start_date nhưng không có end_date -> đang làm", async () => {
    const { result } = await mountWithProfile(
      makeProfile({
        experiences: [
          {
            id: "e2",
            title: "Current Co",
            organization: "Current Corp",
            start_date: "2020-01-01",
            end_date: null,
            description: null,
          },
        ],
      }),
    );

    const row = result.current.data.experiences.find((e) => e.id === "e2");
    expect(row?.isCurrent).toBe(true);
  });
});

describe("useProfileSetup — không bịa dữ liệu cho user mới", () => {
  it("wizard mở ra với danh sách kỹ năng RỖNG", async () => {
    // Trước đây điền sẵn ["Python", "C++", "SQL", "FastAPI"]. Người tìm việc
    // tài chính, luật... bấm Next là mang theo 4 kỹ năng chưa từng chọn.
    const { result } = await mountWithValidPhone();
    expect(result.current.data.skills).toEqual([]);
  });

  it("user không đụng vào kỹ năng -> gửi lên mảng rỗng", async () => {
    const { result } = await mountWithValidPhone();

    act(() => {
      result.current.completeSetup();
    });

    await waitFor(() => expect(putProfile).toHaveBeenCalledTimes(1));
    expect(putProfile.mock.calls[0][0].skills).toEqual([]);
  });

  it("profile trên server không có kỹ năng -> vẫn rỗng, không rơi về mặc định", async () => {
    // Loader dùng `prof.skills?.length ? ... : d.skills`, nên mặc định cứng sẽ
    // quay lại với cả user đã chủ động xoá hết kỹ năng.
    const { result } = await mountWithProfile(makeProfile({ skills: [] }));
    expect(result.current.data.skills).toEqual([]);
  });
});

describe("useProfileSetup — toProfileUpdate: shape kinh nghiệm & học vấn", () => {
  it("dòng kinh nghiệm đầy đủ gửi đúng shape, không kèm field thừa", async () => {
    const { result } = await mountWithValidPhone();

    act(() => {
      result.current.setData((d) => ({
        ...d,
        experiences: [
          {
            id: "exp-1",
            title: "  Senior Engineer  ",
            organization: "  Acme Corp  ",
            startMonth: "01",
            startYear: "2022",
            endMonth: "06",
            endYear: "2023",
            isCurrent: false,
            description: "  Built things.  ",
          },
        ],
      }));
    });

    act(() => {
      result.current.completeSetup();
    });

    await waitFor(() => expect(putProfile).toHaveBeenCalledTimes(1));
    const body = putProfile.mock.calls[0][0];

    expect(body.experiences).toEqual([
      {
        title: "Senior Engineer",
        organization: "Acme Corp",
        start_date: "2022-01-01",
        end_date: "2023-06-01",
        description: "Built things.",
        display_order: 0,
      },
    ]);
  });

  it("isCurrent: true -> end_date null dù các ô To vẫn còn giá trị cũ", async () => {
    const { result } = await mountWithValidPhone();

    act(() => {
      result.current.setData((d) => ({
        ...d,
        experiences: [
          {
            id: "exp-2",
            title: "Current Job",
            organization: "Current Corp",
            startMonth: "03",
            startYear: "2021",
            endMonth: "12",
            endYear: "2022",
            isCurrent: true,
            description: "",
          },
        ],
      }));
    });

    act(() => {
      result.current.completeSetup();
    });

    await waitFor(() => expect(putProfile).toHaveBeenCalledTimes(1));
    const body = putProfile.mock.calls[0][0];

    expect(body.experiences[0].end_date).toBeNull();
  });

  it("dòng trống bị loại, display_order liền mạch từ mảng đã lọc (dòng trống đứng đầu)", async () => {
    const { result } = await mountWithValidPhone();

    act(() => {
      result.current.setData((d) => ({
        ...d,
        experiences: [
          {
            id: "blank",
            title: "",
            organization: "",
            startMonth: "",
            startYear: "",
            endMonth: "",
            endYear: "",
            isCurrent: false,
            description: "",
          },
          {
            id: "exp-3",
            title: "Real Job",
            organization: "Real Corp",
            startMonth: "",
            startYear: "",
            endMonth: "",
            endYear: "",
            isCurrent: false,
            description: "",
          },
        ],
      }));
    });

    act(() => {
      result.current.completeSetup();
    });

    await waitFor(() => expect(putProfile).toHaveBeenCalledTimes(1));
    const body = putProfile.mock.calls[0][0];

    expect(body.experiences).toHaveLength(1);
    expect(body.experiences[0]).toMatchObject({
      title: "Real Job",
      display_order: 0,
    });
  });

  it("dòng học vấn gửi đúng shape", async () => {
    const { result } = await mountWithValidPhone();

    act(() => {
      result.current.setData((d) => ({
        ...d,
        education: [
          {
            id: "edu-1",
            university: "  MIT  ",
            degree: "  B.S.  ",
            fieldOfStudy: "  Computer Science  ",
            startMonth: "09",
            startYear: "2018",
            endMonth: "05",
            endYear: "2022",
            description: "  Honors.  ",
          },
        ],
      }));
    });

    act(() => {
      result.current.completeSetup();
    });

    await waitFor(() => expect(putProfile).toHaveBeenCalledTimes(1));
    const body = putProfile.mock.calls[0][0];

    expect(body.educations).toEqual([
      {
        school: "MIT",
        degree: "B.S.",
        field_of_study: "Computer Science",
        start_date: "2018-09-01",
        end_date: "2022-05-01",
        description: "Honors.",
        display_order: 0,
      },
    ]);
  });
});

describe("useProfileSetup — dòng kinh nghiệm có title mà thiếu organization", () => {
  it("Complete thì chặn lại, báo lỗi experiences và nhảy về step 4", async () => {
    const { result } = await mountWithValidPhone();

    act(() => {
      result.current.setData((d) => ({
        ...d,
        experiences: [
          {
            id: "exp-bad",
            title: "Some Title",
            organization: "",
            startMonth: "",
            startYear: "",
            endMonth: "",
            endYear: "",
            isCurrent: false,
            description: "",
          },
        ],
      }));
    });

    act(() => {
      result.current.completeSetup();
    });

    await waitFor(() =>
      expect(result.current.errors.experiences).toBeDefined(),
    );
    expect(result.current.errors.experiences?.["exp-bad"]).toBeDefined();
    expect(putProfile).not.toHaveBeenCalled();
    expect(result.current.step).toBe(4);
  });

  it("Skip vẫn lưu được dù thiếu organization", async () => {
    const { result } = await mountWithValidPhone();

    act(() => {
      result.current.setData((d) => ({
        ...d,
        experiences: [
          {
            id: "exp-bad",
            title: "Some Title",
            organization: "",
            startMonth: "",
            startYear: "",
            endMonth: "",
            endYear: "",
            isCurrent: false,
            description: "",
          },
        ],
      }));
    });

    act(() => {
      result.current.skipAndFinish();
    });

    await waitFor(() => expect(putProfile).toHaveBeenCalledTimes(1));
    expect(result.current.errors).toEqual({});
  });
});
