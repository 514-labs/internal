import { getContentCollection } from "@/lib/content";
import Link from "next/link";
import { ContentList, ContentNavigation } from "@/components/content";
import { ContentLayout } from "@/components/layouts";
import { Mermaid } from "@/components/content/mermaid";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProductsPage() {
  const collection = await getContentCollection("products");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/products"
        />
      }
    >
      <div className="mb-8 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Internal</Badge>
          <Badge variant="secondary">PM • Design • Eng • Sales</Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          MooseStack is the open-source framework. Boreal is the managed
          platform to deploy and operate it in production.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Suite architecture (high level)</CardTitle>
          <CardDescription>
            A minimal mental model for how the products fit together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Mermaid
            chart={`flowchart LR
  Dev[Developers] --> Code[TypeScript / Python]
  Code --> Moose[MooseStack]
  Moose --> Local[Local dev stack]
  Moose --> Boreal[Boreal]
  Boreal --> Prod[Production data plane]
`}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2 not-prose">
            <div>
              <div className="font-medium">When to lead with MooseStack</div>
              <div className="text-sm text-muted-foreground">
                You’re selling the developer experience: code-first analytics
                backend, local parity, strong typing, modular infra.
              </div>
            </div>
            <div>
              <div className="font-medium">When to lead with Boreal</div>
              <div className="text-sm text-muted-foreground">
                You’re selling production readiness: environments, scaling,
                observability, and enterprise controls without running the
                stack.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-10 grid gap-4 md:grid-cols-2 not-prose">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Open Source</Badge>
              <Badge variant="secondary">Framework</Badge>
            </div>
            <CardTitle>MooseStack</CardTitle>
            <CardDescription>
              Build real-time analytical backends as code (tables, streams,
              workflows, APIs).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Everything-as-code (no YAML)</li>
              <li>Local-first DX (hot reload, Docker parity)</li>
              <li>Typed APIs + migrations</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/products/moosestack">Read MooseStack page</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Commercial</Badge>
              <Badge variant="secondary">Managed Platform</Badge>
            </div>
            <CardTitle>Boreal</CardTitle>
            <CardDescription>
              Deploy and operate MooseStack in production with environments,
              scaling, observability, and controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Git-integrated deploys + multi-env</li>
              <li>Ops primitives (backups, monitoring, scaling)</li>
              <li>Enterprise controls (SSO/RBAC, isolation)</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/products/boreal">Read Boreal page</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 not-prose">
        <h2 className="text-lg font-semibold tracking-tight">
          All product docs
        </h2>
        <p className="text-sm text-muted-foreground">
          Canonical pages used by navigation and search.
        </p>
      </div>

      <ContentList
        items={collection.items}
        basePath="/products"
        emptyMessage="No products documented yet. Add markdown files to content/products/"
      />
    </ContentLayout>
  );
}
