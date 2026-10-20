import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { eventTextError, normalizeTitle } from "./eventFields.ts";

test("text limits count code points for emoji and combining characters", () => {
  for (const title of ["a".repeat(120), "😀".repeat(120), "e\u0301".repeat(60)]) {
    assert.equal(eventTextError({ title, notes: "😀".repeat(2000) }), null);
    assert.equal(
      eventTextError({ title: title + "a", notes: "" }),
      "editor.titleTooLong",
    );
  }
  assert.equal(
    eventTextError({ title: "Event", notes: "😀".repeat(2001) }),
    "editor.notesTooLong",
  );
  assert.equal(
    eventTextError({ title: "  " + "😀".repeat(120) + "  ", notes: "" }),
    null,
  );
});

// Compare representative whitespace and non-whitespace boundaries with the server.
test("title normalization agrees with the server at whitespace boundaries", () => {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const cases: [string, string][] = JSON.parse(
    execFileSync(
      "python3",
      [
        "-c",
        `
import json, sys
sys.path.insert(0, 'tests')
from support import load
domain = load('domain')
characters = [' ', '\\t', '\\n', '\\u00a0', '\\u3000', '\\u001c', '\\u0085', '\\ufeff', '\\u200b']
texts = [c + 'a' * 118 + c + c + 'b' + c for c in characters] + ['', '\\u0085\\u001c\\u3000']
print(json.dumps([[text, domain._text(text, 'title', 10000)] for text in texts]))
`,
      ],
      { cwd: root, encoding: "utf8" },
    ),
  );
  for (const [input, expected] of cases) {
    assert.equal(normalizeTitle(input), expected);
    assert.equal(
      eventTextError({ title: input, notes: "" }),
      Array.from(expected).length > 120 ? "editor.titleTooLong" : null,
    );
  }
  assert.equal(normalizeTitle("\u0085\u001c\u3000"), "");
  assert.equal(normalizeTitle("\ufeff"), "\ufeff");
});
