import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPassword,
  validateProfile,
} from "@/lib/validation";

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
  });
  it("rejects missing @ or domain", () => {
    expect(isValidEmail("ab.co")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a b@c.co")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("requires at least 8 characters", () => {
    expect(isValidPassword("123456a")).toBe(false);
  });

  it("requires at least one letter and one number", () => {
    expect(isValidPassword("12345678")).toBe(false);
    expect(isValidPassword("abcdefgh")).toBe(false);
    expect(isValidPassword("1234567a")).toBe(true);
    expect(isValidPassword("Pass1234")).toBe(true);
  });
});

describe("validateProfile", () => {
  it("treats an empty phone as valid — every profile field is optional", () => {
    expect(validateProfile({ phone: "" })).toEqual({});
    expect(validateProfile({ phone: "   " })).toEqual({});
  });

  it("accepts E.164 numbers written with separators", () => {
    // Đúng các placeholder đang hiển thị cạnh ô nhập.
    expect(validateProfile({ phone: "+84 901 234 567" })).toEqual({});
    expect(validateProfile({ phone: "+84912345678" })).toEqual({});
    expect(validateProfile({ phone: "+84-912-345-678" })).toEqual({});
    expect(validateProfile({ phone: "+1 (415) 555-2671" })).toEqual({});
  });

  it("rejects a number without the country code", () => {
    expect(validateProfile({ phone: "0901234567" }).phone).toBeDefined();
  });

  it("rejects a leading zero after '+'", () => {
    expect(validateProfile({ phone: "+0901234567" }).phone).toBeDefined();
  });

  it("enforces the 8–15 digit bounds of E.164", () => {
    expect(validateProfile({ phone: "+1234567" }).phone).toBeDefined(); // 7 chữ số
    expect(validateProfile({ phone: "+12345678" })).toEqual({}); // 8 — biên dưới
    expect(validateProfile({ phone: "+123456789012345" })).toEqual({}); // 15 — biên trên
    expect(validateProfile({ phone: "+1234567890123456" }).phone).toBeDefined(); // 16
  });

  it("rejects letters", () => {
    expect(validateProfile({ phone: "+84 901 ABC 567" }).phone).toBeDefined();
  });
});

describe("validateProfile — github / linkedin", () => {
  const ok = (over: { github?: string; linkedin?: string }) =>
    validateProfile({ phone: "", ...over });

  it("treats both links as optional", () => {
    expect(ok({ github: "", linkedin: "" })).toEqual({});
    expect(validateProfile({ phone: "" })).toEqual({});
  });

  it("accepts a GitHub link in any of the usual shapes", () => {
    expect(ok({ github: "github.com/thomas_tu" })).toEqual({});
    expect(ok({ github: "https://github.com/thomas-tu" })).toEqual({});
    expect(ok({ github: "www.github.com/nva/" })).toEqual({});
  });

  it("accepts a personal site — the field is 'GitHub / Portfolio'", () => {
    expect(ok({ github: "thomastu.dev" })).toEqual({});
    expect(ok({ github: "https://my-portfolio.vercel.app/cv" })).toEqual({});
  });

  it("rejects a value that is not link-like", () => {
    expect(ok({ github: "thomastu" }).github).toBeDefined();
    expect(ok({ github: "my site .com" }).github).toBeDefined();
  });

  it("catches a LinkedIn link pasted into the GitHub field", () => {
    const err = ok({ github: "linkedin.com/in/nva" }).github;
    expect(err).toContain("LinkedIn field");
  });

  it("accepts LinkedIn profile links", () => {
    expect(ok({ linkedin: "linkedin.com/in/nva" })).toEqual({});
    expect(ok({ linkedin: "https://www.linkedin.com/in/thomas-tu/" })).toEqual(
      {},
    );
  });

  it("rejects a non-profile or non-LinkedIn link in the LinkedIn field", () => {
    expect(ok({ linkedin: "github.com/nva" }).linkedin).toBeDefined();
    expect(
      ok({ linkedin: "linkedin.com/company/acme" }).linkedin,
    ).toBeDefined();
  });
});
