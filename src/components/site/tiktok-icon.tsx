import type { SVGProps } from "react";

/**
 * lucide-react ships no TikTok mark, so the glyph is drawn here. It takes the
 * same props as a lucide icon (className, aria-hidden) so both can be used
 * interchangeably in the social lists.
 */
export function TikTokIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.84-2.48V9.77a5.72 5.72 0 1 0 4.93 5.66V8.53a7.3 7.3 0 0 0 4.26 1.36V6.8a4.25 4.25 0 0 1-3.2-.98Z" />
    </svg>
  );
}
