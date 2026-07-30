"use client";

import { FileText, FileUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterSheetImport } from "@/components/import/character-sheet-import";
import { MarkdownImport, type OwnerOption } from "@/components/import/markdown-import";

export function ImportClient({
  campaignId,
  owners,
}: {
  campaignId: number;
  owners: OwnerOption[];
}) {
  return (
    <Tabs defaultValue="markdown">
      <TabsList className="mb-5">
        <TabsTrigger value="markdown">
          <FileText className="size-4" /> Markdown / Obsidian
        </TabsTrigger>
        <TabsTrigger value="sheet">
          <FileUp className="size-4" /> Character sheet PDF
        </TabsTrigger>
      </TabsList>

      <TabsContent value="markdown">
        <MarkdownImport campaignId={campaignId} owners={owners} />
      </TabsContent>

      <TabsContent value="sheet">
        <CharacterSheetImport campaignId={campaignId} />
      </TabsContent>
    </Tabs>
  );
}
