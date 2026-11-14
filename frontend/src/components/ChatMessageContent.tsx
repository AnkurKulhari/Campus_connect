"use client";

import React from "react";
import { ChatPostPreview } from "./ChatPostPreview";

interface ChatMessageContentProps {
  content: string;
  isMe: boolean;
}

// Regex to detect /posts/<id> or https://<domain>/posts/<id>
const POST_LINK_REGEX = /(?:https?:\/\/[^\s/]+)?\/posts\/(\d+)/i;

// Regex to match URLs in text
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function ChatMessageContent({ content, isMe }: ChatMessageContentProps) {
  if (!content) return null;

  // 1. Check if message contains a CampusConnect post link
  const postMatch = content.match(POST_LINK_REGEX);
  let sharedPostId: number | null = null;
  let textWithoutPostLink = content;

  if (postMatch) {
    sharedPostId = parseInt(postMatch[1], 10);
    // Remove the full matched URL from text
    textWithoutPostLink = content.replace(postMatch[0], "").trim();
  }

  // 2. Helper to render text with clickable URLs
  const renderTextWithLinks = (text: string) => {
    if (!text) return null;

    const parts = text.split(URL_REGEX);
    return parts.map((part, index) => {
      if (part.startsWith("http://") || part.startsWith("https://")) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`underline font-medium break-all hover:opacity-85 ${
              isMe ? "text-blue-100 hover:text-white" : "text-blue-600 dark:text-blue-400"
            }`}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col">
      {/* If there is text other than the post link, render it */}
      {textWithoutPostLink ? (
        <span className="align-middle leading-relaxed">
          {renderTextWithLinks(textWithoutPostLink)}
        </span>
      ) : null}

      {/* If this message contains a post link, render the Instagram-style Post Card */}
      {sharedPostId !== null && (
        <ChatPostPreview postId={sharedPostId} isMe={isMe} />
      )}

      {/* If it was a non-post message without post links, render normal text with clickable links */}
      {!postMatch && !textWithoutPostLink && (
        <span className="align-middle leading-relaxed">
          {renderTextWithLinks(content)}
        </span>
      )}
    </div>
  );
}
