/**
 * 開発環境のメールの受け口（mailcatcher。E2E_MAIL_URL）を読む部品の続き（読むだけ）。
 * lib/mail.ts の「届くのを待つ」に、「届かないこと」「届いた数」「届いた日時」を確かめる読み方を足したもの。
 * 自分の操作で届いたメールだけを見るために、操作の前に控えたメールの番号（mailIds）より後で、宛先が一致するものだけを数える。
 */
import { MAIL_URL } from "../config/env";
import { mailIds, waitForMailTo } from "../lib/mail";

export { mailIds };

type Summary = { id: number; recipients: string[]; subject: string; created_at: string };

export type 届いたメール = { 番号: number; 宛先: string[]; 件名: string; 届いた日時: Date };

async function 一覧(): Promise<Summary[]> {
  if (!MAIL_URL) throw new Error("メールの受け口を読めない（E2E_MAIL_URL を与える）");
  const res = await fetch(`${MAIL_URL}/messages`);
  if (!res.ok) throw new Error(`メールの受け口の応答が ${res.status}`);
  return (await res.json()) as Summary[];
}

const 正規化 = (a: string) => a.replace(/[<>]/g, "").trim().toLowerCase();

/** 受け口の日時の文字（ISO形式、または「2026-11-11 12:00:00 +0000」の形）を日時にする */
function 日時(s: string): Date {
  const iso = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/.exec(s);
  return new Date(iso ? `${iso[1]}T${iso[2]}${iso[3]}:${iso[4]}` : s);
}

/** 控えた番号より後に、宛先に届いているメール（古い順） */
export async function 宛先に届いたメール(宛先: string, 控え: Set<number>): Promise<届いたメール[]> {
  return (await 一覧())
    .filter((m) => !控え.has(m.id) && m.recipients.some((r) => 正規化(r) === 宛先.toLowerCase()))
    .sort((a, b) => a.id - b.id)
    .map((m) => ({ 番号: m.id, 宛先: m.recipients.map(正規化), 件名: m.subject, 届いた日時: 日時(m.created_at) }));
}

/** 決めた時間だけ待ってから、宛先に届いたメールを返す（「届かないこと」「増えないこと」を確かめるために、待ってから数える） */
export async function 待ってから数える(宛先: string, 控え: Set<number>, 待ちミリ秒: number): Promise<届いたメール[]> {
  await new Promise((r) => setTimeout(r, 待ちミリ秒));
  return 宛先に届いたメール(宛先, 控え);
}

/** 宛先に届くのを待ち、件名・本文・日時を返す。続けて届くメールを取りこぼさないよう、短く待ってから数え直す */
export async function 届くのを待つ(宛先: string, 控え: Set<number>, 待ちミリ秒 = 90_000): Promise<{ 件名: string; 本文: string; 届いた日時: Date; 件数: number }> {
  const m = await waitForMailTo(宛先, 控え, 待ちミリ秒);
  const 全部 = await 待ってから数える(宛先, 控え, 3_000);
  return { 件名: m.subject, 本文: m.text, 届いた日時: 全部[全部.length - 1]?.届いた日時 ?? new Date(NaN), 件数: 全部.length };
}

/** メールの本文（HTMLのときはタグを外す）から空白をすべて除いた文。件名・本文の同じ・違うを比べるために使う */
export function 本文の比べ用(本文: string): string {
  return 本文.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, "");
}

/** メールの見出し（送信元・返信先・送信エラーの戻り先）。受け口の原文の見出しを読み、符号化された文字（=?utf-8?B?…?=）は元の文字にする */
export type メールの見出し = { 送信元の表示名: string; 送信元のアドレス: string; 返信先: string; 戻り先: string; 封筒の送信元: string };

function 見出しの値を読む(s: string): string {
  return s.replace(/=\?([\w-]+)\?([BbQq])\?([^?]*)\?=/g, (_m, cs: string, enc: string, body: string) => {
    const buf = enc.toUpperCase() === "B"
      ? Buffer.from(body, "base64")
      : Buffer.from(body.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_x, h: string) => String.fromCharCode(parseInt(h, 16))), "latin1");
    return new TextDecoder(cs).decode(buf);
  }).replace(/\?=\s+=\?/g, "");
}

export async function メールの見出しを読む(番号: number): Promise<メールの見出し> {
  const res = await fetch(`${MAIL_URL}/messages/${番号}.source`);
  if (!res.ok) throw new Error(`メール ${番号} の原文を読めない（応答 ${res.status}）`);
  const raw = await res.text();
  const head = raw.split(/\r?\n\r?\n/)[0].replace(/\r?\n[ \t]+/g, " ");
  const h = (name: string) => {
    const m = new RegExp(`^${name}:[ \\t]*(.*)$`, "im").exec(head);
    return m ? 見出しの値を読む(m[1].trim()) : "";
  };
  const アドレス = (s: string) => (/<([^>]*)>/.exec(s)?.[1] ?? s).trim().toLowerCase();
  const 名前 = (s: string) => s.replace(/<[^>]*>/, "").replace(/^"|"\s*$/g, "").trim();
  const from = h("From");
  const meta = (await 一覧()).find((m) => m.id === 番号) as (Summary & { sender?: string }) | undefined;
  return {
    送信元の表示名: 名前(from), 送信元のアドレス: アドレス(from), 返信先: アドレス(h("Reply-To")), 戻り先: アドレス(h("Return-Path")),
    封筒の送信元: アドレス(meta?.sender ?? ""),
  };
}

/** 日時を日本時間の「YYYY/MM/DD」にする */
export function 日本時間の日付(d: Date): string {
  const j = new Date(d.getTime() + 9 * 3600_000);
  return j.toISOString().slice(0, 10).replace(/-/g, "/");
}
