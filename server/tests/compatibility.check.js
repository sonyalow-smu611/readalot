// T22: assert-style check for computeCompatibility (no test framework).
import assert from "node:assert";
import { computeCompatibility } from "../src/services/compatibility.js";

assert.ok(computeCompatibility, "computeCompatibility exists");
