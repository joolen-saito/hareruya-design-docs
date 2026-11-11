/**
 * M16-01 バナー設定・画像のアップロード（トップバナー管理）。正本: cases/M16-01_test_cases.tsv
 *
 * 読み替えは seeds/m16-01.ts の冒頭に書いた（店舗A・店舗Bは印つきの試験店舗、名前を決めた画像を置く準備は画面からのアップロード）。
 * 実装しないケース:
 * - 共有トップバナー設定（ID 1〜11の固定枠。機能全体で1組）を書き換える・開始時の値にそろえる必要があるもの:
 *   001・006・007・008・010・017・018・019・020・021・022・023・033・043・047・048・050・051・052・053・054・055・056
 *   （「DBで確認」「DBで行をそろえる」も画面で作れない共有設定への書き込みになる）
 * - 保管先に大量の画像・名前を決めたファイルが要るもの: 003・004（2001件）、005（a-001.png 等の名前を決めたファイルを店舗フォルダへ置く）
 */
import { Page, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { BannerSettingPage } from "../../pages/admin/m16_01_banner_setting";
import { TopBannerPage, URLのパス, 準備のアップロード, 画像の種別, 画像の種別を見る } from "../../pages/admin/m16_02_top_banner";
import { M1601_ADMIN, M1601_NOEDIT, 入力ファイル, 店舗A } from "../../seeds/m16-01";
import { Account } from "../../lib/session";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 追加分 = (前: string[], 後: string[]) => 後.filter((u) => !前.includes(u));

async function 開く(page: Page, account: Account = M1601_ADMIN): Promise<TopBannerPage> {
  await loginAdmin(page, account);
  return new TopBannerPage(page);
}

async function 用意する(p: TopBannerPage, 呼び名: string): Promise<string> {
  const url = await 準備のアップロード(p, 店舗A.店名, 入力ファイル("m1602-valid.png"));
  note(`事前の準備: 正本の「${呼び名}」の代わりに、「${店舗A.店名}」へ画面から画像（有効なPNG）をアップロードし、増えた画像 ${url} を使う（ファイル名は画面が採番するので、正本の名前の画像は置けない）`);
  return url;
}

const 結果の注記 = (何を: string, r: { 送った: boolean; 応答: number | null; 成功: string[]; エラー: string[]; 行き先: string }) =>
  note(`${何を}: 要求を送った=${r.送った ? "はい" : "いいえ"}／応答=${r.応答 ?? "なし"}／成功の表示=${r.成功.join(" / ") || "なし"}／エラーの表示=${r.エラー.join(" / ") || "なし"}／移った先=${r.行き先}`);

async function 中身の種別(page: Page, url: string): Promise<画像の種別 | "読めない"> {
  const res = await page.context().request.get(url).catch(() => null);
  if (!res || !res.ok()) return "読めない";
  return 画像の種別を見る(await res.body());
}

const 確認の注記 = "「削除」を押すと確認ポップアップが出る。押す操作と OK は、次の手順の1回の操作で行った";

// ---- 002 店舗を指定して開く ----

caseTest("IT-M16-01-002", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 選択 = "";
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => { 選択 = await p.アップロード欄の店舗の値(); });
  await expected(async () => {
    expect.soft(選択, "画像アップロード欄の店舗選択").toBe(店舗A.店名);
  });
});

// ---- 027 520000バイトのアップロード ----

caseTest("IT-M16-01-027", async ({ page, step, expected }) => {
  const p = await 開く(page);
  await 用意する(p, "m1601c027-before.png");
  let 前: string[] = [];
  let 後: string[] = [];
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => { 前 = await p.画像のURL(); note(`店舗Aの画像件数: ${前.length}`); });
  await step(3, async () => {
    await p.アップロード欄の店舗を選ぶ(店舗A.店名);
    await p.ファイルを選ぶ(入力ファイル("m1602-520000.png"));
    結果の注記("アップロード", await p.アップロードを押す());
  });
  await step(4, async () => { await p.読み込みを待つ(); 後 = await p.画像のURL(); });
  await expected(async () => {
    const 追加 = 追加分(前, 後);
    expect.soft(追加.length, "店舗Aの画像一覧に追加された画像の数").toBe(1);
    expect.soft(追加.every((u) => /\.(png|gif|jpe?g)$/i.test(URLのパス(u))), "追加された画像のファイル名が拡張子付き").toBe(true);
  });
});

// ---- 032 GIF・JPEG・PNG ----

caseTest("IT-M16-01-032", async ({ page, step, expected }) => {
  const p = await 開く(page);
  await 用意する(p, "m1601c032-before.png");
  let 前: string[] = [];
  let 後: string[] = [];
  const 種別: string[] = [];
  const 送る = async (name: string) => {
    await p.アップロード欄の店舗を選ぶ(店舗A.店名);
    await p.ファイルを選ぶ(入力ファイル(name));
    結果の注記(`「${name}」のアップロード`, await p.アップロードを押す());
  };
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => { 前 = await p.画像のURL(); note(`店舗Aの画像件数: ${前.length}`); });
  await step(3, async () => { await 送る("m1602-valid.gif"); });
  await step(4, async () => { await 送る("m1602-valid.jpeg"); });
  await step(5, async () => { await 送る("m1602-valid.png"); });
  await step(6, async () => {
    後 = await p.画像のURL();
    for (const u of 追加分(前, 後)) 種別.push(await 中身の種別(page, u));
  });
  await expected(async () => {
    const 追加 = 追加分(前, 後);
    expect.soft(追加.length, "店舗Aの画像一覧に追加された画像の数").toBe(3);
    expect.soft(追加.every((u) => /\.(png|gif|jpe?g)$/i.test(URLのパス(u))), "追加された画像のファイル名が拡張子付き").toBe(true);
    expect.soft([...種別].sort().join("・"), "追加された画像の中身の種別（GIF・JPEG・PNG）").toBe("GIF・JPEG・PNG");
  });
});

// ---- 034 アップロードのあとの戻り ----

caseTest("IT-M16-01-034", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 画像設定画面 = false;
  let 絞り込み = "";
  let 印 = "";
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    await p.アップロード欄の店舗を選ぶ(店舗A.店名);
    await p.ファイルを選ぶ(入力ファイル("m1602-valid.gif"));
    結果の注記("アップロード", await p.アップロードを押す());
    画像設定画面 = await p.画像設定画面か();
    絞り込み = 画像設定画面 ? await p.絞り込みの値() : "（画像設定画面でない）";
    印 = p.位置の印();
  });
  await expected(async () => {
    expect.soft(画像設定画面, "戻った画面がトップバナー管理画面").toBe(true);
    expect.soft(絞り込み, "戻った画面で選択された店舗").toBe(店舗A.店名);
    expect.soft(印, "戻った画面のアドレスの位置の印（アップロード欄）").toBe("#upload_wrap");
  });
});

// ---- 035・036 店舗Aの編集権限がない管理者のアップロード ----

caseTest("IT-M16-01-035", async ({ page, step, expected }) => {
  const 準備 = await 開く(page, M1601_ADMIN);
  await 用意する(準備, "m1601c035-before.png");
  const p = await 開く(page, M1601_NOEDIT);
  let 前: string[] = [];
  let 後: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    await p.絞り込みを選ぶ(店舗A.店名);
    前 = await p.画像のURL();
    note(`店舗Aの画像件数: ${前.length}`);
  });
  await step(3, async () => {
    await p.アップロード欄の店舗を選ぶ(店舗A.店名);
    await p.ファイルを選ぶ(入力ファイル("m1602-valid.png"));
    結果の注記("アップロード", await p.アップロードを押す());
  });
  await step(4, async () => {
    await p.開く();
    await p.絞り込みを選ぶ(店舗A.店名);
    後 = await p.画像のURL();
    note(`アップロードのあとの店舗Aの画像件数: ${後.length}`);
  });
  await expected(async () => {
    expect.soft(後.length, "店舗Aの画像件数が増加しない（アップロード前の件数以下）").toBeLessThanOrEqual(前.length);
  });
});

caseTest("IT-M16-01-036", async ({ page, step, expected }) => {
  const p = await 開く(page, M1601_NOEDIT);
  let 画像設定画面 = false;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    await p.アップロード欄の店舗を選ぶ(店舗A.店名);
    await p.ファイルを選ぶ(入力ファイル("m1602-valid.png"));
    結果の注記("アップロード", await p.アップロードを押す());
    画像設定画面 = await p.画像設定画面か();
  });
  await expected(async () => {
    expect.soft(画像設定画面, "トップバナー管理画面に留まっている").toBe(true);
  });
});

// ---- 038・039 削除 ----

caseTest("IT-M16-01-038", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const del = await 用意する(p, "delete-target.png");
  let 一覧: string[] = [];
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => { await expect(p.削除リンク(p.行(del)), "削除する画像の「削除」").toBeVisible(); note(確認の注記); });
  await step(3, async () => { await p.削除してOKを押す(p.行(del)); });
  await step(4, async () => { 一覧 = await p.画像のURL(); });
  await expected(async () => {
    expect.soft(一覧, "削除した画像が店舗Aの画像一覧に残っていない").not.toContain(del);
  });
});

caseTest("IT-M16-01-039", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const del = await 用意する(p, "delete-target.png-039");
  let 画像設定画面 = false;
  let 印 = "";
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => { await expect(p.削除リンク(p.行(del)), "削除する画像の「削除」").toBeVisible(); note(確認の注記); });
  await step(3, async () => {
    await p.削除してOKを押す(p.行(del));
    画像設定画面 = await p.画像設定画面か();
    印 = p.位置の印();
  });
  await expected(async () => {
    expect.soft(画像設定画面, "戻った画面がトップバナー管理画面").toBe(true);
    expect.soft(印, "戻った画面のアドレスの位置の印（アップロード欄）").toBe("#upload_wrap");
  });
});

// ---- 040・041・044 削除リンクの対象を書き換える ----

const 対象名 = (略称: string, 名: string) => `banner/top/${略称}/${名}`;

caseTest("IT-M16-01-040", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const del = await 用意する(p, "delete-target.png-040");
  const keep = await 用意する(p, "m1601c040-keep.png");
  let 記録: string[] = [];
  let 後: string[] = [];
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); 記録 = await p.画像のURL(); note(`記録した一覧の件数: ${記録.length}`); });
  await step(2, async () => {
    const 前 = await p.削除の対象を変える(p.行(del), 対象名(店舗A.略称, "missing.png-040"));
    note(`削除リンクのアドレスの対象ファイル名を「${対象名(店舗A.略称, "missing.png-040")}」に変えた（開発者ツールで書き換えるのにあたる）。変える前のアドレス: ${前}`);
  });
  await step(3, async () => {
    const r = await p.削除を実行する(p.行(del));
    note(`削除の要求への応答のHTTPステータス: ${r.応答 ?? "なし"}／確認ポップアップ: ${r.ダイアログ ?? "出なかった"}`);
  });
  await step(4, async () => { note("確認ポップアップの OK は、手順3の1回の操作で押した"); });
  await step(5, async () => {
    if (await p.アップロードボタン.isVisible().catch(() => false)) { await p.読み込みを待つ(); 後 = await p.画像のURL(); }
  });
  await expected(async () => {
    expect.soft(後, "店舗Aの画像一覧に、記録した一覧の画像がすべて残っている").toEqual(expect.arrayContaining(記録));
    expect.soft(後, "削除しようとした画像が残っている").toContain(del);
    expect.soft(後, "もう一方の画像が残っている").toContain(keep);
    expect.soft(後.length, "店舗Aの画像一覧の件数が記録した一覧と一致").toBe(記録.length);
  });
});

function 書き換えて削除(名: string, 呼び名: string, 対象: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    const p = await 開く(page);
    const del = await 用意する(p, 呼び名);
    let 画像設定画面 = false;
    let 印 = "";
    await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
    await step(2, async () => {
      const 前 = await p.削除の対象を変える(p.行(del), 対象);
      note(`削除リンクのアドレスの対象ファイル名を「${対象}」に変えた（開発者ツールで書き換えるのにあたる）。変える前のアドレス: ${前}`);
    });
    await step(3, async () => {
      const r = await p.削除を実行する(p.行(del));
      note(`削除の要求への応答のHTTPステータス: ${r.応答 ?? "なし"}／確認ポップアップ: ${r.ダイアログ ?? "出なかった"}（変えたリンクを押す操作と OK は1回の操作で行った）`);
    });
    await step(4, async () => {
      if (await p.アップロードボタン.isVisible().catch(() => false)) await p.読み込みを待つ();
      画像設定画面 = await p.画像設定画面か();
      印 = p.位置の印();
    });
    await expected(async () => {
      expect.soft(画像設定画面, `戻った画面がトップバナー管理画面（${名}）`).toBe(true);
      if (名 === "041") expect.soft(印, "戻った画面のアドレスの位置の印（アップロード欄）").toBe("#upload_wrap");
    });
  };
}
// 正本の手順の「変えたリンクを押す」と「確認ダイアログの OK」は、確認ポップアップが押した直後に出るため 1 回の操作で行う（手順4は押したあとの画面の読み）
caseTest("IT-M16-01-041", 書き換えて削除("041", "delete-target.png-041", 対象名(店舗A.略称, "missing.png-041")));
caseTest("IT-M16-01-044", 書き換えて削除("044", "delete-target.png-044", "other/outside.png"));

// ---- 042 削除のなりすまし対策トークン不正 ----

caseTest("IT-M16-01-042", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const del = await 用意する(p, "delete-target.png-042");
  let 応答: number | null = null;
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => {
    await p.削除のトークンを変える(p.行(del), "invalid-token");
    note("削除リンクのなりすまし対策トークンを「invalid-token」に変えた（開発者ツールで書き換えるのにあたる）");
  });
  await step(3, async () => { 応答 = (await p.削除を実行する(p.行(del))).応答; note(`削除の要求への応答のHTTPステータス: ${応答 ?? "なし"}`); });
  await expected(async () => {
    expect(応答, "削除の要求への応答のHTTPステータス（ブラウザに403の応答）").toBe(403);
  });
});

// ---- 049 言語の選択肢 ----

caseTest("IT-M16-01-049", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const s = new BannerSettingPage(page);
  let 一: string[] = [];
  let 二: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    note("共有トップバナー設定は書き換えず、いまの設定のID 1の行を読んだ（言語の選択肢は設定の値によらない）");
    一 = await s.言語の選択肢(1);
  });
  await step(3, async () => { 二 = await s.言語の選択肢(2); });
  await expected(async () => {
    expect.soft(一, "ID 1の言語の選択肢").toEqual(["日本語", "英語"]);
    expect.soft(二, "ID 2の言語の選択肢").toEqual(["日本語", "英語"]);
  });
});
