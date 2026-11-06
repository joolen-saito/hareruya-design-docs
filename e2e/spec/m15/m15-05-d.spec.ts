/**
 * M15-05 デッキ編集（更新・複製・削除・検索ポップアップ・候補の入力）。ケースの正本: integration_test/casegen/cases/M15-05_test_cases.tsv
 * 共有マスタ（フォーマット・カード・アーキタイプ）は seeds/m15-05-b.ts、このファイルのシードは seeds/m15-05-d.ts。
 * 文字数・桁数を確かめるケース（083・084）の更新後の値は、値そのものを確かめるため実行の印を付けない。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { デッキに紐づくデッキカードの数 } from "../../db/m15_05_delete";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { M1505_ADMIN } from "../../seeds/m15-05";
import { 語, 名 } from "../../seeds/m15-05-b";
import { M1505_U098, 店舗名 } from "../../seeds/m15-05-d";

type Step = Parameters<CaseBody>[0]["step"];
type Notes = Parameters<CaseBody>[0]["notes"];
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const f = (page: Page, n: string) => page.locator(`[name="admin_deck[${n}]"]`);
const 右の操作 = (page: Page) => page.locator(".col-md-2 .card-body");
const 行 = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);
const あ = (前: string, 合計: number, 文字 = "あ") => 前 + 文字.repeat(合計 - [...前].length);
const 選択済み = async (page: Page, n: string) => (await page.locator(n === "DeckTags" ? '[name="admin_deck[DeckTags][]"]' : `[name="admin_deck[${n}]"]`).locator("option:checked").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
const 画面の文言 = async (page: Page) => (await page.locator(".alert").allInnerTexts()).join(" ").replace(/\s+/g, " ");
const デッキID = (n: string, notes: Notes) => notes.get(`〔デッキID-M1505-${n}〕`);

async function login(page: Page, a = M1505_ADMIN): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, a);
}

/** デッキ一覧を開き、デッキ名で検索する（日付クリアも押す） */
async function 検索する(page: Page, 検索語: string): Promise<デッキ一覧> {
  const l = new デッキ一覧(page);
  await l.開く(); await l.f("deck_name").fill(検索語); await l.日付クリア.click(); await l.検索する();
  return l;
}
/** 手順 n・n+1: デッキ名で検索し、検索結果のデッキ情報をクリックして編集画面を開く */
async function 編集画面を開く(page: Page, step: Step, 検索語: string, id: string, 開始 = 1): Promise<void> {
  let l: デッキ一覧 | null = null;
  await step(開始, async () => { l = await 検索する(page, 検索語); });
  await step(開始 + 1, async () => {
    const r = l!.行(id);
    await expect(r, "検索結果のデッキの行").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), r.locator('a[href$="/edit"]').first().click()]);
  });
}
/** 検索して件数と表示されたデッキ名を返す */
async function 検索して数える(page: Page, 検索語: string): Promise<{ 件数: number; 名前: string[] }> {
  const l = await 検索する(page, 検索語);
  return { 件数: await l.件数(), 名前: await l.表示されたデッキ名() };
}
/** 「更新」を押す（送信が止められたら、待たずに戻る） */
async function 更新を押す(page: Page, 待ち = 45_000): Promise<boolean> {
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 待ち }).then(() => true).catch(() => false);
  await page.locator('button[type="submit"][form="admin_deck"]').first().click();
  const 移った = await nav;
  await page.waitForLoadState("load");
  return 移った;
}
async function 複製を開く(page: Page): Promise<void> {
  await 右の操作(page).locator('[data-bs-target="#copyModal"]').click();
  await expect(page.locator("#copyModal"), "デッキ情報複製のポップアップ").toBeVisible();
}
const 回数の欄 = (page: Page) => page.locator("#copyModal form[action$='/copy'] input:not([type=hidden])").first();
async function 複製保存を押す(page: Page, 回数?: string, 入力方法: "fill" | "type" = "fill", 待ち = 30_000): Promise<boolean> {
  await 複製を開く(page);
  if (回数 !== undefined) {
    if (入力方法 === "fill") await 回数の欄(page).fill(回数); else await 回数の欄(page).pressSequentially(回数);
  }
  const 入力が有効 = await 回数の欄(page).evaluate((e) => (e as HTMLInputElement).checkValidity());
  const 実際の待ち = 入力が有効 ? 待ち : 5_000;
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 実際の待ち }).then(() => true).catch(() => false);
  await page.locator("#copyModal").getByRole("button", { name: "複製保存" }).click();
  const 移った = await nav;
  if (!移った) note(入力が有効 ? `「複製保存」を押したが、${実際の待ち / 1000}秒以内に画面が移らなかった（処理が長引いている）` : "「複製保存」を押したが、ブラウザの入力チェック（回数の欄の最小・最大・必須）が送信を止めた（要求は送られていない）");
  await page.waitForLoadState("load");
  return 移った;
}
async function 削除を押す(page: Page, 確認: "OK" | "キャンセル" = "OK"): Promise<string> {
  let 文 = "";
  page.once("dialog", async (d) => { 文 = d.message(); if (確認 === "OK") await d.accept(); else await d.dismiss(); });
  if (確認 === "OK") {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => null), page.locator("#btn_delete").click()]);
    await page.waitForLoadState("load");
  } else {
    await page.locator("#btn_delete").click();
    await page.waitForTimeout(1_500);
  }
  return 文;
}
const 一覧のパス = (page: Page) => new URL(page.url()).pathname;
const 編集の画面か = (page: Page, id: string) => new URL(page.url()).pathname.endsWith(`/deck/${id}/edit`);

// ---- 更新 ----
caseTest("IT-M15-05-076", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("076")}-デッキ`, デッキID("076", notes));
  await step(3, async () => { await f(page, "textMain").fill(`1 ${名("禁止")}`); await 更新を押す(page); });
  await expected(async () => {
    expect.soft(await page.locator("body").innerText(), "画面の文言（現行フォーマットの警告）").not.toContain("現行フォーマットに則さない形で登録されています。");
    expect.soft(await 画面の文言(page), "更新が済んだことを示す文言").toContain("保存しました");
  });
});

caseTest("IT-M15-05-077", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("077")}-デッキ`, デッキID("077", notes));
  await step(3, async () => {
    await f(page, "deckName").fill(`${語("077")}-更新後`); await f(page, "result").fill(`${語("077")}-成績`);
    await f(page, "ranking").fill("5"); await f(page, "participants").fill("32"); await f(page, "textMain").fill(`2 ${名("カードA")}`);
  });
  await step(4, async () => { await 更新を押す(page); });
  await expected(async () => {
    expect.soft(await 画面の文言(page), "保存の成功メッセージ").toContain("保存しました");
    expect.soft(編集の画面か(page, デッキID("077", notes)), "デッキ編集画面が表示された").toBe(true);
    expect.soft(await f(page, "deckName").inputValue(), "デッキ名").toBe(`${語("077")}-更新後`);
    expect.soft(await f(page, "result").inputValue(), "成績").toBe(`${語("077")}-成績`);
    expect.soft(await f(page, "ranking").inputValue(), "順位").toBe("5");
    expect.soft(await f(page, "participants").inputValue(), "イベント参加人数").toBe("32");
    expect.soft(行(await f(page, "textMain").inputValue()), "メインボード").toEqual([`2 ${名("カードA")}`]);
  });
});

caseTest("IT-M15-05-078", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("078")}-デッキ`, デッキID("078", notes));
  await step(3, async () => { await f(page, "textMain").fill(`2 ${名("カードB")}`); await f(page, "textSide").fill(""); await 更新を押す(page); });
  let main: string[] = [], side: string[] = [];
  await step(4, async () => { main = 行(await f(page, "textMain").inputValue()); side = 行(await f(page, "textSide").inputValue()); });
  await expected(async () => {
    expect.soft(main, "メインボード").toEqual([`2 ${名("カードB")}`]);
    expect.soft(side, "サイドボード（空）").toEqual([]);
  });
});

caseTest("IT-M15-05-079", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("079")}-デッキ`, デッキID("079", notes));
  await step(3, async () => {
    for (const n of ["result", "ranking", "participants", "sourceUrl"]) await f(page, n).fill("");
    await 更新を押す(page);
  });
  await expected(async () => {
    expect.soft(await 画面の文言(page), "保存の成功メッセージ").toContain("保存しました");
    expect.soft(await f(page, "result").inputValue(), "成績（空）").toBe("");
    expect.soft(await f(page, "ranking").inputValue(), "順位（空）").toBe("");
    expect.soft(await f(page, "participants").inputValue(), "イベント参加人数（空）").toBe("");
    expect.soft(await f(page, "sourceUrl").inputValue(), "引用元URL（空）").toBe("");
    expect.soft(await 選択済み(page, "Format"), "フォーマット（変わらない）").toEqual([名("標準")]);
    expect.soft(await 選択済み(page, "Archetype"), "アーキタイプ（変わらない）").toEqual([名("型甲")]);
  });
});

/** 080・081: フォーマット／アーキタイプを未選択にして更新 → 再度開いて元の値のまま */
function 必須の選択を外す(n: string, 欄: "Format" | "Archetype", 項目名: string, 元: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page);
    await 編集画面を開く(page, step, `${語(n)}-デッキ`, デッキID(n, notes));
    let 移った = true;
    await step(3, async () => {
      await f(page, 欄).selectOption({ value: "" });
      await f(page, "result").fill(`${語(n)}-空`);
      移った = await 更新を押す(page, 20_000);
      if (!移った) note(`「${項目名}」を未選択にして「更新」を押したが、ブラウザの入力チェックが送信を止めた（要求は送られていない）`);
    });
    await 編集画面を開く(page, step, `${語(n)}-デッキ`, デッキID(n, notes), 4);
    await expected(async () => {
      expect.soft(await 選択済み(page, 欄), `${項目名}（元の値のまま）`).toEqual([元]);
      expect.soft(await f(page, "result").inputValue(), "成績（空）").toBe("");
    });
  };
}
caseTest("IT-M15-05-080", 必須の選択を外す("080", "Format", "フォーマット", 名("標準")));
caseTest("IT-M15-05-081", 必須の選択を外す("081", "Archetype", "アーキタイプ", 名("型甲")));

caseTest("IT-M15-05-082", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("082")}-デッキ`, デッキID("082", notes));
  await step(3, async () => {
    await f(page, "Disp").selectOption({ label: "公開" });
    await f(page, "eventNameEn").fill(`${語("082")}-Event`);
    await f(page, "eventDate").fill("2026-05-10T13:30");
    await 更新を押す(page, 30_000);
  });
  await 編集画面を開く(page, step, `${語("082")}-デッキ`, デッキID("082", notes), 4);
  await expected(async () => { expect.soft(await 選択済み(page, "Disp"), "公開状態（変わらない）").toEqual(["非公開"]); });
});

caseTest("IT-M15-05-083", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = デッキID("083", notes);
  await 編集画面を開く(page, step, `${語("083")}-デッキ`, id);
  const 値 = { デッキ名: あ("M1505-083-更", 255), プレイヤー名: あ("M1505-083-", 64), 成績: あ("M1505-083-", 32), 引用元URL: あ("https://example.com/M1505-083-", 2048, "a") };
  await step(3, async () => {
    await f(page, "deckName").fill(値.デッキ名); await f(page, "playerName").fill(値.プレイヤー名);
    await f(page, "result").fill(値.成績); await f(page, "sourceUrl").fill(値.引用元URL);
  });
  await step(4, async () => { await 更新を押す(page); await page.goto(adminUrl(`/deck/${id}/edit`)); await page.waitForLoadState("load"); });
  await expected(async () => {
    for (const [名前, 欄, 期待] of [["デッキ名", "deckName", 値.デッキ名], ["プレイヤー名", "playerName", 値.プレイヤー名], ["成績", "result", 値.成績], ["引用元URL", "sourceUrl", 値.引用元URL]] as const) {
      const 実際 = await f(page, 欄).inputValue();
      expect.soft(実際.length, `${名前}の文字数`).toBe([...期待].length);
      expect.soft(実際 === 期待, `${名前}が入力したとおり欠けずに表示される`).toBe(true);
    }
  });
});

caseTest("IT-M15-05-084", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = デッキID("084", notes);
  await 編集画面を開く(page, step, `${語("084")}-デッキ`, id);
  await step(3, async () => {
    await f(page, "deckName").evaluate((e) => e.removeAttribute("maxlength"));
    await f(page, "deckName").fill(あ("M1505-084-更", 256));
  });
  await step(4, async () => { await 更新を押す(page, 30_000); });
  await 編集画面を開く(page, step, `${語("084")}-デッキ`, id, 5);
  await expected(async () => {
    expect.soft(await f(page, "deckName").inputValue(), "デッキ名（更新されず元のまま）").toBe(`${語("084")}-デッキ`);
  });
});

// ---- 複製 ----
caseTest("IT-M15-05-085", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("085")}-デッキ`, デッキID("085", notes));
  await step(3, async () => { await 複製保存を押す(page, "1"); });
  let r = { 件数: -1, 名前: [] as string[] };
  await step(4, async () => { r = await 検索して数える(page, `${語("085")}-デッキ`); });
  await expected(async () => { expect.soft(r.件数, "検索結果の該当件数（元のデッキ1件と複製1件）").toBe(2); });
});

caseTest("IT-M15-05-087", async ({ page, notes, step, expected }) => {
  test.setTimeout(1_500_000);
  await login(page);
  await 編集画面を開く(page, step, `${語("087")}-デッキ`, デッキID("087", notes));
  await step(3, async () => { await 複製保存を押す(page, "310", "fill", 1_200_000); });
  let r = { 件数: -1, 名前: [] as string[] };
  await step(4, async () => { r = await 検索して数える(page, `${語("087")}-デッキ`); });
  await expected(async () => { expect.soft(r.件数, "検索結果の該当件数（元のデッキ1件と複製310件）").toBe(311); });
});

caseTest("IT-M15-05-088", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = デッキID("088", notes);
  await 編集画面を開く(page, step, `${語("088")}-デッキ`, id);
  await step(3, async () => { await 複製保存を押す(page, "1"); });
  await expected(async () => {
    expect.soft(編集の画面か(page, id), "元のデッキの編集画面が表示された").toBe(true);
    expect.soft(await f(page, "deckName").inputValue(), "デッキ名（元のデッキ）").toBe(`${語("088")}-デッキ`);
  });
});

caseTest("IT-M15-05-089", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = デッキID("089", notes);
  await 編集画面を開く(page, step, `${語("089")}-デッキ`, id);
  await step(3, async () => { await 複製保存を押す(page, "1"); });
  let l: デッキ一覧 | null = null;
  await step(4, async () => { l = await 検索する(page, `${語("089")}-デッキ`); });
  await step(5, async () => {
    const ids = await l!.表示されたID();
    const 複製 = ids.filter((x) => x !== id);
    expect(複製.length, "検索結果のうち元のデッキでないデッキの数").toBe(1);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l!.行(複製[0]).locator('a[href$="/edit"]').first().click()]);
  });
  await expected(async () => {
    expect.soft(await f(page, "deckName").inputValue(), "デッキ名").toBe(`${語("089")}-デッキ`);
    expect.soft(await f(page, "result").inputValue(), "成績").toBe(`${語("089")}-成績`);
    expect.soft(await f(page, "ranking").inputValue(), "順位").toBe("3");
    expect.soft(行(await f(page, "textMain").inputValue()), "メインボード").toEqual([`4 ${名("カードA")}`]);
    expect.soft(行(await f(page, "textSide").inputValue()), "サイドボード").toEqual([`3 ${名("カードB")}`]);
    expect.soft(行(await f(page, "textCommand").inputValue()), "統率").toEqual([`1 ${名("カードA")}`]);
    expect.soft(編集の画面か(page, id), "元のデッキの編集画面ではない（複製されたデッキ）").toBe(false);
  });
});

caseTest("IT-M15-05-091", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("091")}-デッキ`, デッキID("091", notes));
  await step(3, async () => {
    await 複製を開く(page);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#copyModal").getByRole("link", { name: "複製新規" }).click()]);
  });
  await expected(async () => {
    expect.soft(/\/deck\/new|\/duplicate/.test(page.url()), "デッキ新規登録画面が表示された").toBe(true);
    expect.soft(await f(page, "deckName").inputValue(), "デッキ名").toBe(`${語("091")}-デッキ`);
    expect.soft(await f(page, "result").inputValue(), "成績").toBe(`${語("091")}-成績`);
    expect.soft(await f(page, "ranking").inputValue(), "順位").toBe("3");
    expect.soft(行(await f(page, "textMain").inputValue()), "メインボード").toEqual([`4 ${名("カードA")}`]);
    await expect.soft(右の操作(page).getByRole("button", { name: "新規登録", exact: true }), "「新規登録」ボタン").toBeVisible();
    expect.soft(await 右の操作(page).getByRole("button", { name: "更新", exact: true }).count(), "「更新」ボタンの数").toBe(0);
  });
});

caseTest("IT-M15-05-092", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("092")}-デッキ`, デッキID("092", notes));
  await step(3, async () => {
    await 複製を開く(page);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#copyModal").getByRole("link", { name: "複製新規" }).click()]);
  });
  await step(4, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => null), page.locator('button[type="submit"][form="admin_deck"]').first().click()]);
    await page.waitForLoadState("load");
  });
  let r = { 件数: -1, 名前: [] as string[] };
  await step(5, async () => { r = await 検索して数える(page, `${語("092")}-デッキ`); });
  await expected(async () => { expect.soft(r.件数, "検索結果の該当件数（元のデッキと新規に登録されたデッキ）").toBe(2); });
});

/** 093〜096: 複製されない（件数は1件のまま） */
function 複製されない(n: string, 回数: string | undefined, 入力方法: "fill" | "type" = "fill"): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page);
    await 編集画面を開く(page, step, `${語(n)}-デッキ`, デッキID(n, notes));
    await step(3, async () => {
      await 複製保存を押す(page, 回数, 入力方法);
      if (回数 === "abc") note(`回数の欄は数値の欄で、「abc」を入力しようとしたあとの欄の値は「${await 回数の欄(page).inputValue().catch(() => "（画面が移った）")}」`);
    });
    let r = { 件数: -1, 名前: [] as string[] };
    await step(4, async () => { r = await 検索して数える(page, `${語(n)}-デッキ`); });
    await expected(async () => { expect.soft(r.件数, "検索結果の該当件数（1件のまま）").toBe(1); });
  };
}
caseTest("IT-M15-05-093", 複製されない("093", ""));
caseTest("IT-M15-05-094", 複製されない("094", "0"));
caseTest("IT-M15-05-095", 複製されない("095", "311"));
caseTest("IT-M15-05-096", 複製されない("096", "abc", "type"));

caseTest("IT-M15-05-097", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = デッキID("097", notes);
  await 編集画面を開く(page, step, `${語("097")}-デッキ`, id);
  await step(3, async () => { await 複製保存を押す(page, "0"); });
  await expected(async () => {
    expect.soft(await 画面の文言(page), "画面の文言").toContain("保存に失敗しました");
    expect.soft(編集の画面か(page, id), "元のデッキの編集画面に戻った").toBe(true);
    expect.soft(await f(page, "deckName").inputValue(), "デッキ名（元のデッキ）").toBe(`${語("097")}-デッキ`);
  });
});

caseTest("IT-M15-05-098", async ({ page, notes, step, expected }) => {
  void notes;
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, M1505_U098);
  const 一覧 = new デッキ一覧(page);
  let l: デッキ一覧 | null = null;
  await step(1, async () => { l = await 検索する(page, `${語("098")}-デッキ`); });
  await step(2, async () => {
    const ids = await l!.表示されたID();
    expect(ids.length, "検索結果のデッキの数").toBe(1);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l!.行(ids[0]).locator('a[href$="/edit"]').first().click()]);
  });
  await step(3, async () => { await 複製保存を押す(page, "1"); });
  let 件数 = -1, 名前: string[] = [];
  await step(4, async () => {
    await 一覧.開く();
    await 一覧.f("member").selectOption({ label: M1505_U098.loginId });
    await 一覧.日付クリア.click();
    await 一覧.検索する();
    件数 = await 一覧.件数(); 名前 = await 一覧.表示されたデッキ名();
  });
  await expected(async () => {
    expect.soft(名前, "検索結果のデッキ名").toEqual([`${語("098")}-デッキ`]);
    expect.soft(件数, "最終更新者がこのアカウントのデッキの件数（複製された1件だけ）").toBe(1);
  });
});

// ---- 削除 ----
caseTest("IT-M15-05-099", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("099")}-対象`, デッキID("099A", notes));
  await step(3, async () => { await 削除を押す(page); });
  let r = { 件数: -1, 名前: [] as string[] };
  await step(4, async () => { r = await 検索して数える(page, 語("099")); });
  await expected(async () => {
    expect.soft(r.名前, "検索結果のデッキ名（残すだけ）").toEqual([`${語("099")}-残す`]);
    expect.soft(r.名前.includes(`${語("099")}-対象`), "削除したデッキが表示される").toBe(false);
  });
});

caseTest("IT-M15-05-100", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("100")}-デッキ`, デッキID("100", notes));
  await step(3, async () => { await 削除を押す(page); });
  await expected(async () => {
    expect.soft(await 画面の文言(page), "削除の成功メッセージ").toContain("削除しました");
    expect.soft(一覧のパス(page), "デッキ検索・一覧画面に遷移した").toMatch(/\/deck(\/search\/\d+)?$/);
    await expect.soft(new デッキ一覧(page).検索ボタン, "デッキ検索・一覧画面の検索ボタン").toBeVisible();
  });
});

caseTest("IT-M15-05-101", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = デッキID("101", notes);
  await 編集画面を開く(page, step, `${語("101")}-デッキ`, id);
  let 文 = "";
  await step(3, async () => { 文 = await 削除を押す(page, "キャンセル"); });
  const 編集のまま = 編集の画面か(page, id);
  let r = { 件数: -1, 名前: [] as string[] };
  await step(4, async () => { r = await 検索して数える(page, `${語("101")}-デッキ`); });
  await expected(async () => {
    expect.soft(文, "確認ダイアログの文言").toContain("このデッキを削除しますか？");
    expect.soft(編集のまま, "デッキ編集画面にとどまった").toBe(true);
    expect.soft(r.件数, "検索結果の件数（削除されず1件）").toBe(1);
    expect.soft(r.名前, "検索結果のデッキ名").toEqual([`${語("101")}-デッキ`]);
  });
});

caseTest("IT-M15-05-102", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = デッキID("102", notes);
  let l: デッキ一覧 | null = null;
  await step(1, async () => { l = await 検索する(page, `${語("102")}-デッキ`); });
  await step(2, async () => {
    await l!.メニュー(id).click();
    page.once("dialog", (d) => { void d.accept(); });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => null),
      l!.行(id).locator(".deck-delete-button").click(),
    ]);
    await page.waitForLoadState("load");
  });
  let r = { 件数: -1, 名前: [] as string[] };
  await step(3, async () => { r = await 検索して数える(page, `${語("102")}-デッキ`); });
  await expected(async () => { expect.soft(r.件数, "検索結果の件数（0件）").toBe(0); });
});

caseTest("IT-M15-05-103", async ({ page, notes, step, expected, db }) => {
  void db;
  await login(page);
  const id = デッキID("103", notes);
  await 編集画面を開く(page, step, `${語("103")}-デッキ`, id);
  await step(3, async () => { await 削除を押す(page); });
  let 数 = -1;
  await step(4, async () => { 数 = デッキに紐づくデッキカードの数(id); });
  await expected(async () => { expect.soft(数, `削除したデッキ〔デッキID-M1505-103〕に紐づくデッキカードの数`).toBe(0); });
});

caseTest("IT-M15-05-106", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("106")}-デッキ`, デッキID("106", notes));
  await step(3, async () => { await page.locator("#delete_form input[name=_token]").evaluate((e) => { (e as HTMLInputElement).value = "tampered-token"; }); });
  await step(4, async () => { await 削除を押す(page); });
  let r = { 件数: -1, 名前: [] as string[] };
  await step(5, async () => { r = await 検索して数える(page, `${語("106")}-デッキ`); });
  await expected(async () => {
    expect.soft(r.件数, "検索結果の件数（削除されず1件）").toBe(1);
    expect.soft(r.名前, "検索結果のデッキ名").toEqual([`${語("106")}-デッキ`]);
  });
});

// ---- 検索ポップアップ ----
async function 新規登録のイベント検索を開く(page: Page, step: Step): Promise<void> {
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.新規登録.click()]); });
  await step(3, async () => { await page.locator('[data-bs-target="#searchEventModal"]').click(); await expect(page.locator("#searchEventModal"), "イベント検索のポップアップ").toBeVisible(); });
}
const イベント結果 = (page: Page) => page.locator("#event_search_results");

caseTest("IT-M15-05-107", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録のイベント検索を開く(page, step);
  await step(4, async () => {
    await page.locator("#event_search_shop").selectOption({ label: 店舗名.甲 });
    await page.locator("#btn_search_event").click();
    await expect(イベント結果(page).locator("table, p").first(), "検索結果").toBeVisible({ timeout: 30_000 });
  });
  await expected(async () => {
    const t = await イベント結果(page).innerText();
    expect.soft(t, "イベントAの名前").toContain(`${語("107")}-甲大会`);
    expect.soft(t, "イベントBの名前（表示されない）").not.toContain(`${語("107")}-乙大会`);
  });
});

caseTest("IT-M15-05-123", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録のイベント検索を開く(page, step);
  const 欄 = page.locator("#event_search_shop");
  let 入力できた = false, サジェスト = false;
  await step(4, async () => {
    await 欄.focus();
    await page.keyboard.type(店舗名.S123);
    サジェスト = (await page.locator(".select2-container--open .select2-search__field, #searchEventModal .select2-container").count()) > 0;
    入力できた = (await 欄.evaluate((e) => e.tagName)) !== "SELECT";
    note(`店舗の欄は ${入力できた ? "文字を入力できる欄" : "選択肢から選ぶプルダウン（文字を打っても候補の一覧は出ず、先頭が一致する選択肢へ移るだけ）"} だった`);
  });
  await step(5, async () => { await 欄.selectOption({ label: 店舗名.S123 }); });
  await expected(async () => {
    expect.soft(サジェスト, "入力に応じた候補の一覧（サジェスト）が表示される").toBe(true);
    expect.soft((await 欄.locator("option:checked").innerText()).trim(), "ポップアップの店舗").toBe(店舗名.S123);
  });
});

caseTest("IT-M15-05-126", async ({ page, notes, step, expected }) => {
  await login(page);
  await 新規登録のイベント検索を開く(page, step);
  await step(4, async () => {
    await page.locator("#event_search_word").fill(`${語("126")}-甲大会`);
    await page.locator("#btn_search_event").click();
    await expect(イベント結果(page).locator("table, p").first(), "検索結果").toBeVisible({ timeout: 30_000 });
  });
  await expected(async () => {
    const t = (await イベント結果(page).innerText()).replace(/\s+/g, " ").replace(/-/g, "/");
    expect.soft(t, "イベントID").toContain(notes.get("〔イベントID-M1505-126〕"));
    expect.soft(t, "イベント名").toContain(`${語("126")}-甲大会`.replace(/-/g, "/"));
    expect.soft(t, "開催日(2026/03/10 10:00)").toContain("2026/03/10 10:00");
  });
});

caseTest("IT-M15-05-108", async ({ page, notes, step, expected }) => {
  await login(page);
  const l = new デッキ一覧(page);
  await step(1, async () => { await 検索する(page, 語("108")); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.件数選択.selectOption({ label: "10件" })]); await l.結果を待つ(); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator(".pagination a.page-link", { hasText: "2" }).first().click()]);
    await l.結果を待つ();
    expect(await l.表示されたデッキ名(), "2ページ目のデッキ（01と02）").toEqual([`${語("108")}-02`, `${語("108")}-01`]);
  });
  await step(4, async () => {
    const id = notes.get("〔デッキID-M1505-108A〕");
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.行(id).locator('a[href$="/edit"]').first().click()]);
    await 削除を押す(page);
  });
  await expected(async () => {
    const 名前 = (await page.locator(".deck-result-table").count()) ? await l.表示されたデッキ名() : [];
    expect.soft(一覧のパス(page), "表示された一覧のアドレス（2ページ目）").toMatch(/\/deck\/search\/2$/);
    expect.soft(名前.includes(`${語("108")}-02`), "「M1505-108-02」が表示される").toBe(true);
    expect.soft(名前.includes(`${語("108")}-01`), "「M1505-108-01」が表示される（表示されない）").toBe(false);
  });
});

// ---- 新規登録（空白・不明なカード） ----
async function 新規で入力する(page: Page, n: string, メイン: string): Promise<void> {
  await f(page, "deckName").fill(`${語(n)}-デッキ`);
  await f(page, "Format").selectOption({ label: 名("標準") });
  await f(page, "Archetype").selectOption({ label: n === "112" ? 名("型丙") : 名("型甲") });
  await f(page, "Disp").selectOption({ label: "非公開" });
  void メイン;
}
async function 新規登録を押す(page: Page): Promise<void> {
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => null), page.locator('button[type="submit"][form="admin_deck"]').first().click()]);
  await page.waitForLoadState("load");
}
async function 新規登録を開く(page: Page, step: Step): Promise<void> {
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.新規登録.click()]); });
}

caseTest("IT-M15-05-112", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録を開く(page, step);
  await step(3, async () => { await 新規で入力する(page, "112", ""); });
  await step(4, async () => { await f(page, "textMain").fill("   "); });
  await step(5, async () => { await 新規登録を押す(page); });
  await expected(async () => {
    expect.soft(/\/deck\/\d+\/edit/.test(page.url()), "デッキが登録されてデッキ編集画面に移った").toBe(true);
    expect.soft(await page.locator(".alert-danger").filter({ hasNotText: "デバッグモード" }).count(), "エラー表示の数").toBe(0);
    expect.soft(await f(page, "textMain").inputValue(), "メインボード（空）").toBe("");
  });
});

caseTest("IT-M15-05-135", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録を開く(page, step);
  await step(3, async () => { await 新規で入力する(page, "135", ""); });
  await step(4, async () => { await f(page, "textMain").fill(`1 ${語("135")}-Nothing`); });
  await step(5, async () => { await 新規登録を押す(page); });
  await step(6, async () => { await expect(f(page, "deckName"), "登録後のデッキ編集画面").toBeVisible(); });
  await expected(async () => {
    expect.soft(/\/deck\/\d+\/edit/.test(page.url()), "デッキ編集画面へ移った").toBe(true);
    expect.soft((await f(page, "textMain").inputValue()).includes(`${語("135")}-Nothing`), "メインボードに「M1505-135-Nothing」の行が表示される").toBe(false);
  });
});

// ---- 2つのブラウザ ----
caseTest("IT-M15-05-114", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = デッキID("114", notes);
  await 編集画面を開く(page, step, `${語("114")}-デッキ`, id);
  await step(3, async () => { await 複製を開く(page); await 回数の欄(page).fill("1"); });
  const B = await page.context().newPage();
  B.setDefaultTimeout(60_000);
  await step(4, async () => {
    await B.goto(adminUrl(`/deck/${id}/edit`)); await B.waitForLoadState("load");
    B.once("dialog", (d) => { void d.accept(); });
    await Promise.all([B.waitForNavigation({ waitUntil: "load" }), B.locator("#btn_delete").click()]);
  });
  await step(5, async () => {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => null),
      page.locator("#copyModal").getByRole("button", { name: "複製保存" }).click(),
    ]);
    await page.waitForLoadState("load");
  });
  await expected(async () => { expect.soft(await page.locator("body").innerText(), "画面の文言").toContain("保存に失敗しました"); });
  await B.close();
});

caseTest("IT-M15-05-115", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = デッキID("115", notes);
  await 編集画面を開く(page, step, `${語("115")}-デッキ`, id);
  const B = await page.context().newPage();
  B.setDefaultTimeout(60_000);
  await step(3, async () => {
    await B.goto(adminUrl(`/deck/${id}/edit`)); await B.waitForLoadState("load");
    B.once("dialog", (d) => { void d.accept(); });
    await Promise.all([B.waitForNavigation({ waitUntil: "load" }), B.locator("#btn_delete").click()]);
  });
  let 応答 = -1;
  await step(4, async () => {
    page.once("dialog", (d) => { void d.accept(); });
    const res = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes(`/deck/${id}/delete`), { timeout: 60_000 }).catch(() => null);
    await page.locator("#btn_delete").click();
    const r = await res;
    応答 = r ? r.status() : -1;
    await page.waitForLoadState("load");
  });
  await expected(async () => { expect.soft(応答, "削除の送信への応答（HTTPステータス）").toBe(404); });
  await B.close();
});

// ---- 表示 ----
caseTest("IT-M15-05-118", async ({ page, notes, step, expected }) => {
  await login(page);
  await 編集画面を開く(page, step, `${語("118")}-デッキ`, デッキID("118", notes));
  await step(3, async () => { await expect(f(page, "deckName"), "デッキ編集画面").toBeVisible(); await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); });
  await expected(async () => {
    expect.soft(await page.getByText("旧デッキID").count(), "「旧デッキID」の表示の数").toBe(0);
    expect.soft(await page.locator('[name*="old"], [id*="old_deck"], [id*="oldDeck"]').count(), "旧デッキIDの入力欄の数").toBe(0);
  });
});

// ---- 候補の入力（選択欄） ----
caseTest("IT-M15-05-120", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録を開く(page, step);
  let 候補あり = false;
  await step(3, async () => {
    const 表示 = page.locator("#admin_deck_Format + .select2-container .select2-selection");
    await 表示.click();
    await page.locator(".select2-container--open .select2-search__field").first().fill(名("標準"));
    候補あり = await page.locator(".select2-container--open .select2-results__option", { hasText: 名("標準") }).first().isVisible();
  });
  await step(4, async () => { await page.locator(".select2-container--open .select2-results__option", { hasText: 名("標準") }).first().click(); });
  await expected(async () => {
    expect.soft(候補あり, `入力に対する候補に「${名("標準")}」が表示される`).toBe(true);
    expect.soft(await 選択済み(page, "Format"), "フォーマット").toEqual([名("標準")]);
  });
});

caseTest("IT-M15-05-121", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録を開く(page, step);
  await step(3, async () => { await f(page, "Format").selectOption({ label: 名("標準") }); });
  let 候補あり = false;
  await step(4, async () => {
    await page.locator("#admin_deck_Archetype + .select2-container .select2-selection").click();
    await page.locator(".select2-container--open .select2-search__field").first().fill(名("型甲"));
    候補あり = await page.locator(".select2-container--open .select2-results__option", { hasText: 名("型甲") }).first().isVisible();
  });
  await step(5, async () => { await page.locator(".select2-container--open .select2-results__option", { hasText: 名("型甲") }).first().click(); });
  await expected(async () => {
    expect.soft(候補あり, `入力に対する候補に「${名("型甲")}」が表示される`).toBe(true);
    expect.soft(await 選択済み(page, "Archetype"), "アーキタイプ").toEqual([名("型甲")]);
  });
});

caseTest("IT-M15-05-122", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録を開く(page, step);
  await step(3, async () => { await f(page, "Format").selectOption({ label: 名("標準") }); });
  await step(4, async () => { await f(page, "Archetype").selectOption({ label: 名("型甲") }); });
  let 候補あり = false;
  await step(5, async () => {
    await page.locator("#admin_deck_DeckTags + .select2-container .select2-selection").click();
    await page.locator("#admin_deck_DeckTags + .select2-container .select2-search__field").fill(名("タグ一"));
    候補あり = await page.locator(".select2-container--open .select2-results__option", { hasText: 名("タグ一") }).first().isVisible();
  });
  await step(6, async () => { await page.locator(".select2-container--open .select2-results__option", { hasText: 名("タグ一") }).first().click(); });
  await expected(async () => {
    expect.soft(候補あり, `入力に対する候補に「${名("タグ一")}」が表示される`).toBe(true);
    expect.soft(await 選択済み(page, "DeckTags"), "タグ").toEqual([名("タグ一")]);
  });
});
