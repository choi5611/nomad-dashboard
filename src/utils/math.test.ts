import { getPositionFromLatLon, GLOBE_RADIUS } from "@/components/canvas/math";
import { describe, it, expect } from "vitest";

describe("GLOBE_RADIUS", () => {
  it("값이 1이다", () => {
    expect(GLOBE_RADIUS).toBe(5);
  });
});

describe("getPositionFromLatLon", () => {
  it("Vector3 객체를 반환한다", () => {
    const result = getPositionFromLatLon(0, 0);
    expect(result).toHaveProperty("x");
    expect(result).toHaveProperty("y");
    expect(result).toHaveProperty("z");
  });

  it("북극(90, 0)이면 y가 radius와 같다", () => {
    const result = getPositionFromLatLon(90, 0);
    expect(result.y).toBeCloseTo(5, 5);
    expect(result.x).toBeCloseTo(0, 5);
    expect(result.z).toBeCloseTo(0, 5);
  });

  it("남극(-90, 0)이면 y가 -radius와 같다", () => {
    const result = getPositionFromLatLon(-90, 0);
    expect(result.y).toBeCloseTo(-5, 5);
  });

  it("커스텀 radius를 넣으면 반영된다", () => {
    const result = getPositionFromLatLon(90, 0, 5);
    expect(result.y).toBeCloseTo(5, 5);
  });
});
