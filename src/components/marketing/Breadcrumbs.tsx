import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import JsonLd from "./JsonLd";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/jsonld";

interface BreadcrumbsProps {
  trail: BreadcrumbItem[];
}

export default function Breadcrumbs({ trail }: BreadcrumbsProps) {
  const items: BreadcrumbItem[] = [{ name: "Home", url: "/" }, ...trail];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center gap-1.5 flex-wrap text-white/40 font-body text-xs">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.url} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3 h-3 text-white/25" />}
                {isLast ? (
                  <span className="text-white/65">{item.name}</span>
                ) : (
                  <Link
                    href={item.url}
                    className="hover:text-gold-300 transition-colors inline-flex items-center gap-1"
                  >
                    {i === 0 && <Home className="w-3 h-3" />}
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
