/**
 * M04-01 在庫検索/一覧。正本: cases/M04-01_test_cases.tsv
 *
 * 画面だけで準備できるケースのうち、検索条件保存の欄の 016・018〜022 を実装した（記録 review/M04-01_progress_2026-10-21.md）。
 * ほかのケースは、使用シードが「DBへ直接設定する／DBで直接削除する」を含む（検索選択肢マスタの棚番号・店舗別在庫の削除など）ので実装しない。
 *
 * どのケースも、全店舗試験管理者でテストごとの新しいブラウザのセッションにログインする（事前準備の「ブラウザセッションの…を消去」）。
 * 在庫検索一覧を検索条件の指定の無いアドレスで開くと、アプリはセッションの検索条件・ページ番号・選んでいる検索パターンを消す（一覧の画面の処理）。
 * 検索パターンの欄は「検索条件保存」の見出しの下の折りたたみの中にあるので、欄を見る・入れる手順では、見出しを押して開く（手順の注記に残す）。
 */
import { expect, Page, Request, test } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 在庫一覧の検索パターン, 同じ文字の繰り返しの名前の検索パターン, 検索パターン } from "../../db/m04_01_search_pattern";
import { shortName, StockSearchPatternPage } from "../../pages/admin/m04_01_search_pattern";
import { M0401_ALL } from "../../seeds/m04-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 事前準備①・③: 全店舗試験管理者で、新しいブラウザのセッションにログインする */
async function signIn(page: Page): Promise<StockSearchPatternPage> {
  await loginAdmin(page, M0401_ALL);
  return new StockSearchPatternPage(page);
}

/** 検索パターンの欄を開く（折りたたみの見出しを押す） */
async function showArea(p: StockSearchPatternPage): Promise<void> {
  const wasOpen = await p.area.isVisible();
  await p.showPatternArea();
  if (!wasOpen) note("検索パターンの欄は折りたたまれていたので、「検索条件保存」の見出しを押して開いた");
}

// 検索パターン名が空のとき、検索条件保存ボタンは非活性
caseTest("IT-M04-01-016", async ({ page, step, expected }) => {
  const p = await signIn(page);
  await step(1, () => p.open());
  let name = "";
  await step(2, async () => {
    await showArea(p);
    name = await p.patternName.inputValue();
  });
  await expected(async () => {
    expect(name, "検索パターン名は空のまま").toBe("");
    await expect(p.saveButton, "検索条件保存ボタンが非活性").toBeDisabled();
  });
});

// 保存済みの検索パターンが一覧に出る
caseTest("IT-M04-01-018", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  await step(1, () => p.open());
  let names: string[] = [];
  await step(2, async () => {
    await showArea(p);
    names = await p.savedPatternNames();
    note(`保存された検索パターン一覧: ${names.map(shortName).join("、") || "なし"}`);
  });
  await expected(async () => {
    expect(names.filter((n) => n === "既存検索条件-018"), "保存された検索パターン一覧に「既存検索条件-018」が1件").toHaveLength(1);
    // 一覧の「既存検索条件-018」が、シードが保存した検索パターン（控えた番号）を指していること
    await expect(p.patternLink("既存検索条件-018"), "一覧の「既存検索条件-018」は控えた検索パターンIDを指す")
      .toHaveAttribute("href", new RegExp(`/product/stock/pattern/${notes.get("〔検索パターンID-M0401-018〕")}$`));
  });
});

/** 保存された検索パターンの在庫区分の条件（保存の中身）から、選んだ在庫区分の値を読む */
function zoneValues(saved: string | null): string[] {
  // 保存の中身のうち在庫区分の条件は「s:10:"stock_zone";a:1:{i:0;s:1:"1";}」の形。波かっこの中の文字列の値だけを読む
  const body = /s:10:"stock_zone";a:\d+:\{([^}]*)\}/.exec(saved ?? "")?.[1] ?? "";
  return [...body.matchAll(/s:\d+:"([^"]*)";/g)].map((m) => m[1]);
}

// 最大文字数255文字の検索パターン名で保存できる
caseTest("IT-M04-01-019", async ({ page, step, expected, db }) => {
  const name = "検".repeat(255);
  const p = await signIn(page);
  await step(1, () => p.open());
  let ecValue = "";
  await step(2, async () => {
    const box = p.stockZone("EC-CUBE");
    await box.check();
    ecValue = (await box.getAttribute("value")) ?? "";
  });
  await step(3, async () => {
    await showArea(p);
    await p.patternName.fill(name);
    expect(await p.patternName.inputValue(), "検索パターン名に255文字入った").toBe(name);
    await p.clickSave();
    const msg = await p.messages();
    note(`保存のあとの画面: ${p.page.url()}・成功「${msg.success.join(" / ") || "なし"}」・エラー「${msg.error.join(" / ") || "なし"}」`);
  });
  let rows: ReturnType<typeof 在庫一覧の検索パターン> = [];
  await step(4, async () => {
    void db.available; // 実行区分が「ブラウザ+DB確認」であること（違えば落ちる）
    rows = 在庫一覧の検索パターン(M0401_ALL.loginId, name);
    note(`DBの検索パターン（全店舗試験管理者の所属店舗・名前が「検」×255）: ${JSON.stringify(rows.map((r) => ({
      検索パターンID: r.検索パターンID, 名前の文字数: r.名前の文字数, 店舗ID: r.店舗ID, 在庫区分の値: zoneValues(r.保存の中身),
    })))}・在庫区分「EC-CUBE」のチェック欄の値 ${ecValue}`);
  });
  await expected(async () => {
    expect(rows, "名前が「検」×255の検索パターンが1件保存されている").toHaveLength(1);
    expect.soft(rows[0]?.名前の文字数, "検索パターン名は255文字").toBe("255");
    expect.soft(zoneValues(rows[0]?.保存の中身 ?? null), "保存された在庫区分の条件は EC-CUBE だけ").toEqual([ecValue]);
  });
});

// 256文字の検索パターン名（開発者ツールで1文字足す）は保存されない
caseTest("IT-M04-01-020", async ({ page, step, expected, db }) => {
  const name = "検".repeat(255);
  const p = await signIn(page);
  await step(1, () => p.open());
  await step(2, () => p.stockZone("EC-CUBE").check());
  await step(3, async () => {
    await showArea(p);
    await p.patternName.fill(name);
  });
  await step(4, async () => {
    // 開発者ツールで入力欄の値を書き換えるのと同じく、画面のスクリプトから値の末尾に「検」を足す（入力の制限を通さない）
    await p.patternName.evaluate((el) => {
      const input = el as HTMLInputElement;
      input.value = `${input.value}検`;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(await p.patternName.inputValue(), "検索パターン名の値は256文字").toHaveLength(256);
    note(`検索パターン名の入力欄の最大文字数の指定: ${(await p.patternName.getAttribute("maxlength")) ?? "なし"}`);
  });
  let sent: string | null = null;
  await step(5, async () => {
    const req = page.waitForRequest((r: Request) => r.method() === "POST" && /\/product\/stock\/save-pattern$/.test(r.url()));
    await p.clickSave();
    sent = new URLSearchParams((await req).postData() ?? "").get("admin_search_stock_list[pattern_name]");
    const msg = await p.messages();
    note(`保存のあとの画面: ${p.page.url()}・成功「${msg.success.join(" / ") || "なし"}」・エラー「${msg.error.join(" / ") || "なし"}」`);
  });
  let rows: ReturnType<typeof 同じ文字の繰り返しの名前の検索パターン> = [];
  await step(6, async () => {
    void db.available;
    rows = 同じ文字の繰り返しの名前の検索パターン("検", 256);
    note(`DBの検索パターン（名前が「検」×256。全店舗）: ${JSON.stringify(rows)}`);
  });
  await expected(async () => {
    // 256文字の値を実際に送ったうえで保存されないこと（送らずに0件を見て合格にしない）
    expect(sent?.length, "検索条件保存で送った検索パターン名は256文字").toBe(256);
    expect(rows, "名前が256文字の検索パターンは保存されていない").toEqual([]);
  });
});

// 検索パターンを選んでいないとき、検索条件削除ボタンは非活性
caseTest("IT-M04-01-021", async ({ page, step, expected }) => {
  const p = await signIn(page);
  await step(1, () => p.open());
  let chosen = 0;
  await step(2, async () => {
    await showArea(p);
    // 選んでいる検索パターンは、一覧にリンクでなく印つきの文字で出る
    chosen = await p.area.locator(".row.g-2 > .col-4 span .fa-check").count();
    note(`選んでいる検索パターンの数: ${chosen}`);
  });
  await expected(async () => {
    expect(chosen, "検索パターンを選んでいない").toBe(0);
    await expect(p.deleteButton, "検索条件削除ボタンが非活性").toBeDisabled();
  });
});

// 選んだ検索パターンを検索条件削除でDBから消す
caseTest("IT-M04-01-022", async ({ page, notes, step, expected, db }) => {
  const id = notes.get("〔検索パターンID-M0401-022〕");
  const p = await signIn(page);
  await step(1, () => p.open());
  await step(2, async () => {
    await showArea(p);
    const chosen = await p.choosePattern("削除対象条件-022");
    expect(chosen, "選んだ「削除対象条件-022」は控えた検索パターンID").toBe(id);
  });
  await step(3, async () => {
    const req = page.waitForRequest((r: Request) => r.method() === "POST" && r.url().endsWith(`/product/stock/delete-pattern/${id}`));
    await p.clickDelete();
    await req;
    const msg = await p.messages();
    note(`削除のあとの画面: ${p.page.url()}・成功「${msg.success.join(" / ") || "なし"}」・エラー「${msg.error.join(" / ") || "なし"}」`);
  });
  let rows: ReturnType<typeof 検索パターン> = [];
  let sameName: ReturnType<typeof 在庫一覧の検索パターン> = [];
  await step(4, async () => {
    void db.available;
    rows = 検索パターン(id);
    sameName = 在庫一覧の検索パターン(M0401_ALL.loginId, "削除対象条件-022");
    note(`DBの検索パターン（ID ${id}）: ${JSON.stringify(rows)}・名前「削除対象条件-022」（全店舗試験管理者の所属店舗）: ${JSON.stringify(sameName)}`);
  });
  await expected(async () => {
    expect.soft(rows, `検索パターンID ${id}（削除対象条件-022）はDBに無い`).toEqual([]);
    expect.soft(sameName, "名前「削除対象条件-022」の検索パターンはDBに無い").toEqual([]);
  });
});
