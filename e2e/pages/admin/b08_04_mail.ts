/**
 * B08-04 の通知のメールを、開発環境のメールの受け口（E2E_MAIL_URL。開発環境が送るメールを外へ出さずに全部受けるもの）で読む（読むだけ。消さない）。
 * ほかの方の試験のメールも入っているので、件名と宛先と届いた時刻で絞る。
 */
import { MAIL_URL } from "../../config/env";

export const 通知の件名 = "必須項目が空欄である会員の存在を通知するメール";
type 一覧の行 = { id: number; recipients: string[]; subject: string; created_at: string };

async function 一覧(): Promise<一覧の行[]> {
  if (!MAIL_URL) throw new Error("メールの受け口（E2E_MAIL_URL）が無い");
  const res = await fetch(`${MAIL_URL}/messages`);
  if (!res.ok) throw new Error(`メールの受け口の一覧の応答が ${res.status}`);
  return res.json() as Promise<一覧の行[]>;
}

/** 時刻より後に届いた、通知の件名のメール（宛先つき・古い順） */
export async function 届いた通知(後: Date, 宛先: string): Promise<{ 番号: number; 件名: string; 届いた時刻: string; 宛先: string[] }[]> {
  const 宛 = 宛先.toLowerCase();
  return (await 一覧())
    .filter((m) => m.subject === 通知の件名 && Date.parse(m.created_at) > 後.getTime()
      && m.recipients.some((r) => r.replace(/[<>]/g, "").trim().toLowerCase() === 宛))
    .sort((a, b) => a.id - b.id)
    .map((m) => ({ 番号: m.id, 件名: m.subject, 届いた時刻: m.created_at, 宛先: m.recipients }));
}

/** メールの本文（テキスト） */
export async function 本文(番号: number): Promise<string> {
  const res = await fetch(`${MAIL_URL}/messages/${番号}.plain`);
  if (!res.ok) throw new Error(`メール ${番号} の本文の応答が ${res.status}`);
  return res.text();
}

/** 時刻より後に宛先へ届いたメール（件名で絞らない・古い順）。件名そのものを確かめるケースが使う */
export async function 届いたメール(後: Date, 宛先: string): Promise<{ 番号: number; 件名: string; 届いた時刻: string }[]> {
  const 宛 = 宛先.toLowerCase();
  return (await 一覧())
    .filter((m) => Date.parse(m.created_at) > 後.getTime() && m.recipients.some((r) => r.replace(/[<>]/g, "").trim().toLowerCase() === 宛))
    .sort((a, b) => a.id - b.id)
    .map((m) => ({ 番号: m.id, 件名: m.subject, 届いた時刻: m.created_at }));
}
