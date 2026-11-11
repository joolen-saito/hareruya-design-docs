/**
 * F06-20 配送先新規登録・変更（お届け先）。正本: cases/F06-20_test_cases.tsv
 * テストデータの読み替え（依頼者の方針 2026-11-10）は seeds/f06-20.ts の先頭と、各シードの注記（シード作成時の問題）に残す。
 * 記録 review/F06-20_progress_2026-11-04.md（029）。ほかのケースは 2026-11-10 に実装。
 */
import { Browser, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 会員の配送先の件数, 配送先の状態 } from "../../db/f06_20_k";
import { caseTest, CaseBody, CaseCtx, expect } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { openEditFromResult, searchCustomer } from "../../pages/admin/f06_customer";
import { お届け先の行, 住所リンクを押す, 配送先編集の値 } from "../../pages/admin/f06_20_delivery_k";
import { DeliveryPage, 一覧のパス, 新規のパス, 編集のパス } from "../../pages/front/f06_20_delivery_k";
import { 会員としてログインする } from "../../pages/front/f06_18_change";
import { LoginPage } from "../../pages/front/f06_03_login";
import { PC_ADMIN, 会員 } from "../../seeds/f06-20";
import "../../seeds/f06-20-b"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 数字だけ = (s: string) => s.replace(/\D/g, "");
const 空白をそろえる = (s: string) => s.replace(/[\s　]+/g, " ").trim();

/** 事前準備の「新規ブラウザセッションで本店の日本語ページを開き、…でログインする」 */
async function ログインする(page: Page, key: string): Promise<DeliveryPage> {
  const m = 会員(key);
  await page.goto(`${BASE_URL}/ja/`, { timeout: 60_000 });
  await page.waitForLoadState("load");
  await 会員としてログインする(page, m.メール, m.パスワード);
  return new DeliveryPage(page);
}
const 配送先ID = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(呼び名);

caseTest("IT-F06-20-005", async (ctx) => {
  const d = await ログインする(ctx.page, "S-F06-20-CAP20-005");
  await ctx.step(1, async () => { await d.一覧を開く(); });
  await ctx.step(2, async () => {
    await expect(d.上限のエラー.first(), "登録上限のエラー領域").toBeVisible({ timeout: 30_000 });
  });
  await ctx.expected(async () => {
    expect.soft(await d.上限のエラー.count(), "登録上限のエラー領域が表示されている").toBeGreaterThan(0);
    note(`エラー領域の文: ${await d.上限のエラー.first().innerText()}`);
    expect.soft(await d.新しい住所を追加.count(), "「新しい住所を追加」を選べない（リンクが無い）").toBe(0);
    expect.soft(d.path, "配送先一覧画面に留まる").toBe(一覧のパス);
  });
});

caseTest("IT-F06-20-007", async (ctx) => {
  const d = await ログインする(ctx.page, "S-F06-20-CAP20-007");
  await ctx.step(1, async () => { await d.一覧を開く(); });
  await ctx.step(2, async () => { await d.編集ボタンを押す(d.カード("上限確認住所01-007")); });
  await ctx.expected(async () => {
    expect.soft(d.path, "遷移した画面のアドレス（「上限確認住所01-007」の編集画面）").toBe(編集のパス(配送先ID(ctx, "〔配送先ID-F0620-007-01〕")));
    expect.soft(await d.入力画面である, "配送先新規登録・変更画面の入力フォームが表示されている").toBe(true);
    expect.soft(await d.値("address_name"), "配送先名称に「上限確認住所01-007」の情報が設定されている").toBe("上限確認住所01-007");
  });
});

const 日本の入力欄 = async (d: DeliveryPage) => ({
  郵便番号: await d.表示中("postalCode01") && await d.表示中("postalCode02"),
  都道府県: await d.表示中("pref"), 住所3: await d.表示中("addr03"), 海外郵便番号: await d.表示中("abroadPostalCode"),
});

caseTest("IT-F06-20-029", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const 結果: string[] = [];
  const 開く = async (p: string): Promise<void> => { await l.URLを開く(p); 結果.push(`${p} → ${l.path()}（ログイン画面 ${await l.ログイン画面である()}）`); };
  await step(1, async () => { await 開く("/ja/mypage/delivery"); });
  await step(2, async () => { await 開く("/ja/mypage/delivery/new/edit"); });
  await step(3, async () => { await 開く("/ja/mypage/delivery/new/edit"); });
  await expected(async () => {
    expect.soft(結果.length, "開いた画面の数").toBe(3);
    for (const r of 結果) expect.soft(r.endsWith("（ログイン画面 true）") && r.includes("→ /ja/mypage/login"), `会員ログイン画面へ誘導される: ${r}`).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 削除
// ---------------------------------------------------------------------------
const 削除の注記 = "確認のダイアログ（OK／キャンセル）は、削除ボタンを押すと開き、応えるまで画面が止まる。手順の「削除ボタンを押す」で開いたままにし、「削除確認で…を押す」の手順で応えた";

function トークン書き換えのケース(n: "033" | "034", 方法: "消す" | "invalid-token", 文: string): CaseBody {
  return async (ctx) => {
    const d = await ログインする(ctx.page, `S-F06-20-BASE-${n}`);
    const id = 配送先ID(ctx, `〔配送先ID-F0620-${n}〕`);
    let h: Awaited<ReturnType<DeliveryPage["削除ボタンを押す"]>> | undefined;
    let 状態: ReturnType<typeof 配送先の状態>;
    let 書き換える: (m: "消す" | string) => void = () => undefined;
    await ctx.step(1, async () => { await d.一覧を開く(); 書き換える = await d.削除リクエストの書き換えを用意する(); });
    await ctx.step(2, async () => { note(削除の注記); h = await d.削除ボタンを押す(d.カード(`勤務先-${n}`)); });
    await ctx.step(3, async () => {
      note(`${文}: 確認のダイアログが開いている間は画面の中の処理が止まるので、開発者ツールの代わりに、ブラウザから出る削除リクエストを送信直前に書き換える仕掛けを手順1で置き、ここで${方法 === "消す" ? "トークンを消す" : `トークンを「${方法}」にする`}指定をした`);
      書き換える(方法);
    });
    await ctx.step(4, async () => { await h!.応える("OK"); });
    await ctx.step(5, async () => { 状態 = 配送先の状態(id); });
    await ctx.expected(async () => {
      expect.soft(状態 !== undefined && !状態.削除済み, "配送先が削除済みに変わっていない").toBe(true);
    });
  };
}

// ---------------------------------------------------------------------------
// 削除リクエストの宛先（開発者ツールでの書き換えと同じ）
// ---------------------------------------------------------------------------
function 削除リクエストのケース(n: "035" | "036" | "037", seed: string, 宛先: (ctx: CaseCtx, 元: string) => string): CaseBody {
  return async (ctx) => {
    const d = await ログインする(ctx.page, seed);
    const A = n === "035" || n === "036" ? `〔配送先ID-F0620-${n}〕` : `〔配送先ID-F0620-${n}A〕`;
    const 名称 = n === "037" ? "操作会員の配送先-037" : "勤務先-" + n;
    let status = 0;
    await ctx.step(1, async () => {
      await d.一覧を開く();
      const card = d.カード(名称);
      const 元 = await d.削除のアドレス(card);
      expect(元, "削除ボタンの送り先に配送先の番号が含まれる").toContain(`/mypage/delivery/${配送先ID(ctx, A)}/delete`);
      const url = 宛先(ctx, 元);
      note(`削除リクエストは、一覧の削除ボタンと同じ送り先・メソッド（削除）・有効ななりすまし対策トークンのまま、配送先の識別子の部分だけを書き換えて、ログイン中のセッションで送った（送り先 ${url.replace(BASE_URL, "")}）`);
      status = await d.削除リクエストを送る(url, await d.トークンを読む(card));
    });
    await ctx.expected(async () => {
      expect.soft(status, "削除リクエストへの応答").toBe(404);
    });
  };
}

function 二件のうち一件を消すケース(n: "055" | "056"): CaseBody {
  return async (ctx) => {
    const d = await ログインする(ctx.page, `S-F06-20-BASE-${n}`);
    let h: Awaited<ReturnType<DeliveryPage["削除ボタンを押す"]>> | undefined;
    const 状態: Record<string, ReturnType<typeof 配送先の状態>> = {};
    await ctx.step(1, async () => { await d.一覧を開く(); });
    await ctx.step(2, async () => { note(削除の注記); h = await d.削除ボタンを押す(d.カード(`勤務先-F0620-${n}-A`)); });
    await ctx.step(3, async () => { await h!.応える("OK"); });
    if (n === "055") {
      await ctx.step(4, async () => {
        状態.A = 配送先の状態(配送先ID(ctx, "〔配送先ID-F0620-055-A〕"));
        状態.B = 配送先の状態(配送先ID(ctx, "〔配送先ID-F0620-055-B〕"));
      });
      await ctx.expected(async () => {
        expect.soft(状態.A?.削除済み, "配送先Aの記録が削除済みで残っている").toBe(true);
        expect.soft(状態.B !== undefined && !状態.B.削除済み, "配送先Bの記録が削除済みではない状態で残っている").toBe(true);
      });
    } else {
      await ctx.step(4, async () => { await d.page.waitForLoadState("load"); await expect(d.page.locator(".p-hareruya-delivery-list__container"), "再読み込みされた配送先一覧画面").toBeVisible({ timeout: 30_000 }); });
      await ctx.expected(async () => {
        expect.soft(await d.カード("勤務先-F0620-056-B").count(), "配送先名称「勤務先-F0620-056-B」の枠が一覧に表示される").toBe(1);
        expect.soft(await d.カード("勤務先-F0620-056-A").count(), "「勤務先-F0620-056-A」の枠は表示されない").toBe(0);
      });
    }
  };
}

function 禁止のケース(n: "059" | "060", 追加か編集か: "編集" | "新規"): CaseBody {
  return async (ctx) => {
    const d = await ログインする(ctx.page, `S-F06-20-${n === "059" ? "CBBLEDIT-059" : "CBBLNEW-060"}`);
    await ctx.step(1, async () => { await d.一覧を開く(); });
    await ctx.step(2, async () => {
      if (追加か編集か === "編集") await d.編集ボタンを押す(d.カード("住所01-F0620-CB059"));
      else await d.押して遷移する(d.新しい住所を追加);
      await expect(d.フォーム, "配送先新規登録・変更画面").toBeVisible({ timeout: 30_000 });
    });
    if (n === "059") {
      await ctx.step(3, async () => { await d.f("name01").fill("禁止"); await d.f("name02").fill("配送F0620CB059"); });
    } else {
      await ctx.step(3, async () => {
        await d.入力する({
          配送先名称: "新規住所-F0620-CB060", 姓: "禁止", 名: "配送F0620CB060", セイ: "キンシ", メイ: "ハイソウ", 国: "Japan", 郵便番号: "101-0021", 都道府県: "東京都",
          住所1: "千代田区外神田", 住所2: "1-1", 電話: "03-1234-5678", 会社名: "晴屋商事",
        });
        note("そのほかの必須項目（郵便番号・住所1・住所2・電話番号）には、入力チェックを通る値（101-0021・千代田区外神田・1-1・03-1234-5678）を入れた");
      });
    }
    await ctx.step(4, async () => {
      const r = await d.確認画面へ();
      if (!r.sent) note("「確認画面へ」を押したが、ブラウザ側の入力チェックが送信を止めた");
      expect(await d.確認画面である(), `配送先確認画面が表示された（入力エラー: ${(await d.エラー文()).join(" / ")}）`).toBe(true);
    });
    await ctx.step(5, async () => { await d.登録する(); });
    await ctx.expected(async () => {
      expect.soft(d.登録エラー画面である, `会員情報登録エラー画面へ遷移した（画面のアドレス ${d.path}）`).toBe(true);
    });
  };
}
caseTest("IT-F06-20-059", 禁止のケース("059", "編集"));
caseTest("IT-F06-20-060", 禁止のケース("060", "新規"));

// ---------------------------------------------------------------------------
// 管理画面との連携（ブラウザA＝フロント、ブラウザB＝管理画面）
// ---------------------------------------------------------------------------
async function ブラウザB(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  return { page: await context.newPage(), close: () => context.close() };
}
const マイページからの注記 = "配送先一覧画面は、マイページのメニューからの移動ではなく、配送先一覧のアドレスを開いて表示した";
async function 管理画面で会員を開く(ctx: CaseCtx, b: Page, メール: string): Promise<void> {
  await ctx.step(5, async () => { await loginAdmin(b, PC_ADMIN); });
  await ctx.step(6, async () => { await searchCustomer(b, メール); });
  await ctx.step(7, async () => { await openEditFromResult(b, メール); });
}

