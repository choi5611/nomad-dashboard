import { describe, it, expect } from "vitest";
import { getRadianAngle, rotateSize } from "./cropImage";

describe("getRadianAngle", () => {
  it("0도는 0 라디안", () => {
    expect(getRadianAngle(0)).toBe(0);
  });

  it("90도는 π/2 라디안", () => {
    expect(getRadianAngle(90)).toBeCloseTo(Math.PI / 2, 5);
  });

  it("180도는 π 라디안", () => {
    expect(getRadianAngle(180)).toBeCloseTo(Math.PI, 5);
  });

  it("360도는 2π 라디안", () => {
    expect(getRadianAngle(360)).toBeCloseTo(Math.PI * 2, 5);
  });
});

describe("rotateSize", () => {
  it("0도 회전이면 크기 그대로", () => {
    const result = rotateSize(100, 50, 0);
    expect(result.width).toBeCloseTo(100, 5);
    expect(result.height).toBeCloseTo(50, 5);
  });

  it("90도 회전이면 가로세로 뒤바뀜", () => {
    const result = rotateSize(100, 50, 90);
    expect(result.width).toBeCloseTo(50, 5);
    expect(result.height).toBeCloseTo(100, 5);
  });

  it("180도 회전이면 크기 그대로", () => {
    const result = rotateSize(100, 50, 180);
    expect(result.width).toBeCloseTo(100, 5);
    expect(result.height).toBeCloseTo(50, 5);
  });
});
