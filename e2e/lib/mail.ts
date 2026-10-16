/**
 * 手元の環境のメールの受け口（mailcatcher）に届いたメールを読む（読むだけ）。
 * 会員登録の本登録のメールのように、利用者がメールを開いてリンクを押す手順で使う。local でだけ使える。
 */
import { ENV_NAME, MAIL_URL } from "../config/env";

type Summary = { id: number; recipients: string[]; subject: string; created_at: string };

async function getJson<T>(path: string): Promise<T> {
  if (!MAIL_URL) throw new Error(`E2E_ENV=${ENV_NAME} ではメールの受け口を読めない（E2E_MAIL_URL を与える）`);
  const res = await fetch(`${MAIL_URL}${path}`);
  if (!res.ok) throw new Error(`メールの受け口 ${MAIL_URL}${path} の応答が ${res.status}`);
  return res.json() as Promise<T>;
}

/** いま届いているメールの番号（このあと届くメールと区別するために、操作の前に控える） */
export async function mailIds(): Promise<Set<number>> {
  return new Set((await getJson<Summary[]>("/messages")).map((m) => m.id));
}

/** 宛先あてに、控えた番号より後に届いたメールを待って、件名と本文（テキスト）を返す */
export async function waitForMailTo(address: string, before: Set<number>, timeoutMs = 60_000): Promise<{ subject: string; text: string }> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const hit = (await getJson<Summary[]>("/messages"))
      .filter((m) => !before.has(m.id) && m.recipients.some((r) => r.replace(/[<>]/g, "").trim().toLowerCase() === address.toLowerCase()))
      .sort((a, b) => b.id - a.id)[0];
    if (hit) {
      // テキストの本文が無いメールは、HTMLの本文を読む（リンクのURLは属性にも残る）
      let text = "";
      for (const part of ["plain", "html"]) {
        const res = await fetch(`${MAIL_URL}/messages/${hit.id}.${part}`);
        if (res.ok) { text = await res.text(); if (text) break; }
      }
      if (!text) throw new Error(`メール ${hit.id}（${hit.subject}）の本文を読めない`);
      return { subject: hit.subject, text };
    }
    if (Date.now() > deadline) throw new Error(`${address} あてのメールが ${timeoutMs / 1000} 秒待っても届かない`);
    await new Promise((r) => setTimeout(r, 1000));
  }
}
