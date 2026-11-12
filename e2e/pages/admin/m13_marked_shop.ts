/**
 * M13 のイベント系シードが使う「実行の印つきの店舗」（店舗A・B・C）。
 *
 * 開発環境には店名「店舗A」などの店舗が複数あり、店名で探すと「どれを使うか決められない」で準備が止まる。
 * そこで正本の店名「店舗A」に実行の印を付けた店名（例「店舗A-1AB2C」）の店舗を店舗登録画面から新しく作り、
 * 控えた店舗ID・店名を使う（依頼者決定 2026-11-11「店舗Aは新しく作って印をつけていい」）。
 * 店舗を足すだけで、既存の店舗・共有のマスタは変えない。同名が複数なら止まる動き（findTenantId）はそのまま。
 */
import { Page } from "@playwright/test";
import { rc, RUN_MARK } from "../../lib/run_marker";
import { createTenant, findTenantId, TenantInput } from "./tenant";

export type 印店キー = "A" | "B" | "C";

/** 正本の店名「店舗A」に実行の印を付けた店名 */
export const 印店名 = {
  A: rc("店舗A"),
  B: rc("店舗B"),
  C: rc("店舗C"),
};

const KANA: Record<印店キー, string> = { A: "テンポエー", B: "テンポビー", C: "テンポシー" };

/** 店名略称（3文字・店舗間で重複不可）の候補。乱数で作り、重複で登録できなければ別の候補で作り直す */
function 略称候補(): string {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 3 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

/**
 * 印つきの店舗があれば使い、無ければ店舗登録画面で新しく作る。店舗一覧に表示された店舗IDを返す。
 * 店名略称の重複などで登録できなかったときは、略称を変えて数回やり直す。登録は行われたが成功が表示されなかったときは onIssue で知らせる。
 */
export async function ensureMarkedTenant(page: Page, key: 印店キー, onIssue: (message: string) => void): Promise<string> {
  const 店名 = 印店名[key];
  const exist = await findTenantId(page, 店名);
  if (exist) return exist;
  let failure = "";
  for (let i = 0; i < 6; i++) {
    const v: TenantInput = {
      店名, 店名カナ: KANA[key], 店名英語: `Shop ${key}`, 支店URL: `m13${key.toLowerCase()}${RUN_MARK.toLowerCase()}`,
      店名略称3文字: 略称候補(), ショップ名略称: 店名,
    };
    try {
      await createTenant(page, v);
    } catch (e) {
      failure = (e as Error).message.split("\n")[0];
    }
    const id = await findTenantId(page, 店名);
    if (id) {
      if (failure) onIssue(`店舗登録画面で「${店名}」を登録したとき、登録は行われたが画面は成功を表示しなかった（${failure}）`);
      onIssue(`正本の店名「店舗${key}」は開発環境に同名の店舗が複数あって決められないため、実行の印つきの店舗「${店名}」を新しく作って使った（店舗ID ${id}）`);
      return id;
    }
  }
  throw new Error(`店舗「${店名}」を登録できない: ${failure || "店舗一覧に出ない"}`);
}
