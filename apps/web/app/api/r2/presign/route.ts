import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const MAX_BYTES = 2 * 1024 * 1024 * 1024;

function r2() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
    }
  });
}

export async function POST(req: Request) {
  const store = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll() {}
      }
    }
  );
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const filename = String(body?.filename ?? "");
  const bytes = Number(body?.bytes ?? 0);
  const mime = String(body?.mime ?? "video/mp4");

  if (mime !== "video/mp4")
    return NextResponse.json({ error: "hanya-mp4" }, { status: 400 });
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_BYTES)
    return NextResponse.json({ error: "ukuran-tidak-valid" }, { status: 400 });

  const aman = filename.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
  const r2Key = `raw/${user.id}/${Date.now()}-${randomUUID()}-${aman || "video.mp4"}`;
  const idempotencyKey = randomUUID();

  const url = await getSignedUrl(
    r2(),
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_RAW!,
      Key: r2Key,
      ContentType: "video/mp4",
      ContentLength: bytes
    }),
    { expiresIn: 600 }
  );

  return NextResponse.json({ uploadUrl: url, r2Key, idempotencyKey });
}
