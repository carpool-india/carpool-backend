interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: "default" | "high";
  channelId?: string;
  sound?: "default";
}

export async function sendPush(input: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  highPriority?: boolean;
}): Promise<string> {
  const message: ExpoPushMessage = {
    to: input.token,
    title: input.title,
    body: input.body,
    data: input.data,
    priority: input.highPriority ? "high" : "default",
    channelId: input.highPriority ? "sos" : "trips",
    sound: "default",
  };

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: { id?: string; status?: string; message?: string };
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok || payload.data?.status === "error") {
    const reason = payload.data?.message ?? payload.errors?.[0]?.message ?? `HTTP ${response.status}`;
    throw new Error(`Expo push send failed: ${reason}`);
  }

  return payload.data?.id ?? "";
}
