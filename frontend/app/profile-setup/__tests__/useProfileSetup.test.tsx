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
