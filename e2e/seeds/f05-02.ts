/**
 * F05-02 ネット買取商品検索（フロント）の画面シード。正本: cases/F05-02_seed_data.tsv
 *
 * 作るシード: ENV（共有可）・MASTERS（共有可）・DEFOPINIT-025（ケース専用）。
 * 作らないシード（理由は PM への報告に書く）:
 * - 商品を作って商品管理のユニサーチフィード作成で外部の商品検索サービスの試験用索引へ反映し、索引で反映を確かめるまでを定めるシード
 *   （URL-004・FOIL-FRAME-005/008/009・DETAIL-006・IDENTITY-007/028・BANNED-011・TAG-013・PAGING-017・TAG-019・NOHIT-022・LOGIC-023・
 *   ALLEMPTY-024・DEFOP-026・TYPEAND-027・COLORONLY-029・MIXURL-030）。手元の環境には試験用索引が無い。
 * - CARRY-014・015・021、ELIGIBILITY-018: 上に加えて、投入方法に DB での準備を含む。
 * - PAGING-SETTING: 使うケース（017）を実装しない。
 *
 * 共有のマスタ（MASTERS）は、あれば使い、無ければ作るので名称に実行の印を付けない（F03-03 と同じ）。
 * シード表が値を定めないもので、ここで決めたこと（各シードの報告にも出す）:
 * - 試験管理者のパスワードは12文字以上の試験用の固定値、権限は全機能を使える「システム管理者」（商品管理とユニサーチフィード作成を含む。権限の名前が正本に無い）。
 * - 最上位のカテゴリは、カテゴリ登録/編集画面に最上位の入力欄が無いので、カテゴリ登録CSVで作る（F03-03・M03-45 と同じ）。英語名は「F0502 Category」など。
 * - カードセットの英語名・略称は「F0502 Set」「F0502A」など。フォーマットの英語名は「F0502 Format」など、並び順は 950〜953。
 * - カードタイプ・サブタイプ・イラストレーターの番号は、MTGマスターデータ管理の行の番号を控える（モーダルの選択肢の値と同じ番号。
 *   シード表はモーダルで1つだけ選んで検索したアドレスから読むと定めるが、検索結果の画面は外部の検索サービスに頼るため）。
 */
import { expect, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { adminUrl, hideDebugToolbar, withAdminSession } from "../lib/session";
import { CategoryPage, createTopByCsv } from "../pages/admin/category";
import { FormatPage, MtgMasterPage } from "../pages/admin/f03_03_masters";
import { TagPage } from "../pages/admin/m03_13_tag";
import { CardEditPage } from "../pages/admin/m14_04_card_edit";
import { ensureMember } from "../pages/admin/member";
import { ensureCardset } from "../pages/admin/product_masters";
import { PurchaseSearchPage } from "../pages/front/f05_02_purchase_search";

type 警告 = (w: string) => void;

// ---- S-F05-02-ENV ----

/** シード表の試験管理者（ログインID はシード表の値。パスワードは任意の値＝試験用の固定値） */
export const F0502_FEED_ADMIN = { loginId: "f0502-feed-admin@example.test", password: "F0502-Feed-Admin-Pass" };

defineSeed("S-F05-02-ENV", async ({ browser, seed }) => {
  const issue: 警告 = (m) => reportSeedIssue(seed.シードID, m);
  // 1. 試験管理者（あれば内容を確かめて使い、無ければ登録する）。所属店舗は本店（店舗ID 1）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await page.goto(adminUrl("/setting/system/member/new"));
    const 本店 = await page.locator('[name="admin_member[baseInfo]"] option[value="1"]').textContent();
    if (!本店 || !本店.trim()) throw new Error(`${seed.シードID}: メンバー登録の所属店舗に本店（店舗ID 1）の選択肢が無い`);
    await ensureMember(page, {
      名前: "F0502-FEED-ADMIN", 所属店舗: 本店.trim(), ログインID: F0502_FEED_ADMIN.loginId, メールアドレス: F0502_FEED_ADMIN.loginId,
      パスワード: F0502_FEED_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: 本店.trim(), 編集可能店舗: [本店.trim()],
    });
    issue(`試験管理者 F0502-FEED-ADMIN（所属店舗「${本店.trim()}」・権限「システム管理者」・稼働）を用意した。権限は商品管理とユニサーチフィード作成を含む全機能の権限にした（正本に権限の名前が無い）`);
  });
  // 2. ネット買取商品一覧が、ログインなしの日本語で開けることを確かめる
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const list = new PurchaseSearchPage(await context.newPage());
    const status = await list.開く();
    expect(status, `${seed.シードID}: ログインなしでネット買取商品一覧が開けない`).toBeLessThan(400);
    await expect(list.一覧の印, `${seed.シードID}: ネット買取商品一覧の画面`).toHaveCount(1);
  } finally {
    await context.close();
  }
  issue("本店ID・ユニサーチ検索接続先・サジェスト接続先は、管理画面に設定欄が無く、環境の設定のまま（書き換えていない）。ログインなしでネット買取商品一覧が開けることを確かめた");
});

// ---- S-F05-02-MASTERS ----

/** 共有のマスタの名称（ケースもこの名称で選択肢を探す） */
export const F0502マスタ = {
  タグ: "最新入荷アイテム",
  カテゴリA: "シングルカード", カテゴリB: "F0502カテゴリ", カテゴリC: "F0502別カテゴリ",
  カードセットA: "F0502セット", カードセットB: "F0502別セット",
  カードタイプA: "クリーチャー", カードタイプB: "アーティファクト",
  サブタイプA: "F0502タイプ", サブタイプB: "F0502別タイプ",
  フォーマットA: "F0502フォーマット", フォーマットB: "F0502別フォーマット", フォーマットC: "F0502表示フォーマット", フォーマットD: "F0502非表示フォーマット",
  イラストレーターA: "F0502 Artist", イラストレーターB: "F0502 Other Artist",
} as const;

/** タグ: 一覧に名称(日)の行があれば使い（名称(英)がシード表と同じことを確かめる）、無ければ登録する */
async function ensureTag(page: Page, 名称日: string, 名称英: string, what: string): Promise<string> {
  const tag = new TagPage(page);
  await tag.showFirstPageWith("12000");
  const hit = (await tag.allRows()).filter((r) => r.名称日 === 名称日);
  if (hit.length > 1) throw new Error(`${what}: タグ「${名称日}」が一覧に ${hit.length} 件ある（1件のはず）`);
  if (hit.length === 1) {
    expect(hit[0].名称英, `${what}: 既にあるタグ「${名称日}」の名称(英)`).toBe(名称英);
    return hit[0].ID;
  }
  await tag.openNew();
  return tag.register({ 名称日, 名称英, 並び順: "9999" }, `${what}: タグ管理で「${名称日}」を登録`);
}

/** 最上位のカテゴリ: 同名があれば使い（フロント非表示でないことを確かめる）、無ければカテゴリ登録CSVで作る */
async function ensureTopCategory(page: Page, 名称日: string, 名称英: string, onWarning: 警告): Promise<string> {
  const cat = new CategoryPage(page);
  await cat.openTop();
  const hit = (await cat.rowValues()).filter((r) => r.nameJp === 名称日);
  if (hit.length > 1) throw new Error(`最上位のカテゴリ「${名称日}」が ${hit.length} 件ある（1件のはず）`);
  if (hit.length === 0) return createTopByCsv(page, { nameJp: 名称日, nameEn: 名称英, frontHide: "0", branchHide: "0" }, `f0502-top-${Date.now()}.csv`, onWarning);
  await cat.openEdit(hit[0].id);
  expect(await cat.frontHide.isChecked(), `既にあるカテゴリ「${名称日}」がフロント非表示になっている`).toBe(false);
  return hit[0].id;
}

/** カードタイプ・サブタイプ: 日本語名の行があれば使い（カードタイプは商品検索に表示する値をシード表に合わせる）、無ければ新しい行で足す */
async function ensureByJapaneseName(page: Page, 種別: "cardtype" | "subtype", 日本語名: string, 英語名: string, onIssue: 警告): Promise<string> {
  const m = new MtgMasterPage(page);
  await m.open(種別);
  const hit = (await m.rows()).filter((r) => r.日本語名 === 日本語名);
  if (hit.length > 1) throw new Error(`「${日本語名}」が ${hit.length} 行ある（1行のはず）`);
  if (hit.length === 1) {
    if (種別 === "cardtype" && hit[0].商品検索に表示 !== "1") {
      if (!(await m.setSearchFlag(hit[0].id, "1"))) throw new Error(`カードタイプ「${日本語名}」の商品検索に表示するかを1にできない（固定の行）`);
      for (const w of await m.save(`カードタイプ「${日本語名}」の更新`)) onIssue(w);
      onIssue(`既にあるカードタイプ「${日本語名}」の商品検索に表示するかを1にした`);
    }
    return hit[0].id;
  }
  await m.fillNewRow({ 日本語名, 英語名, 並び順: await m.nextSortNo(), ...(種別 === "cardtype" ? { 商品検索に表示: "1" as const } : {}) });
  for (const w of await m.save(`「${日本語名}」の登録`)) onIssue(w);
  await m.open(種別);
  const added = (await m.rows()).filter((r) => r.日本語名 === 日本語名);
  if (added.length !== 1) throw new Error(`「${日本語名}」を登録して ${added.length} 行になった`);
  return added[0].id;
}

/** イラストレーター: 英語名の行があれば使い、無ければ新しい行で足す */
async function ensureIllustrator(page: Page, 英語名: string, onIssue: 警告): Promise<string> {
  const m = new MtgMasterPage(page);
  await m.open("illustrator");
  const hit = (await m.rows()).filter((r) => r.英語名 === 英語名);
  if (hit.length > 1) throw new Error(`イラストレーター「${英語名}」が ${hit.length} 行ある（1行のはず）`);
  if (hit.length === 1) return hit[0].id;
  await m.fillNewRow({ 英語名, 並び順: await m.nextSortNo() });
  for (const w of await m.save(`イラストレーター「${英語名}」の登録`)) onIssue(w);
  await m.open("illustrator");
  const added = (await m.rows()).filter((r) => r.英語名 === 英語名);
  if (added.length !== 1) throw new Error(`イラストレーター「${英語名}」を登録して ${added.length} 行になった`);
  return added[0].id;
}

/** フォーマット: 一覧に日本語名の行があれば使い（商品検索条件への表示がシード表と同じことを確かめる）、無ければ登録する */
async function ensureFormat(page: Page, 名称日: string, 名称英: string, 並び順: string, 表示: boolean): Promise<string> {
  const f = new FormatPage(page);
  await f.openList();
  const hit = (await f.listRows()).filter((r) => r.名称.startsWith(`${名称日} / `));
  if (hit.length > 1) throw new Error(`フォーマット「${名称日}」が一覧に ${hit.length} 件ある（1件のはず）`);
  if (hit.length === 1) {
    await f.openEdit(hit[0].id);
    expect((await f.values()).商品検索に表示, `既にあるフォーマット「${名称日}」の商品検索条件への表示`).toBe(表示);
    return hit[0].id;
  }
  await f.openNew();
  await f.fill({ 名称日, 名称英, 並び順, 商品検索に表示: 表示 });
  return f.register(`フォーマット「${名称日}」の登録`);
}

defineSeed("S-F05-02-MASTERS", async ({ browser, notes, seed }) => {
  const issue: 警告 = (w) => reportSeedIssue(seed.シードID, w);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(60_000);
    const M = F0502マスタ;
    notes.set("〔タグID-F0502-共有〕", await ensureTag(page, M.タグ, "New Items", seed.シードID));

    notes.set("〔カテゴリID-F0502-共有A〕", await ensureTopCategory(page, M.カテゴリA, "Single Cards", issue));
    notes.set("〔カテゴリID-F0502-共有B〕", await ensureTopCategory(page, M.カテゴリB, "F0502 Category", issue));
    notes.set("〔カテゴリID-F0502-共有C〕", await ensureTopCategory(page, M.カテゴリC, "F0502 Other Category", issue));

    notes.set("〔カードセットID-F0502-共有A〕", await ensureCardset(page, M.カードセットA, "F0502 Set", "F0502A", issue));
    notes.set("〔カードセットID-F0502-共有B〕", await ensureCardset(page, M.カードセットB, "F0502 Other Set", "F0502B", issue));

    notes.set("〔カードタイプID-F0502-共有A〕", await ensureByJapaneseName(page, "cardtype", M.カードタイプA, "F0502 Creature", issue));
    notes.set("〔カードタイプID-F0502-共有B〕", await ensureByJapaneseName(page, "cardtype", M.カードタイプB, "F0502 Artifact", issue));
    notes.set("〔サブタイプID-F0502-共有A〕", await ensureByJapaneseName(page, "subtype", M.サブタイプA, "F0502 Type", issue));
    notes.set("〔サブタイプID-F0502-共有B〕", await ensureByJapaneseName(page, "subtype", M.サブタイプB, "F0502 Other Type", issue));
    notes.set("〔イラストレーターID-F0502-共有A〕", await ensureIllustrator(page, M.イラストレーターA, issue));
    notes.set("〔イラストレーターID-F0502-共有B〕", await ensureIllustrator(page, M.イラストレーターB, issue));

    notes.set("〔フォーマットID-F0502-共有A〕", await ensureFormat(page, M.フォーマットA, "F0502 Format", "950", true));
    notes.set("〔フォーマットID-F0502-共有B〕", await ensureFormat(page, M.フォーマットB, "F0502 Other Format", "951", true));
    notes.set("〔フォーマットID-F0502-共有C〕", await ensureFormat(page, M.フォーマットC, "F0502 Shown Format", "952", true));
    notes.set("〔フォーマットID-F0502-共有D〕", await ensureFormat(page, M.フォーマットD, "F0502 Hidden Format", "953", false));

    // 色の選択肢は、カード新規登録のカラーで確かめる
    const card = new CardEditPage(page);
    await card.openNew();
    const colors = await card.色の選択肢("カラー");
    for (const c of ["白", "青", "黒", "赤", "緑", "無色"]) expect(colors, `${seed.シードID}: カード新規登録のカラーの選択肢に「${c}」がある`).toContain(c);
  });
  issue("最上位のカテゴリはカテゴリ登録CSVで作る（無ければ）。カードタイプ・サブタイプ・イラストレーターの番号は、MTGマスターデータ管理の行の番号を控えた（モーダルの選択肢の値と同じ番号）");
});

// ---- S-F05-02-DEFOPINIT-025 ----

defineSeed("S-F05-02-DEFOPINIT-025", async ({ browser, seed }) => {
  // ケース開始時に新しいブラウザセッションで一覧を開く（ケースの page は毎回新しいセッション）。ここでは、一覧が開けることだけを確かめる
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const list = new PurchaseSearchPage(await context.newPage());
    expect(await list.開く(), `${seed.シードID}: ネット買取商品一覧が開けない`).toBeLessThan(400);
  } finally {
    await context.close();
  }
});
