import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { adminButton, TextAreaField, TextField } from "@/components/admin/controls";
import { MediaField } from "@/components/admin/media-field";
import type { TeamMember, TeamSection } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

/**
 * One role per line. The textarea keeps its own raw text so pressing Enter does
 * not lose the empty line, while the form receives the cleaned list.
 */
function RolesField({
  id,
  sectionId,
  roles,
  onChange,
}: {
  id: string;
  sectionId: string;
  roles: string[];
  onChange: (next: string[]) => void;
}) {
  const [text, setText] = useState(roles.join("\n"));

  // Re-sync only when a different section is shown, so typing is never clobbered.
  useEffect(() => {
    setText(roles.join("\n"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  return (
    <TextAreaField
      meta={{ id, label: "Roles and bureaus", hint: "One per line." }}
      value={text}
      onChange={(value) => {
        setText(value);
        onChange(
          value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        );
      }}
      rows={6}
    />
  );
}

/**
 * The Team page's people, edited as a list. Each row is exactly what a visitor
 * sees: a photo, a name, a role and a short biography.
 */
export function TeamEditor({
  members,
  onChange,
  structure,
  onStructureChange,
}: {
  members: TeamMember[];
  onChange: (next: TeamMember[]) => void;
  structure: TeamSection[];
  onStructureChange: (next: TeamSection[]) => void;
}) {
  function updateAt(index: number, patch: Partial<TeamMember>) {
    onChange(
      members.map((member, position) => (position === index ? { ...member, ...patch } : member)),
    );
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    const next = [...members];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    onChange(next);
  }

  function updateSectionAt(index: number, patch: Partial<TeamSection>) {
    onStructureChange(
      structure.map((section, position) =>
        position === index ? { ...section, ...patch } : section,
      ),
    );
  }

  function moveSection(index: number, delta: number) {
    const target = index + delta;
    const next = [...structure];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    onStructureChange(next);
  }

  return (
    <div className="grid gap-4">
      {members.length === 0 ? (
        <p className="border-2 border-dashed border-border px-4 py-8 text-center text-xs leading-relaxed text-muted-foreground">
          Nobody added yet. Add a person and they appear on the Team page straight away.
        </p>
      ) : (
        <ul className="grid gap-4">
          {members.map((member, index) => (
            <li
              key={member.id || `member-${index}`}
              className="grid gap-4 border-2 border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black tracking-[0.14em] uppercase">
                  Person {index + 1}
                </span>
                <div className="ms-auto flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${member.name || "person"} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className={cn(adminButton({ variant: "ghost", size: "sm" }), "px-2.5")}
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${member.name || "person"} down`}
                    disabled={index === members.length - 1}
                    onClick={() => move(index, 1)}
                    className={cn(adminButton({ variant: "ghost", size: "sm" }), "px-2.5")}
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${member.name || "person"}`}
                    onClick={() => onChange(members.filter((_, position) => position !== index))}
                    className={cn(adminButton({ variant: "danger", size: "sm" }), "px-2.5")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <TextField
                  meta={{ id: `team-name-${index}`, label: "Name" }}
                  value={member.name}
                  onChange={(value) => updateAt(index, { name: value })}
                  placeholder="Raja Ejaz Ahmed Khan"
                />
                <TextField
                  meta={{ id: `team-role-${index}`, label: "Role", hint: "Shown under the name." }}
                  value={member.role}
                  onChange={(value) => updateAt(index, { role: value })}
                  placeholder="Chief Executive Officer"
                />
              </div>

              <TextAreaField
                meta={{ id: `team-bio-${index}`, label: "Short biography", hint: "Optional." }}
                value={member.bio}
                onChange={(value) => updateAt(index, { bio: value })}
                rows={3}
              />

              <MediaField
                id={`team-photo-${index}`}
                kind="image"
                label="Photo"
                value={member.photo}
                onChange={(value) => updateAt(index, { photo: value })}
                emptyMessage="Optional. Without a photo the person's initials are shown."
              />
            </li>
          ))}
        </ul>
      )}

      <div>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...members,
              { id: crypto.randomUUID(), name: "", role: "", bio: "", photo: "" },
            ])
          }
          className={adminButton({ variant: "outline", size: "sm" })}
        >
          Add person
        </button>
      </div>

      <div className="grid gap-4 border-t-2 border-foreground pt-6">
        <div>
          <h3 className="font-display text-xl">Organisation structure</h3>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
            The published org chart. Publish confirmed names and approved titles only, and leave a
            position listed here until the appointment is actually made.
          </p>
        </div>

        {structure.length === 0 ? (
          <p className="border-2 border-dashed border-border px-4 py-8 text-center text-xs leading-relaxed text-muted-foreground">
            No structure blocks yet.
          </p>
        ) : (
          <ul className="grid gap-4">
            {structure.map((section, index) => (
              <li
                key={section.id || `section-${index}`}
                className="grid gap-4 border-2 border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black tracking-[0.14em] uppercase">
                    Block {index + 1}
                  </span>
                  <div className="ms-auto flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${section.title || "block"} up`}
                      disabled={index === 0}
                      onClick={() => moveSection(index, -1)}
                      className={cn(adminButton({ variant: "ghost", size: "sm" }), "px-2.5")}
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${section.title || "block"} down`}
                      disabled={index === structure.length - 1}
                      onClick={() => moveSection(index, 1)}
                      className={cn(adminButton({ variant: "ghost", size: "sm" }), "px-2.5")}
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${section.title || "block"}`}
                      onClick={() =>
                        onStructureChange(structure.filter((_, position) => position !== index))
                      }
                      className={cn(adminButton({ variant: "danger", size: "sm" }), "px-2.5")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <TextField
                  meta={{ id: `section-title-${index}`, label: "Title" }}
                  value={section.title}
                  onChange={(value) => updateSectionAt(index, { title: value })}
                  placeholder="Executive Management"
                />
                <TextField
                  meta={{ id: `section-desc-${index}`, label: "Description", hint: "Optional." }}
                  value={section.description}
                  onChange={(value) => updateSectionAt(index, { description: value })}
                />
                <RolesField
                  id={`section-roles-${index}`}
                  sectionId={section.id}
                  roles={section.roles}
                  onChange={(roles) => updateSectionAt(index, { roles })}
                />
              </li>
            ))}
          </ul>
        )}

        <div>
          <button
            type="button"
            onClick={() =>
              onStructureChange([
                ...structure,
                { id: crypto.randomUUID(), title: "", description: "", roles: [] },
              ])
            }
            className={adminButton({ variant: "outline", size: "sm" })}
          >
            Add block
          </button>
        </div>
      </div>
    </div>
  );
}
