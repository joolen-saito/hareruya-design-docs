// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M14-10 フォーマット詳細(登録・編集・削除) の続き（保存した設定が、公開側の画面・管理画面のデッキ登録に効くこと）。正本: cases/M14-10_test_cases.tsv
 *
 * - フォーマット・カード・アーキタイプ・デッキ・イベントの名前は、末尾に実行の印を付けて作り、正本の名前も同じ印つきの名前として読む
 *   （seeds/m14-10.ts の冒頭）。
 * - 正本の「登録ボタン」は、フォーマット詳細画面の送信ボタン（画面の表示名「登録」）。
 * - 正本の「フロントのデッキ検索画面」はデッキ検索TOP（/ja/deck/）、「検索条件のフォーマット」は画面上部の「詳細検索」で開くデッキ詳細検索の
 *   フォーマットの選択肢。「フロントのフォーマット一覧」（024）は、公開側にフォーマットだけを並べる画面が無いので、シード表が
 *   「フロントの一覧にも並ぶようにデッキ検索条件に表示を選択」と定めるデッキ詳細検索のフォーマットの選択肢として読む。
 * - 正本の「採用デッキ数ランキング」はデッキ検索TOPの「<フォーマット名>メタゲーム」の区画のアーキタイプの一覧、「メタ分布へのリンク」は
 *   そのフォーマットのメタゲーム一覧（/deck/<フォーマットID>/metagame/）へのリンク。
 * - 正本の「フロントのイベント一覧画面」は大会詳細検索（/ja/events/list）、「検索条件のフォーマット」はその詳細検索のモーダルのフォーマット。
 *
 * 実装しないケース: 030（カードセットをARENA対応にするのはDBでしか設定できない。seeds/m14-10.ts の冒頭）。
 */
import { Page, test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { RUN_MARK } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { FormatListPage } from "../../pages/admin/m14_09_format_list";
import { FormatEditPage, フォーマット項目, 画面上部の警告, 送信の結果 } from "../../pages/admin/m14_10_format_detail";
import { デッキ編集画面 } from "../../pages/admin/m15_05_deck_edit";
import { FrontDetailSearch } from "../../pages/front/f03_03_detail_search";
import { EventSearchPage } from "../../pages/front/f07_02_event_search";
import { DeckSearchModal, DeckTopPage } from "../../pages/front/f09_01_deck_top";
import { MetagamePage } from "../../pages/front/f09_03_metagame";
import { メタゲーム一覧を開く, UsageRankingPage } from "../../pages/front/f09_04_usage_ranking";
import { デッキリスト詳細を開く } from "../../pages/front/m15_05_deck_show";
import { イベントの枠, イベント検索でフォーマットを選ぶ, イベント検索のフォーマットの選択肢, メタ分布へのリンク, 日本語テキストを受け取る } from "../../pages/front/m14_10_format_links";
import { M1410_ADMIN, M1410L_ADMIN, デッキ, 名 } from "../../seeds/m14-10";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** フォーマット詳細画面を開く（管理画面にログインしてから） */
async function 開く(page: Page, id: string, account = M1410_ADMIN): Promise<FormatEditPage> {
  await loginAdmin(page, account);
  const d = new FormatEditPage(page);
  expect(await d.open(id), `フォーマットID ${id} のフォーマット詳細画面の応答`).toBe(200);
  return d;
}

/** 項目を入れて「登録」を押し、保存できたことを確かめる */
async function 直して登録する(d: FormatEditPage, v: フォーマット項目): Promise<送信の結果> {
  await d.入れる(v);
  note("正本の「登録ボタン」は、フォーマット詳細画面の送信ボタン（画面の表示名は「登録」）として押した");
  const r = await d.登録を押す();
  expect(r.sent, "登録の要求が送られた").toBe(true);
  note(`送った要求の応答 ${r.要求の応答 ?? "なし"}、移った画面 ${r.移った画面}`);
  await expect(d.page.locator(".alert-success").first(), "保存の成功メッセージ").toBeVisible();
  return r;
}

/** 手順1〜2: フォーマット詳細画面を開き、設定を変えて登録する。フォーマットIDを返す（3以降は公開側・デッキ登録） */
async function 設定を変えて登録する(ctx: CaseCtx, 呼び名: string, v: フォーマット項目): Promise<string> {
  const { page, notes, step } = ctx;
  const id = notes.get(呼び名);
  let d!: FormatEditPage;
  await step(1, async () => { d = await 開く(page, id); });
  await step(2, async () => { await 直して登録する(d, v); });
  return id;
}

/** 分析日数などの共通の処理を返す関数のための形（3以降を読む関数を受け取る） */
function 設定を変えて(呼び名: string, v: フォーマット項目, 読む: (ctx: CaseCtx, id: string) => Promise<void>) {
  return async (ctx: CaseCtx) => { await 読む(ctx, await 設定を変えて登録する(ctx, 呼び名, v)); };
}

// ---------------------------------------------------------------------------
// 並び順（管理画面とフロント）
// ---------------------------------------------------------------------------

caseTest("IT-M14-10-024", async ({ page, notes, step, expected }) => {
  const [A, B, C] = ["A", "B", "C"].map((x) => notes.get(`〔フォーマットID-M1410-024${x}〕`));
  const 名前 = [名("並び順10形式-024"), 名("編集前フォーマット-024"), 名("並び順30形式-024")];
  let d!: FormatEditPage;
  let 管理: string[] = [], 公開: string[] = [];
  await step(1, async () => { d = await 開く(page, B); });
  await step(2, async () => { await 直して登録する(d, { 並び順: "20" }); });
  await step(3, async () => {
    const list = new FormatListPage(page);
    await list.open();
    管理 = (await list.行のフォーマットID()).filter((id) => [A, B, C].includes(id));
  });
  await step(4, async () => {
    await new DeckTopPage(page).開く();
    const m = new DeckSearchModal(page);
    await m.開く();
    公開 = (await m.フォーマットの選択肢()).filter((n) => 名前.includes(n));
    note("フロントのフォーマット一覧は、デッキ検索TOPの「詳細検索」で開くデッキ詳細検索のフォーマットの選択肢として読んだ（公開側にフォーマットだけを並べる画面は無い）");
  });
  await expected(async () => {
    expect.soft(管理, "管理画面のフォーマット一覧の3件の上からの順（A・B・C のフォーマットID）").toEqual([A, B, C]);
    expect.soft(公開, "フロントのフォーマットの選択肢の3件の上からの順").toEqual(名前);
  });
});

// ---------------------------------------------------------------------------
// ランキング表示・メタ分布簡易化（デッキ検索TOP）
// ---------------------------------------------------------------------------

/** デッキ検索TOPを開き、フォーマットの採用デッキ数ランキング（区画のアーキタイプ）とメタ分布へのリンクの数を読む */
async function デッキ検索TOPで読む(page: Page, 名前: string, id: string): Promise<{ 区画: number; アーキタイプ: string[]; リンク: number }> {
  const top = new DeckTopPage(page);
  await top.開く();
  const 区画 = await top.区画(名前).count();
  const アーキタイプ = 区画 ? (await top.アーキタイプ(名前)).map((a) => a.名前) : [];
  const リンク = await メタ分布へのリンク(page, id).count();
  note(`デッキ検索TOPの「${名前}メタゲーム」の区画 ${区画} 件（アーキタイプ: ${アーキタイプ.join("、") || "なし"}）、このフォーマットのメタゲーム一覧へのリンク ${リンク} 件`);
  return { 区画, アーキタイプ, リンク };
}

// ---------------------------------------------------------------------------
// 採用枚数ランキング・メタゲーム（基本土地・分析日数）
// ---------------------------------------------------------------------------

/** フォーマットのメタゲーム一覧から「採用枚数ランキング」を開く */
async function 採用枚数ランキングを開く(page: Page, id: string): Promise<UsageRankingPage> {
  expect(await メタゲーム一覧を開く(page, id, "ja"), `フォーマットID ${id} のメタゲーム一覧の応答`).toBe(200);
  const u = new UsageRankingPage(page, "ja");
  await u.入口を押す();
  return u;
}

/** 分析日数を7にして登録し、採用枚数ランキングのスペルを読む（036・037） */
function 分析日数のランキング(n: string, ランキングも: boolean) {
  return 設定を変えて(`〔フォーマットID-M1410-${n}〕`, ランキングも ? { メタゲーム分析日数: "7", ランキング: true } : { メタゲーム分析日数: "7" }, async ({ page, step, expected }, id) => {
    let 件: { 名前: string; 枚数: number }[] = [];
    await step(3, async () => {
      if (ランキングも) {
        const top = new DeckTopPage(page);
        await top.開く();
        note(`デッキ検索TOPを開き（「${名(`連携確認フォーマット-${n}`)}メタゲーム」の区画 ${await top.区画(名(`連携確認フォーマット-${n}`)).count()} 件）、このフォーマットのメタゲーム一覧の「採用枚数ランキング」でカードの採用枚数ランキングを見た`);
      }
      const u = await 採用枚数ランキングを開く(page, id);
      件 = (await u.件を読む("スペル")).map((x) => ({ 名前: x.名前, 枚数: x.枚数 }));
      note(`スペルのランキング: ${件.map((x) => `${x.名前}（${x.枚数}）`).join("、") || "なし"}。集計期間の開始: ${await u.開始日()}`);
    });
    await expected(async () => {
      expect.soft(件.filter((x) => x.名前 === 名(`分析内カード-${n}`)).map((x) => x.枚数), "3日前のデッキの分析内カードの採用枚数（反映される）").toEqual([4]);
      expect.soft(件.filter((x) => x.名前 === 名(`分析外カード-${n}`)), "30日前のデッキの分析外カード（反映されない）").toEqual([]);
    });
  });
}

// ---------------------------------------------------------------------------
// 基本土地でないカードは各1枚まで（管理画面のデッキ登録）
// ---------------------------------------------------------------------------

/** デッキ新規登録画面を開き、フォーマットを選ぶ（手順の番号は呼ぶ側） */
async function デッキ登録を開く(page: Page): Promise<デッキ編集画面> {
  await page.goto(adminUrl("/deck/new"));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  return e;
}

/** 同じカード名の行を入れてデッキを登録し、登録後の画面の警告を返す */
async function 行を入れて登録する(page: Page, e: デッキ編集画面, n: string, 行: string[], アーキタイプ: string): Promise<string[]> {
  await e.入力する({ デッキ名: 名(`ハイランダー確認デッキ-${n}`), デッキ種別: "event", アーキタイプ: アーキタイプ, 公開状態: "非公開", メイン: 行.join("\n") });
  note(`メインボードに「${行.join(" / ")}」を入れ、デッキ名「${名(`ハイランダー確認デッキ-${n}`)}」・デッキタイプ「event」・公開状態「非公開」で登録した（デッキ名などは登録に要る値で、正本に指定が無い）`);
  await e.送信する(e.新規登録ボタン);
  const w = await 画面上部の警告(page);
  note(`登録後の画面: ${page.url()}。警告・エラーの帯: ${w.join(" / ") || "なし"}`);
  return w;
}

/** 065〜067: 基本土地でないカードは各1枚までを（未）選択で登録し、同名カードのアラートが出ないこと */
function アラートが出ない(n: string, ハイランダー: boolean, 行: () => string[]) {
  return 設定を変えて(`〔フォーマットID-M1410-${n}〕`, { ハイランダー }, async ({ page, step, expected }) => {
    let e!: デッキ編集画面;
    let 警告: string[] = [];
    await step(3, async () => { e = await デッキ登録を開く(page); });
    await step(4, async () => { await e.フォーマットを選ぶ(名(`連携確認フォーマット-${n}`)); });
    await step(5, async () => { 警告 = await 行を入れて登録する(page, e, n, 行(), 名(`連携確認アーキタイプ-${n}`)); });
    await step(6, async () => {
      expect(e.デッキID(), "登録後に開いたデッキ編集画面のデッキID").toMatch(/^\d+$/);
      警告 = [...警告, ...(await 画面上部の警告(page))].filter((w, i, a) => a.indexOf(w) === i);
    });
    await expected(async () => {
      await expect.soft(e.デッキ名, "登録後のデッキ編集画面（デッキ名の欄）").toBeVisible();
      expect(警告.filter((w) => w.includes("2枚以上登録されています")), "同名カードが2枚以上登録されていることを示すアラート").toEqual([]);
    });
  });
}

// ---------------------------------------------------------------------------
// リンク試験（052・053。管理画面の一覧から編集・削除）
// ---------------------------------------------------------------------------

caseTest("IT-M14-10-052", async ({ page, notes, step, expected }) => {
  const B = notes.get("〔フォーマットID-M1410-052B〕");
  await loginAdmin(page, M1410L_ADMIN);
  const list = new FormatListPage(page);
  const d = new FormatEditPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await expect(list.フォーマット名リンク(B), "押す行のフォーマット名").toHaveText(`${名("リンク表示001")} / ${名("LinkShown001")}`);
    await list.三点リーダーを押す(B);
    await list.編集を押す(B);
    await d.表示を待つ();
  });
  await step(3, async () => { await d.入れる({ 商品検索: false }); });
  await step(4, async () => { await 直して登録する(d, {}); });
  await step(5, async () => {
    const s = new FrontDetailSearch(page);
    await s.openProductList("/ja");
    note(`本店の商品一覧は、新しいタブの代わりに同じタブで開いた（画面の証拠を残すため。管理画面のセッションは残ったまま）。「詳細検索」は ${await s.詳細検索を押す()} を押して開いた`);
  });
  await step(6, async () => { 選択肢 = await new FrontDetailSearch(page).フォーマットの選択肢(); note(`フォーマットの選択肢: ${選択肢.join("、")}`); });
  await expected(async () => {
    expect.soft(選択肢, "フォーマットの選択肢に「リンク基準001」がある").toContain(名("リンク基準001"));
    expect.soft(選択肢, "フォーマットの選択肢に「リンク表示001」が無い").not.toContain(名("リンク表示001"));
  });
});

caseTest("IT-M14-10-053", async ({ page, notes, step, expected }) => {
  const A = notes.get("〔フォーマットID-M1410-053A〕");
  await loginAdmin(page, M1410L_ADMIN);
  const list = new FormatListPage(page);
  const d = new FormatEditPage(page);
  let 名前: string[] = [];
  let 文 = "";
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await expect(list.フォーマット名リンク(A), "押す行のフォーマット名").toHaveText(`${名("リンク削除002")} / ${名("LinkDel002")}`);
    await list.三点リーダーを押す(A);
    await list.編集を押す(A);
    await d.表示を待つ();
  });
  let pop!: FormatListPage;
  await step(3, async () => { pop = await d.削除を押す(A); 文 = ((await d.ポップアップの文.textContent()) ?? "").trim(); });
  await step(4, async () => {
    expect.soft(文, "ポップアップの文").toBe(`この操作はあとから取り消すことができません。「${名("リンク削除002")}」を削除してよろしいですか？`);
    const r = await pop.ポップアップで削除を実行する();
    note(`削除の要求の応答 ${r.要求の応答}、移った画面 ${r.移った画面}`);
  });
  await step(5, async () => { await list.open(); });
  await step(6, async () => { 名前 = (await list.行()).map((r) => r.フォーマット名); });
  await expected(async () => {
    expect.soft(名前, "フォーマット一覧に「リンク削除002 / LinkDel002」が無い").not.toContain(`${名("リンク削除002")} / ${名("LinkDel002")}`);
    expect.soft(名前, "フォーマット一覧に「リンク残存002 / LinkRemain002」がある").toContain(`${名("リンク残存002")} / ${名("LinkRemain002")}`);
  });
});

