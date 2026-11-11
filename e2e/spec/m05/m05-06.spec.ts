/**
 * M05-06 メール一括送信機能。正本: cases/M05-06_test_cases.tsv
 * 実装したケースと解釈は記録 review/M05-06_progress_2026-11-11_dev.md。
 * 受注情報検索 一覧(検索結果)で受注を選び「その他」→「メール一括送信」で開くメール一括送信画面と、手動メール通知(確認画面)の送信を確かめる。
 * テンプレートは開発環境に既にある手動送信用のもので読み替え（seeds/m05-06.ts）、基本情報は本店のいまの値で確かめる。
 * 「メール受信確認画面」は開発環境のメールの受け口（pages/admin/m05_06_mailbox.ts）で代える。開発者ツールの操作は、画面の値をスクリプトで変えて代える。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { テンプレート, 本店の基本情報, 受注の送信履歴, 受注の行の写し } from "../../db/m05_06";
import { MailAllPage, OrderManualMailPage, 一覧で受注を選ぶ } from "../../pages/admin/m05_06_mail_all";
import { 受け口を控える, 届いたメール } from "../../pages/admin/m05_06_mailbox";
import { M0506_ADMIN, M0506RE_ADMIN, テンプレの読み替え, 作った受注の, 作った受注 } from "../../seeds/m05-06";
import { CustomerManualMailPage } from "../../pages/admin/m08_08_manual_mail";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 一覧のパス = new URL(adminUrl("/order")).pathname;
const テンプレ = (k: keyof typeof テンプレの読み替え) => {
  const t = テンプレート(テンプレの読み替え[k]);
  if (!t) throw new Error(`テンプレート ${テンプレの読み替え[k]} が無い`);
  return t;
};
const 読み替えの注記 = (k: keyof typeof テンプレの読み替え) => supplement(`テンプレート「${k === "RE連携" ? "M0506RE連携テンプレ" : `M0506${k}`}」は、開発環境に既にある「${テンプレ(k).名前}」で読み替えた（メール管理のテンプレートは全員が使うので足さない）`);
const 氏名の形 = (氏名: string) => new RegExp(氏名.split(" ").join("[\\s　]*"));

/** 受注一覧で受注を選び、「その他」→「メール一括送信」でメール一括送信画面を開く */
async function 選んで開く(page: Page, seedId: string, 番号: string): Promise<{ s: MailAllPage; 受注: 作った受注[] }> {
  const 受注 = 作った受注の(seedId);
  const list = await 一覧で受注を選ぶ(page, `m0506-${番号}`, 受注.map((o) => o.注文番号));
  const r = await MailAllPage.一覧から開く(list);
  if (r.警告の文.length) note(`メール一括送信を押したときの確認の窓: ${r.警告の文.join("／")}`);
  const s = new MailAllPage(page);
  expect(await s.入力画面か(), "メール一括送信画面が開いた").toBe(true);
  return { s, 受注 };
}

/** テンプレートを選び（件名を入れ）「確認」を押す */
async function 選んで確認(s: MailAllPage, k: keyof typeof テンプレの読み替え, 件名?: string): Promise<void> {
  await s.テンプレを選ぶ(テンプレの読み替え[k]);
  if (件名 !== undefined) await s.件名を入れる(件名);
  await s.確認を押す();
  expect(await s.確認画面か(), "手動メール通知(確認画面)へ移った").toBe(true);
}

caseTest("IT-M05-06-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  const o = 作った受注の("S-M05-06-ORDERS-001")[0];
  let list!: Awaited<ReturnType<typeof 一覧で受注を選ぶ>>;
  let r!: Awaited<ReturnType<typeof MailAllPage.一覧から開く>>;
  await step(1, async () => {
    list = await 一覧で受注を選ぶ(page, "m0506-001", []);
    await expect(list.結果の行(o.注文番号), `検索結果に注文番号 ${o.注文番号} の行がある`).toHaveCount(1);
    note("受注情報検索 一覧(検索入力)でメールアドレスの一部「m0506-001」で検索して、検索結果の画面を開いた");
  });
  await step(2, async () => {
    for (const b of await page.locator('table#search_result input[id^="check_"]').all()) if (await b.isChecked()) await b.uncheck({ force: true });
    await page.locator("#check-all, #toggle_check_all").first().uncheck({ force: true }).catch(() => undefined);
    expect(await page.locator('table#search_result input[id^="check_"]:checked').count(), "チェックの入った受注の数").toBe(0);
  });
  await step(3, async () => { r = await MailAllPage.一覧から開く(list); note(`確認の窓: ${r.警告の文.join("／") || "なし"}・移った先: ${r.移った先 || "移らない"}`); });
  await expected(async () => {
    expect.soft(/\/order\/manual_mail\/mail_all/.test(new URL(page.url()).pathname), "メール一括送信画面が表示されない").toBe(false);
  });
});

caseTest("IT-M05-06-002", async ({ page, step, expected, notes }) => {
  await loginAdmin(page, M0506_ADMIN);
  let s!: MailAllPage;
  await step(1, async () => {
    ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-002", "002"));
    const ids = await s.送信対象の配送ID();
    note(`メール一括送信画面を開く要求の送信対象（配送の番号）: ${ids.join("・")}`);
    expect(ids, "送信対象の配送の番号").toEqual([notes.get("〔配送レコードID-M0506-002〕")]);
  });
  let status = 0;
  await step(2, async () => {
    status = await s.配送IDで開く([notes.get("〔配送レコードID-M0506-002〕"), "999999"]);
    note(`開発者ツールの代わりに、送信対象に 999999 を足したアドレスで画面を開く要求を送った（応答 ${status}・移った先 ${page.url()}）`);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "受注情報検索・一覧画面へ遷移する").toBe(一覧のパス);
    note(`画面のお知らせ: ${(await s.お知らせ()).join("／") || "なし"}`);
  });
});

caseTest("IT-M05-06-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  let s!: MailAllPage; let 本文 = "";
  await step(1, async () => { ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-003", "003")); });
  await step(2, async () => { expect(await s.選ばれているテンプレ(), "テンプレ選択は未選択").toBe(""); 本文 = await s.本文(); });
  await expected(async () => { expect.soft(本文, "本文が空欄").toBe(""); });
});

caseTest("IT-M05-06-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA"); 読み替えの注記("テンプレB");
  let s!: MailAllPage;
  await step(1, async () => { ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-005", "005")); });
  await step(2, async () => { await s.テンプレを選ぶ(テンプレの読み替え.テンプレA); });
  await step(3, async () => { await s.テンプレを選ぶ(テンプレの読み替え.テンプレB); });
  await expected(async () => {
    const b = テンプレ("テンプレB");
    expect.soft(await s.件名(), "件名がテンプレBの件名").toBe(b.件名);
    expect.soft((await s.ヘッダーの値()).replace(/\r\n/g, "\n"), "本文（ヘッダー）がテンプレBの本文").toBe(b.ヘッダー.replace(/\r\n/g, "\n"));
    expect.soft((await s.フッターの値()).replace(/\r\n/g, "\n"), "本文（フッター）がテンプレBの本文").toBe(b.フッター.replace(/\r\n/g, "\n"));
  });
});

/** 006・012・015: 送信して受け口でメールを数える型 */
caseTest("IT-M05-06-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA"); 読み替えの注記("テンプレB");
  supplement("支店受注〔注文番号-M0506-006B〕は、本店の受注（注文者「支店 花子」の別の会員）として作った（支店の受注は画面で作れない）");
  let s!: MailAllPage; let 受注!: 作った受注[]; let 控え!: Set<number>;
  await step(1, async () => { ({ s, 受注 } = await 選んで開く(page, "S-M05-06-ORDERS-006", "006")); });
  await step(2, async () => { await s.テンプレを選ぶ(テンプレの読み替え.テンプレA); });
  await step(3, async () => { await s.テンプレを選ぶ(テンプレの読み替え.テンプレB); });
  await step(4, async () => { await s.確認を押す(); expect(await s.確認画面か(), "手動メール通知(確認画面)へ移った").toBe(true); note(`確認画面の送信対象: ${JSON.stringify(await s.送信対象())}`); });
  await step(5, async () => { 控え = await 受け口を控える(); const r = await s.送信を押す(true); note(`確認の窓: ${r.確認の文.join("／")}`); });
  const 届いた: Record<string, number> = {};
  await step(6, async () => { for (const o of 受注) 届いた[o.メール] = (await 届いたメール(o.メール, 控え, 1)).length; note(`受け口に届いた数: ${JSON.stringify(届いた)}`); });
  await expected(async () => {
    for (const o of 受注) expect.soft(届いた[o.メール], `${o.氏名}（${o.メール}）へのメールの数`).toBe(1);
  });
});

caseTest("IT-M05-06-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("注文者名なし");
  let s!: MailAllPage; let 本文 = "";
  await step(1, async () => { ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-007", "007")); });
  await step(2, async () => { await s.テンプレを選ぶ(テンプレの読み替え.注文者名なし); });
  await step(3, async () => { 本文 = await s.本文(); note(`メッセージ本文の先頭: ${本文.slice(0, 120)}`); });
  await expected(async () => { expect.soft(本文, "メッセージ本文に注文者名（本店 太郎）が出ない").not.toMatch(氏名の形("本店 太郎")); });
});

caseTest("IT-M05-06-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  let s!: MailAllPage;
  await step(1, async () => { ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-008", "008")); });
  await step(2, async () => { note(`押したリンク: ${await s.左下の戻るの文()}`); const d = await s.左下の戻るを押す(); if (d.length) note(`確認の窓: ${d.join("／")}`); });
  await expected(async () => { expect.soft(new URL(page.url()).pathname, "受注一覧画面へ遷移する").toBe(一覧のパス); });
});

caseTest("IT-M05-06-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA");
  let s!: MailAllPage;
  await step(1, async () => { ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-010", "010")); });
  await step(2, async () => { await 選んで確認(s, "テンプレA"); });
  await step(3, async () => { note(`押したリンク: ${await s.左下の戻るの文()}`); await s.左下の戻るを押す(); });
  await expected(async () => { expect.soft(await s.入力画面か(), "メール一括送信画面へ遷移する").toBe(true); });
});

caseTest("IT-M05-06-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA");
  let s!: MailAllPage; let r!: { 確認の文: string[]; 移った: boolean }; let 控え!: Set<number>;
  const o = 作った受注の("S-M05-06-ORDERS-011")[0];
  await step(1, async () => { ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-011", "011")); });
  await step(2, async () => { await 選んで確認(s, "テンプレA"); });
  await step(3, async () => { 控え = await 受け口を控える(); r = await s.送信を押す(false); note(`確認の窓: ${r.確認の文.join("／") || "出ない"}`); });
  await step(4, async () => { expect(r.確認の文.length, "確認ダイアログが出た").toBeGreaterThan(0); note("確認ダイアログの「キャンセル」を押した（手順3の送信の押下で出た確認の窓を、キャンセルで閉じた）"); });
  await expected(async () => {
    expect.soft(await s.確認画面か(), "手動メール通知(確認画面)に留まる").toBe(true);
    expect.soft(r.移った, "画面が移らない").toBe(false);
    note(`キャンセルのあと受け口に届いた数: ${(await 届いたメール(o.メール, 控え, 0, 10)).length}`);
  });
});

caseTest("IT-M05-06-012", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA");
  let s!: MailAllPage; let 控え!: Set<number>; let n = 0;
  const o = 作った受注の("S-M05-06-ORDERS-012")[0];
  await step(1, async () => { ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-012", "012")); });
  await step(2, async () => { await 選んで確認(s, "テンプレA"); });
  let pending!: Promise<{ 確認の文: string[]; 移った: boolean }>;
  await step(3, async () => { 控え = await 受け口を控える(); pending = s.送信を押す(true); });
  await step(4, async () => { const r = await pending; note(`確認の窓（OK を押した）: ${r.確認の文.join("／")}`); });
  await step(5, async () => { n = (await 届いたメール(o.メール, 控え, 1)).length; note(`${o.メール} あてに届いた数: ${n}`); });
  await expected(async () => { expect.soft(n, `受注 ${o.注文番号} のメールアドレスへのメールの数`).toBe(1); });
});

caseTest("IT-M05-06-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA");
  let s!: MailAllPage;
  await step(1, async () => { ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-013", "013")); });
  await step(2, async () => { await 選んで確認(s, "テンプレA"); });
  let pending!: Promise<{ 確認の文: string[]; 移った: boolean }>;
  await step(3, async () => { pending = s.送信を押す(true); });
  await step(4, async () => { const r = await pending; note(`確認の窓（OK を押した）: ${r.確認の文.join("／")}・お知らせ: ${(await s.お知らせ()).join("／")}`); });
  await expected(async () => { expect.soft(new URL(page.url()).pathname, "受注情報検索・一覧画面へ遷移する").toBe(一覧のパス); });
});

caseTest("IT-M05-06-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA");
  supplement("支店受注〔注文番号-M0506-015B〕は、本店の受注（注文者「支店 花子」の別の会員）として作った（支店の受注は画面で作れない）");
  let s!: MailAllPage; let 受注!: 作った受注[]; let 控え!: Set<number>;
  const mails: Record<string, { 件名: string; 本文: string }[]> = {};
  await step(1, async () => { ({ s, 受注 } = await 選んで開く(page, "S-M05-06-ORDERS-015", "015")); });
  await step(2, async () => { await s.テンプレを選ぶ(テンプレの読み替え.テンプレA); await s.件名を入れる("共通件名0506"); });
  await step(3, async () => { await s.確認を押す(); expect(await s.確認画面か(), "手動メール通知(確認画面)へ移った").toBe(true); });
  await step(4, async () => { 控え = await 受け口を控える(); await s.送信を押す(true); });
  await step(5, async () => { for (const o of 受注) mails[o.メール] = (await 届いたメール(o.メール, 控え, 1)).map((m) => ({ 件名: m.件名, 本文: m.本文 })); });
  await expected(async () => {
    for (const o of 受注) {
      const m = mails[o.メール] ?? [];
      expect.soft(m.length, `${o.氏名} へのメールの数`).toBe(1);
      expect.soft(m[0]?.件名, `${o.氏名} へのメールの件名`).toBe("共通件名0506");
      expect.soft(m[0]?.本文 ?? "", `${o.氏名} へのメールの本文に注文番号 ${o.注文番号}`).toContain(o.注文番号);
      expect.soft(m[0]?.本文 ?? "", `${o.氏名} へのメールの本文に注文者氏名`).toMatch(氏名の形(o.氏名));
    }
    const [a, b] = 受注.map((o) => mails[o.メール]?.[0]?.本文 ?? "");
    expect.soft(a !== b, "2通の本文がそれぞれ違う内容").toBe(true);
  });
});

caseTest("IT-M05-06-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA");
  const b = 本店の基本情報();
  supplement("基本情報（店名・メールアドレス1/3/4）は全員が使う設定なので書き換えず、本店（店舗ID 1）のいまの値と比べた（正本の値は晴屋M0506店・shop-/reply-/return-m0506@example.test）");
  let s!: MailAllPage; let 控え!: Set<number>;
  const o = 作った受注の("S-M05-06-DETAIL-017")[0];
  let m: Awaited<ReturnType<typeof 届いたメール>> = [];
  await step(1, async () => { ({ s } = await 選んで開く(page, "S-M05-06-DETAIL-017", "017")); });
  await step(2, async () => { await 選んで確認(s, "テンプレA"); });
  await step(3, async () => { 控え = await 受け口を控える(); await s.送信を押す(true); });
  await step(4, async () => { m = await 届いたメール(o.メール, 控え, 1); note(`受けたメール: To「${m[0]?.To ?? ""}」・From「${(m[0]?.差出人 ?? "").replace(/<.*>/, "<本店の送信元>")}」`); });
  await expected(async () => {
    const x = m[0];
    expect.soft(m.length, "受注のメールアドレスへのメールの数").toBe(1);
    expect.soft((x?.To ?? "").toLowerCase(), "宛先が受注のメールアドレス").toContain(o.メール.toLowerCase());
    expect.soft(x?.差出人 ?? "", "差出人が「店名 <送信元メールアドレス>」").toBe(`${b.店名} <${b.送信元}>`);
    expect.soft(x?.宛先 ?? [], "BCC が送信元メールアドレス（封筒の宛先に含まれる）").toContain(b.送信元.toLowerCase());
    expect.soft((x?.返信先 ?? "").replace(/[<>]/g, "").trim(), "返信先がメールアドレス3").toBe(b.返信先);
    expect.soft(x?.戻り先 ?? "", "送信エラーの戻り先がメールアドレス4").toBe(b.送信エラー先.toLowerCase());
  });
});

caseTest("IT-M05-06-018", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA");
  supplement("支店受注〔注文番号-M0506-018B〕は、本店の受注（注文者「支店 花子」の別の会員）として作った（支店の受注は画面で作れない）");
  let s!: MailAllPage; let 受注!: 作った受注[]; let 前 = "";
  await step(1, async () => { ({ s, 受注 } = await 選んで開く(page, "S-M05-06-ORDERS-018", "018")); });
  await step(2, async () => { await 選んで確認(s, "テンプレA", "履歴件名0506"); });
  await step(3, async () => { 前 = new Date().toISOString(); await s.送信を押す(true); });
  const 履歴: Record<string, ReturnType<typeof 受注の送信履歴>> = {};
  await step(4, async () => { for (const o of 受注) 履歴[o.受注ID] = 受注の送信履歴(o.受注ID).filter((h) => h.件名 === "履歴件名0506"); note(`送信履歴: ${JSON.stringify(Object.fromEntries(Object.entries(履歴).map(([k, v]) => [k, v.map((h) => ({ 件名: h.件名, 送信日時: h.送信日時, テンプレートID: h.テンプレートID, 会員ID: h.会員ID, 作成者ID: h.作成者ID }))])))}`); });
  await expected(async () => {
    for (const o of 受注) {
      const h = 履歴[o.受注ID] ?? [];
      expect.soft(h.length, `受注 ${o.注文番号} の件名「履歴件名0506」の送信履歴の件数`).toBe(1);
      expect.soft(h[0]?.本文 ?? "", `受注 ${o.注文番号} の送信履歴の本文に注文番号`).toContain(o.注文番号);
      expect.soft(h[0]?.送信日時 ?? "", `受注 ${o.注文番号} の送信履歴の送信日時がある`).not.toBe("");
      expect.soft(h[0]?.テンプレートID, `受注 ${o.注文番号} の送信履歴のテンプレート（M0506テンプレA の読み替え）`).toBe(テンプレの読み替え.テンプレA);
      expect.soft(h[0]?.受注ID, `受注 ${o.注文番号} の送信履歴の受注`).toBe(o.受注ID);
      expect.soft(h[0]?.会員ID, `受注 ${o.注文番号} の送信履歴の注文者の会員`).toBe(o.会員ID);
      expect.soft(h[0]?.作成者ID, `受注 ${o.注文番号} の送信履歴の作成者が設定されていない`).toBe("");
    }
    const [a, b] = 受注.map((o) => 履歴[o.受注ID]?.[0]?.本文 ?? "");
    expect.soft(a !== b, "受注ごとの本文（2件で違う内容）").toBe(true);
    note(`送信の押下は ${前} ごろ`);
  });
});

caseTest("IT-M05-06-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA");
  const o = 作った受注の("S-M05-06-DETAIL-020")[0];
  let 前 = ""; let 後 = ""; let s!: MailAllPage;
  await step(1, async () => { 前 = 受注の行の写し(o.受注ID); note(`送信前の受注の行の項目数: ${Object.keys(JSON.parse(前)).length}`); });
  await step(2, async () => { ({ s } = await 選んで開く(page, "S-M05-06-DETAIL-020", "020")); });
  await step(3, async () => { await 選んで確認(s, "テンプレA"); });
  await step(4, async () => { await s.送信を押す(true); });
  await step(5, async () => { 後 = 受注の行の写し(o.受注ID); });
  await expected(async () => {
    const a = JSON.parse(前) as Record<string, unknown>; const b = JSON.parse(後) as Record<string, unknown>;
    const 違う = Object.keys({ ...a, ...b }).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    expect.soft(違う, "送信前から値が変わった受注の項目（無いこと）").toEqual([]);
  });
});

/** 022・024・030: 確認画面の送信の値を空にして送り、受け口に届かないことを確かめる型 */
function 空にして送る(seedId: string, 番号: string, 欄: "mail[template]" | "mail[subject]", 何: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0506_ADMIN);
    読み替えの注記("テンプレA");
    let s!: MailAllPage; let 受注!: 作った受注[]; let 控え!: Set<number>;
    const 数: Record<string, number> = {};
    await step(1, async () => { ({ s, 受注 } = await 選んで開く(page, seedId, 番号)); });
    await step(2, async () => { await 選んで確認(s, "テンプレA"); });
    await step(3, async () => { await s.送る値を変える(欄, ""); note(`開発者ツールの代わりに、確認画面の送信の要求の${何}の値を、画面のスクリプトで空にした`); });
    await step(4, async () => { 控え = await 受け口を控える(); const r = await s.送信を押す(true); note(`確認の窓: ${r.確認の文.join("／")}・移った先: ${page.url()}・お知らせ: ${(await s.お知らせ()).join("／") || "なし"}`); });
    await step(5, async () => { for (const o of 受注) 数[o.メール] = (await 届いたメール(o.メール, 控え, 0, 30)).length; note(`30秒待って受け口に届いた数: ${JSON.stringify(数)}`); });
    await expected(async () => { for (const o of 受注) expect.soft(数[o.メール], `受注 ${o.注文番号} のメールアドレスへのメールの数`).toBe(0); });
  };
}
caseTest("IT-M05-06-022", 空にして送る("S-M05-06-ORDERS-022", "022", "mail[template]", "テンプレート"));
caseTest("IT-M05-06-024", 空にして送る("S-M05-06-ORDERS-024", "024", "mail[subject]", "件名"));
caseTest("IT-M05-06-030", 空にして送る("S-M05-06-ORDERS-030", "030", "mail[subject]", "件名"));

caseTest("IT-M05-06-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA");
  const o = 作った受注の("S-M05-06-SINGLE-025")[0];
  const s = new OrderManualMailPage(page);
  await step(1, async () => { await s.受注情報編集から開く(o.受注ID); });
  await step(2, async () => {
    await s.テンプレを選ぶ(テンプレの読み替え.テンプレA);
    await s.確認を押す();
    expect(await s.確認画面か(), "手動メール通知(確認画面)へ移った").toBe(true);
    const r = await s.送信を押す(true);
    note(`確認画面で「送信」を押した（確認の窓: ${r.確認の文.join("／") || "なし"}）・お知らせ: ${(await s.お知らせ()).join("／") || "なし"}`);
  });
  await expected(async () => { expect.soft(new URL(page.url()).pathname, `受注 ${o.注文番号} の受注情報編集画面へ遷移する`).toBe(new URL(adminUrl(`/order/${o.受注ID}/edit`)).pathname); });
});

caseTest("IT-M05-06-028", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA");
  let s!: MailAllPage; let 本文 = "";
  await step(1, async () => { ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-028", "028")); });
  await step(2, async () => { await s.テンプレを選ぶ(テンプレの読み替え.テンプレA); });
  await step(3, async () => { 本文 = await s.本文(); note(`メッセージ本文の先頭: ${本文.slice(0, 160)}`); });
  await expected(async () => { expect.soft(本文, "メッセージ本文の注文者名に「本店 太郎」が表示される").toMatch(氏名の形("本店 太郎")); });
});

caseTest("IT-M05-06-029", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  let s!: MailAllPage; let 対象: { 注文番号: string; 注文者: string }[] = [];
  const o = 作った受注の("S-M05-06-ORDERS-029")[0];
  await step(1, async () => { ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-029", "029")); });
  await step(2, async () => { 対象 = await s.送信対象(); note(`送信対象の表: ${JSON.stringify(対象)}`); });
  await expected(async () => {
    expect.soft(対象.map((x) => x.注文番号), "注文番号").toEqual([o.注文番号]);
    expect.soft(対象[0]?.注文者 ?? "", "注文者氏名").toMatch(氏名の形("本店 太郎"));
  });
});

caseTest("IT-M05-06-031", async ({ page, step, expected }) => {
  await loginAdmin(page, M0506_ADMIN);
  読み替えの注記("テンプレA");
  const 件名 = "重ね件名0506-031";
  const o = 作った受注の("S-M05-06-ORDERS-031")[0];
  let s!: MailAllPage; let 控え!: Set<number>; let 届いた: Awaited<ReturnType<typeof 届いたメール>> = []; let 履歴: ReturnType<typeof 受注の送信履歴> = [];
  await step(1, async () => { 控え = await 受け口を控える(); ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-031", "031")); });
  await step(2, async () => { await 選んで確認(s, "テンプレA", 件名); });
  await step(3, async () => { await s.送信を押す(true); });
  await step(4, async () => { ({ s } = await 選んで開く(page, "S-M05-06-ORDERS-031", "031")); });
  await step(5, async () => { await 選んで確認(s, "テンプレA", 件名); });
  await step(6, async () => { await s.送信を押す(true); });
  await step(7, async () => { 届いた = (await 届いたメール(o.メール, 控え, 2)).filter((m) => m.件名 === 件名); note(`${o.メール} あてに届いた件名「${件名}」の数: ${届いた.length}`); });
  await step(8, async () => { 履歴 = 受注の送信履歴(o.受注ID).filter((h) => h.件名 === 件名); });
  await expected(async () => {
    expect.soft(届いた.length, `件名「${件名}」のメールの数`).toBe(2);
    expect.soft(履歴.length, `受注 ${o.注文番号} の件名「${件名}」の送信履歴の件数`).toBe(2);
  });
});

caseTest("IT-M05-06-032", async ({ page, step, expected, notes }) => {
  読み替えの注記("RE連携");
  supplement("基本情報（S-M05-06-RE-BASE）は全員が使う設定なので書き換えていない（期待結果が見ない）");
  const o = 作った受注の("S-M05-06-RE-ORD-032")[0];
  const c = new CustomerManualMailPage(page);
  const 件名 = "RE連携件名0506-001";
  let 前: Awaited<ReturnType<CustomerManualMailPage["配信履歴"]>> = []; let 後: typeof 前 = []; let s!: MailAllPage;
  await step(1, async () => { await loginAdmin(page, M0506RE_ADMIN); });
  await step(2, async () => { await c.一覧からメール履歴を開く(notes.get("〔会員ID-M0506-RE001〕"), o.メール); });
  await step(3, async () => { 前 = await c.配信履歴(); note(`メール配信履歴の行: ${JSON.stringify(前.map((r) => ({ 通知メール: r.通知メール, 件名: r.件名 })))}`); });
  await step(4, async () => {
    const list = await 一覧で受注を選ぶ(page, o.メール, [o.注文番号]);
    await MailAllPage.一覧から開く(list);
    s = new MailAllPage(page);
    expect(await s.入力画面か(), "メール一括送信画面が開いた").toBe(true);
    note("受注情報検索の注文番号の欄の代わりに、受注のメールアドレスで検索して注文番号の行を選んだ");
  });
  await step(5, async () => { await 選んで確認(s, "RE連携", 件名); });
  await step(6, async () => { await s.送信を押す(true); });
  await step(7, async () => { await c.一覧からメール履歴を開く(notes.get("〔会員ID-M0506-RE001〕"), o.メール); });
  await step(8, async () => { 後 = await c.配信履歴(); note(`メール配信履歴の行: ${JSON.stringify(後.map((r) => ({ 処理日: r.処理日, 通知メール: r.通知メール, 件名: r.件名 })))}`); });
  await expected(async () => {
    expect.soft(前.length, "手順3のメール配信履歴画面には行が表示されない").toBe(0);
    const hit = 後.filter((r) => r.件名 === 件名);
    expect.soft(hit.length, `手順8のメール配信履歴画面の件名「${件名}」の行の数`).toBe(1);
    expect.soft(hit[0]?.通知メール, "通知メール欄（M0506RE連携テンプレ の読み替えのテンプレートの件名）").toBe(テンプレ("RE連携").件名);
  });
});
