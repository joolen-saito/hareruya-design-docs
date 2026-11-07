/**
 * F06-22 お問い合わせ の続き（-b）。正本: cases/F06-22_test_cases.tsv
 * 既存の spec/f06/f06-22.spec.ts（013〜016・048。流し終えたもの）は変えない。会員は、フロントの会員登録で作る（seeds/f06-22-b.ts）。
 * 件名のマスタは共有の設定。シード表の値に書き換えて、この spec の終わりに元の値へ戻し、DBの参照で確かめる。
 * 実装しないケースは記録 review/F06-22_progress_2026-11-07.md
 */
import { test } from "@playwright/test";
import { お問い合わせ } from "../../db/f06_22";
import { caseTest, expect } from "../../lib/case";
import { available } from "../../lib/db";
import { LoginPage } from "../../pages/front/f06_03_login";
import { ContactFormPage } from "../../pages/front/f06_22_contact_form";
import { 件名を戻す, mailOf, PW_A } from "../../seeds/f06-22-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const digits = (s: string) => s.replace(/\D/g, "");
const 開始時0件の補い = "シード表は「DBシードのケース開始処理で一致する既存のお問い合わせを削除」と定めるが、DBへは書き込まない決まりのため、入力用メールアドレスの前半に実行の印を付けた新しいメールアドレスを使い、開始時に0件であることをDBの参照で確かめた";

test.afterAll(async ({ browser }) => {
  test.setTimeout(240_000);
  expect(await 件名を戻す(browser), "共有の設定（お問い合わせ件名のマスタ）を元の値へ戻せた").toBe("");
});

const 通販 = "通販に関するお問い合わせ";
const 買取 = "ネット買取に関するお問い合わせ";
const 店舗イベント = "店舗でのお買い物・イベントに関するお問い合わせ";
const その他 = "その他のお問い合わせ";
const 件名8 = ["通販に関するお問い合わせ", "ネット買取に関するお問い合わせ", "店舗でのお買い物・イベントに関するお問い合わせ", "委託販売に関するお問い合わせ", "デッキ構築機能に関するお問い合わせ", "記事・動画に関するお問い合わせ", "その他のお問い合わせ", "協賛関連"];
const キャンセル期限の文 = "イベントのキャンセル期限はイベント開催日の前日23時59分までになります。";

// ================= 001: ログイン会員の初期値 =================
caseTest("IT-F06-22-001", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  const l = new LoginPage(page);
  let 姓 = "", tel = ["", "", ""], メール = "";
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("member-a"), PW_A); });
  await step(2, async () => { await c.マイページを開く(); });
  await step(3, async () => { await c.マイページのお問い合わせを押す(); 姓 = await c.姓.inputValue(); tel = await Promise.all(c.電話.map((e) => e.inputValue())); メール = await c.メール.inputValue(); });
  await expected(async () => {
    expect.soft(c.path, "遷移した画面（お問い合わせ画面）").toMatch(/\/contact$/);
    expect.soft(await c.お問い合わせ画面である(), "お問い合わせ画面が表示されている").toBe(true);
    expect.soft(姓, "初期表示のお問い合わせ時氏名(姓)").toBe("晴屋");
    expect.soft(tel, "初期表示の電話番号（3分割）").toEqual(["03", "1234", "5678"]);
    expect.soft(メール, "初期表示のメールアドレス").toBe(mailOf("member-a"));
    note("会員Aのメールアドレスは、前半に実行の印を付けた値で登録した。初期表示も同じ値を期待した");
  });
});

// ================= 003〜009: 件名・詳細・キャンセル理由の選択肢 =================
caseTest("IT-F06-22-003", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let 初期値 = "";
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { 初期値 = await c.選ばれている表示名(c.件名); });
  await expected(async () => { expect.soft(初期値, "件名（タイトル）の初期値").toBe(通販); });
});
caseTest("IT-F06-22-004", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { 選択肢 = await c.選択肢の表示名(c.件名); });
  await expected(async () => {
    for (const n of 件名8) expect.soft(選択肢, `件名（タイトル）の選択肢に「${n}」がある`).toContain(n);
    expect.soft(選択肢.length, "件名（タイトル）の選択肢の数（登録済みの8件のみ）").toBe(8);
  });
});
caseTest("IT-F06-22-005", async ({ page, step, expected }) => {
  const en = new ContactFormPage(page, "en");
  let 値: string[] = [];
  await step(1, async () => { await en.開く(); });
  await step(2, async () => { 値 = await en.件名.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean)); });
  await expected(async () => {
    for (const id of ["1", "2", "3", "4", "5", "6", "7"]) expect.soft(値, `英語名称を設定した件名ID ${id} が選択肢に表示される`).toContain(id);
    expect.soft(値, "英語名称が空の件名ID 8 が選択肢に表示されない").not.toContain("8");
    supplement("件名ID 2・4・5 の英語名称は、シード表が値を示さず手元の環境で空だったため、画面で仮の英語名称を入れて成り立たせた（ケースは英語名称の文字を確かめない）");
  });
});
caseTest("IT-F06-22-007", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.選ぶ(c.件名, 店舗イベント); });
  await step(3, async () => { 選択肢 = await c.選択肢の表示名(c.詳細); });
  await expected(async () => {
    for (const n of ["店舗でのお買い物について", "イベントについて", "イベントのキャンセル申込"]) expect.soft(選択肢, `お問い合わせ詳細の選択肢に「${n}」がある`).toContain(n);
  });
});
caseTest("IT-F06-22-008", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.選ぶ(c.件名, 店舗イベント); });
  await step(3, async () => { await c.選ぶ(c.詳細, "イベントのキャンセル申込"); });
  await step(4, async () => { 選択肢 = await c.選択肢の表示名(c.キャンセル理由); });
  await expected(async () => {
    for (const n of ["都合が悪くなったため", "他のイベントに参加するため", "体調不良のため", "同種の予選等を既に通過したため", "その他"]) expect.soft(選択肢, `キャンセル理由の選択肢に「${n}」がある`).toContain(n);
  });
});
caseTest("IT-F06-22-009", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let 非活性 = false, 活性 = false;
  await step(1, async () => { await c.開く(); await c.選ぶ(c.件名, 店舗イベント); await c.選ぶ(c.詳細, "イベントのキャンセル申込"); });
  await step(2, async () => { await c.選ぶ(c.キャンセル理由, "都合が悪くなったため"); });
  await step(3, async () => { 非活性 = await c.その他キャンセル理由.isDisabled(); });
  await step(4, async () => { await c.選ぶ(c.キャンセル理由, "その他"); 活性 = await c.その他キャンセル理由.isEnabled(); });
  await expected(async () => {
    expect.soft(非活性, "「都合が悪くなったため」の選択中、その他キャンセル理由が非活性").toBe(true);
    expect.soft(活性, "「その他」の選択後、その他キャンセル理由が入力可能").toBe(true);
  });
});

// ================= 017〜024: 入力 → 確認画面 =================
const 氏名電話 = { 姓: "試験", 名: "太郎", 電話: ["03", "1234", "5678"] as [string, string, string] };

caseTest("IT-F06-22-017", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false }, 文 = "";
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 通販, ...氏名電話, メール: "confirm-commerce@example.test", 内容: "通販確認本文", 付帯情報: "ORDER-F0622-001" }); });
  await step(3, async () => { r = await c.確認画面へ進む(); if (r.確認画面) 文 = await c.確認画面の文(); });
  await expected(async () => {
    expect.soft(r.確認画面, "お問い合わせ確認画面へ遷移した").toBe(true);
    for (const v of [通販, "試験 太郎", "03-1234-5678", "confirm-commerce@example.test", "通販確認本文", "ORDER-F0622-001"]) expect.soft(文, `確認画面に「${v}」が表示される`).toContain(v);
  });
});
caseTest("IT-F06-22-018", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false }, 文 = "";
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 買取, ...氏名電話, メール: "confirm-buy@example.test", 内容: "買取確認本文", 付帯情報: "BUY-F0622-001" }); });
  await step(3, async () => { r = await c.確認画面へ進む(); if (r.確認画面) 文 = await c.確認画面の文(); });
  await expected(async () => {
    expect.soft(r.確認画面, "お問い合わせ確認画面へ遷移した").toBe(true);
    expect.soft(文, "確認画面に買取番号「BUY-F0622-001」が表示される").toContain("BUY-F0622-001");
  });
});
caseTest("IT-F06-22-023", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false }, 文 = "";
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: その他, 付帯情報: "OTHER-F0622-001", ...氏名電話, メール: "confirm-other@example.test", 内容: "その他確認本文" }); });
  await step(3, async () => { r = await c.確認画面へ進む(); if (r.確認画面) 文 = await c.確認画面の文(); });
  await expected(async () => {
    expect.soft(r.確認画面, "お問い合わせ確認画面へ遷移した").toBe(true);
    expect.soft(文, "確認画面に注文番号または買取番号「OTHER-F0622-001」が表示される").toContain("OTHER-F0622-001");
  });
});
caseTest("IT-F06-22-024", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false };
  await c.開く();
  await step(1, async () => { await c.入力する({ ...氏名電話, メール: "confirm-back@example.test", 内容: "戻る確認本文" }); });
  await step(2, async () => { r = await c.確認画面へ進む(); });
  await step(3, async () => { await c.確認画面の戻るを押す(); });
  await expected(async () => {
    expect.soft(r.確認画面, "手順2で確認画面へ進んだ").toBe(true);
    expect.soft(await c.お問い合わせ画面である(), "お問い合わせ画面（入力画面）が表示される").toBe(true);
    expect.soft(await c.確認画面である(), "確認画面ではない").toBe(false);
  });
});

// ================= 026・031・035・039・041: 送信 → 保存（DB確認） =================
async function 送信まで(c: ContactFormPage): Promise<boolean> {
  const r = await c.確認画面へ進む();
  if (!r.確認画面) return false;
  await c.送信する押下();
  return true;
}
caseTest("IT-F06-22-026", async ({ page, step, expected }) => {
  supplement(開始時0件の補い);
  const c = new ContactFormPage(page);
  const メール = mailOf("name-max16");
  const 姓 = "晴".repeat(16), 名 = "A".repeat(16);
  let 送れた = false, 記録 = [] as ReturnType<typeof お問い合わせ>;
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 姓, 名, 電話: ["03", "1234", "5678"], メール, 内容: "氏名最大長確認" }); });
  await step(3, async () => { const r = await c.確認画面へ進む(); 送れた = r.確認画面; });
  await step(4, async () => { if (送れた) await c.送信する押下(); });
  await step(5, async () => { 記録 = available ? お問い合わせ(メール) : []; });
  await expected(async () => {
    expect.soft(送れた, "確認画面へ進んだ").toBe(true);
    expect.soft(記録.length, "保存されたお問い合わせの件数").toBe(1);
    expect.soft(記録[0]?.氏名姓, "保存された姓（16文字）").toBe(姓);
    expect.soft(記録[0]?.氏名名, "保存された名（16文字）").toBe(名);
  });
});
caseTest("IT-F06-22-031", async ({ page, step, expected }) => {
  supplement(開始時0件の補い);
  const c = new ContactFormPage(page);
  const メール = mailOf("optional-empty");
  let 送れた = false, 記録 = [] as ReturnType<typeof お問い合わせ>;
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 通販, 姓: "任意", 名: "空欄", 電話: ["03", "1234", "5678"], メール, 内容: "任意項目空欄確認", 付帯情報: "" }); });
  await step(3, async () => { 送れた = (await c.確認画面へ進む()).確認画面; });
  await step(4, async () => { if (送れた) await c.送信する押下(); });
  await step(5, async () => { 記録 = available ? お問い合わせ(メール) : []; });
  await expected(async () => {
    expect.soft(送れた, "注文番号が空でも確認画面へ進んだ").toBe(true);
    expect.soft(記録.length, "保存されたお問い合わせの件数").toBe(1);
    expect.soft(記録[0]?.付帯情報 ?? "", "保存された注文番号（空）").toBe("");
  });
});
caseTest("IT-F06-22-035", async ({ page, step, expected }) => {
  supplement(開始時0件の補い);
  const c = new ContactFormPage(page);
  const メール = mailOf("save-f0622");
  let 送れた = false, 記録 = [] as ReturnType<typeof お問い合わせ>;
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 通販, 付帯情報: "ORDER-SAVE-001", 姓: "保存", 名: "確認", 電話: ["03", "1111", "2222"], メール, 内容: "保存確認本文" }); });
  await step(3, async () => { 送れた = (await c.確認画面へ進む()).確認画面; });
  await step(4, async () => { if (送れた) await c.送信する押下(); });
  await step(5, async () => { 記録 = available ? お問い合わせ(メール) : []; });
  await expected(async () => {
    const r = 記録[0];
    expect.soft(送れた, "確認画面へ進んだ").toBe(true);
    expect.soft(記録.length, "保存されたお問い合わせの件数").toBe(1);
    expect.soft(r?.件名ID, "保存された件名（通販に関するお問い合わせ）").toBe("1");
    expect.soft(r?.付帯情報, "保存された注文番号").toBe("ORDER-SAVE-001");
    expect.soft(`${r?.氏名姓} ${r?.氏名名}`, "保存された氏名").toBe("保存 確認");
    expect.soft(digits(r?.電話番号 ?? ""), "保存された電話番号（数字の並び）").toBe("0311112222");
    expect.soft(r?.メール, "保存されたメールアドレス").toBe(メール);
    expect.soft(r?.内容, "保存された内容").toBe("保存確認本文");
  });
});
caseTest("IT-F06-22-039", async ({ page, notes, step, expected }) => {
  supplement(開始時0件の補い);
  const c = new ContactFormPage(page);
  const l = new LoginPage(page);
  const Bメール = mailOf("member-b");
  let 送れた = false, 記録 = [] as ReturnType<typeof お問い合わせ>;
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("member-a"), PW_A); });
  await step(2, async () => { await c.開く(); });
  await step(3, async () => { await c.入力する({ 姓: "ログイン", 名: "優先", 電話: ["03", "3333", "4444"], メール: Bメール, 内容: "ログイン会員優先確認" }); });
  await step(4, async () => { 送れた = (await c.確認画面へ進む()).確認画面; });
  await step(5, async () => { if (送れた) await c.送信する押下(); });
  await step(6, async () => { 記録 = available ? お問い合わせ(Bメール) : []; });
  await expected(async () => {
    expect.soft(送れた, "確認画面へ進んだ").toBe(true);
    expect.soft(記録.length, "保存されたお問い合わせの件数").toBe(1);
    expect.soft(記録[0]?.会員ID, "保存されたお問い合わせに紐づく会員（ログイン中の会員A）").toBe(notes.get("〔会員ID-F0622-共有A〕"));
    expect.soft(記録[0]?.会員ID, "入力メールアドレスと一致する会員B ではない").not.toBe(notes.get("〔会員ID-F0622-共有B〕"));
    note("会員A・会員Bのメールアドレスは、前半に実行の印を付けた値で登録した");
  });
});
caseTest("IT-F06-22-041", async ({ page, step, expected }) => {
  supplement(開始時0件の補い);
  const c = new ContactFormPage(page);
  const メール = mailOf("no-customer-f0622");
  let 送れた = false, 記録 = [] as ReturnType<typeof お問い合わせ>;
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 姓: "未ログイン", 名: "不一致", 電話: ["03", "3333", "6666"], メール, 内容: "会員不一致確認" }); });
  await step(3, async () => { 送れた = (await c.確認画面へ進む()).確認画面; });
  await step(4, async () => { if (送れた) await c.送信する押下(); });
  await step(5, async () => { 記録 = available ? お問い合わせ(メール) : []; });
  await expected(async () => {
    expect.soft(送れた, "確認画面へ進んだ").toBe(true);
    expect.soft(記録.length, "保存されたお問い合わせの件数").toBe(1);
    expect.soft(記録[0]?.会員ID, "保存されたお問い合わせに会員が紐づかない").toBeNull();
  });
});

// ================= 046・047: 送信 → 完了画面 =================
caseTest("IT-F06-22-046", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let 送れた = false;
  await c.開く();
  await step(1, async () => { await c.入力する({ 姓: "完了", 名: "遷移", 電話: ["03", "5555", "1111"], メール: "complete-f0622@example.test", 内容: "完了遷移確認本文" }); });
  await step(2, async () => { 送れた = (await c.確認画面へ進む()).確認画面; });
  await step(3, async () => { if (送れた) await c.送信する押下(); });
  await expected(async () => {
    expect.soft(送れた, "確認画面へ進んだ").toBe(true);
    expect.soft(await c.完了画面である(), "お問い合わせ完了画面が表示される").toBe(true);
  });
});
caseTest("IT-F06-22-047", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let 送れた = false;
  await c.開く();
  await step(1, async () => { await c.入力する({ 姓: "トップ", 名: "遷移", 電話: ["03", "5555", "2222"], メール: "top-f0622@example.test", 内容: "トップ遷移確認本文" }); });
  await step(2, async () => { 送れた = (await c.確認画面へ進む()).確認画面; });
  await step(3, async () => { if (送れた) await c.送信する押下(); });
  await step(4, async () => { if (await c.完了画面である()) await c.押して遷移する(c.完了画面のトップへ戻る); });
  await expected(async () => {
    expect.soft(送れた, "確認画面へ進んだ").toBe(true);
    expect.soft(c.path, "遷移した画面（ECTOP）").toMatch(/^\/(ja\/?)?$/);
  });
});

// ================= 049〜051・058 =================
caseTest("IT-F06-22-049", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false };
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 店舗イベント, 姓: "試験", 名: "太郎", 電話: ["03", "1234", "5678"], メール: "f0622-049-mail@example.test", 内容: "詳細未選択確認本文" }); });
  await step(3, async () => { await c.詳細の選択値を空にする(); });
  await step(4, async () => { r = await c.確認画面へ進む(); });
  await expected(async () => {
    expect.soft(r.確認画面, "お問い合わせ確認画面へ遷移しない").toBe(false);
    expect.soft(await c.お問い合わせ画面である(), "お問い合わせ入力画面が再表示される").toBe(true);
    expect.soft(await c.詳細の直下のエラー(), "お問い合わせ詳細の直下にエラーが表示される").not.toBe("");
  });
});
caseTest("IT-F06-22-050", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 店舗イベント, 詳細: "イベントのキャンセル申込" }); });
  let 文 = "", 表示 = false;
  await step(3, async () => { 表示 = await c.キャンセル期限の行.isVisible(); 文 = (await c.キャンセル期限の行.innerText()).replace(/\s+/g, ""); });
  await expected(async () => {
    expect.soft(表示, "キャンセル期限の案内が表示されている").toBe(true);
    expect.soft(文, "キャンセル期限の案内の文").toContain(キャンセル期限の文);
  });
});
caseTest("IT-F06-22-051", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  const 状態: Record<string, boolean> = {};
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.選ぶ(c.件名, 店舗イベント); });
  await step(3, async () => { await c.選ぶ(c.詳細, "店舗でのお買い物について"); 状態["店舗でのお買い物について"] = await c.キャンセル期限の行.isVisible(); });
  await step(4, async () => { await c.選ぶ(c.詳細, "イベントについて"); 状態["イベントについて"] = await c.キャンセル期限の行.isVisible(); });
  await expected(async () => {
    for (const k of ["店舗でのお買い物について", "イベントについて"]) expect.soft(状態[k], `お問い合わせ詳細が「${k}」のとき、キャンセル期限の案内が表示されない`).toBe(false);
  });
});
caseTest("IT-F06-22-058", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let 値: string[] = [];
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { 値 = await Promise.all([c.姓, c.名, ...c.電話, c.メール].map((e) => e.inputValue())); });
  await expected(async () => {
    expect.soft(値, "氏名(姓)・氏名(名)・電話番号の3欄・メールアドレスの各入力値（すべて空欄）").toEqual(["", "", "", "", "", ""]);
  });
});

// ================= 店舗（公開営業店10など）を使うケース =================
const 店10 = "公開営業店10";
const 氏名電話2 = { 姓: "試験", 名: "太郎", 電話: ["03", "1234", "5678"] as [string, string, string] };
const キャンセル入力 = (o: Partial<import("../../pages/front/f06_22_contact_form").入力> = {}) => ({
  件名: 店舗イベント, 詳細: "イベントのキャンセル申込", イベント名: "確認イベント", イベント実施店舗: 店10, 開催日: "2026/09/15", 開始時間: "10:30",
  キャンセル理由: "その他", その他キャンセル理由: "確認用理由", アンケート: "確認用回答", ...o,
});

caseTest("IT-F06-22-006", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  const 状態: Record<string, { ラベル: string; 付帯表示: boolean; 詳細表示: boolean; 店舗表示: boolean }> = {};
  const 観察 = async (名: string) => { 状態[名] = { ラベル: await c.付帯情報のラベル(), 付帯表示: await c.付帯情報の行.isVisible(), 詳細表示: await c.詳細.isVisible(), 店舗表示: await c.店舗選択の行.isVisible() }; };
  await step(1, async () => { await c.開く(); });
  await step(2, async () => {
    await c.選ぶ(c.件名, 通販); await 観察("通販");
    await c.選ぶ(c.件名, 買取); await 観察("買取");
    await c.選ぶ(c.件名, 店舗イベント); await 観察("店舗イベント");
    await c.選ぶ(c.件名, その他); await 観察("その他");
  });
  await expected(async () => {
    expect.soft(状態["通販"]?.付帯表示 && 状態["通販"]?.ラベル, "「通販に関するお問い合わせ」の入力欄").toBe("注文番号");
    expect.soft(状態["買取"]?.付帯表示 && 状態["買取"]?.ラベル, "「ネット買取に関するお問い合わせ」の入力欄").toBe("買取番号");
    expect.soft(状態["店舗イベント"]?.詳細表示, "「店舗でのお買い物・イベントに関するお問い合わせ」でお問い合わせ詳細が表示される").toBe(true);
    expect.soft(状態["店舗イベント"]?.店舗表示, "「店舗でのお買い物・イベントに関するお問い合わせ」でお問い合わせ店舗選択が表示される").toBe(true);
    expect.soft(状態["その他"]?.付帯表示 && 状態["その他"]?.ラベル, "「その他のお問い合わせ」の入力欄").toBe("注文番号または買取番号");
  });
});
caseTest("IT-F06-22-019", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false }, 文 = "";
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 店舗イベント, 詳細: "店舗でのお買い物について", 店舗: 店10, ...氏名電話2, メール: "confirm-shop@example.test", 内容: "店舗確認本文" }); });
  await step(3, async () => { r = await c.確認画面へ進む(); if (r.確認画面) 文 = await c.確認画面の文(); });
  await expected(async () => {
    expect.soft(r.確認画面, "お問い合わせ確認画面へ遷移した").toBe(true);
    expect.soft(文, "確認画面にお問い合わせ詳細「店舗でのお買い物について」が表示される").toContain("店舗でのお買い物について");
  });
});
caseTest("IT-F06-22-020", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false }, 項目: string[] = [];
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 店舗イベント, 詳細: "店舗でのお買い物について", 店舗: 店10, ...氏名電話2, メール: "confirm-shop-hidden@example.test", 内容: "店舗非表示確認本文" }); });
  await step(3, async () => { r = await c.確認画面へ進む(); if (r.確認画面) 項目 = await c.確認画面の項目名(); });
  await expected(async () => {
    expect.soft(r.確認画面, "お問い合わせ確認画面へ遷移した").toBe(true);
    expect.soft(項目, "確認画面の項目名に「店舗」が無い（店舗の項目が表示されない）").not.toContain("店舗");
  });
});
caseTest("IT-F06-22-021", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false }, 文 = "";
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ ...キャンセル入力(), ...氏名電話2, メール: "confirm-cancel@example.test", 内容: "キャンセル確認本文" }); });
  await step(3, async () => { r = await c.確認画面へ進む(); if (r.確認画面) 文 = await c.確認画面の文(); });
  await expected(async () => {
    expect.soft(r.確認画面, "お問い合わせ確認画面へ遷移した").toBe(true);
    for (const [名, v] of [["お問い合わせ詳細", "イベントのキャンセル申込"], ["イベント名", "確認イベント"], ["イベント実施店舗", 店10], ["イベント開催日", "2026/09/15"], ["キャンセル理由", "その他"], ["その他キャンセル理由", "確認用理由"], ["アンケート", "確認用回答"]]) {
      expect.soft(文, `確認画面に ${名}「${v}」が表示される`).toContain(v);
    }
  });
});
caseTest("IT-F06-22-032", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false };
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 店舗イベント, 詳細: "イベントのキャンセル申込", ...氏名電話2, メール: "cancel-required@example.test", 内容: "キャンセル必須確認" }); });
  await step(3, async () => { r = await c.確認画面へ進む(); });
  await expected(async () => {
    expect.soft(r.確認画面, "お問い合わせ確認画面へ遷移しない").toBe(false);
    expect.soft(await c.お問い合わせ画面である(), "お問い合わせ入力画面に留まる").toBe(true);
    note(`画面の警告: ${r.警告 ?? "なし"}`);
  });
});

caseTest("IT-F06-22-036", async ({ page, notes, step, expected }) => {
  supplement(開始時0件の補い);
  const c = new ContactFormPage(page);
  const メール = mailOf("shop-save");
  let 送れた = false, 記録 = [] as ReturnType<typeof お問い合わせ>;
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 店舗イベント, 詳細: "店舗でのお買い物について", 店舗: 店10, 姓: "店舗", 名: "保存", 電話: ["03", "1111", "3333"], メール, 内容: "店舗保存本文" }); });
  await step(3, async () => { 送れた = (await c.確認画面へ進む()).確認画面; });
  await step(4, async () => { if (送れた) await c.送信する押下(); });
  await step(5, async () => { 記録 = available ? お問い合わせ(メール) : []; });
  await expected(async () => {
    expect.soft(送れた, "確認画面へ進んだ").toBe(true);
    expect.soft(記録.length, "保存されたお問い合わせの件数").toBe(1);
    expect.soft(記録[0]?.お問い合わせ詳細ID, "保存されたお問い合わせ詳細（店舗でのお買い物について）").toBe("1");
    expect.soft(記録[0]?.店舗ID, "保存された店舗（公開営業店10）").toBe(notes.get("〔店舗ID-F0622-共有A〕"));
  });
});
caseTest("IT-F06-22-037", async ({ page, step, expected }) => {
  supplement(開始時0件の補い);
  const c = new ContactFormPage(page);
  const メール = mailOf("cancel-copy");
  let 送れた = false, 記録 = [] as ReturnType<typeof お問い合わせ>;
  await step(1, async () => { await c.開く(); await c.入力する({ 件名: 店舗イベント, 詳細: "イベントのキャンセル申込" }); });
  await step(2, async () => {
    await c.入力する({ ...キャンセル入力({ イベント名: "転記確認イベント", その他キャンセル理由: "転記確認理由", アンケート: "転記確認回答" }), 姓: "転記", 名: "確認", 電話: ["03", "2222", "3333"], メール, 内容: "キャンセル本文" });
  });
  await step(3, async () => { 送れた = (await c.確認画面へ進む()).確認画面; });
  await step(4, async () => { if (送れた) await c.送信する押下(); });
  await step(5, async () => { 記録 = available ? お問い合わせ(メール) : []; });
  await expected(async () => {
    const 内容 = 記録[0]?.内容 ?? "";
    expect.soft(送れた, "確認画面へ進んだ").toBe(true);
    expect.soft(記録.length, "保存されたお問い合わせの件数").toBe(1);
    for (const [名, v] of [["お問い合わせ詳細", "イベントのキャンセル申込"], ["イベント名", "転記確認イベント"], ["イベント実施店舗", 店10], ["イベント開催日", "2026/09/15"], ["イベント開始時間", "10:30"], ["キャンセル理由", "その他"], ["その他キャンセル理由", "転記確認理由"], ["アンケート", "転記確認回答"]]) {
      expect.soft(内容, `保存された内容に ${名}の項目名と入力値「${v}」が転記されている`).toContain(`${名} : ${v === "転記確認回答" ? "\n" : ""}${v}`);
    }
  });
});
caseTest("IT-F06-22-038", async ({ page, step, expected }) => {
  supplement(開始時0件の補い);
  const c = new ContactFormPage(page);
  const メール = mailOf("event-clear");
  let 送れた = false, 記録 = [] as ReturnType<typeof お問い合わせ>;
  await step(1, async () => { await c.開く(); await c.入力する({ 件名: 店舗イベント, 詳細: "イベントのキャンセル申込" }); });
  await step(2, async () => { await c.入力する({ イベント名: "消去確認イベント", イベント実施店舗: 店10, 開催日: "2026/09/15", 開始時間: "10:30", キャンセル理由: "都合が悪くなったため", アンケート: "消去確認回答" }); });
  await step(3, async () => { await c.入力する({ 詳細: "店舗でのお買い物について", 店舗: 店10, 姓: "消去", 名: "確認", 電話: ["03", "2222", "4444"], メール, 内容: "通常問い合わせ本文" }); });
  await step(4, async () => { 送れた = (await c.確認画面へ進む()).確認画面; });
  await step(5, async () => { if (送れた) await c.送信する押下(); });
  await step(6, async () => { 記録 = available ? お問い合わせ(メール) : []; });
  await expected(async () => {
    const 内容 = 記録[0]?.内容 ?? "";
    expect.soft(送れた, "確認画面へ進んだ").toBe(true);
    expect.soft(記録.length, "保存されたお問い合わせの件数").toBe(1);
    for (const v of ["消去確認イベント", "2026/09/15", "10:30", "消去確認回答"]) expect.soft(内容, `保存された内容に「${v}」が含まれない`).not.toContain(v);
  });
});
caseTest("IT-F06-22-052", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false };
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 店舗イベント, 詳細: "イベントのキャンセル申込" }); });
  await step(3, async () => { await c.入力する({ イベント名: "確認イベント", イベント実施店舗: 店10, 開催日: "2026/09/15", 開始時間: "10:30", アンケート: "確認用回答", キャンセル理由: "その他" }); });
  await step(4, async () => { await c.入力する({ ...氏名電話2, メール: "f0622-052-mail@example.test", 内容: "その他理由未入力確認本文" }); });
  await step(5, async () => { r = await c.確認画面へ進む(); });
  await expected(async () => {
    expect.soft(r.警告 !== null, "警告のアラートが表示される").toBe(true);
    expect.soft(r.確認画面, "送信されずにお問い合わせ入力画面に留まる（確認画面へ遷移しない）").toBe(false);
    expect.soft(await c.お問い合わせ画面である(), "お問い合わせ入力画面が表示されている").toBe(true);
  });
});
caseTest("IT-F06-22-053", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false }, 項目: string[] = [];
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 店舗イベント, 詳細: "イベントのキャンセル申込" }); });
  await step(3, async () => { await c.入力する({ イベント名: "確認イベント", イベント実施店舗: 店10, 開催日: "2026/09/15", 開始時間: "10:30", アンケート: "確認用回答", キャンセル理由: "都合が悪くなったため", ...氏名電話2, メール: "f0622-053-mail@example.test", 内容: "期限表示確認本文" }); });
  await step(4, async () => { r = await c.確認画面へ進む(); if (r.確認画面) 項目 = await c.確認画面の項目名(); });
  await expected(async () => {
    expect.soft(r.確認画面, "お問い合わせ確認画面へ遷移した").toBe(true);
    expect.soft(項目, "確認画面にラベル「キャンセル期限」の項目が表示される").toContain("キャンセル期限");
  });
});
caseTest("IT-F06-22-054", async ({ page, step, expected }) => {
  const c = new ContactFormPage(page);
  let r = { 警告: null as string | null, 確認画面: false }, 項目: string[] = [];
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.入力する({ 件名: 店舗イベント, 詳細: "イベントのキャンセル申込" }); });
  await step(3, async () => { await c.入力する({ イベント名: "確認イベント", イベント実施店舗: 店10, 開催日: "2026/09/15", 開始時間: "10:30", アンケート: "確認用回答", キャンセル理由: "都合が悪くなったため" }); });
  await step(4, async () => { await c.入力する({ ...氏名電話2, メール: "f0622-054-mail@example.test", 内容: "その他理由非表示確認本文" }); });
  await step(5, async () => { r = await c.確認画面へ進む(); if (r.確認画面) 項目 = await c.確認画面の項目名(); });
  await expected(async () => {
    expect.soft(r.確認画面, "お問い合わせ確認画面へ遷移した").toBe(true);
    expect.soft(項目, "確認画面にその他キャンセル理由の項目が表示されない").not.toContain("その他キャンセル理由");
  });
});
caseTest("IT-F06-22-057", async ({ page, step, expected }) => {
  supplement("シード表はイベント詳細ID 6220570が存在しないことを定める。店舗「公開営業店10」は、シード表の店舗の登録（STORES）を画面で行って成り立たせた");
  const c = new ContactFormPage(page);
  let 件名初期値 = "", 状態 = { イベント名: "x", 開催日: "x", 開始時間: "x", 実施店舗: "x" };
  await step(1, async () => { await c.イベント詳細IDを指定して開く("6220570"); });
  await step(2, async () => { 件名初期値 = await c.選ばれている表示名(c.件名); });
  await step(3, async () => { await c.入力する({ 件名: 店舗イベント, 詳細: "イベントのキャンセル申込" }); });
  await step(4, async () => {
    状態 = { イベント名: await c.イベント名.inputValue(), 開催日: await c.開催日.inputValue(), 開始時間: await c.開始時間.inputValue(), 実施店舗: await c.選ばれている表示名(c.イベント実施店舗) };
  });
  await expected(async () => {
    expect.soft(件名初期値, "件名の初期値").toBe(通販);
    expect.soft(状態.イベント名, "イベント名（空欄）").toBe("");
    expect.soft(状態.開催日, "開催日（空欄）").toBe("");
    expect.soft(状態.開始時間, "開始時間（空欄）").toBe("");
    expect.soft(状態.実施店舗, "イベント実施店舗に「公開営業店10」が選択されていない").not.toBe(店10);
  });
});
