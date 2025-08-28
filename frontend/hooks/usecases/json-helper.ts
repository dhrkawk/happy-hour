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
  
/* ---------------- Send Helpers ---------------- */
type SendMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type SendInit = RequestInit & {
  method?: SendMethod;
  token?: string;            // 선택: Bearer 토큰
};

export async function sendJson<T>(
  input: RequestInfo,
  body?: unknown,
  init: SendInit = {},
): Promise<T> {
  const {
    method = 'POST',
    headers: initHeaders,
    token,
    ...rest
  } = init;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(initHeaders ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(input, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    ...rest,
  });

  // 공통 에러 처리 (jsonFetch와 동일한 톤)
  if (!res.ok) {
    try {
      const j = await res.json();
      const msg = j?.error ?? j?.message ?? `Request failed (${res.status})`;
      throw new Error(msg);
    } catch {
      // 응답이 JSON이 아닐 수 있음
      const text = await res.text().catch(() => '');
      throw new Error(text || `Request failed (${res.status})`);
    }
  }

  // 204 No Content 대응
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  // JSON 파싱 실패 대비
  try {
    return (await res.json()) as T;
  } catch {
    // JSON이 아니면 text를 T로 캐스팅(필요 시 제네릭을 void/unknown으로 사용)
    const text = await res.text();
    return text as unknown as T;
  }
}

/* 편의 래퍼 (선택) */
export const jsonPost = <T>(url: RequestInfo, body?: unknown, init?: Omit<SendInit, 'method'>) =>
  sendJson<T>(url, body, { ...init, method: 'POST' });

export const jsonPut =  <T>(url: RequestInfo, body?: unknown, init?: Omit<SendInit, 'method'>) =>
  sendJson<T>(url, body, { ...init, method: 'PUT' });

export const jsonPatch = <T>(url: RequestInfo, body?: unknown, init?: Omit<SendInit, 'method'>) =>
  sendJson<T>(url, body, { ...init, method: 'PATCH' });

export const jsonDelete = <T>(url: RequestInfo, body?: unknown, init?: Omit<SendInit, 'method'>) =>
  sendJson<T>(url, body, { ...init, method: 'DELETE' });