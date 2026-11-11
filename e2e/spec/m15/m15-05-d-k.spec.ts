// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M15-05 デッキ編集（管理画面）。ケースの正本: integration_test/casegen/cases/M15-05_test_cases.tsv
 *
 * DB への書き込みで準備したシードを使うケース（現行フォーマット=真・代表カード未設定・記事の紐づけ・検討中のカード）。
 * 依頼者の承認 2026-11-10「印つきデータは何でも」: 画面で登録した実行の印つきのデッキにだけ、DBで整えた（seeds/m15-05-d.ts）。
 * 整えたことはシードの報告（シード作成時の問題）に出る。
 *
 * 画面の表示名は正本と少し違う（M15-05 のほかのケースと同じ）: 代表カードの検索を開くボタン「代表カード検索」→「代表カード選択」
 * （検索の画面のボタンは「検索」、行のボタンは「決定」）。違いは手順の注記に残す。
 * デッキ名は、検索語に使える前半に実行の印を付けている（seeds/m15-05.ts の 名()）。
 */
import { test, Page } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { デッキ編集画面, デッキ名で検索する, デッキ情報を開く } from "../../pages/admin/m15_05_deck_edit";
import { M1505_ADMIN, 名, カード画像, ALPHA, BETA } from "../../seeds/m15-05-k";
import "../../seeds/m15-05-d-k";
import "../../seeds/m15-05-b"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const パス = (page: Page) => new URL(page.url()).pathname;
const 行 = (t: string) => t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const 規格外の警告 = (ボード: string) => `${ボード}のカードが、現行フォーマットに則さない形で登録されています。`;
type ボード名 = "メインボード" | "サイドボード" | "統率";
const 欄 = (e: デッキ編集画面, b: ボード名) => (b === "メインボード" ? e.メイン : b === "サイドボード" ? e.サイド : e.統率);
const 代表カード検索の注記 = "「代表カード検索」は画面では「代表カード選択」。検索の画面のボタンは「検索」、行のボタンは「決定」";

async function login(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await loginAdmin(page, M1505_ADMIN);
}

/** 一覧を開いてデッキ名で検索し（手順1）、検索結果のデッキ情報を開く（手順2） */
async function 検索して開く(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>, 正本名: string): Promise<デッキ編集画面> {
  let e!: デッキ編集画面;
  await step(1, async () => { await デッキ名で検索する(page, 名(正本名)); });
  await step(2, async () => { e = await デッキ情報を開く(page, 名(正本名)); });
  return e;
}

/** 代表カードが、そのカードの画像（名前の欄と画像の参照先）であることを確かめる */
async function 代表カードを確かめる(e: デッキ編集画面, カード: string, 違うカード?: string): Promise<void> {
  const r = await e.代表カード();
  expect.soft(r.名前, `代表カードの名前の欄（${カード}）`).toContain(カード);
  const url = カード画像.get(カード);
  if (url) expect.soft(r.画像, `代表カードの画像の参照先（${カード}の画像）`).toContain(url.replace(/^\//, ""));
  else expect.soft(r.画像, "代表カードの画像が表示されている").not.toBe("");
  if (違うカード) {
    expect.soft(r.名前.includes(違うカード), `代表カードの名前の欄に ${違うカード} が出ている`).toBe(false);
    const other = カード画像.get(違うカード);
    if (other && other !== url) expect.soft(r.画像.includes(other.replace(/^\//, "")), `代表カードの画像が ${違うカード} の画像になっている`).toBe(false);
  }
}

// ---------------------------------------------------------------- 現行フォーマットの警告（066〜074）

type 警告のケース = { no: string; ボード: ボード名; 入力: string; 詳細: RegExp; 詳細の文: string };

function 警告が出る(v: 警告のケース): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const e = await 検索して開く(page, step, `M1505-${v.no}-デッキ`);
    let 警告: string[] = [];
    await step(3, async () => { await 欄(e, v.ボード).fill(v.入力); });
    await step(4, async () => { await e.送信する(e.更新ボタン); await e.読み込みを待つ(); 警告 = await e.警告(); note(`更新後の表示: ${[...await e.成功の帯(), ...警告].join(" / ")}`); });
    await expected(async () => {
      expect.soft(パス(page), "更新後の画面（デッキ編集画面）").toMatch(/\/deck\/\d+\/edit$/);
      expect.soft(警告.some((t) => t.includes(規格外の警告(v.ボード))), `警告「${規格外の警告(v.ボード)}」が表示されている`).toBe(true);
      expect(v.詳細.test(警告.join(" ")), `詳細メッセージ「${v.詳細の文}」が表示されている（実際の警告: ${警告.join(" / ")}）`).toBe(true);
    });
  };
}
caseTest("IT-M15-05-066", 警告が出る({ no: "066", ボード: "メインボード", 入力: "2 DeckTestBanned", 詳細: /1 行目の DeckTestBanned は禁止カードです/, 詳細の文: "1 行目の DeckTestBanned は禁止カードです" }));
caseTest("IT-M15-05-067", 警告が出る({ no: "067", ボード: "メインボード", 入力: "1 DeckTestOut", 詳細: /1 行目の DeckTestOut はフォーマットの範囲から外れています/, 詳細の文: "1 行目の DeckTestOut はフォーマットの範囲から外れています" }));
caseTest("IT-M15-05-068", 警告が出る({ no: "068", ボード: "メインボード", 入力: "5 DeckTestAlpha", 詳細: /1 行目の DeckTestAlpha が.*登録されています/, 詳細の文: "1 行目の DeckTestAlpha が…登録されています" }));
caseTest("IT-M15-05-069", 警告が出る({ no: "069", ボード: "メインボード", 入力: "2 DeckTestAlpha", 詳細: /1 行目の DeckTestAlpha .*2枚以上登録されています/, 詳細の文: "1 行目の DeckTestAlpha …2枚以上登録されています" }));
caseTest("IT-M15-05-070", 警告が出る({ no: "070", ボード: "統率", 入力: "1 DeckTestAlpha", 詳細: /このフォーマットでは統率用カードを使用しません/, 詳細の文: "このフォーマットでは統率用カードを使用しません" }));
caseTest("IT-M15-05-073", 警告が出る({ no: "073", ボード: "サイドボード", 入力: "1 DeckTestBanned", 詳細: /1 行目の DeckTestBanned は禁止カードです/, 詳細の文: "1 行目の DeckTestBanned は禁止カードです" }));
caseTest("IT-M15-05-074", 警告が出る({ no: "074", ボード: "統率", 入力: "1 DeckTestBanned", 詳細: /1 行目の DeckTestBanned は禁止カードです/, 詳細の文: "1 行目の DeckTestBanned は禁止カードです" }));

function メインに2行を入れて警告(no: string, 行1: string, 行2: string, 詳細: RegExp, 詳細の文: string): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const e = await 検索して開く(page, step, `M1505-${no}-デッキ`);
    let 警告: string[] = [];
    await step(3, async () => { await e.メイン.fill(`${行1}\n${行2}`); });
    await step(4, async () => { await e.送信する(e.更新ボタン); await e.読み込みを待つ(); 警告 = await e.警告(); note(`更新後の表示: ${[...await e.成功の帯(), ...警告].join(" / ")}`); });
    await expected(async () => {
      expect.soft(パス(page), "更新後の画面（デッキ編集画面）").toMatch(/\/deck\/\d+\/edit$/);
      expect.soft(警告.some((t) => t.includes(規格外の警告("メインボード"))), `警告「${規格外の警告("メインボード")}」が表示されている`).toBe(true);
      expect(詳細.test(警告.join(" ")), `詳細メッセージ「${詳細の文}」が表示されている（実際の警告: ${警告.join(" / ")}）`).toBe(true);
    });
  };
}
caseTest("IT-M15-05-071", メインに2行を入れて警告("071", "3 DeckTestAlpha", "3 DeckTestBeta", /ボード内のカード枚数が 5 枚を上回っています/, "ボード内のカード枚数が 5 枚を上回っています"));
caseTest("IT-M15-05-072", メインに2行を入れて警告("072", "2 DeckTestAlpha", "2 DeckTestBeta", /ボード内のカード枚数が 5 枚を下回っています/, "ボード内のカード枚数が 5 枚を下回っています"));

caseTest("IT-M15-05-075", async ({ page, step, expected, notes }) => {
  await login(page);
  const e = await 検索して開く(page, step, "M1505-075-デッキ");
  await step(3, async () => { await e.メイン.fill("1 DeckTestBanned"); await e.送信する(e.更新ボタン); note(`更新後の表示: ${[...await e.成功の帯(), ...await e.警告()].join(" / ")}`); });
  let メイン: string[] = [];
  await step(4, async () => {
    await page.goto(adminUrl(`/deck/${notes.get("〔デッキID-M1505-075〕")}/edit`));
    await e.読み込みを待つ();
    メイン = 行(await e.メイン.inputValue());
  });
  await expected(async () => {
    expect(メイン, "開き直したデッキ編集画面の「メインボード」（警告が出ても保存される）").toEqual(["1 DeckTestBanned"]);
  });
});

// ---------------------------------------------------------------- 警告が出ない保存（145〜149）

function 警告なしで保存(no: string, メイン: string[], 保存後のメイン: string[]): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const e = await 検索して開く(page, step, `M1505-${no}-デッキ`);
    await step(3, async () => { await e.メイン.fill(メイン.join("\n")); });
    await step(4, async () => { await e.送信する(e.更新ボタン); });
    let 警告: string[] = [];
    let 実際: string[] = [];
    await step(5, async () => { await e.読み込みを待つ(); 警告 = await e.警告(); 実際 = 行(await e.メイン.inputValue()); note(`更新後の表示: ${[...await e.成功の帯(), ...警告].join(" / ")}`); });
    await expected(async () => {
      expect.soft(パス(page), "更新後の画面（デッキ編集画面）").toMatch(/\/deck\/\d+\/edit$/);
      expect.soft(警告.some((t) => t.includes(規格外の警告("メインボード"))), `警告「${規格外の警告("メインボード")}」が表示されない`).toBe(false);
      expect(実際, "「メインボード」に入力したカードがそのまま保存されている").toEqual(保存後のメイン);
    });
  };
}
caseTest("IT-M15-05-145", 警告なしで保存("145", ["4 DeckTestAlpha"], ["4 DeckTestAlpha"]));
caseTest("IT-M15-05-146", 警告なしで保存("146", ["1 DeckTestAlpha"], ["1 DeckTestAlpha"]));
caseTest("IT-M15-05-147", 警告なしで保存("147", ["3 DeckTestAlpha", "2 DeckTestBeta"], ["3 DeckTestAlpha", "2 DeckTestBeta"]));
caseTest("IT-M15-05-148", 警告なしで保存("148", ["3 DeckTestAlpha", "2 DeckTestBeta"], ["3 DeckTestAlpha", "2 DeckTestBeta"]));

caseTest("IT-M15-05-149", async ({ page, step, expected }) => {
  await login(page);
  const e = await 検索して開く(page, step, "M1505-149-デッキ");
  await step(3, async () => { await e.メイン.fill("4 DeckTestAlpha"); await e.サイド.fill("1 DeckTestBanned"); });
  await step(4, async () => { await e.送信する(e.更新ボタン); });
  let 警告: string[] = [];
  await step(5, async () => { await e.読み込みを待つ(); 警告 = await e.警告(); note(`更新後の表示: ${[...await e.成功の帯(), ...警告].join(" / ")}`); });
  await expected(async () => {
    expect.soft(警告.some((t) => t.includes(規格外の警告("サイドボード"))), `警告「${規格外の警告("サイドボード")}」が表示されている`).toBe(true);
    expect.soft(/1 行目の DeckTestBanned は禁止カードです/.test(警告.join(" ")), `詳細メッセージ「1 行目の DeckTestBanned は禁止カードです」が表示されている（実際の警告: ${警告.join(" / ")}）`).toBe(true);
    expect(警告.some((t) => t.includes(規格外の警告("メインボード"))), `警告「${規格外の警告("メインボード")}」が表示されない`).toBe(false);
  });
});

// ---------------------------------------------------------------- 更新で代表カード・デッキリスト・警告を確かめる（163〜165・186〜194）

type 更新のケース = {
  no: string;
  /** 代表カード選択で選ぶカード（選ばないなら省略） */
  代表カード?: string;
  メイン?: string[]; 統率?: string[];
  /** 期待する警告（無ければ警告なし） */
  警告?: { ボード: ボード名; 詳細: RegExp; 詳細の文: string };
  期待の代表カード: string; 違うカード?: string;
  期待のボード: { メイン?: string[]; 統率?: string[]; サイド?: string[] };
};

function 更新して確かめる(v: 更新のケース): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const e = await 検索して開く(page, step, `M1505-CB${v.no}-デッキ`);
    await step(3, async () => {
      if (v.代表カード) { note(代表カード検索の注記); await e.代表カードを選ぶ(v.代表カード, { 完全一致: true }); }
      else note("代表カードは選ばない");
    });
    await step(4, async () => {
      await e.メイン.fill((v.メイン ?? []).join("\n"));
      if (v.統率) await e.統率.fill(v.統率.join("\n"));
    });
    await step(5, async () => { await e.送信する(e.更新ボタン); });
    let 警告: string[] = [];
    await step(6, async () => { await e.読み込みを待つ(); 警告 = await e.警告(); note(`更新後の表示: ${[...await e.成功の帯(), ...警告].join(" / ")}`); });
    await expected(async () => {
      expect.soft(パス(page), "更新後の画面（デッキ編集画面）").toMatch(/\/deck\/\d+\/edit$/);
      await 代表カードを確かめる(e, v.期待の代表カード, v.違うカード);
      for (const [k, b] of [["メイン", "メインボード"], ["サイド", "サイドボード"], ["統率", "統率"]] as const) {
        const want = v.期待のボード[k] ?? [];
        expect.soft(行(await 欄(e, b).inputValue()), `「${b}」の行`).toEqual(want);
      }
      if (v.警告) {
        expect.soft(警告.some((t) => t.includes(規格外の警告(v.警告!.ボード))), `警告「${規格外の警告(v.警告!.ボード)}」が表示されている`).toBe(true);
        expect.soft(v.警告.詳細.test(警告.join(" ")), `詳細メッセージ「${v.警告.詳細の文}」が表示されている（実際の警告: ${警告.join(" / ")}）`).toBe(true);
      } else {
        expect.soft(警告.some((t) => t.includes("現行フォーマットに則さない形で登録されています。")), "「現行フォーマットに則さない形で登録されています。」の警告が表示されない").toBe(false);
      }
    });
  };
}

caseTest("IT-M15-05-163", 更新して確かめる({
  no: "163", 代表カード: BETA, メイン: [`2 ${ALPHA}`, `1 ${BETA}`, `2 ${ALPHA}`], 期待の代表カード: BETA, 違うカード: ALPHA,
  期待のボード: { メイン: [`4 ${ALPHA}`, `1 ${BETA}`] },
}));
caseTest("IT-M15-05-164", 更新して確かめる({
  no: "164", メイン: ["1 M1505-CB164-Nothing"], 期待の代表カード: ALPHA, 期待のボード: {},
  警告: { ボード: "メインボード", 詳細: /1 行目の M1505-CB164-Nothing は存在しません/, 詳細の文: "1 行目の M1505-CB164-Nothing は存在しません" },
}));
caseTest("IT-M15-05-165", 更新して確かめる({ no: "165", 代表カード: BETA, メイン: [], 期待の代表カード: BETA, 違うカード: ALPHA, 期待のボード: {} }));

caseTest("IT-M15-05-186", 更新して確かめる({
  no: "186", 代表カード: BETA, メイン: ["1 M1505-CB186-NoCard"], 期待の代表カード: BETA, 期待のボード: {},
  警告: { ボード: "メインボード", 詳細: /1 行目の M1505-CB186-NoCard は存在しません/, 詳細の文: "1 行目の M1505-CB186-NoCard は存在しません" },
}));
caseTest("IT-M15-05-187", 更新して確かめる({ no: "187", 代表カード: BETA, メイン: [`2 ${ALPHA}`], 期待の代表カード: BETA, 期待のボード: { メイン: [`2 ${ALPHA}`] } }));
caseTest("IT-M15-05-188", 更新して確かめる({
  no: "188", 代表カード: BETA, メイン: ["1 DeckTestBanned"], 期待の代表カード: BETA, 期待のボード: { メイン: ["1 DeckTestBanned"] },
  警告: { ボード: "メインボード", 詳細: /1 行目の DeckTestBanned は禁止カードです/, 詳細の文: "1 行目の DeckTestBanned は禁止カードです" },
}));
caseTest("IT-M15-05-189", 更新して確かめる({
  no: "189", 代表カード: BETA, メイン: ["1 DeckTestOut"], 期待の代表カード: BETA, 期待のボード: { メイン: ["1 DeckTestOut"] },
  警告: { ボード: "メインボード", 詳細: /1 行目の DeckTestOut はフォーマットの範囲から外れています/, 詳細の文: "1 行目の DeckTestOut はフォーマットの範囲から外れています" },
}));
caseTest("IT-M15-05-190", 更新して確かめる({
  no: "190", 代表カード: BETA, メイン: [`5 ${ALPHA}`], 期待の代表カード: BETA, 期待のボード: { メイン: [`5 ${ALPHA}`] },
  警告: { ボード: "メインボード", 詳細: /1 行目の DeckTestAlpha が.*5枚以上登録されています/, 詳細の文: "1 行目の DeckTestAlpha が…5枚以上登録されています" },
}));
caseTest("IT-M15-05-191", 更新して確かめる({
  no: "191", 代表カード: BETA, メイン: [`2 ${ALPHA}`], 期待の代表カード: BETA, 期待のボード: { メイン: [`2 ${ALPHA}`] },
  警告: { ボード: "メインボード", 詳細: /1 行目の DeckTestAlpha .*2枚以上登録されています/, 詳細の文: "1 行目の DeckTestAlpha …2枚以上登録されています" },
}));
caseTest("IT-M15-05-192", 更新して確かめる({
  no: "192", 代表カード: BETA, メイン: [], 統率: [`1 ${ALPHA}`], 期待の代表カード: BETA, 期待のボード: { 統率: [`1 ${ALPHA}`] },
  警告: { ボード: "統率", 詳細: /このフォーマットでは統率用カードを使用しません/, 詳細の文: "このフォーマットでは統率用カードを使用しません" },
}));
caseTest("IT-M15-05-193", 更新して確かめる({
  no: "193", 代表カード: BETA, メイン: [`3 ${ALPHA}`, `3 ${BETA}`], 期待の代表カード: BETA, 期待のボード: { メイン: [`3 ${ALPHA}`, `3 ${BETA}`] },
  警告: { ボード: "メインボード", 詳細: /ボード内のカード枚数が 5 枚を上回っています/, 詳細の文: "ボード内のカード枚数が 5 枚を上回っています" },
}));
caseTest("IT-M15-05-194", 更新して確かめる({
  no: "194", 代表カード: BETA, メイン: [`2 ${ALPHA}`, `2 ${BETA}`], 期待の代表カード: BETA, 期待のボード: { メイン: [`2 ${ALPHA}`, `2 ${BETA}`] },
  警告: { ボード: "メインボード", 詳細: /ボード内のカード枚数が 5 枚を下回っています/, 詳細の文: "ボード内のカード枚数が 5 枚を下回っています" },
}));

// ---------------------------------------------------------------- 記事の紐づけ・代表カード未設定・検討中のカード（090・104・105・111・131・132）

const 記事の削除エラー = "記事に紐付いているデッキがあるため削除できません。";

caseTest("IT-M15-05-090", async ({ page, step, expected, notes }) => {
  await login(page);
  const 元のID = notes.get("〔デッキID-M1505-090〕");
  const デッキ名 = 名("M1505-090-デッキ");
  const e = await 検索して開く(page, step, "M1505-090-デッキ");
  await step(3, async () => { await e.複製の画面を開く(); await e.複製回数.fill("1"); await e.送信する(e.複製保存ボタン); });
  await step(4, async () => { await デッキ名で検索する(page, デッキ名); });
  let 複製側: デッキ編集画面;
  await step(5, async () => {
    const hrefs = await page.locator(".deck-result-table tbody tr td:nth-child(2) a").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""));
    const 編集 = [...new Set(hrefs.filter((h) => /\/deck\/\d+\/edit/.test(h)))];
    expect(編集.length, "検索結果のデッキ（元と複製の2件）").toBe(2);
    const もう一方 = 編集.find((h) => !new RegExp(`/deck/${元のID}/edit`).test(h));
    expect(もう一方, `編集画面のアドレスのデッキIDが ${元のID} でない方`).toBeTruthy();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator(`.deck-result-table tbody tr td:nth-child(2) a[href="${もう一方}"]`).first().click()]);
    複製側 = new デッキ編集画面(page);
    await 複製側.読み込みを待つ();
  });
  let 帯: { 成功: string[]; エラー: string[] } = { 成功: [], エラー: [] };
  await step(6, async () => {
    await 複製側!.削除する(true);
    帯 = { 成功: await 複製側!.成功の帯(), エラー: await 複製側!.エラーの帯() };
    note(`削除後の表示: 成功「${帯.成功.join(" / ")}」 エラー「${帯.エラー.join(" / ")}」`);
  });
  await expected(async () => {
    expect.soft(帯.成功.some((t) => t.includes("削除しました")), "「削除しました」が表示されている").toBe(true);
    expect(帯.エラー.some((t) => t.includes(記事の削除エラー)), `「${記事の削除エラー}」が表示されない`).toBe(false);
  });
});

caseTest("IT-M15-05-104", async ({ page, step, expected, notes }) => {
  await login(page);
  const e = await 検索して開く(page, step, "M1505-104-デッキ");
  let エラー: string[] = [];
  await step(3, async () => { await e.削除する(true); await e.読み込みを待つ(); エラー = await e.エラーの帯(); note(`削除後の表示: 成功「${(await e.成功の帯()).join(" / ")}」 エラー「${エラー.join(" / ")}」`); });
  await expected(async () => {
    expect.soft(エラー.some((t) => t.includes(記事の削除エラー)), `「${記事の削除エラー}」が表示されている`).toBe(true);
    expect.soft(パス(page), "遷移した画面（デッキ編集画面）").toBe(new URL(adminUrl(`/deck/${notes.get("〔デッキID-M1505-104〕")}/edit`)).pathname);
  });
});

caseTest("IT-M15-05-105", async ({ page, step, expected }) => {
  await login(page);
  const デッキ名 = 名("M1505-105-デッキ");
  const e = await 検索して開く(page, step, "M1505-105-デッキ");
  await step(3, async () => { await e.削除する(true); note(`削除後の表示: 成功「${(await e.成功の帯()).join(" / ")}」 エラー「${(await e.エラーの帯()).join(" / ")}」`); });
  await step(4, async () => { await デッキ名で検索する(page, デッキ名); });
  await expected(async () => {
    await expect.soft(page.locator(".deck-result-table tbody tr td:nth-child(2) a"), `検索結果の「${デッキ名}」のデッキ情報`).toHaveCount(1);
    expect(await new デッキ一覧(page).件数(), `検索結果の該当件数（「${デッキ名}」が1件）`).toBe(1);
  });
});

caseTest("IT-M15-05-111", async ({ page, step, expected }) => {
  await login(page);
  const e = await 検索して開く(page, step, "M1505-111-デッキ");
  await step(3, async () => { await e.成績.fill("M1505-111-成績"); await e.送信する(e.更新ボタン); });
  await step(4, async () => { await e.読み込みを待つ(); note(`更新後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`); });
  await expected(async () => {
    const r = await e.代表カード();
    expect.soft(r.名前, "代表カードの名前の欄（DeckTestAlpha）").toContain(ALPHA);
    expect.soft(r.画像, "代表カードの画像が表示されている").not.toBe("");
    await 代表カードを確かめる(e, ALPHA);
  });
});

caseTest("IT-M15-05-131", async ({ page, step, expected }) => {
  await login(page);
  const e = await 検索して開く(page, step, "M1505-131-デッキ");
  await step(3, async () => { await e.削除する(true); await e.読み込みを待つ(); note(`削除後の表示: 成功「${(await e.成功の帯()).join(" / ")}」 エラー「${(await e.エラーの帯()).join(" / ")}」`); });
  await expected(async () => {
    await expect(page.getByText("削除に失敗しました").first(), "「削除に失敗しました」の表示").toBeVisible();
  });
});

caseTest("IT-M15-05-132", async ({ page, step, expected, notes }) => {
  await login(page);
  const e = await 検索して開く(page, step, "M1505-132-デッキ");
  await step(3, async () => { await e.削除する(true); await e.読み込みを待つ(); note(`削除後の表示: 成功「${(await e.成功の帯()).join(" / ")}」 エラー「${(await e.エラーの帯()).join(" / ")}」`); });
  await expected(async () => {
    expect.soft(パス(page), "遷移した画面（デッキ編集画面）").toBe(new URL(adminUrl(`/deck/${notes.get("〔デッキID-M1505-132〕")}/edit`)).pathname);
    expect(await e.デッキ名.inputValue(), "デッキ編集画面のデッキ名").toBe(名("M1505-132-デッキ"));
  });
});
