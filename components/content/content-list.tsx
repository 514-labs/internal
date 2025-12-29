import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, FileText, FolderOpen } from "lucide-react";
import type { ContentListItem, ContentNavItem, ContentType } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface ContentListProps<T extends ContentType> {
  items: ContentListItem<T>[];
  basePath: string;
  emptyMessage?: string;
}

export function ContentList<T extends ContentType>({
  items,
  basePath,
  emptyMessage = "No content yet",
}: ContentListProps<T>) {
  if (items.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No content yet</EmptyTitle>
          <EmptyDescription>{emptyMessage}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ItemGroup className="gap-2">
      {items.map((item) => (
        <Link key={item.slug} href={`${basePath}/${item.slug}`}>
          <Item variant="muted" className="hover:bg-muted transition-colors">
            <ItemContent>
              <ItemTitle>{item.frontmatter.title}</ItemTitle>
              {item.frontmatter.description && (
                <ItemDescription>{item.frontmatter.description}</ItemDescription>
              )}
              <div className="flex items-center gap-3 mt-1">
                {item.frontmatter.date && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.frontmatter.date), "MMM d, yyyy")}
                  </span>
                )}
                {item.frontmatter.tags && item.frontmatter.tags.length > 0 && (
                  <div className="flex gap-1">
                    {item.frontmatter.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </ItemContent>
            <ItemActions>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </ItemActions>
          </Item>
        </Link>
      ))}
    </ItemGroup>
  );
}

interface ContentNavigationProps {
  navigation: ContentNavItem[];
  basePath: string;
  currentSlug?: string;
}

export function ContentNavigation({
  navigation,
  basePath,
  currentSlug,
}: ContentNavigationProps) {
  const renderNavItem = (item: ContentNavItem, depth = 0) => {
    const isActive = currentSlug === item.slug;
    const hasChildren = item.children.length > 0;

    return (
      <div key={item.slug}>
        <Link
          href={`${basePath}/${item.slug}`}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
            ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}
          `}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {hasChildren ? (
            <FolderOpen className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {item.title}
        </Link>
        {hasChildren && (
          <div className="mt-1">
            {item.children.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="space-y-1">
      {navigation.map((item) => renderNavItem(item))}
    </nav>
  );
}
