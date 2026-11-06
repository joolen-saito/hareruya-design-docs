/**
 * M15-05 デッキ編集（編集画面の表示・イベント検索・アーキタイプ連動）。ケースの正本: integration_test/casegen/cases/M15-05_test_cases.tsv
 * 共有マスタ（フォーマット・カード・アーキタイプ）は seeds/m15-05-b.ts が画面で用意する。
 * 代表カードの画像は画面から登録できないため、画像つきの既存カード（Lightning Bolt / Saheeli Rai）で代えている（注記に残す）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { M1505_ADMIN } from "../../seeds/m15-05";
import { 語, 名, 代表カードの代役 } from "../../seeds/m15-05-b";

type Step = Parameters<CaseBody>[0]["step"];
type Notes = Parameters<CaseBody>[0]["notes"];
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const f = (page: Page, n: string) => page.locator(`[name="admin_deck[${n}]"]`);
const 右の操作 = (page: Page) => page.locator(".col-md-2 .card-body");
const 代役の注記 = () => note("カード画像は画面から登録できないため、DeckTestAlpha/Beta の画像の代わりに、画像つきの既存カード（Lightning Bolt / Saheeli Rai）を使った");

async function login(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, M1505_ADMIN);
}

/** 手順1・2: デッキ名で検索し、検索結果のデッキ情報をクリックして編集画面を開く（手順1・2を含む。手順3以降は呼び出し側） */
async function 編集画面を開く(page: Page, step: Step, 検索語: string, デッキID: string): Promise<void> {
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); await l.f("deck_name").fill(検索語); await l.日付クリア.click(); await l.検索する(); });
  await step(2, async () => {
    const 行 = l.行(デッキID);
    await expect(行, "検索結果のデッキの行").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), 行.locator('a[href$="/edit"]').first().click()]);
  });
}

const 単一デッキ = (n: string, notes: Notes) => notes.get(`〔デッキID-M1505-${n}〕`);
const 選択済み = async (page: Page, n: string) => (await page.locator(n === "DeckTags" ? '[name="admin_deck[DeckTags][]"]' : `[name="admin_deck[${n}]"]`).locator("option:checked").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
const 行 = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);

/** 画面下部の操作ボタン（005: 更新・削除・複製が表示される / 006: 新規登録が表示されない） */
function ボタン(n: string, 表示: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page);
    await 編集画面を開く(page, step, `${語(n)}-デッキ`, 単一デッキ(n, notes));
    await step(3, async () => { await expect(右の操作(page), "画面下部の操作ボタン").toBeVisible(); });
    await expected(async () => {
      if (表示) {
        for (const 名前 of ["更新", "削除", "複製 >"]) await expect.soft(右の操作(page).getByRole("button", { name: 名前, exact: true }), `「${名前}」ボタン`).toBeVisible();
      } else {
        expect.soft(await 右の操作(page).getByRole("button", { name: "新規登録", exact: true }).count(), "「新規登録」ボタンの数").toBe(0);
      }
    });
  };
}
caseTest("IT-M15-05-005", ボタン("005", true));
caseTest("IT-M15-05-006", ボタン("006", false));

caseTest("IT-M15-05-007", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("007")}-デッキ`, 単一デッキ("007", notes));
  await step(3, async () => { await expect(f(page, "textMain"), "画面全体（メインボードの欄）").toBeVisible(); });
  await expected(async () => {
    expect.soft(await page.getByText("DCIナンバー").count(), "「DCIナンバー」の表示数").toBe(0);
    for (const 名前 of ["枚(カード情報)", "全角スペースを変換", "1, 2, 3, 4", "統率", "メインボード", "サイドボード"]) {
      expect.soft(await page.locator("form#admin_deck").getByRole("button", { name: 名前, exact: true }).count(), `「${名前}」ボタンの数`).toBe(0);
    }
    expect.soft(await page.locator("form#admin_deck input[name*='card'], form#admin_deck input[name*='Card']").evaluateAll((es) => es.filter((e) => (e as HTMLInputElement).type !== "hidden").length), "カード名・枚数の入力欄の数").toBe(0);
    for (const 欄 of ["textCommand", "textMain", "textSide"]) expect.soft(await f(page, 欄).evaluate((e) => e.tagName), `「${欄 === "textCommand" ? "統率" : 欄 === "textMain" ? "メインボード" : "サイドボード"}」の入力欄の種類`).toBe("TEXTAREA");
  });
});

caseTest("IT-M15-05-008", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("008")}-デッキ`, 単一デッキ("008", notes));
  await step(3, async () => { await expect(f(page, "deckName"), "デッキ名の欄").toBeVisible(); });
  await expected(async () => {
    expect.soft(await f(page, "deckName").inputValue(), "デッキ名").toBe(`${語("008")}-デッキ`);
    expect.soft(await f(page, "privateFlg").isChecked(), "デッキリスト公開状態のチェック").toBe(true);
    expect.soft(await 選択済み(page, "DeckType"), "デッキ種別").toEqual(["event"]);
    expect.soft(await 選択済み(page, "Format"), "フォーマット").toEqual([名("標準")]);
    expect.soft(await 選択済み(page, "Archetype"), "アーキタイプ").toEqual([名("型甲")]);
    expect.soft(await 選択済み(page, "DeckTags"), "タグ").toEqual([名("タグ一")]);
    expect.soft(await page.locator("#selectedCardImageName").innerText(), "代表カード（画像つきの既存カード Lightning Bolt で代えた）").toContain(代表カードの代役.A);
    expect.soft(await page.locator("#cardImagePreview").getAttribute("src"), "代表カードの画像").toBeTruthy();
    expect.soft(await 選択済み(page, "Disp"), "公開状態").toEqual(["公開"]);
    expect.soft(await f(page, "playerName").inputValue(), "プレイヤー名").toBe(`${語("008")}-プレイヤー`);
    expect.soft(await f(page, "eventNameJp").inputValue(), "イベント名(日)").toBe(`${語("008")}-大会`);
    expect.soft(await f(page, "eventNameEn").inputValue(), "イベント名(英)").toBe(`${語("008")}-Event`);
    expect.soft((await f(page, "eventDate").inputValue()).replace(/-/g, "/").replace("T", " "), "イベント開催日").toBe("2026/05/10 13:30");
    expect.soft(await f(page, "ranking").inputValue(), "順位").toBe("3");
    expect.soft(await f(page, "result").inputValue(), "成績").toBe(`${語("008")}-成績`);
    expect.soft(await f(page, "sourceUrl").inputValue(), "引用元URL").toBe("https://example.com/M1505-008");
    expect.soft(await f(page, "participants").inputValue(), "イベント参加人数").toBe("64");
  });
  代役の注記();
});

caseTest("IT-M15-05-009", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("009")}-デッキ`, 単一デッキ("009", notes));
  await step(3, async () => { await expect(f(page, "textMain"), "メインボードの欄").toBeVisible(); });
  await expected(async () => {
    expect.soft(行(await f(page, "textMain").inputValue()), "メインボード").toEqual([`4 ${名("カードA")}`, `2 ${名("カードB")}`]);
    expect.soft(行(await f(page, "textSide").inputValue()), "サイドボード").toEqual([`3 ${名("カードB")}`]);
    expect.soft(行(await f(page, "textCommand").inputValue()), "統率").toEqual([`1 ${名("カードA")}`]);
  });
});

caseTest("IT-M15-05-010", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("010")}-デッキ`, 単一デッキ("010", notes));
  await step(3, async () => { await expect(f(page, "eventNameJp"), "イベント名(日)の欄").toBeVisible(); });
  await expected(async () => {
    expect.soft(await f(page, "eventNameJp").inputValue(), "イベント名(日)").toBe(`${語("010")}-大会`);
    expect.soft(await f(page, "eventNameEn").inputValue(), "イベント名(英)").toBe(`${語("010")}-Event`);
    expect.soft((await f(page, "eventDate").inputValue()).replace(/-/g, "/").replace("T", " "), "イベント開催日").toBe("2026/07/20 18:00");
  });
});

caseTest("IT-M15-05-011", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("011")}-元`, notes.get("〔デッキID-M1505-011B〕"));
  let 応答: number | null = null;
  await step(3, async () => {
    const res = await page.goto(adminUrl(`/deck/${notes.get("〔デッキID-M1505-011A〕")}/edit`));
    応答 = res?.status() ?? null;
  });
  await expected(async () => {
    expect.soft(応答, "存在しないデッキの編集画面の応答").toBe(404);
    expect.soft(await f(page, "deckName").count(), "デッキ編集画面の入力欄の数（表示されない）").toBe(0);
  });
});

caseTest("IT-M15-05-012", async ({ page, notes, step, expected }) => {
  await login(page);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); await l.f("deck_name").fill(語("012")); await l.日付クリア.click(); await l.検索する(); });
  await step(2, async () => {
    const 乙 = l.行(notes.get("〔デッキID-M1505-012B〕"));
    await expect(乙, "検索結果の乙のデッキの行").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), 乙.locator('a[href$="/edit"]').first().click()]);
  });
  await expected(async () => {
    expect.soft(await f(page, "deckName").inputValue(), "編集画面のデッキ名").toBe(`${語("012")}-乙`);
    expect.soft(page.url(), "編集画面のアドレス").toContain(`/deck/${notes.get("〔デッキID-M1505-012B〕")}/edit`);
  });
});

caseTest("IT-M15-05-013", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("013")}-デッキ`, 単一デッキ("013", notes));
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), 右の操作(page).getByRole("link", { name: "戻る", exact: true }).click()]); });
  await expected(async () => {
    const l = new デッキ一覧(page);
    expect.soft(new URL(page.url()).pathname.replace(/\/$/, "").endsWith("/deck"), "戻った画面のアドレス（デッキ一覧）").toBe(true);
    await expect.soft(l.検索ボタン, "デッキ検索・一覧画面の検索ボタン").toBeVisible();
    await expect.soft(page.getByText(/検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした/).first(), "検索結果の表示").toBeVisible();
  });
});

// ---- 新規登録画面（アーキタイプ連動） ----
async function 新規登録で選ぶ(page: Page, step: Step): Promise<void> {
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.新規登録.click()]); });
  await step(3, async () => { await f(page, "Format").selectOption({ label: 名("標準") }); });
}
const 代表カード名 = (page: Page) => page.locator("#selectedCardImageName");

caseTest("IT-M15-05-015", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録で選ぶ(page, step);
  let 甲 = "", 乙 = "", 甲src = "", 乙src = "";
  await step(4, async () => {
    await f(page, "Archetype").selectOption({ label: 名("型甲") });
    await expect(代表カード名(page), "アーキタイプに連動した代表カード名").toBeVisible({ timeout: 15_000 });
    甲 = await 代表カード名(page).innerText(); 甲src = (await page.locator("#cardImagePreview").getAttribute("src")) ?? "";
  });
  await step(5, async () => {
    await f(page, "Archetype").selectOption({ label: 名("型乙") });
    await page.waitForTimeout(3_000);
    乙 = await 代表カード名(page).innerText(); 乙src = (await page.locator("#cardImagePreview").getAttribute("src")) ?? "";
  });
  await expected(async () => {
    expect.soft(甲, "「デッキ試験型甲」を選んだ時点の代表カード（画像つきの既存カード Lightning Bolt で代えた）").toContain(代表カードの代役.A);
    expect.soft(乙, "「デッキ試験型乙」に変更した時点の代表カード（画像つきの既存カード Saheeli Rai で代えた）").toContain(代表カードの代役.B);
    expect.soft(乙src, "変更後の代表カードの画像").not.toBe(甲src);
  });
  代役の注記();
});

function タグ自動(型: "型甲" | "型乙"): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    await 新規登録で選ぶ(page, step);
    const 通知: string[] = [];
    page.on("dialog", async (d) => { 通知.push(d.message()); await d.accept(); });
    await step(4, async () => { await f(page, "Archetype").selectOption({ label: 名(型) }); });
    await step(5, async () => { await page.locator("#btn_tag_auto_set").click(); await page.waitForTimeout(3_000); });
    await expected(async () => {
      if (型 === "型甲") {
        expect.soft((await 選択済み(page, "DeckTags")).sort(), "タグに入った名前").toEqual([名("タグ一"), 名("タグ二")].sort());
      } else {
        expect.soft(通知, "ダイアログの文言").toEqual(["選択されたアーキタイプにデッキタグが設定されていません。"]);
        expect.soft(/\/deck\/new/.test(page.url()), "デッキ新規登録画面にとどまる").toBe(true);
      }
    });
  };
}
caseTest("IT-M15-05-016", タグ自動("型甲"));
caseTest("IT-M15-05-018", タグ自動("型乙"));

caseTest("IT-M15-05-022", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("022")}-デッキ`, 単一デッキ("022", notes));
  await step(3, async () => {
    note("画面のボタンの表示は「複製」（正本の「複製 >」と文言が違う）。同じ位置のボタンを押した");
    await 右の操作(page).locator('[data-bs-target="#copyModal"]').click();
  });
  await expected(async () => {
    const m = page.locator("#copyModal");
    await expect.soft(m, "デッキ情報複製のポップアップ").toBeVisible();
    await expect.soft(m.getByText("指定回数"), "「指定回数」").toBeVisible();
    await expect.soft(m.getByRole("button", { name: "複製保存" }), "「複製保存」").toBeVisible();
    await expect.soft(m.getByRole("link", { name: "複製新規" }), "「複製新規」").toBeVisible();
  });
});

// ---- イベント検索 ----
async function イベント検索を開く(page: Page, step: Step): Promise<void> {
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.新規登録.click()]); });
  await step(3, async () => { await page.locator('[data-bs-target="#searchEventModal"]').click(); await expect(page.locator("#searchEventModal"), "イベント検索のポップアップ").toBeVisible(); });
}
const 結果 = (page: Page) => page.locator("#event_search_results");
const 日付の表記 = (t: string) => t.replace(/\s+/g, " ").replace(/\//g, "-");

caseTest("IT-M15-05-027", async ({ page, step, expected }) => {
  await login(page);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.新規登録.click()]); });
  await step(3, async () => { await page.locator('[data-bs-target="#searchEventModal"]').click(); await expect(page.locator("#searchEventModal"), "イベント検索のポップアップ").toBeVisible(); });
  await step(4, async () => { await page.locator("#event_search_word").fill(`${語("027")}-甲大会`); await page.locator("#btn_search_event").click(); await expect(結果(page).locator("table, p").first(), "検索結果").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    const t = 日付の表記(await 結果(page).innerText());
    expect.soft(t, "イベントAの名前").toContain(`${語("027")}-甲大会`);
    expect.soft(t, "イベントAの開催日(2026/03/10 10:00)").toContain("2026-03-10 10:00");
    expect.soft(t, "イベントBの名前（表示されない）").not.toContain(`${語("027")}-乙大会`);
  });
  note("イベントの開催店舗は「デッキ試験店舗」を作らず、イベント登録画面の選択肢（大阪店があればそれ、無ければ先頭）を使った");
});

caseTest("IT-M15-05-028", async ({ page, step, expected }) => {
  await login(page);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.新規登録.click()]); });
  await step(3, async () => { await page.locator('[data-bs-target="#searchEventModal"]').click(); await expect(page.locator("#searchEventModal"), "イベント検索のポップアップ").toBeVisible(); });
  await step(4, async () => {
    await page.locator("#event_search_word").fill(語("028"));
    await page.locator("#event_search_from").fill("2026-06-01");
    await page.locator("#event_search_to").fill("2026-06-30");
    await page.locator("#btn_search_event").click();
    await expect(結果(page).locator("table, p").first(), "検索結果").toBeVisible({ timeout: 30_000 });
  });
  await expected(async () => {
    const t = await 結果(page).innerText();
    expect.soft(t, "イベントBの名前").toContain(`${語("028")}-乙大会`);
    expect.soft(t, "イベントAの名前（表示されない）").not.toContain(`${語("028")}-甲大会`);
  });
});

caseTest("IT-M15-05-029", async ({ page, step, expected }) => {
  await login(page);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.新規登録.click()]); });
  await step(3, async () => { await page.locator('[data-bs-target="#searchEventModal"]').click(); await expect(page.locator("#searchEventModal"), "イベント検索のポップアップ").toBeVisible(); });
  await step(4, async () => { await page.locator("#event_search_word").fill(`${語("029")}-複数大会`); await page.locator("#btn_search_event").click(); await expect(結果(page).locator("table, p").first(), "検索結果").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    const t = 日付の表記(await 結果(page).innerText());
    expect.soft(await 結果(page).locator("td[rowspan]").filter({ hasText: `${語("029")}-複数大会` }).count(), "イベント名が表示される固まりの数（1つにまとまる）").toBe(1);
    expect.soft(t, "開催日 2026/04/01 10:00").toContain("2026-04-01 10:00");
    expect.soft(t, "開催日 2026/04/02 10:00").toContain("2026-04-02 10:00");
  });
});

function イベントAを選ぶ(n: string, 続き: boolean): CaseBody {
  return async ({ page, step, expected }) => {
  await login(page);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.新規登録.click()]); });
  await step(3, async () => {
    await page.locator('[data-bs-target="#searchEventModal"]').click();
    await expect(page.locator("#searchEventModal"), "イベント検索のポップアップ").toBeVisible();
    await page.locator("#event_search_word").fill(`${語(n)}-甲大会`);
    await page.locator("#btn_search_event").click();
    await expect(結果(page).locator("button.select-event").first(), "検索結果のイベントAの決定ボタン").toBeVisible({ timeout: 30_000 });
    if (!続き) return;
    await 結果(page).locator("button.select-event").first().click();
    await expect(page.locator("#searchEventModal"), "ポップアップが閉じる").toBeHidden();
  });
  await step(4, async () => {
    if (!続き) await 結果(page).locator("button.select-event").first().click();
    else await page.locator("#clear_event").click();
  });
  await expected(async () => {
    const 日付 = (await f(page, "eventDate").inputValue()).replace(/-/g, "/").replace("T", " ");
    if (!続き) {
      await expect.soft(page.locator("#searchEventModal"), "ポップアップ").toBeHidden();
      expect.soft(await f(page, "eventNameJp").inputValue(), "イベント名(日)").toBe(`${語(n)}-甲大会`);
      expect.soft(await f(page, "eventNameEn").inputValue(), "イベント名(英)").toBe(`${語(n)}-AlphaCup`);
      expect.soft(日付, "イベント開催日").toBe("2026/03/10 10:00");
    } else {
      expect.soft(await f(page, "eventNameJp").inputValue(), "イベント名(日)").toBe("");
      expect.soft(await f(page, "eventNameEn").inputValue(), "イベント名(英)").toBe("");
      expect.soft(日付, "イベント開催日").toBe("");
    }
  });
  };
}
caseTest("IT-M15-05-030", イベントAを選ぶ("030", false));
caseTest("IT-M15-05-031", イベントAを選ぶ("031", true));
