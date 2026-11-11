// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M14-10 フォーマット詳細(登録・編集・削除) の続き（会員の大会デッキ登録・改名の連携）。正本: cases/M14-10_test_cases.tsv
 *
 * - フォーマット・カード・デッキ・イベント・会員の名前は、末尾に実行の印を付けて作り、正本の名前も同じ印つきの名前として読む
 *   （seeds/m14-10.ts の冒頭）。会員のログインIDはDBでしか決められないので、ログインはメールアドレスで行う。
 * - 正本の「登録ボタン」は、フォーマット詳細画面の送信ボタン（画面の表示名「登録」）。
 * - 管理画面の操作と公開側の操作は、同じブラウザのタブで行う（画面の証拠を1つの流れで残すため）。正本が「別のブラウザセッション」と
 *   定める 054・055 は、管理画面のセッションのクッキーを消してから公開側を開く（別のセッションと同じ状態）。
 */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { FormatListPage } from "../../pages/admin/m14_09_format_list";
import { FormatEditPage, フォーマット項目 } from "../../pages/admin/m14_10_format_detail";
import { DeckEntryEditPage } from "../../pages/front/f06_16_deck_entry_k";
import { DeckEntryCheckPage } from "../../pages/front/f06_17_deck_check_k";
import { EventSearchPage } from "../../pages/front/f07_02_event_search";
import { DeckSearchModal, DeckTopPage } from "../../pages/front/f09_01_deck_top";
import { DeckResultPage } from "../../pages/front/f09_02_deck_result";
import { デッキリスト詳細を開く, 情報欄 } from "../../pages/front/m15_05_deck_show";
import { イベントの枠, 使用可能フォーマット } from "../../pages/front/m14_10_format_links";
import { FrontDetail } from "../../pages/front/f03_02_detail";
import { 実行日から } from "../../pages/admin/f07_01_setup";
import { M1410_ADMIN, M1410L_ADMIN, M1410QL_ADMIN, 会員, 日程, 名 } from "../../seeds/m14-10";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function 開く(page: Page, id: string): Promise<FormatEditPage> {
  const d = new FormatEditPage(page);
  expect(await d.open(id), `フォーマットID ${id} のフォーマット詳細画面の応答`).toBe(200);
  return d;
}

async function 直して登録する(d: FormatEditPage, v: フォーマット項目): Promise<void> {
  await d.入れる(v);
  note("正本の「登録ボタン」は、フォーマット詳細画面の送信ボタン（画面の表示名は「登録」）として押した");
  const r = await d.登録を押す();
  expect(r.sent, "登録の要求が送られた").toBe(true);
  await expect(d.page.locator(".alert-success").first(), "保存の成功メッセージ").toBeVisible();
}

// ---------------------------------------------------------------------------
// デッキビルダーで利用（大会デッキ登録編集のマイデッキ取得）
// ---------------------------------------------------------------------------

/** 会員でログインして日程の大会デッキ登録編集画面を開き、「マイデッキ取得」を押して、セレクトボックスの選択肢を読む */
async function マイデッキ取得の選択肢(page: Page, n: string, 手順: { 開く: number; 押す: number }, step: (n: number, b: () => Promise<void>) => Promise<void>): Promise<string[]> {
  const m = 会員(n);
  const e = new DeckEntryEditPage(page);
  let opts: string[] = [];
  await step(手順.開く, async () => {
    await e.ログインする(m.メール, m.パスワード);
    expect(await e.開く(日程(n)), "大会デッキ登録編集画面の応答").toBe(200);
    expect(await e.編集画面である(), "大会デッキ登録編集画面が開いた").toBe(true);
  });
  await step(手順.押す, async () => {
    await e.マイデッキ画面を開く();
    opts = (await e.ポップアップのフォーマット選択.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    note(`「マイデッキ取得」のセレクトボックスの選択肢: ${opts.join("、") || "なし"}`);
  });
  return opts;
}

// ---------------------------------------------------------------------------
// メインボードの上限・下限（大会デッキ登録）
// ---------------------------------------------------------------------------

function 枚数の確かめ(n: "054" | "055", 形式: string, 英: string, 入力: フォーマット項目, メイン: string, 期待: RegExp, what: string) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const id = notes.get(`〔フォーマットID-M1410-${n}〕`);
    await loginAdmin(page, M1410L_ADMIN);
    const list = new FormatListPage(page);
    const d = new FormatEditPage(page);
    const e = new DeckEntryEditPage(page);
    let エラー: string[] = [];
    await step(1, async () => { await list.open(); });
    await step(2, async () => {
      await expect(list.フォーマット名リンク(id), "押す行のフォーマット名").toHaveText(`${名(形式)} / ${名(英)}`);
      await list.三点リーダーを押す(id);
      await list.編集を押す(id);
      await d.表示を待つ();
    });
    await step(3, async () => { await d.入れる(入力); });
    await step(4, async () => { await 直して登録する(d, {}); });
    await step(5, async () => {
      await page.context().clearCookies();
      note("管理画面とは別のブラウザセッションとして、同じタブのクッキーを消してから公開側を開いた");
      const m = 会員(n);
      note(`ログインID「m1410l_${n === "054" ? "003" : "004"}」の代わりに、メールアドレス ${m.メール} でログインした（S-M14-10-L-DECK の読み替え）`);
      await e.ログインする(m.メール, m.パスワード);
    });
    await step(6, async () => {
      expect(await e.開く(notes.get(`〔イベント詳細ID-M1410-${n}〕`)), "大会デッキ登録編集画面の応答").toBe(200);
      expect(await e.編集画面である(), "大会デッキ登録編集画面が開いた").toBe(true);
    });
    await step(7, async () => {
      if (await e.フォーマット選択エリア.isVisible()) await e.フォーマットを選ぶ(名(形式));
      await e.メインボード.fill(メイン);
      await e.サイドボード.fill(`1 ${名("リンク大会カードC")}`);
    });
    await step(8, async () => {
      const r = await e.提出する();
      note(`提出の要求が送られた: ${r.sent}。移った画面: ${e.path}`);
    });
    await step(9, async () => {
      エラー = await new DeckEntryCheckPage(page).エラー("メインボード");
      note(`デッキ登録完了画面のメインボードのエラー表示: ${エラー.join(" / ") || "なし"}`);
    });
    await expected(async () => {
      expect.soft(e.完了画面のデッキID(), "デッキ登録完了画面へ移った").toMatch(/^\d+$/);
      expect(エラー.filter((t) => 期待.test(t)), `メインボードのエラー表示に、${what}旨の案内がある`).toHaveLength(1);
    });
  };
}

caseTest("IT-M14-10-054", 枚数の確かめ("054", "リンク上限003", "LinkMax003", { メイン上限: "3" },
  `2 ${名("リンク大会カードA")}\n2 ${名("リンク大会カードB")}`, /3\s*枚を上回/, "メインボードのカード枚数がフォーマットの最大枚数3枚を上回っている"));
caseTest("IT-M14-10-055", 枚数の確かめ("055", "リンク下限004", "LinkMin004", { メイン下限: "5" },
  `2 ${名("リンク大会カードA")}`, /5\s*枚を下回/, "メインボードのカード枚数がフォーマットの最小枚数5枚を下回っている"));

// ---------------------------------------------------------------------------
// 改名の連携（059〜062）
// ---------------------------------------------------------------------------

caseTest("IT-M14-10-058", async ({ page, notes, step, expected }) => {
  const 商品ID = notes.get("〔商品ID-M1410-001〕");
  const A = notes.get("〔フォーマットID-M1410-001A〕");
  const f = new FrontDetail(page);
  let d!: FormatEditPage;
  let 前: string[] | null = null, 後: string[] | null = null;
  const 開く_商品 = async () => { expect((await f.open("/ja", 商品ID))?.status() ?? 0, `商品ID ${商品ID} の商品詳細画面の応答`).toBe(200); };
  await step(1, async () => { await 開く_商品(); });
  await step(2, async () => { 前 = await 使用可能フォーマット(page); note(`使用可能フォーマット: ${前?.join("、") ?? "欄が無い"}`); });
  await step(3, async () => { await loginAdmin(page, M1410QL_ADMIN); });
  await step(4, async () => { d = await 開く(page, A); });
  await step(5, async () => { await 直して登録する(d, { 名日: 名("改名後フォーマットA-M1410QL001"), 並び順: "5303" }); });
  await step(6, async () => { await 開く_商品(); });
  await step(7, async () => { 後 = await 使用可能フォーマット(page); note(`使用可能フォーマット: ${後?.join("、") ?? "欄が無い"}`); });
  await expected(async () => {
    expect.soft(前, "手順2で確認した使用可能フォーマット（名称と並び）").toEqual([名("改名前フォーマットA-M1410QL001"), 名("順序確認フォーマットB-M1410QL001")]);
    expect.soft(後, "開き直した使用可能フォーマット（名称と並び）").toEqual([名("順序確認フォーマットB-M1410QL001"), 名("改名後フォーマットA-M1410QL001")]);
  });
});

caseTest("IT-M14-10-059", async ({ page, notes, step, expected }) => {
  const deckId = notes.get("〔デッキID-M1410-002〕");
  const fid = notes.get("〔フォーマットID-M1410-002〕");
  let 前 = "", 後 = "";
  let d!: FormatEditPage;
  const 読む = async () => {
    expect(await デッキリスト詳細を開く(page, deckId), `デッキリスト詳細（デッキID ${deckId}）の応答`).toBe(200);
  };
  await step(1, async () => { await 読む(); });
  await step(2, async () => { 前 = (await 情報欄(page))["フォーマット"] ?? ""; note(`情報欄のフォーマット: ${前}`); });
  await step(3, async () => { await loginAdmin(page, M1410QL_ADMIN); });
  await step(4, async () => { d = await 開く(page, fid); });
  await step(5, async () => { await 直して登録する(d, { 名日: 名("デッキ連携改名後-M1410QL002") }); });
  await step(6, async () => { await 読む(); });
  await step(7, async () => { 後 = (await 情報欄(page))["フォーマット"] ?? ""; note(`情報欄のフォーマット: ${後}`); });
  await expected(async () => {
    expect.soft(前, "手順2で確認した情報欄のフォーマット").toBe(名("デッキ連携改名前-M1410QL002"));
    expect.soft(後, "開き直した情報欄のフォーマット").toBe(名("デッキ連携改名後-M1410QL002"));
  });
});

caseTest("IT-M14-10-060", async ({ page, notes, step, expected }) => {
  const fid = notes.get("〔フォーマットID-M1410-003〕");
  const 日 = 実行日から(30, "00:00").slice(0, 10).replace(/-/g, "/");
  const イベント = 名("連携イベント-M1410QL003");
  const s = new EventSearchPage(page);
  let d!: FormatEditPage;
  let 前: string[] = [], 後: string[] = [];
  const 検索 = async () => {
    await s.モーダルを開く();
    await s.条件を入れる({ 下限: 日, 上限: 日 });
    expect(await s.検索する(), "検索の応答").toBe(200);
  };
  const 読む = async () => {
    const 枠 = (await イベントの枠(page)).filter((x) => x.イベント名 === イベント);
    expect(枠.length, `検索結果の「${イベント}」の枠の数`).toBe(1);
    return 枠[0].フォーマット;
  };
  await step(1, async () => { expect(await s.open(), "大会詳細検索の応答").toBe(200); });
  await step(2, async () => {
    await 検索();
    note(`開催日時の欄は日付だけを選ぶ作り（時刻は入れられない）なので、下限・上限とも実行日の30日後の日付「${日}」を入れた`);
  });
  await step(3, async () => { 前 = await 読む(); note(`「${イベント}」のフォーマット: ${前.join("、")}`); });
  await step(4, async () => { await loginAdmin(page, M1410QL_ADMIN); });
  await step(5, async () => { d = await 開く(page, fid); });
  await step(6, async () => { await 直して登録する(d, { 名日: 名("AfterEvtFmt-M1410QL003"), 名英: 名("AfterEvtFmt-M1410QL003") }); });
  await step(7, async () => { expect(await s.open(), "大会詳細検索の応答").toBe(200); await 検索(); });
  await step(8, async () => { 後 = await 読む(); note(`「${イベント}」のフォーマット: ${後.join("、")}`); });
  await expected(async () => {
    expect.soft(前, "手順3で確認したフォーマット").toEqual([名("BeforeEvtFmt-M1410QL003")]);
    expect.soft(後, "手順8で確認したフォーマット").toEqual([名("AfterEvtFmt-M1410QL003")]);
  });
});

caseTest("IT-M14-10-061", async ({ page, notes, step, expected }) => {
  // 手順6で61分待つ（正本の手順。メタゲーム上位の集計結果の保持時間3600秒を過ぎるまで）
  test.setTimeout(100 * 60_000);
  const fid = notes.get("〔フォーマットID-M1410-004〕");
  const top = new DeckTopPage(page);
  let d!: FormatEditPage;
  let 前: string[] = [], 後: string[] = [];
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { 前 = await top.区画のフォーマット名(); note(`メタゲームの見出しのフォーマット名: ${前.join("、")}`); });
  await step(3, async () => { await loginAdmin(page, M1410QL_ADMIN); });
  await step(4, async () => { d = await 開く(page, fid); });
  await step(5, async () => { await 直して登録する(d, { 名日: 名("MetaHeadAfter-M1410QL004"), 名英: 名("MetaHeadAfter-M1410QL004") }); });
  await step(6, async () => { await page.waitForTimeout(61 * 60_000); note("61分待った"); });
  await step(7, async () => { await top.開く(); });
  await step(8, async () => { 後 = await top.区画のフォーマット名(); note(`メタゲームの見出しのフォーマット名: ${後.join("、")}`); });
  await expected(async () => {
    expect.soft(前, "手順2で確認したメタゲームの見出し").toContain(名("MetaHeadBefore-M1410QL004"));
    expect.soft(後, "開き直したメタゲームの見出し（改名後）").toContain(名("MetaHeadAfter-M1410QL004"));
    expect.soft(後, "開き直したメタゲームの見出し（改名前は無い）").not.toContain(名("MetaHeadBefore-M1410QL004"));
  });
});

caseTest("IT-M14-10-062", async ({ page, notes, step, expected }) => {
  const fid = notes.get("〔フォーマットID-M1410-005〕");
  const top = new DeckTopPage(page);
  const m = new DeckSearchModal(page);
  let d!: FormatEditPage;
  let 前 = "", 後 = "";
  const 検索 = async (名前: string) => {
    await m.開く();
    await m.フォーマットを選ぶ(名前);
    await m.検索する();
    await new DeckResultPage(page).読み込みを待つ();
  };
  await step(1, async () => { await top.開く(); });
  await step(2, async () => { await 検索(名("ResultTitleBefore-M1410QL005")); });
  await step(3, async () => { 前 = await new DeckResultPage(page).題名(); note(`デッキ検索結果画面の題名: ${前}`); });
  await step(4, async () => { await loginAdmin(page, M1410QL_ADMIN); });
  await step(5, async () => { d = await 開く(page, fid); });
  await step(6, async () => { await 直して登録する(d, { 名日: 名("ResultTitleAfter-M1410QL005"), 名英: 名("ResultTitleAfter-M1410QL005") }); });
  await step(7, async () => { await top.開く(); await 検索(名("ResultTitleAfter-M1410QL005")); });
  await step(8, async () => { 後 = await new DeckResultPage(page).題名(); note(`デッキ検索結果画面の題名: ${後}`); });
  await expected(async () => {
    expect.soft(前, "手順3で確認した題名に「ResultTitleBefore-M1410QL005」がある").toContain(名("ResultTitleBefore-M1410QL005"));
    expect.soft(後, "手順8で確認した題名に「ResultTitleAfter-M1410QL005」がある").toContain(名("ResultTitleAfter-M1410QL005"));
    expect.soft(後, "手順8で確認した題名に「ResultTitleBefore-M1410QL005」が無い").not.toContain(名("ResultTitleBefore-M1410QL005"));
  });
});
