import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb, botLicenses, bots } from "@akg/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const licenseId = searchParams.get("licenseId");
  const expires = searchParams.get("expires");
  const sig = searchParams.get("sig");

  if (!licenseId || !expires || !sig) {
    return new NextResponse("Invalid download link parameters", { status: 400 });
  }

  // 1. Verify expiry
  if (Date.now() > Number(expires)) {
    return new NextResponse("Download link has expired", { status: 410 });
  }

  // 2. Verify signature
  const secret = process.env.DOWNLOAD_URL_SIGNING_SECRET || "default-download-secret";
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${licenseId}:${expires}`)
    .digest("hex");

  if (sig !== expectedSig) {
    return new NextResponse("Invalid download signature", { status: 403 });
  }

  // 3. Verify license status
  const db = getDb();
  const rows = await db
    .select({
      licenseId: botLicenses.id,
      status: botLicenses.status,
      botName: bots.name,
      platform: bots.platform,
    })
    .from(botLicenses)
    .innerJoin(bots, eq(bots.id, botLicenses.botId))
    .where(eq(botLicenses.id, licenseId))
    .limit(1);

  if (rows.length === 0 || rows[0].status !== "active") {
    return new NextResponse("License is revoked or unavailable", { status: 403 });
  }

  const { botName, platform } = rows[0];
  const filename = `${botName.replace(/\s+/g, "_")}.${platform.toLowerCase() === "mt5" ? "ex5" : "ex4"}`;

  // Return binary attachment
  const dummyCompiledBot = Buffer.from(`AKG_ALGO_COMPILED_EXPERT_ADVISOR_${botName}_${licenseId}`);
  return new NextResponse(dummyCompiledBot, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
