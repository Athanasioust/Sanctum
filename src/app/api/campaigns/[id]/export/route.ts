import { NextResponse } from "next/server";
import { apiRoute, requireId } from "@/lib/api";
import { exportCampaign } from "@/lib/campaign-data";

type Params = { id: string };

export const GET = apiRoute<Params>(async (_req, { params }) => {
  const id = requireId((await params).id);
  const bundle = await exportCampaign(id);
  const slug = bundle.campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "campaign";
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sanctum-${slug}.json"`,
    },
  });
});
