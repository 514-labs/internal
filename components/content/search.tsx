"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface PagefindResult {
  id: string;
  url: string;
  excerpt: string;
  meta: {
    title?: string;
    [key: string]: string | undefined;
  };
  sub_results?: {
    title: string;
    url: string;
    excerpt: string;
  }[];
}

interface PagefindSearchResult {
  results: {
    id: string;
    data: () => Promise<PagefindResult>;
  }[];
}

// Define Pagefind interface
interface Pagefind {
  init: () => Promise<void>;
  search: (query: string) => Promise<PagefindSearchResult>;
  debouncedSearch: (
    query: string,
    options?: { debounceTimeoutMs?: number }
  ) => Promise<PagefindSearchResult | null>;
}

declare global {
  interface Window {
    pagefind?: Pagefind;
  }
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagefindLoaded, setPagefindLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Load Pagefind dynamically (loaded from public folder after build)
  useEffect(() => {
    async function loadPagefind() {
      if (window.pagefind) {
        setPagefindLoaded(true);
        return;
      }

      try {
        // Load pagefind dynamically using a script tag approach
        // This avoids Turbopack trying to resolve it at build time
        const pagefindPath = "/pagefind/pagefind.js";
        const pagefind = await new Function(
          `return import("${pagefindPath}")`
        )();
        await pagefind.init();
        window.pagefind = pagefind;
        setPagefindLoaded(true);
      } catch (error) {
        console.warn("Pagefind not available. Run 'pnpm build' to generate the search index.", error);
      }
    }

    if (open) {
      loadPagefind();
    }
  }, [open]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Search when query changes
  useEffect(() => {
    async function performSearch() {
      if (!query.trim() || !window.pagefind) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResult = await window.pagefind.debouncedSearch(query, {
          debounceTimeoutMs: 150,
        });

        if (!searchResult) return;

        const loadedResults = await Promise.all(
          searchResult.results.slice(0, 10).map(async (result) => {
            const data = await result.data();
            return data;
          })
        );

        setResults(loadedResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        // Remove .html extension if present and clean up the URL
        const url = results[selectedIndex].url
          .replace(/\.html$/, "")
          .replace(/\/index$/, "");
        router.push(url);
        onOpenChange(false);
        setQuery("");
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    },
    [results, selectedIndex, router, onOpenChange]
  );

  const handleResultClick = (url: string) => {
    // Remove .html extension if present and clean up the URL
    const cleanUrl = url.replace(/\.html$/, "").replace(/\/index$/, "");
    router.push(cleanUrl);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Search</DialogTitle>
        </VisuallyHidden>

        {/* Search input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search content..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {isLoading && <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />}
          {query && !isLoading && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:bg-accent rounded"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {!pagefindLoaded && (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading search...</p>
            </div>
          )}

          {pagefindLoaded && !query && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start typing to search</p>
              <p className="text-xs mt-1 text-muted-foreground/70">
                Search across handbook, products, services, and more
              </p>
            </div>
          )}

          {pagefindLoaded && query && results.length === 0 && !isLoading && (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found for &quot;{query}&quot;</p>
            </div>
          )}

          {results.length > 0 && (
            <ul className="py-2">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    onClick={() => handleResultClick(result.url)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      index === selectedIndex
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {result.meta?.title || "Untitled"}
                        </h4>
                        <p
                          className="text-sm text-muted-foreground mt-1 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: result.excerpt }}
                        />
                        <p className="text-xs text-muted-foreground/70 mt-1 truncate">
                          {result.url}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd> to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">esc</kbd> to close
            </span>
          </div>
          <span>Powered by Pagefind</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground bg-muted hover:bg-accent rounded-md transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="hidden sm:inline-flex text-xs bg-background px-1.5 py-0.5 rounded border text-muted-foreground">
        ⌘K
      </kbd>
    </button>
  );
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {children}
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

