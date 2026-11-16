/**
 * M13-14 バナー設定。正本: cases/M13-14_test_cases.tsv
 *
 * 識別番号1〜15のバナー設定は、全開発環境で共有する設定。008・009・010・012・014 は、シード S-M13-14-BANNERS が全15枠の元の値を画面から控え、
 * シード表の値（画像URL before-01〜…）で保存してから始め、ケースの終わりに基盤（lib/shared_restore.ts）が元の値へ戻して確かめる（共有の書き換え。夜に1本だけで流す）。
 * 実装するのは、保存が起きない 002（画像設定のリンク。共有の設定は書き換えない）、008・009・010（送信しても入力エラーで保存されない）、012・014（画面のアラートで送られない）の6件。
 * 実装しない: 001（識別番号1〜15の並び順が1〜15であること。準備した15件の状態が前提）、003・004・005・006・007・019（保存して書き換える）、
 * 016（保存して画面へ戻る。保存を伴う）、020・021（QK連携店舗のバナー画像を用意・空にする。共有の設定の書き換え）、022（保存を2回行う）。
 *
 * 解釈:
 * - 「DBで識別番号1〜15のイベントバナー設定を確認する」は、DB には触れず、画面を開き直して全枠の内容（画像URL・リンク先URL・表示店舗・言語・
 *   表示タイプ・画像alt属性・並び順）が、操作の前と同じであることで確かめる（画面はDBの内容を表示する）。
 * - 「アラートのOKを押す」は、アラートが出たとき自動でOKを押し、出た文言を確かめる。
 * - 「識別番号3〜15の並び順へそれぞれ3〜15を入力する」（014）は、枠ごとに識別番号と同じ値を入れる。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { BannerSettingPage, 内容の一覧 } from "../../pages/admin/m13_14_banner_setting";
import { M1314_ADMIN } from "../../seeds/m13-14";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const URL先 = "https://replace-dev.hareruyamtg.com:8443/";
const a文字 = (n: number) => "a".repeat(n);

/** 保存されなかったことを、画面を開き直して全枠の内容を読んで確かめる */
async function 開き直して読む(p: BannerSettingPage): Promise<string[]> {
  await p.開く();
  note("DB には触れず、バナー設定画面を開き直して全枠の内容を読み、操作の前と比べた（画面はDBの内容を表示する）");
  return 内容の一覧(await p.全枠を読む());
}

caseTest("IT-M13-14-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1314_ADMIN("002"));
  const p = new BannerSettingPage(page);
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    await p.画像設定へのリンク.click();
    // 画面が画像設定欄まで動き終わるのを待つ（動いている途中や、動く前の画面を手順の画像に撮らない）
    await expect(page.locator("#upload_wrap"), "画像設定欄まで画面が動いた").toBeInViewport({ timeout: 15_000 });
    await page.waitForTimeout(800);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).hash, "移った先のアドレスの位置（画像設定欄）").toBe("#upload_wrap");
    await expect.soft(page.locator("#upload_wrap"), "画像設定欄").toBeInViewport();
    // 画面が動いたあとの見えている範囲に、画像設定欄のアップロードの操作が写ることを示す
    await expect.soft(page.locator("#upload_wrap").getByRole("button", { name: "アップロード", exact: true }), "画像設定欄のアップロードボタンが、画面が動いたあとの見えている範囲に表示されている").toBeInViewport();
  });
});


/** 開始時の状態（シード表の値）が画面に出ていること。出ていなければ、準備が効いていないので止める */
async function シード表の値か(p: BannerSettingPage): Promise<void> {
  const 全 = await p.全枠を読む();
  expect(全.length, "バナー設定の枠の数").toBe(15);
  for (const x of 全) {
    const nn = String(x.識別番号).padStart(2, "0");
    expect(x.画像URL, `識別番号${x.識別番号}の画像URL（準備した値）`).toBe(`${URL先}before-${nn}.png`);
    expect(x.画像alt属性, `識別番号${x.識別番号}の画像alt属性（準備した値）`).toBe(`変更前${nn}`);
    expect(x.並び順, `識別番号${x.識別番号}の並び順（準備した値）`).toBe(String(x.識別番号));
  }
}

type 流した結果 = { 前: string[]; 後: string[]; エラー: string[]; 出た: string[] };

/** 008・009・010: 送信して入力エラーになり、保存されない */
async function 入力エラーを流す({ page, step }: CaseCtx, n: string, 内容: (p: BannerSettingPage) => Promise<void>, 代替: string): Promise<流した結果> {
  await loginAdmin(page, M1314_ADMIN(n));
  const p = new BannerSettingPage(page);
  const r: 流した結果 = { 前: [], 後: [], エラー: [], 出た: [] };
  await step(1, async () => { await p.開く(); r.前 = 内容の一覧(await p.全枠を読む()); await シード表の値か(p); });
  await step(2, async () => { await 内容(p); });
  await step(3, async () => { await p.入力する("image_alt", 2, 代替); });
  await step(4, async () => { await p.バナー設定ボタン.click(); await page.waitForLoadState("load"); r.エラー = await p.エラーの表示(); });
  await step(5, async () => { r.後 = await 開き直して読む(p); });
  return r;
}

/** 012・014: 並び順の空欄・重複で、画面のアラートが出て送られない */
async function アラートを流す({ page, step }: CaseCtx, n: string, 並べる: (p: BannerSettingPage, 枠: number[]) => Promise<void>, altの枠: number, 代替: string): Promise<流した結果> {
  await loginAdmin(page, M1314_ADMIN(n));
  const p = new BannerSettingPage(page);
  const r: 流した結果 = { 前: [], 後: [], エラー: [], 出た: [] };
  let 枠: number[] = [];
  await step(1, async () => {
    await p.開く();
    const 全 = await p.全枠を読む();
    r.前 = 内容の一覧(全);
    枠 = 全.map((x) => x.識別番号);
    await シード表の値か(p);
  });
  // 012 は手順2で並び順とalt属性をまとめて行う（5手順）。014 は手順2が並び順、手順3がalt属性（6手順）
  let s = 2;
  if (n === "012") {
    await step(s++, async () => { await 並べる(p, 枠); await p.入力する("image_alt", altの枠, 代替); });
  } else {
    await step(s++, async () => { await 並べる(p, 枠); });
    await step(s++, async () => { await p.入力する("image_alt", altの枠, 代替); });
  }
  await step(s++, async () => {
    page.on("dialog", (d) => { r.出た.push(d.message()); void d.accept(); });
    await p.バナー設定ボタン.click();
    await page.waitForTimeout(1000);
  });
  await step(s++, async () => {
    note(`アラートが出たので OK を押した（出た文言: ${r.出た.join(" / ") || "なし"}）`);
  });
  await step(s++, async () => { r.後 = await 開き直して読む(p); });
  return r;
}

const 更新されない = "識別番号1〜15のイベントバナー設定が保存前の内容から更新されない";

caseTest("IT-M13-14-008", async (c) => {
  const r = await 入力エラーを流す(c, "008", async (p) => {
    await p.入力する("image_url", 1, URL先 + a文字(215));
    await p.入力する("link", 1, URL先 + a文字(215));
  }, "部分保存確認");
  await c.expected(async () => {
    expect.soft(r.エラー.length, `送信後の入力エラーの表示（${r.エラー.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    expect.soft(r.後, 更新されない).toEqual(r.前);
  });
});

caseTest("IT-M13-14-009", async (c) => {
  const r = await 入力エラーを流す(c, "009", async (p) => {
    await p.入力する("image_url", 1, "ｈｔｔｐｓ：／／ｅｘａｍｐｌｅ．ｔｅｓｔ／ｉｍａｇｅ．ｐｎｇ");
    await p.入力する("link", 1, "ｈｔｔｐｓ：／／ｅｘａｍｐｌｅ．ｔｅｓｔ／ｌｉｎｋ");
  }, "文字種部分保存確認");
  await c.expected(async () => {
    expect.soft(r.エラー.length, `送信後の入力エラーの表示（${r.エラー.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    expect.soft(r.後, 更新されない).toEqual(r.前);
  });
});

caseTest("IT-M13-14-010", async (c) => {
  const r = await 入力エラーを流す(c, "010", async (p) => {
    await p.入力する("image_url", 1, "https://admin.hareruyamtg.com/m13-14.png");
  }, "ドメイン部分保存確認");
  await c.expected(async () => {
    expect.soft(r.エラー.length, `送信後の入力エラーの表示（${r.エラー.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    expect.soft(r.後, 更新されない).toEqual(r.前);
  });
});

caseTest("IT-M13-14-012", async (c) => {
  const r = await アラートを流す(c, "012", async (p) => { await p.入力する("sort_no", 1, ""); }, 2, "空欄部分保存確認");
  await c.expected(async () => {
    expect.soft(r.出た.join(" / "), "表示されたアラートの文言").toMatch(/並び順が空/);
    expect.soft(r.後, 更新されない).toEqual(r.前);
  });
});

caseTest("IT-M13-14-014", async (c) => {
  const r = await アラートを流す(c, "014", async (p, 枠) => {
    await p.入力する("sort_no", 1, "1");
    await p.入力する("sort_no", 2, "1");
    for (const n of 枠.filter((x) => x >= 3)) await p.入力する("sort_no", n, String(n));
  }, 3, "重複部分保存確認");
  await c.expected(async () => {
    expect.soft(r.出た.join(" / "), "表示されたアラートの文言").toMatch(/同じ並び順があります/);
    expect.soft(r.後, 更新されない).toEqual(r.前);
  });
});
