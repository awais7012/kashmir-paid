import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageShimmer } from "@/components/site/page-shimmer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { socialLinks } from "@/lib/social";
import { siteSettingsQueryOptions } from "@/lib/site-settings";
import { primeQuery, storiesQueryOptions } from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  loader: async ({ context }) => {
    await primeQuery(context.queryClient, siteSettingsQueryOptions);
    await primeQuery(context.queryClient, storiesQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "Contact · Global Kashmir TV" },
      {
        name: "description",
        content: "Contact Global Kashmir TV — newsroom, advertising and general enquiries.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: settings } = useQuery(siteSettingsQueryOptions);
  if (!settings) return <PageShimmer />;

  const { contact } = settings;
  const social = socialLinks(settings);
  const whatsapp = contact.whatsapp.replace(/\D/g, "");

  const details = [
    contact.address.trim()
      ? {
          key: "address",
          Icon: MapPin,
          label: "Address",
          value: contact.address,
          href: null,
        }
      : null,
    contact.phone.trim()
      ? {
          key: "phone",
          Icon: Phone,
          label: "Phone",
          value: contact.phone,
          href: `tel:${contact.phone.replace(/[^\d+]/g, "")}`,
        }
      : null,
    contact.email.trim()
      ? {
          key: "email",
          Icon: Mail,
          label: "Email",
          value: contact.email,
          href: `mailto:${contact.email}`,
        }
      : null,
    whatsapp
      ? {
          key: "whatsapp",
          Icon: MessageCircle,
          label: "WhatsApp",
          value: contact.whatsapp,
          href: `https://wa.me/${whatsapp}`,
        }
      : null,
  ].flatMap((item) => (item ? [item] : []));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      <main className="page-shell py-12 lg:py-16">
        <div className="border-b-2 border-foreground pb-4">
          <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
            Get in touch
          </p>
          <h1 className="mt-1 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.9] font-black">
            Contact
          </h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
            Newsroom, advertising and general enquiries. We read everything that comes in.
          </p>
        </div>

        {details.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {details.map((item) => {
              const Icon = item.Icon;
              const body = (
                <>
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                  <p className="text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase">
                    {item.label}
                  </p>
                  <p className="text-base leading-relaxed break-words">{item.value}</p>
                </>
              );

              return item.href ? (
                <a
                  key={item.key}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  className="grid content-start gap-3 border-2 border-foreground bg-card p-6 transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {body}
                </a>
              ) : (
                <div
                  key={item.key}
                  className="grid content-start gap-3 border-2 border-foreground bg-card p-6"
                >
                  {body}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 grid justify-items-start gap-3 border-2 border-foreground bg-card px-5 py-12">
            <h2 className="font-display text-3xl">Contact details coming soon</h2>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              Our contact details have not been published yet. Please check back shortly.
            </p>
          </div>
        )}

        {social.length > 0 ? (
          <div className="mt-12 border-t-2 border-foreground pt-8">
            <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
              Follow us
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {social.map((item) => {
                const Icon = item.Icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 border-2 border-foreground px-4 py-3",
                      "text-[11px] font-black tracking-[0.12em] uppercase transition-colors",
                      "hover:bg-foreground hover:text-background",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
        ) : null}
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
