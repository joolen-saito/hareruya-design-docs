/**
 * 開発環境のメールの受け口（mailcatcher。E2E_MAIL_URL）を読む部品の続き（読むだけ）。
 * lib/mail.ts の「届くのを待つ」に、「届かないこと」「届いた数」「届いた日時」を確かめる読み方を足したもの。
 * 自分の操作で届いたメールだけを見るために、操作の前に控えたメールの番号（mailIds）より後で、宛先が一致するものだけを数える。
 */
import type { BrowserContext, Locator, Page } from "@playwright/test";
import { MAIL_URL } from "../config/env";
import { mailIds, mailText, waitForMailTo } from "../lib/mail";

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

/**
 * 宛先に届いたメールの一覧（番号・宛先・件名・届いた日時）を、同じブラウザの別のタブに表として出す（足した部品。読むだけ）。
 * メールの受け口の画面はアプリの画面ではないので、エビデンスで件名を読めるように、受け口から読んだ内容を表にする。
 * 呼んだ側は、表の件名の欄（件名の欄(番号)）を確かめ、撮ったあとにタブを閉じる。
 */
export async function 受信メールの一覧を出す(context: BrowserContext, 宛先: string, 控え: Set<number>): Promise<{ タブ: Page; 一覧: 届いたメール[]; 件名の欄: (番号: number) => Locator }> {
  const 一覧 = await 宛先に届いたメール(宛先, 控え);
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
  const 行 = 一覧.map((m) => `<tr data-mail-no="${m.番号}"><td>${m.番号}</td><td>${esc(m.宛先.join(", "))}</td><td class="subject">${esc(m.件名)}</td><td>${esc(Number.isNaN(m.届いた日時.getTime()) ? "" : m.届いた日時.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }))}</td></tr>`).join("");
  const タブ = await context.newPage();
  await タブ.setContent(`<html lang="ja"><head><meta charset="utf-8"><title>受信メールの一覧</title></head><body style="font-family:sans-serif;padding:24px">
    <h2>受信メールの一覧（試験の道具がメールの受け口から読んだ、${esc(宛先)} あてのメール。アプリの画面ではない）</h2>
    <p>操作の前に控えたメールの番号より後に、この宛先へ届いたメールだけを出した。</p>
    <table border="1" cellpadding="8" style="border-collapse:collapse;font-size:15px"><tr><th>メールの番号</th><th>宛先</th><th>件名</th><th>届いた日時（日本時間）</th></tr>${行 || '<tr><td colspan="4">届いたメールは無い</td></tr>'}</table>
    </body></html>`);
  return { タブ, 一覧, 件名の欄: (番号: number) => タブ.locator(`tr[data-mail-no="${番号}"] td.subject`) };
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

/**
 * ネット買取の振込完了メールか（件名に「振込完了」があり、本文の【オーダーID】が買取番号（7桁）と一致する）。
 * 宛先だけで数えると別の種類のメールも振込完了メールとして数えてしまうので、種類と対象の買取まで確かめるときに使う
 */
export async function 振込完了メールか(m: 届いたメール, 買取番号7桁: string): Promise<boolean> {
  if (!m.件名.includes("振込完了")) return false;
  return (await mailText(m.番号)).includes(`【オーダーID】${買取番号7桁}`);
}
