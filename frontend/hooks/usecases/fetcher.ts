/* ---------------- Fetch Helpers ---------------- */
export async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (!res.ok) {
      let msg = 'Request failed';
      try {
        const j = await res.json();
        msg = j?.error ?? msg;
      } catch {}
      throw new Error(msg);
    }
    return res.json() as Promise<T>;
  }
  