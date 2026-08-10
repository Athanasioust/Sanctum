"use client";

import { useState } from "react";
import { Layers, Music, Play, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/shared/form";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { CHANNEL_META, ChannelMixer } from "@/components/soundpad/channel-mixer";
import { SOUND_LIBRARY_CHANGED_EVENT } from "@/components/soundpad/soundpad-button";
import { useSoundpad } from "@/components/soundpad/soundpad-context";
import { api } from "@/lib/client";
import { SOUND_CATEGORIES } from "@/db/schema";
import type { SoundAsset, SoundCategory, Soundscape, SoundscapeTrack } from "@/db/schema";

export function Soundpad({
  campaignId,
  assets: initialAssets,
  soundscapes: initialSoundscapes,
}: {
  campaignId: number;
  assets: SoundAsset[];
  soundscapes: Soundscape[];
}) {
  const soundpad = useSoundpad();
  const [assets, setAssets] = useState(initialAssets);
  const [scapes, setScapes] = useState(initialSoundscapes);
  const [uploadCategory, setUploadCategory] = useState<SoundCategory>("ambience");
  const [uploading, setUploading] = useState(false);
  const [scapeName, setScapeName] = useState("");

  /** Tell the floating mixer to re-read the library. */
  function announce() {
    window.dispatchEvent(new Event(SOUND_LIBRARY_CHANGED_EVENT));
  }

  async function uploadFiles(files: FileList) {
    setUploading(true);
    let added = 0;
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", "audio");
        const { url } = await api.upload<{ url: string }>("/api/upload", fd);
        const asset = await api.post<SoundAsset>("/api/sound-assets", {
          campaignId,
          // Drop the extension — the filename is the DM's own label already.
          name: file.name.replace(/\.[^.]+$/, "").slice(0, 120),
          category: uploadCategory,
          url,
        });
        setAssets((prev) => [...prev, asset].sort((a, b) => a.name.localeCompare(b.name)));
        added++;
      }
      announce();
      toast.success(`Added ${added} sound${added === 1 ? "" : "s"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function renameAsset(id: number, name: string) {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
    try {
      await api.patch(`/api/sound-assets/${id}`, { name });
      announce();
    } catch {
      toast.error("Failed to rename");
    }
  }

  async function moveAsset(id: number, category: SoundCategory) {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, category } : a)));
    try {
      await api.patch(`/api/sound-assets/${id}`, { category });
      announce();
    } catch {
      toast.error("Failed to change channel");
    }
  }

  async function removeAsset(id: number) {
    try {
      await api.delete(`/api/sound-assets/${id}`);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      // If the deleted track was loaded on a channel, take it off the mixer.
      for (const category of ["music", "ambience"] as SoundCategory[]) {
        if (soundpad?.channels[category].asset?.id === id) soundpad.play(category, null);
      }
      announce();
      toast.success("Sound removed");
    } catch {
      toast.error("Failed to remove the sound");
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Soundscapes                                                            */
  /* ---------------------------------------------------------------------- */

  async function saveSoundscape() {
    const name = scapeName.trim();
    if (!name) {
      toast.error("Name the soundscape first");
      return;
    }
    if (!soundpad) return;

    // Snapshot whatever the looping channels are set to right now.
    const tracks: SoundscapeTrack[] = (["music", "ambience"] as SoundCategory[])
      .filter((category) => soundpad.channels[category].asset)
      .map((category) => ({
        category,
        soundAssetId: soundpad.channels[category].asset!.id,
        volume: soundpad.channels[category].volume,
      }));

    if (tracks.length === 0) {
      toast.error("Set a music or ambience track before saving");
      return;
    }

    try {
      const created = await api.post<Soundscape>("/api/soundscapes", {
        campaignId,
        name,
        tracks,
      });
      setScapes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setScapeName("");
      toast.success(`Saved "${created.name}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  function applySoundscape(scape: Soundscape) {
    if (!soundpad) return;
    const assigned = new Set<SoundCategory>();
    for (const track of scape.tracks) {
      const asset = assets.find((a) => a.id === track.soundAssetId);
      if (!asset) continue;
      soundpad.setVolume(track.category, track.volume);
      soundpad.play(track.category, asset);
      assigned.add(track.category);
    }
    // Channels the soundscape doesn't mention go quiet, so switching scenes
    // doesn't leave the last one's rain playing under the new music.
    for (const category of ["music", "ambience"] as SoundCategory[]) {
      if (!assigned.has(category)) soundpad.play(category, null);
    }
    toast.success(`Playing "${scape.name}"`);
  }

  async function removeSoundscape(id: number) {
    try {
      await api.delete(`/api/soundscapes/${id}`);
      setScapes((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete the soundscape");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Library */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
          <Field label="Add to channel" className="w-40">
            <Select
              value={uploadCategory}
              onValueChange={(v) => setUploadCategory(v as SoundCategory)}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOUND_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{CHANNEL_META[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <label className="inline-flex">
            <input
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button asChild disabled={uploading}>
              <span>
                <Upload className="size-4" />
                {uploading ? "Uploading…" : "Upload audio"}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground">
            Your own files, copied into the campaign. Nothing is streamed.
          </p>
        </div>

        {assets.length === 0 ? (
          <EmptyState
            icon={Music}
            title="No sounds yet"
            description="Upload MP3, OGG, WAV, FLAC or M4A files from your machine. Music and ambience loop; SFX fire once."
          />
        ) : (
          SOUND_CATEGORIES.map((category) => {
            const inChannel = assets.filter((a) => a.category === category);
            if (inChannel.length === 0) return null;
            const meta = CHANNEL_META[category];
            return (
              <section key={category}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <meta.icon className="size-4" /> {meta.label}
                  <span className="text-xs font-normal">— {meta.hint}</span>
                </h3>
                <ul className="space-y-1.5">
                  {inChannel.map((asset) => (
                    <li
                      key={asset.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2"
                    >
                      <Input
                        value={asset.name}
                        onChange={(e) => renameAsset(asset.id, e.target.value)}
                        className="h-8 min-w-32 flex-1"
                        aria-label="Sound name"
                      />
                      <Select
                        value={asset.category}
                        onValueChange={(v) => moveAsset(asset.id, v as SoundCategory)}
                      >
                        <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SOUND_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{CHANNEL_META[c].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() =>
                          category === "sfx"
                            ? soundpad?.fire(asset)
                            : soundpad?.play(category, asset)
                        }
                        aria-label={`Play ${asset.name}`}
                        title={category === "sfx" ? "Fire once" : "Play on this channel"}
                      >
                        <Play className="size-3.5" />
                      </Button>
                      <DeleteIconButton
                        label="sound"
                        title={`Delete "${asset.name}"?`}
                        onConfirm={() => removeAsset(asset.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>

      {/* Mixer + soundscapes */}
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Mixer</h3>
          <ChannelMixer assets={assets} />
        </div>

        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Layers className="size-4" /> Soundscapes
          </h3>
          <div className="space-y-2 rounded-xl border border-border bg-card p-3">
            <div className="flex gap-2">
              <Input
                value={scapeName}
                onChange={(e) => setScapeName(e.target.value)}
                placeholder="Tavern, Boss fight…"
                className="h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveSoundscape();
                }}
              />
              <Button size="sm" onClick={saveSoundscape}>
                <Save className="size-3.5" /> Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Saves whatever the music and ambience channels are set to right now.
            </p>

            {scapes.length > 0 && (
              <ul className="space-y-1 pt-1">
                {scapes.map((scape) => (
                  <li key={scape.id} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-0 flex-1 justify-start"
                      onClick={() => applySoundscape(scape)}
                    >
                      <Play className="size-3" />
                      <span className="truncate">{scape.name}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {scape.tracks.length}
                      </Badge>
                    </Button>
                    <DeleteIconButton
                      label="soundscape"
                      title={`Delete "${scape.name}"?`}
                      onConfirm={() => removeSoundscape(scape.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Trash2 className="mt-0.5 size-3 shrink-0" />
          Deleting a sound removes it from the library. The uploaded file stays on
          disk in case another campaign still points at it.
        </p>
      </div>
    </div>
  );
}
