"use client";

import React from "react";
import "katex/dist/katex.min.css";
import katex from "katex";

interface MathTextProps {
  content: string;
  className?: string;
}

/** Renders inline/block LaTeX math within a single text segment (no tables). */
function MathSegment({ text, keyPrefix }: { text: string; keyPrefix: string }) {
  if (!text) return null;

  const decoded = text.replace(/&#124;/g, "|");
  const parts: React.ReactNode[] = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^\$\n]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(decoded)) !== null) {
    if (match.index > lastIndex) {
      parts.push(decoded.substring(lastIndex, match.index));
    }

    const blockMath = match[1];
    const inlineMath = match[2];

    if (blockMath) {
      const html = katex.renderToString(blockMath.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      parts.push(
        <span
          key={`${keyPrefix}-block-${match.index}`}
          className="my-1 block overflow-x-auto py-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } else if (inlineMath) {
      const html = katex.renderToString(inlineMath.trim(), {
        displayMode: false,
        throwOnError: false,
      });
      parts.push(
        <span
          key={`${keyPrefix}-inline-${match.index}`}
          className="inline-block px-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < decoded.length) {
    parts.push(decoded.substring(lastIndex));
  }

  return <>{parts}</>;
}

const isTableLine = (line: string) => {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|") && t.length > 2;
};

const isSeparatorRow = (cells: string[]) =>
  cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));

export function MathText({ content, className = "" }: MathTextProps) {
  if (!content) return null;

  const normalized = content.replace(/\r\n/g, "\n");
  // Fast path if there is no Markdown pipe table in content
  if (!normalized.includes("|")) {
    return (
      <span className={className}>
        <MathSegment text={normalized} keyPrefix="m" />
      </span>
    );
  }

  const lines = normalized.split("\n");
  const blocks: React.ReactNode[] = [];
  let textBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const flushText = (idx: number) => {
    if (textBuffer.length === 0) return;
    const joined = textBuffer.join("\n");
    blocks.push(<MathSegment key={`txt-${idx}`} text={joined} keyPrefix={`txt-${idx}`} />);
    textBuffer = [];
  };

  const flushTable = (idx: number) => {
    if (tableBuffer.length === 0) return;
    const parsedRows = tableBuffer
      .map((rowLine) =>
        rowLine
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim())
      )
      .filter((cells) => !isSeparatorRow(cells));

    if (parsedRows.length > 0) {
      blocks.push(
        <span key={`tbl-wrap-${idx}`} className="my-2.5 block overflow-x-auto">
          <table className="min-w-max border-collapse border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg overflow-hidden shadow-2xs">
            <tbody>
              {parsedRows.map((row, rIdx) => {
                const isFirstRow = rIdx === 0;
                return (
                  <tr
                    key={`tr-${idx}-${rIdx}`}
                    className={
                      isFirstRow
                        ? "bg-slate-100/90 dark:bg-slate-800/90 font-semibold"
                        : "even:bg-slate-50/60 dark:even:bg-slate-800/40"
                    }
                  >
                    {row.map((cell, cIdx) => {
                      const isRowHeader = cIdx === 0;
                      const CellTag = isFirstRow || isRowHeader ? "th" : "td";
                      return (
                        <CellTag
                          key={`tc-${idx}-${rIdx}-${cIdx}`}
                          className={`border border-slate-300 dark:border-slate-700 px-3 py-1.5 whitespace-nowrap ${
                            isRowHeader
                              ? "text-left font-semibold bg-slate-50/90 dark:bg-slate-800/70"
                              : "text-center font-medium"
                          }`}
                        >
                          <MathSegment text={cell} keyPrefix={`cell-${idx}-${rIdx}-${cIdx}`} />
                        </CellTag>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </span>
      );
    }
    tableBuffer = [];
  };

  lines.forEach((line, idx) => {
    if (isTableLine(line)) {
      flushText(idx);
      tableBuffer.push(line);
    } else {
      if (tableBuffer.length > 0) {
        flushTable(idx);
      }
      textBuffer.push(line);
    }
  });

  flushTable(lines.length);
  flushText(lines.length + 1);

  return <span className={className}>{blocks}</span>;
}
