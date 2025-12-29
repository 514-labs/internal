import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Tag,
  FolderOpen,
  CircleDot,
  CalendarPlus,
  RefreshCw,
} from "lucide-react";
import type {
  ContentItem,
  ContentType,
  TocEntry,
  BaseContentFrontmatter,
} from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MDXContentServer } from "./mdx-content-server";

interface ContentArticleProps<T extends ContentType> {
  item: ContentItem<T>;
  backPath: string;
  backLabel: string;
}

export async function ContentArticle<T extends ContentType>({
  item,
  backPath,
  backLabel,
}: ContentArticleProps<T>) {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href={backPath}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      {/* Content - use Server Component MDX rendering */}
      {item.isMdx ? (
        <MDXContentServer source={item.content} />
      ) : (
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          data-pagefind-body
          dangerouslySetInnerHTML={{ __html: item.html }}
        />
      )}
    </article>
  );
}

interface TableOfContentsProps {
  entries: TocEntry[];
  metadata?: BaseContentFrontmatter & {
    status?: string;
    owners?: string[];
    category?: string;
    deciders?: string[];
    tier?: string;
    difficulty?: string;
    duration?: string;
    timeframe?: string;
    source?: string;
  };
}

export function TableOfContents({ entries, metadata }: TableOfContentsProps) {
  const renderSubEntry = (entry: TocEntry) => (
    <li key={entry.id} className="relative">
      <a
        href={`#${entry.id}`}
        className={cn(
          "flex w-full items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground",
          "hover:bg-accent hover:text-accent-foreground transition-colors"
        )}
      >
        {entry.text}
      </a>
      {entry.children.length > 0 && (
        <ul className="ml-2 border-l border-border pl-2 space-y-1">
          {entry.children.map(renderSubEntry)}
        </ul>
      )}
    </li>
  );

  const renderEntry = (entry: TocEntry) => (
    <li key={entry.id} className="relative">
      <a
        href={`#${entry.id}`}
        className={cn(
          "flex w-full items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground",
          "hover:bg-accent hover:text-accent-foreground transition-colors"
        )}
      >
        {entry.text}
      </a>
      {entry.children.length > 0 && (
        <ul className="ml-2 border-l border-border pl-2 space-y-1 mt-1">
          {entry.children.map(renderSubEntry)}
        </ul>
      )}
    </li>
  );

  // Determine which metadata fields to display
  const hasMetadata =
    metadata &&
    (metadata.status ||
      metadata.category ||
      metadata.date ||
      metadata.updated ||
      metadata.owners?.length ||
      metadata.deciders?.length ||
      metadata.tags?.length ||
      metadata.tier ||
      metadata.difficulty ||
      metadata.duration ||
      metadata.timeframe ||
      metadata.source);

  return (
    <nav className="space-y-2 p-2">
      {/* About this page - Metadata section */}
      {hasMetadata && (
        <div>
          <div className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
            About this page
          </div>
          <div className="space-y-3 px-2 text-sm">
            {/* Status */}
            {metadata.status && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CircleDot className="h-3.5 w-3.5 shrink-0" />
                <Badge variant="outline" className="capitalize text-xs">
                  {metadata.status}
                </Badge>
              </div>
            )}

            {/* Category */}
            {metadata.category && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="capitalize">{metadata.category}</span>
              </div>
            )}

            {/* Tier */}
            {metadata.tier && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CircleDot className="h-3.5 w-3.5 shrink-0" />
                <Badge variant="outline" className="capitalize text-xs">
                  {metadata.tier}
                </Badge>
              </div>
            )}

            {/* Difficulty */}
            {metadata.difficulty && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CircleDot className="h-3.5 w-3.5 shrink-0" />
                <Badge variant="outline" className="capitalize text-xs">
                  {metadata.difficulty}
                </Badge>
              </div>
            )}

            {/* Duration */}
            {metadata.duration && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{metadata.duration}</span>
              </div>
            )}

            {/* Timeframe */}
            {metadata.timeframe && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{metadata.timeframe}</span>
              </div>
            )}

            {/* Source */}
            {metadata.source && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Source:</span>
                <span>{metadata.source}</span>
              </div>
            )}

            {/* Created at */}
            {metadata.date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarPlus className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Created {format(new Date(metadata.date), "MMM d, yyyy")}
                </span>
              </div>
            )}

            {/* Updated at */}
            {metadata.updated && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Updated {format(new Date(metadata.updated), "MMM d, yyyy")}
                </span>
              </div>
            )}

            {/* Owners / Deciders */}
            {(metadata.owners?.length || metadata.deciders?.length) && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {(metadata.owners || metadata.deciders)?.map((owner) => (
                    <span key={owner} className="capitalize">
                      {owner.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {metadata.tags && metadata.tags.length > 0 && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <Tag className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {metadata.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* On this page - TOC section */}
      {entries.length > 0 && (
        <div className={hasMetadata ? "mt-6" : ""}>
          <div className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
            On this page
          </div>
          <ul className="space-y-1">{entries.map(renderEntry)}</ul>
        </div>
      )}
    </nav>
  );
}

interface ContentMetaProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta: Record<string, any>;
}

export function ContentMeta({ meta }: ContentMetaProps) {
  const displayMeta = Object.entries(meta).filter(
    ([key, value]) =>
      value !== undefined &&
      ![
        "title",
        "description",
        "date",
        "updated",
        "draft",
        "tags",
        "order",
      ].includes(key)
  );

  if (displayMeta.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {displayMeta.map(([key, value]) => (
            <div key={key}>
              <dt className="font-medium capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </dt>
              <dd className="text-muted-foreground mt-1">
                {Array.isArray(value) ? value.join(", ") : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
