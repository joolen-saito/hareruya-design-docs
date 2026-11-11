/**
 * F08-03 店頭買取査定申込登録確認～完了。正本: cases/F08-03_test_cases.tsv
 *
 * - 店舗は、ケースごとの店舗（店舗識別名 it-f0803-NNN など）の代わりに F08-05 と共通の試験店舗（支店URL itf0805pd003）を使う（seeds/f08-03.ts の読み替え）。
 *   手順の店舗識別名は、この店舗の支店URLとして読む。
 * - DB で数える申込みは、申込みの返却希望サプライ（その他）に入れた「実行・ケースの印」で探す（共通の店舗には他の申込みがあるため）。
 *   シード表の入力値に返却希望サプライは無いが、必須ではない欄なので、印の入れ場所として使った。職業は必須の欄なので「会社員」を選んだ。
 * - 会員登録フォームに入れるメールアドレスの前半、ブラックリストの氏名の姓には実行の印を付けた。
 * - 受信箱を確かめる IT-F08-03-020 は実装していない（開発環境にメールの受信箱が無い）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import * as db from "../../db/f08_05";
import * as db3 from "../../db/f08_03";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { 会員IDで検索する } from "../../pages/admin/f08_05_otc_detail";
import { 買取詳細の項目 } from "../../pages/admin/f08_03_detail";
import { MemberApplyPage } from "../../pages/front/f08_05_apply";
import { OtcApplyPage, 申込入力, 申込者 } from "../../pages/front/f08_05_confirm";
import { OtcInputPage } from "../../pages/front/f08_02_input";
import { OtcCompletePage, 未成年の確認つきで次へ進む } from "../../pages/front/f08_03_complete";
import { StoreEntryPage } from "../../pages/front/f08_store_url";
import { 仮会員設定を戻す } from "../../seeds/f08-05";
import {
  F0803_ADMIN, F0803_PASSWORD, PD_STORE, ブラックリスト会員のパスワード, ブラックリスト会員のメール, 会員JPのメール, 会員ENのメール, 印つきメール, 拒否の氏名,
  申込みの印, 登録済みメール, 英語会員のパスワード, 連携の会員,
} from "../../seeds/f08-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 共通の試験店舗の支店URL（手順の店舗識別名の読み替え） */
const 支店URL = PD_STORE.支店URL;
const 店舗の読み替え = `手順の店舗識別名は、F08-05 と共通の試験店舗の支店URL「${支店URL}」として開いた（シード作成時の問題の読み替え）`;
const 印の注記 = (印: string) => `この申込みは、返却希望サプライ（その他）に入れた印「${印}」で探した（シード表の入力値に返却希望サプライは無いが、必須ではない欄なので印の入れ場所に使った。職業は必須の欄なので「会社員」を選んだ）`;

test.afterAll(async ({ browser }) => {
  await 仮会員設定を戻す(browser, "実行");
});

// ---- 入力値（シード表の取り決め） ----

const 年 = (歳: number) => String(new Date().getFullYear() - 歳);

/** S-F08-03-INPUT-JP（歳を変えると INPUT-AGE17・AGE18・BLACKLIST と同じ形）。印は返却希望サプライ（その他）に入れる */
const 日本語の入力 = (印: string, 歳 = 30, 上書き: Partial<申込入力> = {}): 申込入力 => ({
  言語: "JP", 国: "日本", 郵便番号: ["160", "0023"], 都道府県: "東京都", 住所1: "新宿区", 住所2: "西新宿1-1-1", 生年月日: [年(歳), "1", "1"],
  電話: ["03", "1234", "5678"], 職業: "会社員", サプライ: [], サプライその他: 印, 電話連絡: "不必要", 大会参加: "いいえ", 適格請求書発行事業者: "いいえ",
  利用規約同意: true, ...上書き,
});
const 結合太郎: 申込者 = { 姓: "結合", 名: "太郎", セイ: "ケツゴウ", メイ: "タロウ", 住所3: "ITビル803" };
/** S-F08-03-INPUT-EN（フリガナの欄は英語表示に無い） */
const 英語の入力 = (印: string): 申込入力 => ({ ...日本語の入力(印), 言語: "EN", 住所1: "Shinjuku-ku", 住所2: "Nishi-Shinjuku 1-1-1" });
const アリス: 申込者 = { 姓: "Smith", 名: "Alice", 住所3: "IT Building 803" };

const 店舗ID = (c: CaseCtx, 呼び名: string) => c.notes.get(`〔店舗ID-F0803-${呼び名}〕`);
const 会員ID = (c: CaseCtx, 呼び名: string) => c.notes.get(`〔会員ID-F0803-${呼び名}〕`);

type Step = CaseCtx["step"];

// ---- 画面の流れ ----

/** 未ログインで申込前ログイン画面から申込情報入力画面へ進む */
async function 未ログインで入力画面へ(a: OtcApplyPage): Promise<void> {
  await a.申込前ログイン画面を開く(支店URL);
  await a.アカウントなしで進む();
}

/** 入力して「次のページへ進む」を押し、会員登録フォームへ移る */
async function 入力して会員登録フォームへ(a: OtcApplyPage, v: 申込入力, who: 申込者): Promise<void> {
  await a.入力する(v, who);
  expect(await a.次のページへ進む(), "「次のページへ進む」で移った画面（会員登録フォーム）").toMatch(/\/register_customer$/);
}

/** 会員登録フォームで会員登録をスキップして確認画面へ進む */
async function スキップして確認画面へ(a: OtcApplyPage): Promise<void> {
  await a.会員登録をスキップする();
  await a.確認画面を待つ();
}

/** 会員でログインして申込情報入力画面へ（英語表示は Language で EN を選んでから） */
async function 会員でログイン(c: CaseCtx, メール: string, パスワード: string, 英語 = false): Promise<void> {
  const a = new OtcApplyPage(c.page);
  const m = new MemberApplyPage(c.page);
  if (英語) {
    await a.申込前ログイン画面を開く(支店URL);
    await a.言語でENを選ぶ();
  } else {
    await m.申込前ログイン画面を開く(支店URL);
  }
  await m.ログインする(メール, パスワード);
}

/** 会員でログイン中の申込情報入力画面に入力して確認画面へ進む */
async function 入力して確認画面へ(c: CaseCtx, v: 申込入力, who: 申込者): Promise<void> {
  const a = new OtcApplyPage(c.page);
  await a.入力する(v, who);
  expect(await a.次のページへ進む(), "ログイン中に「次のページへ進む」で移った画面（確認画面）").toMatch(/\/confirm$/);
  await a.確認画面を待つ();
}

/** 確認画面の確定のボタンを押して、完了画面へ移ったことを確かめる */
async function 確定して完了画面へ(c: CaseCtx): Promise<OtcCompletePage> {
  const r = await new OtcApplyPage(c.page).確定する();
  expect(r.完了画面, `確定のボタンを押したあとの画面（${r.パス}）が完了画面`).toBe(true);
  const done = new OtcCompletePage(c.page);
  await done.表示を待つ();
  return done;
}

/** 結合試験会員（日本語）で確認画面まで進む（1つの手順） */
async function 結合会員で確認画面まで(c: CaseCtx, 印: string, 歳 = 30): Promise<void> {
  await 会員でログイン(c, 会員JPのメール, F0803_PASSWORD);
  await 入力して確認画面へ(c, 日本語の入力(印, 歳), 結合太郎);
}

const 今日 = () => db3.実行日();
const 店舗番号2桁 = (id: string) => String(Number(id)).padStart(2, "0");
const 連番 = (n: number) => String(n).padStart(4, "0");

// ================= 確認画面（登録確認）の入口 =================

// 存在しない店舗識別名の登録確認
caseTest("IT-F08-03-001", async ({ page, step, expected }) => {
  const entry = new StoreEntryPage(page);
  let r = { status: 0, url: "" };
  await step(1, async () => { r = await entry.開く("unknown-f0803", "登録確認"); });
  await expected(async () => {
    expect.soft(r.status, "HTTPの応答").toBe(404);
    await expect.soft(entry.申込の入力欄(), "申込の入力欄（表示されない）").toHaveCount(0);
  });
  note("事前準備の「存在する場合は削除する」は、その店舗識別名の店舗が無いので行っていない");
});

caseTest("IT-F08-03-002", async (c) => {
  const entry = new StoreEntryPage(c.page);
  await c.step(1, async () => { await entry.開く(支店URL, "登録確認"); });
  await c.expected(async () => {
    expect.soft(new URL(c.page.url()).pathname, "移った先の画面のパス（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(entry.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-03-005", async (c) => {
  const a = new OtcApplyPage(c.page);
  const i = new OtcInputPage(c.page);
  await c.step(1, async () => { await 未ログインで入力画面へ(a); });
  await c.step(2, async () => { await 入力して会員登録フォームへ(a, 日本語の入力(申込みの印("005")), 結合太郎); });
  await c.step(3, async () => { await i.会員登録の値を入れる(登録済みメール, F0803_PASSWORD, false); });
  await c.step(4, async () => {
    await i.会員登録の値を入れる(登録済みメール, F0803_PASSWORD, true);
    await i.会員登録ありで進むを押す();
  });
  await c.expected(async () => {
    await expect.soft(i.会員登録フォーム(), "会員登録フォームの再表示").toBeVisible();
    await expect.soft(a.確認の枠("お名前"), "店頭買取査定申込確認画面のお名前の項目の数（確認画面へ移っていない）").toHaveCount(0);
  });
  note(`${店舗の読み替え}。${印の注記(申込みの印("005"))}`);
});

// ================= 確認画面への遷移・引き継ぎ =================

caseTest("IT-F08-03-007", async (c) => {
  const a = new OtcApplyPage(c.page);
  await c.step(1, async () => { await 会員でログイン(c, 会員JPのメール, F0803_PASSWORD); });
  let パス = "";
  await c.step(2, async () => {
    await a.入力する(日本語の入力(申込みの印("007")), 結合太郎);
    パス = await a.次のページへ進む();
  });
  await c.expected(async () => {
    expect.soft(パス, "「次のページへ進む」で移った画面のパス").toMatch(/\/confirm$/);
    await expect.soft(a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
  });
  note(`${店舗の読み替え}。${印の注記(申込みの印("007"))}`);
});

caseTest("IT-F08-03-008", async (c) => {
  const a = new OtcApplyPage(c.page);
  const mail = 印つきメール("new-f0803");
  await c.step(1, async () => { await 未ログインで入力画面へ(a); });
  await c.step(2, async () => { await 入力して会員登録フォームへ(a, 日本語の入力(申込みの印("008")), 結合太郎); });
  await c.step(3, async () => { await a.会員登録の入力をして進む(mail, F0803_PASSWORD); });
  let 住所 = "";
  let メール: string | null = null;
  await c.step(4, async () => {
    await a.確認画面を待つ();
    住所 = (await a.確認の値("住所")) ?? "";
    メール = await a.確認の値("メールアドレス");
  });
  await c.expected(async () => {
    expect.soft(住所, "確認画面の住所（住所3「ITビル803」を含む）").toContain("ITビル803");
    expect.soft(メール, "確認画面のメールアドレス").toBe(mail);
  });
  note(`${店舗の読み替え}。会員登録フォームのメールアドレスは正本の new-f0803@example.test の前半に実行の印を付けた値（${mail}）。${印の注記(申込みの印("008"))}`);
});

// ================= 登録（完了画面へ） =================

caseTest("IT-F08-03-009", async (c) => {
  await c.step(1, async () => { await 結合会員で確認画面まで(c, 申込みの印("009")); });
  let done = false;
  await c.step(2, async () => { done = (await 確定して完了画面へ(c)) !== null; });
  await c.expected(async () => {
    expect.soft(done, "査定申込みボタンを押したあとの店頭買取査定申込登録完了画面の表示").toBe(true);
    expect.soft(new URL(c.page.url()).pathname, "移った画面のパス").toMatch(/\/complete$/);
  });
  note(`${店舗の読み替え}。${印の注記(申込みの印("009"))}`);
});

caseTest("IT-F08-03-010", async (c) => {
  const 印 = 申込みの印("010");
  await c.step(1, async () => { await 結合会員で確認画面まで(c, 印); });
  await c.step(2, async () => { await 確定して完了画面へ(c); });
  let rows: db3.登録された申込み[] = [];
  await c.step(3, async () => { rows = db3.印つきの申込み(店舗ID(c, "010"), 印); });
  await c.expected(async () => {
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.状態, "査定申込みの状態").toBe("査定前");
    expect.soft(rows[0]?.店舗ID, "査定申込みの店舗（結合試験店-010に当たる共通の試験店舗）").toBe(店舗ID(c, "010"));
    expect.soft(rows[0]?.申込日, "査定申込みの申込日").toBe(今日());
    expect.soft(rows[0]?.更新日, "査定申込みの更新日").toBe(今日());
  });
  note(`${店舗の読み替え}。状態「完了前」は、申込み直後の状態「査定前」として読んだ。申込日・更新日は日本時間の登録日と比べた。${印の注記(印)}`);
});

caseTest("IT-F08-03-011", async (c) => {
  const a = new OtcApplyPage(c.page);
  const 印 = 申込みの印("011");
  await c.step(1, async () => { await 未ログインで入力画面へ(a); });
  await c.step(2, async () => { await a.入力する(日本語の入力(印), 結合太郎); });
  await c.step(3, async () => {
    expect(await a.次のページへ進む(), "「次のページへ進む」で移った画面（会員登録フォーム）").toMatch(/\/register_customer$/);
    await スキップして確認画面へ(a);
  });
  await c.step(4, async () => { await 確定して完了画面へ(c); });
  let rows: db3.登録された申込み[] = [];
  await c.step(5, async () => { rows = db3.印つきの申込み(店舗ID(c, "011"), 印); });
  await c.expected(async () => {
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.住所3, "査定申込みの住所3").toBe("ITビル803");
  });
  note(`${店舗の読み替え}。${印の注記(印)}`);
});

caseTest("IT-F08-03-012", async (c) => {
  const 印 = 申込みの印("012");
  await c.step(1, async () => { await 結合会員で確認画面まで(c, 印); });
  await c.step(2, async () => { await 確定して完了画面へ(c); });
  let rows: db3.登録された申込み[] = [];
  await c.step(3, async () => { rows = db3.印つきの申込み(店舗ID(c, "012"), 印); });
  await c.expected(async () => {
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.会員ID, "査定申込みの会員ID").toBe(会員ID(c, "共有A"));
  });
  note(`${店舗の読み替え}。${印の注記(印)}`);
});

/** 適格請求書発行事業者「はい」・登録番号ありで、結合試験会員の申込みを登録する（013・014 の手順1〜4） */
async function 登録番号つきで申込む(c: CaseCtx, 印: string): Promise<void> {
  const i = new OtcInputPage(c.page);
  const 入力 = 日本語の入力(印, 30, { 適格請求書発行事業者: "はい", 登録番号: "T1234567890123" });
  await c.step(1, async () => { await 会員でログイン(c, 会員JPのメール, F0803_PASSWORD); await i.入力画面を待つ(); });
  await c.step(2, async () => {
    await i.適格請求書発行事業者を選ぶ("はい");
    await i.登録番号欄().fill("T1234567890123");
  });
  await c.step(3, async () => { await 入力して確認画面へ(c, 入力, 結合太郎); });
  await c.step(4, async () => { await 確定して完了画面へ(c); });
}

caseTest("IT-F08-03-013", async (c) => {
  const 印 = 申込みの印("013");
  await 登録番号つきで申込む(c, 印);
  let rows: db3.登録された申込み[] = [];
  await c.step(5, async () => { rows = db3.印つきの申込み(店舗ID(c, "013"), 印); });
  await c.expected(async () => {
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.登録番号, "査定申込みに紐づく適格請求書発行事業者の登録番号").toBe("T1234567890123");
  });
  note(`${店舗の読み替え}。${印の注記(印)}`);
});

caseTest("IT-F08-03-014", async (c) => {
  const 印 = 申込みの印("014");
  await 登録番号つきで申込む(c, 印);
  let rows: db3.登録された申込み[] = [];
  await c.step(5, async () => { rows = db3.印つきの申込み(店舗ID(c, "014"), 印); });
  await c.expected(async () => {
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.フリーコメント ?? "", "査定申込みのフリーコメント").toContain("適格請求書発行事業者");
  });
  note(`${店舗の読み替え}。${印の注記(印)}`);
});

caseTest("IT-F08-03-015", async (c) => {
  const 印 = 申込みの印("015");
  await c.step(1, async () => { await 結合会員で確認画面まで(c, 印); });
  await c.step(2, async () => { await 確定して完了画面へ(c); });
  let rows: db3.登録された申込み[] = [];
  await c.step(3, async () => { rows = db3.印つきの申込み(店舗ID(c, "015"), 印); });
  await c.expected(async () => {
    expect.soft(rows.length, "新しく登録された査定申込みの件数").toBe(1);
    const r = rows[0];
    const 期待 = r ? `${今日()}-${店舗番号2桁(r.店舗ID)}-${連番(r.先の件数 + 1)}` : "（申込みが無い）";
    expect.soft(r?.査定番号, `新しい査定番号（同じ店舗の同じ日に先に登録された${r?.先の件数 ?? "?"}件の次の連番）`).toBe(期待);
  });
  note(`${店舗の読み替え}。連番を0007にそろえる申込みをDBで登録しなかったので、期待結果の「0008」は「同じ店舗の同じ日に先に登録された件数+1」で確かめた。${印の注記(印)}`);
});

caseTest("IT-F08-03-016", async (c) => {
  const 印 = 申込みの印("016");
  await c.step(1, async () => { await 結合会員で確認画面まで(c, 印); });
  await c.step(2, async () => { await 確定して完了画面へ(c); });
  let rows: db3.登録された申込み[] = [];
  let 履歴: db.状態の履歴[] = [];
  await c.step(3, async () => {
    rows = db3.印つきの申込み(店舗ID(c, "016"), 印);
    履歴 = rows[0] ? db.ステータス変更履歴(rows[0].id) : [];
  });
  await c.expected(async () => {
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(履歴.length, "登録された査定申込みに対応するステータス変更履歴の件数").toBe(1);
  });
  note(`${店舗の読み替え}。${印の注記(印)}`);
});

caseTest("IT-F08-03-017", async (c) => {
  const a = new OtcApplyPage(c.page);
  const 印 = 申込みの印("017");
  await c.step(1, async () => { await 未ログインで入力画面へ(a); });
  await c.step(2, async () => { await 入力して会員登録フォームへ(a, 日本語の入力(印), 結合太郎); });
  await c.step(3, async () => { await スキップして確認画面へ(a); });
  await c.step(4, async () => { await 確定して完了画面へ(c); });
  let rows: db3.登録された申込み[] = [];
  await c.step(5, async () => { rows = db3.印つきの申込み(店舗ID(c, "017"), 印); });
  await c.expected(async () => {
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.会員ID ?? null, "査定申込みの会員ID（紐づいていない）").toBeNull();
  });
  note(`${店舗の読み替え}。${印の注記(印)}`);
});

// ================= 会員登録つきの申込み =================

/** 未ログインで入力→会員登録フォームに入力→確認画面→「会員登録して申込み」まで（手順1〜4）。メールアドレスを返す */
async function 会員登録つきで申込む(c: CaseCtx, n: string, 氏名: { 申込者: 申込者; 歳?: number }, 印: string, メール: string, パスワード: string): Promise<void> {
  const a = new OtcApplyPage(c.page);
  await c.step(1, async () => { await 未ログインで入力画面へ(a); });
  await c.step(2, async () => { await 入力して会員登録フォームへ(a, 日本語の入力(印, 氏名.歳 ?? 30, { 適格請求書発行事業者: "いいえ" }), 氏名.申込者); });
  await c.step(3, async () => { await a.会員登録の入力をして進む(メール, パスワード); });
  await c.step(4, async () => { await 確定して完了画面へ(c); });
}

caseTest("IT-F08-03-018", async (c) => {
  const 印 = 申込みの印("018");
  const mail = 印つきメール("new-f0803-018");
  await 会員登録つきで申込む(c, "018", { 申込者: 結合太郎 }, 印, mail, F0803_PASSWORD);
  let rows: db3.登録された申込み[] = [];
  let 会員: { id: string; 状態: string }[] = [];
  await c.step(5, async () => {
    rows = db3.印つきの申込み(店舗ID(c, "018"), 印);
    会員 = db3.会員の状態(mail);
  });
  await c.expected(async () => {
    expect.soft(会員.length, "このメールアドレスの会員の件数").toBe(1);
    expect.soft(会員[0]?.状態, "会員の会員ステータス（仮会員）").toBe("仮会員");
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.会員ID, "査定申込みの会員ID（新しい仮会員）").toBe(会員[0]?.id);
  });
  note(`${店舗の読み替え}。メールアドレスは正本の new-f0803@example.test の前半に実行の印を付けた値（${mail}）。${印の注記(印)}`);
});

caseTest("IT-F08-03-019", async (c) => {
  const a = new OtcApplyPage(c.page);
  const 印 = 申込みの印("019");
  const mail = 印つきメール("new-f0803-019");
  await c.step(1, async () => { await 未ログインで入力画面へ(a); });
  await c.step(2, async () => {
    await 入力して会員登録フォームへ(a, 日本語の入力(印), 結合太郎);
    await a.会員登録の入力をして進む(mail, F0803_PASSWORD);
  });
  await c.step(3, async () => { await 確定して完了画面へ(c); });
  let 会員: { id: string; 状態: string }[] = [];
  let プレイヤー: db.プレイヤー[] = [];
  await c.step(4, async () => {
    会員 = db3.会員の状態(mail);
    プレイヤー = db.プレイヤー(mail);
  });
  await c.expected(async () => {
    expect.soft(会員.length, "新しい会員の件数").toBe(1);
    expect.soft(プレイヤー.length, "新しい会員に対応するプレイヤーの件数").toBe(1);
    expect.soft(プレイヤー[0]?.会員ID, "プレイヤーに紐づく会員ID").toBe(会員[0]?.id);
  });
  note(`${店舗の読み替え}。メールアドレスは正本の new-f0803@example.test の前半に実行の印を付けた値（${mail}）。${印の注記(印)}`);
});

caseTest("IT-F08-03-021", async (c) => {
  const a = new OtcApplyPage(c.page);
  const 氏名 = 拒否の氏名["021"];
  const 印 = 申込みの印("021");
  const mail = ブラックリスト会員のメール("021");
  const who: 申込者 = { 姓: 氏名.姓, 名: 氏名.名, セイ: "キョヒ", メイ: "タイショウ", 住所3: "ITビル803" };
  await c.step(1, async () => { await 未ログインで入力画面へ(a); });
  await c.step(2, async () => { await 入力して会員登録フォームへ(a, 日本語の入力(印), who); });
  await c.step(3, async () => { await a.会員登録の入力をして進む(mail, ブラックリスト会員のパスワード); });
  await c.step(4, async () => { await 確定して完了画面へ(c); });
  let rows: db3.登録された申込み[] = [];
  let 会員: { id: string; 状態: string }[] = [];
  let プレイヤー: db.プレイヤー[] = [];
  await c.step(5, async () => {
    rows = db3.印つきの申込み(店舗ID(c, "021"), 印);
    会員 = db3.会員の状態(mail);
    プレイヤー = db.プレイヤー(mail);
  });
  await c.expected(async () => {
    expect.soft(会員.length, `メールアドレス ${mail} の会員の件数（登録されない）`).toBe(0);
    expect.soft(プレイヤー.length, "このメールアドレスのプレイヤーの件数").toBe(0);
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
  });
  note(`${店舗の読み替え}。氏名・メールアドレスは正本の値に実行の印を付けた値（${氏名.姓} ${氏名.名}、${mail}）。ブラックリストは種別「氏名」で登録済み。${印の注記(印)}`);
});

// ================= 完了画面の表示 =================

caseTest("IT-F08-03-022", async (c) => {
  const 印 = 申込みの印("022");
  await c.step(1, async () => {
    await 結合会員で確認画面まで(c, 印);
    await 確定して完了画面へ(c);
  });
  const done = new OtcCompletePage(c.page);
  let 申込者の表示 = "";
  let 画面の査定番号: string | null = null;
  await c.step(2, async () => {
    申込者の表示 = await done.申込者();
    画面の査定番号 = await done.査定番号();
  });
  let rows: db3.登録された申込み[] = [];
  await c.step(3, async () => { rows = db3.印つきの申込み(店舗ID(c, "022"), 印); });
  await c.expected(async () => {
    expect.soft(申込者の表示, "完了画面の申込者").toBe("結合 太郎 様");
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(画面の査定番号, "完了画面の査定番号").toBe(rows[0]?.査定番号);
  });
  note(`${店舗の読み替え}。${印の注記(印)}`);
});

caseTest("IT-F08-03-023", async (c) => {
  const 印 = 申込みの印("023");
  await c.step(1, async () => {
    await 会員でログイン(c, 会員ENのメール, 英語会員のパスワード, true);
    await 入力して確認画面へ(c, 英語の入力(印), アリス);
  });
  await c.step(2, async () => { await 確定して完了画面へ(c); });
  const done = new OtcCompletePage(c.page);
  let 申込者の表示 = "";
  let 画面の査定番号: string | null = null;
  await c.step(3, async () => {
    申込者の表示 = await done.申込者();
    画面の査定番号 = await done.査定番号();
  });
  let rows: db3.登録された申込み[] = [];
  await c.step(4, async () => { rows = db3.印つきの申込み(店舗ID(c, "023"), 印); });
  await c.expected(async () => {
    expect.soft(申込者の表示, "完了画面の申込者（敬称なし）").toBe("Alice Smith");
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(画面の査定番号, "完了画面のAssessment Number").toBe(rows[0]?.査定番号);
  });
  note(`${店舗の読み替え}。シード表の英語会員は姓=Smith・名=Alice。申込者の表示の並びは画面の作りのとおりに読んだ。${印の注記(印)}`);
});

caseTest("IT-F08-03-024", async (c) => {
  await c.step(1, async () => {
    await 結合会員で確認画面まで(c, 申込みの印("024"));
    await 確定して完了画面へ(c);
  });
  const done = new OtcCompletePage(c.page);
  await c.step(2, async () => { await done.表示を待つ(); });
  await c.expected(async () => {
    await expect.soft(done.身分証明書の案内(), "完了画面の身分証明書の案内の項目").not.toHaveCount(0);
  });
  note(`${店舗の読み替え}。${印の注記(申込みの印("024"))}`);
});

/**
 * 未ログインで入力し、未成年の確認つきで進み、会員登録をスキップする（025・026・032・033）。
 * 申込みの確定を手順3に含める（032・033）か、手順4にする（025・026）。
 */
async function 歳を指定して未ログインで申込む(c: CaseCtx, 歳: number, 印: string, 確定は手順3: boolean): Promise<void> {
  const a = new OtcApplyPage(c.page);
  const i = new OtcInputPage(c.page);
  await c.step(1, async () => { await 未ログインで入力画面へ(a); });
  await c.step(2, async () => { await a.入力する(日本語の入力(印, 歳), 結合太郎); });
  await c.step(3, async () => {
    const r = await 未成年の確認つきで次へ進む(c.page, i);
    expect(r.パス, "「次のページへ進む」（未成年は確認のあと）で移った画面（会員登録フォーム）").toMatch(/\/register_customer$/);
    await スキップして確認画面へ(a);
    if (確定は手順3) await 確定して完了画面へ(c);
  });
  if (!確定は手順3) await c.step(4, async () => { await 確定して完了画面へ(c); });
}

caseTest("IT-F08-03-025", async (c) => {
  const 印 = 申込みの印("025");
  await 歳を指定して未ログインで申込む(c, 17, 印, false);
  const done = new OtcCompletePage(c.page);
  await c.expected(async () => {
    await expect.soft(done.保護者同意書の案内(), "完了画面の保護者同意書の案内の項目").toBeVisible();
  });
  note(`${店舗の読み替え}。生年月日は ${年(17)}年1月1日（試験実行日時点で17歳）。未成年の確認のモーダルが出たら「はい」を押した。${印の注記(印)}`);
});

caseTest("IT-F08-03-026", async (c) => {
  const 印 = 申込みの印("026");
  await 歳を指定して未ログインで申込む(c, 18, 印, false);
  const done = new OtcCompletePage(c.page);
  await c.expected(async () => {
    await done.表示を待つ();
    await expect.soft(done.保護者同意書の案内(), "完了画面の保護者同意書の案内の項目の数").toHaveCount(0);
  });
  note(`${店舗の読み替え}。生年月日は ${年(18)}年1月1日（試験実行日時点で18歳）。${印の注記(印)}`);
});

caseTest("IT-F08-03-027", async (c) => {
  const 印 = 申込みの印("027");
  await c.step(1, async () => { await 未ログインで入力画面へ(new OtcApplyPage(c.page)); });
  await c.step(2, async () => {
    const a = new OtcApplyPage(c.page);
    await 入力して会員登録フォームへ(a, 日本語の入力(印), 結合太郎);
    await a.会員登録の入力をして進む(印つきメール("new-f0803-027"), F0803_PASSWORD);
  });
  await c.step(3, async () => { await 確定して完了画面へ(c); });
  const done = new OtcCompletePage(c.page);
  await c.expected(async () => {
    await expect.soft(done.仮会員登録完了の案内(), "完了画面の仮会員登録完了の案内の領域").toBeVisible();
  });
  note(`${店舗の読み替え}。メールアドレスは正本の new-f0803@example.test の前半に実行の印を付けた値。${印の注記(印)}`);
});

caseTest("IT-F08-03-028", async (c) => {
  await c.step(1, async () => {
    await 結合会員で確認画面まで(c, 申込みの印("028"));
    await 確定して完了画面へ(c);
  });
  const done = new OtcCompletePage(c.page);
  await c.step(2, async () => { await done.表示を待つ(); });
  await c.expected(async () => {
    await expect.soft(done.仮会員登録完了の案内(), "完了画面の仮会員登録完了の案内の領域の数").toHaveCount(0);
  });
  note(`${店舗の読み替え}。${印の注記(申込みの印("028"))}`);
});

caseTest("IT-F08-03-029", async (c) => {
  const done = new OtcCompletePage(c.page);
  let 秒: number | null = null;
  await c.step(1, async () => {
    await 結合会員で確認画面まで(c, 申込みの印("029"));
    await 確定して完了画面へ(c);
  });
  await c.step(2, async () => {
    秒 = await done.自動遷移の秒数();
    if (秒 !== 15) throw new Error(`追加システム設定の買取査定申込み完了画面の自動遷移秒数が15でない（完了画面は${秒}秒と表示）。共有の設定なので書き換えずに止めた`);
    await done.自動遷移を待つ(15);
  });
  const entry = new StoreEntryPage(c.page);
  await c.expected(async () => {
    expect.soft(秒, "完了画面に表示された自動遷移の秒数").toBe(15);
    expect.soft(new URL(c.page.url()).pathname, "15秒待ったあとの画面のパス（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(entry.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(`${店舗の読み替え}。追加システム設定の自動遷移秒数（共有の設定）は書き換えず、完了画面が15秒と表示することを確かめて使った。${印の注記(申込みの印("029"))}`);
});

caseTest("IT-F08-03-030", async (c) => {
  const entry = new StoreEntryPage(c.page);
  await c.step(1, async () => { await entry.開く(支店URL, "登録完了"); });
  await c.expected(async () => {
    expect.soft(new URL(c.page.url()).pathname, "移った先の画面のパス（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(entry.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-03-031", async (c) => {
  const entry = new StoreEntryPage(c.page);
  let 完了のURL = "";
  await c.step(1, async () => {
    await 結合会員で確認画面まで(c, 申込みの印("031"));
    await 確定して完了画面へ(c);
    完了のURL = c.page.url();
  });
  await c.step(2, async () => {
    await c.page.goto(完了のURL, { timeout: 60_000 });
    await c.page.waitForLoadState("load");
  });
  await c.expected(async () => {
    expect.soft(new URL(c.page.url()).pathname, "もう一度完了のURLを開いたあとの画面のパス（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(entry.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(`${店舗の読み替え}。${印の注記(申込みの印("031"))}`);
});

caseTest("IT-F08-03-032", async (c) => {
  const 印 = 申込みの印("032");
  await 歳を指定して未ログインで申込む(c, 17, 印, true);
  let rows: db3.登録された申込み[] = [];
  await c.step(4, async () => { rows = db3.印つきの申込み(店舗ID(c, "032"), 印); });
  await c.expected(async () => {
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.成年, "査定申込みの成年フラグ（未成年）").toBe(false);
  });
  note(`${店舗の読み替え}。生年月日は ${年(17)}年1月1日（試験実行日時点で17歳）。${印の注記(印)}`);
});

caseTest("IT-F08-03-033", async (c) => {
  const 印 = 申込みの印("033");
  await 歳を指定して未ログインで申込む(c, 18, 印, true);
  let rows: db3.登録された申込み[] = [];
  await c.step(4, async () => { rows = db3.印つきの申込み(店舗ID(c, "033"), 印); });
  await c.expected(async () => {
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.成年, "査定申込みの成年フラグ（成年）").toBe(true);
  });
  note(`${店舗の読み替え}。生年月日は ${年(18)}年1月1日（試験実行日時点で18歳）。${印の注記(印)}`);
});

caseTest("IT-F08-03-036", async (c) => {
  const a = new OtcApplyPage(c.page);
  const 印 = 申込みの印("036");
  await c.step(1, async () => { await 未ログインで入力画面へ(a); });
  await c.step(2, async () => { await 入力して会員登録フォームへ(a, 日本語の入力(印), 結合太郎); });
  await c.step(3, async () => { await スキップして確認画面へ(a); });
  const done = new OtcCompletePage(c.page);
  await c.step(4, async () => { await 確定して完了画面へ(c); });
  await c.step(5, async () => { await done.査定申込みへ戻る(); });
  const entry = new StoreEntryPage(c.page);
  await c.expected(async () => {
    expect.soft(new URL(c.page.url()).pathname, `移った画面のパス（店舗識別名 ${支店URL} の申込前ログイン画面）`).toMatch(new RegExp(`/otcbuy/${支店URL}/entry$`));
    await expect.soft(entry.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(`${店舗の読み替え}。期待結果の店舗識別名 it-f0803-036 は、この店舗の支店URL「${支店URL}」として確かめた。${印の注記(印)}`);
});

// ================= 管理画面への連携 =================

/** 連携の会員でログイン→申込み（手順1〜5）。完了画面の申込者と査定番号を返す */
async function 連携の申込み(c: CaseCtx, n: "037" | "038" | "039"): Promise<{ 申込者: string; 査定番号: string | null }> {
  const m = new MemberApplyPage(c.page);
  const i = new OtcInputPage(c.page);
  const 会員 = 連携の会員[n];
  let 入れた項目: string[] = [];
  const out = { 申込者: "", 査定番号: null as string | null };
  await c.step(1, async () => { await m.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await m.ログインする(会員.メール, 会員.パスワード); });
  await c.step(3, async () => {
    const 姓名 = await m.申込者の姓名();
    expect.soft(姓名, "申込情報入力画面に設定された会員情報（お名前の姓・名）").toEqual({ 姓: 会員.姓, 名: 会員.名 });
    入れた項目 = await i.空の必須項目に入れる({ 職業: "会社員", 電話連絡: "不必要", 大会参加: "いいえ", 適格請求書発行事業者: "いいえ", 利用規約同意: true });
    await m.同意して次へ進む();
  });
  await c.step(4, async () => { await m.査定申込みする(); });
  await c.step(5, async () => {
    const done = new OtcCompletePage(c.page);
    await done.表示を待つ();
    out.申込者 = (await done.申込者()).replace(/\s*様$/, "");
    out.査定番号 = await done.査定番号();
  });
  if (入れた項目.length) note(`申込情報入力画面で会員情報に無かった必須項目（${入れた項目.join("・")}）だけを入れ、会員情報は変更していない`);
  return out;
}

/** 手順6〜7: 別のブラウザセッション（クッキーを全て消した新しいセッション）で管理者にログインし、買取一覧で会員IDを検索する */
async function 管理画面で会員IDを検索する(c: CaseCtx, list: OtcListPage, 会員ID: string, 申込者: string): Promise<void> {
  await c.step(6, async () => {
    await c.page.context().clearCookies();
    await loginAdmin(c.page, F0803_ADMIN);
    await list.open();
  });
  await c.step(7, async () => {
    // 登録直後の申込みが検索に出るまで遅れることがある。出なければ間をおいて検索し直す（最大で約1分）
    for (let k = 0; ; k++) {
      await 会員IDで検索する(list, 会員ID);
      const rows = await list.行();
      if (rows.some((r) => r.申込者.replace(/\s+/g, " ") === 申込者) || k >= 5) break;
      await c.page.waitForTimeout(10_000);
      await list.open();
    }
  });
}

/** 検索結果のうち申込者が一致する行（査定IDの新しいもの） */
async function 申込者の行(list: OtcListPage, 申込者: string) {
  const rows = (await list.行()).filter((r) => r.申込者.replace(/\s+/g, " ") === 申込者);
  expect(rows.length, `会員IDの検索結果のうち申込者が「${申込者}」の行の数`).toBeGreaterThan(0);
  return [...rows].sort((x, y) => Number(y.査定ID) - Number(x.査定ID))[0];
}

const 連携の注記 = (n: "037" | "038" | "039") =>
  `${店舗の読み替え}。会員は ${連携の会員[n].メール}（あれば使い、無ければ登録。生年月日の既定は1990年1月1日）。` +
  "買取一覧には共通の試験店舗で過去に登録した同じ会員の申込みも出るため、申込者が一致する行のうち査定IDの新しいものを使った。" +
  "管理者の権限は、正本の店頭買取管理の参照権限の代わりにシステム管理者にした。別のブラウザセッションは、同じブラウザのクッキーを全て消して代えた";

caseTest("IT-F08-03-037", async (c) => {
  const 会員 = 連携の会員["037"];
  const 申込者名 = `${会員.姓} ${会員.名}`;
  const done = await 連携の申込み(c, "037");
  const list = new OtcListPage(c.page);
  await 管理画面で会員IDを検索する(c, list, 会員ID(c, "037"), 申込者名);
  let 行: { 査定ID: string; 申込者: string } | undefined;
  await c.step(8, async () => {
    行 = await 申込者の行(list, 申込者名);
    await list.詳細を開く(行.査定ID);
  });
  let 詳細の査定番号 = "";
  await c.step(9, async () => { 詳細の査定番号 = await 買取詳細の項目(c.page, "査定番号"); });
  await c.expected(async () => {
    expect.soft(行?.申込者.replace(/\s+/g, " "), "買取一覧の会員IDの検索結果の申込者").toBe(申込者名);
    expect.soft(done.査定番号 ?? "", "手順5で控えた査定番号（空でない）").not.toBe("");
    expect.soft(詳細の査定番号, "買取詳細の査定番号").toBe(done.査定番号);
  });
  note(連携の注記("037"));
});

caseTest("IT-F08-03-038", async (c) => {
  const 会員 = 連携の会員["038"];
  const 申込者名 = `${会員.姓} ${会員.名}`;
  const done = await 連携の申込み(c, "038");
  const list = new OtcListPage(c.page);
  await 管理画面で会員IDを検索する(c, list, 会員ID(c, "038"), 申込者名);
  let 行: { 査定ID: string; 申込者: string; 買取店舗: string; ステータス: string } | undefined;
  await c.step(8, async () => { 行 = await 申込者の行(list, 申込者名); });
  await c.expected(async () => {
    expect.soft(行?.申込者.replace(/\s+/g, " "), "買取一覧の当該行の申込者（完了画面の申込者と同じ）").toBe(done.申込者);
    expect.soft(行?.申込者.replace(/\s+/g, " "), "買取一覧の当該行の申込者").toBe(申込者名);
    expect.soft(行?.買取店舗, "買取一覧の当該行の買取店舗（連携試験店002に当たる共通の試験店舗）").toBe(PD_STORE.店名);
    expect.soft(行?.ステータス, "買取一覧の当該行のステータス").toBe("査定前");
  });
  note(`${連携の注記("038")}。買取店舗は、手順の店舗に当たる共通の試験店舗の店名「${PD_STORE.店名}」で確かめた`);
});

caseTest("IT-F08-03-039", async (c) => {
  const 会員 = 連携の会員["039"];
  const 申込者名 = `${会員.姓} ${会員.名}`;
  await 連携の申込み(c, "039");
  const list = new OtcListPage(c.page);
  await 管理画面で会員IDを検索する(c, list, 会員ID(c, "039"), 申込者名);
  await c.step(8, async () => {
    const 行 = await 申込者の行(list, 申込者名);
    await list.詳細を開く(行.査定ID);
  });
  let 氏名 = "";
  let 会員IDの表示 = "";
  let ステータス = "";
  await c.step(9, async () => {
    氏名 = await 買取詳細の項目(c.page, "査定申込者氏名");
    会員IDの表示 = await 買取詳細の項目(c.page, "会員ID");
    ステータス = await 買取詳細の項目(c.page, "ステータス");
  });
  await c.expected(async () => {
    expect.soft(氏名, "買取詳細の査定申込者氏名（姓）").toContain(会員.姓);
    expect.soft(氏名, "買取詳細の査定申込者氏名（名）").toContain(会員.名);
    expect.soft(会員IDの表示, "買取詳細の会員ID").toBe(会員ID(c, "039"));
    expect.soft(ステータス, "買取詳細のステータス").toBe("査定前");
  });
  note(連携の注記("039"));
});

// ================= 会員登録の拒否（ブラックリスト） =================

/** ブラックリストに一致する氏名で会員登録つきの申込みをする（040・041 の手順1〜4）。完了画面の上部の案内の文を返す */
async function ブラックリスト会員で申込む(c: CaseCtx, n: "040" | "041", カナ: [string, string]): Promise<OtcCompletePage> {
  const a = new OtcApplyPage(c.page);
  const 氏名 = 拒否の氏名[n];
  const 印 = 申込みの印(n);
  const who: 申込者 = { 姓: 氏名.姓, 名: 氏名.名, セイ: カナ[0], メイ: カナ[1], 住所3: "ITビル803" };
  await c.step(1, async () => { await 未ログインで入力画面へ(a); });
  await c.step(2, async () => { await 入力して会員登録フォームへ(a, 日本語の入力(印), who); });
  await c.step(3, async () => { await a.会員登録の入力をして進む(ブラックリスト会員のメール(n), ブラックリスト会員のパスワード); });
  await c.step(4, async () => { await 確定して完了画面へ(c); });
  return new OtcCompletePage(c.page);
}

caseTest("IT-F08-03-040", async (c) => {
  const done = await ブラックリスト会員で申込む(c, "040", ["キンシ", "ヨンジュウ"]);
  let 文 = "";
  await c.step(5, async () => { 文 = await done.上部の案内の文(); });
  await c.expected(async () => {
    expect.soft(文, "完了画面上部の案内").toContain("ご入力いただいた内容では会員登録ができませんでした。お手数ではございますが、晴れる屋オンラインショップからもう一度ご登録ください。");
  });
  note(`${店舗の読み替え}。氏名は正本の「禁止 四十」に実行の印を付けた姓（${拒否の氏名["040"].姓}）。ブラックリストは種別「氏名」で登録済み。${印の注記(申込みの印("040"))}`);
});

caseTest("IT-F08-03-041", async (c) => {
  const done = await ブラックリスト会員で申込む(c, "041", ["キンシ", "ヨンジュウイチ"]);
  await c.step(5, async () => { await done.表示を待つ(); });
  await c.expected(async () => {
    await expect.soft(done.仮会員登録完了の案内(), "完了画面の仮会員登録完了の案内の領域").toBeVisible();
  });
  note(`${店舗の読み替え}。氏名は正本の「禁止 四十一」に実行の印を付けた姓（${拒否の氏名["041"].姓}）。ブラックリストは種別「氏名」で登録済み。${印の注記(申込みの印("041"))}`);
});

// ================= 完了画面の案内・登録内容 =================

caseTest("IT-F08-03-043", async (c) => {
  const a = new OtcApplyPage(c.page);
  const 印 = 申込みの印("043");
  await c.step(1, async () => { await 未ログインで入力画面へ(a); });
  await c.step(2, async () => { await a.入力する(日本語の入力(印), 結合太郎); });
  await c.step(3, async () => {
    expect(await a.次のページへ進む(), "「次のページへ進む」で移った画面（会員登録フォーム）").toMatch(/\/register_customer$/);
    await スキップして確認画面へ(a);
  });
  await c.step(4, async () => { await 確定して完了画面へ(c); });
  const done = new OtcCompletePage(c.page);
  await c.step(5, async () => { await done.表示を待つ(); });
  await c.expected(async () => {
    await expect.soft(done.仮会員登録完了の案内(), "完了画面の仮会員登録完了の案内の領域").toBeVisible();
  });
  note(`${店舗の読み替え}。${印の注記(印)}`);
});

caseTest("IT-F08-03-044", async (c) => {
  const 印 = 申込みの印("044");
  const i = new OtcInputPage(c.page);
  await c.step(1, async () => { await 会員でログイン(c, 会員JPのメール, F0803_PASSWORD); await i.入力画面を待つ(); });
  await c.step(2, async () => { await 入力して確認画面へ(c, 日本語の入力(印), 結合太郎); });
  await c.step(3, async () => { await 確定して完了画面へ(c); });
  let rows: db3.登録された申込み[] = [];
  await c.step(4, async () => { rows = db3.印つきの申込み(店舗ID(c, "044"), 印); });
  await c.expected(async () => {
    expect.soft(rows.length, "登録された査定申込みの件数").toBe(1);
    expect.soft(rows[0]?.登録番号 ?? null, "査定申込みに紐づく適格請求書発行事業者の登録番号（紐づいていない）").toBeNull();
  });
  note(`${店舗の読み替え}。${印の注記(印)}`);
});

caseTest("IT-F08-03-045", async (c) => {
  const 印1 = 申込みの印("045a");
  const 印2 = 申込みの印("045b");
  await c.step(1, async () => {
    await 結合会員で確認画面まで(c, 印1);
    await 確定して完了画面へ(c);
  });
  await c.step(2, async () => { await new OtcCompletePage(c.page).査定申込みへ戻る(); });
  await c.step(3, async () => {
    await 結合会員で確認画面まで(c, 印2);
    await 確定して完了画面へ(c);
  });
  let r1: db3.登録された申込み[] = [];
  let r2: db3.登録された申込み[] = [];
  await c.step(4, async () => {
    r1 = db3.印つきの申込み(店舗ID(c, "045"), 印1);
    r2 = db3.印つきの申込み(店舗ID(c, "045"), 印2);
  });
  await c.expected(async () => {
    expect.soft(r1.length + r2.length, "会員に紐づく、今回登録された査定申込みの件数").toBe(2);
    expect.soft(r1[0]?.会員ID, "1回目の査定申込みの会員ID").toBe(会員ID(c, "共有A"));
    expect.soft(r2[0]?.会員ID, "2回目の査定申込みの会員ID").toBe(会員ID(c, "共有A"));
    const 期待 = (r?: db3.登録された申込み) => r ? `${今日()}-${店舗番号2桁(r.店舗ID)}-${連番(r.先の件数 + 1)}` : "（申込みが無い）";
    expect.soft(r1[0]?.査定番号, `1回目の査定番号（同じ店舗の同じ日に先に登録された${r1[0]?.先の件数 ?? "?"}件の次の連番）`).toBe(期待(r1[0]));
    expect.soft(r2[0]?.査定番号, `2回目の査定番号（同じ店舗の同じ日に先に登録された${r2[0]?.先の件数 ?? "?"}件の次の連番）`).toBe(期待(r2[0]));
    expect.soft(Number(r2[0]?.先の件数) > Number(r1[0]?.先の件数), "2回目の連番が1回目より後").toBe(true);
  });
  note(`${店舗の読み替え}。共通の試験店舗には試験実行日の査定申込みが既にあるため、連番の「0001」「0002」は「同じ店舗の同じ日に先に登録された件数+1」で確かめた。${印の注記(`${印1} と ${印2}`)}`);
});
