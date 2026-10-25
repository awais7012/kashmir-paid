import type { ComponentType, SVGProps } from "react";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { TikTokIcon } from "@/components/site/tiktok-icon";
import type { SiteSettings } from "@/lib/site-settings";

/** A lucide icon and the hand-drawn TikTok mark both take SVG props. */
export type SocialIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type SocialLink = {
  href: string;
  label: string;
  Icon: SocialIcon;
};

/**
 * The header and footer icons, in the order the brand lists them. A link the
 * editor has left blank is dropped, so an unused network never shows a dead
 * button. TikTok has no settings field yet, so it only appears once one exists
 * and is filled in.
 */
export function socialLinks(settings: SiteSettings): SocialLink[] {
  // Tolerates a settings payload that predates the social section entirely.
  const social = settings.social ?? ({} as SiteSettings["social"]);
  return [
    { href: social.youtube ?? "", label: "YouTube", Icon: Youtube },
    { href: social.facebook ?? "", label: "Facebook", Icon: Facebook },
    { href: social.instagram ?? "", label: "Instagram", Icon: Instagram },
    { href: social.twitter ?? "", label: "X", Icon: Twitter },
    { href: social.tiktok ?? "", label: "TikTok", Icon: TikTokIcon },
  ].filter((item) => item.href.trim() !== "");
}
