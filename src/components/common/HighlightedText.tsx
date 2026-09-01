import React from 'react';

interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
  highlightClassName?: string;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  highlight,
  className = '',
  highlightClassName = 'bg-amber-300 text-slate-950 font-black px-1 py-0.5 rounded shadow-2xs',
}) => {
  if (!text) return null;
  if (!highlight || !highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  try {
    const cleanHighlight = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${cleanHighlight})`, 'gi');
    const parts = text.split(regex);

    return (
      <span className={className}>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  } catch {
    return <span className={className}>{text}</span>;
  }
};
