const parseError = async (res: Response): Promise<string> => {
  const body = await res.json().catch(() => ({ error: 'Erreur inconnue' }));
  return body.error ?? 'Erreur inconnue';
};

export const getJson = async <T>(url: string, notFoundMessage: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(notFoundMessage);
  return res.json();
};

export const putJson = async <T>(url: string, body: unknown): Promise<T> => {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const del = async (url: string): Promise<void> => {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res));
};
