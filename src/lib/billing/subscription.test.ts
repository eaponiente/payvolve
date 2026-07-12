import { describe, expect, it } from "vitest";
import { isEntitled } from "./subscription";

const DAY = 24 * 60 * 60 * 1000;
const future = () => new Date(Date.now() + 30 * DAY);
const past = () => new Date(Date.now() - DAY);

describe("isEntitled", () => {
  it("entitles an ACTIVE sub whose paid-through date is in the future", () => {
    expect(isEntitled({ status: "ACTIVE", trialEndsAt: null, currentPeriodEnd: future() })).toBe(true);
  });

  it("lapses an ACTIVE sub once the paid-through date has passed", () => {
    expect(isEntitled({ status: "ACTIVE", trialEndsAt: null, currentPeriodEnd: past() })).toBe(false);
  });

  it("treats an ACTIVE sub with no end date as open-ended", () => {
    expect(isEntitled({ status: "ACTIVE", trialEndsAt: null, currentPeriodEnd: null })).toBe(true);
  });

  it("entitles a trial until it expires", () => {
    expect(isEntitled({ status: "TRIALING", trialEndsAt: future() })).toBe(true);
    expect(isEntitled({ status: "TRIALING", trialEndsAt: past() })).toBe(false);
  });

  it("denies canceled subscriptions", () => {
    expect(isEntitled({ status: "CANCELED", trialEndsAt: null, currentPeriodEnd: future() })).toBe(false);
  });
});
