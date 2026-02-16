import { describe, it, expect } from "vitest";
import { getNomadRank } from "./rankUtils";

describe("getNomadRank", () => {
  it("XP 0이면 Newcomer", () => {
    expect(getNomadRank(0).name).toBe("Newcomer");
  });

  it("XP 50이면 Active Voyager", () => {
    expect(getNomadRank(50).name).toBe("Active Voyager");
  });

  it("XP 200이면 Steady Traveler", () => {
    expect(getNomadRank(200).name).toBe("Steady Traveler");
  });

  it("XP 500이면 Elite Explorer", () => {
    expect(getNomadRank(500).name).toBe("Elite Explorer");
  });

  it("XP 1000이면 Grand Nomad", () => {
    expect(getNomadRank(1000).name).toBe("Grand Nomad");
  });

  it("XP 49는 아직 Newcomer", () => {
    expect(getNomadRank(49).name).toBe("Newcomer");
  });

  it("XP 199는 아직 Active Voyager", () => {
    expect(getNomadRank(199).name).toBe("Active Voyager");
  });

  it("XP 499는 아직 Steady Traveler", () => {
    expect(getNomadRank(499).name).toBe("Steady Traveler");
  });

  it("XP 999는 아직 Elite Explorer", () => {
    expect(getNomadRank(999).name).toBe("Elite Explorer");
  });

  it("XP 안 넣으면 기본값 0으로 Newcomer", () => {
    expect(getNomadRank().name).toBe("Newcomer");
  });

  it("Newcomer의 다음 레벨은 50", () => {
    expect(getNomadRank(0).nextLevelXp).toBe(50);
  });

  it("Grand Nomad의 다음 레벨은 99999 (최대)", () => {
    expect(getNomadRank(1000).nextLevelXp).toBe(99999);
  });

  it("넣은 XP 값이 그대로 돌아온다", () => {
    expect(getNomadRank(777).xp).toBe(777);
  });
});
