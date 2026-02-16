import { describe, expect, it } from "vitest";
import { generateRandomNickname } from "@/utils/nicknameUtils";

describe("generateRandomNickname", () => {
  it("결과에 contryCode가 포함된다", () => {
    const result = generateRandomNickname("KR");
    expect(result).toContain("KR");
  });

  it("'XX의 00 00' 형식이다", () => {
    const result = generateRandomNickname("JP");
    expect(result).toMatch(/^JP의 .+ .+$/);
  });

  it("문자열을 반환한다", () => {
    expect(typeof generateRandomNickname("US")).toBe("string");
  });
});
