/**
 * M05-06・M08-08 の「メール受信確認画面」の代わり。開発環境のメールの受け口（E2E_MAIL_URL。開発環境が送るメールを外へ出さずに全部受けるもの）を読む（読むだけ。消さない）。
 * 受信箱の全削除はしない（ほかの方の試験のメールも入っているため）。操作の前に受け口のメールの番号を控え、そのあとに届いたものだけを数える。
 * 宛先は試験会員の実行の印つきのアドレスなので、ほかの実行・ほかの方のメールと混ざらない。
 */
import { MAIL_URL } from "../../config/env";
import { mailIds } from "../../lib/mail";

export type 受けたメール = {
  番号: number;
  /** 封筒の宛先（To・Bcc を含む、受け口に届いた宛先の全部） */
  宛先: string[];
  /** 封筒の差出人（送信エラーの戻り先＝Return-Path） */
  戻り先: string;
  件名: string;
  /** ヘッダーの From（表示名つき） */
  差出人: string;
  /** ヘッダーの To */
  To: string;
  /** ヘッダーの Reply-To */
  返信先: string;
  本文: string;
};

const 素の = (a: string): string => a.replace(/[<>]/g, "").trim().toLowerCase();

async function json<T>(path: string): Promise<T> {
  if (!MAIL_URL) throw new Error("メールの受け口（E2E_MAIL_URL）が無い");
  const res = await fetch(`${MAIL_URL}${path}`);
  if (!res.ok) throw new Error(`メールの受け口 ${path} の応答が ${res.status}`);
  return res.json() as Promise<T>;
}
async function text(path: string): Promise<string> {
  const res = await fetch(`${MAIL_URL}${path}`);
  return res.ok ? res.text() : "";
}

/** ヘッダーの値の MIME の符号（=?utf-8?B?…?= / =?utf-8?Q?…?=）を戻す */
function 符号を戻す(v: string): string {
  return v.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, cs: string, enc: string, s: string) => {
    const bytes = enc.toUpperCase() === "B"
      ? Buffer.from(s, "base64")
      : Buffer.from(s.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (__, h: string) => String.fromCharCode(parseInt(h, 16))), "latin1");
    try { return new TextDecoder(cs.toLowerCase()).decode(bytes); } catch { return bytes.toString("utf-8"); }
  }).replace(/\?=\s+=\?/g, "");
}

/** 生のメールのヘッダー（折り返しをつないで、名前ごとに最初の値） */
function ヘッダー(src: string): Record<string, string> {
  const head = src.split(/\r?\n\r?\n/)[0].replace(/\r?\n[ \t]+/g, " ");
  const out: Record<string, string> = {};
  for (const line of head.split(/\r?\n/)) {
    const m = /^([A-Za-z-]+):\s*(.*)$/.exec(line);
    if (m && !(m[1].toLowerCase() in out)) out[m[1].toLowerCase()] = 符号を戻す(m[2]).trim();
  }
  return out;
}

/** 操作の前に、いま受け口にあるメールの番号を控える */
export async function 受け口を控える(): Promise<Set<number>> { return mailIds(); }

type 一覧の行 = { id: number; recipients: string[]; subject: string };

async function 読む(id: number): Promise<受けたメール> {
  const j = await json<{ id: number; sender: string; recipients: string[]; subject: string }>(`/messages/${id}.json`);
  const h = ヘッダー(await text(`/messages/${id}.source`));
  let 本文 = await text(`/messages/${id}.plain`);
  if (!本文) 本文 = await text(`/messages/${id}.html`);
  return {
    番号: j.id, 宛先: j.recipients.map(素の), 戻り先: 素の(j.sender ?? ""), 件名: 符号を戻す(j.subject ?? ""),
    差出人: h["from"] ?? "", To: h["to"] ?? "", 返信先: h["reply-to"] ?? "", 本文: 本文.replace(/\r\n/g, "\n"),
  };
}

/**
 * 控えた番号より後に、宛先（封筒の宛先）へ届いたメールを読む。何通を待つかを渡すと、その数がそろうまで（最大 待つ秒）待つ。
 * 0 通を確かめるとき（届かないこと）は 何通=0 にして、待つ秒だけ待ってから数える。
 */
export async function 届いたメール(宛先: string, 控え: Set<number>, 何通: number, 待つ秒 = 60): Promise<受けたメール[]> {
  const want = 素の(宛先);
  const deadline = Date.now() + 待つ秒 * 1000;
  for (;;) {
    const hit = (await json<一覧の行[]>("/messages")).filter((m) => !控え.has(m.id) && m.recipients.some((r) => 素の(r) === want)).sort((a, b) => a.id - b.id);
    if ((何通 > 0 && hit.length >= 何通) || Date.now() > deadline) return Promise.all(hit.map((m) => 読む(m.id)));
    await new Promise((r) => setTimeout(r, 2000));
  }
}
