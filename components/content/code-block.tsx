"use client";

import { Mermaid } from "./mermaid";
import { Children, isValidElement, ReactNode, ReactElement } from "react";

interface CodeBlockProps {
  children?: ReactNode;
  className?: string;
}

interface CodeElementProps {
  className?: string;
  children?: ReactNode;
}

function extractTextContent(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";

  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    return extractTextContent(element.props.children);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextContent).join("");
  }

  return "";
}

export function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  // Check if this is a mermaid code block
  const childArray = Children.toArray(children);
  const codeElement = childArray[0];

  if (isValidElement(codeElement)) {
    const element = codeElement as ReactElement<CodeElementProps>;
    const codeClassName = element.props.className || "";

    // Check for mermaid language
    if (
      codeClassName.includes("language-mermaid") ||
      codeClassName.includes("mermaid")
    ) {
      const chartContent = extractTextContent(element.props.children);
      return <Mermaid chart={chartContent.trim()} />;
    }
  }

  // Regular code block - render as normal
  return (
    <pre className={className} {...props}>
      {children}
    </pre>
  );
}

