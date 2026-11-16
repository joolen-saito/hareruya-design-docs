/**
 * M16-01 バナー設定・画像のアップロード（トップバナー管理）。正本: cases/M16-01_test_cases.tsv
 *
 * 読み替えは seeds/m16-01.ts の冒頭に書いた（店舗A・店舗Bは印つきの試験店舗、名前を決めた画像を置く準備は画面からのアップロード、
 * 共有トップバナー設定は準備のシードが全行を控えてから書き換え、ケースの終わりに基盤が画面で戻して確かめる）。
 * 共有トップバナー設定を書き換えるケースは、夜に1本だけで流す回でだけ流す（config/solo_cases.tsv）。
 * 実装しないケース:
 * - 保管先に大量の画像が要るもの: 003・004（バナー用フォルダ直下に2001件。画面に店舗を選ばないアップロードが無く、直下を空にすることもできない）
 */
import fs from "node:fs";
import { Page, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { トップバナーを読む } from "../../db/m16_01_top_banner";
import { BannerSettingPage, バナー入力 } from "../../pages/admin/m16_01_banner_setting";
import { TopBannerPage, URLのパス, 準備のアップロード, 画像の種別, 画像の種別を見る } from "../../pages/admin/m16_02_top_banner";
import { TopSlidePage, サイト } from "../../pages/front/m16_01_top_slide";
import { M1601_ADMIN, M1601L_ADMIN, M1601_NOEDIT, 入力ファイル, 二行の値, 店舗A, 準備した画像 } from "../../seeds/m16-01";
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

type 結果 = Awaited<ReturnType<TopBannerPage["アップロードを押す"]>>;

/** 追加された画像のうち、中身が選んだファイルとバイト単位で同じもの（同じ試験店舗へほかのケースが並べて上げた画像と見分ける） */
async function 同じ中身の画像(page: Page, urls: string[], file: string): Promise<string[]> {
  const want = fs.readFileSync(file);
  const out: string[] = [];
  for (const u of urls) {
    const res = await page.context().request.get(u).catch(() => null);
    if (res && res.ok() && Buffer.from(await res.body()).equals(want)) out.push(u);
  }
  return out;
}

/** アップロードが通ったこと（転送の応答 303 と「アップロードしました」） */
function 通ったことを確かめる(r: 結果 | undefined, 何を: string): void {
  expect.soft(r?.送った, `${何を}: 要求を送った`).toBe(true);
  expect.soft(r?.応答, `${何を}: アップロードが受け付けられて転送される（応答 303）`).toBe(303);
  expect.soft((r?.成功 ?? []).join(" "), `${何を}: 「アップロードしました」の表示`).toContain("アップロードしました");
}

/** アップロードがはじかれたこと（送ったが、転送されずに出し直され、「アップロードしました」が出ない） */
function はじかれたことを確かめる(r: 結果 | undefined, 何を: string): void {
  expect.soft(r?.送った, `${何を}: 要求を送った`).toBe(true);
  expect.soft(r?.応答, `${何を}: 転送されずに画面が出し直される（応答 303 でない）`).not.toBe(303);
  expect.soft(r?.成功 ?? [], `${何を}: 「アップロードしました」が出ない`).toEqual([]);
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
  let r: 結果 | undefined;
  let 自分の: string[] = [];
  await step(3, async () => {
    await p.アップロード欄の店舗を選ぶ(店舗A.店名);
    await p.ファイルを選ぶ(入力ファイル("m1602-520000.png"));
    r = await p.アップロードを押す();
    結果の注記("アップロード", r);
  });
  await step(4, async () => {
    await p.読み込みを待つ(); 後 = await p.画像のURL();
    自分の = await 同じ中身の画像(page, 追加分(前, 後), 入力ファイル("m1602-520000.png"));
    note(`追加された画像 ${追加分(前, 後).length}件のうち、中身が 520000 バイトの limit.png と同じもの: ${自分の.join("、") || "なし"}（同じ試験店舗へほかのケースが上げた画像と見分けるため、中身で数えた）`);
  });
  await expected(async () => {
    通ったことを確かめる(r, "520000バイトの画像のアップロード");
    expect.soft(fs.statSync(入力ファイル("m1602-520000.png")).size, "選んだファイルの大きさ（520000バイト）").toBe(520000);
    expect.soft(自分の.length, "店舗Aの画像一覧に追加された、選んだ 520000 バイトの画像の数").toBe(1);
    expect.soft(自分の.every((u) => /\.(png|gif|jpe?g)$/i.test(URLのパス(u))), "追加された画像のファイル名が拡張子付き").toBe(true);
  });
});

// ---- 032 GIF・JPEG・PNG ----

caseTest("IT-M16-01-032", async ({ page, step, expected }) => {
  const p = await 開く(page);
  await 用意する(p, "m1601c032-before.png");
  let 前: string[] = [];
  let 後: string[] = [];
  const 種別: string[] = [];
  const 結果たち: { name: string; r: 結果 }[] = [];
  const 送る = async (name: string) => {
    await p.アップロード欄の店舗を選ぶ(店舗A.店名);
    await p.ファイルを選ぶ(入力ファイル(name));
    const r = await p.アップロードを押す();
    結果たち.push({ name, r });
    結果の注記(`「${name}」のアップロード`, r);
  };
  const 自分の: { name: string; urls: string[] }[] = [];
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => { 前 = await p.画像のURL(); note(`店舗Aの画像件数: ${前.length}`); });
  await step(3, async () => { await 送る("m1602-valid.gif"); });
  await step(4, async () => { await 送る("m1602-valid.jpeg"); });
  await step(5, async () => { await 送る("m1602-valid.png"); });
  await step(6, async () => {
    後 = await p.画像のURL();
    for (const name of ["m1602-valid.gif", "m1602-valid.jpeg", "m1602-valid.png"]) 自分の.push({ name, urls: await 同じ中身の画像(page, 追加分(前, 後), 入力ファイル(name)) });
    for (const u of 自分の.flatMap((x) => x.urls)) 種別.push(await 中身の種別(page, u));
    note(`追加された画像のうち、中身が選んだファイルと同じもの: ${自分の.map((x) => `${x.name}→${x.urls.join("、") || "なし"}`).join("／")}（同じ試験店舗へほかのケースが上げた画像と見分けるため、中身で数えた）`);
  });
  await expected(async () => {
    for (const { name, r } of 結果たち) 通ったことを確かめる(r, `「${name}」のアップロード`);
    const 拡張子 = { "m1602-valid.gif": /\.gif$/i, "m1602-valid.jpeg": /\.jpe?g$/i, "m1602-valid.png": /\.png$/i } as Record<string, RegExp>;
    for (const { name, urls } of 自分の) {
      expect.soft(urls.length, `店舗Aの画像一覧に追加された「${name}」と同じ中身の画像の数`).toBe(1);
      expect.soft(urls.every((u) => 拡張子[name].test(URLのパス(u))), `「${name}」の画像のファイル名が、中身の種別に合う拡張子付き`).toBe(true);
    }
    expect.soft(自分の.reduce((a, x) => a + x.urls.length, 0), "店舗Aの画像一覧に追加された、選んだ3ファイルの画像の数（合計3件）").toBe(3);
    expect.soft([...種別].sort().join("・"), "追加された（選んだ3ファイルの）画像の中身の種別（GIF・JPEG・PNG）").toBe("GIF・JPEG・PNG");
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
  let r: 結果 | undefined;
  let 自分の: string[] = [];
  await step(3, async () => {
    await p.アップロード欄の店舗を選ぶ(店舗A.店名);
    await p.ファイルを選ぶ(入力ファイル("m1602-valid.png"));
    r = await p.アップロードを押す();
    結果の注記("アップロード", r);
  });
  await step(4, async () => {
    await p.開く();
    await p.絞り込みを選ぶ(店舗A.店名);
    後 = await p.画像のURL();
    自分の = await 同じ中身の画像(page, 追加分(前, 後), 入力ファイル("m1602-valid.png"));
    note(`アップロードのあとの店舗Aの画像件数: ${後.length}（増えた画像 ${追加分(前, 後).length}件。うち選んだ valid.png と同じ中身: ${自分の.length}件。同じ試験店舗へはほかのケースも同じ画像を上げるので、増えた分は注記に残し、はじかれたことは画面の応答でも確かめた）`);
  });
  await expected(async () => {
    // 件数の比較だけでは、同じ時間にほかのケースが同じ試験店舗の画像を消すと増加が打ち消される。アップロードがはじかれたことも確かめる
    はじかれたことを確かめる(r, "編集権限の無い店舗Aへのアップロード");
    expect.soft(追加分(前, 後), "店舗Aの画像一覧に増えた画像（増加しない）").toEqual([]);
  });
});

caseTest("IT-M16-01-036", async ({ page, step, expected }) => {
  const p = await 開く(page, M1601_NOEDIT);
  let 画像設定画面 = false;
  let r: 結果 | undefined;
  let 印 = "";
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    await p.アップロード欄の店舗を選ぶ(店舗A.店名);
    await p.ファイルを選ぶ(入力ファイル("m1602-valid.png"));
    r = await p.アップロードを押す();
    結果の注記("アップロード", r);
    画像設定画面 = await p.画像設定画面か();
    印 = p.位置の印();
  });
  await expected(async () => {
    // アップロードが通っても同じトップバナー管理画面（店舗の絞り込み・#upload_wrap）へ移るため、はじかれて出し直されたことも確かめる
    はじかれたことを確かめる(r, "編集権限の無い店舗Aへのアップロード");
    expect.soft(印, "アップロード完了の移り先（#upload_wrap）へ移っていない").not.toBe("#upload_wrap");
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

function 書き換えて削除(名: string, 呼び名: string, 対象の値: string | (() => string)) {
  return async ({ page, step, expected }: CaseCtx) => {
    const 対象 = typeof 対象の値 === "function" ? 対象の値() : 対象の値;
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
caseTest("IT-M16-01-041", 書き換えて削除("041", "delete-target.png-041", () => 対象名(店舗A.略称, "missing.png-041")));
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

// ==== 共有トップバナー設定を使うケース（準備のシードが全行を控えて書き換え、ケースの終わりに基盤が戻す） ====

const 戻しの注記 = "共有トップバナー設定は、準備のシードが書き換える直前に画面から全行を控えた。ケースの終わりに、基盤が画面で控えた値へ戻して確かめる";
const 設定の注記 = (r: { 送った: boolean; 応答: number | null; 成功: string[]; エラー: string[]; 行き先: string }) => 結果の注記("バナー設定", r);

async function バナー設定を開く(page: Page, account: Account = M1601_ADMIN): Promise<BannerSettingPage> {
  await loginAdmin(page, account);
  note(戻しの注記);
  return new BannerSettingPage(page);
}
const 表示 = (page: Page) => new TopSlidePage(page);
async function スライドの画像URL(page: Page, サイト: サイト): Promise<string[]> {
  const t = 表示(page);
  await t.開く(サイト);
  return (await t.スライドを読む()).map((x) => x.画像URL);
}
async function スライドのalt(page: Page, サイト: サイト): Promise<string[]> {
  const t = 表示(page);
  await t.開く(サイト);
  return (await t.スライドを読む()).map((x) => x.画像alt属性);
}
const 期待の行 = (v: バナー入力) => ({ 画像URL: v.画像URL ?? "", リンク先URL: v.リンク先URL ?? "", 言語: v.言語 ?? [], 表示タイプ: v.表示タイプ ?? "", 画像alt属性: v.画像alt属性 ?? "" });
const DBの行 = (id: number) => {
  const r = トップバナーを読む([id])[0];
  return r ? { 画像URL: r.画像URL, リンク先URL: r.リンク先URL, 言語: r.言語, 表示タイプ: r.表示タイプ, 画像alt属性: r.画像alt属性 } : null;
};
const 長いURL = (n: number) => { const head = "https://replace-dev.hareruyamtg.com:8443/"; return head + "a".repeat(n - head.length); };

// ---- 001 店舗指定なしで開いたときのバナー設定欄 ----

caseTest("IT-M16-01-001", async ({ page, step, expected }) => {
  const s = await バナー設定を開く(page);
  const 値 = 二行の値("m1601c001", "M1601C001");
  let ids: number[] = [];
  const 行: Record<number, Awaited<ReturnType<BannerSettingPage["行を読む"]>>> = {};
  const 画像: Record<number, string> = {};
  let アップロード欄 = false;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => {
    ids = await s.行のID();
    for (const id of ids) { 行[id] = await s.行を読む(id); 画像[id] = (await s.行の画像(id).getAttribute("src")) ?? ""; }
    アップロード欄 = await new TopBannerPage(page).アップロードボタン.isVisible();
    note(`バナー設定欄の行: ID ${ids.join("・")}（行を足す・消す操作は画面に無く、正本に値の無い行は準備で空・非表示にした）`);
  });
  await expected(async () => {
    expect.soft(ids.slice(0, 2), "バナー設定欄の先頭の2行がID 1、ID 2の順").toEqual([1, 2]);
    expect.soft(ids, "全バナーが ID の昇順で表示される").toEqual([...ids].sort((a, b) => a - b));
    for (const id of [1, 2]) {
      const r = 行[id];
      expect.soft(画像[id], `ID ${id}の保存済みの画像（画像URLの画像）`).toBe(値[id].画像URL);
      expect.soft(r && { 画像URL: r.画像URL, リンク先URL: r.リンク先URL, 言語: r.言語, 表示タイプ: r.表示タイプ, 画像alt属性: r.画像alt属性 }, `ID ${id}の画像URL・リンク先URL・言語・表示タイプ・画像alt属性`).toEqual(期待の行(値[id]));
    }
    expect.soft(ids.filter((id) => 行[id]?.並び順 !== String(id)), "並び順に行のIDが表示されていない行").toEqual([]);
    expect.soft(アップロード欄, "画像アップロード欄が表示されている").toBe(true);
  });
});

// ---- 005 店舗Aを指定したときの画像一覧 ----

caseTest("IT-M16-01-005", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const [a1, a2, a3, b] = 準備した画像("S-M16-01-PREP-005");
  let 一覧: string[] = [];
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => {
    一覧 = await p.画像のURL();
    note(`正本の a-001.png・a-002.png・a-003.png は、準備で店舗Aへ順にアップロードした ${a1}・${a2}・${a3}、m1601c005-b001.png は店舗Bへアップロードした ${b} にあたる`);
  });
  await expected(async () => {
    expect.soft(一覧, "店舗Aの画像一覧（a-003・a-002・a-001 にあたる画像だけが、この順）").toEqual([a3, a2, a1]);
    expect.soft(一覧, "店舗Bの画像が表示されない").not.toContain(b);
    expect.soft(一覧.filter((u) => !URLのパス(u).includes(`/banner/top/${店舗A.略称}/`)), "店舗Aのフォルダ以外（バナー用フォルダ直下・店舗B）の画像").toEqual([]);
  });
});

// ---- 006・007・008 保存（DBで確かめる） ----

caseTest("IT-M16-01-006", async ({ page, step, expected }) => {
  const s = await バナー設定を開く(page);
  const A: バナー入力 = { 画像URL: "https://replace-dev.hareruyamtg.com:8443/cdn/m1601c006-a.png", リンク先URL: "https://replace-dev.hareruyamtg.com:8443/m1601c006-a", 言語: ["日本語"], 表示タイプ: "表示", 画像alt属性: "M1601C006-A" };
  const B: バナー入力 = { 画像URL: "https://replace-dev.hareruyamtg.com:8443/cdn/m1601c006-b.png", リンク先URL: "https://replace-dev.hareruyamtg.com:8443/m1601c006-b", 言語: ["英語"], 表示タイプ: "非表示", 画像alt属性: "M1601C006-B" };
  let 一: ReturnType<typeof DBの行> = null;
  let 二: ReturnType<typeof DBの行> = null;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.行に入れる(1, { ...A, 並び順: "2" }); });
  await step(3, async () => { await s.行に入れる(2, { ...B, 並び順: "1" }); });
  await step(4, async () => { 設定の注記(await s.設定を押す()); });
  await step(5, async () => { 一 = DBの行(1); 二 = DBの行(2); });
  await expected(async () => {
    expect.soft(一, "DBのID 1のトップバナー（バナーBの画像URL・リンク先URL・英語・非表示・画像alt属性）").toEqual(期待の行(B));
    expect.soft(二, "DBのID 2のトップバナー（バナーAの画像URL・リンク先URL・日本語・表示・画像alt属性）").toEqual(期待の行(A));
  });
});

caseTest("IT-M16-01-007", async ({ page, step, expected }) => {
  const s = await バナー設定を開く(page);
  let 一: ReturnType<typeof DBの行> = null;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.行に入れる(1, { リンク先URL: "", 並び順: "1" }); await s.行に入れる(2, { 並び順: "2" }); });
  await step(3, async () => { 設定の注記(await s.設定を押す()); });
  await step(4, async () => { 一 = DBの行(1); });
  await expected(async () => {
    expect(一?.リンク先URL, "DBのID 1のリンク先URL（空文字）").toBe("");
  });
});

caseTest("IT-M16-01-008", async ({ page, step, expected }) => {
  const s = await バナー設定を開く(page);
  const v = 長いURL(255);
  let 一: ReturnType<typeof DBの行> = null;
  await step(1, async () => { await s.開く(); });
  await step(2, async () => {
    expect(v.length, "入力する値の文字数").toBe(255);
    await s.行に入れる(1, { 画像URL: v, リンク先URL: v });
  });
  await step(3, async () => { await s.行に入れる(1, { 並び順: "1" }); await s.行に入れる(2, { 並び順: "2" }); 設定の注記(await s.設定を押す()); });
  await step(4, async () => { 一 = DBの行(1); });
  await expected(async () => {
    expect.soft(一?.画像URL, "DBのID 1の画像URL（255文字の値）").toBe(v);
    expect.soft(一?.リンク先URL, "DBのID 1のリンク先URL（255文字の値）").toBe(v);
  });
});

// ---- 010 入力エラーのあとの画像一覧 ----

caseTest("IT-M16-01-010", async ({ page, step, expected }) => {
  const s = await バナー設定を開く(page);
  const p = new TopBannerPage(page);
  const [店舗の画像] = 準備した画像("S-M16-01-PREP-010");
  let 一覧: string[] = [];
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => { await s.行に入れる(1, { 画像URL: 長いURL(256) }); });
  let 入力エラーの数 = -1, 成功の数 = -1;
  await step(3, async () => {
    const r = await s.設定を押す();
    設定の注記(r);
    入力エラーの数 = r.エラー.length;
    成功の数 = r.成功.length;
  });
  await step(4, async () => {
    await p.読み込みを待つ();
    一覧 = await p.画像のURL();
    note(`再表示された画像一覧: ${一覧.length}件（「アップロードした店舗」の表示: ${await p.絞り込みの値()}）。正本の m1601c010-store.png は準備で店舗Aへアップロードした ${店舗の画像} にあたる。バナー用フォルダ直下の m1601c010-root.png は画面から置けないので置いていない`);
  });
  await expected(async () => {
    // 入力エラーで出し直された画面であることを確かめる（保存されて移った画面の一覧を見て合格にしない）
    expect.soft(入力エラーの数, "画像URLの入力エラーの表示").toBeGreaterThan(0);
    expect.soft(成功の数, "保存の成功の表示が出ない").toBe(0);
    note("正本の「バナー用フォルダ直下のファイルが表示されること」の側は、直下へ画面から画像を置けないので確かめていない（表示されないことの側だけを確かめた）");
    expect.soft(一覧, "店舗Aのファイルが画像一覧に表示されない").not.toContain(店舗の画像);
    expect.soft(一覧.filter((u) => !/\/banner\/top\/[^/]+$/.test(URLのパス(u))), "画像一覧のうち、バナー用フォルダ直下でないファイル").toEqual([]);
  });
});

// ---- 017・050 バナー設定のあとの戻り ----

caseTest("IT-M16-01-017", async ({ page, step, expected }) => {
  const s = await バナー設定を開く(page);
  const p = new TopBannerPage(page);
  let パス = "";
  let 絞り込み = "";
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => { await s.行に入れる(1, { 並び順: "1" }); await s.行に入れる(2, { 並び順: "2" }); });
  await step(3, async () => {
    設定の注記(await s.設定を押す());
    パス = new URL(page.url()).pathname;
    絞り込み = (await p.アップロードボタン.isVisible().catch(() => false)) ? await p.絞り込みの値() : "（トップバナー管理画面でない）";
  });
  await expected(async () => {
    expect.soft(パス, "移った先のアドレス（店舗Aを指定したトップバナー管理画面）").toMatch(new RegExp(`/data/top_banner/${店舗A.略称}/?$`));
    expect.soft(絞り込み, "移った先で選択された店舗").toBe(店舗A.店名);
  });
});

caseTest("IT-M16-01-050", async ({ page, step, expected }) => {
  const s = await バナー設定を開く(page);
  const p = new TopBannerPage(page);
  let パス = "";
  let 絞り込み = "";
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.行に入れる(1, { 並び順: "1" }); await s.行に入れる(2, { 並び順: "2" }); });
  await step(3, async () => {
    設定の注記(await s.設定を押す());
    パス = new URL(page.url()).pathname;
    絞り込み = (await p.アップロードボタン.isVisible().catch(() => false)) ? await p.絞り込みの値() : "（トップバナー管理画面でない）";
  });
  await expected(async () => {
    expect.soft(パス, "移った先のアドレス（店舗指定なしのトップバナー管理画面）").toMatch(/\/data\/top_banner\/?$/);
    expect.soft(絞り込み, "移った先の「アップロードした店舗」（店舗の既定選択が無い＝全て）").toBe("全て");
  });
});

// ---- 018・052〜055 並び順・言語とトップ画面のスライド ----

caseTest("IT-M16-01-018", async ({ page, step, expected }) => {
  const s = await バナー設定を開く(page);
  const 値 = 二行の値("m1601c018", "M1601C018");
  let スライド: string[] = [];
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.行に入れる(1, { 言語: ["日本語"], 表示タイプ: "表示" }); await s.行に入れる(2, { 言語: ["日本語"], 表示タイプ: "表示" }); });
  await step(3, async () => { await s.行に入れる(1, { 並び順: "2" }); await s.行に入れる(2, { 並び順: "1" }); 設定の注記(await s.設定を押す()); });
  await step(4, async () => { スライド = await スライドの画像URL(page, "日本語"); });
  await expected(async () => {
    const 一 = スライド.indexOf(値[1].画像URL!);
    const 二 = スライド.indexOf(値[2].画像URL!);
    expect.soft(一 >= 0 && 二 >= 0, "ID 1・ID 2へ入力した2つのバナーがスライドに表示されている").toBe(true);
    expect.soft(二 < 一, "ID 2へ入力したバナーがID 1へ入力したバナーより先").toBe(true);
  });
});

function 言語と並び(n: string, 一: { 言語: string[]; 並び: string }, 二: { 言語: string[]; 並び: string }, サイト: サイト, 期待: string[]) {
  return async ({ page, step, expected }: CaseCtx) => {
    const s = await バナー設定を開く(page);
    let alt: string[] = [];
    await step(1, async () => { await s.開く(); });
    await step(2, async () => {
      await s.行に入れる(1, { 言語: 一.言語 });
      await s.行に入れる(2, { 言語: 二.言語 });
      note("画像URL・表示タイプ「表示」は開始時の値のまま");
    });
    await step(3, async () => { await s.行に入れる(1, { 並び順: 一.並び }); await s.行に入れる(2, { 並び順: 二.並び }); 設定の注記(await s.設定を押す()); });
    await step(4, async () => { alt = await スライドのalt(page, サイト); });
    await expected(async () => {
      expect(alt, `${サイト}サイトのスライドに表示されたバナーの画像alt属性（順に）`).toEqual(期待);
      if (n === "053") expect.soft(alt, "日本語のみを指定した「M1601CB053-1」のバナー").not.toContain("M1601CB053-1");
    });
  };
}
caseTest("IT-M16-01-052", 言語と並び("052", { 言語: ["日本語", "英語"], 並び: "2" }, { 言語: ["日本語"], 並び: "1" }, "日本語", ["M1601CB052-2", "M1601CB052-1"]));
caseTest("IT-M16-01-053", 言語と並び("053", { 言語: ["日本語"], 並び: "1" }, { 言語: ["英語"], 並び: "2" }, "英語", ["M1601CB053-2"]));
caseTest("IT-M16-01-054", 言語と並び("054", { 言語: ["英語"], 並び: "2" }, { 言語: ["英語"], 並び: "1" }, "英語", ["M1601CB054-2", "M1601CB054-1"]));
caseTest("IT-M16-01-055", 言語と並び("055", { 言語: ["日本語", "英語"], 並び: "1" }, { 言語: ["英語"], 並び: "2" }, "英語", ["M1601CB055-1", "M1601CB055-2"]));

// ---- 019・020・021・051 トップ画面のスライドの表示条件 ----

caseTest("IT-M16-01-019", async ({ page, step, expected }) => {
  let alt: string[] = [];
  let url: string[] = [];
  note(戻しの注記);
  note("ID 3（画像URL空・表示）は、画面で保存すると表示タイプが「非表示」になる（シード表は DB で直接設定すると定める）。画面で入れられる値のまま確かめた");
  await step(1, async () => { await 表示(page).開く("日本語"); });
  await step(2, async () => { const x = await 表示(page).スライドを読む(); alt = x.map((v) => v.画像alt属性); url = x.map((v) => v.画像URL); });
  await expected(async () => {
    expect.soft(alt, "日本語サイトのスライドのバナー（画像alt属性）").toEqual(["JP表示対象バナー"]);
    expect.soft(url, "日本語サイトのスライドのバナー（画像URL）").toEqual(["https://replace-dev.hareruyamtg.com:8443/cdn/m1601c019-jp.png"]);
  });
});

caseTest("IT-M16-01-020", async ({ page, step, expected }) => {
  let alt: string[] = [];
  let url: string[] = [];
  note(戻しの注記);
  note("ID 3（画像URL空・表示）は、画面で保存すると表示タイプが「非表示」になる（シード表は DB で直接設定すると定める）。画面で入れられる値のまま確かめた");
  await step(1, async () => { await 表示(page).開く("英語"); });
  await step(2, async () => { const x = await 表示(page).スライドを読む(); alt = x.map((v) => v.画像alt属性); url = x.map((v) => v.画像URL); });
  await expected(async () => {
    expect.soft(alt, "英語サイトのスライドのバナー（画像alt属性）").toEqual(["EN表示対象バナー"]);
    expect.soft(url, "英語サイトのスライドのバナー（画像URL）").toEqual(["https://replace-dev.hareruyamtg.com:8443/cdn/m1601c020-en.png"]);
  });
});

caseTest("IT-M16-01-021", async ({ page, step, expected }) => {
  let url: string[] = [];
  note(戻しの注記);
  await step(1, async () => { await 表示(page).開く("日本語"); });
  await step(2, async () => { url = (await 表示(page).スライドを読む()).map((v) => v.画像URL); note(`スライドのバナー数: ${url.length}`); });
  await expected(async () => {
    expect.soft(url.length, "スライドに表示されたバナー数").toBe(10);
    const 対象 = Array.from({ length: 11 }, (_, i) => `https://replace-dev.hareruyamtg.com:8443/cdn/m1601c021-${String(i + 1).padStart(2, "0")}.png`);
    expect.soft(url.filter((u) => !対象.includes(u)), "表示条件を満たす11件以外のバナー").toEqual([]);
  });
});

caseTest("IT-M16-01-051", async ({ page, step, expected }) => {
  let 日: string[] = [];
  let 英: string[] = [];
  note(戻しの注記);
  await step(1, async () => { await 表示(page).開く("日本語"); });
  await step(2, async () => { 日 = (await 表示(page).スライドを読む()).map((v) => v.画像alt属性); });
  await step(3, async () => { await 表示(page).開く("英語"); });
  await step(4, async () => { 英 = (await 表示(page).スライドを読む()).map((v) => v.画像alt属性); });
  await expected(async () => {
    expect.soft(日, "日本語サイトのスライド").toContain("両言語表示バナー-M1601-051");
    expect.soft(英, "英語サイトのスライド").toContain("両言語表示バナー-M1601-051");
  });
});

// ---- 022・023・047・048 設定を変えてトップ画面で確かめる ----

caseTest("IT-M16-01-022", async ({ page, step, expected }) => {
  const 値 = 二行の値("m1601c022", "M1601C022");
  const s = await バナー設定を開く(page);
  let 後: string[] = [];
  await step(1, async () => {
    const 前 = await スライドの画像URL(page, "日本語");
    expect(前, "手順1: 日本語サイトのトップ画面にID 1のバナーが表示されている").toContain(値[1].画像URL);
  });
  await step(2, async () => { await s.開く(); });
  await step(3, async () => { await s.行に入れる(1, { 画像URL: "", 並び順: "1" }); await s.行に入れる(2, { 並び順: "2" }); 設定の注記(await s.設定を押す()); });
  await step(4, async () => { 後 = await スライドの画像URL(page, "日本語"); });
  await expected(async () => {
    expect(後, "ID 1のバナーがスライドに表示されない").not.toContain(値[1].画像URL);
  });
});

caseTest("IT-M16-01-023", async ({ page, step, expected }) => {
  const 値 = 二行の値("m1601c023", "M1601C023");
  const s = await バナー設定を開く(page);
  const 行き先 = "https://example.com/m16-01";
  let 要求 = "";
  let 着いた = "";
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.行に入れる(1, { 言語: ["日本語"], 表示タイプ: "表示", リンク先URL: 行き先 }); });
  await step(3, async () => { await s.行に入れる(1, { 並び順: "1" }); await s.行に入れる(2, { 並び順: "2" }); 設定の注記(await s.設定を押す()); });
  await step(4, async () => { await 表示(page).開く("日本語"); });
  await step(5, async () => {
    const onReq = (r: import("@playwright/test").Request) => { if (r.isNavigationRequest() && r.frame() === page.mainFrame() && !要求) 要求 = r.url(); };
    page.on("request", onReq);
    try {
      await Promise.all([
        page.waitForURL(/example\.com\/m16-01/, { timeout: 60_000, waitUntil: "commit" }).catch(() => undefined),
        表示(page).スライドのリンク(値[1].画像URL!).click({ noWaitAfter: true }),
      ]);
    } finally { page.off("request", onReq); }
    着いた = page.url();
    note(`ID 1のバナーを押したあとにブラウザが要求したアドレス: ${要求 || "なし"}／表示中のアドレス: ${着いた}`);
  });
  await expected(async () => {
    expect.soft(要求.replace(/\/$/, ""), "ブラウザが遷移した先のアドレス（バナーを押して要求したアドレス）").toBe(行き先);
  });
});

caseTest("IT-M16-01-047", async ({ page, step, expected }) => {
  const s = await バナー設定を開く(page, M1601L_ADMIN);
  let 後: string[] = [];
  await step(1, async () => {
    const 前 = await スライドのalt(page, "日本語");
    expect(前, "手順1: 「L001M1601n047連携バナー1」と「L001M1601n047連携バナー2」がスライドに表示されている").toEqual(expect.arrayContaining(["L001M1601n047連携バナー1", "L001M1601n047連携バナー2"]));
  });
  await step(2, async () => { await s.開く(); });
  await step(3, async () => {
    await s.行に入れる(1, { 表示タイプ: "非表示" });
    note("並び順は画面に出ている値（ID 1〜11は1〜11）のまま入れた");
    設定の注記(await s.設定を押す());
  });
  await step(4, async () => { 後 = await スライドのalt(page, "日本語"); });
  await expected(async () => {
    expect.soft(後, "「L001M1601n047連携バナー1」がスライドに表示されない").not.toContain("L001M1601n047連携バナー1");
    expect.soft(後, "「L001M1601n047連携バナー2」がスライドに表示される").toContain("L001M1601n047連携バナー2");
  });
});

caseTest("IT-M16-01-048", async ({ page, step, expected }) => {
  const s = await バナー設定を開く(page, M1601L_ADMIN);
  let 日: string[] = [];
  let 英: string[] = [];
  await step(1, async () => {
    const 前 = await スライドのalt(page, "日本語");
    expect(前, "手順1: 「L002M1601n048連携バナー1」がスライドに表示されている").toContain("L002M1601n048連携バナー1");
  });
  await step(2, async () => { await s.開く(); });
  await step(3, async () => {
    await s.行に入れる(1, { 言語: ["英語"] });
    note("並び順は画面に出ている値（ID 1〜11は1〜11）のまま入れた");
    設定の注記(await s.設定を押す());
  });
  await step(4, async () => { 日 = await スライドのalt(page, "日本語"); });
  await step(5, async () => { 英 = await スライドのalt(page, "英語"); });
  await expected(async () => {
    expect.soft(日, "日本語サイトのスライドに「L002M1601n048連携バナー1」が表示されない").not.toContain("L002M1601n048連携バナー1");
    expect.soft(英, "英語サイトのスライドに「L002M1601n048連携バナー1」が表示される").toContain("L002M1601n048連携バナー1");
  });
});

// ---- 033・043・056 画像のアップロード・削除とバナー設定（DBで確かめる） ----

caseTest("IT-M16-01-033", async ({ page, step, expected }) => {
  const p = await 開く(page);
  note(戻しの注記);
  const 値 = 二行の値("m1601c033", "M1601C033");
  let 一: ReturnType<typeof DBの行> = null;
  let 二: ReturnType<typeof DBの行> = null;
  await step(1, async () => { await p.開く(); });
  let r: 結果 | undefined;
  await step(2, async () => {
    await p.アップロード欄の店舗を選ぶ(店舗A.店名);
    await p.ファイルを選ぶ(入力ファイル("m1602-valid.png"));
    r = await p.アップロードを押す();
    結果の注記("アップロード", r);
    note("正本の「店舗Aのフォルダは0件」は、E2E の試験店舗の前の実行の画像を消していない（期待結果はバナーの値だけを見る）");
  });
  await step(3, async () => { 一 = DBの行(1); 二 = DBの行(2); });
  await expected(async () => {
    // アップロードが失敗していればバナーは当然そのままなので、アップロードが通ったことも確かめる
    通ったことを確かめる(r, "店舗Aへの valid.png のアップロード");
    expect.soft(一, "DBのID 1（画像URL・リンク先URL・表示タイプ・言語・画像alt属性が保存前の値のまま）").toEqual(期待の行(値[1]));
    expect.soft(二, "DBのID 2（画像URL・リンク先URL・表示タイプ・言語・画像alt属性が保存前の値のまま）").toEqual(期待の行(値[2]));
  });
});

caseTest("IT-M16-01-043", async ({ page, step, expected }) => {
  const p = await 開く(page);
  note(戻しの注記);
  const s = new BannerSettingPage(page);
  const [ref] = 準備した画像("S-M16-01-PREP-043");
  let 一: ReturnType<typeof DBの行> = null;
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => {
    expect(await s.画像URL欄(1).inputValue(), "手順2: ID 1の画像URLが referenced.png にあたる画像を指している").toBe(ref);
    note(`正本の referenced.png は、準備で店舗Aへアップロードした ${ref} にあたる`);
  });
  await step(3, async () => { await expect(p.削除リンク(p.行(ref)), "referenced.png にあたる画像の「削除」").toBeVisible(); note(確認の注記); });
  await step(4, async () => { await p.削除してOKを押す(p.行(ref)); });
  await step(5, async () => { 一 = DBの行(1); });
  await expected(async () => {
    expect(一?.画像URL, "DBのID 1の画像URL（referenced.png を指す値のまま）").toBe(ref);
  });
});

caseTest("IT-M16-01-056", async ({ page, step, expected }) => {
  const p = await 開く(page);
  note(戻しの注記);
  const s = new BannerSettingPage(page);
  const [unref] = 準備した画像("S-M16-01-CBPREP-056");
  const 値 = 二行の値("m1601cb056", "M1601CB056");
  let 一覧: string[] = [];
  let 一: ReturnType<typeof DBの行> = null;
  let 二: ReturnType<typeof DBの行> = null;
  await step(1, async () => { await p.開く(); await p.絞り込みを選ぶ(店舗A.店名); });
  await step(2, async () => {
    expect.soft(await p.画像のURL(), "手順2: 画像一覧に cb056-unref.png にあたる画像が表示されている").toContain(unref);
    expect.soft(await s.画像URL欄(1).inputValue(), "手順2: ID 1の画像URL").toBe(値[1].画像URL);
    expect.soft(await s.画像URL欄(2).inputValue(), "手順2: ID 2の画像URL").toBe(値[2].画像URL);
    note(`正本の cb056-unref.png は、準備で店舗Aへアップロードした ${unref} にあたる`);
  });
  await step(3, async () => { await expect(p.削除リンク(p.行(unref)), "cb056-unref.png にあたる画像の「削除」").toBeVisible(); note(確認の注記); });
  await step(4, async () => { await p.削除してOKを押す(p.行(unref)); });
  await step(5, async () => { 一覧 = await p.画像のURL(); 一 = DBの行(1); 二 = DBの行(2); });
  await expected(async () => {
    expect.soft(一覧, "cb056-unref.png にあたる画像が店舗Aの画像一覧から消える").not.toContain(unref);
    expect.soft(一?.画像URL, "DBのID 1の画像URL（更新されない）").toBe(値[1].画像URL);
    expect.soft(二?.画像URL, "DBのID 2の画像URL（更新されない）").toBe(値[2].画像URL);
  });
});
