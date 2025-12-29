import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type { ParsedContent, TocEntry } from "./types";

/**
 * Parse markdown content with YAML frontmatter
 */
export function parseMarkdown(fileContent: string): ParsedContent {
  const { data, content } = matter(fileContent);
  return {
    frontmatter: data,
    content: content.trim(),
  };
}

/**
 * Convert markdown to HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

/**
 * Extract table of contents from markdown content
 */
export function extractToc(markdown: string): TocEntry[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const entries: TocEntry[] = [];
  const stack: TocEntry[] = [];

  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);

    const entry: TocEntry = {
      id,
      text,
      level,
      children: [],
    };

    // Find parent for nested headings
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      entries.push(entry);
    } else {
      stack[stack.length - 1].children.push(entry);
    }

    stack.push(entry);
  }

  return entries;
}

/**
 * Convert text to URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .trim();
}

/**
 * Generate slug from file path
 * e.g., "handbook/onboarding/getting-started.mdx" -> "onboarding/getting-started"
 */
export function filePathToSlug(filePath: string, contentType: string): string {
  return filePath
    .replace(new RegExp(`^${contentType}/`), "") // Remove content type prefix
    .replace(/\.mdx?$/, "") // Remove .md or .mdx extension
    .replace(/\/index$/, ""); // Remove index suffix
}

