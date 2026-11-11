"use client";

import React from "react";

export function FormattedContent({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;

  // Split by whitespace and punctuation to extract hashtags and links
  const parts = text.split(/(#[a-zA-Z0-9_]+|https?:\/\/[^\s]+)/g);

  return (
    <div className={`whitespace-pre-line leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith("#")) {
          return (
            <span
              key={index}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer inline-block"
              onClick={(e) => {
                e.stopPropagation();
                // Filter or navigate
                window.location.href = `/?tag=${encodeURIComponent(part.substring(1))}`;
              }}
            >
              {part}
            </span>
          );
        }

        if (part.startsWith("http://") || part.startsWith("https://")) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}
