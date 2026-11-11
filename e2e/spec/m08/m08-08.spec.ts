/**
 * M08-08 手動メール通知（会員）。正本: cases/M08-08_test_cases.tsv
 * 実装したケースと解釈は記録 review/M08-08_progress_2026-11-11_dev.md。
 * 会員登録/編集画面の「手動メール通知」から開く手動メール通知(入力画面)・(確認画面)と送信を確かめる（pages/admin/m08_08_manual_mail.ts）。
 * テンプレートは開発環境に既にある手動送信用のもので読み替え（seeds/m08-08.ts）、店名・メールアドレスは本店のいまの値で確かめる。
 * 「テスト用メール受信箱」は開発環境のメールの受け口（pages/admin/m05_06_mailbox.ts）で代える。開発者ツールの操作は、画面の値をスクリプトで変えて代える。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { 会員の行の写し, 会員の送信履歴, 会員向け手動テンプレートの並び, テンプレート, 本店の基本情報 } from "../../db/m05_06";
import { CustomerManualMailPage } from "../../pages/admin/m08_08_manual_mail";
import { 受け口を控える, 届いたメール } from "../../pages/admin/m05_06_mailbox";
import { M0808_ADMIN, M0808RH_ADMIN, テンプレの読み替え, テンプレの正本の名前, 作った会員の, 自動送信の読み替え } from "../../seeds/m08-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const テンプレ = (k: keyof typeof テンプレの読み替え) => {
  const t = テンプレート(テンプレの読み替え[k]);
  if (!t) throw new Error(`テンプレート ${テンプレの読み替え[k]} が無い`);
  return t;
};
const 読み替えの注記 = (k: keyof typeof テンプレの読み替え, 末尾 = "") => supplement(`テンプレート「${テンプレの正本の名前[k]}${末尾}」は、開発環境に既にある「${テンプレ(k).名前}」で読み替えた（メール管理のテンプレートは全員が使うので足さない）`);
const 編集のパス = (会員ID: string) => new URL(adminUrl(`/customer/${会員ID}/edit`)).pathname;
const 整える = (s: string) => s.replace(/\r\n/g, "\n").replace(/[ \t　]+/g, " ").replace(/\n+/g, "\n").trim();
const 氏名の形 = (氏名: string) => new RegExp(氏名.split(" ").join("[\\s　]*"));

/** 会員の手動メール通知(入力画面)を開く（会員登録/編集画面の「手動メール通知」の行き先のアドレス） */
async function 入力画面を開く(c: CustomerManualMailPage, 会員ID: string): Promise<void> {
  const st = await c.入力画面を開く(会員ID);
  expect(st, "手動メール通知(入力画面)の応答").toBe(200);
  expect(await c.入力画面か(), "手動メール通知(入力画面)が開いた").toBe(true);
}

caseTest("IT-M08-08-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  const m = 作った会員の("S-M08-08-DATA-001");
  const c = new CustomerManualMailPage(page);
  await step(1, async () => { expect(await c.会員編集を開く(m.会員ID), "会員登録/編集画面の応答").toBe(200); });
  await step(2, async () => { await c.手動メール通知ボタンを押す(m.会員ID); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "手動メール通知(入力画面)へ遷移する").toBe(new URL(c.入力画面のURL(m.会員ID)).pathname);
    expect.soft(await c.会員名(), "会員名").toMatch(氏名の形("山田 太郎"));
  });
});

/** 002・003: アドレスを書き換えて開き、応答が 404 になる型 */
function アドレスを変えて開く(seedId: string, 変える: (url: string, 会員ID: string) => string, 何: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0808_ADMIN);
    const m = 作った会員の(seedId);
    const c = new CustomerManualMailPage(page);
    let url = ""; let st = 0;
    await step(1, async () => { await 入力画面を開く(c, m.会員ID); url = page.url(); note(`表示されたアドレス: ${url}`); });
    await step(2, async () => { const to = 変える(url, m.会員ID); st = await c.アドレスを開く(to); note(`${何}アドレス ${to} を開いた（応答 ${st}）`); });
    await expected(async () => { expect.soft(st, "応答").toBe(404); });
  };
}
caseTest("IT-M08-08-002", アドレスを変えて開く("S-M08-08-DATA-002", (u, id) => u.replace(new RegExp(`/${id}(?=/|$|\\?)`), ""), "会員ID の部分を消した"));
caseTest("IT-M08-08-003", アドレスを変えて開く("S-M08-08-DATA-003", (u, id) => u.replace(new RegExp(`/${id}(?=/|$|\\?)`), "/999999"), "会員ID を 999999 へ置き換えた"));

caseTest("IT-M08-08-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  for (const k of ["A会員", "B会員英語", "Cベースなし"] as const) 読み替えの注記(k, "-004");
  const d = 自動送信の読み替え();
  supplement(`「D-自動送信-004」（会員ベースの自動送信）は開発環境に会員ベースの自動送信テンプレートが無く足さないので、自動送信のテンプレート「${d.名前}」で読み替えた`);
  const m = 作った会員の("S-M08-08-DATA-004");
  const c = new CustomerManualMailPage(page);
  let 選択肢: { 値: string; 名前: string }[] = [];
  await step(1, async () => { await 入力画面を開く(c, m.会員ID); });
  await step(2, async () => { 選択肢 = await c.テンプレの選択肢(); note(`選択肢の数: ${選択肢.length}`); });
  await expected(async () => {
    const 三つ = (["A会員", "B会員英語", "Cベースなし"] as const).map((k) => テンプレの読み替え[k]);
    const DBの順 = 会員向け手動テンプレートの並び().map((t) => t.ID).filter((id) => 三つ.includes(id as typeof 三つ[number]));
    const 画面の順 = 選択肢.map((o) => o.値).filter((v) => 三つ.includes(v as typeof 三つ[number]));
    expect.soft(画面の順, "A・B・C（の読み替え）が選択肢にあり、テンプレ名称の昇順（DB の名前の順）で並ぶ").toEqual(DBの順);
    expect.soft(DBの順.length, "A・B・C（の読み替え）の3件").toBe(3);
    expect.soft(選択肢.map((o) => o.値), "D-自動送信（の読み替え）が選択肢に無い").not.toContain(d.ID);
  });
});

caseTest("IT-M08-08-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  const m = 作った会員の("S-M08-08-DATA-006");
  const c = new CustomerManualMailPage(page);
  const v = { テンプレ: "", 件名: "", 本文: "" };
  await step(1, async () => { await 入力画面を開く(c, m.会員ID); });
  await step(2, async () => { v.テンプレ = await c.選ばれているテンプレ(); v.件名 = await c.件名(); v.本文 = await c.本文(); });
  await expected(async () => {
    expect.soft(v.テンプレ, "テンプレートが未選択").toBe("");
    expect.soft(v.件名, "件名が空欄").toBe("");
    expect.soft(v.本文, "メール本文が空欄").toBe("");
  });
});

caseTest("IT-M08-08-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-007");
  const m = 作った会員の("S-M08-08-DATA-007");
  const c = new CustomerManualMailPage(page);
  await step(1, async () => { await 入力画面を開く(c, m.会員ID); });
  await step(2, async () => { expect(await c.テンプレを選ぶ(テンプレの読み替え.A会員), "テンプレートを選んだあとの応答").toBe(200); });
  await expected(async () => {
    const t = テンプレ("A会員");
    expect.soft(await c.件名(), "件名がテンプレートの件名").toBe(t.件名);
    const 本文 = await c.本文();
    const 名 = 本文.search(氏名の形("山田 太郎")); const 頭 = 本文.indexOf(t.ヘッダー.trim().split(/\r?\n/)[0]);
    const 案内 = 本文.indexOf(m.メール); const 尾 = 本文.lastIndexOf(t.フッター.trim().split(/\r?\n/).slice(-1)[0]);
    note(`本文の位置: 氏名 ${名}・ヘッダー ${頭}・メールアドレス ${案内}・フッター ${尾}`);
    expect.soft(名, "本文の冒頭に「山田 太郎」").toBe(0);
    expect.soft(頭 > 名, "続いてヘッダー（会員ヘッダJP の読み替え）").toBe(true);
    expect.soft(案内 > 頭, "会員名とメールアドレスを載せた案内欄がヘッダーのあと").toBe(true);
    expect.soft(本文.slice(頭, 案内), "案内欄に会員名").toMatch(氏名の形("山田 太郎"));
    expect.soft(尾 > 案内, "フッター（会員フッタJP の読み替え）が最後").toBe(true);
  });
});

caseTest("IT-M08-08-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("Cベースなし", "-009");
  const m = 作った会員の("S-M08-08-DATA-009");
  const c = new CustomerManualMailPage(page);
  await step(1, async () => { await 入力画面を開く(c, m.会員ID); });
  await step(2, async () => { expect(await c.テンプレを選ぶ(テンプレの読み替え.Cベースなし), "テンプレートを選んだあとの応答").toBe(200); });
  await expected(async () => {
    const t = テンプレ("Cベースなし");
    expect.soft(await c.件名(), "件名がテンプレートの件名").toBe(t.件名);
    const 本文 = await c.本文();
    expect.soft(整える(本文), "メール本文がヘッダーとフッターだけ").toBe(整える(`${t.ヘッダー}\n${t.フッター}`));
    expect.soft(本文, "会員名を含まない").not.toMatch(氏名の形("山田 太郎"));
    expect.soft(本文, "メールアドレスを含まない").not.toContain(m.メール);
  });
});

caseTest("IT-M08-08-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  const m = 作った会員の("S-M08-08-DATA-010");
  const c = new CustomerManualMailPage(page);
  let st = 0;
  await step(1, async () => { await 入力画面を開く(c, m.会員ID); });
  await step(2, async () => { note(`required を外した欄の数: ${await c.必須を外す(["テンプレ", "件名", "本文"])}（開発者ツールの代わりに画面のスクリプトで外した）`); });
  await step(3, async () => { await c.テンプレを空にする(); await c.件名を入れる(""); await c.本文を入れる(""); st = await c.確認を押す(); note(`確認を押したあとの応答: ${st}`); });
  await expected(async () => {
    expect.soft(await c.入力画面か(), "手動メール通知(入力画面)へ戻る").toBe(true);
    expect.soft(await c.選ばれているテンプレ(), "テンプレートが未選択").toBe("");
    expect.soft(await c.件名(), "件名が空欄").toBe("");
    expect.soft(await c.本文(), "メール本文が空欄").toBe("");
  });
});

caseTest("IT-M08-08-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-011");
  const m = 作った会員の("S-M08-08-DATA-011");
  const c = new CustomerManualMailPage(page);
  let 初め = { 件名: "", 本文: "" };
  await step(1, async () => { await 入力画面を開く(c, m.会員ID); });
  await step(2, async () => { await c.テンプレを選ぶ(テンプレの読み替え.A会員); 初め = { 件名: await c.件名(), 本文: await c.本文() }; });
  await step(3, async () => { note(`required を外した欄の数: ${await c.必須を外す(["件名", "本文"])}（開発者ツールの代わりに画面のスクリプトで外した）`); });
  await step(4, async () => { await c.件名を入れる(""); await c.本文を入れる(""); note(`確認を押したあとの応答: ${await c.確認を押す()}`); });
  await expected(async () => {
    expect.soft(await c.入力画面か(), "手動メール通知(入力画面)へ戻る").toBe(true);
    expect.soft(await c.選ばれているテンプレ(), "「A-会員-011」（の読み替え）が選択された状態").toBe(テンプレの読み替え.A会員);
    expect.soft(await c.件名(), "件名がテンプレートの初期値へ戻る").toBe(初め.件名);
    expect.soft(整える(await c.本文()), "メール本文がテンプレートの初期値へ戻る").toBe(整える(初め.本文));
  });
});

caseTest("IT-M08-08-012", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-012");
  const m = 作った会員の("S-M08-08-DATA-012");
  const c = new CustomerManualMailPage(page);
  let st = 0;
  await step(1, async () => { await 入力画面を開く(c, m.会員ID); });
  await step(2, async () => { await c.テンプレを選ぶ(テンプレの読み替え.A会員); });
  await step(3, async () => { await c.トークンを変える("invalid-token"); note("開発者ツールの代わりに、なりすまし対策トークンの値を画面のスクリプトで「invalid-token」にした"); });
  await step(4, async () => { st = await c.確認を押す(); });
  await expected(async () => { expect.soft(st, "応答").toBe(403); });
});

caseTest("IT-M08-08-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  const m = 作った会員の("S-M08-08-DATA-013");
  const c = new CustomerManualMailPage(page);
  await step(1, async () => { await 入力画面を開く(c, m.会員ID); });
  await step(2, async () => { await c.入力画面の戻るを押す(); });
  await expected(async () => { expect.soft(new URL(page.url()).pathname, "会員登録/編集画面へ遷移する").toBe(編集のパス(m.会員ID)); });
});

caseTest("IT-M08-08-014", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-014");
  const m = 作った会員の("S-M08-08-DATA-014");
  const c = new CustomerManualMailPage(page);
  let 項目: Record<string, string> = {};
  await step(1, async () => { await 入力画面を開く(c, m.会員ID); });
  await step(2, async () => { await c.テンプレを選ぶ(テンプレの読み替え.A会員); });
  await step(3, async () => { await c.件名を入れる("確認用件名Mix808"); await c.本文を入れる("確認用本文Body808"); });
  await step(4, async () => { await c.確認を押す(); 項目 = await c.確認画面の項目(); note(`確認画面の項目: ${JSON.stringify(項目)}`); });
  await expected(async () => {
    expect.soft(await c.確認画面か(), "手動メール通知(確認画面)へ遷移する").toBe(true);
    const 値 = Object.values(項目);
    expect.soft(値.some((v) => 氏名の形("山田 太郎").test(v)), "会員名「山田 太郎」が表示される").toBe(true);
    expect.soft(値, "テンプレート名（A-会員-014 の読み替え）").toContain(テンプレ("A会員").名前);
    expect.soft(値, "件名「確認用件名Mix808」").toContain("確認用件名Mix808");
    expect.soft(項目["本文"], "メール本文「確認用本文Body808」").toBe("確認用本文Body808");
  });
});

caseTest("IT-M08-08-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-015");
  const m = 作った会員の("S-M08-08-DATA-015");
  const c = new CustomerManualMailPage(page);
  let n = -1;
  await step(1, async () => { await 入力画面を開く(c, m.会員ID); });
  await step(2, async () => { await c.テンプレを選ぶ(テンプレの読み替え.A会員); });
  await step(3, async () => { await c.件名を入れる("プレビュー非更新808"); await c.本文を入れる("プレビュー本文808"); });
  await step(4, async () => { await c.確認を押す(); expect(await c.確認画面か(), "手動メール通知(確認画面)へ移った").toBe(true); });
  await step(5, async () => { n = 会員の送信履歴(m.会員ID).length; });
  await expected(async () => { expect.soft(n, `会員ID ${m.会員ID} のメール送信履歴の件数`).toBe(0); });
});

caseTest("IT-M08-08-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-016");
  const m = 作った会員の("S-M08-08-DATA-016");
  const c = new CustomerManualMailPage(page);
  await step(1, async () => { await 入力画面を開く(c, m.会員ID); });
  await step(2, async () => { await c.テンプレを選ぶ(テンプレの読み替え.A会員); });
  await step(3, async () => { await c.確認を押す(); expect(await c.確認画面か(), "手動メール通知(確認画面)へ移った").toBe(true); });
  await step(4, async () => { await c.確認画面の戻るを押す(); });
  await expected(async () => { expect.soft(new URL(page.url()).pathname, "会員登録/編集画面へ遷移する").toBe(編集のパス(m.会員ID)); });
});

/** 017〜020: テンプレートを選び（件名・本文を変え）送信する型。手順の数に合わせて、変えるかどうかを渡す */
async function 送る(c: CustomerManualMailPage, step: CaseCtx["step"], 会員ID: string, 件名?: string, 本文?: string): Promise<void> {
  let n = 1;
  await step(n++, async () => { await 入力画面を開く(c, 会員ID); });
  await step(n++, async () => { await c.テンプレを選ぶ(テンプレの読み替え.A会員); });
  if (件名 !== undefined) await step(n++, async () => { await c.件名を入れる(件名); await c.本文を入れる(本文 ?? ""); });
  await step(n++, async () => { await c.確認を押す(); expect(await c.確認画面か(), "手動メール通知(確認画面)へ移った").toBe(true); });
  await step(n++, async () => { await c.送信を押す(); note(`送信のあとの画面: ${page_url(c)}・お知らせ: ${(await c.お知らせ()).join("／") || "なし"}`); });
}
const page_url = (c: CustomerManualMailPage) => new URL(c.page.url()).pathname;
const 基本情報の注記 = () => supplement("店名・送信元/返信受付/送信エラー受付のメールアドレスは全員が使う設定なので書き換えず、本店（店舗ID 1）のいまの値と比べた（正本の値は晴れる屋テスト店・shop-from/reply/error@example.test）");

caseTest("IT-M08-08-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-017"); 基本情報の注記();
  const m = 作った会員の("S-M08-08-DATA-017");
  const b = 本店の基本情報();
  const c = new CustomerManualMailPage(page);
  const 控え = await 受け口を控える();
  await 送る(c, step, m.会員ID, "送信件名Mix808", "送信本文Body808");
  let mails: Awaited<ReturnType<typeof 届いたメール>> = [];
  await step(6, async () => { mails = await 届いたメール(m.メール, 控え, 1); note(`受けたメール: 件名「${mails[0]?.件名 ?? ""}」・To「${mails[0]?.To ?? ""}」`); });
  await expected(async () => {
    const x = mails[0];
    expect.soft(mails.length, "受信したメールの数").toBe(1);
    expect.soft((x?.To ?? "").toLowerCase(), "宛先").toContain(m.メール.toLowerCase());
    expect.soft(x?.差出人 ?? "", "差出人「店名 <送信元>」").toBe(`${b.店名} <${b.送信元}>`);
    expect.soft(x?.宛先 ?? [], "控えの配送先（BCC）が送信元").toContain(b.送信元.toLowerCase());
    expect.soft((x?.返信先 ?? "").replace(/[<>]/g, "").trim(), "返信先").toBe(b.返信先);
    expect.soft(x?.戻り先 ?? "", "返送先").toBe(b.送信エラー先.toLowerCase());
    expect.soft(x?.件名, "件名").toBe("送信件名Mix808");
    expect.soft((x?.本文 ?? "").trim(), "本文").toBe("送信本文Body808");
  });
});

caseTest("IT-M08-08-018", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-018"); 基本情報の注記();
  const m = 作った会員の("S-M08-08-DATA-018");
  const c = new CustomerManualMailPage(page);
  const 前 = new Date();
  await 送る(c, step, m.会員ID, "履歴件名Mix808", "履歴本文Body808");
  let h: ReturnType<typeof 会員の送信履歴> = [];
  await step(6, async () => { h = 会員の送信履歴(m.会員ID); note(`送信履歴: ${JSON.stringify(h.map((x) => ({ 件名: x.件名, 送信日時: x.送信日時, テンプレートID: x.テンプレートID, 作成者ID: x.作成者ID })))}`); });
  await expected(async () => {
    expect.soft(h.length, "メール送信履歴が1件追加される").toBe(1);
    const x = h[0];
    expect.soft(x?.会員ID, "会員ID").toBe(m.会員ID);
    expect.soft(x?.テンプレートID, "テンプレートID（8083018 の読み替え）").toBe(テンプレの読み替え.A会員);
    expect.soft(x?.件名, "件名").toBe("履歴件名Mix808");
    expect.soft((x?.本文 ?? "").trim(), "本文").toBe("履歴本文Body808");
    const 日時 = x ? new Date(`${x.送信日時.replace(" ", "T")}+09:00`) : new Date(0);
    expect.soft(Math.abs(日時.getTime() - 前.getTime()) < 30 * 60_000, `送信日時（${x?.送信日時 ?? ""}）が送信操作の時刻`).toBe(true);
    expect.soft(x?.作成者ID, "作成者が記録されていない").toBe("");
  });
});

caseTest("IT-M08-08-019", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-019"); 基本情報の注記();
  const m = 作った会員の("S-M08-08-DATA-019");
  const 前 = 会員の行の写し(m.会員ID);
  const c = new CustomerManualMailPage(page);
  await 送る(c, step, m.会員ID);
  let 後 = "";
  await step(5, async () => { 後 = 会員の行の写し(m.会員ID); });
  await expected(async () => {
    const a = JSON.parse(前) as Record<string, unknown>; const b = JSON.parse(後) as Record<string, unknown>;
    const 違う = Object.keys({ ...a, ...b }).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    expect.soft(違う, "送信前から値が変わった会員の項目（無いこと）").toEqual([]);
  });
});

caseTest("IT-M08-08-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-020"); 基本情報の注記();
  const m = 作った会員の("S-M08-08-DATA-020");
  const c = new CustomerManualMailPage(page);
  await 送る(c, step, m.会員ID);
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "会員登録/編集画面へ遷移する").toBe(編集のパス(m.会員ID));
    const msg = await c.お知らせ();
    expect.soft(msg.some((t) => /送信/.test(t) && /完了/.test(t)), `管理画面上部に送信完了の通知（${msg.join("／")}）`).toBe(true);
  });
});

/** 023・024: 同じ内容で2回送る型（手順1〜9。2回目は手順6で入力画面を開き直してテンプレートを選ぶ） */
async function 二回送る(c: CustomerManualMailPage, step: CaseCtx["step"], 会員ID: string, 件名: string, 本文: string): Promise<void> {
  await step(1, async () => { await 入力画面を開く(c, 会員ID); });
  await step(2, async () => { await c.テンプレを選ぶ(テンプレの読み替え.A会員); });
  await step(3, async () => { await c.件名を入れる(件名); await c.本文を入れる(本文); });
  await step(4, async () => { await c.確認を押す(); expect(await c.確認画面か(), "手動メール通知(確認画面)へ移った").toBe(true); });
  await step(5, async () => { await c.送信を押す(); });
  await step(6, async () => { await 入力画面を開く(c, 会員ID); await c.テンプレを選ぶ(テンプレの読み替え.A会員); });
  await step(7, async () => { await c.件名を入れる(件名); await c.本文を入れる(本文); });
  await step(8, async () => { await c.確認を押す(); expect(await c.確認画面か(), "手動メール通知(確認画面)へ移った").toBe(true); });
  await step(9, async () => { await c.送信を押す(); });
}

caseTest("IT-M08-08-023", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-M0808-023"); 基本情報の注記();
  const m = 作った会員の("S-M08-08-DPM-023");
  const c = new CustomerManualMailPage(page);
  await 二回送る(c, step, m.会員ID, "重ね件名M0808-023", "重ね本文M0808-023");
  let h: ReturnType<typeof 会員の送信履歴> = [];
  await step(10, async () => { h = 会員の送信履歴(m.会員ID); note(`送信履歴: ${JSON.stringify(h.map((x) => ({ 件名: x.件名, テンプレートID: x.テンプレートID })))}`); });
  await expected(async () => {
    const hit = h.filter((x) => x.会員ID === m.会員ID && x.テンプレートID === テンプレの読み替え.A会員 && x.件名 === "重ね件名M0808-023" && x.本文.trim() === "重ね本文M0808-023");
    expect.soft(hit.length, "会員・テンプレート（8083023 の読み替え）・件名・本文が一致するメール送信履歴の件数").toBe(2);
  });
});

caseTest("IT-M08-08-024", async ({ page, step, expected }) => {
  await loginAdmin(page, M0808_ADMIN);
  読み替えの注記("A会員", "-M0808-024"); 基本情報の注記();
  const m = 作った会員の("S-M08-08-DPM-024");
  const c = new CustomerManualMailPage(page);
  const 控え = await 受け口を控える();
  await 二回送る(c, step, m.会員ID, "重ね件名M0808-024", "重ね本文M0808-024");
  let mails: Awaited<ReturnType<typeof 届いたメール>> = [];
  await step(10, async () => { mails = await 届いたメール(m.メール, 控え, 2); note(`受けたメールの件名: ${mails.map((x) => x.件名).join("・")}`); });
  await expected(async () => {
    const hit = mails.filter((x) => (x.To ?? "").toLowerCase().includes(m.メール.toLowerCase()) && x.件名 === "重ね件名M0808-024" && x.本文.trim() === "重ね本文M0808-024");
    expect.soft(hit.length, "宛先・件名・本文が一致するメールの数").toBe(2);
  });
});

caseTest("IT-M08-08-025", async ({ page, step, expected, notes }) => {
  読み替えの注記("RH会員");
  supplement("店名・メールアドレス（S-M08-08-RH-SHOP）は全員が使う設定なので書き換えていない（期待結果が見ない）");
  const m = 作った会員の("S-M08-08-RH-DATA-025");
  const c = new CustomerManualMailPage(page);
  const 件名 = "RH手動件名001"; const 本文 = "RH手動本文001";
  let 前: Awaited<ReturnType<CustomerManualMailPage["配信履歴"]>> = []; let 後: typeof 前 = []; let ポップ = { 件名: "", 本文: "" };
  const 今日 = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  await step(1, async () => { await loginAdmin(page, M0808RH_ADMIN); });
  await step(2, async () => { await c.会員を検索する(m.メール); });
  await step(3, async () => { await c.行のメール履歴を押す(m.メール); 前 = await c.配信履歴(); expect(前.filter((r) => r.件名 === 件名).length, `件名「${件名}」の行が無い`).toBe(0); });
  await step(4, async () => { await 入力画面を開く(c, notes.get("〔会員ID-M0808-001〕")); });
  await step(5, async () => { await c.テンプレを選ぶ(テンプレの読み替え.RH会員); });
  await step(6, async () => { await c.件名を入れる(件名); await c.本文を入れる(本文); });
  await step(7, async () => { await c.確認を押す(); expect(await c.確認画面か(), "手動メール通知(確認画面)へ移った").toBe(true); });
  await step(8, async () => { await c.送信を押す(); });
  await step(9, async () => {
    const msg = await c.お知らせ();
    expect(msg.join("／"), "画面上部の「メール送信が完了しました。」").toContain("メール送信が完了しました。");
    expect(new URL(page.url()).pathname, "会員登録/編集画面へ遷移した").toBe(編集のパス(m.会員ID));
  });
  await step(10, async () => {
    await c.会員を検索する(m.メール); await c.行のメール履歴を押す(m.メール);
    後 = await c.配信履歴();
    const r = 後.find((x) => x.件名 === 件名);
    if (r) ポップ = await c.件名のポップアップ(r.モーダルID);
    note(`メール配信履歴の行: ${JSON.stringify(後.map((x) => ({ 処理日: x.処理日, 通知メール: x.通知メール, 件名: x.件名 })))}`);
  });
  await expected(async () => {
    const r = 後.find((x) => x.件名 === 件名);
    expect.soft(Boolean(r), `件名「${件名}」の行が表示される`).toBe(true);
    expect.soft(r?.処理日, "処理日にメール送信を実行した当日の日付").toBe(今日);
    expect.soft(r?.通知メール, "通知メールに送信に用いたテンプレート（RH-会員-001 の読み替え）の件名").toBe(テンプレ("RH会員").件名);
    expect.soft(ポップ.件名, "件名リンクのポップアップの件名").toBe(件名);
    expect.soft(ポップ.本文.trim(), "件名リンクのポップアップの本文").toBe(本文);
  });
});
