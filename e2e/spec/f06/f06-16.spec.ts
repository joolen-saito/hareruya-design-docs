/** F06-16 大会デッキ登録編集（フロント）。正本: cases/F06-16_test_cases.tsv */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { DeckEditPage, 前面 } from "../../pages/front/f06_16_deck_entry";
import * as DB from "../../db/f06_16";
import { 会員一覧, 大会一覧 } from "../../seeds/f06-16";
import "../../seeds/f06-16";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 会員 = (n: string) => { const m = 会員一覧.get(n); if (!m) throw new Error(`会員 ${n} が作られていない`); return m; };
const 大会 = (n: string) => { const d = 大会一覧.get(n); if (!d) throw new Error(`大会 ${n} が作られていない`); return d; };

async function ログイン(page: Page, n: string): Promise<DeckEditPage> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await frontLogin(page, 会員(n));
  return new DeckEditPage(page);
}
const 行 = (text: string): string[] => text.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);

// ---- 画面の表示・リンク ----
caseTest("IT-F06-16-002", async ({ page, step, expected }) => {
  const e = await ログイン(page, "002");
  await step(1, async () => { await e.開く(大会("002").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await expect(e.提出ボタン).toBeVisible(); });
  await expected(async () => {
    expect.soft(await page.getByText(/DCI/).count(), "DCIナンバーの項目の数").toBe(0);
    expect.soft(await page.locator("dt, label, th, h3, h4").filter({ hasText: /^\s*名前\s*$/ }).count(), "「名前」の項目の数").toBe(0);
    expect.soft(await page.getByText("使い方").count(), "「使い方」リンクの数").toBe(0);
    expect.soft(await page.getByText("MTGアリーナからデッキリストをインポートする方法").count(), "「MTGアリーナからデッキリストをインポートする方法」の説明の数").toBe(0);
  });
});

caseTest("IT-F06-16-003", async ({ page, step, expected }) => {
  const e = await ログイン(page, "003");
  const d = 大会("003");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.大会名).toBeVisible(); });
  let 大会名 = "", 情報 = "", 画面 = "";
  await step(2, async () => {
    大会名 = (await e.大会名.innerText()).trim();
    情報 = (await e.大会情報.innerText()).replace(/\s+/g, " ").trim();
    画面 = (await page.locator("main, #contents, body").first().innerText()).replace(/\s+/g, " ");
  });
  await expected(async () => {
    expect.soft(大会名, "大会名（フォーマットつき）").toBe(`${d.大会名}（Standard）`);
    expect.soft(情報, "開催店舗").toContain("晴れる屋2");
    expect.soft(/2099[-/]0?12[-/]0?20\s+10:00/.test(情報), `開催日時（2099-12-20 10:00。区切りは-と/を同じとみなす）。実際: ${情報}`).toBe(true);
    expect.soft(画面, "プレイヤー名").toContain("YAMADA TARO");
  });
});

caseTest("IT-F06-16-004", async ({ page, step, expected }) => {
  const e = await ログイン(page, "004");
  const d = 大会("004");
  await step(1, async () => { await e.開く(d.日程ID); });
  const before = () => page.url();
  let url0 = "";
  await step(2, async () => {
    url0 = before();
    // 現在表示中のページの項目（この画面では表示名が「登録デッキ編集」）
    const cur = page.locator(".p-hareruya-breadcrumb__current").first();
    await expect(cur, "パンくずリストの現在表示中ページ").toBeVisible();
    note(`パンくずリストの現在表示中ページの表示名は「${(await cur.innerText()).trim()}」（正本の手順の「大会デッキ登録編集」とは名前が違う）`);
    await cur.click({ timeout: 10_000 });
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(page.url(), "押したあとの画面のアドレス").toBe(url0);
    expect.soft(await e.表示されている(), "大会デッキ登録編集画面に留まっている").toBe(true);
  });
});

caseTest("IT-F06-16-005", async ({ page, step, expected }) => {
  const e = await ログイン(page, "005");
  await step(1, async () => { await e.開く(大会("005").日程ID); });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), page.locator(".p-hareruya-breadcrumb__link[aria-label]").first().click({ timeout: 60_000, noWaitAfter: true })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（本店ECTOP）").toMatch(/^\/(ja\/?)?$/);
  });
});

caseTest("IT-F06-16-006", async ({ page, step, expected }) => {
  const e = await ログイン(page, "006");
  await step(1, async () => { await e.開く(大会("006").日程ID); });
  let popup!: Page;
  await step(2, async () => {
    const [p] = await Promise.all([page.context().waitForEvent("page", { timeout: 60_000 }), e.利用ガイドのリンク.click({ timeout: 60_000 })]);
    popup = p;
    await popup.waitForLoadState("domcontentloaded");
  });
  let url!: URL;
  await step(3, async () => { url = new URL(popup.url()); });
  await expected(async () => {
    expect.soft(url.pathname, "遷移先のパス（イベントのヘルプページ）").toBe("/ja/user_data/help_event");
    expect.soft(url.hash, "遷移先の位置").toBe("#block5");
    expect.soft(url.search, "引継ぎ情報（URLの？以降）").toBe("");
  });
});

caseTest("IT-F06-16-007", async ({ page, step, expected }) => {
  const e = await ログイン(page, "007");
  await step(1, async () => { await e.開く(大会("007").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await expect(e.提出ボタン).toBeVisible(); });
  await expected(async () => {
    expect.soft(await page.locator(".p-hareruya-deckentry-edit__format-select").count(), "フォーマット選択エリアの数").toBe(0);
    expect.soft(await e.フォーマット選択肢(), "表示されるフォーマットの選択肢").toEqual([]);
  });
});

caseTest("IT-F06-16-008", async ({ page, step, expected }) => {
  const e = await ログイン(page, "008");
  await step(1, async () => { await e.開く(大会("008").日程ID); await expect(e.メイン).toBeVisible(); });
  let 選択肢: string[] = [];
  await step(2, async () => { 選択肢 = await e.フォーマット選択肢(); });
  await expected(async () => {
    expect.soft(選択肢, "選択肢として表示されたフォーマット").toEqual(["Standard", "Modern"]);
    expect.soft(選択肢.includes("Legacy"), "Legacy（両方オフ）が選択肢に表示される").toBe(false);
  });
});

// ---- インポート ----
caseTest("IT-F06-16-011", async ({ page, step, expected }) => {
  const e = await ログイン(page, "011");
  await step(1, async () => { await e.開く(大会("011").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.インポートボタン.click({ timeout: 60_000 }); });
  await expected(async () => {
    await expect.soft(e.インポートの画面, "インポート用ポップアップ画面").toBeVisible({ timeout: 10_000 });
  });
});

caseTest("IT-F06-16-012", async ({ page, step, expected }) => {
  const e = await ログイン(page, "012");
  await e.開く(大会("012").日程ID);
  await step(1, async () => { await e.入力する("メイン", "4 Island"); });
  await step(2, async () => { await e.インポートを開く(); });
  await step(3, async () => { await e.インポートの入力欄.fill("2 Negate"); });
  await step(4, async () => { await e.インポート閉じる.click({ timeout: 60_000 }); });
  await expected(async () => {
    await expect.soft(e.インポートの画面, "インポート用ポップアップ画面").toBeHidden({ timeout: 10_000 });
    expect.soft(await e.メイン.inputValue(), "メインボード").toBe("4 Island");
  });
});

caseTest("IT-F06-16-013", async ({ page, step, expected }) => {
  const e = await ログイン(page, "013");
  await e.開く(大会("013").日程ID);
  await step(1, async () => { await e.インポートを開く(); });
  await step(2, async () => { await page.mouse.click(5, 5); });
  await expected(async () => {
    await expect.soft(e.インポートの画面, "インポート用ポップアップ画面").toBeHidden({ timeout: 10_000 });
  });
});

caseTest("IT-F06-16-014", async ({ page, step, expected }) => {
  const e = await ログイン(page, "014");
  await step(1, async () => { await e.開く(大会("014").日程ID); await e.入力する("メイン", "1 Island"); });
  await step(2, async () => { await e.インポートを開く(); });
  await step(3, async () => { await e.インポートの入力欄.fill(["Deck", "4 Lightning Bolt (LEA) 161", "2 Counterspell", "不正な行", "Sideboard", "3 Duress (M20) 96"].join("\n")); });
  await step(4, async () => { await e.インポート実行.click({ timeout: 60_000 }); });
  await expected(async () => {
    expect.soft(行(await e.メイン.inputValue()), "メインボード").toEqual(["4 Lightning Bolt", "2 Counterspell"]);
    expect.soft(行(await e.サイド.inputValue()), "サイドボード").toEqual(["3 Duress"]);
    expect.soft((await e.メイン.inputValue()).includes("不正な行"), "「不正な行」がメインボードに取り込まれる").toBe(false);
    expect.soft(await page.locator("#errorMain:visible, #errorSide:visible").count(), "表示されているエラーメッセージの数").toBe(0);
  });
});

// ---- カード名から登録 ----
caseTest("IT-F06-16-021", async ({ page, step, expected }) => {
  const e = await ログイン(page, "021");
  await step(1, async () => { await e.開く(大会("021").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.ボード選択("main").click({ timeout: 60_000 }); });
  await step(3, async () => { await e.カード名入力.fill("Island"); });
  await step(4, async () => { await e.枚数ボタン(4).click({ timeout: 60_000 }); });
  await expected(async () => {
    expect.soft(行(await e.メイン.inputValue()), "メインボードの行").toEqual(["4 Island"]);
  });
});

caseTest("IT-F06-16-022", async ({ page, step, expected }) => {
  const e = await ログイン(page, "022");
  await step(1, async () => { await e.開く(大会("022").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.ボード選択("side").click({ timeout: 60_000 }); });
  await step(3, async () => { await e.カード名入力.fill("Negate"); });
  await step(4, async () => { await e.枚数入力.fill("2"); });
  await step(5, async () => { await e.枚数追加ボタン.click({ timeout: 60_000 }); });
  await expected(async () => {
    expect.soft(行(await e.サイド.inputValue()), "サイドボードの行").toEqual(["2 Negate"]);
    expect.soft(await e.メイン.inputValue(), "メインボード").toBe("");
  });
});

// ---- 提出と保存内容 ----
caseTest("IT-F06-16-023", async ({ page, step, expected }) => {
  const e = await ログイン(page, "023");
  const d = 大会("023");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { await e.入力する("メイン", "4 Island\n1 Negate"); });
  await step(4, async () => { await e.入力する("サイド", "2 Negate"); });
  await step(5, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(6, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("023").選手ID); });
  await expected(async () => {
    expect.soft(decks.length, "追加されたデッキの件数").toBe(1);
    const k = decks[0];
    if (!k) return;
    expect.soft(k.プレイヤー名, "プレイヤー名").toBe("YAMADA TARO");
    expect.soft(k.大会名, "大会名").toBe(d.大会名);
    expect.soft(k.開催日時, "開催日時").toBe("2099-12-20 10:00");
    expect.soft(行(k.メイン), "内容テキスト（メイン）").toEqual(["4 Island", "1 Negate"]);
    expect.soft(行(k.サイド), "内容テキスト（サイド）").toEqual(["2 Negate"]);
    expect.soft(k.フォーマット名, "フォーマット").toBe("Standard");
    expect.soft(k.公開設定, "公開設定").toBe("非公開");
    expect.soft(k.デッキタイプ, "デッキタイプ").toBe("イベント");
    expect.soft(k.編集者あり, "デッキ編集者が設定されている").toBe(false);
    const cards = DB.デッキのカード情報(k.デッキID);
    expect.soft(cards.map((c) => `${c.ボード}:${c.カード名}:${c.枚数}`).sort(), "保存されたカード情報").toEqual(["Main Board:Island:4", "Main Board:Negate:1", "Side Board:Negate:2"]);
  });
});

caseTest("IT-F06-16-024", async ({ page, step, expected }) => {
  const e = await ログイン(page, "024");
  const d = 大会("024");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { await e.入力する("メイン", "4 Island"); });
  await step(4, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(5, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("024").選手ID); });
  await expected(async () => {
    expect.soft(decks.length, "登録されたデッキの件数").toBe(1);
    expect.soft(decks[0]?.旧デッキID ?? "", "旧デッキID").toBe("");
  });
});

caseTest("IT-F06-16-025", async ({ page, step, expected }) => {
  const e = await ログイン(page, "025");
  await step(1, async () => { await e.開く(大会("025").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { await e.入力する("メイン", "4 Island"); });
  await step(4, async () => { await e.提出する(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（デッキ登録完了画面）").toMatch(/^\/ja\/deckentry\/\d+\/check\/?$/);
  });
});

caseTest("IT-F06-16-029", async ({ page, step, expected }) => {
  const e = await ログイン(page, "029");
  const d = 大会("029");
  note(`事前準備の「Unknown Card」という現行カード情報が無いことは、DBの参照で確かめた（${DB.カードの件数("Unknown Card")}件）`);
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { await e.入力する("メイン", "4 Island\n2 Unknown Card"); });
  await step(4, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(5, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("029").選手ID); });
  await expected(async () => {
    expect.soft(decks.length, "登録されたデッキの件数").toBe(1);
    const k = decks[0];
    if (!k) return;
    expect.soft(行(k.メイン), "内容テキスト（メイン）").toEqual(["4 Island", "2 Unknown Card"]);
    expect.soft(DB.デッキのカード情報(k.デッキID).map((c) => `${c.カード名}:${c.枚数}`), "保存されたカード情報").toEqual(["Island:4"]);
  });
});

// ---- 表示されない条件 ----
caseTest("IT-F06-16-036", async ({ page, step, expected }) => {
  page.setDefaultNavigationTimeout(60_000);
  await step(1, async () => { await page.goto(前面(`/deckentry/${大会("036").日程ID}/edit`)); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（会員ログイン画面）").toMatch(/\/mypage\/login\/?$/);
  });
});

caseTest("IT-F06-16-038", async ({ page, step, expected }) => {
  const e = await ログイン(page, "038");
  note(`事前準備の「イベント詳細ID 999999 が無いこと」は、DBの参照で確かめた（${DB.イベント詳細の件数("999999")}件）`);
  let status = 0;
  await step(1, async () => { status = (await e.開く("999999"))?.status() ?? 0; });
  await expected(async () => {
    expect.soft(await e.表示されている(), "大会デッキ登録編集画面が表示される").toBe(false);
    expect.soft(status, "応答の状態").toBe(404);
  });
});

caseTest("IT-F06-16-039", async ({ page, step, expected }) => {
  const e = await ログイン(page, "039");
  let status = 0;
  await step(1, async () => { status = (await e.開く(大会("039").日程ID))?.status() ?? 0; });
  await expected(async () => {
    expect.soft(await e.表示されている(), "大会デッキ登録編集画面が表示される").toBe(false);
    expect.soft(status, "応答の状態").toBe(404);
  });
});

caseTest("IT-F06-16-040", async ({ page, step, expected }) => {
  const e = await ログイン(page, "040");
  let status = 0;
  await step(1, async () => { status = (await e.開く(大会("040").日程ID))?.status() ?? 0; });
  await expected(async () => {
    expect.soft(await e.表示されている(), "大会デッキ登録編集画面が表示される").toBe(false);
    expect.soft(status, "応答の状態").toBe(404);
  });
});

// ---- 開発者ツールでの改変 ----
caseTest("IT-F06-16-041", async ({ page, step, expected }) => {
  const e = await ログイン(page, "041");
  const d = 大会("041");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.入力する("メイン", "4 Island"); });
  await step(3, async () => { await page.locator('form#decklist_submit input[name="format"]').evaluateAll((os) => os.forEach((o) => o.remove())); });
  await step(4, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(5, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("041").選手ID); });
  await expected(async () => {
    expect.soft(decks.map((k) => k.フォーマット名), "登録されたデッキのフォーマット").toEqual(["Standard"]);
  });
});

caseTest("IT-F06-16-042", async ({ page, step, expected }) => {
  const e = await ログイン(page, "042");
  const d = 大会("042");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.入力する("メイン", "4 Island"); });
  await step(3, async () => { await page.locator('form#decklist_submit input[name="format"]:checked').first().evaluate((o) => { (o as HTMLInputElement).value = "999999"; }); });
  let status = 0;
  await step(4, async () => { const r = await e.提出する(); status = r.応答?.status() ?? 0; });
  await expected(async () => {
    expect.soft(await e.表示されている(), "大会デッキ登録編集画面が表示される").toBe(false);
    expect.soft(status, "応答の状態").toBe(404);
  });
});

caseTest("IT-F06-16-043", async ({ page, step, expected }) => {
  const e = await ログイン(page, "043");
  const d = 大会("043");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { await e.入力する("メイン", "4 Island"); });
  await step(4, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(5, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("043").選手ID); });
  await expected(async () => {
    expect.soft(decks.length, "登録されたデッキの件数").toBe(1);
    expect.soft(decks[0]?.プレイヤー名, "プレイヤー名").toBe("YAMADA TARO");
  });
});

caseTest("IT-F06-16-045", async ({ page, step, expected }) => {
  const e = await ログイン(page, "045");
  const d = 大会("045");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { await e.入力する("メイン", "4 Island"); });
  await step(4, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(5, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("045").選手ID); });
  await expected(async () => {
    expect.soft(decks.length, "登録されたデッキの件数").toBe(1);
    expect.soft(decks[0]?.プレイヤー名, "プレイヤー名（国内住所会員の氏名カナ）").toBe("サトウハナコ");
  });
});

// ---- カード名のサジェスト・ボード切り替え ----
caseTest("IT-F06-16-056", async ({ page, step, expected }) => {
  const e = await ログイン(page, "056");
  note(`事前準備の「F0616-056-Ghost というカード名の現行カード情報が無いこと」は、DBの参照で確かめた（${DB.カードの件数("F0616-056-Ghost")}件）`);
  await step(1, async () => { await e.開く(大会("056").日程ID); await e.フォーマットを選ぶ("Standard"); });
  await step(2, async () => { await e.ボード選択("main").click({ timeout: 60_000 }); });
  let 候補 = -1;
  await step(3, async () => {
    await e.カード名入力.fill("F0616-056-Ghost");
    await page.waitForTimeout(1500);
    候補 = await e.サジェスト候補.count();
  });
  await step(4, async () => { await e.枚数ボタン(4).click({ timeout: 60_000 }); });
  await expected(async () => {
    expect.soft(候補, "サジェスト候補の数").toBe(0);
    expect.soft(行(await e.メイン.inputValue()), "メインボードの行").toEqual(["4 F0616-056-Ghost"]);
  });
});

caseTest("IT-F06-16-057", async ({ page, step, expected }) => {
  const e = await ログイン(page, "057");
  await step(1, async () => { await e.開く(大会("057").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.メイン.click({ timeout: 60_000 }); });
  await step(3, async () => { await e.サイド.click({ timeout: 60_000 }); });
  await step(4, async () => { await expect(e.ボードの選択状態("side")).toBeAttached(); });
  await expected(async () => {
    expect.soft(await e.ボードの選択状態("side").isChecked(), "サイドボード選択ボタンが選択状態").toBe(true);
    expect.soft(await e.ボードの選択状態("main").isChecked(), "メインボード選択ボタンが選択状態").toBe(false);
    await expect.soft(e.ボード選択("side"), "サイドボード選択ボタンの表示").toBeVisible();
  });
});

caseTest("IT-F06-16-058", async ({ page, step, expected }) => {
  const e = await ログイン(page, "058");
  await step(1, async () => { await e.開く(大会("058").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.サイド.click({ timeout: 60_000 }); });
  await step(3, async () => { await e.カード名入力.fill("Negate"); });
  await step(4, async () => { await e.枚数ボタン(4).click({ timeout: 60_000 }); });
  await step(5, async () => { await expect(e.サイド).toBeVisible(); });
  await expected(async () => {
    expect.soft(行(await e.サイド.inputValue()), "サイドボードの行").toEqual(["4 Negate"]);
    expect.soft(await e.メイン.inputValue(), "メインボード").toBe("");
  });
});

caseTest("IT-F06-16-059", async ({ page, step, expected }) => {
  const e = await ログイン(page, "059");
  await step(1, async () => { await e.開く(大会("059").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.ボード選択("main").click({ timeout: 60_000 }); });
  await step(3, async () => { await e.ボード選択("side").click({ timeout: 60_000 }); });
  await step(4, async () => { await expect(e.サイド).toBeVisible(); });
  await expected(async () => {
    expect.soft(await e.サイド.evaluate((t) => t.classList.contains("p-hareruya-deckentry-edit__deck-textarea--active")), "サイドボード入力欄が強調表示").toBe(true);
    expect.soft(await e.メイン.evaluate((t) => t.classList.contains("p-hareruya-deckentry-edit__deck-textarea--active")), "メインボード入力欄が強調表示").toBe(false);
  });
});

caseTest("IT-F06-16-064", async ({ page, step, expected }) => {
  const e = await ログイン(page, "064");
  let s1 = { m: "", s: "" }, s2 = { m: "", s: "" };
  await step(1, async () => { await e.開く(大会("064").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { s1 = { m: await e.メイン.inputValue(), s: await e.サイド.inputValue() }; });
  await step(4, async () => { await e.フォーマットを選ぶ("Modern"); });
  await step(5, async () => { s2 = { m: await e.メイン.inputValue(), s: await e.サイド.inputValue() }; });
  await expected(async () => {
    expect.soft(行(s1.m), "Standardのメインボード").toEqual(["1 F0616-064-Std-Main"]);
    expect.soft(行(s1.s), "Standardのサイドボード").toEqual(["1 F0616-064-Std-Side"]);
    expect.soft(s2.m, "Modernのメインボード").toBe("");
    expect.soft(s2.s, "Modernのサイドボード").toBe("");
  });
});

caseTest("IT-F06-16-072", async ({ page, step, expected }) => {
  const e = await ログイン(page, "072");
  await step(1, async () => { await e.開く(大会("072").日程ID); });
  await expected(async () => {
    expect.soft(await e.表示されている(), "大会デッキ登録編集画面が表示される").toBe(true);
    await expect.soft(e.提出ボタン, "デッキリストを提出するボタン").toBeVisible();
  });
});

// ---- カード名のサジェスト（フォーマットごと） ----
async function 候補を読む(e: DeckEditPage, 語: string): Promise<string[]> {
  await e.カード名入力.fill("");
  await e.カード名入力.fill(語);
  await e.サジェスト候補.first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => undefined);
  return (await e.サジェスト候補.allInnerTexts()).map((t) => t.trim());
}

caseTest("IT-F06-16-010", async ({ page, step, expected }) => {
  const e = await ログイン(page, "010");
  let s1: string[] = [], s2: string[] = [];
  await step(1, async () => { await e.開く(大会("010").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(3, async () => { s1 = await 候補を読む(e, "Alpha"); });
  await step(4, async () => { await e.フォーマットを選ぶ("Modern"); });
  await step(5, async () => { s2 = await 候補を読む(e, "Alpha"); });
  await expected(async () => {
    expect.soft(s1, "Standardでの候補").toContain("Alpha Wolf");
    expect.soft(s2, "Modernでの候補").toContain("Alpha Strike");
  });
});

caseTest("IT-F06-16-055", async ({ page, step, expected }) => {
  const e = await ログイン(page, "055");
  await step(1, async () => { await e.開く(大会("055").日程ID); await e.フォーマットを選ぶ("Standard"); });
  await step(2, async () => { await e.ボード選択("main").click({ timeout: 60_000 }); });
  let 候補: string[] = [];
  await step(3, async () => { 候補 = await 候補を読む(e, "Alpha"); });
  await step(4, async () => { await e.サジェスト候補.filter({ hasText: /^\s*Alpha Wolf\s*$/ }).first().click({ timeout: 30_000 }); });
  let v = "";
  await step(5, async () => { v = await e.カード名入力.inputValue(); });
  await expected(async () => {
    expect.soft(候補, "サジェスト候補").toContain("Alpha Wolf");
    expect.soft(v, "カード名入力の値").toBe("Alpha Wolf");
  });
});

// ---- マイデッキを取得 ----
caseTest("IT-F06-16-016", async ({ page, step, expected }) => {
  const e = await ログイン(page, "016");
  await step(1, async () => { await e.開く(大会("016").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.マイデッキボタン.click({ timeout: 60_000 }); });
  let n = -1;
  await step(3, async () => { await expect(e.マイデッキの画面).toBeVisible({ timeout: 20_000 }); n = await e.マイデッキの行.count(); });
  await expected(async () => {
    await expect.soft(e.マイデッキの画面, "マイデッキ取得ポップアップ画面").toBeVisible();
    expect.soft(n, "選択できるデッキの数").toBe(0);
    expect.soft(await e.表示されている(), "大会デッキ登録編集画面に留まっている").toBe(true);
  });
});

caseTest("IT-F06-16-060", async ({ page, step, expected }) => {
  const e = await ログイン(page, "060");
  const 名 = rc("F0616-060-Deck");
  await step(1, async () => { await e.開く(大会("060").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.マイデッキを開く(); });
  let 表示 = false;
  await step(3, async () => { 表示 = (await e.マイデッキ(名).count()) > 0; });
  await step(4, async () => { await page.mouse.click(5, 5); });
  await expected(async () => {
    expect.soft(表示, "ポップアップにF0616-060-Deckが表示されている").toBe(true);
    await expect.soft(e.マイデッキの画面, "マイデッキ取得用ポップアップ画面").toBeHidden({ timeout: 10_000 });
  });
});

caseTest("IT-F06-16-061", async ({ page, step, expected }) => {
  const e = await ログイン(page, "061");
  await step(1, async () => { await e.開く(大会("061").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.マイデッキを開く(); });
  let 総数 = "", 名: string[] = [];
  await step(3, async () => {
    総数 = (await e.マイデッキの総数.innerText()).trim();
    名 = (await e.マイデッキの行.locator(".p-hareruya-deckentry-edit__mydeck-item-name").allInnerTexts()).map((t) => t.trim()).sort();
  });
  await expected(async () => {
    expect.soft(総数, "検索結果総数").toBe("3");
    expect.soft(名, "表示されたデッキ名").toEqual(["A", "B", "C"].map((x) => rc(`F0616-061-${x}`)).sort());
  });
});

caseTest("IT-F06-16-062", async ({ page, step, expected }) => {
  const e = await ログイン(page, "062");
  await e.開く(大会("062").日程ID);
  const 名 = rc("F0616-062-Legacy");
  await step(1, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(2, async () => { await e.マイデッキを開く(); });
  await step(3, async () => {
    await e.マイデッキのフォーマット絞り込み.selectOption({ label: "Legacy" });
    await e.マイデッキ(名).click({ timeout: 60_000 });
  });
  let fmt = "", m = "", s = "";
  await step(4, async () => { fmt = await e.選択中のフォーマット名(); m = await e.メイン.inputValue(); s = await e.サイド.inputValue(); });
  await expected(async () => {
    expect.soft(fmt, "選択フォーマット").toBe("Standard");
    expect.soft(行(m), "Standardのメインボード").toEqual(["3 Island"]);
    expect.soft(行(s), "Standardのサイドボード").toEqual(["2 Negate"]);
  });
});

caseTest("IT-F06-16-073", async ({ page, step, expected }) => {
  const e = await ログイン(page, "073");
  await e.開く(大会("073").日程ID);
  const 名 = rc("F0616-CB073-Modern");
  await step(1, async () => { await e.フォーマットを選ぶ("Standard"); });
  await step(2, async () => { await e.マイデッキを開く(); });
  await step(3, async () => {
    await e.マイデッキのフォーマット絞り込み.selectOption({ label: "Modern" });
    await e.マイデッキ(名).click({ timeout: 60_000 });
  });
  let fmt = "", m = "", s = "";
  await step(4, async () => { fmt = await e.選択中のフォーマット名(); m = await e.メイン.inputValue(); s = await e.サイド.inputValue(); });
  await expected(async () => {
    expect.soft(fmt, "選択フォーマット").toBe("Modern");
    expect.soft(行(m), "Modernのメインボード（統率領域のカードの行は加わらない）").toEqual(["3 Alpha Strike"]);
    expect.soft(行(s), "Modernのサイドボード").toEqual(["2 Negate"]);
  });
});
