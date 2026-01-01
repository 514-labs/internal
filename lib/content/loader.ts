import fs from "fs";
import path from "path";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { contentSchemas, type ContentType } from "./schemas";
import type {
  ContentItem,
  ContentListItem,
  ContentNavItem,
  ContentCollection,
} from "./types";
import { parseMarkdown, markdownToHtml, filePathToSlug, extractToc } from "./parser";

const CONTENT_DIR = path.join(process.cwd(), "content");

/**
 * Get all markdown/MDX files in a directory recursively
 */
function getContentFiles(dir: string, basePath = ""): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = path.join(basePath, entry.name);
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getContentFiles(fullPath, relativePath));
    } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))) {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Load and parse a single content file
 */
export async function getContent<T extends ContentType>(
  type: T,
  slug: string
): Promise<ContentItem<T> | null> {
  const contentTypeDir = path.join(CONTENT_DIR, type);

  // Try direct file first, then index file for directories
  // Prefer .mdx over .md
  const possiblePaths = [
    path.join(contentTypeDir, `${slug}.mdx`),
    path.join(contentTypeDir, `${slug}.md`),
    path.join(contentTypeDir, slug, "index.mdx"),
    path.join(contentTypeDir, slug, "index.md"),
  ];

  let filePath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { frontmatter, content } = parseMarkdown(fileContent);

  // Validate frontmatter against schema
  const schema = contentSchemas[type];
  const validatedFrontmatter = schema.parse(frontmatter);

  // Skip drafts in production
  if (validatedFrontmatter.draft && process.env.NODE_ENV === "production") {
    return null;
  }

  const isMdx = filePath.endsWith(".mdx");
  const html = await markdownToHtml(content);
  const toc = extractToc(content);

  // Serialize MDX for client-side rendering
  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    },
  });

  return {
    type,
    slug,
    filePath: path.relative(CONTENT_DIR, filePath),
    frontmatter: validatedFrontmatter,
    content,
    html,
    mdxSource,
    isMdx,
    toc,
  } as ContentItem<T>;
}

/**
 * Get all content items for a content type
 */
export async function getAllContent<T extends ContentType>(
  type: T
): Promise<ContentListItem<T>[]> {
  const contentTypeDir = path.join(CONTENT_DIR, type);
  const files = getContentFiles(contentTypeDir);

  const items: ContentListItem<T>[] = [];
  const schema = contentSchemas[type];

  for (const file of files) {
    const filePath = path.join(contentTypeDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { frontmatter } = parseMarkdown(fileContent);

    try {
      const validatedFrontmatter = schema.parse(frontmatter);

      // Skip drafts in production
      if (
        validatedFrontmatter.draft &&
        process.env.NODE_ENV === "production"
      ) {
        continue;
      }

      const slug = filePathToSlug(file, type);

      // Skip root index files - they're rendered by page.tsx, not as separate articles
      if (slug === "index") {
        continue;
      }

      items.push({
        type,
        slug,
        frontmatter: validatedFrontmatter,
      } as ContentListItem<T>);
    } catch (error) {
      console.error(`Error parsing ${file}:`, error);
    }
  }

  // Sort by order, then by date, then by title
  items.sort((a, b) => {
    if (a.frontmatter.order !== undefined && b.frontmatter.order !== undefined) {
      return a.frontmatter.order - b.frontmatter.order;
    }
    if (a.frontmatter.order !== undefined) return -1;
    if (b.frontmatter.order !== undefined) return 1;

    if (a.frontmatter.date && b.frontmatter.date) {
      return (
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
      );
    }

    return a.frontmatter.title.localeCompare(b.frontmatter.title);
  });

  return items;
}

/**
 * Build navigation tree from content items
 */
export function buildNavigation<T extends ContentType>(
  items: ContentListItem<T>[]
): ContentNavItem[] {
  const root: ContentNavItem[] = [];
  const map = new Map<string, ContentNavItem>();

  // Sort items by slug depth for proper parent-child ordering
  const sortedItems = [...items].sort(
    (a, b) => a.slug.split("/").length - b.slug.split("/").length
  );

  for (const item of sortedItems) {
    const parts = item.slug.split("/");
    const navItem: ContentNavItem = {
      title: item.frontmatter.title,
      slug: item.slug,
      order: item.frontmatter.order,
      children: [],
    };

    map.set(item.slug, navItem);

    if (parts.length === 1) {
      // Top-level item
      root.push(navItem);
    } else {
      // Find parent
      const parentSlug = parts.slice(0, -1).join("/");
      const parent = map.get(parentSlug);
      if (parent) {
        parent.children.push(navItem);
      } else {
        // No parent found, add to root
        root.push(navItem);
      }
    }
  }

  // Sort children by order
  const sortNavItems = (items: ContentNavItem[]) => {
    items.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.title.localeCompare(b.title);
    });
    items.forEach((item) => sortNavItems(item.children));
  };

  sortNavItems(root);
  return root;
}

/**
 * Get content collection with navigation
 */
export async function getContentCollection<T extends ContentType>(
  type: T
): Promise<ContentCollection<T>> {
  const items = await getAllContent(type);
  const navigation = buildNavigation(items);

  return {
    type,
    items,
    navigation,
  };
}

/**
 * Get all slugs for static generation
 */
export async function getAllSlugs(type: ContentType): Promise<string[]> {
  const items = await getAllContent(type);
  return items.map((item) => item.slug);
}

