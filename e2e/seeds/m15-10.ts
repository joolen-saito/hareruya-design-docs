/**
 * M15-10 アーキタイプ登録CSV のシードの作り方（画面操作）。正本: cases/M15-10_seed_data.tsv
 *
 * - 管理者は、メンバー管理の画面で登録する（権限は、ほかの機能の試験管理者と同じ「システム管理者」。デッキ管理だけの権限は作っていない）。
 * - マスタ（フォーマット Pioneer・Modern、カラー 赤青白緑黒）は、DBで「ある」ことを確かめる。無いときは止める（登録はしない）。
 *   UnknownFormat・未定義色A・未定義色B が「ある」ときも止める（開発用のマスタは画面から消さない。判断待ち）。
 * - CSV の取込ファイルは、シード表の状態・属性のとおりの中身を spec が作る（名前は実行の印つき。ファイル名は正本のまま）。
 * - 既存のアーキタイプは、アーキタイプ編集画面で登録する。名前は実行の印つきなので、事前の「同じ名前を消す」は要らない（残りと重ならない）。
 * - 「削除済みを含め0件」は、実行の印つきの名前を使うので成り立つ（DB投入での削除は行わない。条件付き）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { RUN_MARK, rc } from "../lib/run_marker";
import { カラーがある, フォーマットがある, フォーマットの日本語名 } from "../db/m15_10_archetype";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { ensureFormatByName } from "../pages/admin/m14_card";
import { アーキタイプを削除する, アーキタイプを登録する } from "../pages/admin/m15_10_archetype";

export const M1510_ADMIN: Account = { loginId: "m1510_admin", password: "Passw0rd!M1510" };
export const M1510L_ADMIN: Account = { loginId: "m1510l_admin", password: "Passw0rd!M1510L" };

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** 実行の印つきの値 */
export const 印 = (v: string) => rc(v);
/** フォーマット名は半角英数字だけの欄なので、ハイフン無しで印を付ける */
export const 連携名 = (n: "FmtM1510L001" | "FmtM1510L002" | "FmtM1510L003" | "ArcM1510L001" | "ArcM1510L002" | "ArcM1510L003") => `${n}${RUN_MARK}`;
export const PIONEER = "Pioneer";

defineSeed("S-M15-10-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-10試験管理者", account: M1510_ADMIN, メール: "m1510_admin@example.test" });
});
defineSeed("S-M15-10-L-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-10連携試験管理者", account: M1510L_ADMIN, メール: "m1510l_admin@example.test" });
});

defineSeed("S-M15-10-MASTER", { needs: ["S-M15-10-ADM"] }, async () => {
  for (const f of [PIONEER, "Modern"]) if (!フォーマットがある(f)) throw new Error(`フォーマット名(英)「${f}」が手元の環境に無い（登録は行わない。判断待ち）`);
  if (フォーマットがある("UnknownFormat")) throw new Error("フォーマット名(英)「UnknownFormat」が手元の環境にある（正本は未登録を求める。開発用のマスタなので画面からも消さない。判断待ち）");
  for (const c of ["赤", "青", "白", "緑", "黒"]) if (!カラーがある(c)) throw new Error(`カラー「${c}」が手元の環境に無い（登録は行わない。判断待ち）`);
  for (const c of ["未定義色A", "未定義色B"]) if (カラーがある(c)) throw new Error(`カラー「${c}」が手元の環境にある（正本は未登録を求める。開発用のマスタなので消さない。判断待ち）`);
});
defineSeed("S-M15-10-L-COLOR", { needs: ["S-M15-10-L-ADM"] }, async () => {
  for (const c of ["赤", "青", "白", "緑", "黒"]) if (!カラーがある(c)) throw new Error(`カラー「${c}」が手元の環境に無い（登録は行わない。判断待ち）`);
});

// カード画像（Test Card の画像）は、画面から登録できないため作らない（カード画像の登録画面・操作が無い）。
// 使うケース（042・045）は、手元に「Unknown Card」という名前のカードが無い状態で取り込み、代表カード画像が未設定のままになることを確かめる（条件付き）。
defineSeed("S-M15-10-CARD-IMAGES", { needs: ["S-M15-10-ADM"] }, async () => {
  reportSeedIssue("S-M15-10-CARD-IMAGES", "Test Card の画像は画面から登録できないため作らなかった（このシードを使うケースは、画像が無い状態で確かめる）");
});

// ---- 取込ファイルだけで成り立つもの（中身は spec が作る） ----
for (const id of ["CSV-NEW-004", "CSV-NEW-005", "FORMAT-UNKNOWN-017", "FORMAT-UNKNOWN-018", "NORMALIZED-027", "ROLLBACK-028", "CSRF-MISSING-029", "CSRF-TAMPER-030", "TWICE-040", "CBARC-041"]) {
  defineSeed(`S-M15-10-${id}`, { needs: ["S-M15-10-ADM", "S-M15-10-MASTER"] }, async () => { /* 作るものは無い（取込ファイルは spec が作る） */ });
}

// ---- 既存のアーキタイプを画面で登録する ----
function 既存(seedId: string, key: string, 定義: { 日: string; 英: string; フォーマット英名?: string; 公開状態?: "公開" | "非公開"; カラー?: string[]; 削除する?: boolean }[]): void {
  defineSeed(seedId, { needs: ["S-M15-10-ADM", "S-M15-10-MASTER"] }, async ({ browser, notes }) => {
    const pioneer = フォーマットの日本語名(PIONEER)!;
    await 管理画面(browser, async (p) => {
      for (const [i, d] of 定義.entries()) {
        const fmt = d.フォーマット英名 ? フォーマットの日本語名(d.フォーマット英名)! : pioneer;
        const id = await アーキタイプを登録する(p, { 日: d.日, 英: d.英, フォーマット: fmt, 公開状態: d.公開状態 ?? "非公開", カラー: d.カラー });
        if (d.削除する) await アーキタイプを削除する(p, id);
        notes.set(`〔アーキタイプID-M1510-${key}${定義.length > 1 ? "AB"[i] : ""}〕`, id);
      }
    });
  });
}
export const 既存名 = {
  "006": { 日: 印("既存JP-006"), 英: 印("Existing EN-006") },
  "008": { 日: 印("基準JP"), 英: 印("Base EN") },
  "013": { 日: 印("既存JP-M1510-013"), 英: 印("Existing EN-M1510-013") },
  "014": { 日: 印("既存JP-M1510-014"), 英: 印("Existing EN-M1510-014") },
  "015A": { 日: 印("空色JP"), 英: 印("BlankColorEN") },
  "015B": { 日: 印("カンマ色JP"), 英: 印("CommaColorEN") },
  "016": { 日: 印("既存JP-016"), 英: 印("Existing EN-016") },
  "038": { 日: 印("既存混在JP-M1510-038"), 英: 印("Mixed-Existing-EN-M1510-038") },
  "042": { 日: 印("既存JP-M1510-CB042"), 英: 印("Existing EN-M1510-CB042") },
  "045": { 日: 印("削除済JP-M1510-CB045"), 英: 印("Deleted EN-M1510-CB045") },
} as const;
既存("S-M15-10-UPDATE-BLANK-006", "006", [{ ...既存名["006"] }]);
既存("S-M15-10-NONMATCH-008", "008", [{ ...既存名["008"] }]);
既存("S-M15-10-COLOR-REPLACE-013", "013", [{ ...既存名["013"], カラー: ["赤"] }]);
既存("S-M15-10-COLOR-PARTIAL-014", "014", [{ ...既存名["014"], カラー: ["赤"] }]);
既存("S-M15-10-COLOR-PRESERVE-015", "015", [{ ...既存名["015A"], カラー: ["緑"] }, { ...既存名["015B"], カラー: ["黒"] }]);
既存("S-M15-10-COLOR-INVALID-016", "016", [{ ...既存名["016"], カラー: ["赤"] }]);
既存("S-M15-10-MIX-038", "038", [{ ...既存名["038"] }]);
既存("S-M15-10-CBARC-042", "042", [{ ...既存名["042"], カラー: ["赤"] }]);
既存("S-M15-10-CBARC-045", "045", [{ ...既存名["045"], カラー: ["赤"], 削除する: true }]);

// ---- 連携（取り込んだものが、デッキ一覧・アーキタイプ管理に現れる） ----
for (const [n, k] of [["034", "FmtM1510L001"], ["035", "FmtM1510L002"], ["036", "FmtM1510L003"]] as const) {
  defineSeed(`S-M15-10-L-FMT-${n}`, { needs: ["S-M15-10-L-ADM"] }, async ({ browser }) => {
    await 管理画面(browser, async (p) => { await ensureFormatByName(p, { 名日: 連携名(k), 名英: 連携名(k), コード: "", 並び順: `96${n.slice(1)}` }, "M15-10連携", (m) => reportSeedIssue(`S-M15-10-L-FMT-${n}`, m)); });
  });
}
for (const n of ["034", "035"]) {
  defineSeed(`S-M15-10-L-NOARC-${n}`, { needs: ["S-M15-10-L-ADM"] }, async () => { /* 実行の印つきの名前なので、削除済みを含め0件で始まる */ });
}
defineSeed("S-M15-10-L-ARC-036", { needs: ["S-M15-10-L-ADM", "S-M15-10-L-COLOR", "S-M15-10-L-FMT-036"] }, async ({ browser }) => {
  await 管理画面(browser, async (p) => { await アーキタイプを登録する(p, { 日: 連携名("ArcM1510L003"), 英: 連携名("ArcM1510L003"), フォーマット: 連携名("FmtM1510L003"), 公開状態: "非公開", カラー: ["赤"] }); });
});
for (const n of ["034", "035", "036"]) {
  defineSeed(`S-M15-10-L-CSV-${n}`, { needs: [`S-M15-10-L-FMT-${n}`] }, async () => { /* 取込ファイルは spec が作る */ });
}
