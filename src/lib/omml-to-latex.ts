/**
 * OMML (Word equations) → LaTeX.
 * Parses the XML into a tree first, so nested structures (fraction inside a superscript inside a
 * delimiter ...) convert correctly. Unknown elements fall back to converting their children.
 * shortcut: covers what school-level exams use (fractions, roots, scripts, n-ary, delimiters,
 * matrices/systems, functions, limits, accents); exotic OMML (e.g. m:sPre inside m:sPre) is untested.
 */

interface XNode {
  tag: string;
  attrs: Record<string, string>;
  kids: XNode[];
  text: string;
}

const decode = (s: string) =>
  s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

function parseXml(xml: string): XNode {
  const root: XNode = { tag: "#root", attrs: {}, kids: [], text: "" };
  const stack = [root];
  const re = /<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*"[^"]*")*)\s*(\/?)>|<[^>]*>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const top = stack[stack.length - 1];
    if (m[5] !== undefined) {
      top.kids.push({ tag: "#text", attrs: {}, kids: [], text: decode(m[5]) });
    } else if (m[2] && m[1]) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === m[2]) {
          stack.length = i;
          break;
        }
      }
    } else if (m[2]) {
      const attrs: Record<string, string> = {};
      for (const a of m[3].matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1]] = decode(a[2]);
      const node: XNode = { tag: m[2], attrs, kids: [], text: "" };
      top.kids.push(node);
      if (!m[4]) stack.push(node);
    }
  }
  return root;
}

// trailing space on commands keeps "\alpha" from gluing onto the next letter ("\alphax")
const SYMBOLS: Record<string, string> = {
  α: "\\alpha ", β: "\\beta ", γ: "\\gamma ", δ: "\\delta ", ε: "\\varepsilon ", ζ: "\\zeta ", η: "\\eta ",
  θ: "\\theta ", ι: "\\iota ", κ: "\\kappa ", λ: "\\lambda ", μ: "\\mu ", ν: "\\nu ", ξ: "\\xi ", π: "\\pi ",
  ρ: "\\rho ", σ: "\\sigma ", τ: "\\tau ", υ: "\\upsilon ", φ: "\\varphi ", ϕ: "\\phi ", χ: "\\chi ", ψ: "\\psi ", ω: "\\omega ",
  Γ: "\\Gamma ", Δ: "\\Delta ", Θ: "\\Theta ", Λ: "\\Lambda ", Ξ: "\\Xi ", Π: "\\Pi ", Σ: "\\Sigma ",
  Φ: "\\Phi ", Ψ: "\\Psi ", Ω: "\\Omega ", "∆": "\\Delta ",
  "∞": "\\infty ", "∈": "\\in ", "∉": "\\notin ", "∋": "\\ni ", "⊂": "\\subset ", "⊃": "\\supset ", "⊆": "\\subseteq ",
  "⊇": "\\supseteq ", "⊄": "\\not\\subset ", "∪": "\\cup ", "∩": "\\cap ", "∅": "\\emptyset ", "∖": "\\setminus ",
  "≤": "\\le ", "≥": "\\ge ", "⩽": "\\leqslant ", "⩾": "\\geqslant ", "≠": "\\ne ", "≈": "\\approx ", "≡": "\\equiv ",
  "∼": "\\sim ", "∽": "\\sim ", "≅": "\\cong ", "∝": "\\propto ", "≪": "\\ll ", "≫": "\\gg ",
  "±": "\\pm ", "∓": "\\mp ", "×": "\\times ", "÷": "\\div ", "·": "\\cdot ", "⋅": "\\cdot ", "∘": "\\circ ", "∗": "*",
  "→": "\\to ", "←": "\\leftarrow ", "↔": "\\leftrightarrow ", "↦": "\\mapsto ", "⇒": "\\Rightarrow ",
  "⇔": "\\Leftrightarrow ", "⟹": "\\Longrightarrow ", "⟺": "\\Longleftrightarrow ", "⇐": "\\Leftarrow ",
  "∀": "\\forall ", "∃": "\\exists ", "∧": "\\wedge ", "∨": "\\vee ", "¬": "\\neg ",
  "∑": "\\sum ", "∏": "\\prod ", "∫": "\\int ", "√": "\\sqrt ", "∂": "\\partial ", "∇": "\\nabla ",
  "∠": "\\angle ", "⊥": "\\perp ", "∥": "\\parallel ", "△": "\\triangle ", "°": "^\\circ ", "…": "\\ldots ", "⋯": "\\cdots ",
  "′": "'", "″": "''", "‴": "'''", "−": "-", "–": "-", "ℝ": "\\mathbb{R} ", "ℕ": "\\mathbb{N} ", "ℤ": "\\mathbb{Z} ",
  "ℚ": "\\mathbb{Q} ", "ℂ": "\\mathbb{C} ", "⟨": "\\langle ", "⟩": "\\rangle ", "\u00a0": "\\ ",
  "%": "\\%", "#": "\\#", "&": "\\&", $: "\\$", "{": "\\{", "}": "\\}", _: "\\_", "\\": "\\backslash ", "~": "\\sim ",
};

const FUNCS = new Set(["sin", "cos", "tan", "cot", "sec", "csc", "arcsin", "arccos", "arctan", "log", "ln", "lg", "exp", "lim", "max", "min", "det", "sup", "inf", "gcd"]);

const mapChars = (t: string) => Array.from(t, (c) => SYMBOLS[c] ?? c).join("");
const escapeText = (t: string) => Array.from(t, (c) => ("%#&$_{}".includes(c) ? `\\${c}` : c === "\\" ? "\\textbackslash " : c)).join("");

const kid = (n: XNode | undefined, tag: string) => n?.kids.find((k) => k.tag === tag);
const val = (n: XNode | undefined) => n?.attrs["m:val"];
const textOf = (n: XNode): string => (n.tag === "#text" ? n.text : n.kids.map(textOf).join(""));
const content = (n: XNode | undefined): string => (n ? n.kids.map(conv).join("") : "");
const grp = (s: string) => (/^(?:[A-Za-z0-9]|\\[A-Za-z]+ ?)$/.test(s.trim()) ? s.trim() : `{${s}}`);
const flagOn = (n: XNode | undefined) => !!n && val(n) !== "0" && val(n) !== "false" && val(n) !== "off";

function run(n: XNode): string {
  const t = n.kids.filter((k) => k.tag === "m:t").map(textOf).join("");
  if (!t) return "";
  const pr = kid(n, "m:rPr");
  if (flagOn(kid(pr, "m:nor"))) return `\\text{${escapeText(t)}}`;
  if (val(kid(pr, "m:sty")) === "p" && FUNCS.has(t.trim())) return `\\${t.trim()} `;
  const mapped = mapChars(t);
  // letters we cannot typeset in math mode (Vietnamese words in a formula) go to \text
  return /[^\x00-\x7F]/.test(mapped) ? `\\text{${escapeText(t)}}` : mapped;
}

const LEFT: Record<string, string> = { "(": "\\left(", "[": "\\left[", "{": "\\left\\{", "|": "\\left|", "‖": "\\left\\|", "⟨": "\\left\\langle ", "⌊": "\\left\\lfloor ", "⌈": "\\left\\lceil ", "": "\\left." };
const RIGHT: Record<string, string> = { ")": "\\right)", "]": "\\right]", "}": "\\right\\}", "|": "\\right|", "‖": "\\right\\|", "⟩": "\\right\\rangle ", "⌋": "\\right\\rfloor ", "⌉": "\\right\\rceil ", "": "\\right." };
const NARY: Record<string, string> = { "∫": "\\int", "∑": "\\sum", "∏": "\\prod", "∬": "\\iint", "∭": "\\iiint", "∮": "\\oint", "⋃": "\\bigcup", "⋂": "\\bigcap" };
const ACCENT: Record<string, string> = { "^": "\\hat", "̂": "\\hat", "~": "\\tilde", "̃": "\\tilde", "̇": "\\dot", "̈": "\\ddot", "̅": "\\overline", "¯": "\\overline", "‾": "\\overline", "́": "\\acute", "̀": "\\grave", "̌": "\\check", "̆": "\\breve" };

function conv(n: XNode): string {
  if (n.tag === "#text" || /Pr$/.test(n.tag)) return ""; // whitespace between tags / formatting properties
  const e = () => content(kid(n, "m:e"));
  switch (n.tag) {
    case "m:r":
      return run(n);
    case "w:r":
      return n.kids.filter((k) => k.tag === "w:t").map((k) => mapChars(textOf(k))).join("");
    case "m:f": {
      const type = val(kid(kid(n, "m:fPr"), "m:type"));
      const [a, b] = [content(kid(n, "m:num")), content(kid(n, "m:den"))];
      if (type === "noBar") return `\\binom{${a}}{${b}}`;
      if (type === "lin") return `${grp(a)}/${grp(b)}`;
      return `\\frac{${a}}{${b}}`;
    }
    case "m:rad": {
      const deg = content(kid(n, "m:deg")).trim();
      return deg && !flagOn(kid(kid(n, "m:radPr"), "m:degHide")) ? `\\sqrt[${deg}]{${e()}}` : `\\sqrt{${e()}}`;
    }
    case "m:sSup":
      return `${grp(e())}^{${content(kid(n, "m:sup"))}}`;
    case "m:sSub":
      return `${grp(e())}_{${content(kid(n, "m:sub"))}}`;
    case "m:sSubSup":
      return `${grp(e())}_{${content(kid(n, "m:sub"))}}^{${content(kid(n, "m:sup"))}}`;
    case "m:sPre":
      return `{}_{${content(kid(n, "m:sub"))}}^{${content(kid(n, "m:sup"))}}${grp(e())}`;
    case "m:nary": {
      const pr = kid(n, "m:naryPr");
      const chr = kid(pr, "m:chr") ? val(kid(pr, "m:chr")) ?? "" : "∫";
      const sub = flagOn(kid(pr, "m:subHide")) ? "" : content(kid(n, "m:sub")).trim();
      const sup = flagOn(kid(pr, "m:supHide")) ? "" : content(kid(n, "m:sup")).trim();
      return `${NARY[chr] ?? "\\int"}${sub ? `_{${sub}}` : ""}${sup ? `^{${sup}}` : ""} ${e()}`;
    }
    case "m:func":
      return `${content(kid(n, "m:fName"))} ${e()}`;
    case "m:limLow":
      return `${e()}_{${content(kid(n, "m:lim"))}}`;
    case "m:limUpp":
      return `\\overset{${content(kid(n, "m:lim"))}}{${e()}}`;
    case "m:d": {
      const pr = kid(n, "m:dPr");
      const beg = kid(pr, "m:begChr") ? val(kid(pr, "m:begChr")) ?? "" : "(";
      const end = kid(pr, "m:endChr") ? val(kid(pr, "m:endChr")) ?? "" : ")";
      const sep = kid(pr, "m:sepChr") ? val(kid(pr, "m:sepChr")) ?? "" : "|";
      const inner = n.kids.filter((k) => k.tag === "m:e").map(content).join(mapChars(sep));
      return `${LEFT[beg] ?? `\\left${beg}`}${inner}${RIGHT[end] ?? `\\right${end}`}`;
    }
    case "m:m": {
      const rows = n.kids.filter((k) => k.tag === "m:mr").map((r) => r.kids.filter((c) => c.tag === "m:e").map(content).join(" & "));
      return `\\begin{matrix}${rows.join(" \\\\ ")}\\end{matrix}`;
    }
    case "m:eqArr": {
      // inside aligned, & is an alignment marker, not a literal ampersand
      const rows = n.kids.filter((k) => k.tag === "m:e").map((r) => content(r).replace(/\\&/g, "&"));
      return `\\begin{aligned}${rows.join(" \\\\ ")}\\end{aligned}`;
    }
    case "m:acc": {
      const chr = kid(kid(n, "m:accPr"), "m:chr") ? val(kid(kid(n, "m:accPr"), "m:chr")) ?? "^" : "̂";
      const base = e();
      if (chr === "⃗" || chr === "→") return base.trim().length > 1 ? `\\overrightarrow{${base}}` : `\\vec{${base}}`;
      return `${ACCENT[chr] ?? "\\hat"}{${base}}`;
    }
    case "m:bar":
      return `${val(kid(kid(n, "m:barPr"), "m:pos")) === "bot" ? "\\underline" : "\\overline"}{${e()}}`;
    case "m:groupChr":
      return `${val(kid(kid(n, "m:groupChrPr"), "m:pos")) === "top" ? "\\overbrace" : "\\underbrace"}{${e()}}`;
    case "m:borderBox":
      return `\\boxed{${e()}}`;
    case "m:oMathPara": {
      const rows = n.kids.filter((k) => k.tag === "m:oMath").map(conv);
      return rows.length > 1 ? `\\begin{gathered}${rows.join(" \\\\ ")}\\end{gathered}` : rows[0] ?? "";
    }
    default:
      return content(n); // m:oMath, m:e, m:num, m:box, m:phant, unknown wrappers
  }
}

/** xml may be a whole <m:oMath>/<m:oMathPara> element or just its inner content. */
export function ommlToLatex(xml: string): string {
  return conv(parseXml(xml)).replace(/\s+/g, " ").trim();
}
