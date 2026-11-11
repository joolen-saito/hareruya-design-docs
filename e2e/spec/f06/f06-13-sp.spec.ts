/**
 * F06-13 オンライン本人確認（スマートフォン版）。正本: cases/F06-13_test_cases.tsv
 * スマートフォン版は、iPhone の端末の印（利用者エージェント・画面の大きさ・タッチ）のブラウザで開く（F05-04 SP版・F02-02 の前例）。
 * カメラは、絵を映すテスト用カメラ入力に差し替える（pages/front/f06_13_identification.ts）。
 * 開発者ツールの操作は、ネットワーク条件のユーザーエージェント変更は CDP の指定で、画面の入力要素の書き換え・削除は画面のスクリプトで行う。
 * 買取専用メールアドレス・保存先は共有の設定。書き換えず、今の環境の設定のまま申請する（シードの注記）。
 */
import { Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { caseTest, expect } from "../../lib/case";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import * as DB from "../../db/f06_13";
import { IdentificationPage, PC版ChromeのUA, スマホ端末, テスト用カメラを用意する, マイナンバー撮影枠, 全撮影枠 } from "../../pages/front/f06_13_identification";
import { 会員 } from "../../seeds/f06-13";
import "../../seeds/f06-13";

test.use(スマホ端末);
test.beforeEach(async ({ context }) => { await テスト用カメラを用意する(context); });

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function ログインする(page: Page, n: string): Promise<IdentificationPage> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await frontLogin(page, 会員(n));
  note(`ログインに使う会員のメールアドレスは、正本の値の末尾に実行の印を付けたもの（${会員(n).メール}）`);
  return new IdentificationPage(page);
}

const 免許 = "自動車運転免許証";
async function 種類を選んで撮影画面を開く(p: IdentificationPage, 種類: string): Promise<void> {
  await p.開く();
  await p.種類を選ぶ(種類);
  await p.撮影画面へ();
  await expect(p.確定ボタン, "撮影画面").toBeVisible();
}
async function 全部撮影する(p: IdentificationPage): Promise<void> { for (const 枠 of 全撮影枠) await p.撮影する(枠); }
/** 4撮影項目を撮影し、同意チェックを付ける */
async function 撮影して同意する(p: IdentificationPage): Promise<void> { await 全部撮影する(p); await p.同意する(); }
/** 申請が何も登録されていない（画像0件・種類未設定・ステータス未確認）か */
function 変わっていない(メール: string): { 画像: number; 種類: string; ステータス: string } {
  const r = DB.選手の本人確認(メール);
  return { 画像: DB.身分証画像の記録(メール).length, 種類: r?.身分証種別 ?? "（選手なし）", ステータス: r?.本人確認ステータス ?? "（選手なし）" };
}

// ---- 003〜008: 種類の選択と撮影画面 ----
caseTest("IT-F06-13-003", async ({ page, step, expected }) => {
  const p = await ログインする(page, "003");
  let 選択肢: string[] = [], 複数選択 = true;
  const 選べた: string[] = [];
  await step(1, async () => { await p.開く(); await expect(p.種類の選択欄).toBeVisible(); });
  await step(2, async () => { 選択肢 = await p.種類の選択肢(); 複数選択 = (await p.種類の選択欄.getAttribute("multiple")) !== null; });
  await step(3, async () => {
    for (const 名 of 選択肢) { await p.種類を選ぶ(名); 選べた.push(await p.選択中の種類()); }
  });
  await expected(async () => {
    expect.soft(選択肢, "選択肢（選択して下さいの行を除く）").toEqual(["自動車運転免許証", "パスポート", "外国人登録証明書", "学生証・社員証", "身体障害者手帳", "マイナンバーカード"]);
    expect.soft(複数選択, "複数選択できるか").toBe(false);
    expect.soft(選べた, "1件ずつ選んだ結果（選んだ名前が選択中になる）").toEqual(選択肢);
    expect.soft(選択肢.includes("住民基本台帳カード"), "「住民基本台帳カード」が含まれる").toBe(false);
  });
});

caseTest("IT-F06-13-005", async ({ page, step, expected }) => {
  const p = await ログインする(page, "005");
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.種類を選ぶ(免許); });
  await step(3, async () => { await p.撮影画面へ(); });
  await expected(async () => {
    expect.soft(p.撮影画面か, `撮影画面へ遷移（実際: ${p.path}）`).toBe(true);
    expect.soft(await p.選んだ種類の入力.inputValue(), "撮影対象の身分証明書ID（1=自動車運転免許証）").toBe("1");
  });
});

caseTest("IT-F06-13-006", async ({ page, step, expected }) => {
  const p = await ログインする(page, "006");
  let 見出し: string[] = [];
  await step(1, async () => { await p.開く(); await p.種類を選ぶ("マイナンバーカード"); });
  await step(2, async () => { await p.撮影画面へ(); });
  await step(3, async () => { 見出し = await p.撮影項目の見出し; });
  await expected(async () => {
    expect.soft(見出し.length, `撮影項目の数（${見出し.join("、")}）`).toBe(マイナンバー撮影枠.length);
    expect.soft(見出し.some((t) => t.includes("現在の顔写真")), "現在の顔写真が表示される").toBe(true);
    expect.soft(見出し.some((t) => t.includes("オモテ面")), "身分証のオモテ面が表示される").toBe(true);
    expect.soft(見出し.some((t) => t.includes("斜め")), "身分証の斜めが表示される").toBe(true);
    expect.soft(見出し.some((t) => t.includes("ウラ面")), "ウラ面・別ページが表示される").toBe(false);
  });
});

caseTest("IT-F06-13-007", async ({ page, step, expected }) => {
  const p = await ログインする(page, "007");
  let 見出し: string[] = [];
  await step(1, async () => { await p.開く(); await p.種類を選ぶ(免許); });
  await step(2, async () => { await p.撮影画面へ(); });
  await step(3, async () => { 見出し = await p.撮影項目の見出し; });
  await expected(async () => {
    expect.soft(見出し.length, `撮影項目の数（${見出し.join("、")}）`).toBe(4);
    for (const k of ["現在の顔写真", "オモテ面", "ウラ面", "斜め"]) expect.soft(見出し.some((t) => t.includes(k)), `${k}の撮影項目が表示される`).toBe(true);
  });
});

caseTest("IT-F06-13-008", async ({ page, step, expected }) => {
  const p = await ログインする(page, "008");
  let 文 = "";
  await step(1, async () => { await p.開く(); await p.種類を選ぶ(免許); });
  await step(2, async () => { await p.撮影画面へ(); });
  await step(3, async () => { await expect(p.確定ボタン).toBeVisible(); 文 = await p.画面の文; });
  await expected(async () => { expect.soft(文.includes("ユーザー名"), "撮影画面に「ユーザー名」の項目が表示される").toBe(false); });
});

// ---- 014〜018: 端末・アドレス直接指定のアクセス制御 ----
caseTest("IT-F06-13-014", async ({ page, step, expected }) => {
  const p = await ログインする(page, "014");
  await step(1, async () => { await p.開く(); await p.種類を選ぶ(免許); });
  await step(2, async () => { await p.ユーザーエージェントを変える(PC版ChromeのUA); });
  await step(3, async () => { await p.撮影画面へ(); });
  await expected(async () => { expect.soft(p.スタート画面か, `オンライン本人確認のスタート画面へ戻る（実際: ${p.path}）`).toBe(true); });
});

caseTest("IT-F06-13-015", async ({ page, step, expected }) => {
  const p = await ログインする(page, "015");
  await step(1, async () => { await p.goto(`${BASE_URL}/ja/mypage/identification/photograph`); });
  await expected(async () => { expect.soft(p.スタート画面か, `オンライン本人確認のスタート画面へ戻る（実際: ${p.path}）`).toBe(true); });
});

caseTest("IT-F06-13-016", async ({ page, step, expected }) => {
  const p = await ログインする(page, "016");
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await 撮影して同意する(p); });
  await step(3, async () => { await p.ユーザーエージェントを変える(PC版ChromeのUA); });
  await step(4, async () => { await p.確定を押す(); });
  await expected(async () => { expect.soft(p.マイページか, `マイページへ遷移（実際: ${p.path}）`).toBe(true); });
});

caseTest("IT-F06-13-017", async ({ page, step, expected }) => {
  const p = await ログインする(page, "017");
  await step(1, async () => { await p.goto(`${BASE_URL}/ja/mypage/identification/complete`); });
  await expected(async () => { expect.soft(p.マイページか, `マイページへ遷移（実際: ${p.path}）`).toBe(true); });
});

caseTest("IT-F06-13-018", async ({ page, step, expected }) => {
  const p = await ログインする(page, "018");
  await step(1, async () => {
    // 身分証種別「自動車運転免許証」（身分証明書ID 1）だけをクエリに付ける
    await p.goto(`${BASE_URL}/ja/mypage/identification/complete?identification_image[identification]=1`);
    note("クエリは、撮影画面の隠し項目の名前（identification_image[identification]）に身分証種別のID 1（自動車運転免許証）を入れて付けた");
  });
  await expected(async () => { expect.soft(p.マイページか, `マイページへ遷移（実際: ${p.path}）`).toBe(true); });
});

// ---- 022・024・044・045: 申請の結果 ----
caseTest("IT-F06-13-022", async ({ page, step, expected }) => {
  const p = await ログインする(page, "022");
  let 状況 = "";
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await 全部撮影する(p); });
  await step(3, async () => { await p.同意する(); await p.確定を押す(); });
  await step(4, async () => { await expect(p.申請完了の本人確認状況).toBeVisible(); 状況 = (await p.申請完了の本人確認状況.innerText()).trim(); });
  await expected(async () => { expect.soft(状況, "申請完了画面の本人確認状況").toBe("現在、確認中です"); });
});

caseTest("IT-F06-13-024", async ({ page, step, expected }) => {
  const p = await ログインする(page, "024");
  let 結果: DB.選手の本人確認 | null = null;
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await 全部撮影する(p); });
  await step(3, async () => { await p.同意する(); await p.確定を押す(); await expect(p.申請完了の本人確認状況).toBeVisible(); });
  await step(4, async () => { 結果 = DB.選手の本人確認(会員("024").メール); });
  await expected(async () => {
    expect.soft(結果?.身分証種別, "選手情報の身分証種別").toBe("自動車運転免許証");
    expect.soft(結果?.本人確認ステータス, "選手情報の本人確認ステータス").toBe("確認中");
  });
});

caseTest("IT-F06-13-044", async ({ page, notes, step, expected }) => {
  const p = await ログインする(page, "044");
  let 記録: DB.身分証画像[] = [];
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await 全部撮影する(p); });
  await step(3, async () => { await p.同意する(); await p.確定を押す(); await expect(p.申請完了の本人確認状況).toBeVisible(); });
  await step(4, async () => { 記録 = DB.身分証画像の記録(会員("044").メール); });
  await expected(async () => {
    expect.soft(記録.length, "身分証画像の記録の件数").toBe(4);
    const 選手 = notes.get("〔選手情報ID-F0613-044〕");
    for (const r of 記録) {
      expect.soft(r.選手ID, `選手（画像種別 ${r.画像種別}）`).toBe(選手);
      expect.soft(r.身分証種別, `身分証種別（画像種別 ${r.画像種別}）`).toBe("自動車運転免許証");
    }
    // 画像種別 1=顔写真・2=表面・3=裏面・4=斜め が1件ずつ
    expect.soft(記録.map((r) => r.画像種別ID).sort(), "画像種別（顔写真・表面・裏面・斜め）が1件ずつ").toEqual(["1", "2", "3", "4"]);
  });
});

caseTest("IT-F06-13-045", async ({ page, step, expected }) => {
  const p = await ログインする(page, "045");
  let 押す直前 = 0, 確認時 = 0;
  let 記録: DB.身分証画像[] = [];
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await 全部撮影する(p); });
  await step(3, async () => { await p.同意する(); 押す直前 = Date.now(); });
  await step(4, async () => { await p.確定を押す(); });
  await step(5, async () => {
    await expect(p.申請完了の本人確認状況).toBeVisible();
    記録 = DB.身分証画像の記録(会員("045").メール);
    確認時 = Date.now();
    note("時刻の比べは、試験を流す端末の時計とアプリのサーバーの時計が合っている前提（ずれがあるとここで外れる）");
  });
  await expected(async () => {
    expect.soft(記録.length, "身分証画像の記録の件数").toBe(4);
    for (const r of 記録) {
      expect.soft(r.作成日時ミリ秒 !== null, `作成日時が空でない（画像種別 ${r.画像種別}）`).toBe(true);
      if (r.作成日時ミリ秒 !== null) {
        expect.soft(r.作成日時ミリ秒 >= 押す直前, `作成日時が押す直前の時刻以後（画像種別 ${r.画像種別}）`).toBe(true);
        expect.soft(r.作成日時ミリ秒 <= 確認時, `作成日時が確認した時刻以前（画像種別 ${r.画像種別}）`).toBe(true);
      }
    }
  });
});

// ---- 027〜030・043・048・049: 異常な入力で何も登録されない ----
caseTest("IT-F06-13-027", async ({ page, step, expected }) => {
  const p = await ログインする(page, "027");
  let 文 = "";
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await 撮影して同意する(p); });
  await step(3, async () => { await p.画像データを書き換える("現在の顔写真", "invalid-image-data"); });
  await step(4, async () => { await p.確定を押す(); 文 = await p.画面の文; });
  await expected(async () => {
    expect.soft(p.申請完了画面か, "申請完了画面になっていない").toBe(false);
    expect.soft(文.includes("画像データのアップロードに失敗しました"), `共通エラー画面の表示（実際の先頭: ${文.slice(0, 80)}）`).toBe(true);
  });
});

type Ctx = Parameters<Parameters<typeof caseTest>[1]>[0];
async function 不正な入力で申請する({ page, step }: Ctx, n: string, 操作: "画像データ" | "トークン削除" | "トークン書換"): Promise<{ 画像: number; 種類: string; ステータス: string }> {
  const p = await ログインする(page, n);
  let 結果!: { 画像: number; 種類: string; ステータス: string };
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await 撮影して同意する(p); });
  await step(3, async () => {
    if (操作 === "画像データ") await p.画像データを書き換える("現在の顔写真", "invalid-image-data");
    else if (操作 === "トークン削除") await p.トークンの入力要素を削除する();
    else await p.トークンを書き換える("invalid-token");
  });
  await step(4, async () => { await p.確定を押す(); });
  await step(5, async () => { 結果 = 変わっていない(会員(n).メール); });
  return 結果;
}
caseTest("IT-F06-13-028", async (c) => {
  const 結果 = await 不正な入力で申請する(c, "028", "画像データ");
  await c.expected(async () => {
    expect.soft(結果.画像, "身分証画像の記録の件数").toBe(0);
    expect.soft(結果.種類, "身分証種別").toBe("未設定");
    expect.soft(結果.ステータス, "本人確認ステータス").toBe("未確認");
  });
});
caseTest("IT-F06-13-029", async (c) => {
  const 結果 = await 不正な入力で申請する(c, "029", "トークン削除");
  await c.expected(async () => {
    expect.soft(結果.画像, "身分証画像の記録の件数").toBe(0);
    expect.soft(結果.種類, "身分証種別").toBe("未設定");
    expect.soft(結果.ステータス, "本人確認ステータス").toBe("未確認");
  });
});
caseTest("IT-F06-13-030", async (c) => {
  const 結果 = await 不正な入力で申請する(c, "030", "トークン書換");
  await c.expected(async () => {
    expect.soft(結果.画像, "身分証画像の記録の件数").toBe(0);
    expect.soft(結果.種類, "身分証種別").toBe("未設定");
    expect.soft(結果.ステータス, "本人確認ステータス").toBe("未確認");
  });
});

caseTest("IT-F06-13-043", async ({ page, step, expected }) => {
  const p = await ログインする(page, "043");
  let 結果!: { 画像: number; 種類: string; ステータス: string };
  await step(1, async () => { await p.開く(); await p.種類を選ぶ(免許); await p.撮影画面へ(); });
  await step(2, async () => { await expect(p.確定ボタン).toBeVisible(); 結果 = 変わっていない(会員("043").メール); });
  await expected(async () => {
      expect.soft(結果.画像, "身分証画像の記録の件数").toBe(0);
    expect.soft(結果.種類, "身分証種別").toBe("未設定");
    expect.soft(結果.ステータス, "本人確認ステータス").toBe("未確認");
  });
});

caseTest("IT-F06-13-048", async ({ page, step, expected }) => {
  const p = await ログインする(page, "048");
  let 文: string[] = [];
  let 結果!: { 画像: number; 種類: string; ステータス: string };
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await p.撮影する("現在の顔写真"); await p.同意する(); });
  await step(3, async () => { 文 = await p.確定を押してダイアログを読む(); });
  await step(4, async () => {
    const 画面の誤り = (await page.locator(".p-hareruya-identification-photograph__form .ec-errorMessage, .p-hareruya-identification-photograph__form .invalid-feedback, .p-hareruya-identification-photograph__form .c-hareruya-form__error").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    if (画面の誤り.length) 文.push(...画面の誤り);
    note(`撮影項目の入力エラーは、画面のスクリプトの確認ダイアログ（未撮影の項目を列挙する）で出る。出た文: ${文.join(" / ")}`);
  });
  await step(5, async () => { 結果 = 変わっていない(会員("048").メール); });
  await expected(async () => {
    const all = 文.join("\n");
    expect.soft(p.撮影画面か, `撮影画面が表示されたまま（実際: ${p.path}）`).toBe(true);
    expect.soft(all.includes("（表）"), "未撮影のオモテ面にエラーが出る").toBe(true);
    expect.soft(all.includes("（裏）"), "未撮影のウラ面・別ページにエラーが出る").toBe(true);
    expect.soft(all.includes("（斜め）"), "未撮影の斜めにエラーが出る").toBe(true);
    expect.soft(all.includes("本人の顔写真"), "撮影済みの顔写真にはエラーが出ない").toBe(false);
      expect.soft(結果.画像, "身分証画像の記録の件数").toBe(0);
    expect.soft(結果.種類, "身分証種別").toBe("未設定");
    expect.soft(結果.ステータス, "本人確認ステータス").toBe("未確認");
  });
});

caseTest("IT-F06-13-049", async ({ page, step, expected }) => {
  const p = await ログインする(page, "049");
  let 結果!: { 画像: number; 種類: string; ステータス: string };
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await 撮影して同意する(p); });
  await step(3, async () => { await p.ユーザーエージェントを変える(PC版ChromeのUA); });
  await step(4, async () => { await p.確定を押す(); });
  await step(5, async () => { 結果 = 変わっていない(会員("049").メール); });
  await expected(async () => {
      expect.soft(結果.画像, "身分証画像の記録の件数").toBe(0);
    expect.soft(結果.種類, "身分証種別").toBe("未設定");
    expect.soft(結果.ステータス, "本人確認ステータス").toBe("未確認");
  });
});

// ---- 033〜039: スマートフォン版の導線 ----
caseTest("IT-F06-13-033", async ({ page, step, expected }) => {
  const p = await ログインする(page, "033");
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.押して移動する(p.ホームアイコン); });
  await expected(async () => { expect.soft(p.本店ECTOPか, `遷移先（本店ECTOP）。実際: ${p.path}`).toBe(true); });
});

caseTest("IT-F06-13-034", async ({ page, step, expected }) => {
  const p = await ログインする(page, "034");
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.押して移動する(p.マイページボタン); });
  await expected(async () => { expect.soft(p.マイページか, `遷移先（マイページ）。実際: ${p.path}`).toBe(true); });
});

caseTest("IT-F06-13-035", async ({ page, step, expected }) => {
  const p = await ログインする(page, "035");
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await p.押して移動する(p.ホームアイコン); });
  await expected(async () => { expect.soft(p.本店ECTOPか, `遷移先（本店ECTOP）。実際: ${p.path}`).toBe(true); });
});

caseTest("IT-F06-13-036", async ({ page, step, expected }) => {
  const p = await ログインする(page, "036");
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await p.押して移動する(p.キャンセル); });
  await expected(async () => {
    expect.soft(p.スタート画面か, `オンライン本人確認画面へ戻る（実際: ${p.path}）`).toBe(true);
    await expect.soft(p.種類の選択欄, "オンライン本人確認画面の種類の選択欄").toBeVisible();
  });
});

/** 4枚撮影して申請し、申請完了画面を開く（037〜039 の手順1〜3） */
async function 申請して完了画面を開く(p: IdentificationPage, step: (n: number, f: () => Promise<void>) => Promise<void>): Promise<void> {
  await step(1, async () => { await 種類を選んで撮影画面を開く(p, 免許); });
  await step(2, async () => { await 全部撮影する(p); });
  await step(3, async () => { await p.同意する(); await p.確定を押す(); await expect(p.申請完了の本人確認状況, "申請完了画面").toBeVisible(); });
}

caseTest("IT-F06-13-037", async ({ page, step, expected }) => {
  const p = await ログインする(page, "037");
  await 申請して完了画面を開く(p, step);
  await step(4, async () => { await p.押して移動する(p.ホームアイコン); });
  await expected(async () => { expect.soft(p.本店ECTOPか, `遷移先（本店ECTOP）。実際: ${p.path}`).toBe(true); });
});

caseTest("IT-F06-13-038", async ({ page, step, expected }) => {
  const p = await ログインする(page, "038");
  await 申請して完了画面を開く(p, step);
  await step(4, async () => { await p.押して移動する(p.完了のマイページボタン); });
  await expected(async () => { expect.soft(p.マイページか, `遷移先（マイページ）。実際: ${p.path}`).toBe(true); });
});

caseTest("IT-F06-13-039", async ({ page, step, expected }) => {
  const p = await ログインする(page, "039");
  await 申請して完了画面を開く(p, step);
  await step(4, async () => {
    note("申請完了画面のボタンの表示名は「買取TOP」（正本の手順の「買取TOPへ」とは「へ」の有無が違う）");
    await p.押して移動する(p.買取TOPボタン);
  });
  await expected(async () => { expect.soft(/\/purchase\/?$/.test(p.path), `買取TOPへ遷移（実際: ${p.path}）`).toBe(true); });
});
