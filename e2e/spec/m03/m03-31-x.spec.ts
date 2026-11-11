/**
 * M03-31 セール用価格変更CSV登録の続き（-x）。正本: cases/M03-31_test_cases.tsv
 * 実施不可の見直し（仕分け直し recheck2）で流せる見込みになったケースのうち、カードのマスタ・割引率のマスタを足さずに作れるもの（記録 review/M03-31_progress_2026-11-11_dev.md）。
 * シード（seeds/m03-31-x.ts）は画面で商品・商品規格を作り、画面で作れない状態（規格の状態 SP・販売価格・価格履歴の0件・廃止）だけを E2E の行に DB で書き足す。
 * 取込ファイル名には実行の印を付けている（取込履歴をファイル名で数えるため）。商品コード・商品名にも実行の印を付けている。
 */
import { Page, test } from "@playwright/test";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import * as price from "../../db/m03_30_price";
import * as x30 from "../../db/m03_30_x";
import { PriceCsvUploadPage, priceCsvUploadPath, 画面上部のメッセージ } from "../../pages/admin/m03_30_price_csv";
import { PriceHistoryPage } from "../../pages/admin/m03_23_price_history";
import { searchStockByCode } from "../../pages/admin/m04_02_rc_stock";
import { 在庫の行の価格 } from "../../pages/admin/m03_30_x";
import { 規格の表示, 規格の表示を読む } from "../../pages/admin/m03_31_x";
import { openClassEdit } from "../../pages/admin/m03_30_products";
import { classRowsFromProductEdit, openProductEditByCode } from "../../pages/admin/m03_23_seed_products";
import { BELT, M0331_ADMIN } from "../../seeds/m03-31";
import { RB_ADMIN, RB_ADMIN_NAME, RBの, 作ったものの, 本店の店名 } from "../../seeds/m03-31-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

type メッセージ = { 成功: string[]; エラー: string[]; 警告: string[]; ダイアログ: string[] };

/** 取込ファイルを選んで「CSVファイルのアップロード」を押し、画面上部のメッセージとブラウザのダイアログの文を返す（送信が止まったら落とす） */
async function 取り込む(page: Page, upload: PriceCsvUploadPage, ファイル: string): Promise<メッセージ> {
  const ダイアログ: string[] = [];
  const onDialog = (d: import("@playwright/test").Dialog) => { ダイアログ.push(d.message()); d.accept().catch(() => {}); };
  page.on("dialog", onDialog);
  try {
    await upload.choose(ファイル);
    const r = await upload.submit();
    expect(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた（送られないと手順を実行できない）").toBe(true);
    const m = await 画面上部のメッセージ(page);
    note(`取込の要求の応答: ${r.sent ? r.status : "送られない"}・移った画面: ${new URL(page.url()).pathname}・成功「${m.成功.join("」「") || "なし"}」・エラー「${m.エラー.join("」「") || "なし"}」・警告「${m.警告.join("」「") || "なし"}」${ダイアログ.length ? `・ダイアログ「${ダイアログ.join("」「")}」` : ""}`);
    return { ...m, ダイアログ };
  } finally { page.off("dialog", onDialog); }
}
async function 開く(page: Page): Promise<PriceCsvUploadPage> {
  await loginAdmin(page, M0331_ADMIN);
  return new PriceCsvUploadPage(page, "セール用価格変更");
}
const 規格 = (規格ID: string): price.商品規格の状態 => {
  const v = price.商品規格(規格ID);
  if (!v) throw new Error(`商品規格ID ${規格ID} が無い`);
  return v;
};
const 見る = (v: price.商品規格の状態) => ({ セールフラグ: v.セールフラグ, 基準価格: v.基準価格, 販売価格: v.販売価格, 買取価格: v.買取価格 });
const 値 = (セールフラグ: boolean, 基準価格: string, 販売価格: string, 買取価格: string) => ({ セールフラグ, 基準価格, 販売価格, 買取価格 });
const 全部の文 = (m: メッセージ) => [...m.成功, ...m.エラー, ...m.警告, ...m.ダイアログ];

// ---- 001〜003・005・054・078（取り込んで、規格のセールフラグ・価格を確かめる） ----
function 規格を見る(seedId: string, 期待: ReturnType<typeof 値>, 説明: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const k = s.商品[0].規格[0];
    const upload = await 開く(page);
    let got!: ReturnType<typeof 見る>;
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
    await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
    await step(4, async () => { got = 見る(規格(k.商品規格ID)); note(`取込のあとの規格（商品規格ID ${k.商品規格ID}）: ${JSON.stringify(got)}`); });
    await expected(async () => { expect.soft(got, 説明).toEqual(期待); });
  };
}
caseTest("IT-M03-31-001", 規格を見る("S-M03-31-DATA-001", 値(true, "2000", "1234", "777"), "セールフラグ有効・販売価格1234・買取価格777・基準価格2000のまま"));
caseTest("IT-M03-31-002", 規格を見る("S-M03-31-DATA-002", 値(true, "2000", "1333", "666"), "セールフラグ有効のまま・販売価格1333・買取価格666・基準価格2000のまま"));
caseTest("IT-M03-31-003", 規格を見る("S-M03-31-DATA-003", 値(false, "2000", "2000", "700"), "セールフラグ無効・販売価格が基準価格2000で上書き（CSVの9999は反映されない）・買取価格700"));
caseTest("IT-M03-31-005", 規格を見る("S-M03-31-DATA-005", 値(false, "2000", "2000", "500"), "セールフラグ無効のまま・基準価格と販売価格が2000のまま"));
caseTest("IT-M03-31-054", 規格を見る("S-M03-31-DATA-054", 値(true, "2000", "1500", "500"), "ゼロ幅空白を除いた商品IDの規格へCSVの値（販売価格1500・買取価格500・セールフラグ有効）が反映される"));
caseTest("IT-M03-31-078", 規格を見る("S-M03-31-DPDATA-078", 値(true, "2000", "1000", "1000"), "エラーにならず、セールフラグ有効・販売価格1000・買取価格1000"));
caseTest("IT-M03-31-070", 規格を見る("S-M03-31-DATA-070", 値(false, "2000", "2000", "500"), "販売価格2000・買取価格500・セールフラグ0のまま"));

// ---- 004・006（画面のアラート） ----
function アラートを見る(seedId: string, 合う: (t: string) => boolean, 説明: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const upload = await 開く(page);
    let m!: メッセージ;
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
    await step(3, async () => { m = await 取り込む(page, upload, s.ファイル); });
    await expected(async () => { expect.soft(全部の文(m).filter(合う).length, 説明).toBeGreaterThan(0); });
  };
}
const 反映されない旨 = (t: string) => /販売価格/.test(t) && /反映され(てい)?ない|反映されません/.test(t);
const 通常商品の旨 = (t: string) => /通常商品/.test(t) && /販売価格/.test(t) && /変更(でき|され)/.test(t);
caseTest("IT-M03-31-004", アラートを見る("S-M03-31-DATA-004", 反映されない旨, "CSVの販売価格が反映されていない旨のアラートの数"));
caseTest("IT-M03-31-006", アラートを見る("S-M03-31-DATA-006", 通常商品の旨, "通常商品の販売価格を変更できない旨のアラートの数"));

// ---- 045・069（エラー一覧） ----
function エラー一覧を見る(seedId: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const upload = await 開く(page);
    let m!: メッセージ;
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
    await step(3, async () => { m = await 取り込む(page, upload, s.ファイル); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "取込のあとの画面（セール用価格変更CSVアップロード画面）").toBe(priceCsvUploadPath("セール用価格変更"));
      await expect.soft(upload.取込ファイル, "セール用価格変更CSVアップロード画面の取込ファイルの欄").toHaveCount(1);
      expect.soft(m.エラー.length, "画面のエラー一覧の件数").toBeGreaterThan(0);
    });
  };
}
caseTest("IT-M03-31-045", エラー一覧を見る("S-M03-31-DATA-045"));
caseTest("IT-M03-31-069", エラー一覧を見る("S-M03-31-DATA-069"));

// ---- 017〜019・079（価格履歴） ----
function 履歴を見る(seedId: string, 期待: Partial<x30.価格履歴> | null) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const k = s.商品[0].規格[0];
    const upload = await 開く(page);
    let rows: x30.価格履歴[] = [];
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
    await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
    await step(4, async () => { rows = x30.価格履歴の行(k.商品規格ID); note(`取込のあとの価格履歴: ${JSON.stringify(rows)}`); });
    await expected(async () => {
      if (期待 === null) { expect.soft(rows.length, "規格の価格履歴の件数（0件のまま）").toBe(0); return; }
      expect.soft(rows.length, "規格の価格履歴の件数（1件追加）").toBe(1);
      const r = rows[rows.length - 1] ?? ({} as x30.価格履歴);
      const want = { ...期待, 登録者ID: x30.メンバーID(M0331_ADMIN.loginId) };
      const gotPick = Object.fromEntries(Object.keys(want).map((key) => [key, (r as Record<string, string>)[key]]));
      expect.soft(gotPick, "価格履歴の値と操作した担当者").toEqual(want);
    });
  };
}
caseTest("IT-M03-31-017", 履歴を見る("S-M03-31-DATA-017", { 変更前販売価格: "1500", 販売価格: "1600", 変更前買取価格: "", 買取価格: "" }));
caseTest("IT-M03-31-018", 履歴を見る("S-M03-31-DATA-018", { 変更前販売価格: "", 販売価格: "", 変更前買取価格: "500", 買取価格: "600" }));
caseTest("IT-M03-31-019", 履歴を見る("S-M03-31-DATA-019", null));
caseTest("IT-M03-31-079", 履歴を見る("S-M03-31-DPDATA-079", { 変更前販売価格: "1500", 販売価格: "1600", 変更前買取価格: "500", 買取価格: "600" }));

caseTest("IT-M03-31-080", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-31-DPDATA-080");
  const [a, b] = s.商品[0].規格;
  const upload = await 開く(page);
  let ra: x30.価格履歴[] = []; let rb: x30.価格履歴[] = [];
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
  await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
  await step(4, async () => {
    ra = x30.価格履歴の行(a.商品規格ID); rb = x30.価格履歴の行(b.商品規格ID);
    note(`規格A（${a.商品規格ID}）の価格履歴: ${JSON.stringify(ra)}・規格B（${b.商品規格ID}）の価格履歴: ${JSON.stringify(rb)}`);
  });
  await expected(async () => {
    expect.soft(ra.length, "規格Aの価格履歴の件数（1件追加）").toBe(1);
    expect.soft(ra[0] ? { 変更前販売価格: ra[0].変更前販売価格, 販売価格: ra[0].販売価格 } : null, "規格Aの価格履歴の販売価格（変更前1500・変更後1600）").toEqual({ 変更前販売価格: "1500", 販売価格: "1600" });
    expect.soft(rb.length, "規格Bの価格履歴の件数（追加されない）").toBe(0);
  });
});

// ---- 020・029（取込履歴） ----
function 取込履歴を見る(seedId: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const upload = await 開く(page);
    let n = -1;
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
    await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
    await step(4, async () => { n = price.取込履歴の件数("セール用価格変更", s.ファイル名); note(`取込履歴（${s.ファイル名}）: ${n} 件`); });
    await expected(async () => { expect.soft(n, `ファイル名「${s.ファイル名}」の取込履歴の件数（1件追加）`).toBe(1); });
  };
}
caseTest("IT-M03-31-020", 取込履歴を見る("S-M03-31-DATA-020"));
caseTest("IT-M03-31-029", 取込履歴を見る("S-M03-31-DATA-029"));

// ---- 049・050（不備行による巻き戻し） ----
caseTest("IT-M03-31-049", async ({ page, step, expected, notes }) => {
  const s = 作ったものの("S-M03-31-DATA-049");
  const a = s.商品[0];
  const upload = await 開く(page);
  const 前 = 規格(a.規格[0].商品規格ID); const 前タグ = price.商品タグのID(a.商品ID);
  note(`取込の前の商品Aの規格: ${JSON.stringify(前)}・商品タグ: ${前タグ.join(",")}`);
  let 後!: price.商品規格の状態; let 後タグ: string[] = [];
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
  await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
  await step(4, async () => { 後 = 規格(a.規格[0].商品規格ID); 後タグ = price.商品タグのID(a.商品ID); note(`取込のあとの商品Aの規格: ${JSON.stringify(後)}・商品タグ: ${後タグ.join(",")}`); });
  await expected(async () => {
    const 更新前 = { 販売価格: "2000", 買取価格: "500", 帯URL: BELT.before, セールフラグ: false };
    expect.soft({ 販売価格: 後.販売価格, 買取価格: 後.買取価格, 帯URL: 後.帯URL, セールフラグ: 後.セールフラグ }, "商品Aの販売価格・買取価格・帯URL・セールフラグ（更新前の状態）").toEqual(更新前);
    expect.soft(後タグ, "商品Aの商品タグ（更新前タグだけ）").toEqual([notes.get("〔タグID-M0331-共有A〕")]);
  });
});
caseTest("IT-M03-31-050", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-31-DATA-050");
  const b = s.商品[1];
  const upload = await 開く(page);
  const 前 = 規格(b.規格[0].商品規格ID);
  note(`取込の前の商品Bの規格: ${JSON.stringify(前)}`);
  let 後!: price.商品規格の状態;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
  await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
  await step(4, async () => { 後 = 規格(b.規格[0].商品規格ID); note(`取込のあとの商品Bの規格: ${JSON.stringify(後)}`); });
  await expected(async () => {
    expect.soft(後, "不備行より後にある商品Bの規格（更新前の状態から変更されない）").toEqual(前);
    expect.soft({ 販売価格: 前.販売価格, 買取価格: 前.買取価格, 帯URL: 前.帯URL, セールフラグ: 前.セールフラグ }, "取込の前の商品Bの規格（事前準備のとおり）").toEqual({ 販売価格: "2000", 買取価格: "500", 帯URL: BELT.before, セールフラグ: false });
  });
});

// ---- 077（3行の取込） ----
caseTest("IT-M03-31-077", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-31-DPDATA-077");
  const upload = await 開く(page);
  let got: ReturnType<typeof 見る>[] = []; let n = -1;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
  await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
  await step(4, async () => {
    got = s.商品.map((p) => 見る(規格(p.規格[0].商品規格ID)));
    n = price.取込履歴の件数("セール用価格変更", s.ファイル名);
    note(`取込のあとの3商品の規格: ${JSON.stringify(got)}・取込履歴（${s.ファイル名}）${n} 件`);
  });
  await expected(async () => {
    expect.soft(got[0], "商品Aの規格（セールフラグ有効・販売価格1300・買取価格700）").toEqual(値(true, "2000", "1300", "700"));
    expect.soft(got[1], "商品Bの規格（セールフラグ有効・販売価格1400・買取価格800）").toEqual(値(true, "2000", "1400", "800"));
    expect.soft(got[2], "商品Cの規格（セールフラグ有効・販売価格1500・買取価格900）").toEqual(値(true, "2000", "1500", "900"));
    expect.soft(n, "取込履歴の件数（1件追加）").toBe(1);
  });
});

// ---- 081（商品タグ） ----
caseTest("IT-M03-31-081", async ({ page, step, expected, notes }) => {
  const s = 作ったものの("S-M03-31-DPDATA-081");
  const upload = await 開く(page);
  const 前 = price.商品タグのID(s.商品[0].商品ID);
  note(`取込の前の商品タグ: ${前.join(",") || "なし"}`);
  let 後: string[] = [];
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
  await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
  await step(4, async () => { 後 = price.商品タグのID(s.商品[0].商品ID); note(`取込のあとの商品タグ: ${後.join(",") || "なし"}`); });
  await expected(async () => {
    const want = [notes.get("〔タグID-M0331-共有B〕"), notes.get("〔タグID-M0331-共有C〕")].sort((p, q) => Number(p) - Number(q));
    expect.soft([...後].sort((p, q) => Number(p) - Number(q)), "商品タグがCSVで指定した2件").toEqual(want);
  });
});

// ---- 082・083（同じファイルを2回） ----
caseTest("IT-M03-31-082", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-31-DPDATA-082");
  const k = s.商品[0].規格[0];
  const upload = await 開く(page);
  let got!: ReturnType<typeof 見る>; let 履歴: x30.価格履歴[] = []; let n = -1;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
  await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
  await step(4, async () => { await upload.choose(s.ファイル); });
  await step(5, async () => { await 取り込む(page, upload, s.ファイル); });
  await step(6, async () => {
    got = 見る(規格(k.商品規格ID)); 履歴 = x30.価格履歴の行(k.商品規格ID); n = price.取込履歴の件数("セール用価格変更", s.ファイル名);
    note(`2回のあとの規格: ${JSON.stringify(got)}・価格履歴: ${JSON.stringify(履歴)}・取込履歴 ${n} 件`);
  });
  await expected(async () => {
    expect.soft(got, "規格（セールフラグ有効・販売価格1300・買取価格700のまま）").toEqual(値(true, "2000", "1300", "700"));
    expect.soft(履歴.length, "価格履歴の件数（1件のまま）").toBe(1);
    expect.soft(n, "取込履歴の件数（2件）").toBe(2);
  });
});
caseTest("IT-M03-31-083", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-31-DPDATA-083");
  const k = s.商品[0].規格[0];
  const upload = await 開く(page);
  let m2!: メッセージ; let got!: ReturnType<typeof 見る>;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await upload.choose(s.ファイル); note(`取込ファイル: ${s.ファイル名}`); });
  await step(3, async () => { await 取り込む(page, upload, s.ファイル); });
  await step(4, async () => { await upload.choose(s.ファイル); });
  await step(5, async () => { m2 = await 取り込む(page, upload, s.ファイル); });
  await step(6, async () => { got = 見る(規格(k.商品規格ID)); note(`2回のあとの規格: ${JSON.stringify(got)}`); });
  await expected(async () => {
    expect.soft(全部の文(m2).filter(通常商品の旨).length, "2回目のアップロード後の、通常商品の販売価格は変更できない旨のアラートの数").toBeGreaterThan(0);
    expect.soft(got, "規格（セールフラグ無効・販売価格2000（基準価格のまま）・買取価格700）").toEqual(値(false, "2000", "2000", "700"));
  });
});

// ---- 084・096〜098（買取/販売価格履歴検索/一覧で見る） ----
const 金額 = (v: string | undefined) => (v ?? "").replace(/[,円￥\s]/g, "");
function 価格履歴の検索で見る(seedId: string, 期待: { 変更前販売価格: string; 変更後販売価格: string; 変更前買取価格: string; 変更後買取価格: string }) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = RBの(seedId);
    await loginAdmin(page, RB_ADMIN);
    const hist = new PriceHistoryPage(page);
    const upload = new PriceCsvUploadPage(page, "セール用価格変更");
    let 前 = -1; let rows: Awaited<ReturnType<PriceHistoryPage["rowValues"]>> = [];
    await step(1, async () => { await hist.open(); await hist.searchWord(s.商品コード); 前 = (await hist.rowValues()).length; note(`取込の前の行の数: ${前}`); });
    await step(2, async () => { await upload.open(); });
    await step(3, async () => { await upload.choose(s.ファイル); const r = await upload.submit(); expect(r.sent, "取込の要求が送られた").toBe(true); note(`取込ファイル: ${s.ファイル名}`); });
    await step(4, async () => {
      const m = await 画面上部のメッセージ(page);
      note(`画面上部のメッセージ: 成功「${m.成功.join("」「") || "なし"}」・エラー「${m.エラー.join("」「") || "なし"}」・警告「${m.警告.join("」「") || "なし"}」`);
      expect.soft(m.成功.some((t) => t.includes("登録が完了しました")), "完了のメッセージ「登録が完了しました。」が表示される").toBe(true);
    });
    await step(5, async () => { await hist.open(); await hist.searchWord(s.商品コード); rows = await hist.rowValues(); note(`取込のあとの行: ${JSON.stringify(rows)}`); });
    await expected(async () => {
      expect.soft(rows.length, "行の数（手順1で控えた数より1件多い）").toBe(前 + 1);
      const hit = rows.filter((r) => r.商品コード === s.商品コード && r.登録者 === RB_ADMIN_NAME
        && 金額(r.変更前販売価格) === 期待.変更前販売価格 && 金額(r.変更後販売価格) === 期待.変更後販売価格
        && 金額(r.変更前買取価格) === 期待.変更前買取価格 && 金額(r.変更後買取価格) === 期待.変更後買取価格);
      expect.soft(hit.length, `商品コードの、変更前販売価格「${期待.変更前販売価格}」・変更後販売価格「${期待.変更後販売価格}」・変更前買取価格「${期待.変更前買取価格}」・変更後買取価格「${期待.変更後買取価格}」・登録者「${RB_ADMIN_NAME}」の行（空は空欄）`).toBe(1);
    });
  };
}
caseTest("IT-M03-31-084", 価格履歴の検索で見る("S-M03-31-RB-DATA-084", { 変更前販売価格: "1500", 変更後販売価格: "1200", 変更前買取価格: "", 変更後買取価格: "" }));
caseTest("IT-M03-31-096", 価格履歴の検索で見る("S-M03-31-CBHIST-096", { 変更前販売価格: "", 変更後販売価格: "", 変更前買取価格: "400", 変更後買取価格: "450" }));
caseTest("IT-M03-31-097", 価格履歴の検索で見る("S-M03-31-CBHIST-097", { 変更前販売価格: "1500", 変更後販売価格: "2000", 変更前買取価格: "", 変更後買取価格: "" }));
caseTest("IT-M03-31-098", 価格履歴の検索で見る("S-M03-31-CBHIST-098", { 変更前販売価格: "", 変更後販売価格: "", 変更前買取価格: "400", 変更後買取価格: "450" }));

// ---- 085（在庫検索一覧で見る） ----
caseTest("IT-M03-31-085", async ({ page, step, expected }) => {
  const s = RBの("S-M03-31-RB-DATA-085");
  await loginAdmin(page, RB_ADMIN);
  const 店 = await 本店の店名(page);
  supplement(`正本の店舗「東京本店」は、開発環境の本店（店舗ID 1「${店}」）と読んだ。事前準備④の在庫検索の条件の消去は、ケースごとに新しいブラウザのセッションで始めることで満たした`);
  const upload = new PriceCsvUploadPage(page, "セール用価格変更");
  let 前!: Awaited<ReturnType<typeof 在庫の行の価格>>; let 後!: Awaited<ReturnType<typeof 在庫の行の価格>>;
  const 行を読む = async () => {
    const list = await searchStockByCode(page, { 商品コード: s.商品コード, 店舗: 店, 在庫区分: "EC-CUBE" });
    const row = list.row(s.商品コード, 店, "EC-CUBE");
    await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1);
    return 在庫の行の価格(row);
  };
  await step(1, async () => { 前 = await 行を読む(); note(`取込の前の行の価格: ${JSON.stringify(前)}`); });
  await step(2, async () => { await upload.open(); });
  await step(3, async () => { await upload.choose(s.ファイル); const r = await upload.submit(); expect(r.sent, "取込の要求が送られた").toBe(true); note(`取込ファイル: ${s.ファイル名}`); });
  await step(4, async () => {
    const m = await 画面上部のメッセージ(page);
    note(`画面上部のメッセージ: 成功「${m.成功.join("」「") || "なし"}」・エラー「${m.エラー.join("」「") || "なし"}」・警告「${m.警告.join("」「") || "なし"}」`);
    expect.soft(m.成功.some((t) => t.includes("登録が完了しました")), "完了のメッセージ「登録が完了しました。」が表示される").toBe(true);
  });
  await step(5, async () => { 後 = await 行を読む(); note(`取込のあとの行の価格: ${JSON.stringify(後)}`); });
  await expected(async () => {
    expect.soft(後, "取込のあとの表示（販売価格1200・基準価格1500・買取価格400のまま）").toEqual({ 基準価格: "1500", 販売価格: "1200", 買取価格: "400" });
    expect.soft(前.販売価格, "手順1の表示の販売価格（1500。取込のあとから変わっている）").toBe("1500");
  });
});

// ---- 088・095（商品規格登録編集画面で見る） ----
function 規格の画面で見る(seedId: string, 状態: "NM", 期待: Partial<規格の表示>) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = RBの(seedId);
    await loginAdmin(page, RB_ADMIN);
    const upload = new PriceCsvUploadPage(page, "セール用価格変更");
    let got!: 規格の表示;
    let 商品ID = "";
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await upload.choose(s.ファイル); const r = await upload.submit(); expect(r.sent, "取込の要求が送られた").toBe(true); note(`取込ファイル: ${s.ファイル名}`); });
    await step(3, async () => {
      const m = await 画面上部のメッセージ(page);
      note(`画面上部のメッセージ: 成功「${m.成功.join("」「") || "なし"}」・エラー「${m.エラー.join("」「") || "なし"}」・警告「${m.警告.join("」「") || "なし"}」`);
      expect.soft(m.成功.some((t) => t.includes("登録が完了しました")), "完了のメッセージ「登録が完了しました。」が表示される").toBe(true);
    });
    await step(4, async () => { 商品ID = await openProductEditByCode(page, s.商品コード); });
    await step(5, async () => {
      const rows = await classRowsFromProductEdit(page, 商品ID);
      const hit = rows.filter((r) => r.言語 === "日本語" && r.状態 === 状態);
      expect(hit, `商品規格一覧の言語日本語・状態${状態}の行は1件`).toHaveLength(1);
      await openClassEdit(page, 商品ID, hit[0].商品規格ID);
      got = await 規格の表示を読む(page);
      note(`商品規格登録編集画面の表示: ${JSON.stringify(got)}`);
    });
    await expected(async () => {
      const pick = Object.fromEntries(Object.keys(期待).map((key) => [key, (got as Record<string, string>)[key]]));
      expect.soft(pick, "商品規格登録編集画面のセールフラグ・基準価格・販売価格・買取価格").toEqual(期待);
    });
  };
}
caseTest("IT-M03-31-088", 規格の画面で見る("S-M03-31-CBSALE-088", "NM", { セールフラグ: "チェックなし", 基準価格: "2000", 販売価格: "2000", 買取価格: "600" }));
caseTest("IT-M03-31-095", 規格の画面で見る("S-M03-31-CBPRC-095", "NM", { 買取価格: "1234" }));
