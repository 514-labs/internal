import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import type {
  ContentType,
  FrontmatterForType,
  BaseContentFrontmatter,
} from "./schemas";

/**
 * Represents a content item with its frontmatter and body
 */
export interface ContentItem<T extends ContentType = ContentType> {
  /** The content type (handbook, products, etc.) */
  type: T;
  /** URL-friendly slug derived from file path */
  slug: string;
  /** Full file path relative to content directory */
  filePath: string;
  /** Parsed and validated frontmatter */
  frontmatter: FrontmatterForType<T>;
  /** Raw markdown/MDX content (without frontmatter) */
  content: string;
  /** Rendered HTML content (for non-MDX) */
  html: string;
  /** Serialized MDX source for client rendering */
  mdxSource: MDXRemoteSerializeResult;
  /** Whether this is an MDX file */
  isMdx: boolean;
  /** Table of contents extracted from markdown headings */
  toc: TocEntry[];
}

/**
 * Represents a content item in list view (without full content)
 */
export interface ContentListItem<T extends ContentType = ContentType> {
  type: T;
  slug: string;
  frontmatter: FrontmatterForType<T>;
}

/**
 * Table of contents entry extracted from markdown headings
 */
export interface TocEntry {
  id: string;
  text: string;
  level: number;
  children: TocEntry[];
}

/**
 * Result of parsing a markdown file
 */
export interface ParsedContent {
  frontmatter: Record<string, unknown>;
  content: string;
}

/**
 * Navigation tree for nested content
 */
export interface ContentNavItem {
  title: string;
  slug: string;
  order?: number;
  children: ContentNavItem[];
}

/**
 * Content collection with items and navigation
 */
export interface ContentCollection<T extends ContentType = ContentType> {
  type: T;
  items: ContentListItem<T>[];
  navigation: ContentNavItem[];
}

/**
 * Search result from Pagefind
 */
export interface SearchResult {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  meta: {
    type?: string;
    [key: string]: string | undefined;
  };
}

export type { ContentType, BaseContentFrontmatter, FrontmatterForType };

