/**
 * M13 のイベント系シードが使う店舗A・B・C・新宿店・池袋店（正本の店名）に当てる、使い回す店舗。
 *
 * 依頼者決定 2026-11-15「店舗は作るのもう禁止。それ以上は絶対店舗増やさないで」により、店舗は作らず、E2E が使ってよい店舗の表
 * （lib/store_create_ban.ts）から店舗IDで選ぶ。以前は「店舗A-E2E」などの決まった印の店舗を、無ければ店舗登録画面で作っていた。
 * 店舗の設定は書き換えない（読むだけ）。イベント・メンバーの権限など、店舗にぶら下がるデータを足すだけ。
 *
 * 当て方（1つの機能のケースの中で、別々の役割の店舗に同じ店舗を当てない。店舗A・B・C は同じ機能で同時に使う）:
 *   店舗A・新宿店 = 店舗ID 221（E2E の店舗）、店舗B・池袋店 = 店舗ID 4973（E2E の店舗）、店舗C = 店舗ID 2（元からある店舗「成田店」）。
 *   新宿店・池袋店を使う機能（M13-06・08・11）は、店舗A・B・C を同じケースで使わない。
 */
import { Page } from "@playwright/test";
import { E2Eの店舗, 元からある店舗 } from "../../lib/store_create_ban";
import { 店舗IDで選ぶ } from "./store_pick";

export type 印店キー = "A" | "B" | "C" | "新宿" | "池袋";

const 店舗ID: Record<印店キー, string> = { A: "221", B: "4973", C: "2", 新宿: "221", 池袋: "4973" };
const 表 = [...E2Eの店舗, ...元からある店舗];
const 店名の値 = (k: 印店キー): string => {
  const s = 表.find((x) => x.id === 店舗ID[k]);
  if (!s) throw new Error(`店舗ID ${店舗ID[k]} が店舗の表に無い`);
  return s.店名;
};

/** 店舗A・B・C・新宿店・池袋店に当てた店舗の店名（店名を画面の選択肢で選ぶ値。実行をまたいで同じ） */
export const 印店名 = {
  A: 店名の値("A"),
  B: 店名の値("B"),
  C: 店名の値("C"),
  新宿: 店名の値("新宿"),
  池袋: 店名の値("池袋"),
};
/** 店舗の店舗ID（表のとおり） */
export const 印店ID = 店舗ID;

/** 正本の店名（注記に出す） */
const 正本の店名: Record<印店キー, string> = { A: "店舗A", B: "店舗B", C: "店舗C", 新宿: "新宿店", 池袋: "池袋店" };

/**
 * 当てた店舗が店舗一覧にあり、店名が表のとおりであることを確かめ、店舗IDを返す（店舗は作らない）。
 * 読み替えを onIssue に残す。
 */
export async function ensureMarkedTenant(page: Page, key: 印店キー, onIssue: (message: string) => void): Promise<string> {
  const s = await 店舗IDで選ぶ(page, 店舗ID[key], 正本の店名[key], onIssue);
  return s.id;
}
