/** Client helper: post a Contact-style message to the staff inbox. */

export async function sendInboxEnquiry(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  reason?: string;
  source?: string;
  allowMissingPhone?: boolean;
}): Promise<{ id?: string; error?: string }> {
  try {
    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        phone: input.phone || "",
        message: input.message,
        source: input.source || "contact",
        reason: input.reason || "general",
        allowMissingPhone: Boolean(input.allowMissingPhone),
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      enquiry?: { id?: string };
    };
    if (!res.ok || !data.ok) {
      return { error: data.error || "Could not send your enquiry." };
    }
    return { id: data.enquiry?.id };
  } catch {
    return { error: "Could not send your enquiry." };
  }
}
