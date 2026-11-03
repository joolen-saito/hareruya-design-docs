/**
 * F06-01 会員登録（登録の流れ・保存結果）。正本: cases/F06-01_test_cases.tsv
 * 仮会員機能（共有の設定）を有効にするシードを使うケースは、基盤が1本だけで流す。
 * 「DB用テストフィクスチャで削除して各0件を確認する」シードの補いは、f06-01.spec.ts の冒頭のとおり（印を付けた新しいメールアドレス）。
 */
import { Browser, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { 会員, 会員の住所, 会員の選手 } from "../../db/f06_01";
import { EntryPage, 入力値 } from "../../pages/front/f06_01_entry";
import { mailOf, 仮会員機能を戻す } from "../../seeds/f06-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 削除の補い = "シード表は「DB用テストフィクスチャで対象メールアドレスの会員と関連データを削除し各0件を確認」と定めるが、DBへは書き込まない決まりのため、"
  + "メールアドレスの前半に実行の印を付けた新しいメールアドレスを使い、開始時に0件であることをDBの参照で確かめた（シードの作り方の中）";
async function 戻す(browser: Browser): Promise<void> {
  expect(await 仮会員機能を戻す(browser), "共有の設定（仮会員機能）を元の値へ戻せた").toBe("");
}

/** シード表のパスワード「Passw0rd!01」は11文字で、画面のパスワードの規則（半角英数字記号12〜50文字）に満たず登録できない。ケースがこの値の長さを確かめるものではないので、12文字以上の「Passw0rd!0123」で代える（正本の外の補い） */
const PW = "Passw0rd!0123";
const PW補い = "シード表のパスワード「Passw0rd!01」（11文字）は画面の規則（12〜50文字）に満たず登録できないため、末尾に数字を足した「Passw0rd!0123」（13文字）で代えた";
const jp = (前半: string, o: Partial<入力値> = {}): 入力値 => ({
  姓: "晴", 名: "太郎", セイ: "ハレ", メイ: "タロウ", 生年月日: ["1990", "1", "2"], 性別: "男性", メール: mailOf(前半), パスワード: PW,
  国: "Japan", 郵便番号: "100-0001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 電話番号: "0312345678",
  会社名: "晴屋テスト", 職業: "会社員", MTG姓: "HARE", MTG名: "TARO", ...o,
});
const us = (前半: string, o: Partial<入力値> = {}): 入力値 => ({
  姓: "Hare", 名: "Taro", セイ: "ハレ", メイ: "タロウ", 生年月日: ["1990", "1", "2"], 性別: "女性", メール: mailOf(前半), パスワード: PW,
  国: "United States", 郵便番号: "94105", 住所1: "San Francisco", 住所2: "Market Street 1", 住所3: "California", 電話番号: "14155550100",
  会社名: "Hareruya Test", 職業: "会社員", MTG姓: "HARE", MTG名: "TARO", ...o,
});

async function 入力して同意する(e: EntryPage, v: 入力値): Promise<boolean> {
  await e.open();
  await e.fill(v);
  const r = await e.同意する();
  if (!r.sent) note(`「同意する」を押しても送信されなかった（ブラウザの入力チェック）: ${(await e.エラー文()).join(" / ")}`);
  return r.sent;
}
/** 入力→同意→登録するまで通す */
async function 登録まで(e: EntryPage, v: 入力値): Promise<void> {
  await 入力して同意する(e, v);
  await e.登録する();
}
const reset = () => { supplement(削除の補い); supplement(PW補い); };

// ---- 確認画面の前（登録はしない） ----

caseTest("IT-F06-01-018", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  const v = jp("it-f0601-jp");
  await step(1, async () => { await e.open(); });
  await step(2, async () => {
    await e.fill({ ...v, パスワード確認: v.メール });
    expect(await e.f("plain_password][second").inputValue(), "パスワード(確認)がメールアドレスと同じ値").toBe(v.メール);
  });
  await step(3, async () => { const r = await e.同意する(); if (!r.sent) note(`「同意する」を押しても送信されなかった（ブラウザの入力チェック）: ${(await e.エラー文()).join(" / ")}`); });
  await expected(async () => {
    expect.soft(await e.確認画面である(), "会員登録確認画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-01-019", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  const v = jp("it-f0601-jp");
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill({ ...v, パスワード確認: PW }); });
  await step(3, async () => { const r = await e.同意する(); if (!r.sent) note(`「同意する」を押しても送信されなかった（ブラウザの入力チェック）: ${(await e.エラー文()).join(" / ")}`); });
  let found: 会員[] = [];
  await step(4, async () => { found = 会員(v.メール); });
  await expected(async () => {
    expect.soft(found.length, `メールアドレス「${v.メール}」の会員の数（登録されない）`).toBe(0);
  });
});

caseTest("IT-F06-01-025", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  const v = jp("it-f0601-jp");
  let found: 会員[] = [];
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill({ ...v, パスワード確認: v.メール }); });
  await step(3, async () => {
    await page.evaluate(() => { document.querySelector('[name="entry[_token]"]')?.remove(); });
    expect(await page.locator('[name="entry[_token]"]').count(), "なりすまし対策の照合値を持つ入力要素の数").toBe(0);
  });
  await step(4, async () => { await e.同意する(); });
  await step(5, async () => { found = 会員(v.メール); });
  await expected(async () => {
    expect.soft(found.length, `メールアドレス「${v.メール}」の会員の数（登録されない）`).toBe(0);
  });
});

caseTest("IT-F06-01-026", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill(jp("it-f0601-jp")); });
  await step(3, async () => { await e.同意する(); });
  await expected(async () => {
    expect.soft(await e.確認画面である(), "会員登録確認画面が表示される").toBe(true);
    const postal = (await page.locator(".p-hareruya-entry__postcod .c-hareruya-text").first().innerText()).trim();
    const address = await page.locator(".p-hareruya-entry__address .c-hareruya-text").first().innerText();
    const al = address.split("\n").map((t) => t.trim()).filter(Boolean);
    expect.soft(postal, "郵便番号が日本の郵便番号形式（〒nnn-nnnn）").toMatch(/^〒\s*\d{3}-\d{4}$/);
    expect.soft(al[0], "住所(都道府県)が表示されている").toBe("東京都");
    expect.soft(al.length, "住所の表示行（都道府県・住所1・住所2の3行で、住所3は表示されない）").toBe(3);
  });
});

caseTest("IT-F06-01-027", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill(us("it-f0601-us")); });
  await step(3, async () => { await e.同意する(); });
  await expected(async () => {
    expect.soft(await e.確認画面である(), "会員登録確認画面が表示される").toBe(true);
    const postal = (await page.locator(".p-hareruya-entry__postcod .c-hareruya-text").first().innerText()).trim();
    const address = await page.locator(".p-hareruya-entry__address .c-hareruya-text").first().innerText();
    const al = address.split("\n").map((t) => t.trim()).filter(Boolean);
    expect.soft(postal, "郵便番号が汎用の郵便番号形式（〒や区切りなしの入力値そのまま）").toBe("94105");
    expect.soft(al.includes("東京都") || al.includes("California") && al.length > 3, "住所(都道府県)の行が表示されない").toBe(false);
    expect.soft(al, "住所1・住所2・住所3の行").toEqual(["San Francisco", "Market Street 1", "California"]);
  });
});

caseTest("IT-F06-01-028", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill(jp("it-f0601-jp")); });
  await step(3, async () => { await e.同意する(); });
  await step(4, async () => { await expect(e.パンくず現在地.first(), "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(await e.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false);
  });
});

caseTest("IT-F06-01-029", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill(jp("it-f0601-jp")); });
  await step(3, async () => { await e.同意する(); });
  await step(4, async () => { await e.押して遷移する(e.パンくずホーム); });
  await expected(async () => {
    expect.soft(e.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/);
  });
});

caseTest("IT-F06-01-030", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  const v = jp("it-f0601-jp");
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill(v); });
  await step(3, async () => { await e.同意する(); });
  await step(4, async () => { await e.戻る(); });
  await expected(async () => {
    expect.soft(await e.入力画面である(), "会員登録画面が表示される").toBe(true);
    const val = (n: string) => e.f(n).inputValue();
    expect.soft(await val("name][name01"), "お名前(姓)").toBe(v.姓);
    expect.soft(await val("name][name02"), "お名前(名)").toBe(v.名);
    expect.soft(await val("kana][kana01"), "フリガナ(姓)").toBe(v.セイ);
    expect.soft(await val("kana][kana02"), "フリガナ(名)").toBe(v.メイ);
    expect.soft(await val("birth][year") + "/" + await val("birth][month") + "/" + await val("birth][day"), "生年月日").toBe("1990/1/2");
    expect.soft((await e.f("sex").locator("option:checked").innerText()).trim(), "性別").toBe("男性");
    expect.soft(await val("email][first"), "メールアドレス").toBe(v.メール);
    expect.soft(await val("email][second"), "メールアドレス(確認)").toBe(v.メール);
    expect.soft((await e.f("country").locator("option:checked").innerText()).trim(), "国").toBe("Japan");
    expect.soft(await val("postalCode][postalCode01") + await val("postalCode][postalCode02"), "郵便番号").toBe("1000001");
    expect.soft((await e.f("address][pref").locator("option:checked").innerText()).trim(), "住所(都道府県)").toBe("東京都");
    expect.soft(await val("address][addr01"), "住所1").toBe(v.住所1);
    expect.soft(await val("address][addr02"), "住所2").toBe(v.住所2);
    expect.soft(await val("tel][tel01") + await val("tel][tel02") + await val("tel][tel03"), "電話番号").toBe("0312345678");
    expect.soft(await val("company_name"), "会社名").toBe(v.会社名);
    expect.soft((await e.f("job").locator("option:checked").innerText()).trim(), "職業").toBe("会社員");
    expect.soft(await val("Player][lastNameEn") + " " + await val("Player][firstNameEn"), "MTG Campaign 登録名").toBe("HARE TARO");
    expect.soft(await val("plain_password][first"), "パスワード").toBe(PW);
    expect.soft(await val("plain_password][second"), "パスワード(確認)").toBe(PW);
  });
});

caseTest("IT-F06-01-031", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill(jp("it-f0601-jp")); });
  await step(3, async () => { await e.同意する(); });
  await step(4, async () => {
    // 開発者ツールで、確認画面が登録時に送るメールアドレス（隠し項目）を書き換える
    await page.evaluate(() => {
      for (const n of ["entry[email][first]", "entry[email][second]"]) (document.querySelector(`[name="${n}"]`) as HTMLInputElement).value = "invalid-email";
    });
  });
  await step(5, async () => { await e.登録する(); });
  await expected(async () => {
    expect.soft(await e.入力画面である(), "会員登録画面（入力欄のある画面）へ遷移する").toBe(true);
    expect.soft(await e.確認画面である(), "確認画面のままではない").toBe(false);
  });
});

// ---- 拒否（ブラックリスト）にあたる登録 ----

async function 拒否の登録(e: EntryPage, o: Partial<入力値>): Promise<void> {
  await e.open();
  await e.fill(jp("it-f0601-jp", o));
  await e.同意する();
  await e.登録する();
}

caseTest("IT-F06-01-032", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill(jp("it-f0601-jp", { 姓: "拒否" })); });
  await step(3, async () => { await e.同意する(); });
  await step(4, async () => { await e.登録する(); });
  await expected(async () => { expect.soft(e.登録エラー画面か, "会員情報登録エラー画面へ遷移する").toBe(true); });
});

caseTest("IT-F06-01-033", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill(jp("it-f0601-jp", { 住所2: "9-9" })); });
  await step(3, async () => { await e.同意する(); });
  await step(4, async () => { await e.登録する(); });
  await expected(async () => { expect.soft(e.登録エラー画面か, "会員情報登録エラー画面へ遷移する").toBe(true); });
});

caseTest("IT-F06-01-034", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill(jp("it-f0601-jp", { 電話番号: "0399999999" })); });
  await step(3, async () => { await e.同意する(); });
  await step(4, async () => { await e.登録する(); });
  await expected(async () => { expect.soft(e.登録エラー画面か, "会員情報登録エラー画面へ遷移する").toBe(true); });
});

caseTest("IT-F06-01-035", async ({ page, step, expected }) => {
  reset();
  const e = new EntryPage(page);
  const mail = mailOf("black-all");
  let found: 会員[] = [];
  await step(1, async () => { await e.open(); });
  await step(2, async () => { await e.fill(jp("black-all", { 姓: "拒否", 住所2: "9-9", 電話番号: "0399999999", メール: mail })); });
  await step(3, async () => { await e.同意する(); });
  await step(4, async () => { await e.登録する(); });
  await step(5, async () => { found = 会員(mail); });
  await expected(async () => {
    expect.soft(e.登録エラー画面か, "会員情報登録エラー画面へ遷移する").toBe(true);
    expect.soft(found.length, `メールアドレス「${mail}」の会員の数（登録されない）`).toBe(0);
  });
});

// ---- 登録してDBを確かめる ----

caseTest("IT-F06-01-013", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    const v: 入力値 = {
      姓: "亜".repeat(16), 名: "亜".repeat(16), セイ: "ア".repeat(25), メイ: "ア".repeat(25), 生年月日: ["1990", "1", "2"],
      メール: mailOf("it-f0601-max"), パスワード: PW, 国: "United States", 郵便番号: "1234567890",
      住所1: "A".repeat(90), 住所2: "A".repeat(90), 住所3: "A".repeat(90), 電話番号: "14155550100",
      会社名: "B".repeat(100), MTG姓: "C".repeat(128), MTG名: "D".repeat(128),
    };
    note("正本が定めない性別・職業は入れず、生年月日は1990年1月2日（ほかの入力シードと同じ）を入れた");
    let c: 会員[] = []; let p: ReturnType<typeof 会員の選手> = [];
    await step(1, async () => { await e.open(); });
    await step(2, async () => { await e.fill(v); });
    await step(3, async () => { const r = await e.同意する(); if (!r.sent) note(`「同意する」を押しても送信されなかった: ${(await e.エラー文()).join(" / ")}`); });
    await step(4, async () => { await e.登録する(); });
    await step(5, async () => { c = 会員(v.メール); p = c[0] ? 会員の選手(c[0].id) : []; });
    await expected(async () => {
      expect.soft(c.length, "会員の数").toBe(1);
      expect.soft(c[0]?.姓.length, "お名前(姓)の文字数").toBe(16);
      expect.soft(c[0]?.名.length, "お名前(名)の文字数").toBe(16);
      expect.soft(c[0]?.セイ?.length, "フリガナ(姓)の文字数").toBe(25);
      expect.soft(c[0]?.メイ?.length, "フリガナ(名)の文字数").toBe(25);
      expect.soft(c[0]?.海外郵便番号?.length, "郵便番号の文字数").toBe(10);
      expect.soft(c[0]?.住所1?.length, "住所1の文字数").toBe(90);
      expect.soft(c[0]?.住所2?.length, "住所2の文字数").toBe(90);
      expect.soft(c[0]?.住所3?.length, "住所3の文字数").toBe(90);
      expect.soft(c[0]?.会社名?.length, "会社名の文字数").toBe(100);
      expect.soft(p[0]?.MTG姓?.length, "MTG Campaign 登録名(姓)の文字数").toBe(128);
      expect.soft(p[0]?.MTG名?.length, "MTG Campaign 登録名(名)の文字数").toBe(128);
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-01-036", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    await step(1, async () => { await e.open(); });
    await step(2, async () => { await e.fill(jp("it-f0601-jp-036")); });
    await step(3, async () => { await e.同意する(); });
    await step(4, async () => { await e.登録する(); });
    await expected(async () => {
      expect.soft(e.完了画面か, "仮会員登録完了画面が表示される").toBe(true);
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-01-037", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    const v = us("it-f0601-us-037");
    let c: 会員[] = []; let a: ReturnType<typeof 会員の住所> = []; let p: ReturnType<typeof 会員の選手> = [];
    await step(1, async () => { await e.open(); });
    await step(2, async () => { await e.fill(v); });
    await step(3, async () => { await e.同意する(); });
    await step(4, async () => { await e.登録する(); });
    await step(5, async () => { c = 会員(v.メール); if (c[0]) { a = 会員の住所(c[0].id); p = 会員の選手(c[0].id); } });
    await expected(async () => {
      expect.soft(c.length, "会員情報の数").toBe(1);
      expect.soft(c[0]?.状態, "会員の状態").toBe("仮会員");
      expect.soft(a.length, "会員住所（お届け先の住所）の数").toBe(1);
      expect.soft(p.length, "選手情報の数").toBe(1);
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-01-038", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    const v = jp("it-f0601-jp-038");
    let a: ReturnType<typeof 会員の住所> = [];
    await step(1, async () => { await e.open(); });
    await step(2, async () => { await e.fill(v); });
    await step(3, async () => { await e.同意する(); });
    await step(4, async () => { await e.登録する(); });
    await step(5, async () => { const c = 会員(v.メール); a = c[0] ? 会員の住所(c[0].id) : []; });
    await expected(async () => {
      expect.soft(a.length, "作成された住所の付帯情報の数").toBe(1);
      expect.soft(a[0]?.既定, "既定のお届け先として設定されている").toBe(true);
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-01-039", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    const v = jp("it-f0601-jp-039");
    let a: ReturnType<typeof 会員の住所> = [];
    await step(1, async () => { await e.open(); });
    await step(2, async () => { await e.fill(v); });
    await step(3, async () => { await e.同意する(); });
    await step(4, async () => { await e.登録する(); });
    await step(5, async () => { const c = 会員(v.メール); a = c[0] ? 会員の住所(c[0].id) : []; });
    await expected(async () => {
      expect.soft(a[0]?.住所名, "住所の付帯情報の住所名").toBe("会員情報住所 / Membership Information Address");
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-01-040", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    const v = us("it-f0601-us-040");
    let p: ReturnType<typeof 会員の選手> = [];
    await step(1, async () => { await e.open(); });
    await step(2, async () => { await e.fill(v); });
    await step(3, async () => { await e.同意する(); });
    await step(4, async () => { await e.登録する(); });
    await step(5, async () => { const c = 会員(v.メール); p = c[0] ? 会員の選手(c[0].id) : []; });
    await expected(async () => {
      expect.soft(p.length, "選手情報の数").toBe(1);
      expect.soft(p[0]?.姓, "お名前(姓)").toBe("Hare");
      expect.soft(p[0]?.名, "お名前(名)").toBe("Taro");
      expect.soft(p[0]?.MTG姓, "MTG Campaign 登録名(姓)").toBe("HARE");
      expect.soft(p[0]?.MTG名, "MTG Campaign 登録名(名)").toBe("TARO");
      expect.soft(p[0]?.メール, "メールアドレス").toBe(v.メール);
      expect.soft(p[0]?.デッキ登録用ユーザーID ?? "", "デッキ登録用ユーザーIDが設定されている（空でない）").not.toBe("");
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-01-041", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    const v = us("it-f0601-us-041");
    let c: 会員[] = []; let a: ReturnType<typeof 会員の住所> = [];
    await step(1, async () => { await e.open(); });
    await step(2, async () => { await e.fill(v); });
    await step(3, async () => { await e.同意する(); });
    await step(4, async () => { await e.登録する(); });
    await step(5, async () => { c = 会員(v.メール); a = c[0] ? 会員の住所(c[0].id) : []; });
    await expected(async () => {
      expect.soft(c[0]?.海外郵便番号, "会員の郵便番号").toBe("94105");
      expect.soft(c[0]?.住所3, "会員の住所3").toBe("California");
      expect.soft(a[0]?.海外郵便番号, "お届け先の住所の郵便番号").toBe("94105");
      expect.soft(a[0]?.住所3, "お届け先の住所の住所3").toBe("California");
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-01-042", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    const v = jp("it-f0601-jp-042");
    let p: ReturnType<typeof 会員の選手> = [];
    await step(1, async () => { await e.open(); });
    await step(2, async () => { await e.fill(v); });
    await step(3, async () => { await e.同意する(); });
    await step(4, async () => { await e.登録する(); });
    await step(5, async () => { const c = 会員(v.メール); p = c[0] ? 会員の選手(c[0].id) : []; });
    await expected(async () => {
      expect.soft(p[0]?.デッキ登録用ユーザーID ?? "", "デッキ登録用ユーザーID（英数字8文字）").toMatch(/^[A-Za-z0-9]{8}$/);
    });
  } finally { await 戻す(browser); }
});

// ---- 仮会員登録完了画面 ----

async function 完了まで(e: EntryPage, 前半: string): Promise<void> {
  await e.open();
  await e.fill(jp(前半));
  await e.同意する();
  await e.登録する();
}

caseTest("IT-F06-01-046", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    await step(1, async () => { await 完了まで(e, "it-f0601-jp-046"); });
    await step(2, async () => { await expect(e.パンくず現在地.first(), "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
    await expected(async () => {
      expect.soft(e.完了画面か, "仮会員登録完了画面である").toBe(true);
      expect.soft(await e.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false);
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-01-047", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    await step(1, async () => { await 完了まで(e, "it-f0601-jp-047"); });
    await step(2, async () => { await e.押して遷移する(e.パンくずホーム); });
    await expected(async () => { expect.soft(e.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-01-048", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    await step(1, async () => { await 完了まで(e, "it-f0601-jp-048"); });
    await step(2, async () => { await e.押して遷移する(page.getByRole("link", { name: /ホームへ戻る/ })); });
    await expected(async () => { expect.soft(e.path, "遷移した画面（ECTOP）").toMatch(/^\/(ja\/?)?$/); });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-01-049", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    const v = jp("it-f0601-jp-049", { 性別: "", 会社名: "", 職業: "", MTG姓: "", MTG名: "" });
    let c: 会員[] = []; let p: ReturnType<typeof 会員の選手> = [];
    await step(1, async () => { await e.open(); });
    await step(2, async () => { await e.fill(v); });
    await step(3, async () => { await e.同意する(); });
    await step(4, async () => { await e.登録する(); });
    await step(5, async () => { c = 会員(v.メール); p = c[0] ? 会員の選手(c[0].id) : []; });
    await expected(async () => {
      expect.soft(c.length, "会員情報の数").toBe(1);
      expect.soft(c[0]?.性別 ?? "", "会員の性別が空").toBe("");
      expect.soft(c[0]?.会社名 ?? "", "会員の会社名が空").toBe("");
      expect.soft(c[0]?.職業 ?? "", "会員の職業が空").toBe("");
      expect.soft(p.length, "選手情報の数").toBe(1);
      expect.soft(p[0]?.MTG姓 ?? "", "MTG Campaign 登録名(姓)が空").toBe("");
      expect.soft(p[0]?.MTG名 ?? "", "MTG Campaign 登録名(名)が空").toBe("");
    });
  } finally { await 戻す(browser); }
});

// ---- 入力の組合せ（パスワード・性別） ----

function pwBody(前半: string, pw: string, o: { 性別?: "女性" | "男性"; 会社名: string; dbで確かめる: boolean; 登録される: boolean; 開発者ツール?: boolean }) {
  return async ({ page, browser, step, expected }: CaseCtx) => {
    supplement(削除の補い);
    try {
      const e = new EntryPage(page);
      const v = jp(前半, { パスワード: pw, 会社名: o.会社名, 性別: o.性別 ?? "男性" });
      let found: 会員[] = [];
      let done = false;
      await step(1, async () => { await e.open(); });
      await step(2, async () => {
        await e.fill(v);
        if (o.開発者ツール) {
          // 開発者ツールで、入力欄の文字数の上限を外して値を設定する
          await page.evaluate((x) => {
            for (const n of ["entry[plain_password][first]", "entry[plain_password][second]"]) {
              const i = document.querySelector(`[name="${n}"]`) as HTMLInputElement; i.removeAttribute("maxlength"); i.value = x;
            }
          }, pw);
        }
      });
      await step(3, async () => { await e.同意する(); });
      await step(4, async () => {
        if (await e.確認画面である()) { await e.登録する(); done = true; }
        else note("確認画面が表示されなかったので「登録する」は押していない");
      });
      if (o.dbで確かめる) await step(5, async () => { found = 会員(v.メール); });
      await expected(async () => {
        if (o.登録される) expect.soft(e.完了画面か, "仮会員登録完了画面が表示される").toBe(true);
        else expect.soft(e.完了画面か, "仮会員登録完了画面が表示されない").toBe(false);
        if (o.dbで確かめる) expect.soft(found.length, `メールアドレス「${v.メール}」の会員の数（登録されない）`).toBe(0);
        void done;
      });
    } finally { await 戻す(browser); }
  };
}
caseTest("IT-F06-01-061", pwBody("f0601-061-reg", "F0601n061!" + "a".repeat(40), { 会社名: "晴屋F0601n061", dbで確かめる: false, 登録される: true }));
caseTest("IT-F06-01-062", pwBody("f0601-062-reg", "F0601n062!" + "a".repeat(41), { 会社名: "晴屋F0601n062", dbで確かめる: true, 登録される: false, 開発者ツール: true }));
caseTest("IT-F06-01-063", pwBody("f0601-063-reg", "F0601n063!ab", { 会社名: "晴屋F0601n063", dbで確かめる: false, 登録される: true }));
caseTest("IT-F06-01-064", pwBody("f0601-064-reg", "F0601n064!a", { 会社名: "晴屋F0601n064", dbで確かめる: true, 登録される: false }));

caseTest("IT-F06-01-059", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    const v = jp("f0601-059-reg", { 性別: "女性", パスワード: "F0601n059!ab", 会社名: "晴屋F0601n059" });
    let c: 会員[] = [];
    await step(1, async () => { await e.open(); });
    await step(2, async () => { await e.fill(v); });
    await step(3, async () => { await e.同意する(); });
    await step(4, async () => { await e.登録する(); });
    await step(5, async () => { c = 会員(v.メール); });
    await expected(async () => {
      expect.soft(c[0]?.性別, "会員情報の性別").toBe("女性");
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-01-068", async ({ page, browser, step, expected }) => {
  reset();
  try {
    const e = new EntryPage(page);
    const v = jp("it-f0601-cb-068", { パスワード: "Passw0rd-CBF0601068" });
    let c: 会員[] = []; let a: ReturnType<typeof 会員の住所> = [];
    await step(1, async () => { await e.open(); });
    await step(2, async () => { await e.fill(v); });
    await step(3, async () => { await e.同意する(); });
    await step(4, async () => { await e.登録する(); });
    await step(5, async () => { c = 会員(v.メール); a = c[0] ? 会員の住所(c[0].id) : []; });
    await expected(async () => {
      expect.soft(c.length, "会員情報の数").toBe(1);
      expect.soft(a.length, "会員住所（お届け先の住所）の数").toBe(1);
      expect.soft(c[0]?.状態, "会員の状態").toBe("仮会員");
    });
  } finally { await 戻す(browser); }
});
