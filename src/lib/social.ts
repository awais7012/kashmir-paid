import { Facebook, Instagram, Twitter, Youtube, type LucideIcon } from "lucide-react";
import type { SiteSettings } from "@/lib/site-settings";

export type SocialLink = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

/**
 * The header and footer icons. A link the editor has left blank is dropped, so
 * an unused network never shows a dead button.
 */
export function socialLinks(settings: SiteSettings): SocialLink[] {
  return [
    { href: settings.social.instagram, label: "Instagram", Icon: Instagram },
    { href: settings.social.twitter, label: "X", Icon: Twitter },
    { href: settings.social.facebook, label: "Facebook", Icon: Facebook },
    { href: settings.social.youtube, label: "YouTube", Icon: Youtube },
  ].filter((item) => item.href.trim() !== "");
}
