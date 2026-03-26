'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4 overflow-x-auto">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1 whitespace-nowrap">
          {index > 0 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-gray-900 dark:hover:text-white transition-colors truncate max-w-[150px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
