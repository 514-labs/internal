import { compileMDX } from "next-mdx-remote/rsc";
import Link from "next/link";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CodeBlock } from "./code-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
  ItemActions,
  ItemSeparator,
  ItemFooter,
} from "@/components/ui/item";
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  ExternalLink,
  Star,
  Users,
  Minus,
  Zap,
  Target,
  Sparkles,
  TrendingUp,
  Shield,
  Code,
  Server,
  Cloud,
  Trophy,
  Building,
  Globe,
  Database,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

/**
 * Custom components available in MDX files
 *
 * Usage in MDX:
 * <Callout type="info">This is an info callout</Callout>
 * <FeatureCard title="Feature" description="Description" href="/link" />
 */

interface CalloutProps {
  type?: "info" | "warning" | "error" | "success";
  title?: string;
  children: React.ReactNode;
}

function Callout({ type = "info", title, children }: CalloutProps) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
  };
  const Icon = icons[type];

  return (
    <Alert
      variant={type === "error" ? "destructive" : "default"}
      className="my-6"
    >
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

interface FeatureCardProps {
  title: string;
  description?: string;
  href?: string;
  children?: React.ReactNode;
}

function FeatureCard({ title, description, href, children }: FeatureCardProps) {
  const content = (
    <Card className="my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {href && <ExternalLink className="h-4 w-4" />}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:no-underline">
        {content}
      </Link>
    );
  }

  return content;
}

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-4 my-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold mb-2">{title}</h4>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

interface GridProps {
  cols?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}

function Grid({ cols = 2, children }: GridProps) {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${colClasses[cols]} gap-4 my-6`}>{children}</div>
  );
}

interface LinkButtonProps {
  href: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  children: React.ReactNode;
}

function LinkButton({ href, variant = "default", children }: LinkButtonProps) {
  const isExternal = href.startsWith("http");

  return (
    <Button asChild variant={variant} className="my-2">
      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
        {isExternal && <ExternalLink className="ml-2 h-4 w-4" />}
      </Link>
    </Button>
  );
}

interface StatItemProps {
  stat: string;
  title: string;
  children: React.ReactNode;
}

function StatItem({ stat, title, children }: StatItemProps) {
  return (
    <Item variant="outline" className="not-prose">
      <ItemHeader>
        <span className="text-4xl font-black tracking-tight text-primary">
          {stat}
        </span>
      </ItemHeader>
      <ItemContent>
        <ItemTitle className="text-lg font-semibold">{title}</ItemTitle>
        <ItemDescription className="text-balance">{children}</ItemDescription>
      </ItemContent>
    </Item>
  );
}

interface StatGroupProps {
  children: React.ReactNode;
}

function StatGroup({ children }: StatGroupProps) {
  return <ItemGroup className="gap-4 my-6">{children}</ItemGroup>;
}

interface CardGroupProps {
  cols?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}

function CardGroup({ cols = 3, children }: CardGroupProps) {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${colClasses[cols]} gap-4 my-6 not-prose`}>
      {children}
    </div>
  );
}

type ContentCardIcon =
  | "star"
  | "users"
  | "minus"
  | "check"
  | "alert"
  | "info"
  | "zap"
  | "target"
  | "sparkles"
  | "trending"
  | "shield"
  | "code"
  | "server"
  | "cloud"
  | "trophy"
  | "building"
  | "globe"
  | "database";

type ContentCardVariant = "default" | "primary" | "secondary" | "muted";

interface ContentCardProps {
  title: string;
  icon?: ContentCardIcon;
  variant?: ContentCardVariant;
  children?: React.ReactNode;
}

function ContentCard({
  title,
  icon,
  variant = "default",
  children,
}: ContentCardProps) {
  const iconMap: Record<ContentCardIcon, LucideIcon> = {
    star: Star,
    users: Users,
    minus: Minus,
    check: CheckCircle,
    alert: AlertTriangle,
    info: Info,
    zap: Zap,
    target: Target,
    sparkles: Sparkles,
    trending: TrendingUp,
    shield: Shield,
    code: Code,
    server: Server,
    cloud: Cloud,
    trophy: Trophy,
    building: Building,
    globe: Globe,
    database: Database,
  };

  const variantStyles: Record<
    ContentCardVariant,
    { card: string; icon: string; title: string }
  > = {
    default: {
      card: "border-border/50 bg-card hover:border-border hover:shadow-md transition-all duration-200",
      icon: "text-muted-foreground",
      title: "text-foreground",
    },
    primary: {
      card: "border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 hover:shadow-md transition-all duration-200",
      icon: "text-primary",
      title: "text-foreground",
    },
    secondary: {
      card: "border-secondary/30 bg-secondary/10 hover:border-secondary/50 hover:shadow-md transition-all duration-200",
      icon: "text-secondary-foreground/70",
      title: "text-foreground",
    },
    muted: {
      card: "border-muted/50 bg-muted/30 hover:border-muted hover:shadow-sm transition-all duration-200",
      icon: "text-muted-foreground/60",
      title: "text-muted-foreground",
    },
  };

  const Icon = icon ? iconMap[icon] : null;
  const styles = variantStyles[variant];

  return (
    <Card className={`h-full ${styles.card}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          {Icon && (
            <div
              className={`shrink-0 rounded-lg bg-muted/50 p-2.5 w-fit ${styles.icon}`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
          )}
          <CardTitle
            className={`text-base font-semibold leading-tight ${styles.title}`}
          >
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      {children && (
        <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed [&>ul]:mt-2 [&>ul]:space-y-1 [&>p]:mt-0 [&>p>strong]:text-foreground [&>p>strong]:font-medium">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// Custom anchor component for links
function CustomLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (!href) return <a {...props}>{children}</a>;

  const isExternal = href.startsWith("http");
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1"
        {...props}
      >
        {children}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

// All components available in MDX files
const mdxComponents = {
  // Custom components
  Callout,
  FeatureCard,
  Step,
  Grid,
  LinkButton,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  CardGroup,
  ContentCard,
  // Item components
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ItemActions,
  ItemSeparator,
  ItemFooter,
  ItemHeader,
  StatItem,
  StatGroup,
  // Lucide icons for direct use in MDX
  Star,
  Users,
  Minus,
  Zap,
  Target,
  Sparkles,
  TrendingUp,
  Shield,
  Code,
  Server,
  Cloud,
  Trophy,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Building,
  Globe,
  Database,
  ChevronRight,
  // Override default HTML elements
  a: CustomLink,
  pre: CodeBlock,
};

interface MDXContentServerProps {
  source: string;
}

/**
 * Server Component for rendering MDX content.
 * Uses next-mdx-remote/rsc to compile and render MDX on the server,
 * avoiding React hook issues during SSR.
 */
export async function MDXContentServer({ source }: MDXContentServerProps) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    },
  });

  return (
    <div
      className="prose prose-neutral dark:prose-invert max-w-none"
      data-pagefind-body
    >
      {content}
    </div>
  );
}

export { mdxComponents };
