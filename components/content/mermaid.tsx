"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { Maximize2, X } from "lucide-react";

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [fullscreenSvg, setFullscreenSvg] = useState<string>(""); // Processed SVG for fullscreen
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current) return;

      try {
        // Initialize mermaid with theme based on current theme
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === "dark" ? "dark" : "default",
          themeVariables: {
            // Use CSS variables for better theme integration
            primaryColor: resolvedTheme === "dark" ? "#3b82f6" : "#2563eb",
            primaryTextColor: resolvedTheme === "dark" ? "#f8fafc" : "#1e293b",
            primaryBorderColor: resolvedTheme === "dark" ? "#475569" : "#cbd5e1",
            lineColor: resolvedTheme === "dark" ? "#64748b" : "#94a3b8",
            secondaryColor: resolvedTheme === "dark" ? "#1e293b" : "#f1f5f9",
            tertiaryColor: resolvedTheme === "dark" ? "#334155" : "#e2e8f0",
            background: resolvedTheme === "dark" ? "#0f172a" : "#ffffff",
            mainBkg: resolvedTheme === "dark" ? "#1e293b" : "#f8fafc",
            nodeBorder: resolvedTheme === "dark" ? "#475569" : "#cbd5e1",
            clusterBkg: resolvedTheme === "dark" ? "#1e293b" : "#f1f5f9",
            clusterBorder: resolvedTheme === "dark" ? "#475569" : "#cbd5e1",
            titleColor: resolvedTheme === "dark" ? "#f8fafc" : "#0f172a",
            edgeLabelBackground: resolvedTheme === "dark" ? "#1e293b" : "#ffffff",
            // Gantt specific
            gridColor: resolvedTheme === "dark" ? "#334155" : "#e2e8f0",
            todayLineColor: resolvedTheme === "dark" ? "#f59e0b" : "#d97706",
            // Pie chart specific
            pie1: "#3b82f6",
            pie2: "#10b981",
            pie3: "#f59e0b",
            pie4: "#ef4444",
            pie5: "#8b5cf6",
            pie6: "#ec4899",
            pie7: "#06b6d4",
          },
          flowchart: {
            curve: "basis",
            padding: 20,
          },
          gantt: {
            barHeight: 30,
            barGap: 6,
            topPadding: 50,
            leftPadding: 100,
            gridLineStartPadding: 50,
            fontSize: 12,
            sectionFontSize: 14,
          },
        });

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Render the chart
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        
        // Extract width and height values
        const widthMatch = renderedSvg.match(/width="([^"]+)"/);
        const heightMatch = renderedSvg.match(/height="([^"]+)"/);
        
        // For inline display, keep original SVG
        setSvg(renderedSvg);
        
        // Create fullscreen version with viewBox and responsive sizing
        if (widthMatch && heightMatch) {
          const width = parseFloat(widthMatch[1]);
          const height = parseFloat(heightMatch[1]);
          
          let responsiveSvg = renderedSvg;
          
          // Ensure viewBox exists
          if (!renderedSvg.includes('viewBox')) {
            responsiveSvg = responsiveSvg.replace(
              /<svg([^>]*)>/,
              `<svg$1 viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">`
            );
          }
          
          // Remove fixed dimensions to allow container to control size
          responsiveSvg = responsiveSvg
            .replace(/width="[^"]*"/, '')
            .replace(/height="[^"]*"/, '')
            .replace(/style="[^"]*"/, ''); // Remove inline styles that might override
          
          setFullscreenSvg(responsiveSvg);
        } else {
          setFullscreenSvg(renderedSvg);
        }
        
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(err instanceof Error ? err.message : "Failed to render diagram");
      }
    };

    renderChart();
  }, [chart, resolvedTheme]);

  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when fullscreen is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  if (error) {
    return (
      <div className="my-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive font-medium">
          Failed to render diagram
        </p>
        <pre className="mt-2 text-xs text-muted-foreground overflow-auto">
          {error}
        </pre>
      </div>
    );
  }

  return (
    <>
      {/* Inline diagram with hover button */}
      <div
        ref={containerRef}
        className="group relative my-6 flex justify-center overflow-x-auto rounded-lg border bg-card p-4"
      >
        {/* Fullscreen button - appears on hover */}
        <button
          onClick={openFullscreen}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-background/80 text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-background hover:text-foreground group-hover:opacity-100"
          aria-label="View fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Diagram content */}
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          onClick={closeFullscreen}
        >
          {/* Close button */}
          <button
            onClick={closeFullscreen}
            className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            aria-label="Close fullscreen"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Hint text */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Esc</kbd> or click anywhere to close
          </div>

          {/* Fullscreen diagram container */}
          <div
            className="flex h-[90vh] w-[95vw] items-center justify-center overflow-auto rounded-lg border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="fullscreen-mermaid flex h-full w-full items-center justify-center"
              dangerouslySetInnerHTML={{ __html: fullscreenSvg }}
            />
            <style>{`
              .fullscreen-mermaid svg {
                width: 100%;
                height: 100%;
                max-width: 100%;
                max-height: 100%;
              }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
}

