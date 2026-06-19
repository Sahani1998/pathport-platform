import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface MarketingShellProps {
  children: ReactNode;
  maxWidth?: "narrow" | "default" | "wide";
}

const WIDTHS = {
  narrow:  "max-w-3xl",
  default: "max-w-5xl",
  wide:    "max-w-7xl",
};

export default function MarketingShell({ children, maxWidth = "default" }: MarketingShellProps) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[100px] pb-24 px-5 md:px-10">
        <div className={`${WIDTHS[maxWidth]} mx-auto`}>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
