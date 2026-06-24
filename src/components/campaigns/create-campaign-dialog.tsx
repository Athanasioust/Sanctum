"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/client";
import { DEFAULT_CUSTOM_CALENDAR } from "@/lib/constants";

type Campaign = { id: number };

export function CreateCampaignDialog({ trigger }: { trigger?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [setting, setSetting] = useState("");
  const [calendarType, setCalendarType] = useState<"real" | "custom">("real");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setDescription("");
    setSetting("");
    setCalendarType("real");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Campaign name is required.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const campaign = await api.post<Campaign>("/api/campaigns", {
        name: name.trim(),
        description,
        setting,
        inWorldCalendarType: calendarType,
        customCalendarConfig:
          calendarType === "custom" ? DEFAULT_CUSTOM_CALENDAR : null,
      });
      toast.success("Campaign created");
      setOpen(false);
      reset();
      router.push(`/campaign/${campaign.id}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create campaign";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            New Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a campaign</DialogTitle>
            <DialogDescription>
              Start a new world. You can change any of this later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="The Lost Mines of Phandelver"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-setting">Setting</Label>
              <Input
                id="campaign-setting"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                placeholder="Forgotten Realms"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-description">Description</Label>
              <Textarea
                id="campaign-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short summary of the campaign…"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-calendar">Calendar</Label>
              <Select
                value={calendarType}
                onValueChange={(v) => setCalendarType(v as "real" | "custom")}
              >
                <SelectTrigger id="campaign-calendar" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real">Real-world calendar</SelectItem>
                  <SelectItem value="custom">Custom in-world calendar</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {calendarType === "custom"
                  ? "Starts from a 12-month template you can customise on the Calendar page."
                  : "Uses a standard Gregorian calendar for events."}
              </p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
