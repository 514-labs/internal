/**
 * Build script to generate HTML files for Pagefind indexing
 * This script reads markdown content and generates static HTML files
 * that Pagefind can index.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const CONTENT_DIR = path.join(process.cwd(), "content");
const OUTPUT_DIR = path.join(process.cwd(), ".search-index");

const CONTENT_TYPES = [
  "handbook",
  "products",
  "services",
  "frameworks",
  "decisions",
  "playbooks",
  "strategy",
];

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

function getMarkdownFiles(dir: string, basePath = ""): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = path.join(basePath, entry.name);
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath, relativePath));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(relativePath);
    }
  }

  return files;
}

async function buildSearchIndex() {
  console.log("Building search index...\n");

  // Clean output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let totalFiles = 0;

  for (const contentType of CONTENT_TYPES) {
    const contentTypeDir = path.join(CONTENT_DIR, contentType);
    const files = getMarkdownFiles(contentTypeDir);

    for (const file of files) {
      const filePath = path.join(contentTypeDir, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data: frontmatter, content } = matter(fileContent);

      // Skip drafts
      if (frontmatter.draft) {
        continue;
      }

      // Generate HTML content
      const htmlContent = await markdownToHtml(content);

      // Create slug from file path
      const slug = file.replace(/\.mdx$/, "").replace(/\/index$/, "");
      const url = `/${contentType}/${slug}`.replace(/\/+/g, "/");

      // Build HTML page for indexing
      const htmlPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${frontmatter.title || "Untitled"}</title>
  <meta name="description" content="${frontmatter.description || ""}">
  <link data-pagefind-meta="url[href]" href="${url}">
</head>
<body>
  <article data-pagefind-body data-pagefind-meta="type:${contentType}">
    <h1>${frontmatter.title || "Untitled"}</h1>
    ${htmlContent}
  </article>
</body>
</html>`;

      // Write HTML file
      const outputPath = path.join(OUTPUT_DIR, contentType, `${slug}.html`);
      const outputDirPath = path.dirname(outputPath);
      fs.mkdirSync(outputDirPath, { recursive: true });
      fs.writeFileSync(outputPath, htmlPage);

      totalFiles++;
    }
  }

  console.log(`Generated ${totalFiles} HTML files for indexing.`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);
  console.log("Running Pagefind...\n");
}

buildSearchIndex().catch(console.error);
