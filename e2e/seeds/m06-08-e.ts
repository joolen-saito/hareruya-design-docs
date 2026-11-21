/**
 * M06-08 買取集計データ(検索入力) の追加シード（2026-11-21）。正本: cases/M06-08_seed_data.tsv の FILTER-009・010・012
 *
 * 作り方は seeds/m06-08.ts と同じ（東京店・大阪店は使い回す E2E の店舗 221・5006 で代える・部門は既存の「カード」「サプライ」・買取集計データは DB で試験店舗に作る）。
 * 正本の「全店舗のその日の買取集計データは、書いた行だけ」は、ほかの方の集計データを消さずに、次のように作る:
 * - 期間のほかの店舗（221・5006 以外）の買取集計データが 0 件であることを DB の参照で確かめ、1件でもあれば止める（消さない）。
 * - 試験店舗（221・5006）の期間内の集計だけを消して入れ直す。
 * ほかのケースが同じ期間（2026-09-01〜09-02）の試験店舗の集計を入れ替えるため、この3ケースは単独で流す（config の表に足したい行は review/pending_config_M06.tsv）。
 */
import { SETUP_ADMIN } from "../config/env";
import { 集計データを入れ替える, 管理者IDを探す, 集計行 } from "../db/m06_09_prep";
import { 期間のほかの店舗の集計の件数 } from "../db/m06_08_e";
import { reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { ensureMemberByStoreIdsFix as ensureMemberByStoreIds, ensureStore, 使い回す店舗の入力 } from "../pages/admin/m04_24_reuse_k";
import { defineSeed } from "./current_seed";
import { M0608_ADMIN, 既存の部門, 店名, 店舗の注記, 部門の注記 } from "./m06-08";
import { Browser } from "@playwright/test";

const 役の店舗ID = { A: "221", B: "5006" } as const;
const 集 = (日時: string, 部門ID: string | null, 買取金額: number, 販売金額: number): 集計行 => ({ 日時, 部門ID, 買取金額, 販売金額 });

async function 店舗を用意する(browser: Browser, no: string, 役: "A" | "B", issue: (m: string) => void): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureStore(page, 使い回す店舗の入力(役の店舗ID[役], `M06-08試験店舗${no}${役}`), issue);
  });
}

/** 全店管理者（デフォルト検索表示店舗は全店）と、試験店舗 A・B の買取集計データ */
function 全店のシード(no: string, 期間: [string, string], 行: (s: { カード: string; サプライ: string }) => { 役: "A" | "B"; 行: 集計行 }[]): SeedBuilder {
  return async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const ids: Record<string, string> = {};
    for (const 役 of ["A", "B"] as const) ids[役] = await 店舗を用意する(browser, no, 役, issue);
    const ほか = 期間のほかの店舗の集計の件数(期間[0], 期間[1], [ids.A, ids.B]);
    if (ほか > 0) {
      throw new Error(`${seed.シードID}: 買取集計データが ${期間[0]}〜${期間[1]} に、試験店舗（${ids.A}・${ids.B}）以外の店舗の分で ${ほか} 件ある。`
        + "「全店舗のその期間の集計は書いた行だけ」を作れない（ほかの方の集計データは消さない）");
    }
    const s = { カード: 既存の部門("カード").部門ID, サプライ: 既存の部門("サプライ").部門ID };
    const rows = 行(s);
    for (const 役 of ["A", "B"] as const) 集計データを入れ替える(ids[役], 店名(no, 役), 期間[0], 期間[1], rows.filter((r) => r.役 === 役).map((r) => r.行));
    issue(`買取集計データ（${期間[0]}〜${期間[1]}）は、画面に登録する操作が無いので、DBで試験店舗の期間内の行を消して入れ直した。試験店舗以外の店舗の集計が期間内に 0 件であることを DB の参照で確かめた（内部IDは DB が振る番号）`);
    const account = M0608_ADMIN(no);
    await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
      名前: `M06-08試験管理者${no}`, ログインID: account.loginId, メールアドレス: `${account.loginId}@example.test`, パスワード: account.password,
      権限: "システム管理者", 所属店舗ID: ids.A, デフォルト検索表示店舗ID: "", 編集可能店舗ID: [ids.A, ids.B],
    }));
    const mid = 管理者IDを探す(account.loginId);
    if (!mid) throw new Error(`管理者 ${account.loginId} が見つからない`);
    notes.set(`〔管理者内部ID-M0608-${no}〕`, mid);
    issue(`${店舗の注記}。${部門の注記}。管理者内部ID は画面が振った番号（${mid}）。権限は「システム管理者」で代えた。パスワードは規則（12文字以上）に合う「${account.password}」`);
  };
}

const 九月一日の四件 = (s: { カード: string; サプライ: string }) => [
  { 役: "A" as const, 行: 集("2026-09-01", s.カード, 1000, 3000) }, { 役: "A" as const, 行: 集("2026-09-01", s.カード, 2000, 4000) },
  { 役: "A" as const, 行: 集("2026-09-01", s.サプライ, 400, 500) }, { 役: "B" as const, 行: 集("2026-09-01", s.カード, 600, 700) }];

defineSeed("S-M06-08-FILTER-009", { needs: ["S-M06-08-MASTER"] }, 全店のシード("009", ["2026-09-01", "2026-09-01"], 九月一日の四件));
defineSeed("S-M06-08-FILTER-010", { needs: ["S-M06-08-MASTER"] }, 全店のシード("010", ["2026-09-01", "2026-09-01"], 九月一日の四件));
defineSeed("S-M06-08-FILTER-012", { needs: ["S-M06-08-MASTER"] }, 全店のシード("012", ["2026-09-01", "2026-09-02"], (s) => [
  ...九月一日の四件(s), { 役: "A" as const, 行: 集("2026-09-02", s.カード, 800, 900) }]));
