/**
 * M05-27 店頭注文番号札管理。正本: cases/M05-27_test_cases.tsv
 * 実装したのは 001・003〜007・009・015〜021・025〜029。002 は実装しない（店舗ID=1のTC東京＝共有の店舗の番号札を全件退避する準備で、
 * 共有のデータに触れるため）。ハイフン・数字つきの番号札は、画面で英字だけの値で登録してから、シードが DB で書き換えて作る（seeds/m05-27.ts）。
 */
import { Browser, Page, test } from "@playwright/test";
import { 店頭注文番号札の一覧, 店頭注文番号札の件数 } from "../../db/m05_27";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin, withAdminSession } from "../../lib/session";
import { WaitingTagPage } from "../../pages/admin/m05_27_waiting_tag";
import { M0527_LIMIT, 権限外, 支店, 本店, 編集可能店舗を設定する } from "../../seeds/m05-27";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M05-27-015", async ({ page, browser, notes, step, expected }) => {
  const A = 本店, B = 支店;
  // 事前準備②: 既定の検索店舗を試験本店、編集可能店舗を試験本店と試験支店に設定して、その管理者でログインする
  await 編集可能店舗を設定する(browser, A, [A, B]);
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0527_LIMIT);
  const w = new WaitingTagPage(page);
  const 店舗B = notes.get("〔店舗ID-M0527-015B〕");
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.検索店舗を選ぶ(B); });
  await step(3, async () => {
    const r = await w.登録する("DUPLICATE");
    if (!r.成功の表示) note(`登録の結果に成功の表示が無い。エラー: ${r.エラーの表示.join(" / ") || "なし"}`);
  });
  let 件数 = -1;
  await step(4, async () => { 件数 = 店頭注文番号札の件数(店舗B, "DUPLICATE"); });
  await expected(async () => {
    expect.soft(件数, "試験支店に同じ値「DUPLICATE」が登録されている件数").toBe(2);
  });
});

caseTest("IT-M05-27-025", async ({ page, browser, notes, step, expected, capture }) => {
  const A = 本店;
  await 編集可能店舗を設定する(browser, A, [A]); // 事前準備②: 既定の検索店舗と編集可能店舗を試験本店だけにして、権限外店舗を外す
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0527_LIMIT);
  const w = new WaitingTagPage(page);
  const 店舗C = notes.get("〔店舗ID-M0527-025B〕");
  let 一覧: string[] = [];
  await step(1, async () => {
    await w.open();
    expect.soft(await w.検索店舗の店名(), "検索店舗が試験本店").toBe(A);
    expect.soft(await w.登録ボタン.count(), "登録ボタンが表示されている（件数）").toBeGreaterThan(0);
  });
  await step(2, async () => { await w.検索店舗の選択値を書き換える(店舗C); await capture("検索店舗の選択値を権限外店舗の店舗IDに書き換えた画面"); });
  await step(3, async () => {
    const r = await w.登録する("DENYREG");
    note(`登録を押したあとの表示: 成功=${r.成功の表示}／エラー=${r.エラーの表示.join(" / ") || "なし"}`);
  });
  await step(4, async () => { 一覧 = 店頭注文番号札の一覧(店舗C); });
  await expected(async () => {
    expect.soft(一覧, "権限外店舗の店頭注文番号札が「CHARLIEZ」の1件のまま（「DENYREG」が追加されない）").toEqual(["CHARLIEZ"]);
  });
});

caseTest("IT-M05-27-026", async ({ page, browser, notes, step, expected, capture }) => {
  const A = 本店, C = 権限外;
  await 編集可能店舗を設定する(browser, A, [A]); // 事前準備②
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0527_LIMIT);
  const w = new WaitingTagPage(page);
  const 店舗C = notes.get("〔店舗ID-M0527-026B〕");
  let 一覧: string[] = [];
  await step(1, async () => { await w.open(); });
  await step(2, async () => {
    await w.検索店舗を選ぶ(C);
    expect.soft(await w.一覧の番号札(), "再検索された一覧に「CHARLIEZ」が表示されている").toContain("CHARLIEZ");
    await capture("権限外店舗で再検索した一覧");
  });
  await step(3, async () => {
    if ((await w.登録ボタン.count()) === 0) {
      note("権限外店舗を選ぶと登録ボタンが表示されない。入力欄で Enter を押してフォームを送信した（ボタンは押せない）");
      await page.locator("#waiting_tag_waiting_tag").fill("DENYREG");
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => null), page.locator("#waiting_tag_waiting_tag").press("Enter")]);
      await page.waitForLoadState("load");
    } else {
      await w.登録する("DENYREG");
    }
  });
  await step(4, async () => { 一覧 = 店頭注文番号札の一覧(店舗C); });
  await expected(async () => {
    expect.soft(一覧, "権限外店舗の店頭注文番号札が「CHARLIEZ」の1件のまま（「DENYREG」が追加されない）").toEqual(["CHARLIEZ"]);
  });
});

/** 事前準備の「開始時に管理者のデフォルト検索表示店舗・編集可能店舗を設定し、同管理者でログインする」 */
async function 開始する(page: Page, browser: Browser, 既定: string, 編集可能: string[]): Promise<WaitingTagPage> {
  await 編集可能店舗を設定する(browser, 既定, 編集可能);
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0527_LIMIT);
  return new WaitingTagPage(page);
}
const 並べ替え = (a: string[]) => [...a].sort();
const 十一件 = (n: string) => "ABCDEFGHIJK".split("").map((c) => `TAG${c}-${n}`);

caseTest("IT-M05-27-001", async ({ page, browser, step, expected }) => {
  const A = 本店;
  const w = await 開始する(page, browser, A, [A]);
  let 店名 = "", 一覧: string[] = [];
  await step(1, async () => { await w.open(); 店名 = await w.検索店舗の店名(); 一覧 = await w.一覧の番号札(); });
  await expected(async () => {
    expect.soft(店名, "検索店舗がデフォルト検索表示店舗").toBe(A);
    expect.soft(並べ替え(一覧), "一覧は試験本店の3件だけ").toEqual(["ALPHA-001", "DELETE", "STALE-001"]);
  });
});

caseTest("IT-M05-27-003", async ({ page, browser, step, expected }) => {
  const A = 本店, B = 支店;
  const w = await 開始する(page, browser, A, [A, B]);
  let 店名 = "", 一覧: string[] = [];
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.検索店舗を選ぶ(B); 店名 = await w.検索店舗の店名(); 一覧 = await w.一覧の番号札(); });
  await expected(async () => {
    expect.soft(店名, "検索店舗の変更と同時に検索された（試験支店が選択された状態で再表示）").toBe(B);
    expect.soft(一覧, "一覧は試験支店の「BRAVO-003」だけ").toEqual(["BRAVO-003"]);
  });
});

caseTest("IT-M05-27-004", async ({ page, browser, step, expected, capture }) => {
  const A = 本店, B = 支店;
  const w = await 開始する(page, browser, A, [A, B]);
  note("フロント表示用英字名は、画面の入力規則（半角英数字と空白だけ）のため、正本の m0527-b-004 ではなく、試験用の支店の固定の値（m0527p2）にした。店舗はシード表の店名ごとに作らず、M05-27専用の試験用店舗（本店・支店・権限外店舗）を使い回す");
  let front: Page | null = null;
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.検索店舗を選ぶ(B); });
  await step(3, async () => { front = await w.確認を押す(); await capture("別タブのフロント側の店頭注文番号札一覧"); });
  await expected(async () => {
    expect.soft(front, "別タブが開いた").not.toBeNull();
    await expect.poll(async () => (await front!.locator("body").innerText()).includes("BRAVO-004"), { timeout: 30_000, message: "フロント側の一覧に「BRAVO-004」が含まれる" }).toBe(true);
  });
});

caseTest("IT-M05-27-005", async ({ page, browser, step, expected }) => {
  const A = 本店, C = 権限外;
  const w = await 開始する(page, browser, A, [A]); // 事前準備②: 編集可能店舗を試験本店だけにして、権限外店舗を外す
  let 編集可 = -1, 編集不可 = -1, 不可の一覧: string[] = [];
  await step(1, async () => { await w.open(); 編集可 = await w.削除ボタン("ALPHA-005").count(); });
  await step(2, async () => { await w.検索店舗を選ぶ(C); 不可の一覧 = await w.一覧の番号札(); 編集不可 = await w.削除ボタン("CHARLIE").count(); });
  await expected(async () => {
    expect.soft(編集可, "編集権限のある試験本店の「ALPHA-005」の削除ボタンの数").toBe(1);
    expect.soft(不可の一覧, "権限外店舗の一覧に「CHARLIE」の行がある").toContain("CHARLIE");
    expect.soft(編集不可, "編集権限の無い試験権限外店舗の「CHARLIE」の削除ボタンの数").toBe(0);
  });
});

caseTest("IT-M05-27-006", async ({ page, browser, notes, step, expected }) => {
  const A = 本店, B = 支店;
  const w = await 開始する(page, browser, A, [A, B]);
  const 店舗B = notes.get("〔店舗ID-M0527-006B〕");
  let 前: string[] = [], 後: string[] = [];
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.検索店舗を選ぶ(B); });
  await step(3, async () => {
    前 = 店頭注文番号札の一覧(店舗B); // 登録の直前の状態（NEWTAG は新しい店舗なので0件）
    const r = await w.登録する("NEWTAG");
    if (!r.成功の表示) note(`登録の結果に成功の表示が無い。エラー: ${r.エラーの表示.join(" / ") || "なし"}`);
  });
  await step(4, async () => { 後 = 店頭注文番号札の一覧(店舗B); });
  await expected(async () => {
    expect.soft(前.filter((t) => t === "NEWTAG").length, "登録の前の「NEWTAG」の件数").toBe(0);
    expect.soft(後.filter((t) => t === "NEWTAG").length, "試験支店に「NEWTAG」のレコードが1件追加された").toBe(1);
    expect.soft(後.length, "試験支店の番号札の件数が1件増えた").toBe(前.length + 1);
  });
});

caseTest("IT-M05-27-007", async ({ page, browser, step, expected }) => {
  const A = 本店, B = 支店;
  const w = await 開始する(page, browser, A, [A, B]);
  let 画面か = false, 成功 = false;
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.検索店舗を選ぶ(B); });
  await step(3, async () => {
    const r = await w.登録する("MOVE");
    成功 = r.成功の表示;
    画面か = w.一覧の画面か();
  });
  await expected(async () => {
    expect.soft(画面か, "登録後に店頭注文番号札管理画面（一覧のアドレス）へ遷移した").toBe(true);
    expect.soft(成功, "登録の成功の表示").toBe(true);
  });
});

caseTest("IT-M05-27-009", async ({ page, browser, notes, step, expected }) => {
  const A = 本店, B = 支店;
  const w = await 開始する(page, browser, A, [A, B]);
  const 店舗B = notes.get("〔店舗ID-M0527-009B〕");
  let 件数 = -1, 全件: string[] = [];
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.検索店舗を選ぶ(B); });
  await step(3, async () => {
    const r = await w.登録する("ABCDEFGHIJ");
    if (!r.成功の表示) note(`登録の結果に成功の表示が無い。エラー: ${r.エラーの表示.join(" / ") || "なし"}`);
  });
  await step(4, async () => { 全件 = 店頭注文番号札の一覧(店舗B); 件数 = 店頭注文番号札の件数(店舗B, "ABCDEFGHIJ"); });
  await expected(async () => {
    expect.soft(件数, "最大文字数10文字の「ABCDEFGHIJ」が試験支店の番号札として1件追加された").toBe(1);
    expect.soft(全件.length, "試験支店の番号札は元の1件と合わせて2件").toBe(2);
  });
});

caseTest("IT-M05-27-016", async ({ page, browser, step, expected }) => {
  const A = 本店;
  const w = await 開始する(page, browser, A, [A]);
  let 一覧: string[] = [], ページ分割 = -1;
  await step(1, async () => { await w.open(); 一覧 = await w.一覧の番号札(); ページ分割 = await page.locator(".pagination, [class*='pager']").count(); });
  await expected(async () => {
    expect.soft(並べ替え(一覧), "11件がすべて1画面に表示されている").toEqual(並べ替え(十一件("016")));
    expect.soft(ページ分割, "ページ分割の表示（ページ送り）が無い").toBe(0);
  });
});

caseTest("IT-M05-27-017", async ({ page, browser, step, expected }) => {
  const A = 本店;
  const w = await 開始する(page, browser, A, [A]);
  let 項目 = -1, 一覧: string[] = [];
  await step(1, async () => { await w.open(); });
  await step(2, async () => { 項目 = await w.並び順の項目の数(); 一覧 = await w.一覧の番号札(); });
  await expected(async () => {
    expect.soft(一覧.length, "一覧に11件が表示されている（確かめの前提）").toBe(11);
    expect.soft(項目, "一覧に並び順を選ぶ項目（選択欄・並び順の文字）が表示されない").toBe(0);
  });
});

caseTest("IT-M05-27-018", async ({ page, browser, step, expected }) => {
  const A = 本店;
  const w = await 開始する(page, browser, A, [A]);
  let 閉じた = false, 画面か = false, 一覧: string[] = [];
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.削除確認を開く("DELETE-018"); });
  await step(3, async () => {
    await w.削除確認でキャンセルする();
    閉じた = !(await w.削除確認.isVisible());
    画面か = w.一覧の画面か();
    一覧 = await w.一覧の番号札();
  });
  await expected(async () => {
    expect.soft(閉じた, "削除確認が閉じた").toBe(true);
    expect.soft(画面か, "店頭注文番号札管理画面に留まっている").toBe(true);
    expect.soft(一覧, "番号札は削除されず一覧に残っている").toEqual(["DELETE-018"]);
  });
});

caseTest("IT-M05-27-019", async ({ page, browser, notes, step, expected }) => {
  const A = 本店;
  const w = await 開始する(page, browser, A, [A]);
  const 店舗 = notes.get("〔店舗ID-M0527-019〕");
  let 件数 = -1;
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.削除確認を開く("DELETE-019"); });
  await step(3, async () => { await w.削除確認で削除する(); });
  await step(4, async () => { 件数 = 店頭注文番号札の件数(店舗, "DELETE-019"); });
  await expected(async () => {
    expect.soft(件数, "試験本店の「DELETE-019」が0件になった").toBe(0);
  });
});

caseTest("IT-M05-27-020", async ({ page, browser, step, expected }) => {
  const A = 本店;
  const w = await 開始する(page, browser, A, [A]);
  let 閉じた = false, 画面か = false;
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.削除確認を開く("DELETE-020"); });
  await step(3, async () => { await w.削除確認で削除する(); 閉じた = !(await w.削除確認.isVisible()); 画面か = w.一覧の画面か(); });
  await expected(async () => {
    expect.soft(閉じた, "削除確認が閉じた").toBe(true);
    expect.soft(画面か, "店頭注文番号札管理画面へ遷移した").toBe(true);
  });
});

caseTest("IT-M05-27-021", async ({ page, browser, step, expected, capture }) => {
  const A = 本店;
  const w = await 開始する(page, browser, A, [A]); // ブラウザA（この page）。ブラウザBは手順2で独立したセッションを作る
  let メッセージ: string[] = [], 一覧: string[] = [];
  await step(1, async () => { await w.open(); await w.削除確認を開く("STALE-021"); });
  await step(2, async () => {
    await withAdminSession(browser, M0527_LIMIT, async (pageB) => {
      const b = new WaitingTagPage(pageB);
      await b.open();
      await b.削除確認を開く("STALE-021");
      await b.削除確認で削除する();
      expect(await b.一覧の番号札(), "ブラウザBで「STALE-021」が削除された").not.toContain("STALE-021");
    });
  });
  await step(3, async () => {
    await w.削除確認で削除する();
    メッセージ = await w.メッセージ();
    一覧 = await w.一覧の番号札();
    await capture("ブラウザAで削除を押した後の画面");
  });
  await expected(async () => {
    expect.soft(メッセージ.join(" / "), "ブラウザAに削除対象が見つからない（既に削除されている）旨のメッセージが表示された").toContain("既に削除されています");
    expect.soft(一覧, "ブラウザAの一覧にも「STALE-021」は無い").not.toContain("STALE-021");
  });
});

caseTest("IT-M05-27-027", async ({ page, browser, step, expected }) => {
  const A = 本店, B = 支店;
  const w = await 開始する(page, browser, A, [A, B]);
  let 店名 = "", 一覧: string[] = [];
  await step(1, async () => { await w.open(); });
  await step(2, async () => { 店名 = await w.検索店舗の店名(); 一覧 = await w.一覧の番号札(); });
  await expected(async () => {
    expect.soft(店名, "検索店舗が試験本店").toBe(A);
    expect.soft(並べ替え(一覧), "一覧は「TAG-M0527-027-A1」「TAG-M0527-027-A2」の2件だけ（支店の「TAG-M0527-027-B1」は無い）").toEqual(["TAG-M0527-027-A1", "TAG-M0527-027-A2"]);
  });
});

caseTest("IT-M05-27-028", async ({ page, browser, step, expected }) => {
  const A = 本店, B = 支店;
  const w = await 開始する(page, browser, A, [A, B]);
  let 店名 = "", 一覧: string[] = [];
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.検索店舗を選ぶ(B); 店名 = await w.検索店舗の店名(); 一覧 = await w.一覧の番号札(); });
  await expected(async () => {
    expect.soft(店名, "検索店舗が試験支店").toBe(B);
    expect.soft(並べ替え(一覧), "一覧は試験支店の「TAG-M0527-028-B1」の1件だけ（本店の2件は無い）").toEqual(["TAG-M0527-028-B1"]);
  });
});

caseTest("IT-M05-27-029", async ({ page, browser, notes, step, expected }) => {
  const A = 本店;
  const w = await 開始する(page, browser, A, [A]);
  const 店舗 = notes.get("〔店舗ID-M0527-029〕");
  let 一覧: string[] = [], DB: string[] = [];
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.削除確認を開く("TAG-M0527-029-A2"); });
  await step(3, async () => { await w.削除確認で削除する(); });
  await step(4, async () => { 一覧 = await w.一覧の番号札(); });
  await step(5, async () => { DB = 店頭注文番号札の一覧(店舗); });
  await expected(async () => {
    expect.soft(並べ替え(一覧), "画面の一覧が「TAG-M0527-029-A1」「TAG-M0527-029-A3」の2件").toEqual(["TAG-M0527-029-A1", "TAG-M0527-029-A3"]);
    expect.soft(並べ替え(DB), "DBの番号札が同じ2件（「TAG-M0527-029-A2」は含まれない）").toEqual(["TAG-M0527-029-A1", "TAG-M0527-029-A3"]);
  });
});
