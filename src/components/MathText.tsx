"use client";

import React from "react";
import "katex/dist/katex.min.css";
import katex from "katex";

interface MathTextProps {
  content: string;
  className?: string;
}

export function MathText({ content, className = "" }: MathTextProps) {
  if (!content) return null;

  const parts: React.ReactNode[] = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^\$\n]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
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
          key={`math-block-${match.index}`}
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
          key={`math-inline-${match.index}`}
          className="inline-block px-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
