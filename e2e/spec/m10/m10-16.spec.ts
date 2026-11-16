/**
 * M10-16 追加システム設定。正本: integration_test/casegen/cases/M10-16_test_cases.tsv
 *
 * 追加システム設定は全店共通の設定（共有の開発環境で全員が使う）。書き換えるケースは夜の1本流しだけで流す（config/solo_cases.tsv）。
 * シード（S-M10-16-BASE・L-BASE）が、書き換える前に画面の全項目を控え、ケースの前提に要る項目だけを書き換え、
 * ケースの終わりに基盤が画面で控えた値へ戻して確かめる（seeds/m10-16.ts・seeds/add-system-restore.ts）。ケースの手順で書き換えた値も同じく戻る。
 *
 * 実装しない: 001（S-M10-16-LEGACY が DB で設定行を登録する）・005（S-M10-16-DEFAULT-MISSING が DB で設定行を消す）・
 * 013（S-M10-16-MISSING-KEY が DB で設定行を消す）・046（S-M10-16-L-DATA-046 が DB のフィクスチャで商品・受注を作る）。
 *
 * 手順の注記（アプリの作りに合わせた読み替え）:
 * - 手順の「データ管理」は、この画面のメニューに無い。追加システム設定は大項目「設定」の下の「基本設定」にある。
 * - 「ピッキングリスト分割しきい値価格」「タイトルを変更する商品ID( , 区切り)」は画面に入力欄が無い。入れられないことを注記に残し、
 *   ほかの項目の操作は続ける。その項目の期待結果は、入力欄が無いことで不合格になる。
 * - 「更新した管理者の識別子」「更新日時」の正本の値（M1016-SEED・2026-08-01 10:00:00）は DB での準備で作れない。
 *   「変わらない」ことは、ケースの操作の前に DB で読んだ値と同じことで、「操作した管理者になる」ことは、このケースの管理者の管理者ID で確かめる。
 */
import { Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { adminUrl, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { 全部の設定の行, 設定の行, 設定の行の数, 設定の行を読む, 本店の基本情報 } from "../../db/m10_16";
import { AddSystemPage, 登録の結果, 識別ID12から18, 追加システム設定の項目 } from "../../pages/admin/m10_16_add_system";
import { 管理画面からログアウトする } from "../../pages/admin/m11_02_member";
import { M1016_ADMIN_A, M1016_BASE, M1016_L_ADMIN, M1016_L_MEMBER_045, M1016_SHOP, M1016管理者 } from "../../seeds/m10-16";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 監査の注記 = "「更新した管理者の識別子」「更新日時」の正本の開始値（M1016-SEED・2026-08-01 10:00:00）は DB での準備で作れない。変わらないことは、ケースの操作の前に DB で読んだ値と同じことで確かめた";

/** 事前準備のログインと手順1（追加システム設定画面を開く） */
async function 開く(page: Page, step: CaseCtx["step"], 番号: string): Promise<AddSystemPage> {
  await loginAdmin(page, M1016管理者(番号));
  const p = new AddSystemPage(page);
  await step(1, async () => { await p.開く(); });
  return p;
}

/** 項目に値を入れる。画面に入力欄が無い項目は入れずに返す（注記に残す） */
async function 入れられるだけ入れる(p: AddSystemPage, 値: Record<string, string>): Promise<string[]> {
  const 無い: string[] = [];
  for (const [k, v] of Object.entries(値)) {
    if (await p.欄がある(k)) await p.入れる(k, v);
    else 無い.push(k);
  }
  if (無い.length) note(`画面に入力欄が無いため入れられなかった項目: ${無い.join("・")}（ほかの項目は入れて続けた）`);
  return 無い;
}

/** 「登録」を押す。ブラウザの入力チェックで送信が止まったら注記に残す */
async function 登録(p: AddSystemPage): Promise<登録の結果> {
  const r = await p.登録して移るまで待つ();
  // 送信が送られたか、ブラウザの入力チェックで止まったかのどちらか。何も起きずに「更新されない」では確かめにならない
  expect(r.送った || r.止めた項目.length > 0, "保存の要求が送られたか、ブラウザの入力チェックで止まった").toBe(true);
  if (!r.送った) note(`ブラウザの入力チェックが送信を止めた（${r.止めた項目.join(" / ")}）。保存の要求は送られていない`);
  else if (r.応答 !== null && r.応答 < 300) note(`保存の応答は ${r.応答}（保存できなかったときは、入力の誤りを出した同じ画面が返る）`);
  return r;
}

type 比べ = [実際: unknown, 何: string, 期待: unknown];

/** 期待結果: 項目ごとの DB の設定値と期待の組。入力欄が無い項目は「（入力欄が無い）」として比べる（不合格になる） */
async function 設定値の比べ(p: AddSystemPage, 期待: Record<string, string>, 何: string): Promise<比べ[]> {
  const 有る: string[] = [];
  for (const k of Object.keys(期待)) if (await p.欄がある(k)) 有る.push(k);
  const rows = 設定の行を読む(有る);
  return Object.keys(期待).map((k): 比べ => [有る.includes(k) ? rows[k]?.値 ?? "（設定の行が無い）" : "（画面に入力欄が無い）", `${k}の設定値（${何}）`, 期待[k]]);
}

const 同じ値で = (項目: string[], v: string): Record<string, string> => Object.fromEntries(項目.map((k) => [k, v]));
const 監査情報 = (r: 設定の行 | null | undefined) => (r ? { 更新者ID: r.更新者ID, 更新日時: r.更新日時 } : null);

// ---- 002 画面の位置づけ ----

caseTest("IT-M10-16-002", async ({ page, step, expected }) => {
  note("サイドメニューに「データ管理」は無い。追加システム設定がある大項目「設定」（その下の「基本設定」）を開いて「追加システム設定」を押した");
  await loginAdmin(page, M1016_ADMIN_A);
  const p = new AddSystemPage(page);
  await step(1, async () => { await p.大項目を開く(); });
  await step(2, async () => { await p.追加システム設定を押す(); });
  await expected(async () => {
    expect.soft(await p.開いているか(), "追加システム設定画面へ遷移した").toBe(true);
  });
});

// ---- 004 表示値 ----

caseTest("IT-M10-16-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1016_ADMIN_A);
  const p = new AddSystemPage(page);
  await step(1, async () => { await p.開く(); });
  const 表示: Record<string, string | null> = {};
  await step(2, async () => { for (const k of Object.keys(M1016_BASE)) 表示[k] = await p.値(k); });
  await expected(async () => {
    for (const [k, v] of Object.entries(M1016_BASE)) expect.soft(表示[k] ?? "（入力欄が無い）", `${k}の表示値`).toBe(v);
  });
});

// ---- 006 全項目の保存 ----

const 新しい値006: Record<string, string> = {
  入荷通知最大数: "8", 買取専用メールアドレス: "testbuying-new@example.com", "レコメンドの検索期間（日数）": "9", 買取査定申込み完了画面の自動遷移秒数: "20",
  スマレジ契約ID: "CONTRACT 02", スマレジアクセストークン: "TOKEN 02", スマレジへの送信URL: "https://example.com/new", "配送日指定が繰上る時刻(hh:mm)": "13:45",
  入荷通知メールの許可: "送信する", まとめて買取商品ID: "101", 固定価格商品部門ID: "11",
  ...Object.fromEntries(識別ID12から18.map((k, i) => [k, `m${12 + i}@example.com`])),
  Small_packetが選択可能な合計金額の閾値: "2000", 英語サイト専用タグID: "51", "管理画面自動ログアウト時間（分）": "11", ピッキングリスト分割しきい値価格: "1000",
  スマレジ通信エラー送信メールアドレス: "smaregi-new@example.com", "タイトルを変更する商品ID( , 区切り)": "300,400",
};

caseTest("IT-M10-16-006", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "006");
  await step(2, async () => { await 入れられるだけ入れる(p, 新しい値006); });
  await step(3, async () => { await 登録(p); });
  await step(4, async () => { 設定の行を読む(["入荷通知最大数"]); });
  note("入荷通知メールの許可の「送信する」は、設定値 1 と読んだ（画面の選択肢の値）");
  await expected(async () => {
    for (const [a, m, e] of await 設定値の比べ(p, { ...新しい値006, 入荷通知メールの許可: "1" }, "入力した内容に更新された")) expect.soft(a, m).toEqual(e);
  });
});

// ---- 007〜009 保存後の画面 ----

async function 入荷通知最大数を8にして登録(p: AddSystemPage, step: CaseCtx["step"]): Promise<登録の結果> {
  await step(2, async () => { await p.入れる("入荷通知最大数", "8"); });
  let r!: 登録の結果;
  await step(3, async () => { r = await 登録(p); });
  return r;
}

caseTest("IT-M10-16-007", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "007");
  await 入荷通知最大数を8にして登録(p, step);
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "登録後に移った画面（追加システム設定画面）").toMatch(/\/setting\/shop\/additional_system$/);
    await expect.soft(page.locator("form#point_form"), "追加システム設定の入力欄").toBeVisible();
  });
});

caseTest("IT-M10-16-008", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "008");
  await 入荷通知最大数を8にして登録(p, step);
  await expected(async () => {
    await expect.soft(p.完了メッセージ, "画面上部の完了メッセージ「保存しました」").toBeVisible();
  });
});

caseTest("IT-M10-16-009", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "009");
  await 入荷通知最大数を8にして登録(p, step);
  let 値: string | null = null;
  await step(4, async () => { 値 = await p.値("入荷通知最大数"); });
  await expected(async () => { expect.soft(値, "遷移後の入荷通知最大数の入力値").toBe("8"); });
});

// ---- 010 店舗設定の基本情報に影響しない ----

caseTest("IT-M10-16-010", async ({ page, step, expected }) => {
  const 前 = 本店の基本情報();
  const p = await 開く(page, step, "010");
  await 入荷通知最大数を8にして登録(p, step);
  let 後!: ReturnType<typeof 本店の基本情報>;
  await step(4, async () => { 後 = 本店の基本情報(); });
  note("店舗設定の基本情報（本店）は、ケースの操作の前に DB で読んだ値（S-M10-16-SHOP で保存した値）と比べた");
  await expected(async () => {
    expect.soft(後, "店舗設定の基本情報（操作の前と同じ）").toEqual(前);
    expect.soft(後.店名, "店舗名（S-M10-16-SHOP の値）").toBe(M1016_SHOP.店名);
    expect.soft(後.電話番号.replace(/\D/g, ""), "電話番号（S-M10-16-SHOP の値）").toBe(M1016_SHOP.電話番号.replace(/\D/g, ""));
    expect.soft(後.郵便番号.replace(/\D/g, ""), "郵便番号（S-M10-16-SHOP の値）").toBe(M1016_SHOP.郵便番号.replace(/\D/g, ""));
  });
});

// ---- 011・012 変更した項目だけを保存する ----

caseTest("IT-M10-16-011", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "011");
  const 前 = 設定の行を読む(["入荷通知最大数"])["入荷通知最大数"];
  await step(2, async () => {
    expect(await p.値("入荷通知最大数"), "入荷通知最大数の表示値（6 のまま変えない）").toBe("6");
    const r = await 登録(p);
    expect(r.送った, "保存の要求が送られた（送られずに「更新されない」では確かめにならない）").toBe(true);
  });
  let 後: 設定の行 | null = null;
  await step(3, async () => { 後 = 設定の行を読む(["入荷通知最大数"])["入荷通知最大数"]; });
  note(監査の注記);
  await expected(async () => {
    expect.soft(後?.値, "入荷通知最大数の設定値").toBe("6");
    expect.soft(監査情報(後), "入荷通知最大数の設定行の更新した管理者・更新日時（操作の前と同じ）").toEqual(監査情報(前));
  });
});

caseTest("IT-M10-16-012", async ({ page, step, expected, notes }) => {
  const p = await 開く(page, step, "012");
  const 前 = 設定の行を読む(["入荷通知最大数"])["入荷通知最大数"];
  const 行の数 = 設定の行の数();
  await 入荷通知最大数を8にして登録(p, step);
  let 後: 設定の行 | null = null;
  await step(4, async () => { 後 = 設定の行を読む(["入荷通知最大数"])["入荷通知最大数"]; });
  note("「更新した管理者の識別子が M1016-A-012」は、管理者識別子を画面で設定できないため、更新した管理者がこのケースの管理者（〔管理者ID-M1016-012〕）であることで確かめた");
  await expected(async () => {
    expect.soft(後?.値, "入荷通知最大数の設定値").toBe("8");
    expect.soft(後?.更新者ID, "更新した管理者（このケースの管理者の管理者ID）").toBe(notes.get("〔管理者ID-M1016-012〕"));
    expect.soft((後?.更新日時 ?? "") > (前?.更新日時 ?? ""), `更新日時が保存前（${前?.更新日時 ?? "なし"}）より後（${後?.更新日時 ?? "なし"}）`).toBe(true);
    expect.soft(設定の行の数(), "設定の行の数（行が足されたり消されたりしていない）").toBe(行の数);
  });
});

// ---- 014・015 空にする ----

const 任意の8項目 = ["買取査定申込み完了画面の自動遷移秒数", "スマレジ契約ID", "スマレジアクセストークン", "スマレジへの送信URL", "まとめて買取商品ID", ...識別ID12から18, "スマレジ通信エラー送信メールアドレス", "タイトルを変更する商品ID( , 区切り)"];
caseTest("IT-M10-16-014", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "014");
  await step(2, async () => { await 入れられるだけ入れる(p, 同じ値で(任意の8項目, "")); });
  await step(3, async () => { await 登録(p); });
  await step(4, async () => { 設定の行を読む(["スマレジ契約ID"]); });
  await expected(async () => { for (const [a, m, e] of await 設定値の比べ(p, 同じ値で(任意の8項目, ""), "空文字へ更新された")) expect.soft(a, m).toEqual(e); });
});

const 必須の9項目 = ["入荷通知最大数", "買取専用メールアドレス", "レコメンドの検索期間（日数）", "配送日指定が繰上る時刻(hh:mm)", "固定価格商品部門ID", "Small_packetが選択可能な合計金額の閾値", "英語サイト専用タグID", "管理画面自動ログアウト時間（分）", "ピッキングリスト分割しきい値価格"];

/** 期待結果「各設定行が S-M10-16-BASE の内容から更新されない」の比べ: 値は BASE の値、更新した管理者・更新日時は操作の前と同じ。入力欄が無い項目は不合格になる */
function 更新されない比べ(項目: string[], 前: Record<string, 設定の行 | null>, 後: Record<string, 設定の行 | null>): 比べ[] {
  const out: 比べ[] = [];
  for (const k of 項目) {
    if (!(k in 後)) { out.push(["（画面に入力欄が無い）", `${k}の設定値（S-M10-16-BASE の値のまま）`, M1016_BASE[k]]); continue; }
    out.push([後[k]?.値 ?? "（設定の行が無い）", `${k}の設定値（S-M10-16-BASE の値のまま）`, M1016_BASE[k]]);
    out.push([監査情報(後[k]), `${k}の設定行の更新した管理者・更新日時（操作の前と同じ）`, 監査情報(前[k])]);
  }
  return out;
}

/** 値を入れて登録し、DB で確かめるケースの共通の流れ（手順2〜最後） */
async function 入れて登録して読む(
  ctx: Pick<CaseCtx, "step">, p: AddSystemPage, 手順: { 入れる: number[]; 登録: number; DB: number }, 値: Record<string, string>[], 読む項目: string[],
): Promise<{ 前: Record<string, 設定の行 | null>; 後: Record<string, 設定の行 | null> }> {
  const 有る: string[] = [];
  for (const k of 読む項目) if (await p.欄がある(k)) 有る.push(k);
  const 前 = 設定の行を読む(有る);
  for (let i = 0; i < 手順.入れる.length; i++) await ctx.step(手順.入れる[i], async () => { await 入れられるだけ入れる(p, 値[i]); });
  await ctx.step(手順.登録, async () => { await 登録(p); });
  let 後: Record<string, 設定の行 | null> = {};
  await ctx.step(手順.DB, async () => { 後 = 設定の行を読む(有る); });
  return { 前, 後 };
}

caseTest("IT-M10-16-015", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "015");
  const { 前, 後 } = await 入れて登録して読む({ step }, p, { 入れる: [2], 登録: 3, DB: 4 }, [同じ値で(必須の9項目, "")], 必須の9項目);
  note(監査の注記);
  await expected(async () => {
    for (const [a, m, e] of 更新されない比べ(必須の9項目, 前, 後)) expect.soft(a, m).toEqual(e);
  });
});

// ---- 017・018 最大文字数 ----

const メール9 = ["買取専用メールアドレス", ...識別ID12から18];
caseTest("IT-M10-16-017", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "017");
  const mail = `${"a".repeat(243)}@example.com`;
  const 分 = "1".repeat(255);
  const v = { ...同じ値で(メール9, mail), "管理画面自動ログアウト時間（分）": 分 };
  await 入れて登録して読む({ step }, p, { 入れる: [2, 3], 登録: 4, DB: 5 }, [同じ値で(メール9, mail), { "管理画面自動ログアウト時間（分）": 分 }], Object.keys(v));
  await expected(async () => { for (const [a, m, e] of await 設定値の比べ(p, v, "255文字の値で更新された")) expect.soft(a, m).toEqual(e); });
});

caseTest("IT-M10-16-018", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "018");
  const mail = `${"a".repeat(244)}@example.com`;
  const 分 = "1".repeat(256);
  const 項目 = [...メール9, "管理画面自動ログアウト時間（分）"];
  const { 前, 後 } = await 入れて登録して読む({ step }, p, { 入れる: [2, 3], 登録: 4, DB: 5 }, [同じ値で(メール9, mail), { "管理画面自動ログアウト時間（分）": 分 }], 項目);
  note(監査の注記);
  await expected(async () => { for (const [a, m, e] of 更新されない比べ(項目, 前, 後)) expect.soft(a, m).toEqual(e); });
});

// ---- 019〜023 数値の境界 ----

const 数値8 = ["入荷通知最大数", "レコメンドの検索期間（日数）", "買取査定申込み完了画面の自動遷移秒数", "まとめて買取商品ID", "Small_packetが選択可能な合計金額の閾値", "英語サイト専用タグID", "管理画面自動ログアウト時間（分）", "ピッキングリスト分割しきい値価格"];

caseTest("IT-M10-16-019", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "019");
  await 入れて登録して読む({ step }, p, { 入れる: [2], 登録: 3, DB: 4 }, [同じ値で(数値8, "0")], 数値8);
  note("管理画面自動ログアウト時間（分）を 0 にすると、自動ログアウトが働かない（アプリの作り）。ケースの終わりに基盤が元の値へ戻す");
  await expected(async () => { for (const [a, m, e] of await 設定値の比べ(p, 同じ値で(数値8, "0"), "下限値0へ更新された")) expect.soft(a, m).toEqual(e); });
});

caseTest("IT-M10-16-020", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "020");
  const { 前, 後 } = await 入れて登録して読む({ step }, p, { 入れる: [2], 登録: 3, DB: 4 }, [同じ値で(数値8, "-1")], 数値8);
  note(監査の注記);
  await expected(async () => {
    for (const [a, m, e] of 更新されない比べ(数値8, 前, 後)) expect.soft(a, m).toEqual(e);
  });
});

caseTest("IT-M10-16-021", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "021");
  await 入れて登録して読む({ step }, p, { 入れる: [2], 登録: 3, DB: 4 }, [{ 固定価格商品部門ID: "1" }], ["固定価格商品部門ID"]);
  await expected(async () => { for (const [a, m, e] of await 設定値の比べ(p, { 固定価格商品部門ID: "1" }, "下限値1へ更新された")) expect.soft(a, m).toEqual(e); });
});

caseTest("IT-M10-16-023", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "023");
  const 項目 = [...数値8.slice(0, 4), "固定価格商品部門ID", ...数値8.slice(4)];
  const { 前, 後 } = await 入れて登録して読む({ step }, p, { 入れる: [2], 登録: 3, DB: 4 }, [同じ値で(項目, "1.5")], 項目);
  note(監査の注記);
  await expected(async () => {
    for (const [a, m, e] of 更新されない比べ(項目, 前, 後)) expect.soft(a, m).toEqual(e);
  });
});

// ---- 024 メールアドレスの形式 ----

caseTest("IT-M10-16-024", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "024");
  const 項目 = [...メール9, "スマレジ通信エラー送信メールアドレス"];
  const { 前, 後 } = await 入れて登録して読む({ step }, p, { 入れる: [2], 登録: 3, DB: 4 }, [同じ値で(項目, "invalid-address")], 項目);
  note(監査の注記);
  await expected(async () => { for (const [a, m, e] of 更新されない比べ(項目, 前, 後)) expect.soft(a, m).toEqual(e); });
});

// ---- 025〜029 スマレジ ----

caseTest("IT-M10-16-025", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "025");
  const v = { スマレジ契約ID: "ABC 123", スマレジアクセストークン: "ABC 123" };
  await 入れて登録して読む({ step }, p, { 入れる: [2], 登録: 3, DB: 4 }, [v], Object.keys(v));
  await expected(async () => { for (const [a, m, e] of await 設定値の比べ(p, v, "ABC 123へ更新された")) expect.soft(a, m).toEqual(e); });
});

caseTest("IT-M10-16-026", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "026");
  const 項目 = ["スマレジ契約ID", "スマレジアクセストークン"];
  const { 前, 後 } = await 入れて登録して読む({ step }, p, { 入れる: [2], 登録: 3, DB: 4 }, [同じ値で(項目, "ＡＢＣ")], 項目);
  note(監査の注記);
  await expected(async () => { for (const [a, m, e] of 更新されない比べ(項目, 前, 後)) expect.soft(a, m).toEqual(e); });
});

function URLのケース(番号: string, url: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const p = await 開く(page, step, 番号);
    await 入れて登録して読む({ step }, p, { 入れる: [2], 登録: 3, DB: 4 }, [{ スマレジへの送信URL: url }], ["スマレジへの送信URL"]);
    if (番号 === "028") note("開始値と同じ値（https://example.com/smaregi）を入れた。値が同じ項目は保存の対象にならない（アプリの作り）ので、設定値が同じ値であることを確かめた");
    await expected(async () => { for (const [a, m, e] of await 設定値の比べ(p, { スマレジへの送信URL: url }, `${url}へ更新された`)) expect.soft(a, m).toEqual(e); });
  };
}
caseTest("IT-M10-16-027", URLのケース("027", "http://example.com/smaregi"));
caseTest("IT-M10-16-028", URLのケース("028", "https://example.com/smaregi"));
caseTest("IT-M10-16-029", URLのケース("029", "ftp://example.com/smaregi"));

// ---- 031・032 時刻 ----

function 時刻のケース(番号: string, t: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const p = await 開く(page, step, 番号);
    await 入れて登録して読む({ step }, p, { 入れる: [2], 登録: 3, DB: 4 }, [{ "配送日指定が繰上る時刻(hh:mm)": t }], ["配送日指定が繰上る時刻(hh:mm)"]);
    await expected(async () => { for (const [a, m, e] of await 設定値の比べ(p, { "配送日指定が繰上る時刻(hh:mm)": t }, `${t}へ更新された`)) expect.soft(a, m).toEqual(e); });
  };
}
caseTest("IT-M10-16-031", 時刻のケース("031", "00:00"));
caseTest("IT-M10-16-032", 時刻のケース("032", "23:59"));

// ---- 035・036 入荷通知メールの許可 ----

function 許可のケース(番号: string, 選択: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const p = await 開く(page, step, 番号);
    await step(2, async () => { await p.入れる("入荷通知メールの許可", 選択); });
    await step(3, async () => { await 登録(p); });
    let 表示: string | null = null;
    await step(4, async () => { await p.開く(); 表示 = await p.値("入荷通知メールの許可"); });
    await expected(async () => { expect.soft(表示, "開き直した画面の入荷通知メールの許可の選択").toBe(選択); });
  };
}
caseTest("IT-M10-16-035", 許可のケース("035", "送信する"));
caseTest("IT-M10-16-036", 許可のケース("036", "送信しない"));

// ---- 037・051 タイトルを変更する商品ID ----

function タイトルのケース(番号: string, 値: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const p = await 開く(page, step, 番号);
    await step(2, async () => { await 入れられるだけ入れる(p, { "タイトルを変更する商品ID( , 区切り)": 値 }); });
    await step(3, async () => { await 登録(p); });
    await step(4, async () => { 設定の行を読む(["入荷通知最大数"]); });
    note("「タイトルを変更する商品ID( , 区切り)」は画面に入力欄が無く、設定の行の名前も分からないので、DB の確かめは入力欄が無いことで不合格になる");
    await expected(async () => { for (const [a, m, e] of await 設定値の比べ(p, { "タイトルを変更する商品ID( , 区切り)": 値 }, `${値}へ更新された`)) expect.soft(a, m).toEqual(e); });
  };
}
caseTest("IT-M10-16-037", タイトルのケース("037", "100,200"));
caseTest("IT-M10-16-051", タイトルのケース("051", "100"));

// ---- 039・040 なりすまし対策トークン ----

caseTest("IT-M10-16-039", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "039");
  await step(2, async () => { await p.入れる("入荷通知最大数", "8"); });
  await step(3, async () => { await p.トークンを書き換える("invalid-token"); });
  let r!: 登録の結果;
  await step(4, async () => { r = await 登録(p); });
  await step(5, async () => { expect(r.送った, "保存の要求が送られた").toBe(true); });
  note("手順の「開発者ツールで」は、画面のなりすまし対策トークンの欄の値を書き換え、保存の要求の応答のステータスを読んだ");
  await expected(async () => { expect.soft(r.応答, "保存要求のHTTP応答ステータス").toBe(403); });
});

caseTest("IT-M10-16-040", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "040");
  await step(2, async () => { await p.入れる("入荷通知最大数", "8"); });
  await step(3, async () => { await p.トークンを書き換える("invalid-token"); });
  await step(4, async () => {
    const r = await 登録(p);
    expect(r.送った, "保存の要求が送られた（送られずに「更新されない」では確かめにならない）").toBe(true);
  });
  let 後: 設定の行 | null = null;
  await step(5, async () => { 後 = 設定の行を読む(["入荷通知最大数"])["入荷通知最大数"]; });
  await expected(async () => { expect.soft(後?.値, "入荷通知最大数の設定値（6 のまま）").toBe("6"); });
});

// ---- 041 2つのブラウザでの保存 ----

caseTest("IT-M10-16-041", async ({ page, browser, step, expected }) => {
  await loginAdmin(page, M1016管理者("041"));
  const ctxB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const pageB = await ctxB.newPage();
    await loginAdmin(pageB, M1016管理者("B-041"));
    const A = new AddSystemPage(page);
    const B = new AddSystemPage(pageB);
    await step(1, async () => { await A.開く(); });
    await step(2, async () => { await B.開く(); });
    await step(3, async () => { await B.入れる("入荷通知最大数", "7"); await B.登録して保存を確かめる("ブラウザBの保存"); });
    await step(4, async () => { await A.入れる("入荷通知最大数", "8"); await 登録(A); });
    let 後: 設定の行 | null = null;
    await step(5, async () => { 後 = 設定の行を読む(["入荷通知最大数"])["入荷通知最大数"]; });
    note("ブラウザA はケースの画面、ブラウザB は別のブラウザセッション（別の管理者でログイン）で操作した");
    await expected(async () => { expect.soft(後?.値, "入荷通知最大数の設定値（後から保存したブラウザAの値）").toBe("8"); });
  } finally { await ctxB.close(); }
});

// ---- 042 上限なし ----

caseTest("IT-M10-16-042", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "042");
  const 数 = ["入荷通知最大数", "レコメンドの検索期間（日数）", "買取査定申込み完了画面の自動遷移秒数", "まとめて買取商品ID", "固定価格商品部門ID", "Small_packetが選択可能な合計金額の閾値", "英語サイト専用タグID"];
  const a300 = "a".repeat(300);
  const 文字 = { スマレジ契約ID: a300, スマレジアクセストークン: a300, スマレジへの送信URL: `https://example.com/${a300}` };
  await step(2, async () => { await 入れられるだけ入れる(p, 同じ値で(数, "999999999")); });
  await step(3, async () => { await 入れられるだけ入れる(p, 文字); });
  let 保存できた = false;
  await step(4, async () => { await 登録(p); 保存できた = await p.完了メッセージ.isVisible(); });
  const 表示: Record<string, string | null> = {};
  await step(5, async () => { await p.開く(); for (const k of [...数, ...Object.keys(文字)]) 表示[k] = await p.値(k); });
  await expected(async () => {
    expect.soft(保存できた, "登録後に「保存しました」が表示された（上限超過のエラーにならない）").toBe(true);
    for (const k of 数) expect.soft(表示[k], `${k}の表示値`).toBe("999999999");
    for (const [k, v] of Object.entries(文字)) expect.soft(表示[k], `${k}の表示値（${v.length}文字）`).toBe(v);
  });
});

// ---- 045 自動ログアウト時間の連携 ----

caseTest("IT-M10-16-045", async ({ page, browser, step, expected }) => {
  const p = new AddSystemPage(page);
  await step(1, async () => { await loginAdmin(page, M1016_L_ADMIN); });
  await step(2, async () => {
    note("サイドメニューに「データ管理」は無い。大項目「設定」の下の「基本設定」の「追加システム設定」を開いた");
    await p.大項目を開く();
    await p.追加システム設定を押す();
  });
  await step(3, async () => {
    expect(await p.値("管理画面自動ログアウト時間（分）"), "管理画面自動ログアウト時間（分）の表示値").toBe("10");
    await p.入れる("管理画面自動ログアウト時間（分）", "1");
    await 登録(p);
  });
  await step(4, async () => {
    await expect(p.完了メッセージ, "完了メッセージ「保存しました」").toBeVisible();
    await 管理画面からログアウトする(page);
  });
  note("自動ログアウト時間を1分にしている時間を短くするため、手順4〜7はすぐに続けて行い、ケースの終わりに基盤が元の値へ戻す。メンバーのログインIDには実行の印を付けた");
  await step(5, async () => {
    await loginAdmin(page, M1016_L_MEMBER_045);
    await page.goto(adminUrl("/setting/system/member"), { timeout: 60_000 });
    await page.waitForLoadState("load");
    await expect(page.locator('tr[id^="ex-member-"]').first(), "メンバー管理一覧画面の行").toBeVisible({ timeout: 60_000 });
  });
  await step(6, async () => { await page.waitForTimeout(90_000); });
  await step(7, async () => { await page.reload({ timeout: 60_000, waitUntil: "load" }); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "再読み込み後の画面（管理画面のログイン画面）").toMatch(/\/login$/);
    await expect.soft(page.locator('tr[id^="ex-member-"]'), "メンバー管理一覧の行（表示されない）").toHaveCount(0);
  });
});

// ---- 049〜050 保存の対象 ----

caseTest("IT-M10-16-049", async ({ page, step, expected, notes }) => {
  const p = await 開く(page, step, "049");
  const 前 = 全部の設定の行();
  const 入荷 = 追加システム設定の項目["入荷通知最大数"] ?? "";
  await 入荷通知最大数を8にして登録(p, step);
  let 後: Record<string, 設定の行> = {};
  await step(4, async () => { 後 = 全部の設定の行(); });
  note(`${監査の注記}。「識別子 M1016-A-049」は、更新した管理者がこのケースの管理者（〔管理者ID-M1016-049〕）であることで確かめた`);
  await expected(async () => {
    const 入荷の行 = 設定の行を読む(["入荷通知最大数"])["入荷通知最大数"];
    expect.soft(入荷の行?.値, "入荷通知最大数の設定値").toBe("8");
    expect.soft(入荷の行?.更新者ID, "入荷通知最大数の更新した管理者（このケースの管理者）").toBe(notes.get("〔管理者ID-M1016-049〕"));
    const 変わった行 = Object.keys(後).filter((k) => k !== 入荷 && (!前[k] || 前[k].更新者ID !== 後[k].更新者ID || 前[k].更新日時 !== 後[k].更新日時));
    expect.soft(変わった行.length, `入荷通知最大数のほかに、更新した管理者・更新日時が変わった設定行の数（${変わった行.length ? "変わった行あり" : "なし"}）`).toBe(0);
    expect.soft(Object.keys(後).length, "設定行の数（操作の前と同じ）").toBe(Object.keys(前).length);
  });
});

caseTest("IT-M10-16-050", async ({ page, step, expected }) => {
  const p = await 開く(page, step, "050");
  const 項目 = ["入荷通知最大数", "買取専用メールアドレス"];
  const { 前, 後 } = await 入れて登録して読む({ step }, p, { 入れる: [2], 登録: 3, DB: 4 }, [{ 入荷通知最大数: "8", 買取専用メールアドレス: "invalid-address" }], 項目);
  note(監査の注記);
  await expected(async () => { for (const [a, m, e] of 更新されない比べ(項目, 前, 後)) expect.soft(a, m).toEqual(e); });
});

