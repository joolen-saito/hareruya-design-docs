/**
 * 店舗を作らずに、使い回す店舗の表（lib/store_create_ban.ts）から、ケースが求める属性に合う店舗を選ぶ（依頼者 2026-11-15「店舗は作るのもう禁止」）。
 * - 選ぶのは店舗IDで決める（店名では決めない。名前は変えてよいと言われている）。
 * - 店名・支店URLは、選んだ店舗の「いまの値」を店舗の情報（DB の参照）から読む（表の店名は DB に届かないときの代わり）。
 * - 1つのケースの中で、別々の役割の店舗に同じ店舗を当てない（除く に、すでに当てた店舗IDを渡す）。
 * - 元からある店舗（ID 1〜31）は読むだけ。印つきのデータ（受注・在庫・買取）を足すのはよいが、店舗の設定は書き換えない。
 */
import { E2Eの店舗, 元からある店舗, 使い回す店舗 } from "./store_create_ban";
import { available } from "./db";
import { 店舗の保存値 } from "../db/m10_15";
import { いまの店名の一覧 } from "../db/store_pick";

export type 店舗の要求 = {
  本店?: boolean; 公開?: boolean; 開店?: boolean; 売上集計?: boolean;
  /** すでに当てた店舗ID（同じ店舗を別の役割に当てない） */
  除く?: string[];
  /** 区分を指定する（既定は E2E の店舗を先に、足りなければ元からある店舗） */
  区分?: "E2E" | "元から";
};

/** 要求に合う店舗を、E2E の店舗（売上集計の対象外を先に）→元からある店舗の順で、先頭から選ぶ。合うものが無ければ undefined */
export function 店舗を探す(要求: 店舗の要求 = {}): 使い回す店舗 | undefined {
  const 並び: 使い回す店舗[] = [
    ...E2Eの店舗.filter((s) => s.売上集計 === false), ...E2Eの店舗.filter((s) => s.売上集計 === true),
    ...元からある店舗,
  ];
  const 除く = new Set(要求.除く ?? []);
  return 並び.find((s) =>
    !除く.has(s.id)
    && (要求.区分 === undefined || s.区分 === 要求.区分)
    && (要求.本店 === undefined || s.本店 === 要求.本店)
    && (要求.公開 === undefined || s.公開 === 要求.公開)
    && (要求.開店 === undefined || s.開店 === 要求.開店)
    && (要求.売上集計 === undefined || s.売上集計 === 要求.売上集計));
}

/** 要求に合う店舗を選ぶ。無ければ、店舗を作らずに止める（未判定になる） */
export function 店舗を選ぶ(要求: 店舗の要求 = {}, 役割 = "店舗"): 使い回す店舗 {
  const s = 店舗を探す(要求);
  if (!s) throw new Error(`店舗を作らない（依頼者 2026-11-15）: ${役割}に合う店舗が使い回す店舗の表に無い（要求 ${JSON.stringify(要求)}）`);
  return s;
}

/** 店舗IDを指定して取り出す（表に無い店舗は使わない） */
export function 店舗ID(id: string): 使い回す店舗 {
  const s = [...E2Eの店舗, ...元からある店舗].find((x) => x.id === id);
  if (!s) throw new Error(`店舗ID ${id} は使い回す店舗の表に無い（使ってよい店舗ではない）`);
  return s;
}

export type 店舗の実際 = { id: string; 店名: string; 支店URL: string; 本店: boolean };
const 控え = new Map<string, 店舗の実際>();

/** 店舗の保存値（業務の項目名。db/m10_15.ts）。実行の中で1回だけ読んで控える（参照だけ） */
const 値の控え = new Map<string, Record<string, string | null>>();
export function 店舗の値(id: string): Record<string, string | null> {
  const c = 値の控え.get(id);
  if (c) return c;
  const t = 店舗ID(id);
  if (!available) throw new Error(`店舗ID ${id}（${t.店名}）の値を読めない（DB の参照ができない）`);
  const r = 店舗の保存値(id);
  if (!r) throw new Error(`店舗ID ${id} が店舗の情報に無い`);
  値の控え.set(id, r);
  return r;
}

/** 選んだ店舗のいまの店名・支店URL を読む（参照だけ） */
export function 店舗の実際を読む(id: string): 店舗の実際 {
  const c = 控え.get(id);
  if (c) return c;
  const r = 店舗の値(id);
  const v: 店舗の実際 = { id, 店名: r["店名"] ?? 店舗ID(id).店名, 支店URL: r["支店URL"] ?? "", 本店: r["店舗種別"] === "本店" };
  控え.set(id, v);
  return v;
}

/** 画面と比べる店舗の値（郵便番号・住所・電話番号・地図URL・営業時間）。店舗の登録値を読む。空の項目は、比べる値にならないので止める */
export type 試験支店 = { id: string; 店名: string; 支店URL: string; 郵便番号: string; 都道府県: string; 住所1: string; 住所2: string; 電話番号: string; 地図URL: string; 営業時間: string };
function 店舗の項目(id: string, 項目: string): string {
  const v = (店舗の値(id)[項目] ?? "").trim();
  if (!v) throw new Error(`店舗ID ${id}（${店舗の実際を読む(id).店名}）の「${項目}」が空で、画面と比べる値にならない`);
  return v;
}
export const 店舗で表す = (id: string): 試験支店 => ({
  id,
  get 店名() { return 店舗の実際を読む(id).店名; }, get 支店URL() { return 店舗の実際を読む(id).支店URL; },
  get 郵便番号() { const d = 店舗の項目(id, "郵便番号").replace(/\D/g, ""); return d.length === 7 ? `${d.slice(0, 3)}-${d.slice(3)}` : d; },
  get 都道府県() { return 店舗の項目(id, "都道府県"); }, get 住所1() { return 店舗の項目(id, "住所"); }, get 住所2() { return (店舗の値(id)["番地"] ?? "").trim(); },
  get 電話番号() { return 店舗の項目(id, "電話番号"); }, get 地図URL() { return 店舗の項目(id, "Google map埋め込みURL"); }, get 営業時間() { return 店舗の項目(id, "店舗営業時間"); },
});

/** 読み替えの文（reportSeedIssue に渡す） */
export function 読み替えの文(正本の店名: string, s: { id: string; 店名: string }, 理由 = ""): string {
  return `読み替え: 正本の店舗「${正本の店名}」は店舗「${s.店名}」（店舗ID ${s.id}）で表した（依頼者 2026-11-15「店舗は作るのもう禁止」${理由 ? `。${理由}` : ""}）`;
}

/** 表の店舗の店名の読みを実行の中で控える（店名から店舗を探すために1回で全部読む） */
let 店名の控え: Map<string, string> | null = null;
function 表の店名(): Map<string, string> {
  if (!店名の控え) 店名の控え = いまの店名の一覧([...E2Eの店舗, ...元からある店舗].map((s) => s.id));
  return 店名の控え;
}

/** 店名から、使い回す店舗の表の店舗を探す。同じ店名が2店以上、または無ければ止める（作らない） */
export function 店名で使い回す店舗を探す(店名: string): 使い回す店舗 {
  const hit = [...E2Eの店舗, ...元からある店舗].filter((s) => 表の店名().get(s.id) === 店名);
  if (hit.length !== 1) throw new Error(`店舗を作らない（依頼者 2026-11-15）: 店名「${店名}」の使い回す店舗が ${hit.length} 店（1店のはず）`);
  return hit[0];
}

/** 店舗IDのいまの店名。DB が読めない場面（一覧の取り出しなど）では表の店名で代える */
export function 店名を読む(id: string): string {
  try { return 店舗の実際を読む(id).店名; } catch { return 店舗ID(id).店名; }
}
/** 店舗IDのいまの支店URL。DB が読めない場面では空 */
export function 支店URLを読む(id: string): string {
  try { return 店舗の実際を読む(id).支店URL; } catch { return ""; }
}
