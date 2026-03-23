import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionTimetableStatus } from "./workflow-rules.js";

test("allows draft to approved", () => {
  assert.equal(canTransitionTimetableStatus("draft", "approved"), true);
});

test("disallows published to approved", () => {
  assert.equal(canTransitionTimetableStatus("published", "approved"), false);
});

test("allows approved to published", () => {
  assert.equal(canTransitionTimetableStatus("approved", "published"), true);
});

test("disallows archived to draft", () => {
  assert.equal(canTransitionTimetableStatus("archived", "draft"), false);
});