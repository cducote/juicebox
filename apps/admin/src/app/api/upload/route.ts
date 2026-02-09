import { NextResponse } from "next/server";
import { requireAdmin } from "@juicebox/auth/server";
import { getUploadUrl, generateObjectKey } from "@juicebox/storage";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType } = (await request.json()) as {
    filename: string;
    contentType: string;
  };

  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
  }

  const key = generateObjectKey("uploads", filename);
  const uploadUrl = await getUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
