"use client";

import { useState } from "react";
import { Pin, PinOff, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { EmptyState } from "@/components/shared/empty-state";
import { api } from "@/lib/client";
import { NOTE_COLORS } from "@/lib/constants";
import { noteColorClasses } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { StickyNote } from "lucide-react";
import type { Note } from "@/db/schema";

export function NotesBoard({
  campaignId,
  initialNotes,
}: {
  campaignId: number;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  const sorted = [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  function upsert(note: Note) {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === note.id);
      return exists ? prev.map((n) => (n.id === note.id ? note : n)) : [note, ...prev];
    });
  }

  async function togglePin(note: Note) {
    const isPinned = !note.isPinned;
    upsert({ ...note, isPinned });
    try {
      await api.patch(`/api/notes/${note.id}`, { isPinned });
    } catch {
      toast.error("Failed to update note");
      upsert(note);
    }
  }

  async function remove(id: number) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.delete(`/api/notes/${id}`);
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NoteDialog campaignId={campaignId} onSaved={upsert} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Jot down anything — lore, reminders, secrets. Pin the important ones to your dashboard."
        />
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {sorted.map((note) => (
            <div
              key={note.id}
              className={cn(
                "group break-inside-avoid rounded-xl border p-4",
                noteColorClasses(note.color),
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading font-semibold">
                  {note.title || "Untitled note"}
                </h3>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => togglePin(note)}
                    aria-label={note.isPinned ? "Unpin" : "Pin"}
                  >
                    {note.isPinned ? (
                      <Pin className="size-4 text-primary" />
                    ) : (
                      <PinOff className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </Button>
                  <NoteDialog
                    campaignId={campaignId}
                    note={note}
                    onSaved={upsert}
                    trigger={
                      <Button size="icon" variant="ghost" className="size-7 opacity-0 transition-opacity group-hover:opacity-100" aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteIconButton
                    label="note"
                    onConfirm={() => remove(note.id)}
                    buttonClassName="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
              </div>
              {note.content ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {note.content}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteDialog({
  campaignId,
  note,
  onSaved,
  trigger,
}: {
  campaignId: number;
  note?: Note;
  onSaved: (note: Note) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: note?.title ?? "",
    content: note?.content ?? "",
    color: note?.color ?? "default",
  });

  function reset() {
    setForm({
      title: note?.title ?? "",
      content: note?.content ?? "",
      color: note?.color ?? "default",
    });
  }

  async function save() {
    setPending(true);
    try {
      const saved = note
        ? await api.patch<Note>(`/api/notes/${note.id}`, form)
        : await api.post<Note>("/api/notes", { ...form, campaignId });
      toast.success(note ? "Note saved" : "Note created");
      onSaved(saved);
      setOpen(false);
      if (!note) setForm({ title: "", content: "", color: "default" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> New Note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Note title" />
          </Field>
          <Field label="Content">
            <Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={6} />
          </Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c.key }))}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform",
                    form.color === c.key ? "scale-110 border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: c.swatch }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
