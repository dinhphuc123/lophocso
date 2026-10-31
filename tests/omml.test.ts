import test from "node:test";
import assert from "node:assert/strict";
import { ommlToLatex } from "../src/lib/omml-to-latex";

const r = (t: string) => `<m:r><m:t>${t}</m:t></m:r>`;
const e = (inner: string) => `<m:e>${inner}</m:e>`;

test("fraction", () => {
  assert.equal(ommlToLatex(`<m:f><m:num>${r("a")}</m:num><m:den>${r("b")}</m:den></m:f>`), "\\frac{a}{b}");
});

test("superscript and subscript are kept (regression: used to come out as x^{} / M_{})", () => {
  assert.equal(ommlToLatex(`<m:sSup>${e(r("x"))}<m:sup>${r("2")}</m:sup></m:sSup>`), "x^{2}");
  assert.equal(ommlToLatex(`<m:sSub>${e(r("M"))}<m:sub>${r("1")}</m:sub></m:sSub>`), "M_{1}");
});

test("nested: fraction inside a superscript inside a root", () => {
  const sup = `<m:sSup>${e(r("e"))}<m:sup><m:f><m:num>${r("1")}</m:num><m:den>${r("2")}</m:den></m:f></m:sup></m:sSup>`;
  assert.equal(ommlToLatex(`<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/>${e(sup)}</m:rad>`), "\\sqrt{e^{\\frac{1}{2}}}");
});

test("integral with limits and a plain-style function name", () => {
  const nary = `<m:nary><m:naryPr><m:limLoc m:val="subSup"/></m:naryPr><m:sub>${r("a")}</m:sub><m:sup>${r("b")}</m:sup>${e(r("f"))}</m:nary>`;
  assert.equal(ommlToLatex(nary), "\\int_{a}^{b} f");
  const sin = `<m:func><m:fName><m:r><m:rPr><m:sty m:val="p"/></m:rPr><m:t>sin</m:t></m:r></m:fName>${e(r("x"))}</m:func>`;
  assert.equal(ommlToLatex(sin), "\\sin x");
});

test("delimiters: default parens, custom separator, and an open-ended system", () => {
  assert.equal(ommlToLatex(`<m:d>${e(r("a"))}${e(r("b"))}</m:d>`), "\\left(a|b\\right)");
  const interval = `<m:d><m:dPr><m:sepChr m:val=";"/></m:dPr>${e(r("a"))}${e(r("b"))}</m:d>`;
  assert.equal(ommlToLatex(interval), "\\left(a;b\\right)");
  const sys = `<m:d><m:dPr><m:begChr m:val="{"/><m:endChr m:val=""/></m:dPr>${e(`<m:eqArr>${e(r("x=1"))}${e(r("y=2"))}</m:eqArr>`)}</m:d>`;
  assert.equal(ommlToLatex(sys), "\\left\\{\\begin{aligned}x=1 \\\\ y=2\\end{aligned}\\right.");
});

test("greek letters do not glue onto the next letter; primes and minus are mapped", () => {
  assert.equal(ommlToLatex(r("πr")), "\\pi r");
  assert.equal(ommlToLatex(r("f′(x)")), "f'(x)");
  assert.equal(ommlToLatex(r("a−b")), "a-b");
});

test("vietnamese text inside a formula goes to \\text", () => {
  assert.equal(ommlToLatex(r("Nhóm")), "\\text{Nhóm}");
});

test("vector accent over two letters", () => {
  assert.equal(ommlToLatex(`<m:acc><m:accPr><m:chr m:val="⃗"/></m:accPr>${e(r("AB"))}</m:acc>`), "\\overrightarrow{AB}");
});
