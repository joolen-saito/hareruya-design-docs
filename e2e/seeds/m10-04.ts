/**
 * M10-04 支払方法設定 のシード。正本: cases/M10-04_seed_data.tsv
 * - 支払方法の名称は決め打ちの識別の値なので、実行ごとの印を付ける（rc）。ケースの文の同じ名称も印つきとして読まれる。
 * - 「メール管理の M10-04連携試験テンプレート」は、メール種別を選んで作る重い画面操作になるので作らず、
 *   手元に元からある注文確認（銀行振込）の日本語・英語のテンプレートで代える（ケースはテンプレート名を確かめない）。
 * - 「支払方法が1件も無い」「物理的に取り除く」シードは、開発用のデータを消すことになるので作らない（ZERO-008 は判断待ち）。
 *   名称が存在しない状態は、印つきの名称で成り立つ。
 * 作らないシード: ZERO-008、QJ 系（IT-M10-04-062 は実装しない）、DB 系（正本の投入方法が DB のもの）。
 */
import { Browser, Page, expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { expectSaved } from "../pages/admin/common";
import { PurchaseGroupPage } from "../pages/admin/m03_22_purchase_group";
import { PaymentPage, 画像, 支払方法の入力 } from "../pages/admin/m10_04_payment";
import { 受注を足す, 表示順を最後にする, 表示順を先頭にする } from "../db/m10_04_payment";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1004L_ADMIN: Account = { loginId: "m1004l-admin", password: "Passw0rd!M1004L" };

/** 正本の名称（印は rc で付く） */
export const 名 = {
  p001: () => rc("L001M1004n001連携支払方法"),
  p002: () => rc("L003M1004n002削除対象支払方法"),
  p003前: () => rc("L003M1004n003変更前支払方法"),
  p003後: () => rc("L003M1004n003変更後支払方法"),
  g003: () => rc("L003M1004n003連携購入グループ"),
  p004: () => rc("G004M1004n004一覧確認支払方法"),
  p005: () => rc("G005M1004n005リンク支払方法"),
  p006: () => rc("G006M1004n006一覧表示支払方法"),
  p009: () => rc("G009M1004n009新規登録支払方法"),
  p012: () => rc("G012M1004n012ロゴ登録済み支払方法"),
  p014: () => rc("G014M1004n014ロゴ登録支払方法"),
  p017: () => rc("G017M1004n017ロゴ取消支払方法"),
  p025: () => rc("G025M1004n025保存遷移支払方法"),
  p029: () => rc("G029M1004n029入力検証支払方法"),
  p032: () => rc("G032M1004n032入力検証支払方法"),
  p038: () => rc("G038M1004n038削除対象支払方法"),
  p041: () => rc("G041M1004n041削除競合支払方法"),
  p042: () => rc("G042M1004n042削除トークン支払方法"),
  p059: () => rc("G059M1004n059削除トークン支払方法"),
  p067: () => rc("K067M1004n067手数料0登録支払方法"),
  p068: () => rc("K068M1004n068手数料330登録支払方法"),
};

/** 支払方法を画面から登録して、振られた支払方法IDを返す */
export async function 支払方法を作る(page: Page, v: 支払方法の入力, ロゴ?: string): Promise<string> {
  const p = new PaymentPage(page);
  await p.openNew();
  await p.入れる(v);
  if (ロゴ) {
    await p.ロゴを選ぶ(画像(ロゴ));
    await expect(p.ロゴの値, "ロゴ画像の保管").not.toHaveValue("", { timeout: 60_000 });
  }
  await p.登録を押す();
  await expectSaved(page, `支払方法「${v.方法}」の登録`);
  return p.idFromUrl();
}

defineSeed("S-M10-04-L-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-04連携試験管理者", account: M1004L_ADMIN, メール: "m1004l_admin@example.test" });
});
defineSeed("S-M10-04-L-MAIL", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "メール管理の「M10-04連携試験テンプレート」は作らず、元からある注文確認（銀行振込）の日本語・英語のテンプレートを選ぶ");
});

async function 作る(browser: Browser, v: 支払方法の入力, ロゴ?: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); return 支払方法を作る(page, v, ロゴ); });
}
const 既定 = (方法: string, 英: string): 支払方法の入力 => ({ 方法, 英, 手数料: "0" });

// 名称が存在しない状態（印つきの名称で成り立つ）
defineSeed("S-M10-04-L-PAY-001", async () => {});
for (const id of ["009", "014", "017", "025", "029", "032"]) defineSeed(`S-M10-04-UNREG-${id}`, async () => {});
defineSeed("S-M10-04-CBNEW-067", async () => {});
defineSeed("S-M10-04-CBNEW-068", async () => {});
// 作業フォルダの画像ファイル（テストの中で小さい有効な画像を作って渡す）
for (const id of ["013", "016", "018", "054", "055"]) defineSeed(`S-M10-04-FILE-${id}`, async () => {});

defineSeed("S-M10-04-L-PAY-002", async ({ browser }) => { await 作る(browser, 既定(名.p002(), "L003-delete-en")); });
defineSeed("S-M10-04-L-PAY-003", async ({ browser }) => { await 作る(browser, 既定(名.p003前(), "L003-before-en")); });
defineSeed("S-M10-04-L-GRP-003", { needs: ["S-M10-04-L-PAY-003"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const g = new PurchaseGroupPage(page);
    await g.openNew();
    await g.fill({ 名称日: 名.g003(), 名称英: "L003-group-en", 予約商品フラグ: false, メモ: "" });
    await page.locator('input[type="checkbox"][name="product_sell_group[Payments][]"]').evaluateAll((ns, want) => {
      for (const n of ns as HTMLInputElement[]) n.checked = (n.labels?.item(0)?.textContent?.trim() ?? "") === want;
    }, 名.p003前());
    const r = await g.pressRegister();
    if (!r.sent) throw new Error(`購入グループの登録が止まった: ${r.止めた項目.join(" / ")}`);
    await expectSaved(page, "購入グループの登録");
  });
});
defineSeed("S-M10-04-LIST-004", async ({ browser }) => { await 作る(browser, 既定(名.p004(), "G004M1004n004-en")); });
defineSeed("S-M10-04-LIST-005", async ({ browser }) => { await 作る(browser, 既定(名.p005(), "G005M1004n005-en")); });
defineSeed("S-M10-04-LIST-006", async ({ browser, notes }) => {
  notes.set("〔支払方法ID-M1004-006〕", await 作る(browser, { 方法: 名.p006(), 英: "G006M1004n006-en", 手数料: "250", 上限: "500" }));
});
defineSeed("S-M10-04-LOGO-012", async ({ browser }) => { await 作る(browser, 既定(名.p012(), "G012M1004n012-en"), "G012M1004n012-logo.png"); });
defineSeed("S-M10-04-DEL-038", async ({ browser }) => { await 作る(browser, 既定(名.p038(), "G038M1004n038-en")); });
defineSeed("S-M10-04-DEL-041", async ({ browser }) => { await 作る(browser, 既定(名.p041(), "G041M1004n041-en")); });
defineSeed("S-M10-04-DEL-042", async ({ browser }) => { await 作る(browser, 既定(名.p042(), "G042M1004n042-en")); });
defineSeed("S-M10-04-DEL-059", async ({ browser }) => { await 作る(browser, 既定(名.p059(), "G059M1004n059-en")); });

// ---- 追加分（依頼者の方針 2026-11-10: 既存データ・画面で作ったデータへの読み替え。画面で作れない部分は印つきの支払方法に限ってDBへ書く） ----
const 読み替え = "シード表は「支払方法はこの1件／この3件だけ」と定めるが、支払方法は共有の環境に元からあり、ほかの支払方法を取り除かないので、画面で作った印つきの支払方法の並び・有無だけで確かめる（表示順の値は共有の支払方法の後ろに振られるため、実際の値でなく差で読む）。メール管理の「M10-04連携試験テンプレート」は作らず、元からある注文確認（銀行振込）のテンプレートを選ぶ。画面で作った支払方法は、DBの固定扱いの値が既定のまま（画面の操作の可否には使われていない）";

export const 基本 = (n: string) => ({ 既存: rc(`G${n}M1004n${n}既存支払方法`), 検証: rc(`G${n}M1004n${n}入力検証支払方法`), 途中: rc(`G${n}M1004n${n}入力途中支払方法`) });
/** 並びを確かめるシードの3件（表示順は 丙<乙<甲） */
export const 三件 = (n: string) => ({ 甲: rc(`G${n}M1004n${n}甲`), 乙: rc(`G${n}M1004n${n}乙`), 丙: rc(`G${n}M1004n${n}丙`) });
export const 壱弐参 = () => ({ 壱: rc("G049M1004n049壱"), 弐: rc("G049M1004n049弐"), 参: rc("G049M1004n049参"), 削除済み: rc("G049M1004n049削除済み") });
export const 名追加 = {
  p024: () => rc("G024M1004n024全項目支払方法"),
  p040: () => rc("G040M1004n040関連データ有支払方法"),
  p051: () => rc("G051M1004n051固定扱い支払方法"),
  p066新規: () => rc("G066M1004n066新規支払方法"),
};

/** 1つの管理画面の操作で、順に作る（表示順は登録のたびに最大+1） */
async function 順に作る(browser: Browser, 入力: 支払方法の入力[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const v of 入力) await 支払方法を作る(page, v);
  });
}
/** 丙→乙→甲の順に作る（甲が最大の表示順で一覧の上） */
async function 三件を作る(browser: Browser, n: string): Promise<void> {
  const x = 三件(n);
  await 順に作る(browser, [既定(x.丙, `G${n}-hei-en`), 既定(x.乙, `G${n}-otsu-en`), 既定(x.甲, `G${n}-kou-en`)]);
}

// 入力に誤りがあって登録されないことを確かめるケースの土台（既存の支払方法を1件、画面で作る）
for (const n of ["019", "020", "021", "022", "023", "027", "028", "030", "031", "033", "034", "035", "036", "037", "061", "048"]) {
  defineSeed(`S-M10-04-BASE-${n}`, async ({ browser, seed }) => {
    reportSeedIssue(seed.シードID, 読み替え);
    await 作る(browser, 既定(基本(n).既存, `G${n}M1004n${n}-base-en`));
  });
}
defineSeed("S-M10-04-UNREG-024", async () => {});
defineSeed("S-M10-04-MAILS-024", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "メール管理に専用のテンプレートは作らず、元からある注文確認（銀行振込）の日本語・英語のテンプレートを選ぶ。ほかのメールテンプレートは共有の設定なので削除済みにしない");
});
defineSeed("S-M10-04-MAILS-026", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "メール管理に専用のテンプレート2件は作らず、ほかのメールテンプレートも削除済みにしない（共有の設定）。手元のメール管理の一覧にあるテンプレートと、支払方法の選択肢が一致することで確かめる");
});
for (const n of ["039", "043", "044", "045", "047", "052", "060"]) {
  defineSeed(`S-M10-04-ORD-${n}`, async ({ browser, seed }) => { reportSeedIssue(seed.シードID, 読み替え); await 三件を作る(browser, n); });
}
defineSeed("S-M10-04-ORD-046", async ({ browser, seed }) => {
  reportSeedIssue(seed.シードID, 読み替え);
  await 三件を作る(browser, "046");
  const x = 三件("046");
  表示順を先頭にする(x.甲);
  表示順を最後にする(x.丙);
  reportSeedIssue(seed.シードID, "共有の支払方法が一覧にあるため、DBで甲の表示順をほかのどれより大きく、丙の表示順をほかのどれより小さく設定した（甲を一覧の先頭、丙を末尾にするため）");
});
defineSeed("S-M10-04-ORD-049", async ({ browser, seed }) => {
  reportSeedIssue(seed.シードID, 読み替え);
  const x = 壱弐参();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [名, 英] of [[x.壱, "G049-1-en"], [x.弐, "G049-2-en"], [x.参, "G049-3-en"], [x.削除済み, "G049-deleted-en"]]) await 支払方法を作る(page, 既定(名, 英));
    const p = new PaymentPage(page);
    await p.openList();
    await p.削除を押す(p.行(x.削除済み));
    await p.モーダルで削除する();
    await expectSaved(page, "支払方法の削除");
  });
  reportSeedIssue(seed.シードID, "「削除済み」の支払方法は、画面で作ったあと一覧の削除で取り除いた（このアプリは削除した支払方法の行を残さない）");
});
defineSeed("S-M10-04-DP-MAXORD-066", async ({ browser, seed }) => { reportSeedIssue(seed.シードID, 読み替え); await 三件を作る(browser, "066"); });
defineSeed("S-M10-04-FIX-051", async ({ browser, seed }) => {
  reportSeedIssue(seed.シードID, "画面で作った支払方法は、DBの固定扱いの値が既定で「固定扱い」になる（シード表の「固定扱いはDBで設定」は、すでにその値のため書き込まない）");
  await 作る(browser, 既定(名追加.p051(), "G051M1004n051-en"));
});
defineSeed("S-M10-04-REL-040", async ({ browser, seed }) => {
  reportSeedIssue(seed.シードID, "管理画面に受注を新規登録する画面が無く、フロントの注文は共有の商品の在庫を減らすので、DBで、この印つきの支払方法を設定した受注を1件追加した（購入者名・商品の明細は無い）");
  await 作る(browser, 既定(名追加.p040(), "G040M1004n040-en"));
  受注を足す(名追加.p040());
});
