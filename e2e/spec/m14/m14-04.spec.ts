/** M14-04 カード詳細(登録・編集・削除)。正本: cases/M14-04_test_cases.tsv */
import { test, Page } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import {
  カードの詳細, カードの値, カードの分類, カードのリーガリティ, カード名英でカードID, 詳細の画像, 詳細の件数, 画像の件数, カードの件数,
} from "../../db/m14_04_card";
import { CardSearchPage, select2に入れる } from "../../pages/admin/m14_card";
import { CardEditPage } from "../../pages/admin/m14_04_card_edit";
import { M1404_ADMIN, 必須 } from "../../seeds/m14-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
type 状態 = { card: ReturnType<typeof カードの値>; details: ReturnType<typeof カードの詳細>; legality: ReturnType<typeof カードのリーガリティ> };
/** DB確認の手順で、カードの保存結果を読む */
const 読む = (id: string | undefined): 状態 => ({ card: id ? カードの値(id) : null, details: id ? カードの詳細(id) : [], legality: id ? カードのリーガリティ(id) : [] });
const 長い = (n: number, c = "あ") => c.repeat(n);

/** ログインして、カード詳細(編集・削除)画面を開くところまでを手順1にする型 */
async function 編集を開く(page: Page, カードID: string): Promise<CardEditPage> {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  await e.open(カードID);
  return e;
}

// ---------------------------------------------------------------------------
// 画面部品・初期表示
// ---------------------------------------------------------------------------

caseTest("IT-M14-04-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const r = { foilPromo: 0, 新規登録: 0, 戻る: 0 };
  await step(1, async () => { await e.openNew(); });
  await step(2, async () => {
    // 詳細情報の入力欄の雛形（「詳細情報を追加」で出る部品）も含めて調べる
    const proto = (await page.locator("#card-details-container").getAttribute("data-prototype")) ?? "";
    const body = await page.locator("body").innerText();
    r.foilPromo = (proto.match(/Foil・プロモ/g) ?? []).length + (body.match(/Foil・プロモ/g) ?? []).length;
    r.新規登録 = await page.locator("a, button").filter({ hasText: /^\s*新規登録\s*$/ }).count();
    r.戻る = await page.locator("a, button").filter({ hasText: /^\s*戻る\s*$/ }).count();
  });
  await expected(async () => {
    expect.soft(r.foilPromo, "「Foil・プロモ」の項目の数").toBe(0);
    expect.soft(r.新規登録, "「新規登録」ボタンの数").toBe(0);
    expect.soft(r.戻る, "「戻る」ボタンの数").toBe(0);
  });
});

caseTest("IT-M14-04-002", async ({ page, notes, step, expected }) => {
  const e = await 編集を開く(page, notes.get("〔カードID-M1404-共有〕"));
  const r = { 更新: 0, 削除: 0, 画像削除: 0, アップロード: 0, 画像追加: 0 };
  await step(1, async () => { await e.open(notes.get("〔カードID-M1404-共有〕")); });
  await step(2, async () => {
    r.更新 = await page.locator("button, a, input[type=submit]").filter({ hasText: /^\s*更新\s*$/ }).count();
    // 画面下部の削除ボタンは4系のカード削除ボタン1つだけ（旧い削除ボタンは別にもう1つ出る作りだった）
    r.削除 = await page.locator("button:visible, a:visible, input[type=button]:visible").filter({ hasText: /^\s*削除\s*$/ }).count();
    r.画像削除 = await page.locator("button, a").filter({ hasText: /画像.*削除|削除.*画像/ }).count();
    r.アップロード = await page.locator("input[type=file]").count();
    r.画像追加 = await page.locator("button, a").filter({ hasText: /画像を追加/ }).count();
  });
  await expected(async () => {
    expect.soft(r.更新, "旧「更新」ボタンの数").toBe(0);
    expect.soft(r.削除, "「削除」ボタンの数（4系のカード削除ボタン1つだけ。旧削除ボタンは出ない）").toBe(1);
    expect.soft(r.画像削除, "カード画像削除ボタンの数").toBe(0);
    expect.soft(r.アップロード, "カード画像アップロードの数").toBe(0);
    expect.soft(r.画像追加, "「画像を追加」ボタンの数").toBe(0);
  });
});

caseTest("IT-M14-04-003", async ({ page, notes, step, expected }) => {
  const e = await 編集を開く(page, notes.get("〔カードID-M1404-共有〕"));
  const r = { ラジオ: 0, Foil: "", 言語: "", フレーム: "" };
  await step(1, async () => { await e.open(notes.get("〔カードID-M1404-共有〕")); });
  await step(2, async () => {
    r.ラジオ = await e.リーガリティ行.first().locator('input[type="radio"][name$="[restriction]"]').count();
    const det = e.詳細一覧.first();
    const kind = async (loc: import("@playwright/test").Locator) => loc.first().evaluate((el) => el instanceof HTMLSelectElement ? (el.multiple ? "複数選択" : "ドロップダウン") : ((el as HTMLInputElement).type ?? el.tagName));
    r.Foil = await kind(det.locator('[name$="[foilFlg]"]'));
    r.言語 = await kind(det.locator('select[name$="[language]"]'));
    r.フレーム = await kind(det.locator('[name$="[frameFlg]"]'));
  });
  await expected(async () => {
    expect.soft(r.ラジオ, "リーガリティのラジオボタンの数（使用可・制限・禁止）").toBe(3);
    expect.soft(r.Foil, "Foilの入力部品").toBe("ドロップダウン");
    expect.soft(r.言語, "カードの言語の入力部品").toBe("ドロップダウン");
    expect.soft(["ドロップダウン", "radio"], "フレームの入力部品（単一選択）").toContain(r.フレーム);
  });
});

caseTest("IT-M14-04-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const r = { 行: -1, 詳細: -1, フォーマット: "", 使用可: false, カードセット: "" };
  await step(1, async () => { await e.openNew(); });
  await step(2, async () => {
    r.行 = await e.リーガリティ行.count();
    r.詳細 = await e.詳細一覧.count();
    if (r.行 > 0) {
      r.フォーマット = await e.リーガリティ行.first().locator('select[name$="[format]"]').evaluate((s) => (s as HTMLSelectElement).value);
      r.使用可 = (await e.リーガリティ行の値(e.リーガリティ行.first())).リーガリティ === "使用可";
    }
    if (r.詳細 > 0) r.カードセット = await e.詳細一覧.first().locator('select[name$="[cardset]"]').evaluate((s) => (s as HTMLSelectElement).value);
  });
  await expected(async () => {
    expect.soft(r.行, "初期表示のリーガリティ行の数（フォーマット選択とリーガリティの入力行）").toBeGreaterThan(0);
    expect.soft(r.フォーマット, "フォーマット選択が未選択").toBe("");
    expect.soft(r.使用可, "リーガリティが「使用可」の選択状態").toBe(true);
    expect.soft(r.詳細, "初期表示の詳細情報の数（カードセットの入力欄を持つ）").toBeGreaterThan(0);
    expect.soft(r.カードセット, "カードセットが未選択").toBe("");
  });
});

caseTest("IT-M14-04-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const r = { 値: [] as string[], 行: -1, 詳細: -1, action: "" };
  await step(1, async () => { await e.openNew(); });
  await expected(async () => {
    r.値 = await Promise.all(["nameJp", "nameEn", "textJp", "textEn", "manaCost", "cmc", "power", "toughness", "loyalty"].map((f) => e.field(f).inputValue()));
    r.行 = await e.リーガリティ行.count();
    r.詳細 = await e.詳細一覧.count();
    r.action = (await e.form.getAttribute("action")) ?? "";
    expect.soft(r.値.filter((v) => v !== ""), "基本情報の入力欄のうち値が入っているもの").toEqual([]);
    expect.soft(r.詳細, "登録済みの詳細情報の数").toBe(0);
    expect.soft(r.行, "登録済みのリーガリティの数").toBe(0);
    expect.soft(/\/card\/new$/.test(r.action), "登録の送信先が新規登録").toBe(true);
  });
});

caseTest("IT-M14-04-006", async ({ page, notes, step, expected }) => {
  const e = await 編集を開く(page, notes.get("〔カードID-M1404-共有〕"));
  const r = { 英: "", cmc: "", 番号: "" };
  await step(1, async () => { await e.open(notes.get("〔カードID-M1404-共有〕")); });
  await expected(async () => {
    r.英 = await e.field("nameEn").inputValue();
    r.cmc = await e.field("cmc").inputValue();
    r.番号 = (await e.詳細の値(e.詳細("240401"))).cardNo ?? "";
    expect.soft(r.英, "カード名(英)").toBe("BeforeCard");
    expect.soft(r.cmc, "点数で見たマナ・コスト").toBe("2");
    expect.soft(r.番号, "ID 240401のコレクターNo").toBe("BASE-001");
  });
});

caseTest("IT-M14-04-007", async ({ page, notes, step, expected }) => {
  const e = await 編集を開く(page, notes.get("〔カードID-M1404-共有〕"));
  let status = 0;
  await step(1, async () => { await e.open(notes.get("〔カードID-M1404-共有〕")); });
  await step(2, async () => {
    const res = await page.goto(page.url().replace(/\/card\/\d+\/edit/, "/card/999999/edit"));
    status = res?.status() ?? 0;
  });
  await expected(async () => { expect.soft(status, "存在しないカードIDの編集画面の応答").toBe(404); });
});

caseTest("IT-M14-04-008", async ({ page, notes, step, expected }) => {
  const e = await 編集を開く(page, notes.get("〔カードID-M1404-008〕"));
  let status = 0;
  await step(1, async () => { await e.open(notes.get("〔カードID-M1404-008〕")); });
  await step(2, async () => { await e.基本情報を入れる({ カード名英: "MissingCardUpdate" }); });
  await step(3, async () => {
    // 開発者ツールで送信先のカードIDを書き換えるのと同じ操作（フォームの送信先を999999へ）
    await e.form.evaluate((f) => f.setAttribute("action", (f.getAttribute("action") ?? "").replace(/\/card\/\d+\/edit/, "/card/999999/edit")));
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && /\/card\/999999\/edit/.test(r.url()), { timeout: 30_000 }),
      e.form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click({ noWaitAfter: true, timeout: 20_000 }),
    ]);
    status = res.status();
  });
  await expected(async () => { expect.soft(status, "存在しないカードIDへの登録要求の応答").toBe(403); });
});

caseTest("IT-M14-04-009", async ({ page, notes, step, expected }) => {
  const e = await 編集を開く(page, notes.get("〔カードID-M1404-共有〕"));
  const 候補: Record<string, string[]> = {};
  await step(1, async () => { await e.open(notes.get("〔カードID-M1404-共有〕")); });
  await step(2, async () => {
    候補["カードタイプ"] = await select2に入れる(page, "admin_card_cardtypes", "試験カードタイプ", false);
    候補["サブタイプ"] = await select2に入れる(page, "admin_card_subtypes", "試験サブタイプ", false);
    候補["特殊タイプ"] = await select2に入れる(page, "admin_card_specialtypes", "試験特殊タイプ", false);
  });
  await expected(async () => {
    for (const [欄, 語] of [["カードタイプ", "試験カードタイプ"], ["サブタイプ", "試験サブタイプ"], ["特殊タイプ", "試験特殊タイプ"]]) {
      expect.soft((候補[欄] ?? []).some((t) => t.includes(語)), `${欄}の入力で「${語}」の候補が出る`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 入力行の追加・削除（保存しない）
// ---------------------------------------------------------------------------

caseTest("IT-M14-04-011", async ({ page, notes, step, expected }) => {
  const e = await 編集を開く(page, notes.get("〔カードID-M1404-共有〕"));
  let before = 0;
  const r = { 行: -1, フォーマット: 0, ラジオ: 0, 削除: 0 };
  await step(1, async () => { await e.open(notes.get("〔カードID-M1404-共有〕")); before = await e.リーガリティ行.count(); });
  await step(2, async () => { await e.リーガリティを追加する(); });
  await expected(async () => {
    const row = e.リーガリティ行.last();
    r.行 = await e.リーガリティ行.count();
    r.フォーマット = await row.locator('select[name$="[format]"]').count();
    r.ラジオ = await row.locator('input[type="radio"][name$="[restriction]"]').count();
    r.削除 = await row.locator("button.delete-item").count();
    expect.soft(r.行, "リーガリティの入力行の数（1件増える）").toBe(before + 1);
    expect.soft(r.フォーマット, "追加行のフォーマット選択").toBe(1);
    expect.soft(r.ラジオ, "追加行のリーガリティ（使用可・制限・禁止）").toBe(3);
    expect.soft(r.削除, "追加行のリーガリティ削除ボタン").toBe(1);
  });
});

caseTest("IT-M14-04-012", async ({ page, notes, step, expected }) => {
  const e = await 編集を開く(page, notes.get("〔カードID-M1404-共有〕"));
  let before = 0;
  await step(1, async () => { await e.open(notes.get("〔カードID-M1404-共有〕")); before = await e.リーガリティ行.count(); });
  await step(2, async () => {
    const row = e.リーガリティ行.filter({ has: page.locator('select[name$="[format]"]') }).first();
    await row.locator("button.delete-item").click({ timeout: 20_000 });
  });
  await expected(async () => {
    expect.soft(before, "削除前のリーガリティ行の数").toBe(1);
    await expect.soft(e.リーガリティ行, "リーガリティの行（フォーマット選択・リーガリティ・削除ボタン）が画面から無くなる").toHaveCount(0);
  });
});

caseTest("IT-M14-04-013", async ({ page, notes, step, expected }) => {
  const e = await 編集を開く(page, notes.get("〔カードID-M1404-共有〕"));
  let before = 0;
  const r = { 件数: -1, 欠け: [] as string[] };
  await step(1, async () => { await e.open(notes.get("〔カードID-M1404-共有〕")); before = await e.詳細一覧.count(); });
  await step(2, async () => { await e.詳細情報を追加する(); });
  await expected(async () => {
    const det = e.詳細一覧.last();
    r.件数 = await e.詳細一覧.count();
    for (const f of ["cardNo", "backCardDetailId", "textJp", "textEn", "power", "toughness", "flavorJp", "flavorEn", "cardset", "rarity", "cardLayout", "illustrator", "promotion", "foilFlg", "frameFlg"]) {
      if ((await det.locator(`[name$="[${f}]"]`).count()) === 0) r.欠け.push(f);
    }
    expect.soft(r.件数, "詳細情報の数（1件増える）").toBe(before + 1);
    expect.soft(r.欠け, "追加された詳細情報に無い入力欄（コレクターNoからフレームまで）").toEqual([]);
  });
});

caseTest("IT-M14-04-014", async ({ page, notes, step, expected }) => {
  const e = await 編集を開く(page, notes.get("〔カードID-M1404-共有〕"));
  let before = 0;
  await step(1, async () => { await e.open(notes.get("〔カードID-M1404-共有〕")); before = await e.詳細一覧.count(); });
  await step(2, async () => { await e.詳細("240402").locator("button.delete-item").click({ timeout: 20_000 }); });
  await expected(async () => {
    expect.soft(before, "削除前の詳細情報の数").toBe(2);
    await expect.soft(e.詳細("240402"), "ID 240402の詳細情報の入力欄が画面から無くなる").toHaveCount(0);
    await expect.soft(e.詳細("240401"), "ID 240401の詳細情報は残る").toHaveCount(1);
  });
});

// ---------------------------------------------------------------------------
// 更新（DB確認）
// ---------------------------------------------------------------------------

/** 値が空（未設定）か */
const 空 = (v: string | null | undefined) => v === null || v === "";

caseTest("IT-M14-04-016", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-016〕");
  const e = await 編集を開く(page, id);
  const A = notes.get("〔カード詳細ID-M1404-016A〕");
  const 新名 = rc("OptionalEmptyCard");
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.open(id); });
  await step(2, async () => {
    await e.基本情報を入れる({ カード名日: "", アリーナ名日: "", アリーナ名英: "", ルールテキスト日: "", ルールテキスト英: "", マナ・コスト: "", パワー: "", タフネス: "", 忠誠度: "" });
    const det = e.詳細(A);
    await e.詳細を入れる(det, { コレクターNo: "", 裏面カード詳細ID: "", ルールテキスト日: "", ルールテキスト英: "", フレーバー日: "", フレーバー英: "", パワー: "", タフネス: "" });
    await det.locator('select[name$="[cardset]"]').selectOption({ value: "" });
    await det.locator('select[name$="[illustrator]"]').selectOption({ value: "" });
  });
  await step(3, async () => { await e.必須を入れる(e.詳細(A), 必須); });
  await step(4, async () => {
    await e.基本情報を入れる({ カード名英: 新名 });
    const r = await e.登録を押す();
    if (!r.sent) note("ブラウザの入力チェックが送信を止めた");
  });
  await step(5, async () => { 結果 = 読む(id); });
  await expected(async () => {
    const c = 結果.card, d = 結果.details.find((x) => x.詳細ID === A);
    expect.soft(c?.カード名英, "カード名(英)").toBe(新名);
    expect.soft([c?.カード名日, c?.アリーナ名日, c?.アリーナ名英, c?.ルールテキスト日, c?.ルールテキスト英, c?.マナ・コスト, c?.パワー, c?.タフネス, c?.忠誠度].every(空), "カードの任意項目がすべて空").toBe(true);
    expect.soft([d?.コレクターNo, d?.裏面詳細ID, d?.ルールテキスト日, d?.ルールテキスト英, d?.フレーバー日, d?.フレーバー英, d?.パワー, d?.タフネス, d?.カードセット, d?.イラストレーター].every(空), "カード詳細の任意項目がすべて空").toBe(true);
  });
});

caseTest("IT-M14-04-017", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-017〕");
  const e = await 編集を開く(page, id);
  const A = notes.get("〔カード詳細ID-M1404-017A〕");
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.open(id); });
  await step(2, async () => {
    await e.基本情報を入れる({
      カード名日: 長い(255), カード名英: 長い(255, "a"), アリーナ名日: 長い(255), アリーナ名英: 長い(255, "b"),
      ルールテキスト日: 長い(1024), ルールテキスト英: 長い(1024, "c"), マナ・コスト: 長い(64, "d"), パワー: 長い(16, "1"), タフネス: 長い(16, "2"), 忠誠度: 長い(16, "3"),
    });
  });
  await step(3, async () => {
    await e.詳細を入れる(e.詳細(A), {
      コレクターNo: 長い(16, "e"), 裏面カード詳細ID: "999999", ルールテキスト日: 長い(1024), ルールテキスト英: 長い(1024, "f"),
      フレーバー日: 長い(1024), フレーバー英: 長い(1024, "g"), パワー: 長い(16, "4"), タフネス: 長い(16, "5"),
    });
  });
  let sent = true;
  await step(4, async () => { const r = await e.登録を押す(); sent = r.sent; if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(5, async () => { 結果 = 読む(id); });
  await expected(async () => {
    const c = 結果.card, d = 結果.details.find((x) => x.詳細ID === A);
    const len = (v: string | null) => (v ?? "").length;
    expect.soft(sent, "登録要求が送られた").toBe(true);
    expect.soft([len(c?.カード名日 ?? null), len(c?.カード名英 ?? null), len(c?.アリーナ名日 ?? null), len(c?.アリーナ名英 ?? null)], "カード名(日・英)・アリーナカード名(日・英)の文字数").toEqual([255, 255, 255, 255]);
    expect.soft([len(c?.ルールテキスト日 ?? null), len(c?.ルールテキスト英 ?? null)], "基本情報のルールテキスト(日・英)の文字数").toEqual([1024, 1024]);
    expect.soft([len(c?.マナ・コスト ?? null), len(c?.パワー ?? null), len(c?.タフネス ?? null), len(c?.忠誠度 ?? null)], "マナ・コスト・パワー・タフネス・忠誠度の文字数").toEqual([64, 16, 16, 16]);
    expect.soft([len(d?.コレクターNo ?? null), d?.裏面詳細ID], "詳細のコレクターNoの文字数・裏面カード詳細ID").toEqual([16, "999999"]);
    expect.soft([len(d?.ルールテキスト日 ?? null), len(d?.ルールテキスト英 ?? null), len(d?.フレーバー日 ?? null), len(d?.フレーバー英 ?? null)], "詳細のルールテキスト・フレーバーテキスト(日・英)の文字数").toEqual([1024, 1024, 1024, 1024]);
    expect.soft([len(d?.パワー ?? null), len(d?.タフネス ?? null)], "詳細のパワー・タフネスの文字数").toEqual([16, 16]);
  });
});

caseTest("IT-M14-04-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const 英 = rc("IntegrationNewCard");
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.openNew(); });
  await step(2, async () => { await e.基本情報を入れる({ カード名日: "結合新規カード", カード名英: 英, 点数で見たマナ: "2.5", 忠誠度: "X/1" }); });
  await step(3, async () => {
    for (const [f, l] of [["FMT-STD", "使用可"], ["FMT-MOD", "制限"], ["FMT-CMD", "禁止"]]) await e.リーガリティを選ぶ(await e.リーガリティを追加する(), f, l);
  });
  await step(4, async () => {
    const foil = ["なし", "通常", "特殊"], frame = ["通常", "特殊", "通常"];
    for (let i = 0; i < 3; i++) {
      const det = await e.詳細情報を追加する();
      await e.詳細を入れる(det, { Foil: foil[i], フレーム: frame[i] });
      if ((await e.画像言語(det).count()) === 0 && i === 0) note("新規登録画面の詳細情報には「カードの言語」の入力欄が無い（画像の言語は、登録済みの詳細情報の画像情報にだけある）。言語は設定できなかった");
    }
  });
  await step(5, async () => {
    for (let i = 0; i < 3; i++) await e.必須を入れる(e.詳細一覧.nth(i), { ...必須, Foil: ["なし", "通常", "特殊"][i], フレーム: ["通常", "特殊", "通常"][i] });
    const r = await e.登録を押す();
    if (!r.sent) note("ブラウザの入力チェックが送信を止めた");
  });
  await step(6, async () => { 結果 = 読む(カード名英でカードID(英)[0]); });
  await expected(async () => {
    const ids = カード名英でカードID(英);
    expect.soft(ids.length, "カード名(英)が「IntegrationNewCard」のカードの数").toBe(1);
    const c = 結果.card;
    expect.soft([c?.カード名日, c?.点数で見たマナ, c?.忠誠度], "カード名(日)・点数で見たマナ・コスト・忠誠度").toEqual(["結合新規カード", "2.5", "X/1"]);
    const l = 結果.legality;
    expect.soft(l.map((x) => `${x.フォーマット}:${x.リーガリティ}`).sort(), "リーガリティ3件").toEqual(["FMT-CMD:禁止", "FMT-MOD:制限", "FMT-STD:使用可"]);
    const d = 結果.details;
    expect.soft(d.length, "カード詳細の数").toBe(3);
    expect.soft(d.map((x) => `${x.Foil}/${x.フレーム}`), "詳細のFoil/フレーム（0=なし 1=通常 2=特殊、フレームは0=通常 1=特殊）").toEqual(["0/0", "1/1", "2/0"]);
    expect.soft(false, "詳細情報のカードの言語（日本語・英語・中国語簡体字）を設定して保存できる（新規登録画面に言語の入力欄が無い）").toBe(true);
  });
});

caseTest("IT-M14-04-021", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const 英 = rc("NewTransitionCard");
  let r = { sent: false, url: "" };
  await step(1, async () => { await e.openNew(); });
  await step(2, async () => { await e.基本情報を入れる({ カード名英: 英, 点数で見たマナ: "1" }); });
  await step(3, async () => { await e.必須を入れる(await e.詳細情報を追加する(), 必須); });
  await step(4, async () => { r = await e.登録を押す(); });
  await expected(async () => {
    const id = カード名英でカードID(英)[0];
    expect.soft(id, "保存された「NewTransitionCard」のカードID").toBeTruthy();
    expect.soft(new URL(r.url).pathname.endsWith(`/card/${id}/edit`), "遷移先が新しく保存されたカードの編集画面").toBe(true);
  });
});

caseTest("IT-M14-04-022", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-022〕");
  const e = await 編集を開く(page, id);
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.open(id); });
  await step(2, async () => { await e.基本情報を入れる({ カード名日: "更新後カード", カード名英: "UpdatedCard", 点数で見たマナ: "3.5" }); });
  await step(3, async () => {
    const det = e.詳細("240401022");
    await e.詳細を入れる(det, { コレクターNo: "UPDATED-001", Foil: "特殊", フレーム: "特殊" });
    await e.画像言語(det).first().selectOption({ label: "英語" });
  });
  await step(4, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(5, async () => { 結果 = 読む(id); });
  await expected(async () => {
    const c = 結果.card, d = 結果.details.find((x) => x.詳細ID === "240401022");
    expect.soft([c?.カード名日, c?.カード名英, c?.点数で見たマナ], "カード名(日・英)・点数で見たマナ・コスト").toEqual(["更新後カード", "UpdatedCard", "3.5"]);
    expect.soft([d?.コレクターNo, d?.Foil, d?.フレーム], "ID 240401022のコレクターNo・Foil(2=特殊)・フレーム(1=特殊)").toEqual(["UPDATED-001", "2", "1"]);
    expect.soft(詳細の画像("240401022")[0]?.言語, "ID 240401022の画像の言語").toBe("英語");
  });
});

caseTest("IT-M14-04-023", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-023〕");
  const e = await 編集を開く(page, id);
  let url = "";
  await step(1, async () => { await e.open(id); });
  await step(2, async () => { await e.基本情報を入れる({ カード名日: "遷移確認更新カード" }); });
  await step(3, async () => { const r = await e.登録を押す(); url = r.url; });
  await expected(async () => { expect.soft(new URL(url).pathname.endsWith(`/card/${id}/edit`), "遷移先がこのカードの編集画面").toBe(true); });
});

caseTest("IT-M14-04-024", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-024〕");
  const e = await 編集を開く(page, id);
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.open(id); });
  await step(2, async () => { await e.リーガリティを追加する(); });
  await step(3, async () => { await e.リーガリティを選ぶ(e.リーガリティ行.last(), "FMT-MOD", "制限"); });
  await step(4, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(5, async () => { 結果 = 読む(id); });
  await expected(async () => {
    const l = 結果.legality;
    expect.soft(l.filter((x) => x.フォーマット === "FMT-MOD" && x.リーガリティ === "制限").length, "FMT-MOD・制限のリーガリティの数").toBe(1);
    expect.soft(l.length, "リーガリティの総数（元の1件＋追加1件）").toBe(2);
  });
});

caseTest("IT-M14-04-025", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-025〕");
  const e = await 編集を開く(page, id);
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.open(id); });
  await step(2, async () => { await e.リーガリティ行.first().locator("button.delete-item").click({ timeout: 20_000 }); });
  await step(3, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 結果 = 読む(id); });
  await expected(async () => {
    const l = 結果.legality;
    expect.soft(l.some((x) => x.リーガリティID === notes.get("〔リーガリティID-M1404-025〕")), "削除したリーガリティが残っている").toBe(false);
    expect.soft(l.length, "リーガリティの件数").toBe(0);
  });
});

caseTest("IT-M14-04-026", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-026〕");
  const e = await 編集を開く(page, id);
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.open(id); });
  await step(2, async () => { await e.詳細情報を追加する(); });
  await step(3, async () => {
    const det = e.詳細一覧.last();
    await e.詳細を入れる(det, { コレクターNo: "ADDED-DETAIL" });
    await e.必須を入れる(det, 必須);
    if ((await e.画像言語(det).count()) === 0) note("追加した詳細情報には「カードの言語」「表示面」の入力欄が無い（登録済みの詳細情報の画像情報にだけある）。それ以外の項目に値を設定した");
  });
  await step(4, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(5, async () => { 結果 = 読む(id); });
  await expected(async () => {
    const d = 結果.details;
    expect.soft(d.filter((x) => x.コレクターNo === "ADDED-DETAIL").length, "コレクターNoが「ADDED-DETAIL」のカード詳細の数").toBe(1);
    expect.soft(d.length, "カード詳細の総数（元の2件＋追加1件）").toBe(3);
  });
});

caseTest("IT-M14-04-027", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-027〕");
  const e = await 編集を開く(page, id);
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.open(id); });
  await step(2, async () => { await e.詳細("240402027").locator("button.delete-item").click({ timeout: 20_000 }); });
  await step(3, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 結果 = 読む(id); });
  await expected(async () => {
    expect.soft(詳細の件数("240402027"), "ID 240402027のカード詳細の数").toBe(0);
    expect.soft(画像の件数(notes.get("〔画像ID-M1404-027B〕")), "配下の画像の数").toBe(0);
    expect.soft(詳細の件数("240401027"), "ID 240401027のカード詳細は残る").toBe(1);
  });
});

caseTest("IT-M14-04-029", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-029〕");
  const e = await 編集を開く(page, id);
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.open(id); });
  await step(2, async () => { await e.基本情報を入れる({ カード名日: "画像維持更新カード" }); });
  await step(3, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 結果 = 読む(id); });
  await expected(async () => {
    const img = 詳細の画像("240401029").find((x) => x.画像ID === notes.get("〔画像ID-M1404-029A〕"));
    expect.soft(img?.URL, "画像の既存URL").toBe("img/m1404/029-1.jpg");
    expect.soft(結果.card?.カード名日, "カード名(日)が更新された").toBe("画像維持更新カード");
  });
});

caseTest("IT-M14-04-030", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  await step(1, async () => { await e.open(notes.get("〔カードID-M1404-共有〕")); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("a.c-baseLink").filter({ hasText: "カード一覧" }).click({ timeout: 20_000 })]); });
  await expected(async () => {
    expect.soft(/\/card(\/search(\/\d+)?)?$/.test(new URL(page.url()).pathname.replace(/\/$/, "")), "遷移先がカード一覧").toBe(true);
    await expect.soft(new CardSearchPage(page).form, "カード一覧の検索欄").toBeVisible();
  });
});

/** 12件のうち最初に作ったカードが一覧の2ページ目にある型（検索保持・CSV作成の共通） */
function 二ページ目から(語: string | (() => string), 呼び名: string, 削除する: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1404_ADMIN);
    const l = new CardSearchPage(page);
    const 検索語 = typeof 語 === "string" ? 語 : 語();
    const A = notes.get(呼び名);
    const e = new CardEditPage(page);
    const 二ページ目で開く = async () => {
      await l.ページ送りを押す("2");
      await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.行のカード(A).locator("td:nth-child(3) a").first().click({ timeout: 20_000 })]);
      await expect(e.form, "カード詳細(編集・削除)画面").toBeVisible();
    };
    await step(1, async () => { await l.open(); await l.キーワードで検索する(検索語); });
    if (!削除する) {
      // 検索保持: 2ページ目を開く → カード名を押して詳細へ → 「カード一覧」を押す
      await step(2, async () => { await l.ページ送りを押す("2"); });
      await step(3, async () => {
        await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.行のカード(A).locator("td:nth-child(3) a").first().click({ timeout: 20_000 })]);
        await expect(e.form, "カード詳細(編集・削除)画面").toBeVisible();
      });
      await step(4, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("a.c-baseLink").filter({ hasText: "カード一覧" }).click({ timeout: 20_000 })]); });
    } else {
      // 削除: 2ページ目から詳細を開く → 削除ボタン → 確認で実行
      await step(2, async () => { await 二ページ目で開く(); });
      await step(3, async () => { await e.削除を押す(); });
      await step(4, async () => { await e.確認で実行する(); });
    }
    await expected(async () => {
      const p = await l.ページ送りの表示();
      expect.soft(await l.キーワード.inputValue(), "カード名・テキストの検索条件が保持される").toBe(検索語);
      expect.soft(p.現在, "一覧のページ（2ページ目）").toBe("2");
      expect.soft(await l.検索結果件数(), "検索結果の件数").toBe(削除する ? 11 : 12);
    });
  };
}
caseTest("IT-M14-04-031", 二ページ目から(() => rc("検索保持-031"), "〔カードID-M1404-031A〕", false));
caseTest("IT-M14-04-035", 二ページ目から(() => rc("検索保持-035"), "〔カードID-M1404-035A〕", true));
caseTest("IT-M14-04-067", 二ページ目から(() => rc("CbSearchM1404-067"), "〔カードID-M1404-067A〕", true));

/** 削除して、DBで消えたことを確かめる型 */
function 削除して確かめる(呼び名: string, 詳細: string[], 画像: string[], ボタン文: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(呼び名);
    const e = await 編集を開く(page, id);
    await step(1, async () => { await e.open(id); });
    await step(2, async () => { await e.削除を押す(); });
    await step(3, async () => {
      const label = ((await page.locator('#DeleteModal a[data-method="delete"]').innerText()) ?? "").trim();
      if (label !== ボタン文) note(`確認ポップアップの実行ボタンの表示は「${label}」（正本の手順は「${ボタン文}」）。そのボタンを押した`);
      await e.確認で実行する();
    });
    let 件数 = -1;
    await step(4, async () => { 件数 = カードの件数(id); });
    await expected(async () => {
      expect.soft(件数, "カードの数").toBe(0);
      for (const d of 詳細) expect.soft(詳細の件数(d), `ID ${d}のカード詳細の数`).toBe(0);
      for (const g of 画像) expect.soft(画像の件数(notes.get(g)), "カード画像の数").toBe(0);
    });
  };
}
caseTest("IT-M14-04-032", 削除して確かめる("〔カードID-M1404-032〕", ["240406032"], ["〔カード画像ID-M1404-032〕"], "実行"));
caseTest("IT-M14-04-061", 削除して確かめる("〔カードID-M1404-061〕", ["240407061", "240408061"], ["〔カード画像ID-M1404-061A〕", "〔カード画像ID-M1404-061B〕"], "削除"));

caseTest("IT-M14-04-040", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-040〕");
  const e = await 編集を開く(page, id);
  let status = 0;
  await step(1, async () => { await e.open(id); });
  await step(2, async () => {
    // 開発者ツールで削除要求の送信先のカードIDを書き換えるのと同じ操作（確認ポップアップは開くときに送信先を読み込むので、ボタン側の値を書き換える）
    await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').evaluate((a) => a.setAttribute("data-url", (a.getAttribute("data-url") ?? "").replace(/\/card\/\d+\/delete/, "/card/999999/delete")));
    await e.削除を押す();
    await page.waitForTimeout(800);
    const [res] = await Promise.all([
      page.waitForResponse((r) => /\/card\/999999\/delete/.test(r.url()), { timeout: 30_000 }),
      page.locator('#DeleteModal a[data-method="delete"]').click({ noWaitAfter: true, timeout: 20_000 }),
    ]);
    status = res.status();
  });
  await expected(async () => { expect.soft(status, "存在しないカードIDへの削除要求の応答").toBe(404); });
});

// ---------------------------------------------------------------------------
// 新規登録（分類・色・ステッカー）
// ---------------------------------------------------------------------------

caseTest("IT-M14-04-049", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const 英 = rc("M1404-049-Card");
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.openNew(); });
  await step(2, async () => { await e.基本情報を入れる({ カード名英: 英, 点数で見たマナ: "1" }); });
  await step(3, async () => { await e.色を選ぶ("カラー", "M1404-049-A"); await e.色を選ぶ("カラー", "M1404-049-B"); });
  await step(4, async () => { expect.soft(await e.field("nameJp").inputValue(), "ほかの項目（カード名(日)）は未入力のまま").toBe(""); });
  await step(5, async () => { await e.必須を入れる(await e.詳細情報を追加する(), 必須); });
  await step(6, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(7, async () => { 結果 = 読む(カード名英でカードID(英)[0]); });
  await expected(async () => {
    const id = カード名英でカードID(英)[0];
    expect.soft(id, "保存されたカードのID").toBeTruthy();
    expect.soft(結果.card?.カード名英, "保存されたカード").toBe(英);
    expect.soft(id ? カードの分類(id, "color") : [], "カードに紐づくカラー").toEqual(["M1404-049-A", "M1404-049-B"]);
  });
});

caseTest("IT-M14-04-050", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const 英 = rc("M1404-050-Card");
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.openNew(); });
  await step(2, async () => { await e.基本情報を入れる({ カード名英: 英, 点数で見たマナ: "1" }); });
  await step(3, async () => { await e.色を選ぶ("固有色", "白"); await e.色を選ぶ("固有色", "青"); });
  await step(4, async () => { expect.soft(await e.field("nameJp").inputValue(), "ほかの項目（カード名(日)）は未入力のまま").toBe(""); });
  await step(5, async () => { await e.必須を入れる(await e.詳細情報を追加する(), 必須); });
  await step(6, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(7, async () => { 結果 = 読む(カード名英でカードID(英)[0]); });
  await expected(async () => {
    const id = カード名英でカードID(英)[0];
    expect.soft(id, "保存されたカードのID").toBeTruthy();
    expect.soft(id ? カードの分類(id, "color_identity") : [], "カードに紐づく固有色").toEqual(["白", "青"]);
  });
});

caseTest("IT-M14-04-052", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const 英 = rc("M1404-052-Card");
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.openNew(); });
  await step(2, async () => { await e.基本情報を入れる({ カード名英: 英, 点数で見たマナ: "1" }); });
  await step(3, async () => { await e.field("colorSequence").selectOption({ label: "M1404-052-B" }); });
  await step(4, async () => { expect.soft(await e.field("nameJp").inputValue(), "ほかの項目（カード名(日)）は未入力のまま").toBe(""); });
  await step(5, async () => { await e.必須を入れる(await e.詳細情報を追加する(), 必須); });
  await step(6, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(7, async () => { 結果 = 読む(カード名英でカードID(英)[0]); });
  await expected(async () => {
    const id = カード名英でカードID(英)[0];
    expect.soft(結果.card?.色順, "カードの色順").toBe("M1404-052-B");
  });
});

caseTest("IT-M14-04-053", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const 英 = rc("M1404-053-Card");
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.openNew(); });
  await step(2, async () => { await e.基本情報を入れる({ カード名英: 英, 点数で見たマナ: "1" }); });
  let det = e.詳細一覧.first();
  await step(3, async () => { det = await e.詳細情報を追加する(); await e.必須を入れる(det, 必須); });
  await step(4, async () => { await e.詳細を入れる(det, { イラストレーター: "M1404-053-A" }); });
  await step(5, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(6, async () => { 結果 = 読む(カード名英でカードID(英)[0]); });
  await expected(async () => {
    const d = 結果.details;
    expect.soft(d.length, "カード詳細の数").toBe(1);
    expect.soft(d[0]?.イラストレーター, "詳細のイラストレーター").toBe("M1404-053-A");
  });
});

caseTest("IT-M14-04-054", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-054〕");
  const e = await 編集を開く(page, id);
  const r = { 見出し: [] as string[], 入力欄: 0 };
  await step(1, async () => { await e.open(id); });
  await step(2, async () => {
    r.見出し = (await e.詳細一覧.locator(".detail-header strong").allInnerTexts()).map((t) => t.trim());
    r.入力欄 = await e.詳細一覧.locator(".detail-header input, .detail-header textarea, .detail-header select").count();
  });
  await expected(async () => {
    expect.soft(r.見出し, "詳細情報の2ブロックの先頭に出るカード詳細IDのラベル").toEqual([`カード詳細ID: ${notes.get("〔カード詳細ID-M1404-054A〕")}`, `カード詳細ID: ${notes.get("〔カード詳細ID-M1404-054B〕")}`]);
    expect.soft(r.入力欄, "ブロック先頭の入力欄の数（ラベルであり入力欄でない）").toBe(0);
  });
});

caseTest("IT-M14-04-058", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const 英 = rc("M1404-058-Card");
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.openNew(); });
  await step(2, async () => { await e.基本情報を入れる({ カード名英: 英, 点数で見たマナ: "1" }); });
  await step(3, async () => { await e.field("isSticker").check(); });
  await step(4, async () => { expect.soft(await e.field("nameJp").inputValue(), "ほかの項目（カード名(日)）は未入力のまま").toBe(""); });
  await step(5, async () => { await e.必須を入れる(await e.詳細情報を追加する(), 必須); });
  await step(6, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(7, async () => { 結果 = 読む(カード名英でカードID(英)[0]); });
  await expected(async () => {
    const id = カード名英でカードID(英)[0];
    expect.soft(結果.card?.ステッカー, "カードのステッカーフラグ").toBe(true);
  });
});

caseTest("IT-M14-04-060", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const 英 = rc("M1404-060-Card");
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.openNew(); });
  await step(2, async () => { await e.基本情報を入れる({ カード名英: 英, 点数で見たマナ: "1" }); });
  await step(3, async () => { for (const 語 of ["M1404-060-TA", "M1404-060-TB"]) await select2に入れる(page, "admin_card_cardtypes", 語, true); });
  await step(4, async () => { for (const 語 of ["M1404-060-SA", "M1404-060-SB"]) await select2に入れる(page, "admin_card_subtypes", 語, true); });
  await step(5, async () => { for (const 語 of ["M1404-060-XA", "M1404-060-XB"]) await select2に入れる(page, "admin_card_specialtypes", 語, true); });
  await step(6, async () => { await e.必須を入れる(await e.詳細情報を追加する(), 必須); });
  await step(7, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(8, async () => { 結果 = 読む(カード名英でカードID(英)[0]); });
  await expected(async () => {
    const id = カード名英でカードID(英)[0];
    expect.soft(id ? カードの分類(id, "cardtype") : [], "カードタイプ").toEqual(["M1404-060-TA", "M1404-060-TB"]);
    expect.soft(id ? カードの分類(id, "subtype") : [], "サブタイプ").toEqual(["M1404-060-SA", "M1404-060-SB"]);
    expect.soft(id ? カードの分類(id, "specialtype") : [], "特殊タイプ").toEqual(["M1404-060-XA", "M1404-060-XB"]);
  });
});

caseTest("IT-M14-04-064", async ({ page, step, expected }) => {
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  const 英 = rc("M1404-064-Card");
  let 控え = "";
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.openNew(); });
  await step(2, async () => { await e.基本情報を入れる({ カード名英: 英, 点数で見たマナ: "1" }); });
  await step(3, async () => { await e.必須を入れる(await e.詳細情報を追加する(), 必須); });
  await step(4, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(5, async () => { 控え = /\/card\/(\d+)\/edit/.exec(page.url())?.[1] ?? ""; });
  await step(6, async () => { await e.基本情報を入れる({ カード名日: "M1404-064-更新後" }); });
  await step(7, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(8, async () => { 結果 = 読む(控え); });
  await expected(async () => {
    const ids = カード名英でカードID(英);
    expect.soft(控え, "手順5で控えたカードID").not.toBe("");
    expect.soft(ids, "カード名(英)が一致するカードのID（控えた1件だけ）").toEqual([控え]);
    expect.soft(結果.card?.カード名日, "カード名(日)").toBe("M1404-064-更新後");
  });
});

caseTest("IT-M14-04-065", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-065〕");
  const e1 = await 編集を開く(page, id);
  const page2 = await page.context().newPage();
  const e2 = new CardEditPage(page2);
  let status = 0;
  try {
    await step(1, async () => { await e1.open(id); await e2.open(id); });
    await step(2, async () => { await e1.削除を押す(); });
    await step(3, async () => { await e1.確認で実行する(); });
    await step(4, async () => { await e2.削除を押す(); });
    await step(5, async () => {
      const [res] = await Promise.all([
        page2.waitForResponse((r) => /\/card\/\d+\/delete/.test(r.url()), { timeout: 30_000 }),
        page2.locator('#DeleteModal a[data-method="delete"]').click({ noWaitAfter: true, timeout: 20_000 }),
      ]);
      status = res.status();
    });
    await expected(async () => { expect.soft(status, "2つ目のタブの削除要求の応答").toBe(404); });
  } finally { await page2.close().catch(() => undefined); }
});

caseTest("IT-M14-04-070", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-070〕");
  await loginAdmin(page, M1404_ADMIN);
  const e = new CardEditPage(page);
  await step(1, async () => { await e.open(id); });
  await step(2, async () => { await e.削除を押す(); });
  await step(3, async () => { await e.確認で実行する(); });
  await expected(async () => {
    expect.soft(/\/card(\/search(\/\d+)?)?$/.test(new URL(page.url()).pathname.replace(/\/$/, "")), "遷移先がカード一覧").toBe(true);
    await expect.soft(new CardSearchPage(page).form, "カード一覧の検索欄").toBeVisible();
  });
});

caseTest("IT-M14-04-071", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-M1404-071〕");
  const e = await 編集を開く(page, id);
  let 結果 = 読む(undefined);
  await step(1, async () => { await e.open(id); });
  await step(2, async () => { await e.基本情報を入れる({ カード名日: "編集後カード-M1404-071" }); });
  await step(3, async () => { const r = await e.登録を押す(); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 結果 = 読む(id); });
  await expected(async () => {
    expect.soft(結果.card?.カード名日, "カード名(日)").toBe("編集後カード-M1404-071");
    expect.soft([詳細の件数("240401071"), 詳細の件数("240402071")], "ID 240401071・240402071のカード詳細が残る").toEqual([1, 1]);
  });
});
