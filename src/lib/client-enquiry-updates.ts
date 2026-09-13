import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ClientEnquiryStatusUpdate = {
  email: string;
  sourceEnquiryId: string;
  status: "answered" | "closed";
  reply: string;
  repliedAt: number;
};

const FILE_PATH = path.join(
  process.cwd(),
  ".data",
  "client-enquiry-updates.json",
);

async function readAll(): Promise<ClientEnquiryStatusUpdate[]> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ClientEnquiryStatusUpdate =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as ClientEnquiryStatusUpdate).email === "string" &&
        typeof (item as ClientEnquiryStatusUpdate).sourceEnquiryId ===
          "string" &&
        ((item as ClientEnquiryStatusUpdate).status === "answered" ||
          (item as ClientEnquiryStatusUpdate).status === "closed") &&
        typeof (item as ClientEnquiryStatusUpdate).reply === "string" &&
        typeof (item as ClientEnquiryStatusUpdate).repliedAt === "number",
    );
  } catch {
    return [];
  }
}

export async function recordClientEnquiryStatusUpdate(
  update: ClientEnquiryStatusUpdate,
): Promise<void> {
  const email = update.email.trim().toLowerCase();
  const current = await readAll();
  const next = [
    { ...update, email },
    ...current.filter(
      (item) =>
        !(
          item.email === email &&
          item.sourceEnquiryId === update.sourceEnquiryId
        ),
    ),
  ].slice(0, 500);
  await mkdir(path.dirname(FILE_PATH), { recursive: true });
  await writeFile(FILE_PATH, JSON.stringify(next, null, 2), "utf8");
}

export async function listClientEnquiryStatusUpdates(
  email: string,
): Promise<ClientEnquiryStatusUpdate[]> {
  const needle = email.trim().toLowerCase();
  if (!needle) return [];
  const all = await readAll();
  return all.filter((item) => item.email === needle);
}
