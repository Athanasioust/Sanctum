"use client";

import Link from "next/link";
import { ChevronRight, MapPin, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityActions } from "@/components/shared/entity-actions";
import { LocationDialog } from "@/components/world/location-dialog";
import type { Location } from "@/db/schema";

type Node = Location & { children: Node[] };

function buildTree(locations: Location[]): Node[] {
  const map = new Map<number, Node>();
  locations.forEach((l) => map.set(l.id, { ...l, children: [] }));
  const roots: Node[] = [];
  for (const node of map.values()) {
    if (node.parentLocationId && map.has(node.parentLocationId)) {
      map.get(node.parentLocationId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function LocationTree({
  campaignId,
  locations,
}: {
  campaignId: number;
  locations: Location[];
}) {
  const tree = buildTree(locations);
  const options = locations.map((l) => ({ id: l.id, name: l.name }));

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <TreeNode key={node.id} node={node} depth={0} campaignId={campaignId} options={options} />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  campaignId,
  options,
}: {
  node: Node;
  depth: number;
  campaignId: number;
  options: { id: number; name: string }[];
}) {
  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-primary/40"
        style={{ marginLeft: depth * 20 }}
      >
        {node.children.length > 0 ? (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <MapPin className="size-4 shrink-0 text-primary" />
        )}
        <Link href={`/campaign/${campaignId}/world/${node.id}`} className="min-w-0 flex-1">
          <span className="font-medium">{node.name}</span>
          <Badge variant="secondary" className="ml-2 capitalize">{node.type}</Badge>
        </Link>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <LocationDialog
            campaignId={campaignId}
            parentOptions={options}
            defaultParentId={node.id}
            trigger={
              <Button size="icon" variant="ghost" className="size-8" aria-label="Add child location">
                <Plus className="size-4" />
              </Button>
            }
          />
          <LocationDialog
            campaignId={campaignId}
            location={node}
            parentOptions={options}
            trigger={
              <Button size="sm" variant="ghost">Edit</Button>
            }
          />
          <EntityActions deleteEndpoint={`/api/locations/${node.id}`} entityLabel="Location" />
        </div>
      </div>
      {node.children.length > 0 ? (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} campaignId={campaignId} options={options} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
