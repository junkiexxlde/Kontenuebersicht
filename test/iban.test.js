const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const validator = path.resolve(__dirname, "../tools/validate_iban.py");

function validate(iban) {
  const result = spawnSync("python3", [validator], {
    input: JSON.stringify({ iban }),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout).valid;
}

test("Python IBAN checker validates checksum and ignores grouping spaces", () => {
  assert.equal(validate("DE89 3704 0044 0532 0130 00"), true);
  assert.equal(validate("DE00370400440532013000"), false);
  assert.equal(validate("DE8937040044053201300"), false);
  assert.equal(validate("US89370400440532013000"), false);
  assert.equal(validate("not an iban"), false);
});
