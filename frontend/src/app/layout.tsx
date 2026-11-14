import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ClientOnly } from "@/components/ClientOnly";
import { PointerGlow } from "@/components/PointerGlow";

export const metadata: Metadata = {
  title: "CampusConnect | College Social Network",
  description: "Exclusive social network for verified college students.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('campusconnect_theme');
                  if (t === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }

                const origError = console.error;
                console.error = function(...args) {
                  const str = args.map(function(a) {
                    return typeof a === 'string' ? a : (a && a.message) || '';
                  }).join(' ');
                  if (
                    str.includes('bis_skin_checked') ||
                    str.includes('bis_register') ||
                    str.includes('__processed_') ||
                    (str.includes("didn't match the client properties") && (str.includes('bis_') || str.includes('__processed_')))
                  ) {
                    return;
                  }
                  return origError.apply(console, args);
                };

                try {
                  const observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName && (m.attributeName === 'bis_skin_checked' || m.attributeName.indexOf('__processed_') === 0 || m.attributeName === 'bis_register')) {
                        m.target.removeAttribute(m.attributeName);
                      }
                    }
                  });
                  observer.observe(document.documentElement, { attributes: true, subtree: true });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#0F172A] dark:text-[#F8FAFC]"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider>
            <PointerGlow />
            <ClientOnly>
              <Navbar />
              <main className="flex-1 pb-16 lg:pb-0">{children}</main>
              <MobileBottomNav />
            </ClientOnly>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
