/**
 * M09-10 支店トップページ管理。正本: integration_test/casegen/cases/M09-10_test_cases.tsv
 * 実装した（45件）: 001 003 004 010 011 016 017 018 026 027 028 029 030 031 033 045 046 048 052 058 064（前回）
 *   と、2026-11-11 追加の 002 005 006 007 008 012 014 015 019 020 034 035 036 037 038 040 041 042 043 047 050 051 059 062（24件）。
 * 実装しない（8件）: 049 053 054 057 060 061 063 065。支店共通（支店ID 1）の書き換え、または支店共通の登録内容そのもの（共有の設定）を前提にするため
 *   （依頼者の方針 2026-11-10: 支店共通・既存の支店のバナー・タグ・タイルは書き換えない）。
 * 画面で作れない準備（バナー画像を空にする・タイルを消す・タイルタグを空にする・ピックアップ対象）は、固定の名前の試験店舗・この実行の印つきの商品にだけ、
 * db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） でDBへ書いて作った（seeds/m09-10.ts の冒頭）。
 * タグの名称・商品コード・商品名には実行の印を付け、店舗は固定の名前の試験店舗を使い回す（seeds/m09-10.ts）。正本のハイフンを含む「省略名」は、
 * 画面で入れられる半角英数字の試験店舗の支店URLで代える（条件付き。注記に残す）。
 */
import { test, Browser, Locator, Page } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { 支店トップページ管理, 新バナー画像, 旧バナー画像, 画像ファイル } from "../../pages/admin/m09_10_branch_toppage";
import { 支店トップ, 商品一覧の商品名, 画像の中身 } from "../../pages/front/m09_10_branch_top";
import { 支店のタイル, 支店のトップページ設定 } from "../../db/m09_10_branch_toppage";
import { LOCALの店名, LOCALの支店URL, M0910_ADMIN, QI管理者, タグ名, 印, 連番, 商品の支店のURL, 商品の支店の店名 } from "../../seeds/m09-10";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 東京 = () => LOCALの店名("S-M09-10-LOCAL");
const 省略名の代え = (seedId: string, 正本: string) =>
  note(`正本の省略名「${正本}」はハイフンを含み画面で入れられない（シード表ではDBへ直接設定する）ので、画面で入れた支店URL「${LOCALの支店URL(seedId)}」を省略名として使った（PM 方針 2026-11-10 の条件付き）`);

/** 管理画面にログインして、支店トップページ管理を開いて支店を選ぶ（正本の「支店トップページ管理画面で「X」を選択する」） */
async function 支店を選んだ画面(page: Page, 店名: string): Promise<支店トップページ管理> {
  const p = new 支店トップページ管理(page);
  await p.開いて支店を選ぶ(店名);
  return p;
}

// ---- 表示・入力制御（S-M09-10-LOCAL を見るだけ） ----

caseTest("IT-M09-10-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.支店を選ぶ(東京()); });
  await expected(async () => {
    expect.soft(await p.選択中の支店(), "選んでいる支店").toBe(東京());
    await expect.soft(p.バナー画像欄の画像, "バナー画像欄の画像（登録済みのバナー）").toBeVisible();
    const 中身 = await p.バナー画像欄の画像の中身();
    expect.soft(中身 !== null && 中身.equals(旧バナー画像()), "バナー画像欄の画像の中身が、登録した m0910-old-banner.png と同じ").toBe(true);
    expect.soft(await p.選択中のバナーリンクタグ(), "バナーリンクタグ（M0910バナータグA）").toBe(タグ名("A"));
    const tiles = await p.タイルの表示();
    // 位置は、タイル位置のセレクトボックスの何番目の選択肢か（正本の「セレクトボックスのn番目」）
    expect.soft(tiles.map((t) => [t.位置の番号, t.属性, t.タグ]), "タイル4行（位置のn番目・属性・タグ）").toEqual([
      [1, "フォーマット別特集", タグ名("A")], [2, "最新エキスパンション", タグ名("B")], [3, "ピックアップ商品", ""], [4, "その他", タグ名("その他")],
    ]);
  });
});

/** 支店共通設定を適用を入れる（外す）と、バナー画像選択・バナーリンクタグ・4行の位置・属性・タグの欄が使えなくなる（使えるようになる） */
function 入力制御(外す: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, M0910_ADMIN);
    const p = new 支店トップページ管理(page);
    await step(1, async () => { await p.開いて支店を選ぶ(東京()); await expect(p.共通設定を適用, "支店共通設定を適用（未選択）").not.toBeChecked(); });
    await step(2, async () => { await p.共通設定を適用.check({ timeout: 20_000 }); });
    if (外す) await step(3, async () => { await p.共通設定を適用.uncheck({ timeout: 20_000 }); });
    await expected(async () => {
      const 期待 = 外す ? "使える" : "使えない";
      const check = async (l: Locator, what: string) => {
        if (外す) await expect.soft(l, `${what}（${期待}）`).toBeEnabled(); else await expect.soft(l, `${what}（${期待}）`).toBeDisabled();
      };
      await check(p.バナー画像選択, "バナー画像選択");
      await check(p.バナーリンクタグ, "バナーリンクタグ");
      for (let i = 1; i <= 4; i++) {
        await check(p.タイル位置(i), `${i}行目のタイル位置`);
        await check(p.タイル属性(i), `${i}行目のタイル属性`);
        await check(p.タイルタグ(i), `${i}行目のタイルタグ`);
      }
      if (外す) note("シードの3行目はタイル属性「ピックアップ商品」。設計書（識別ID 10）は、ピックアップ商品の行のタイルタグを入力できないと定めている。期待結果の文のとおり4行ともタイルタグが使えることを確かめた");
    });
  };
}
caseTest("IT-M09-10-003", 入力制御(false));
caseTest("IT-M09-10-004", 入力制御(true));

caseTest("IT-M09-10-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const 数: Record<string, number> = {};
  await step(1, async () => { await p.開いて支店を選ぶ(東京()); });
  await step(2, async () => {
    // 編集欄が描き終わっている（タイル4行）ことを確かめてから数える
    await expect(p.タイルの行, "タイルの行（4行）").toHaveCount(4);
    for (const t of ["タイル配置のランダム化を適用", "限定品①タグ", "限定品②タグ"]) 数[t] = await p.編集欄.getByText(t).count();
  });
  await expected(async () => {
    for (const t of Object.keys(数)) expect.soft(数[t], `編集欄の「${t}」の表示数`).toBe(0);
  });
});

caseTest("IT-M09-10-011", async ({ page, step, expected }) => {
  const top = new 支店トップ(page);
  const 数: Record<string, number> = {};
  await page.setViewportSize({ width: 1280, height: 900 });
  await step(1, async () => { expect(await top.開く(LOCALの支店URL("S-M09-10-LOCAL")), "支店トップページの応答").toBe(200); await top.開いている(); });
  await step(2, async () => {
    await expect(top.ヘッダー, "画面上部のヘッダー（支店ナビゲーション）").toBeVisible();
    for (const t of ["セール商品", "最新セット"]) 数[t] = await top.ヘッダーの表示数(t);
  });
  await expected(async () => {
    for (const t of Object.keys(数)) expect.soft(数[t], `支店ナビゲーションの「${t}」の表示数`).toBe(0);
  });
  note("「支店ナビゲーション」は、支店トップページの画面上部のヘッダー（支店のカテゴリのナビゲーションを含む）と読み、その中に見えている文字を数えた");
  note(`正本の省略名「tc」は、共有の環境の本物の支店と重ならないよう、試験店舗の支店URL「${LOCALの支店URL("S-M09-10-LOCAL")}」で作った支店で確かめた`);
});

caseTest("IT-M09-10-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  await step(1, async () => { await p.開いて支店を選ぶ(東京()); });
  await step(2, async () => { await p.バナー画像を選ぶ(画像ファイル("m0910-new-banner.png", 新バナー画像())); });
  await expected(async () => {
    await expect.soft(p.バナー画像欄の画像, "バナー画像欄の画像").toBeVisible();
    const 中身 = await p.バナー画像欄の画像の中身();
    expect.soft(中身 !== null && 中身.equals(新バナー画像()), "バナー画像欄の画像の中身が、選んだ m0910-new-banner.png と同じ").toBe(true);
  });
});

caseTest("IT-M09-10-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  await step(1, async () => { await p.開いて支店を選ぶ(東京()); });
  await step(2, async () => { await p.タイル属性(1).selectOption({ label: "ピックアップ商品" }, { timeout: 20_000 }); });
  await expected(async () => {
    await expect.soft(p.タイルタグ(1), "1行目のタイルタグ（入力できない）").toBeDisabled();
  });
});

caseTest("IT-M09-10-030", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  await step(1, async () => { await p.開いて支店を選ぶ(東京()); await expect(p.バナー画像欄の画像, "登録済みのバナー画像").toBeVisible(); });
  await step(2, async () => { await p.バナー画像削除ボタン.click({ timeout: 20_000 }); });
  await expected(async () => {
    await expect.soft(p.バナー画像欄の画像, "バナー画像欄の画像").toHaveCount(0);
    expect.soft(await p.バナー画像選択.evaluate((e) => (e as HTMLInputElement).files?.length ?? 0), "バナー画像選択で選んだファイルの数").toBe(0);
    await expect.soft(p.登録済みバナー画像, "登録済みのバナー画像の値（送る値）").toHaveValue("");
  });
});

/** なりすまし対策トークンを消す・書き換えて登録しても、バナーリンクタグが更新されない */
function トークン(書き換え: "削除" | "invalid-token"): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M0910_ADMIN);
    const p = new 支店トップページ管理(page);
    const 支店ID = notes.get("〔支店ID-M0910-共有東京〕");
    await step(1, async () => { await p.開いて支店を選ぶ(東京()); });
    await step(2, async () => { await p.バナーリンクタグを選ぶ(タグ名("B")); });
    await step(3, async () => {
      await expect(p.トークン, "なりすまし対策トークンの入力要素").toHaveCount(1);
      if (書き換え === "削除") await p.トークン.evaluate((e) => e.remove());
      else await p.トークン.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 書き換え);
    });
    await step(4, async () => { await p.登録ボタンを押す(); });
    let 値 = { バナーリンクタグID: "" };
    await step(5, async () => { 値 = 支店のトップページ設定(支店ID); });
    await expected(async () => {
      expect.soft(値.バナーリンクタグID, "DBのバナーリンクタグ（M0910バナータグAのまま）").toBe(notes.get("〔タグID-M0910-共有2〕"));
      expect.soft(await p.成功の表示.count(), "保存の成功の表示").toBe(0);
    });
  };
}
caseTest("IT-M09-10-045", トークン("削除"));
caseTest("IT-M09-10-046", トークン("invalid-token"));

// ---- 登録（ケース専用の支店） ----

caseTest("IT-M09-10-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const 支店ID = notes.get("〔支店ID-M0910-017〕");
  let 設定 = { 共通設定を適用: false, バナー画像: "", バナーリンクタグID: "" };
  let tiles: ReturnType<typeof 支店のタイル> = [];
  await step(1, async () => { await p.開いて支店を選ぶ(LOCALの店名("S-M09-10-LOCAL-017")); });
  await step(2, async () => { await p.バナーリンクタグを選ぶ(タグ名("B")); });
  await step(3, async () => {
    await p.タイル属性(1).selectOption({ label: "その他" }, { timeout: 20_000 });
    await p.タイルタグ(1).selectOption({ label: タグ名("その他") }, { timeout: 20_000 });
  });
  await step(4, async () => { await p.登録ボタンを押す(); });
  await step(5, async () => { 設定 = 支店のトップページ設定(支店ID); tiles = 支店のタイル(支店ID); });
  await expected(async () => {
    expect.soft(設定.バナーリンクタグID, "DBのバナーリンクタグ（M0910バナータグB）").toBe(notes.get("〔タグID-M0910-共有3〕"));
    const t1 = tiles.find((t) => t.位置 === 1);
    expect.soft(t1?.属性 ?? "（無い）", "DBの1行目（上段右）のタイル属性").toBe("その他");
    expect.soft(t1?.タグID ?? "（無い）", "DBの1行目（上段右）のタイルタグ（M0910その他タグ）").toBe(notes.get("〔タグID-M0910-共有4〕"));
    if (t1 && t1.タイルID !== notes.get("〔タイルID-M0910-017A〕")) note(`1行目のタイルID が登録前の ${notes.get("〔タイルID-M0910-017A〕")} から ${t1.タイルID} に変わった（期待結果は値の更新だけを定める）`);
  });
});

caseTest("IT-M09-10-018", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const 店名 = LOCALの店名("S-M09-10-LOCAL-018");
  await step(1, async () => { await p.開いて支店を選ぶ(店名); });
  await step(2, async () => { await p.バナーリンクタグを選ぶ(タグ名("B")); });
  await step(3, async () => { await p.登録ボタンを押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "登録後の画面（支店トップページ管理）").toContain("/content/branch_toppage");
    await expect.soft(p.支店の選択, "支店トップページ管理の支店の選択").toBeVisible();
    expect.soft(await p.選択中の支店(), "選ばれている支店").toBe(店名);
  });
});

caseTest("IT-M09-10-027", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const 支店ID = notes.get("〔支店ID-M0910-027〕");
  let tiles: ReturnType<typeof 支店のタイル> = [];
  await step(1, async () => { await p.開いて支店を選ぶ(LOCALの店名("S-M09-10-LOCAL-027")); });
  await step(2, async () => { await p.タイル属性(1).selectOption({ label: "ピックアップ商品" }, { timeout: 20_000 }); });
  await step(3, async () => { await p.登録ボタンを押す(); });
  await step(4, async () => { tiles = 支店のタイル(支店ID); });
  await expected(async () => {
    const t1 = tiles.find((t) => t.位置 === 1);
    expect.soft(t1?.属性 ?? "（無い）", "DBの1行目（上段右）のタイル属性").toBe("ピックアップ商品");
    expect.soft(t1?.タグID ?? "（無い）", "DBの1行目（上段右）のタイルタグ（未設定）").toBe("");
    if (t1 && t1.タイルID !== notes.get("〔タイルID-M0910-027A〕")) note(`1行目のタイルID が登録前の ${notes.get("〔タイルID-M0910-027A〕")} から ${t1.タイルID} に変わった（期待結果は値の更新だけを定める）`);
  });
});

caseTest("IT-M09-10-028", async ({ page, notes, browser, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const 支店ID = notes.get("〔支店ID-M0910-028〕");
  let 旧URL = ""; let 旧の保管先 = ""; let 新の保管先 = "";
  const 公開 = { バナーURL: "", 新URLの中身: null as Buffer | null, 旧URLの状態: 0, 旧URLの中身: null as Buffer | null };
  await step(1, async () => {
    await p.開いて支店を選ぶ(LOCALの店名("S-M09-10-LOCAL-028"));
    旧URL = await p.バナー画像欄のURL();
    旧の保管先 = await p.登録済みバナー画像.inputValue();
    expect(旧URL, "差し替え前のバナー画像のURL").not.toBe("");
  });
  await step(2, async () => { await p.バナー画像を選ぶ(画像ファイル("m0910-new-banner.png", 新バナー画像())); });
  await step(3, async () => { await p.登録ボタンを押す(); });
  await step(4, async () => { 新の保管先 = 支店のトップページ設定(支店ID).バナー画像; });
  await step(5, async () => {
    await 公開側で(browser, async (front) => {
      const top = new 支店トップ(front);
      await top.開く(LOCALの支店URL("S-M09-10-LOCAL-028"));
      公開.バナーURL = await top.バナー画像のURL();
      公開.新URLの中身 = 公開.バナーURL ? (await 画像の中身(front, 公開.バナーURL)).body : null;
      const old = await 画像の中身(front, 旧URL);
      公開.旧URLの状態 = old.status; 公開.旧URLの中身 = old.body;
    });
  });
  await expected(async () => {
    expect.soft(新の保管先, "DBのバナー画像（差し替え前と違う保管先）").not.toBe(旧の保管先);
    expect.soft(新の保管先, "DBのバナー画像（空でない）").not.toBe("");
    expect.soft(公開.バナーURL.endsWith(新の保管先), "支店トップページのバナー画像のURLが、DBの新しいバナー画像を指す").toBe(true);
    expect.soft(公開.新URLの中身 !== null && 公開.新URLの中身.equals(新バナー画像()), "支店トップページのバナー画像の中身が m0910-new-banner.png と同じ").toBe(true);
    expect.soft(公開.旧URLの中身 !== null && 公開.旧URLの中身.equals(旧バナー画像()), `差し替え前のURLで以前の画像が表示される（応答 ${公開.旧URLの状態}）`).toBe(false);
  });
});

caseTest("IT-M09-10-029", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const 支店ID = notes.get("〔支店ID-M0910-029〕");
  const ファイル名 = notes.get("〔バナー画像ファイル名-M0910-029〕");
  let 保管先 = ""; let 公開のURL = ""; let 公開の画像 = 0;
  await step(1, async () => { await p.開いて支店を選ぶ(LOCALの店名("S-M09-10-LOCAL-029")); });
  await step(2, async () => { await p.バナーリンクタグを選ぶ(タグ名("B")); });
  await step(3, async () => { await p.登録ボタンを押す(); });
  await step(4, async () => { 保管先 = 支店のトップページ設定(支店ID).バナー画像; });
  await step(5, async () => {
    const top = new 支店トップ(page);
    await top.開く(LOCALの支店URL("S-M09-10-LOCAL-029"));
    await top.開いている();
    公開のURL = await top.バナー画像のURL();
    await top.バナー画像.first().scrollIntoViewIfNeeded().catch(() => {});
    公開の画像 = await top.バナー画像.first().evaluate((e) => (e as HTMLImageElement).complete ? (e as HTMLImageElement).naturalWidth : -1).catch(() => 0);
  });
  await expected(async () => {
    expect.soft(保管先.split("/").pop() ?? "", "DBのバナー画像のファイル名（保存前のまま）").toBe(ファイル名);
    expect.soft(公開のURL.split("?")[0].split("/").pop() ?? "", "支店トップページのバナー画像のファイル名").toBe(ファイル名);
    expect.soft(公開の画像 > 0, "支店トップページのバナー画像が読み込まれて表示される").toBe(true);
  });
});

caseTest("IT-M09-10-031", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const url = LOCALの支店URL("S-M09-10-LOCAL-031");
  let バナーURL = "";
  await step(1, async () => { await p.開いて支店を選ぶ(LOCALの店名("S-M09-10-LOCAL-031")); });
  await step(2, async () => { await p.バナー画像を選ぶ(画像ファイル("m0910-new-banner.png", 新バナー画像())); });
  await step(3, async () => { await p.登録ボタンを押す(); });
  await step(4, async () => {
    const top = new 支店トップ(page);
    await top.開く(url);
    await top.開いている();
    バナーURL = await top.バナー画像のURL();
  });
  await expected(async () => {
    expect.soft(/^https?:\/\//.test(バナーURL), "バナー画像のURLが外部の保管場所（S3）のホストを指す").toBe(true);
    expect.soft(new URL(バナーURL, "http://x").pathname.includes(`/banner/top/${url}/`), `バナー画像のURLのパスに「/banner/top/${url}/」が含まれる（${バナーURL}）`).toBe(true);
  });
  省略名の代え("S-M09-10-LOCAL-031", "tc-031");
  note("画像のURLは「S3のホスト/保管の入れ物の名前/banner/top/<省略名>/…」の形。ホストのあとの最初の区切りが保管の入れ物の名前なので、パスの中に「/banner/top/<省略名>/」があることを確かめた");
});

caseTest("IT-M09-10-033", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  let 名前: string[] = [];
  await step(1, async () => { await p.開いて支店を選ぶ(LOCALの店名("S-M09-10-LOCAL-033")); });
  await step(2, async () => {
    await p.バナーリンクタグを選ぶ(タグ名("A"));
    await p.登録ボタンを押す();
    await expect(p.成功の表示, "登録の成功の表示").toBeVisible();
  });
  const top = new 支店トップ(page);
  await step(3, async () => { await top.開く(LOCALの支店URL("S-M09-10-LOCAL-033")); await top.開いている(); });
  await step(4, async () => {
    await expect(top.バナーのリンク, "リンクつきのバナー画像").toHaveCount(1);
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), top.バナーのリンク.click({ timeout: 20_000 })]);
    名前 = await 商品一覧の商品名(page);
  });
  await expected(async () => {
    expect.soft(名前.some((n) => n.includes(印("BAN-001-033"))), "商品一覧のBAN-001-033").toBe(true);
    expect.soft(名前.some((n) => n.includes(印("BAN-002-033"))), "商品一覧のBAN-002-033").toBe(true);
    expect.soft(名前.filter((n) => n.includes(印("EXCLUDED-001-033"))).length, "商品一覧のEXCLUDED-001-033の表示数").toBe(0);
  });
});

// ---- 公開側のタイル（商品の支店） ----

/** 管理画面とは別のブラウザの状態（ログインしていない・日本語・幅1280px）で公開側を開く */
async function 公開側で<T>(browser: Browser, fn: (page: Page) => Promise<T>): Promise<T> {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "ja-JP" });
  await hideDebugToolbar(ctx);
  try { return await fn(await ctx.newPage()); } finally { await ctx.close(); }
}

caseTest("IT-M09-10-048", async ({ page, browser, notes, step, expected, capture }) => {
  // 公開側＝ケースのページ（ログインしていない）。管理画面は別のブラウザの状態で開く
  await page.setViewportSize({ width: 1280, height: 900 });
  const 店名 = 商品の支店の店名("S-M09-10-QI-TILE-048");
  const url = 商品の支店のURL("S-M09-10-QI-TILE-048");
  const 甲 = 印("QIタグ甲-001") + "のカード"; const 乙 = 印("QIタグ乙-001") + "のカード";
  const 商品甲 = 印("QIタイル商品甲-001"); const 商品乙 = 印("QIタイル商品乙-001");
  const top = new 支店トップ(page);
  const actx = await browser.newContext();
  await hideDebugToolbar(actx);
  const admin = await actx.newPage();
  const p = new 支店トップページ管理(admin);
  try {
    await loginAdmin(admin, QI管理者.account());
    await step(1, async () => {
      expect(await top.開く(url), `支店ID ${notes.get("〔支店ID-M0910-QI001〕")} の支店ECTOPの応答`).toBe(200);
      await expect(top.タイル見出し(甲), "タイル「QIタグ甲-001のカード」").toHaveCount(1);
      expect((await top.タイルの商品名(top.タイル見出し(甲))).some((n) => n.includes(商品甲)), "タイル「QIタグ甲-001のカード」の「QIタイル商品甲-001」").toBe(true);
      await expect(top.タイル見出し(乙), "タイル「QIタグ乙-001のカード」（無い）").toHaveCount(0);
    });
    await step(2, async () => { await p.開いて支店を選ぶ(店名); });
    await step(3, async () => {
      await expect(p.タイル属性(1).locator("option:checked"), "1行目のタイル属性（その他のまま）").toHaveText(/^\s*その他\s*$/);
      await p.タイルタグ(1).selectOption({ label: 印("QIタグ乙-001") }, { timeout: 20_000 });
    });
    await step(4, async () => {
      await p.登録ボタンを押す();
      await expect(p.成功の表示, "「保存しました」").toContainText("保存しました");
      await admin.screenshot().then((b) => test.info().attach("手順4の管理画面", { body: b, contentType: "image/png" })).catch(() => {});
    });
    await step(5, async () => { await top.開く(url); await top.開いている(); });
    await expected(async () => {
      await expect.soft(top.タイル見出し(乙), "タイル「QIタグ乙-001のカード」").toHaveCount(1);
      expect.soft((await top.タイルの商品名(top.タイル見出し(乙))).some((n) => n.includes(商品乙)), "タイル「QIタグ乙-001のカード」の「QIタイル商品乙-001」").toBe(true);
      await expect.soft(top.タイル見出し(甲), "タイル「QIタグ甲-001のカード」の表示数").toHaveCount(0);
      expect.soft(await top.商品の区画.locator(".p-hareruya-product-card__name-text", { hasText: 商品甲 }).count(), "「QIタイル商品甲-001」の表示数").toBe(0);
      await capture("手順5の支店ECTOP");
    });
  } finally { await actx.close(); }
  note("手順2〜4は管理画面用の別のブラウザの状態で操作したので、自動の画面（公開側）には映らない。手順4の管理画面は添付「手順4の管理画面」に残した");
});

caseTest("IT-M09-10-052", async ({ page, notes, step, expected }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const top = new 支店トップ(page);
  const 見出し = 印("タグ丙M0910-052") + "のカード";
  let 名前: string[] = [];
  await step(1, async () => { expect(await top.開く(商品の支店のURL("S-M09-10-DP-ONEPROD-052")), `支店ID ${notes.get("〔支店ID-M0910-052〕")} の支店ECTOPの応答`).toBe(200); await top.開いている(); });
  await step(2, async () => {
    await expect(top.タイル見出し(見出し), `タイル「タグ丙M0910-052のカード」`).toHaveCount(1);
    名前 = await top.タイルの商品名(top.タイル見出し(見出し));
  });
  await expected(async () => {
    expect.soft(名前.length, "タイル「タグ丙M0910-052のカード」の商品の数").toBe(1);
    expect.soft(名前.every((n) => n.includes(印("M0910-052-Z1"))), `タイルの商品がM0910-052-Z1（${名前.join("、")}）`).toBe(true);
  });
});

/** タイル1つの商品と、その「もっと見る」の商品一覧が、ちょうど1商品だけ */
function 一件だけのタイル(seedId: string, 支店ID呼び名: string, 見出し正本: string, code: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const top = new 支店トップ(page);
    const 見出し = 印(見出し正本) + "のカード";
    let タイル: string[] = []; let 一覧: string[] = [];
    await step(1, async () => { expect(await top.開く(商品の支店のURL(seedId)), `支店ID ${notes.get(支店ID呼び名)} の支店ECTOPの応答`).toBe(200); await top.開いている(); });
    await step(2, async () => {
      await expect(top.タイル見出し(見出し), `タイル「${見出し正本}のカード」`).toHaveCount(1);
      タイル = await top.タイルの商品名(top.タイル見出し(見出し));
    });
    await step(3, async () => {
      await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), top.もっと見る(top.タイル見出し(見出し)).click({ timeout: 20_000 })]);
      一覧 = await 商品一覧の商品名(page);
    });
    await expected(async () => {
      expect.soft(タイル.length, `タイル「${見出し正本}のカード」の商品の数`).toBe(1);
      expect.soft(タイル.every((n) => n.includes(印(code))), `タイルの商品が${code}（${タイル.join("、")}）`).toBe(true);
      expect.soft(一覧.length, "「もっと見る」で開いた商品一覧の商品の数").toBe(1);
      expect.soft(一覧.every((n) => n.includes(印(code))), `商品一覧の商品が${code}（${一覧.join("、")}）`).toBe(true);
    });
  };
}
caseTest("IT-M09-10-058", 一件だけのタイル("S-M09-10-CBFMTOWN-058", "〔支店ID-M0910-058〕", "CB-M0910-058", "M0910-058-Z1"));
caseTest("IT-M09-10-064", 一件だけのタイル("S-M09-10-CBOTHEROWN-064", "〔支店ID-M0910-064〕", "タグM0910-CB064", "M0910-064-Z1"));


// ====================================================================================================
// 2026-11-11 追加: 支店共通は書き換えず、画面で作れない準備は試験店舗・印つきの商品にだけDBで行う（seeds/m09-10.ts の冒頭）
// ====================================================================================================

const 支店共通 = "支店共通";
const 共通は読むだけ = () => note("支店共通（支店ID 1）は書き換えない方針のため、支店共通の内容はシード表の値（common-banner.png ほか）ではなく、いま登録されている内容を読んで確かめた");

type 見え方 = { 画像: Buffer | null; リンクタグ: string; タイル: [number, string, string][] };
async function 画面の見え方(p: 支店トップページ管理): Promise<見え方> {
  return {
    画像: await p.バナー画像欄の画像の中身(), リンクタグ: await p.選択中のバナーリンクタグ(),
    タイル: (await p.タイルの表示()).map((t) => [t.位置の番号, t.属性, t.タグ] as [number, string, string]),
  };
}
const タイルの値 = (tiles: ReturnType<typeof 支店のタイル>) => tiles.map((t) => [t.位置, t.属性, t.タグID]);

// ---- 支店共通の表示 ----

caseTest("IT-M09-10-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  let v: 見え方 | null = null; let 選択 = "";
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.支店を選ぶ(支店共通); 選択 = await p.選択中の支店(); v = await 画面の見え方(p); });
  await expected(async () => {
    共通は読むだけ();
    expect.soft(選択, "選んでいる支店").toBe(支店共通);
    await expect.soft(p.バナー画像欄の画像, "支店共通として登録済みのバナー画像").toBeVisible();
    expect.soft((v as 見え方).画像 !== null, "バナー画像欄の画像が読み込める").toBe(true);
    expect.soft((v as 見え方).リンクタグ, "支店共通のバナーリンクタグ（登録済み＝未選択でない）").not.toMatch(/^\s*(---)?\s*$/);
    expect.soft((v as 見え方).タイル.filter((t) => t[2] !== "" || t[1] === "ピックアップ商品").length, "支店共通として登録済みのタイルの行（タグつき、またはピックアップ商品）").toBeGreaterThan(0);
  });
});

caseTest("IT-M09-10-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.支店を選ぶ(支店共通); });
  await expected(async () => {
    const あって使える = (await p.共通設定を適用.count()) > 0 && (await p.共通設定を適用.isVisible()) && (await p.共通設定を適用.isEnabled());
    expect.soft(あって使える, "支店共通のとき、支店共通設定を適用を選択できる").toBe(false);
  });
});

caseTest("IT-M09-10-047", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  let 選択 = "";
  await step(1, async () => { await p.開く(); 選択 = await p.選択中の支店(); });
  await expected(async () => {
    expect.soft(選択, "支店の選択（支店の選択操作はしない）").toBe(支店共通);
  });
});

// ---- 支店共通設定を適用 ----

caseTest("IT-M09-10-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const 支店ID = notes.get("〔支店ID-M0910-006〕");
  const 前設定 = 支店のトップページ設定(支店ID); const 前タイル = 支店のタイル(支店ID);
  let 後設定 = 前設定; let 後タイル = 前タイル;
  await step(1, async () => { await p.開いて支店を選ぶ(LOCALの店名("S-M09-10-COMMON-APPLY-006")); });
  await step(2, async () => { await p.共通設定を適用.check({ timeout: 20_000 }); });
  await step(3, async () => { await p.登録ボタンを押す(); });
  await step(4, async () => { 後設定 = 支店のトップページ設定(支店ID); 後タイル = 支店のタイル(支店ID); });
  await expected(async () => {
    expect.soft(前設定.共通設定を適用, "保存前の支店共通設定を適用（未選択）").toBe(false);
    expect.soft(後設定.共通設定を適用, "DBの支店共通設定を適用（選択状態へ更新）").toBe(true);
    expect.soft(後設定.バナー画像, "DBの支店固有バナー画像（保存前のまま）").toBe(前設定.バナー画像);
    expect.soft(後設定.バナーリンクタグID, "DBの支店固有バナーリンクタグ（保存前のまま）").toBe(前設定.バナーリンクタグID);
    expect.soft(タイルの値(後タイル), "DBの支店固有タイル（位置・属性・タグが保存前のまま）").toEqual(タイルの値(前タイル));
  });
});

caseTest("IT-M09-10-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const 店名 = LOCALの店名("S-M09-10-COMMON-APPLY-007");
  let 共通: 見え方 | null = null; let 支店: 見え方 | null = null;
  await step(1, async () => {
    await p.開いて支店を選ぶ(店名);
    await p.共通設定を適用.check({ timeout: 20_000 });
    await p.登録ボタンを押す();
    await expect(p.成功の表示, "保存の成功の表示").toBeVisible();
  });
  await step(2, async () => { await p.支店を選ぶ(支店共通); 共通 = await 画面の見え方(p); });
  await step(3, async () => { await p.支店を選ぶ(店名); 支店 = await 画面の見え方(p); });
  await expected(async () => {
    共通は読むだけ();
    const c = 共通 as 見え方; const s = 支店 as 見え方;
    expect.soft(c.画像 !== null && s.画像 !== null && c.画像.equals(s.画像), "試験支店B-007のバナー画像が支店共通と同じ").toBe(true);
    expect.soft(s.リンクタグ, "試験支店B-007のバナーリンクタグが支店共通と同じ").toBe(c.リンクタグ);
    expect.soft(s.タイル, "試験支店B-007のタイル（位置・属性・タグ）が支店共通と同じ").toEqual(c.タイル);
  });
});

caseTest("IT-M09-10-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const 店名 = LOCALの店名("S-M09-10-COMMON-APPLY-008");
  await step(1, async () => { await p.開いて支店を選ぶ(店名); });
  await step(2, async () => { await p.共通設定を適用.check({ timeout: 20_000 }); });
  await step(3, async () => { await p.登録ボタンを押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "登録後の画面（支店トップページ管理）").toContain("/content/branch_toppage");
    await expect.soft(p.支店の選択, "支店トップページ管理の支店の選択").toBeVisible();
    expect.soft(await p.選択中の支店(), "選ばれている支店").toBe(店名);
  });
});

// ---- タイル入力欄 ----

caseTest("IT-M09-10-012", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  let tiles: Awaited<ReturnType<支店トップページ管理["タイルの表示"]>> = [];
  await step(1, async () => { await p.開いて支店を選ぶ(LOCALの店名("S-M09-10-ZERO-TILES")); });
  await step(2, async () => { tiles = await p.タイルの表示(); });
  await expected(async () => {
    expect.soft(tiles.length, "タイル位置・タイル属性・タイルタグの入力欄の行の数").toBe(4);
    for (const [i, t] of tiles.entries()) expect.soft(t.属性, `${i + 1}行目のタイル属性の初期値`).toBe("フォーマット別特集");
  });
});

caseTest("IT-M09-10-014", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  let tiles: Awaited<ReturnType<支店トップページ管理["タイルの表示"]>> = [];
  await step(1, async () => { await p.開いて支店を選ぶ(LOCALの店名("S-M09-10-PARTIAL")); });
  await step(2, async () => { tiles = await p.タイルの表示(); });
  await expected(async () => {
    expect.soft(tiles.length, "タイル入力欄の行の数（登録済み2行＋不足分2行）").toBe(4);
    expect.soft(tiles.slice(0, 2).map((t) => [t.属性, t.タグ]), "登録済みの2行（属性・タグ）").toEqual([["フォーマット別特集", タグ名("A")], ["最新エキスパンション", タグ名("B")]]);
  });
});

caseTest("IT-M09-10-015", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const 支店ID = notes.get("〔支店ID-M0910-015〕");
  let tiles: ReturnType<typeof 支店のタイル> = [];
  await step(1, async () => { await p.開いて支店を選ぶ(LOCALの店名("S-M09-10-PARTIAL-015")); });
  await step(2, async () => {
    await p.タイルを入れる(3, { 位置: 3, 属性: "その他", タグ: タグ名("その他") });
  });
  await step(3, async () => { await p.タイルを入れる(4, { 位置: 4, 属性: "ピックアップ商品", タグ: null }); });
  await step(4, async () => { await p.登録ボタンを押す(); });
  await step(5, async () => { tiles = 支店のタイル(支店ID); });
  await expected(async () => {
    expect.soft(tiles.length, "試験支店D-015のタイルの件数").toBe(4);
    const t3 = tiles.find((t) => t.位置 === 3); const t4 = tiles.find((t) => t.位置 === 4);
    expect.soft([t3?.属性, t3?.タグID], "3行目のタイル（その他・その他タグ）").toEqual(["その他", notes.get("〔タグID-M0910-共有4〕")]);
    expect.soft(t4?.属性, "4行目のタイル属性（ピックアップ商品）").toBe("ピックアップ商品");
    expect.soft(tiles.slice(0, 2).map((t) => [t.属性, t.タグID]), "1・2行目の既存のタイルは変わらない").toEqual([["フォーマット別特集", notes.get("〔タグID-M0910-共有2〕")], ["最新エキスパンション", notes.get("〔タグID-M0910-共有3〕")]]);
  });
});

// ---- バナー画像が未設定の支店 ----

function バナー未設定で登録(確かめる: "DB" | "画面"): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M0910_ADMIN);
    const p = new 支店トップページ管理(page);
    const 支店ID = notes.get("〔支店ID-M0910-共有C〕");
    const 店名 = LOCALの店名("S-M09-10-NO-BANNER");
    const 前設定 = 確かめる === "DB" ? 支店のトップページ設定(支店ID) : { 共通設定を適用: false, バナー画像: "", バナーリンクタグID: "" };
    const 前タイル = 確かめる === "DB" ? 支店のタイル(支店ID) : [];
    let 後設定 = 前設定; let 後タイル = 前タイル;
    await step(1, async () => { await p.開いて支店を選ぶ(店名); });
    await step(2, async () => { await p.バナーリンクタグを選ぶ(タグ名("B")); });
    await step(3, async () => { await p.登録ボタンを押す(); });
    if (確かめる === "DB") await step(4, async () => { 後設定 = 支店のトップページ設定(支店ID); 後タイル = 支店のタイル(支店ID); });
    await expected(async () => {
      if (確かめる === "DB") {
        expect.soft(前設定.バナー画像, "保存前のバナー画像（未設定）").toBe("");
        expect.soft(後設定.バナーリンクタグID, "DBのバナーリンクタグ（保存前の値から更新されない）").toBe(前設定.バナーリンクタグID);
        expect.soft(タイルの値(後タイル), "DBのタイル（保存前の値から更新されない）").toEqual(タイルの値(前タイル));
      } else {
        expect.soft(new URL(page.url()).pathname, "登録後の画面（支店トップページ管理）").toContain("/content/branch_toppage");
        await expect.soft(p.支店の選択, "支店トップページ管理の支店の選択").toBeVisible();
        expect.soft(await p.選択中の支店(), "選ばれている支店").toBe(店名);
      }
    });
    note("バナー画像未設定の状態は、画面では作れないため、試験店舗のバナー画像をDBで空にして作った（seeds/m09-10.ts）");
  };
}
caseTest("IT-M09-10-019", バナー未設定で登録("DB"));
caseTest("IT-M09-10-020", バナー未設定で登録("画面"));

caseTest("IT-M09-10-050", async ({ page, step, expected }) => {
  await loginAdmin(page, M0910_ADMIN);
  const p = new 支店トップページ管理(page);
  const url = LOCALの支店URL("S-M09-10-DP-NOBANNER-050");
  const top = new 支店トップ(page);
  let バナーURL = ""; let 中身: Buffer | null = null;
  await step(1, async () => { await p.開いて支店を選ぶ(LOCALの店名("S-M09-10-DP-NOBANNER-050")); });
  await step(2, async () => { await p.バナー画像を選ぶ(画像ファイル("m0910-new-banner.png", 新バナー画像())); });
  await step(3, async () => {
    await p.登録ボタンを押す();
    await expect(p.成功の表示, "「保存しました」").toContainText("保存しました");
  });
  await step(4, async () => {
    await top.開く(url); await top.開いている();
    バナーURL = await top.バナー画像のURL();
    中身 = バナーURL ? (await 画像の中身(page, バナーURL)).body : null;
  });
  await expected(async () => {
    expect.soft(中身 !== null && 中身.equals(新バナー画像()), "支店トップページのバナー画像の絵柄が、選んだ m0910-new-banner.png と同じ").toBe(true);
    expect.soft(new URL(バナーURL, "http://x").pathname.includes(`/banner/top/${url}/`), `バナー画像のURLのパスに「/banner/top/${url}/」が含まれる（${バナーURL}）`).toBe(true);
  });
  省略名の代え("S-M09-10-DP-NOBANNER-050", "m0910-050-r");
  note("バナー画像未設定の状態は、画面では作れないため、試験店舗のバナー画像をDBで空にして作った（seeds/m09-10.ts）");
});

// ---- 公開側: タイルの見出しと商品 ----

/** タグ「モダン特集」は、フォーマット別特集のタイルの見出しで「特集」を除かれる */
const 見出し = () => ({ モダン: 印("モダン特集").replace("特集", "") + "のカード", 最新: "最新エキスパンション", ピックアップ: "ピックアップ商品", 統率者: 印("統率者") + "のカード" });
const 支店FのURL = () => 商品の支店のURL("S-M09-10-PUBLIC");

async function 支店Fを開く(page: Page): Promise<支店トップ> {
  await page.setViewportSize({ width: 1280, height: 900 });
  const top = new 支店トップ(page);
  expect(await top.開く(支店FのURL()), "試験支店Fの支店トップページの応答").toBe(200);
  await top.開いている();
  return top;
}

caseTest("IT-M09-10-034", async ({ page, step, expected }) => {
  let 並び: string[] = [];
  let top!: 支店トップ;
  await step(1, async () => { top = await 支店Fを開く(page); });
  await step(2, async () => { 並び = await top.タイルの見出しの並び(); note(`4つのタイルの見出し: ${並び.join("、")}`); });
  await expected(async () => {
    const h = 見出し();
    note("タグ名・見出しには実行の印が付く（フォーマット別特集の見出しは、タグ名から「特集」を除いたもの）。正本の「モダンのカード」「統率者のカード」は印つきの「モダン-<印>のカード」「統率者-<印>のカード」");
    for (const [k, v] of Object.entries(h)) expect.soft(並び.filter((x) => x === v).length, `見出し「${v}」（${k}）の表示数`).toBe(1);
    expect.soft(並び.length, "タイルの数").toBe(4);
  });
}
);

/** タイルの「もっと見る」を押し、開いた商品一覧に、含まれる商品と含まれない商品を確かめる */
function もっと見る(見出し名: () => string, 含む: string[], 含まない: string[], 見出し表示: string): CaseBody {
  return async ({ page, step, expected }) => {
    let 一覧: string[] = [];
    let top!: 支店トップ;
    await step(1, async () => { top = await 支店Fを開く(page); });
    await step(2, async () => {
      const タイル = top.タイル見出し(見出し名());
      await expect(タイル, `タイル「${見出し表示}」`).toHaveCount(1);
      await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), top.もっと見る(タイル).click({ timeout: 20_000 })]);
      一覧 = await 商品一覧の商品名(page);
    });
    await expected(async () => {
      for (const c of 含む) expect.soft(一覧.some((n) => n.includes(印(c))), `商品一覧の${c}`).toBe(true);
      for (const c of 含まない) expect.soft(一覧.filter((n) => n.includes(印(c))).length, `商品一覧の${c}の表示数`).toBe(0);
    });
  };
}
caseTest("IT-M09-10-035", もっと見る(() => 見出し().モダン, ["FMT-001", "FMT-002"], ["EXCLUDED-001"], "モダンのカード"));
caseTest("IT-M09-10-036", もっと見る(() => 見出し().最新, ["LATEST-001", "LATEST-002"], ["EXCLUDED-001"], "最新エキスパンション"));
caseTest("IT-M09-10-037", もっと見る(() => 見出し().ピックアップ, ["PICK-001", "PICK-002"], ["EXCLUDED-001"], "ピックアップ商品"));
caseTest("IT-M09-10-038", もっと見る(() => 見出し().統率者, ["OTHER-001", "OTHER-002"], ["EXCLUDED-001"], "統率者のカード"));

caseTest("IT-M09-10-040", async ({ page, step, expected }) => {
  const 商品: Record<string, string[]> = {};
  let top!: 支店トップ;
  await step(1, async () => { top = await 支店Fを開く(page); });
  await step(2, async () => {
    const h = 見出し();
    for (const [k, v] of Object.entries(h)) 商品[k] = await top.タイルの商品名(top.タイル見出し(v));
    note(`各タイルの商品: ${Object.entries(商品).map(([k, v]) => `${k}=${v.join("・")}`).join("／")}`);
  });
  await expected(async () => {
    const だけ = (names: string[], prefix: string) => names.every((n) => 連番(prefix, 4).some((c) => n.includes(印(c))));
    for (const [k, v] of Object.entries(商品)) expect.soft(v.length, `タイル（${k}）の商品の数（3件以下）`).toBeLessThanOrEqual(3);
    expect.soft(だけ(商品.ピックアップ, "PICK"), "ピックアップ商品のタイルにはPICK系商品だけ").toBe(true);
    expect.soft(だけ(商品.モダン, "FMT"), "モダンのタイルにはモダン特集タグの商品だけ").toBe(true);
    expect.soft(だけ(商品.最新, "LATEST"), "最新エキスパンションのタイルにはM0910最新タグの商品だけ").toBe(true);
    expect.soft(だけ(商品.統率者, "OTHER"), "統率者のタイルには統率者タグの商品だけ").toBe(true);
  });
});

caseTest("IT-M09-10-043", async ({ page, step, expected }) => {
  let 前: string[] = []; let 後: string[] = [];
  let top!: 支店トップ;
  await step(1, async () => { top = await 支店Fを開く(page); 前 = await top.タイルの見出しの並び(); note(`再読み込み前の4つのタイルの並び: ${前.join("、")}`); });
  await step(2, async () => { await page.reload({ waitUntil: "load" }); await top.開いている(); 後 = await top.タイルの見出しの並び(); });
  await expected(async () => {
    const h = 見出し();
    expect.soft(前, "登録した表示位置の並び（1行目＝モダン、2行目＝最新、3行目＝ピックアップ、4行目＝統率者）").toEqual([h.モダン, h.最新, h.ピックアップ, h.統率者]);
    expect.soft(後, "再読み込み後も4つのタイルが同じ表示位置").toEqual(前);
  });
});

// ---- 公開側: そのほか ----

caseTest("IT-M09-10-041", async ({ page, step, expected }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const top = new 支店トップ(page);
  let タイル数 = 0; let 商品数 = 0;
  await step(1, async () => { expect(await top.開く(LOCALの支店URL("S-M09-10-LEGACY-NOTAG")), "試験支店Gの支店トップページの応答").toBe(200); await top.開いている(); });
  await step(2, async () => {
    タイル数 = await top.タイル.count();
    商品数 = await top.商品の区画.locator(".p-hareruya-product-carousel__item").count();
    note(`試験支店Gの支店トップページのタイル（見出しのある区画）: ${タイル数}件、商品: ${商品数}件`);
  });
  await expected(async () => {
    expect.soft(商品数, "タイルタグが未設定の登録済みタイルに商品が表示されない（支店トップページの商品の数）").toBe(0);
  });
  note("支店Gの登録済みタイルは1件（その他・タイルタグ未設定）で、ほかの3つの位置はタイル未登録（画面で作れないため、試験店舗のタイルタグ・仮のタイルをDBで書き換えて作った）。この支店には商品が無いので、商品がどこにも表示されないことで確かめた");
});

caseTest("IT-M09-10-042", async ({ page, step, expected }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const top = new 支店トップ(page);
  const 商品: string[][] = [];
  await step(1, async () => { expect(await top.開く(LOCALの支店URL("S-M09-10-ZERO-TILES")), "試験支店Eの支店トップページの応答").toBe(200); await top.開いている(); });
  await step(2, async () => {
    const n = await top.タイル.count();
    for (let i = 0; i < n; i++) 商品.push(await top.タイルの商品名(top.タイル.nth(i)));
    note(`試験支店Eの支店トップページのタイル ${n}件の商品: ${商品.map((v) => v.join("・")).join("／")}`);
  });
  await expected(async () => {
    const 六 = ["M0910-STD-001", "M0910-STD-002", "M0910-LEG-001", "M0910-LEG-002", "M0910-CMD-001", "M0910-CMD-002"].map(印);
    expect.soft(商品.length, "タイル未登録の4つの位置のタイルの数").toBe(4);
    for (const [i, v] of 商品.entries()) {
      expect.soft(v.length, `${i + 1}つ目の位置の商品の数（1件以上）`).toBeGreaterThan(0);
      expect.soft(v.every((n) => 六.some((c) => n.includes(c))), `${i + 1}つ目の位置の商品が、スタンダード・レガシー・統率者のいずれかのタグに紐づく商品（${v.join("、")}）`).toBe(true);
    }
  });
});

caseTest("IT-M09-10-051", async ({ page, step, expected }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const top = new 支店トップ(page);
  const 甲 = 印("タグ甲M0910-051") + "のカード"; const 乙 = 印("タグ乙M0910-051") + "のカード";
  const 見出し並び: string[] = []; const 商品: Record<string, string[]> = {}; const 空き: string[][] = [];
  await step(1, async () => { expect(await top.開く(商品の支店のURL("S-M09-10-DP-MIXTILE-051")), "試験支店Sの支店トップページの応答").toBe(200); await top.開いている(); });
  await step(2, async () => {
    for (const h of [甲, 乙]) { 見出し並び.push(h); 商品[h] = await top.タイルの商品名(top.タイル見出し(h)); }
  });
  await step(3, async () => {
    const n = await top.タイル.count();
    for (let i = 0; i < n; i++) {
      const t = top.タイル.nth(i);
      const 見 = ((await t.locator("h2").innerText()) ?? "").trim();
      if (見 !== 甲 && 見 !== 乙) 空き.push(await top.タイルの商品名(t));
    }
    note(`タイル未登録の位置のタイル ${空き.length}件の商品: ${空き.map((v) => v.join("・")).join("／")}`);
  });
  await expected(async () => {
    expect.soft(商品[甲]?.length, "タグ甲のタイルの商品の数").toBe(1);
    expect.soft((商品[甲] ?? []).every((n) => n.includes(印("M0910-051-K1"))), "タグ甲のタイルにはM0910-051-K1だけ").toBe(true);
    expect.soft(商品[乙]?.length, "タグ乙のタイルの商品の数").toBe(1);
    expect.soft((商品[乙] ?? []).every((n) => n.includes(印("M0910-051-O1"))), "タグ乙のタイルにはM0910-051-O1だけ").toBe(true);
    const 三 = ["M0910-051-S1", "M0910-051-L1", "M0910-051-C1"].map(印);
    expect.soft(空き.length, "タイルが登録されていない位置のタイルの数").toBe(2);
    for (const [i, v] of 空き.entries()) {
      expect.soft(v.length, `未登録の${i + 1}つ目の位置の商品の数（1件だけ）`).toBe(1);
      expect.soft(v.every((n) => 三.some((c) => n.includes(c))), `未登録の${i + 1}つ目の位置の商品がS1・L1・C1のいずれか（${v.join("、")}）`).toBe(true);
    }
  });
});

caseTest("IT-M09-10-059", async ({ page, step, expected }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const top = new 支店トップ(page);
  let 数 = -1; let 商品: string[] = [];
  await step(1, async () => { expect(await top.開く(商品の支店のURL("S-M09-10-CBLATESTNONE-059")), "支店ECTOPの応答").toBe(200); await top.開いている(); });
  await step(2, async () => {
    const t = top.タイル見出し("最新エキスパンション");
    数 = await t.count();
    商品 = 数 > 0 ? await top.タイルの商品名(t.first()) : [];
    note(`タイル「最新エキスパンション」の数: ${数}、商品: ${商品.join("・") || "なし"}`);
  });
  await expected(async () => {
    expect.soft(数, "タイトル「最新エキスパンション」のタイルが表示される").toBe(1);
    expect.soft(商品.length, "そのタイルの商品の数（1件も表示されない）").toBe(0);
  });
  note("タイルタグが空の最新エキスパンションのタイルは、画面では保存できないため、試験店舗のタイルのタイルタグをDBで空にして作った（seeds/m09-10.ts）");
});

caseTest("IT-M09-10-062", async ({ page, notes, step, expected }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const top = new 支店トップ(page);
  let タイル: string[] = []; let 一覧: string[] = [];
  const code = 印("M0910-062-Z1");
  await step(1, async () => { expect(await top.開く(商品の支店のURL("S-M09-10-CBPICKOWN-062")), `支店ID ${notes.get("〔支店ID-M0910-062〕")} の支店ECTOPの応答`).toBe(200); await top.開いている(); });
  await step(2, async () => {
    await expect(top.タイル見出し("ピックアップ商品"), "タイル「ピックアップ商品」").toHaveCount(1);
    タイル = await top.タイルの商品名(top.タイル見出し("ピックアップ商品"));
  });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), top.もっと見る(top.タイル見出し("ピックアップ商品")).click({ timeout: 20_000 })]);
    一覧 = await 商品一覧の商品名(page);
  });
  await expected(async () => {
    expect.soft(タイル.length, "タイル「ピックアップ商品」の商品の数").toBe(1);
    expect.soft(タイル.every((n) => n.includes(code)), `タイルの商品がM0910-062-Z1（${タイル.join("、")}）`).toBe(true);
    expect.soft(一覧.some((n) => n.includes(code)), "「もっと見る」で開いた商品一覧にM0910-062-Z1が表示される").toBe(true);
  });
});
