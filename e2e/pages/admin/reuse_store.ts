/**
 * 試験用の店舗の使い回し（依頼者決定 2026-11-13。一覧の正本は e2e/review/store_cleanup_20261113.md）。
 *
 * - E2E がケースごと・機能ごとに作った試験店舗は片付ける。これからは、試験店舗が要るケースは「試験支店」（M04-19 が作った店舗）を使い回し、
 *   2つの店舗が要るケースは「試験支店」と本店（店舗ID 1）で読み替える。店舗は新しく作らない。
 * - 試験支店・本店の店舗の設定（しきい値・開店/閉店など）は書き換えない（本店は全員が使い、試験支店はほかの機能も使う）。
 * - 正本の店名とは、各ケースのエビデンスの注記（正本の外の補い）で読み替えを残す。
 */
import { available, query } from "../../lib/db";

/** 使い回す試験支店。店舗IDは環境ごとに違うので、支店URL・店名・会社名で探す */
export const 試験支店 = { 店名: "試験支店", 会社名: "試験用会社", 支店URL: "m0419branch", ページ: "/m0419branch" } as const;
/** 本店の店舗ID（どの環境でも 1） */
export const 本店の店舗ID = "1";

let 試験支店のID = "";
/** 試験支店の店舗ID。開発環境の店舗表から、支店URL・店名・会社名がそろう1件を探す。無い・複数なら止める */
export function 試験支店の店舗ID(): string {
  if (試験支店のID) return 試験支店のID;
  if (!available) throw new Error("試験支店の店舗IDを読めない（DB を参照できない環境）");
  const r = query(
    `select id::text as id from dtb_base_info where html_class_name = $1 and shop_name = $2 and company_name = $3 order by id`,
    [試験支店.支店URL, 試験支店.店名, 試験支店.会社名],
  );
  if (r.length !== 1) throw new Error(`使い回す試験支店（支店URL ${試験支店.支店URL}・店名 ${試験支店.店名}・会社名 ${試験支店.会社名}）が ${r.length} 件。1件でないので止める`);
  試験支店のID = String(r[0].id);
  return 試験支店のID;
}

let 本店名 = "";
/** 本店（店舗ID 1）の店名（管理画面の店舗の選択肢・一覧に出る名前） */
export function 本店の店名DB(): string {
  if (本店名) return 本店名;
  if (!available) throw new Error("本店の店名を読めない（DB を参照できない環境）");
  本店名 = String(query(`select shop_name from dtb_base_info where id = 1`)[0]?.shop_name ?? "");
  if (!本店名) throw new Error("本店（店舗ID 1）が無い");
  return 本店名;
}

/** 注記に残す、店名の読み替えの文 */
export const 店名の読み替え = (正本の店名: string, 使う店名: string): string => `正本の店舗「${正本の店名}」は、試験店舗の使い回し（2026-11-13 依頼者決定）で「${使う店名}」に読み替えた`;
