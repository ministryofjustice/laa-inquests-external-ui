import { expect } from "chai";
import { escapeHtml } from "#src/utils/html.js";

describe("escapeHtml()", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`& < > " '`)).to.equal("&amp; &lt; &gt; &quot; &#39;");
  });

  it("returns text without HTML special characters unchanged", () => {
    expect(escapeHtml("Test Firm, 1 Test Street")).to.equal(
      "Test Firm, 1 Test Street",
    );
  });
});
