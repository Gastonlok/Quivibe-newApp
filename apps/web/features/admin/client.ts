export async function adminRequest(
  url: string,
  method = "GET",
  body?: unknown,
) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "L’opération a échoué. Réessayez.");
  return data;
}

export async function processEmailQueue() {
  let sent = 0;
  let failed = 0;
  for (let batch = 0; batch < 100; batch++) {
    const result = await adminRequest("/api/admin/messages/deliver", "POST");
    if (result.unavailable) return { sent, failed, unavailable: true };
    sent += result.sent;
    failed += result.failed;
    if (!result.remaining || !result.processed) break;
  }
  return { sent, failed, unavailable: false };
}
