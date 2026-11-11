/**
 * M16-02 画像設定（トップバナー管理）。正本: cases/M16-02_test_cases.tsv
 *
 * 店舗ID 1 の書き換え・保管先の画像の削除・保管先への直接の配置は行わない（依頼者の方針 2026-11-10）。読み替えは seeds/m16-02.ts の冒頭に書いた:
 * 「トーナメントセンター東京」（tc）は試験店舗A、「結合試験店舗」（zz）は試験店舗B、画像のない店舗は試験店舗C。
 * 名前を決めたファイルを置く準備は、ケースの冒頭（手順の前）で試験店舗へ画面からアップロードして用意する（ファイル名は画面が採番する）。
 * 実装しないケース: 006・007（2000件・2001件の画像。大量のデータ）。
 */
import { Page, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { TopBannerPage, URLのパス, ファイル名, 全て, 画像のURLを開く, 画像の種別, 画像の種別を見る, 準備のアップロード, 店舗の店名と略称 } from "../../pages/admin/m16_02_top_banner";
import { M1602_ADMIN, 入力ファイル, 店舗A, 店舗B, 店舗C } from "../../seeds/m16-02";

const トーナメントセンター東京 = 店舗A.店名;
const 結合試験店舗 = 店舗B.店名;

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 追加分 = (前: string[], 後: string[]) => 後.filter((u) => !前.includes(u));
const 配下 = (略称: string) => new RegExp(`/banner/top/${略称}/[^/]+$`);

async function 開く(page: Page): Promise<TopBannerPage> {
  await loginAdmin(page, M1602_ADMIN);
  return new TopBannerPage(page);
}

/** 事前の準備: 試験店舗へ画面から画像をアップロードし、増えた画像のURLを返す（正本の「保管先へ名前を決めた画像を置く」の読み替え） */
async function 用意する(p: TopBannerPage, 店: { 店名: string; 略称: string }, 呼び名: string): Promise<string> {
  const url = await 準備のアップロード(p, 店.店名, 入力ファイル("m1602-valid.png"));
  note(`事前の準備: 正本の「${呼び名}」の代わりに、「${店.店名}」へ画面から画像（m1602-valid.png）をアップロードし、増えた画像 ${url} を使う（ファイル名は画面が採番するので、正本の名前の画像は置けない）`);
  return url;
}

/** アップロードを押した結果を注記に残す（成功・エラーの表示と、移った先） */
function 結果の注記(何を: string, r: { 送った: boolean; 応答: number | null; 成功: string[]; エラー: string[]; 行き先: string }): void {
  note(`${何を}: 要求を送った=${r.送った ? "はい" : "いいえ"}／応答=${r.応答 ?? "なし"}／成功の表示=${r.成功.join(" / ") || "なし"}／エラーの表示=${r.エラー.join(" / ") || "なし"}／移った先=${r.行き先}`);
}

/** 画像のURLの中身を読み、画像の種別を返す（画面の外の取得。新しいタブを開かない確かめ用） */
async function 中身の種別(page: Page, url: string): Promise<画像の種別 | "読めない"> {
  const res = await page.context().request.get(url).catch(() => null);
  if (!res || !res.ok()) return "読めない";
  return 画像の種別を見る(await res.body());
}

// ---- 001 初期値 ----

caseTest("IT-M16-02-001", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const 本店 = (await 店舗の店名と略称(page, "1")).店名;
  note(`店舗ID 1 の店名は書き換えない。初期選択されるのは店舗ID 1 の店舗（開発環境での店名は「${本店}」）。正本の「トーナメントセンター東京」はこの店名に読み替えた`);
  let 店舗 = "";
  let 絞り込み = "";
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    店舗 = await p.アップロード欄の店舗の値();
    絞り込み = await p.絞り込みの値();
  });
  await expected(async () => {
    expect.soft(店舗, "アップロード欄の「店舗」の初期選択（店舗ID 1 の店名）").toBe(本店);
    expect.soft(絞り込み, "一覧欄の「アップロードした店舗」の初期選択").toBe(全て);
  });
});

// ---- 008 画像0件 ----

caseTest("IT-M16-02-008", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 行数 = -1;
  let 画像設定画面 = false;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    note("保管先のトップバナー用フォルダ全体は消せない（既存の画像は消さない）ので、画像をアップロードしない試験店舗Cの絞り込みで、画像一覧が0件になることを確かめた");
    await p.絞り込みを選ぶ(店舗C.店名);
    行数 = await p.画像の行.count();
    画像設定画面 = await p.画像設定画面か();
  });
  await expected(async () => {
    expect.soft(行数, "トップバナー画像一覧（試験店舗Cの絞り込み）のデータ行の数").toBe(0);
    expect.soft(画像設定画面, "画像設定画面に留まっている").toBe(true);
  });
});

// ---- 009・022 アップロードした画像のURL ----

function アップロードして開く(店名: string, 略称: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    const p = await 開く(page);
    let 前: string[] = [];
    let 追加: string[] = [];
    let 開いた: { 応答: number | null; 種類: string; 種別: 画像の種別 } | null = null;
    await step(1, async () => { await p.開く(); 前 = await p.画像のURL(); });
    await step(2, async () => { await p.アップロード欄の店舗を選ぶ(店名); });
    await step(3, async () => { await p.ファイルを選ぶ(入力ファイル("m1602-valid.png")); });
    await step(4, async () => { 結果の注記("アップロード", await p.アップロードを押す()); });
    await step(5, async () => {
      追加 = 追加分(前, await p.画像のURL());
      note(`アップロードの前の一覧（全て）にあった画像: ${前.length}件。アップロードのあとの一覧（「アップロードした店舗」は${await p.絞り込みの値()}）に増えた画像: ${追加.join("、") || "なし"}`);
      if (追加.length === 0) throw new Error("アップロードのあとの画像一覧に、追加された画像が無い");
      const r = await 画像のURLを開く(page, 追加[0]);
      開いた = r;
      await test.info().attach("新しいタブで開いた画像", { body: await r.開いたタブ.screenshot(), contentType: "image/png" }).catch(() => {});
      await r.開いたタブ.close();
    });
    await expected(async () => {
      const r = 開いた as { 応答: number | null; 種類: string; 種別: 画像の種別 } | null;
      expect.soft(r?.応答 ?? null, "追加された画像のURLを開いた応答").toBe(200);
      expect.soft(r?.種別 ?? "開けない", "追加された画像のURLの中身（画像として参照できる）").toBe("PNG");
      const パス = 追加[0] ? URLのパス(追加[0]) : "";
      note(`追加された画像のURLのパス: ${パス}（保管先の公開アドレスの前置き（手元では保管先の入れ物の名前）のあとが「/banner/top/${略称}/ファイル名」であるかで確かめた）`);
      expect.soft(パス, `追加された画像のURLのパスが「/banner/top/${略称}/」配下`).toMatch(new RegExp(`/banner/top/${略称}/[^/]+$`));
    });
  };
}

caseTest("IT-M16-02-009", アップロードして開く(トーナメントセンター東京, 店舗A.略称));
caseTest("IT-M16-02-022", アップロードして開く(結合試験店舗, 店舗B.略称));

// ---- 010 GIF・JPEG・PNG ----

caseTest("IT-M16-02-010", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 前: string[] = [];
  let 後: string[] = [];
  const 種別: string[] = [];
  const 送る = async (name: string) => {
    note(`「${name}」を選んだときのアップロード欄の「店舗」: ${await p.アップロード欄の店舗の値()}`);
    await p.ファイルを選ぶ(入力ファイル(name));
    結果の注記(`「${name}」のアップロード`, await p.アップロードを押す());
  };
  await step(1, async () => { await p.開く(); 前 = await p.画像のURL(); });
  await step(2, async () => { await p.アップロード欄の店舗を選ぶ(トーナメントセンター東京); });
  await step(3, async () => { await 送る("m1602-valid.gif"); });
  await step(4, async () => { await 送る("m1602-valid.jpeg"); });
  await step(5, async () => { await 送る("m1602-valid.png"); });
  await step(6, async () => {
    後 = await p.画像のURL();
    for (const u of 追加分(前, 後)) 種別.push(await 中身の種別(page, u));
    note(`アップロードの前の一覧（全て）: ${前.length}件／あとの一覧（「アップロードした店舗」は${await p.絞り込みの値()}）: ${後.length}件。増えた画像と中身の種別: ${追加分(前, 後).map((u, i) => `${u}（${種別[i]}）`).join("、") || "なし"}`);
  });
  await expected(async () => {
    const 追加 = 追加分(前, 後);
    expect.soft(追加.length, "トップバナー用フォルダの画像一覧に追加された画像の数").toBe(3);
    expect.soft([...種別].sort().join("・"), "追加された画像の中身の種別").toBe("GIF・JPEG・PNG");
    expect.soft(追加.every((u) => URLのパス(u).includes("/banner/top/")), "追加された画像がトップバナー用フォルダにある").toBe(true);
  });
});

// ---- 011 ファイル名の採番 ----

caseTest("IT-M16-02-011", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 前: string[] = [];
  let 追加: string[] = [];
  await step(1, async () => { await p.開く(); 前 = await p.画像のURL(); });
  await step(2, async () => { await p.アップロード欄の店舗を選ぶ(トーナメントセンター東京); });
  await step(3, async () => {
    await p.ファイルを選ぶ(入力ファイル("OriginalBanner.PNG"));
    結果の注記("1回目のアップロード", await p.アップロードを押す());
  });
  await step(4, async () => {
    note(`2回目に選んだときのアップロード欄の「店舗」: ${await p.アップロード欄の店舗の値()}`);
    await p.ファイルを選ぶ(入力ファイル("OriginalBanner.PNG"));
    結果の注記("2回目のアップロード", await p.アップロードを押す());
  });
  await step(5, async () => {
    追加 = 追加分(前, await p.画像のURL());
    note(`あとの一覧（「アップロードした店舗」は${await p.絞り込みの値()}）に追加された画像のURL: ${追加.join("、") || "なし"}`);
  });
  await expected(async () => {
    const 名前 = 追加.map(ファイル名);
    expect.soft(追加.length, "追加された画像の数").toBe(2);
    expect.soft(new Set(名前).size, "2件のファイル名が互いに異なる（異なる名前の数）").toBe(2);
    expect.soft(名前.filter((n) => n.includes("OriginalBanner")), "元のファイル名「OriginalBanner」を引き継いだファイル名").toEqual([]);
    expect.soft(名前.filter((n) => !n.endsWith(".png")), "小文字の「.png」で終わらないファイル名").toEqual([]);
  });
});

// ---- 012 520000バイト ----

caseTest("IT-M16-02-012", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 前: string[] = [];
  let 後: string[] = [];
  await step(1, async () => { await p.開く(); 前 = await p.画像のURL(); });
  await step(2, async () => { await p.アップロード欄の店舗を選ぶ(トーナメントセンター東京); });
  await step(3, async () => { await p.ファイルを選ぶ(入力ファイル("m1602-520000.png")); });
  await step(4, async () => { 結果の注記("アップロード", await p.アップロードを押す()); });
  await step(5, async () => {
    後 = await p.画像のURL();
    note(`アップロードの前の一覧（全て）: ${前.length}件／あとの一覧（「アップロードした店舗」は${await p.絞り込みの値()}）: ${後.length}件。増えた画像: ${追加分(前, 後).join("、") || "なし"}`);
  });
  await expected(async () => {
    const 追加 = 追加分(前, 後);
    expect.soft(追加.length, "トップバナー用フォルダの画像一覧に追加された画像の数").toBe(1);
    expect.soft(追加.every((u) => URLのパス(u).includes("/banner/top/")), "追加された画像がトップバナー用フォルダにある").toBe(true);
  });
});

// ---- 015 アップロードのあとの戻り ----

caseTest("IT-M16-02-015", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 絞り込み = "";
  let 印 = "";
  let 見えている = false;
  let 画像設定画面 = false;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.絞り込みを選ぶ(トーナメントセンター東京); });
  await step(3, async () => { await p.アップロード欄の店舗を選ぶ(トーナメントセンター東京); });
  await step(4, async () => { await p.ファイルを選ぶ(入力ファイル("m1602-valid.png")); });
  await step(5, async () => { 結果の注記("アップロード", await p.アップロードを押す()); });
  await step(6, async () => {
    画像設定画面 = await p.画像設定画面か();
    絞り込み = await p.絞り込みの値();
    印 = p.位置の印();
    見えている = await p.アップロード欄が見えている();
  });
  await expected(async () => {
    expect.soft(画像設定画面, "戻った画面が画像設定画面").toBe(true);
    expect.soft(絞り込み, "戻った画面の「アップロードした店舗」").toBe(トーナメントセンター東京);
    expect.soft(印, "戻った画面のアドレスの位置の印（アップロード欄）").toBe("#upload_wrap");
    expect.soft(見えている, "アップロード欄が画面の見えている範囲にある").toBe(true);
  });
});

// ---- 016 なりすまし対策トークンが不正なアップロード ----

caseTest("IT-M16-02-016", async ({ page, step, expected }) => {
  const p = await 開く(page);
  let 応答: number | null = null;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.アップロード欄の店舗を選ぶ(トーナメントセンター東京); });
  await step(3, async () => { await p.ファイルを選ぶ(入力ファイル("m1602-valid.png")); });
  await step(4, async () => {
    await p.アップロードのトークンを変える("invalid-token");
    note("アップロードのフォームのなりすまし対策トークンの値を、画面の中で「invalid-token」に書き換えた（開発者ツールで書き換えるのにあたる）");
  });
  await step(5, async () => {
    const r = await p.アップロードを押す();
    結果の注記("アップロード", r);
    if (!r.送った) throw new Error("「アップロード」を押しても要求が送られない");
    応答 = r.応答;
  });
  await step(6, async () => { note(`アップロードの要求への応答のHTTPステータス: ${応答 ?? "なし"}（ブラウザの通信の記録から読んだ）`); });
  await expected(async () => {
    expect(応答, "アップロードの要求への応答のHTTPステータス").toBe(403);
  });
});

// ================= 以下、事前の準備で試験店舗へ画像をアップロードして使うケース =================

const 初期値の全て = "「アップロードした店舗」の初期値";
const 確認の注記 = "「削除」を押すと確認ポップアップが出る。押す操作と OK は、次の手順の1回の操作で行った";
const 戻りの注記 = (r: { 送った: boolean; 応答: number | null; 成功: string[]; エラー: string[]; 行き先: string }) =>
  `アップロード: 要求を送った=${r.送った ? "はい" : "いいえ"}／応答=${r.応答 ?? "なし"}／成功の表示=${r.成功.join(" / ") || "なし"}／エラーの表示=${r.エラー.join(" / ") || "なし"}／移った先=${r.行き先}`;

// ---- 002 全店舗の絞り込み（全て） ----

caseTest("IT-M16-02-002", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const a = await 用意する(p, 店舗A, "/banner/top/tc/filter-tc.png-002");
  const b = await 用意する(p, 店舗B, "/banner/top/zz/filter-other.png-002");
  let 一覧: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.絞り込みを選ぶ(全て); });
  await step(3, async () => { 一覧 = await p.画像のURL(); note(`「全て」の一覧の件数: ${一覧.length}`); });
  await expected(async () => {
    expect.soft(一覧, `「全て」の一覧に、${店舗A.店名}の画像`).toContain(a);
    expect.soft(一覧, `「全て」の一覧に、${店舗B.店名}の画像`).toContain(b);
  });
});

// ---- 003 店舗別の絞り込み ----

caseTest("IT-M16-02-003", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const a = await 用意する(p, 店舗A, "/banner/top/tc/filter-tc.png-003");
  const b = await 用意する(p, 店舗B, "/banner/top/zz/filter-other.png-003");
  let 一覧: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.絞り込みを選ぶ(トーナメントセンター東京); });
  await step(3, async () => { 一覧 = await p.画像のURL(); });
  await expected(async () => {
    expect.soft(一覧, `「${トーナメントセンター東京}」の絞り込みの一覧に、${店舗A.店名}の画像`).toContain(a);
    expect.soft(一覧, `「${トーナメントセンター東京}」の絞り込みの一覧に、${店舗B.店名}の画像は無い`).not.toContain(b);
    expect.soft(一覧.filter((u) => !配下(店舗A.略称).test(URLのパス(u))), `絞り込みの一覧の、「/banner/top/${店舗A.略称}/」配下でない画像`).toEqual([]);
  });
});

// ---- 004 画像とURLの表示 ----

caseTest("IT-M16-02-004", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const a = await 用意する(p, 店舗A, "/banner/top/tc/filter-tc.png-004");
  let 画像の元: string | null = null;
  let 表示URL = "";
  let 開いた: { 応答: number | null; 種類: string; 種別: 画像の種別 } | null = null;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.絞り込みを選ぶ(トーナメントセンター東京); });
  await step(3, async () => {
    const 行 = p.行(a);
    await expect(行, "追加した画像の行").toHaveCount(1);
    画像の元 = await 行.locator("td:first-child img").first().getAttribute("src");
    表示URL = (await 行.locator("td:first-child div.small").innerText()).trim();
  });
  await step(4, async () => {
    const r = await 画像のURLを開く(page, 表示URL);
    開いた = r;
    await test.info().attach("新しいタブで開いた画像", { body: await r.開いたタブ.screenshot(), contentType: "image/png" }).catch(() => {});
    await r.開いたタブ.close();
  });
  await expected(async () => {
    const r = 開いた as { 応答: number | null; 種類: string; 種別: 画像の種別 } | null;
    expect.soft(画像の元, "一覧の行の画像の表示元").toBe(a);
    expect.soft(r?.応答 ?? null, "表示されたURLを開いた応答").toBe(200);
    expect.soft(r?.種別 ?? "開けない", "表示されたURLの中身（画像として表示される）").toBe("PNG");
    expect.soft(URLのパス(表示URL), "表示されたURLのパス").toMatch(配下(店舗A.略称));
  });
});

// ---- 005 並び順（フォルダ名を含むファイル名の降順） ----

caseTest("IT-M16-02-005", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const a1 = await 用意する(p, 店舗A, "/banner/top/tc/999-005.png");
  const b1 = await 用意する(p, 店舗B, "/banner/top/zz/001-005.png");
  const b2 = await 用意する(p, 店舗B, "/banner/top/zz/002-005.png");
  let 一覧: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.絞り込みを選ぶ(全て); });
  await step(3, async () => {
    一覧 = await p.画像のURL();
    note(`「全て」の一覧の件数: ${一覧.length}。アップロードした順は ${店舗A.店名}（${a1}）→ ${店舗B.店名}（${b1}）→ ${店舗B.店名}（${b2}）。保管先のキーは「banner/top/略称/ファイル名」で、降順（略称 ${店舗B.略称} が ${店舗A.略称} より前、同じ店舗では新しいファイル名が前）になるはず`);
  });
  await expected(async () => {
    const 位置 = [b2, b1, a1].map((u) => 一覧.indexOf(u));
    expect.soft(位置.every((i) => i >= 0), `3件とも一覧にある（位置 ${位置.join("、")}）`).toBe(true);
    expect.soft(位置.join("<") === [...位置].sort((x, y) => x - y).join("<"), `一覧の並び（${店舗B.略称}の新しい画像、${店舗B.略称}の古い画像、${店舗A.略称}の画像の順）の位置 ${位置.join("、")}`).toBe(true);
    const パス = 一覧.map(URLのパス);
    expect.soft(パス, "一覧全体がフォルダ名を含むファイル名の降順").toEqual([...パス].sort((x, y) => (x < y ? 1 : x > y ? -1 : 0)));
  });
});

// ---- 017 削除 ----

caseTest("IT-M16-02-017", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const del = await 用意する(p, 店舗A, "/banner/top/tc/delete-target.png-017");
  const keep = await 用意する(p, 店舗A, "/banner/top/tc/keep-target.png-017");
  let 一覧: string[] = [];
  let ダイアログ: string | null = null;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.絞り込みを選ぶ(トーナメントセンター東京); });
  await step(3, async () => { await expect(p.削除リンク(p.行(del)), "削除する画像の「削除」").toBeVisible(); note(確認の注記); });
  await step(4, async () => { ダイアログ = await p.削除してOKを押す(p.行(del)); });
  await step(5, async () => { 一覧 = await p.画像のURL(); });
  await expected(async () => {
    expect.soft(ダイアログ !== null, "確認ポップアップが出た").toBe(true);
    expect.soft(一覧, "削除した画像が一覧に残っていない").not.toContain(del);
    expect.soft(一覧, "もう一方の画像が一覧に残っている").toContain(keep);
  });
});

// ---- 018 削除のあとの戻り ----

caseTest("IT-M16-02-018", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const del = await 用意する(p, 店舗A, "/banner/top/tc/delete-target.png-018");
  let 絞り込み = "";
  let 印 = "";
  let 見えている = false;
  let 画像設定画面 = false;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.絞り込みを選ぶ(トーナメントセンター東京); });
  await step(3, async () => { await expect(p.削除リンク(p.行(del)), "削除する画像の「削除」").toBeVisible(); note(確認の注記); });
  await step(4, async () => { await p.削除してOKを押す(p.行(del)); });
  await step(5, async () => {
    画像設定画面 = await p.画像設定画面か();
    絞り込み = await p.絞り込みの値();
    印 = p.位置の印();
    見えている = await p.アップロード欄が見えている();
  });
  await expected(async () => {
    expect.soft(画像設定画面, "戻った画面が画像設定画面").toBe(true);
    expect.soft(絞り込み, "戻った画面の「アップロードした店舗」").toBe(トーナメントセンター東京);
    expect.soft(印, "戻った画面のアドレスの位置の印（アップロード欄）").toBe("#upload_wrap");
    expect.soft(見えている, "アップロード欄が画面の見えている範囲にある").toBe(true);
  });
});

// ---- 019・035 存在しないファイルの削除 ----

function 存在しない削除(全てから: boolean, 消えた名前: string, 呼び名: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    const p = await 開く(page);
    const keep = await 用意する(p, 店舗A, 呼び名);
    let 一覧: string[] = [];
    let 絞り込み = "";
    let 印 = "";
    let 見えている = false;
    let 画像設定画面 = false;
    await step(1, async () => { await p.開く(); });
    await step(2, async () => {
      if (全てから) 絞り込み = await p.絞り込みの値();
      else await p.絞り込みを選ぶ(トーナメントセンター東京);
    });
    await step(3, async () => {
      const 前 = await p.削除の対象を変える(p.行(keep), `banner/top/${店舗A.略称}/${消えた名前}`);
      note(`削除リンクのアドレスの対象ファイル名を「banner/top/${店舗A.略称}/${消えた名前}」に変えた（開発者ツールで書き換えるのにあたる）。変える前のアドレス: ${前}`);
    });
    await step(4, async () => {
      const r = await p.削除を実行する(p.行(keep));
      note(`削除の要求への応答のHTTPステータス: ${r.応答 ?? "なし"}／確認ポップアップ: ${r.ダイアログ ?? "出なかった"}`);
    });
    await step(5, async () => {
      画像設定画面 = await p.アップロードボタン.isVisible().catch(() => false);
      if (画像設定画面) await p.読み込みを待つ();
      画像設定画面 = 画像設定画面 && (await p.画像設定画面か());
      絞り込み = 画像設定画面 ? await p.絞り込みの値() : "（画像設定画面でない）";
      印 = p.位置の印();
      見えている = 画像設定画面 && (await p.アップロード欄が見えている());
      一覧 = 画像設定画面 ? await p.画像のURL() : [];
    });
    await expected(async () => {
      expect.soft(画像設定画面, "戻った画面が画像設定画面（エラー画面でない）").toBe(true);
      expect.soft(絞り込み, "戻った画面の「アップロードした店舗」").toBe(全てから ? 全て : トーナメントセンター東京);
      expect.soft(一覧, "もとの画像が一覧に残っている").toContain(keep);
      expect.soft(印, "戻った画面のアドレスの位置の印（アップロード欄）").toBe("#upload_wrap");
      expect.soft(見えている, "アップロード欄が画面の見えている範囲にある").toBe(true);
    });
  };
}
caseTest("IT-M16-02-019", 存在しない削除(false, "not-exists.png-019", "/banner/top/tc/keep-target.png-019"));
caseTest("IT-M16-02-035", 存在しない削除(true, "m1602-cb035-gone.png", "/banner/top/tc/m1602-cb035-keep.png"));

// ---- 020 削除のなりすまし対策トークン不正 ----

caseTest("IT-M16-02-020", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const del = await 用意する(p, 店舗A, "/banner/top/tc/delete-target.png-020");
  let 応答: number | null = null;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    await p.削除のトークンを変える(p.行(del), "invalid-token");
    note("削除リンクのなりすまし対策トークンを「invalid-token」に変えた（開発者ツールで書き換えるのにあたる）");
  });
  await step(3, async () => { 応答 = (await p.削除を実行する(p.行(del))).応答; });
  await step(4, async () => { note(`削除の要求への応答のHTTPステータス: ${応答 ?? "なし"}（ブラウザの通信の記録から読んだ）`); });
  await expected(async () => {
    expect(応答, "削除の要求への応答のHTTPステータス").toBe(403);
  });
});

// ---- 025 更新日時 ----

caseTest("IT-M16-02-025", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const a = await 用意する(p, 店舗A, "/banner/top/tc/m1602-025-banner.png");
  let 日時 = "";
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.絞り込みを選ぶ(トーナメントセンター東京); });
  await step(3, async () => { 日時 = await p.更新日時(p.行(a)); note(`追加した画像の「更新日時」: 「${日時}」`); });
  await expected(async () => {
    expect.soft(日時, "「更新日時」が空欄でない").not.toBe("");
    expect.soft(日時, "「更新日時」が半角数字の日時（年/月/日 時:分:秒）").toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});

// ---- 026・036 「全て」のままアップロード ----

function 全てからアップロード(先: { 店名: string; 略称: string }, 既存の呼び名: string, 画像2件を見る: boolean) {
  return async ({ page, step, expected }: CaseCtx) => {
    const p = await 開く(page);
    const 既存 = await 用意する(p, 店舗A, 既存の呼び名);
    if (!画像2件を見る) await 用意する(p, 店舗B, "/banner/top/zz/dp-m1602-026-zz.png");
    let 初期 = "";
    let 前: string[] = [];
    let 後: string[] = [];
    let 絞り込み = "";
    let 印 = "";
    let 画像設定画面 = false;
    await step(1, async () => { await p.開く(); });
    await step(2, async () => { 初期 = await p.絞り込みの値(); 前 = await p.画像のURL(); });
    await step(3, async () => { await p.アップロード欄の店舗を選ぶ(先.店名); });
    await step(4, async () => { await p.ファイルを選ぶ(入力ファイル("m1602-valid.png")); });
    await step(5, async () => { note(戻りの注記(await p.アップロードを押す())); });
    await step(6, async () => {
      画像設定画面 = await p.画像設定画面か();
      絞り込み = 画像設定画面 ? await p.絞り込みの値() : "（画像設定画面でない）";
      印 = p.位置の印();
      後 = 画像設定画面 ? await p.画像のURL() : [];
      note(`アップロードの前の一覧（全て）: ${前.length}件／あとの一覧: ${後.length}件。増えた画像: ${追加分(前, 後).join("、") || "なし"}`);
    });
    await expected(async () => {
      expect.soft(初期, 初期値の全て).toBe(全て);
      expect.soft(画像設定画面, "戻った画面が画像設定画面").toBe(true);
      expect.soft(絞り込み, "戻った画面の「アップロードした店舗」").toBe(全て);
      expect.soft(印, "戻った画面のアドレスの位置の印（アップロード欄）").toBe("#upload_wrap");
      if (画像2件を見る) {
        const 追加 = 追加分(前, 後);
        expect.soft(後, `あとの一覧に、もとの${店舗A.店名}の画像`).toContain(既存);
        expect.soft(追加.length, "あとの一覧に増えた画像の数").toBe(1);
        expect.soft(追加.every((u) => 配下(先.略称).test(URLのパス(u))), `増えた画像が「/banner/top/${先.略称}/」配下`).toBe(true);
      }
    });
  };
}
caseTest("IT-M16-02-026", 全てからアップロード(店舗A, "/banner/top/tc/dp-m1602-026-tc.png", false));
caseTest("IT-M16-02-036", 全てからアップロード(店舗B, "/banner/top/tc/m1602-cb036-tc.png", true));

// ---- 027 「全て」で削除したあとの戻り ----

caseTest("IT-M16-02-027", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const del = await 用意する(p, 店舗A, "/banner/top/tc/dp-m1602-027-del.png");
  await 用意する(p, 店舗B, "/banner/top/zz/dp-m1602-027-keep.png");
  let 初期 = "";
  let 絞り込み = "";
  let 印 = "";
  let 画像設定画面 = false;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { 初期 = await p.絞り込みの値(); });
  await step(3, async () => { await expect(p.削除リンク(p.行(del)), "削除する画像の「削除」").toBeVisible(); note(確認の注記); });
  await step(4, async () => { await p.削除してOKを押す(p.行(del)); });
  await step(5, async () => {
    画像設定画面 = await p.画像設定画面か();
    絞り込み = await p.絞り込みの値();
    印 = p.位置の印();
  });
  await expected(async () => {
    expect.soft(初期, 初期値の全て).toBe(全て);
    expect.soft(画像設定画面, "戻った画面が画像設定画面").toBe(true);
    expect.soft(絞り込み, "戻った画面の「アップロードした店舗」").toBe(全て);
    expect.soft(印, "戻った画面のアドレスの位置の印（アップロード欄）").toBe("#upload_wrap");
  });
});

// ---- 028 絞り込み中に別の店舗へアップロード ----

caseTest("IT-M16-02-028", async ({ page, step, expected }) => {
  const p = await 開く(page);
  await 用意する(p, 店舗A, "/banner/top/tc/dp-m1602-028-tc.png");
  let 前: string[] = [];
  let 後: string[] = [];
  let 絞り込み = "";
  let 画像設定画面 = false;
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.絞り込みを選ぶ(トーナメントセンター東京); 前 = await p.画像のURL(); });
  await step(3, async () => { await p.アップロード欄の店舗を選ぶ(結合試験店舗); });
  await step(4, async () => { await p.ファイルを選ぶ(入力ファイル("m1602-valid.png")); });
  await step(5, async () => { note(戻りの注記(await p.アップロードを押す())); });
  await step(6, async () => {
    画像設定画面 = await p.画像設定画面か();
    絞り込み = 画像設定画面 ? await p.絞り込みの値() : "（画像設定画面でない）";
    後 = 画像設定画面 ? await p.画像のURL() : [];
    note(`${店舗A.店名}の絞り込みの一覧: アップロードの前${前.length}件／あと${後.length}件`);
  });
  await expected(async () => {
    expect.soft(画像設定画面, "戻った画面が画像設定画面").toBe(true);
    expect.soft(絞り込み, "戻った画面の「アップロードした店舗」").toBe(トーナメントセンター東京);
    expect.soft(後, "画像一覧が、アップロードの前と同じ（結合試験店舗にアップロードした画像は表示されない）").toEqual(前);
    expect.soft(後.filter((u) => !配下(店舗A.略称).test(URLのパス(u))), "画像一覧の、試験店舗A以外の画像").toEqual([]);
  });
});

// ---- 029・030・033 店舗の画像が一覧に出る ----

function 画像が出る(店: { 店名: string; 略称: string }, 絞る: boolean, 呼び名: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    const p = await 開く(page);
    const u = await 用意する(p, 店, 呼び名);
    let 初期 = "";
    let 一覧: string[] = [];
    await step(1, async () => { await p.開く(); });
    await step(2, async () => { if (絞る) await p.絞り込みを選ぶ(店.店名); else 初期 = await p.絞り込みの値(); });
    await step(3, async () => { 一覧 = await p.画像のURL(); });
    await expected(async () => {
      if (!絞る) expect.soft(初期, 初期値の全て).toBe(全て);
      expect.soft(一覧, `一覧に、${店.店名}にアップロードした画像`).toContain(u);
      expect.soft(URLのパス(u), "その画像のURLのパス").toMatch(配下(店.略称));
    });
  };
}
caseTest("IT-M16-02-029", 画像が出る(店舗A, false, "/banner/top/tc/m1602-cb029-tc.png"));
caseTest("IT-M16-02-030", 画像が出る(店舗B, false, "/banner/top/zz/m1602-cb030-zz.png"));
caseTest("IT-M16-02-033", 画像が出る(店舗B, true, "/banner/top/zz/m1602-cb033-zz.png"));

// ---- 031・032 別の店舗の画像だけのとき、絞り込むと「画像がありません。」 ----

function 画像がない(上げる店: { 店名: string; 略称: string }, 呼び名: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    const p = await 開く(page);
    const u = await 用意する(p, 上げる店, 呼び名);
    let 行数 = -1;
    let なし = -1;
    let 画像設定画面 = false;
    await step(1, async () => { await p.開く(); });
    await step(2, async () => {
      note(`絞り込む店舗は、画像をアップロードしない試験店舗C（「${店舗C.店名}」）に読み替えた（保管先のほかの店舗の画像は消せないので、別の店舗の画像（${u}）があっても、画像の無い店舗で「画像がありません。」になることを見る）`);
      await p.絞り込みを選ぶ(店舗C.店名);
    });
    await step(3, async () => {
      行数 = await p.画像の行.count();
      なし = await p.画像なしの行.count();
      画像設定画面 = await p.画像設定画面か();
    });
    await expected(async () => {
      expect.soft(なし, "「画像がありません。」の行の数").toBe(1);
      expect.soft(行数, "画像のデータ行の数").toBe(0);
      expect.soft(画像設定画面, "画像設定画面に留まっている").toBe(true);
    });
  };
}
caseTest("IT-M16-02-031", 画像がない(店舗B, "/banner/top/zz/m1602-cb031-zz.png"));
caseTest("IT-M16-02-032", 画像がない(店舗A, "/banner/top/tc/m1602-cb032-tc.png"));

// ---- 034 別の店舗の画像は出ない ----

caseTest("IT-M16-02-034", async ({ page, step, expected }) => {
  const p = await 開く(page);
  const a = await 用意する(p, 店舗A, "/banner/top/tc/m1602-cb034-tc.png");
  const b = await 用意する(p, 店舗B, "/banner/top/zz/m1602-cb034-zz.png");
  let 一覧: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.絞り込みを選ぶ(結合試験店舗); });
  await step(3, async () => { 一覧 = await p.画像のURL(); });
  await expected(async () => {
    expect.soft(一覧, `一覧に、${店舗B.店名}の画像`).toContain(b);
    expect.soft(一覧, `一覧に、${店舗A.店名}の画像は無い`).not.toContain(a);
  });
});
