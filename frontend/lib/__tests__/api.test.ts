import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, deleteApplication, unsaveJob } from "@/lib/api";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  window.localStorage.setItem("careernav_token", "t0ken");
});

afterEach(() => {
  window.localStorage.clear();
});

function noContent() {
  return new Response(null, { status: 204 });
}

describe("deleteApplication", () => {
  it("gọi DELETE đúng đường dẫn và không vỡ vì body rỗng", async () => {
    fetchMock.mockResolvedValue(noContent());

    await expect(deleteApplication("app-1")).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/applications/app-1");
    expect(init.method).toBe("DELETE");
  });

  it("ném ApiError kèm status khi server từ chối", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: "CV đang được tạo" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(deleteApplication("app-1")).rejects.toMatchObject({
      status: 409,
    });
  });
});

describe("unsaveJob", () => {
  it("gọi DELETE /jobs/{id}", async () => {
    fetchMock.mockResolvedValue(noContent());

    await unsaveJob("job-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/jobs/job-1");
    expect(init.method).toBe("DELETE");
  });

  it("giữ nguyên ApiError 409 để UI phân biệt được", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: "Job này đã có CV" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const err = await unsaveJob("job-1").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
  });
});
