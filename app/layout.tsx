import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { baseURL } from "@/baseUrl";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { shadcn } from "@clerk/themes";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Separator } from "@/components/ui/separator";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { FocusModeProvider } from "@/components/layouts";

declare global {
  interface Window {
    openai?: {
      openExternal: (options: { href: string }) => void;
      toolOutput?: any;
    };
    innerBaseUrl: string;
  }
}
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Internal 514",
  description: "Internal 514 Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: shadcn,
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <NextChatSDKBootstrap baseUrl={baseURL} />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <SignedOut>
                <div className="min-h-screen flex flex-col">
                  <header className="w-full p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                      <Link href="/" className="flex items-center gap-2">
                        <Image
                          src="/logo-dark.png"
                          alt="Logo"
                          width={28}
                          height={28}
                          className="dark:hidden"
                        />
                        <Image
                          src="/logo-light.png"
                          alt="Logo"
                          width={28}
                          height={28}
                          className="hidden dark:block"
                        />
                        <span className="text-sm font-semibold">514</span>
                      </Link>
                      <div className="flex gap-4 items-center">
                        <Link
                          href="/sign-in"
                          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/sign-up"
                          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Sign Up
                        </Link>
                      </div>
                    </div>
                  </header>
                  <div className="flex-1">{children}</div>
                </div>
              </SignedOut>
              <SignedIn>
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset>
                    <FocusModeProvider>
                      <header className="sticky top-0 z-50 bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                          orientation="vertical"
                          className="mr-2 h-4"
                        />
                        <AppHeader />
                      </header>
                      {children}
                    </FocusModeProvider>
                  </SidebarInset>
                </SidebarProvider>
              </SignedIn>
              <SpeedInsights />
              <Analytics />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

function NextChatSDKBootstrap({ baseUrl }: { baseUrl: string }) {
  return (
    <>
      <base href={baseUrl}></base>
      <script>{`window.innerBaseUrl = ${JSON.stringify(baseUrl)}`}</script>
      <script>
        {"(" +
          (() => {
            const baseUrl = window.innerBaseUrl;
            const htmlElement = document.documentElement;
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                if (
                  mutation.type === "attributes" &&
                  mutation.target === htmlElement
                ) {
                  const attrName = mutation.attributeName;
                  // Allow class and style for next-themes, and suppresshydrationwarning
                  const allowedAttrs = [
                    "suppresshydrationwarning",
                    "class",
                    "style",
                  ];
                  if (
                    attrName &&
                    !allowedAttrs.includes(attrName.toLowerCase())
                  ) {
                    htmlElement.removeAttribute(attrName);
                  }
                }
              });
            });
            observer.observe(htmlElement, {
              attributes: true,
              attributeOldValue: true,
            });

            const originalReplaceState = history.replaceState;
            history.replaceState = (state, unused, url) => {
              const u = new URL(url ?? "", window.location.href);
              const href = u.pathname + u.search + u.hash;
              originalReplaceState.call(history, state, unused, href);
            };

            const originalPushState = history.pushState;
            history.pushState = (state, unused, url) => {
              const u = new URL(url ?? "", window.location.href);
              const href = u.pathname + u.search + u.hash;
              originalPushState.call(history, state, unused, href);
            };

            const appOrigin = new URL(baseUrl).origin;
            const isInIframe = window.self !== window.top;

            window.addEventListener(
              "click",
              (e) => {
                const a = (e?.target as HTMLElement)?.closest("a");
                if (!a || !a.href) return;
                const url = new URL(a.href, window.location.href);
                if (
                  url.origin !== window.location.origin &&
                  url.origin != appOrigin
                ) {
                  try {
                    if (window.openai) {
                      window.openai?.openExternal({ href: a.href });
                      e.preventDefault();
                    }
                  } catch {
                    try {
                      // @ts-ignore
                      if (window.oai) {
                        // @ts-ignore
                        window.oai.openExternal({ href: a.href });
                        e.preventDefault();
                      }
                    } catch {
                      console.warn(
                        "oai.openExternal failed, likely not in OpenAI client"
                      );
                    }
                    console.warn(
                      "openExternal failed, likely not in OpenAI client"
                    );
                  }
                }
              },
              true
            );

            if (isInIframe && window.location.origin !== appOrigin) {
              const originalFetch = window.fetch;

              window.fetch = (input: URL | RequestInfo, init?: RequestInit) => {
                let url: URL;
                if (typeof input === "string" || input instanceof URL) {
                  url = new URL(input, window.location.href);
                } else {
                  url = new URL(input.url, window.location.href);
                }

                if (url.origin === appOrigin) {
                  if (typeof input === "string" || input instanceof URL) {
                    input = url.toString();
                  } else {
                    input = new Request(url.toString(), input);
                  }

                  return originalFetch.call(window, input, {
                    ...init,
                    mode: "cors",
                  });
                }

                if (url.origin === window.location.origin) {
                  const newUrl = new URL(baseUrl);
                  newUrl.pathname = url.pathname;
                  newUrl.search = url.search;
                  newUrl.hash = url.hash;
                  url = newUrl;

                  if (typeof input === "string" || input instanceof URL) {
                    input = url.toString();
                  } else {
                    input = new Request(url.toString(), input);
                  }

                  return originalFetch.call(window, input, {
                    ...init,
                    mode: "cors",
                  });
                }

                return originalFetch.call(window, input, init);
              };
            }
          }).toString() +
          ")()"}
      </script>
    </>
  );
}
