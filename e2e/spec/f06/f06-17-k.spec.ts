// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * F06-17 大会デッキ登録確認～完了（フロント・マイページ）。正本: cases/F06-17_test_cases.tsv
 * 振り分けと解釈は review/F06-17_progress_2026-11-10.md。
 *
 * - 大会名は、シードが実行の印を付けて作る（seeds/f06-17.ts の 大会名()）。手順・期待結果の大会名は印つきの名前として確かめる。
 *   フォーマット・カード・店舗は名前の決まった共有のマスタ（シード表の名前のまま）。
 * - 実装しないケース: DCIナンバーをDBで設定するもの（002・020）、試験メールの受信箱を使うもの（004）、
 *   DBで選手情報を消す・イベントのフォーマットを0件にする・デッキ登録なしの日程の登録期限を設定するもの（010・011・013・025）。
 */
import { test, Page } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { 大会デッキ一覧, デッキのカード一覧 } from "../../db/f06_16_k";
import { 日程のデッキ件数 } from "../../db/f06_17";
import { loginAdmin } from "../../lib/session";
import { デッキ表示を開く, デッキ表示を読む, デッキ表示 } from "../../pages/admin/f06_17_decklist";
import { EntryListPage } from "../../pages/admin/m13_06_entry_list";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { デッキ編集画面, 日時の表記 } from "../../pages/admin/m15_05_deck_edit";
import { DeckEntryCheckPage, 送信先のイベント詳細IDを書き換える, 選択フォーマットを設定する, トークンの入力要素を削除する } from "../../pages/front/f06_17_deck_check_k";
import { DeckEntryEditPage } from "../../pages/front/f06_16_deck_entry_k";
import { FrontRecommend } from "../../pages/front/f03_05_recommend";
import { rc } from "../../lib/run_marker";
import { PE管理者, カード, 会員, 大会名, 店名, 形式, 画像なしカード, 連携店名, 連携形式 } from "../../seeds/f06-17-k";
import "../../seeds/f06-17"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 名日 = { A: カード.通常A.名日, B: カード.通常B.名日 };

/** 事前準備の「〜の会員でログインし」: ケースの会員でフロントにログインする */
async function ログイン(page: Page, key: string): Promise<DeckEntryEditPage> {
  const d = new DeckEntryEditPage(page);
  const m = 会員(key);
  await d.ログインする(m.メール, m.パスワード);
  return d;
}

/** 手順「〜の大会デッキ登録編集画面を開く」 */
async function 編集画面を開く(d: DeckEntryEditPage, イベント詳細ID: string): Promise<void> {
  const status = await d.開く(イベント詳細ID);
  expect(status, "大会デッキ登録編集画面の応答").toBe(200);
  expect(await d.編集画面である(), "大会デッキ登録編集画面が表示される").toBe(true);
}

/** 手順「フォーマットに『…』」。選択エリアが無い（選べるフォーマットが1つ）ときは選べないので注記に残す（フォームは隠し項目でそのフォーマットを送る） */
async function フォーマットを選ぶ(d: DeckEntryEditPage, 名: string): Promise<void> {
  if (await d.フォーマット選択エリア.isVisible()) { await d.フォーマットを選ぶ(名); return; }
  const v = await d.選択フォーマットの送信項目.evaluateAll((es) => es.map((e) => (e as HTMLInputElement).value));
  note(`フォーマット選択エリアは表示されない（大会のフォーマットが「${名}」の1つだけ）。「${名}」を選ぶ操作はできず、フォームは隠し項目でフォーマット（ID ${v.join("、")}）を送る`);
}

/** 手順「メインボードに…、サイドボードに…を入力する」 */
async function 入力する(d: DeckEntryEditPage, メイン: string, サイド: string): Promise<void> {
  await d.メインボード.fill(メイン);
  await d.サイドボード.fill(サイド);
  expect(await d.値(d.メインボード), "メインボードに入れた内容").toBe(メイン);
  expect(await d.値(d.サイドボード), "サイドボードに入れた内容").toBe(サイド);
}

/** 手順「『デッキリストを提出する』を押す」。送信されなかったときは注記に残す */
async function 提出する(d: DeckEntryEditPage): Promise<void> {
  const r = await d.提出する();
  if (!r.sent) note("「デッキリストを提出する」を押しても画面が移らなかった（送信されていない）");
}

const 名英 = (日: string): string => Object.values(カード).find((c) => c.名日 === 日)?.名英 ?? (日 === 画像なしカード.名日 ? 画像なしカード.名英 : 日);

/** 上書き（005・CB045〜048）の確かめ: 控えたデッキが1件のまま、カードが通常カードA×2・通常カードB×1だけ */
function 上書きを確かめる(rows: ReturnType<typeof 大会デッキ一覧>, デッキID: string): ReturnType<typeof 大会デッキ一覧>[number] | undefined {
  expect.soft(rows.map((r) => r.デッキID), "イベント詳細・選手・フォーマットのデッキ（追加されず、控えたデッキの1件だけ）").toEqual([デッキID]);
  const r = rows.find((x) => x.デッキID === デッキID);
  const cards = デッキのカード一覧(デッキID).map((c) => `${c.ボード}:${c.カード名英}×${c.枚数}`).sort();
  expect.soft(cards, "デッキのカード（旧カードの行が無く、通常カードA・2枚と通常カードB・1枚だけ）").toEqual([`サイドボード:${名英(名日.B)}×1`, `メインボード:${名英(名日.A)}×2`].sort());
  expect.soft(r?.内容メイン.trim(), "上書きされたメインボード").toBe(`2 ${名日.A}`);
  expect.soft(r?.内容サイド.trim(), "上書きされたサイドボード").toBe(`1 ${名日.B}`);
  return r;
}

function プレイヤー名のケース(n: "006" | "007", 期待: string) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const d = await ログイン(page, n);
    const ed = notes.get(`〔イベント詳細ID-F0617-${n}〕`), pl = notes.get(`〔選手ID-F0617-${n}〕`), fm = notes.get("〔フォーマットID-F0617-共有A〕");
    let rows: ReturnType<typeof 大会デッキ一覧> = [];
    await step(1, async () => { await 編集画面を開く(d, ed); });
    await step(2, async () => { await フォーマットを選ぶ(d, 形式.A.名日); await 入力する(d, `1 ${名日.A}`, `1 ${名日.B}`); });
    await step(3, async () => { await 提出する(d); });
    await step(4, async () => { rows = 大会デッキ一覧(ed, pl, fm); });
    await expected(async () => {
      expect(rows.length, "登録されたデッキの件数").toBe(1);
      expect.soft(rows[0]?.プレイヤー名 ?? null, "保存されたプレイヤー名").toBe(期待);
    });
  };
}

function トークンのケース(n: "008" | "009") {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const d = await ログイン(page, n);
    const ed = notes.get(`〔イベント詳細ID-F0617-${n}〕`), pl = notes.get(`〔選手ID-F0617-${n}〕`), fm = notes.get("〔フォーマットID-F0617-共有A〕");
    let rows: ReturnType<typeof 大会デッキ一覧> = [];
    await step(1, async () => { await 編集画面を開く(d, ed); });
    await step(2, async () => { await 入力する(d, `1 ${名日.A}`, `1 ${名日.B}`); });
    await step(3, async () => {
      if (n === "008") expect(await トークンの入力要素を削除する(d), "取り除いたなりすまし対策トークンの入力要素の数").toBeGreaterThan(0);
      else {
        await d.トークンを書き換える("invalid-token");
        expect(await d.入力フォーム.locator('input[name="_token"]').inputValue(), "書き換えたなりすまし対策トークン").toBe("invalid-token");
      }
    });
    await step(4, async () => { await 提出する(d); note(`提出後の画面のアドレス: ${d.path}`); });
    await step(5, async () => { rows = 大会デッキ一覧(ed, pl, fm); });
    await expected(async () => {
      expect.soft(rows.length, "イベント詳細・選手・フォーマットのデッキの件数").toBe(0);
    });
  };
}

caseTest("IT-F06-17-012", async ({ page, notes, step, expected }) => {
  const d = await ログイン(page, "012");
  let n = -1;
  await step(1, async () => { await 編集画面を開く(d, notes.get("〔イベント詳細ID-F0617-012〕")); });
  await step(2, async () => {
    expect(await 送信先のイベント詳細IDを書き換える(d, "61749012"), "書き換えたフォームの送信先").toBe("/ja/deckentry/61749012/update");
  });
  await step(3, async () => { await 入力する(d, `1 ${名日.A}`, `1 ${名日.B}`); await 提出する(d); note(`送信後の画面のアドレス: ${d.path}`); });
  await step(4, async () => { n = 日程のデッキ件数("61749012"); });
  await expected(async () => { expect.soft(n, "イベント詳細ID 61749012 のデッキの件数").toBe(0); });
});

// ---------------------------------------------------------------------------
// 内容エラー（015・016）
// ---------------------------------------------------------------------------

const エラーのメイン = ["1 不明カードX", `1 ${カード.禁止B.名日}`, `2 ${カード.制限R.名日}`, `5 ${名日.A}`].join("\n");
const エラーのサイド = `3 ${カード.範囲外O.名日}`;

// ---------------------------------------------------------------------------
// デッキ登録完了画面
// ---------------------------------------------------------------------------

/** 手順「デッキID 〔…〕の大会デッキ登録完了画面を開く」 */
async function 完了画面を開く(c: DeckEntryCheckPage, デッキID: string): Promise<void> {
  const status = await c.開く(デッキID);
  expect(status, "デッキ登録完了画面の応答").toBe(200);
  expect(await c.完了画面である(), "デッキ登録完了画面が表示される").toBe(true);
}


caseTest("IT-F06-17-026", async ({ page, step, expected }) => {
  await ログイン(page, "026");
  const c = new DeckEntryCheckPage(page);
  let status = 0;
  await step(1, async () => { status = await c.開く("61759026"); });
  await expected(async () => {
    note(`開いたときの応答は ${status}`);
    expect.soft(await c.完了画面である(), "デッキ登録完了画面が表示されているか").toBe(false);
    expect.soft(await c.見出し.count(), "デッキ登録完了画面の見出しの数").toBe(0);
  });
});

caseTest("IT-F06-17-028", async ({ page, notes, step, expected }) => {
  await ログイン(page, "028");
  const c = new DeckEntryCheckPage(page);
  let status = 0;
  await step(1, async () => { status = await c.開く(notes.get("〔デッキID-F0617-028〕")); });
  await expected(async () => {
    note(`開いたときの応答は ${status}`);
    expect.soft(await c.完了画面である(), "デッキ登録完了画面が表示されているか").toBe(false);
    expect.soft(await c.見出し.count(), "デッキ登録完了画面の見出しの数").toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 連携（PE）
// ---------------------------------------------------------------------------

const 連携のメイン = "4 連携稲妻\n20 連携島", 連携のサイド = "3 連携否認";
const PE大会名 = (番号: string, M15 = false) => 大会名(M15 ? `連携デッキ大会M15-F0617-PE${番号}` : `連携デッキ大会-F0617-PE${番号}`);

/** 手順1〜4（フロントでログインし、デッキを提出して、デッキ登録完了画面が表示されることを確かめる） */
async function PEの提出(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>, ed: string, key: string): Promise<DeckEntryEditPage> {
  const d = new DeckEntryEditPage(page);
  await step(1, async () => { const m = 会員(key); await d.ログインする(m.メール, m.パスワード); });
  await step(2, async () => { await 編集画面を開く(d, ed); });
  await step(3, async () => { await フォーマットを選ぶ(d, 連携形式.名日); await 入力する(d, 連携のメイン, 連携のサイド); await 提出する(d); });
  await step(4, async () => {
    expect(d.完了画面のデッキID(), "デッキ登録完了画面のアドレス").not.toBeNull();
    expect(await new DeckEntryCheckPage(page).完了画面である(), "デッキ登録完了画面が表示される").toBe(true);
  });
  return d;
}

/** 手順5・6（イベント申込一覧でデッキ登録を検索） */
async function 申込一覧で検索する(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>, 大会名: string): Promise<EntryListPage> {
  const l = new EntryListPage(page);
  await step(5, async () => { await loginAdmin(page, PE管理者); await l.開く(); });
  await step(6, async () => {
    await l.検索種別("デッキ登録を検索").check();
    await l.イベント名.fill(大会名);
    await l.開始時間を空にする();
    note(`店舗は既定表示のまま（${(await l.選ばれている店舗()).join("、") || "指定なし"}）`);
    await l.検索する();
  });
  return l;
}

/** 手順5〜7（デッキ一覧で、日付クリアのあとイベント名で検索） */
async function デッキ一覧で検索する(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>, 大会名: string): Promise<デッキ一覧> {
  const l = new デッキ一覧(page);
  await step(5, async () => { await loginAdmin(page, PE管理者); await l.開く(); });
  await step(6, async () => {
    await l.日付クリア.click();
    await expect(l.f("event_date_from"), "イベント開催日(From)が空").toHaveValue("");
    await expect(l.f("event_date_to"), "イベント開催日(To)が空").toHaveValue("");
  });
  await step(7, async () => { await l.f("event_name").fill(大会名); await l.検索する(); });
  return l;
}

/** 手順8（検索結果のデッキ情報を押す） */
async function デッキ情報を押す(page: Page, l: デッキ一覧): Promise<デッキ編集画面> {
  const ids = await l.表示されたID();
  expect(ids.length, "検索結果のデッキ情報の数").toBe(1);
  const link = l.行(ids[0]).locator("td").nth(1).locator("a").first();
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  return e;
}

function CB上書きのケース(n: "045" | "046" | "047" | "048") {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const d = await ログイン(page, `CB${n}`);
    const ed = notes.get(`〔イベント詳細ID-F0617-CB${n}〕`), pl = notes.get(`〔選手ID-F0617-CB${n}〕`), fm = notes.get("〔フォーマットID-F0617-共有A〕");
    const id = notes.get(`〔デッキID-F0617-CB${n}〕`);
    let rows: ReturnType<typeof 大会デッキ一覧> = [];
    await step(1, async () => { await 編集画面を開く(d, ed); });
    await step(2, async () => { await フォーマットを選ぶ(d, 形式.A.名日); await 入力する(d, `2 ${名日.A}`, `1 ${名日.B}`); });
    await step(3, async () => { await 提出する(d); });
    await step(4, async () => { rows = 大会デッキ一覧(ed, pl, fm); });
    await expected(async () => {
      const r = 上書きを確かめる(rows, id);
      expect.soft(r?.プレイヤー名 ?? null, "プレイヤー名（変わらない）").toBe(`F0617-CB${n}-KEEP`);
    });
  };
}

