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
