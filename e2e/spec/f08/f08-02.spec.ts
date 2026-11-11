/**
 * F08-02 店頭買取査定申込情報入力。正本: cases/F08-02_test_cases.tsv
 *
 * - 店舗は、ケースごとの店舗（店舗識別名 it_f0802 など）の代わりに F08-05 と共通の試験店舗（支店URL itf0805pd003）を使う（seeds/f08-02.ts の読み替え）。
 *   手順の店舗識別名は、この店舗の支店URLとして読む。
 * - 会員登録フォームのメールアドレスの前半、ブラックリストの住所のキーワードと手順の住所、DB で数える申込者の姓には実行の印を付ける。
 * - 会員登録フォームは申込情報を画面に出さない（セッションに持つ）。「会員登録フォームで保持された査定申込情報を確認する」手順は、
 *   会員登録フォームが表示されたことを確かめてから「会員登録をスキップする」で確認画面へ移り、その表示で読む（申込みは確定しない）。
 * - 事前準備の「新しいブラウザセッション」はケースごとのブラウザのコンテキスト。「エントリー開始済み」は、事前準備で申込前ログイン画面から
 *   ゲスト向け導線（アカウントをお持ちでない方はこちら）で入力画面を開き、何も入力されていないことを確かめた状態。
 */
import { test } from "@playwright/test";
import { CaseBody, caseTest, CaseCtx, expect } from "../../lib/case";
import * as db from "../../db/f08_05";
import { 会員の査定申込みの数 } from "../../db/f08_02";
import { StoreEntryPage } from "../../pages/front/f08_store_url";
import { MemberApplyPage } from "../../pages/front/f08_05_apply";
import { OtcApplyPage, 申込入力, 申込者 } from "../../pages/front/f08_05_confirm";
import { OtcInputPage, 会員登録フォームのURL, 入力画面のURL, 入力欄の値, 言語 } from "../../pages/front/f08_02_input";
import {
  CBSKIPの申込者, CB海外の入力, F0802の会員, IN_EN, IN_ENの申込者, IN_JP, IN_JPの申込者, IN_MINOR, IN_MINORの申込者, IN_REGNO_058,
  IN_SUPPLY1_059, IN_SUPPLY_045, IN_TEL5_044, PD_STORE, 住所ブラックリスト, 印つきメール,
} from "../../seeds/f08-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 共通の試験店舗の支店URL（手順の店舗識別名の読み替え） */
const 支店URL = PD_STORE.支店URL;
const 店舗の読み替え = `手順の店舗識別名は、F08-05 と共通の試験店舗の支店URL「${支店URL}」として開いた（シード作成時の問題の読み替え）`;
const 保持の読み方 = "会員登録フォームは申込情報を画面に出さない（入力欄はメールアドレス・パスワードと利用規約同意だけで、申込情報はセッションに持つ）。" +
  "保持された申込情報は、会員登録フォームが表示されたことを確かめてから「会員登録をスキップする」で移った確認画面の表示で確かめた（申込みは確定していない）";
const 入力値の補い = "シード表の入力値に職業が無いが、必須の欄なので S-F08-02-IN-JP と同じ「会社員」（英語表示はそれに当たる選択肢）を選んだ。郵便番号が無いものは入れていない";

type 部品 = { i: OtcInputPage; a: OtcApplyPage };
const 部品 = (c: CaseCtx): 部品 => ({ i: new OtcInputPage(c.page), a: new OtcApplyPage(c.page) });

/** 事前準備: 申込前ログイン画面を開き、ログインせずにゲスト向け導線で入力画面を開き、何も入力されていないことを確かめる（エントリー開始済み） */
async function エントリーを始める(p: 部品, 言語: 言語 = "ja"): Promise<void> {
  await p.i.申込前ログイン画面を開く(支店URL, 言語);
  await p.a.アカウントなしで進む();
  if (!(await p.i.何も入力されていない())) throw new Error("事前準備: 申込情報入力画面が、何も入力されていない状態で表示されない");
}

/** 手順「店頭買取査定申込情報入力画面を開く」: 入力画面のURLを開き、入力画面であることを確かめる */
async function 入力画面を開く(p: 部品, 言語: 言語 = "ja"): Promise<void> {
  await p.i.入力画面を開く(支店URL, 言語);
  await p.i.入力画面を待つ();
}

/** 手順「申込前ログイン画面からゲスト向け導線で入力画面を開く」 */
async function ゲストで入力画面を開く(p: 部品, 言語: 言語 = "ja"): Promise<void> {
  await p.i.申込前ログイン画面を開く(支店URL, 言語);
  await p.a.アカウントなしで進む();
}

/** 入力して「次のページへ進む」を押す。会員登録フォームが表示されたかを返す（表示されなくても止めない） */
async function 入力して進む(p: 部品, v: 申込入力, who: 申込者): Promise<boolean> {
  await p.a.入力する(v, who);
  await p.i.次のページへ進むを押す();
  const shown = await p.i.会員登録フォームか();
  if (!shown) note(`「次のページへ進む」を押したあと、会員登録フォームが表示されなかった（${p.i.パス}）`);
  return shown;
}

/** 手順「会員登録フォームで保持された査定申込情報を確認する」: 会員登録フォームから「会員登録をスキップする」で確認画面へ移る。確認画面へ移れたかを返す */
async function 保持された申込情報を開く(p: 部品, 会員登録フォームへ移った: boolean): Promise<boolean> {
  note(保持の読み方);
  if (!会員登録フォームへ移った) { note("会員登録フォームが表示されていないので、保持された申込情報を確認画面で読めなかった"); return false; }
  await p.i.会員登録なしで進むを押す();
  const ok = await p.a.確定ボタン().isVisible();
  if (!ok) note(`「会員登録をスキップする」を押したあと、確認画面が表示されなかった（${p.i.パス}）`);
  return ok;
}

/** 会員登録フォームの値を入れて「次のページへ進む」を押し、確認画面であることを確かめる */
async function 会員登録して確認画面へ(p: 部品, メール: string, パスワード: string): Promise<void> {
  await p.i.会員登録の値を入れる(メール, パスワード);
  await p.i.会員登録ありで進むを押す();
  await p.a.確認画面を待つ();
}

/** 確認画面の確定のボタンを押す（完了画面へ移らなければ注記に残す） */
async function 確定する(p: 部品): Promise<void> {
  const r = await p.a.確定する();
  if (!r.完了画面) note(`確定のボタンを押したあと、完了画面ではなく ${r.パス} へ移った`);
}

const 店舗ID = (c: CaseCtx, 呼び名: string) => c.notes.get(`〔店舗ID-F0802-${呼び名}〕`);
const 文字数 = (s: string, ch: string) => [...s].filter((x) => x === ch).length;

// ================= 画面の表示・初期値 =================

caseTest("IT-F08-02-001", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await p.i.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await p.a.アカウントなしで進む(); });
  await c.step(3, async () => { await p.i.利用規約の詳細を押す(); });
  await c.expected(async () => {
    await expect.soft(p.i.利用規約のモーダル(), "共通の利用規約を表示するモーダル").toBeVisible();
    await expect.soft(p.i.モーダルの個人情報のボタン(), "モーダルの中の、個人情報の取り扱い（プライバシーポリシー）のボタンの数").toHaveCount(0);
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-005", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await p.i.申込前ログイン画面を開く(支店URL, "ja"); });
  await c.step(2, async () => { await p.i.申込前ログイン画面で言語を選ぶ("JP"); });
  await c.step(3, async () => { await p.a.アカウントなしで進む(); });
  await c.expected(async () => {
    expect.soft(await p.i.入力画面の言語(), "申込情報入力画面の Language").toBe("JP");
    const labels = await p.i.項目名();
    for (const l of ["国", "住所", "生年月日", "電話番号"]) expect.soft(labels, `入力フォームの項目名（日本語の「${l}」）`).toContain(l);
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-006", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await p.i.申込前ログイン画面を開く(支店URL, "ja"); });
  await c.step(2, async () => { await p.i.申込前ログイン画面で言語を選ぶ("EN"); });
  await c.step(3, async () => { await p.a.アカウントなしで進む(); });
  await c.expected(async () => {
    expect.soft(await p.i.入力画面の言語(), "申込情報入力画面の Language").toBe("EN");
    const labels = await p.i.項目名();
    for (const l of ["Country", "Address", "Date of birth", "Phone Number"]) expect.soft(labels, `入力フォームの項目名（英語の「${l}」）`).toContain(l);
  });
  note(`${店舗の読み替え}。項目名が英語であることは、国・住所・生年月日・電話番号の見出しで確かめた`);
});

caseTest("IT-F08-02-007", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await p.i.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await p.a.アカウントなしで進む(); });
  const v: Record<string, string | boolean> = {};
  await c.step(3, async () => {
    v.国 = await p.i.選択中("country");
    v.電話連絡 = await p.i.ラジオ選択中("call_flg");
    v.大会 = await p.i.ラジオ選択中("playing_flg");
    v.適格 = await p.i.ラジオ選択中("qualifiedInvoiceIssuerFlg");
    v.同意 = await p.i.利用規約同意の状態();
  });
  await c.expected(async () => {
    expect.soft(v.国, "国の初期値").toBe("Japan");
    expect.soft(v.電話連絡, "電話連絡の初期値").toBe("不必要");
    expect.soft(v.大会, "大会参加中または参加予定の初期値").toBe("いいえ");
    expect.soft(v.適格, "適格請求書発行事業者確認の初期値").toBe("いいえ");
    expect.soft(v.同意, "利用規約同意のチェック（チェックなし）").toBe(false);
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-008", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.a.国を選ぶ("日本"); });
  await c.expected(async () => {
    await expect.soft(p.i.郵便番号1の欄(), "郵便番号1の欄").toBeVisible();
    await expect.soft(p.i.郵便番号2の欄(), "郵便番号2の欄").toBeVisible();
    await expect.soft(p.i.都道府県の欄(), "都道府県の欄").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-009", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.a.国を選ぶ("米国"); });
  await c.expected(async () => {
    await expect(p.i.欄("lastName"), "申込情報入力画面のお名前（姓）の欄（読み込みが済んだ）").toBeVisible();
    await expect.soft(p.i.郵便番号1の欄(), "郵便番号1の欄（表示されない）").toBeHidden();
    await expect.soft(p.i.郵便番号2の欄(), "郵便番号2の欄（表示されない）").toBeHidden();
    await expect.soft(p.i.都道府県の欄(), "都道府県の欄（表示されない）").toBeHidden();
  });
  note(`${店舗の読み替え}。国の選択肢は「United States」に当たるもの（アメリカ合衆国）を選んだ`);
});

caseTest("IT-F08-02-011", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p, "ja");
  await c.step(1, async () => { await 入力画面を開く(p, "ja"); });
  await c.step(2, async () => {
    await p.i.打つ("lastName", "やまだ");
    await p.i.打つ("firstName", "たろう");
  });
  const v = { セイ: "", メイ: "" };
  await c.step(3, async () => { v.セイ = await p.i.値("lastNameKana"); v.メイ = await p.i.値("firstNameKana"); });
  await c.expected(async () => {
    expect.soft(v.セイ, "お名前（フリガナ）（姓）の自動設定").toBe("ヤマダ");
    expect.soft(v.メイ, "お名前（フリガナ）（名）の自動設定").toBe("タロウ");
  });
  note(`${店舗の読み替え}。お名前は1文字ずつ打った（フリガナの自動入力は打鍵に反応する）。自動設定の値は、入力したお名前のカタカナ（ヤマダ・タロウ）として確かめた`);
});

caseTest("IT-F08-02-013", async (c) => {
  test.setTimeout(25 * 60_000);
  const p = 部品(c);
  await c.step(1, async () => { await ゲストで入力画面を開く(p); });
  let 待った後 = "";
  await c.step(2, async () => {
    await c.page.waitForTimeout(10 * 60_000 + 30_000);
    await c.page.waitForLoadState("load");
    待った後 = p.i.パス;
  });
  await c.expected(async () => {
    expect.soft(待った後, "10分を過ぎたあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(`${店舗の読み替え}。画面を開いてから10分30秒待って、画面を読んだ`);
});

// ================= 入力と遷移 =================

caseTest("IT-F08-02-002", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.a.入力する(IN_JP, { ...IN_JPの申込者, 住所3: "" }); });
  await c.step(3, async () => { await p.i.次のページへ進むを押す(); });
  await c.expected(async () => {
    await expect(p.i.会員登録フォーム(), "住所3が空で「次のページへ進む」を押したあとの会員登録フォーム").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-003", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  let shown = false;
  await c.step(2, async () => { shown = await 入力して進む(p, IN_JP, IN_JPの申込者); });
  let ok = false;
  await c.step(3, async () => { ok = await 保持された申込情報を開く(p, shown); });
  await c.expected(async () => {
    expect(ok, "会員登録フォームから、保持された申込情報を表示する確認画面へ移れた").toBe(true);
    expect.soft(await p.a.確認の値("住所"), "保持された住所（住所3）").toContain("晴れる屋ビル3階");
    const s = (await p.a.確認の値("返却希望サプライ")) ?? "";
    expect.soft(s, "保持された返却希望サプライ（スリーブ）").toContain("スリーブ");
    expect.soft(s, "保持された返却希望サプライ（ストレージボックス）").toContain("ストレージボックス");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-012", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.a.入力する(IN_MINOR, IN_MINORの申込者); });
  await c.step(3, async () => {
    await p.i.次のページへ進むを押す();
    await expect(p.i.未成年確認モーダル(), "未成年確認モーダル").toBeVisible();
  });
  await c.step(4, async () => { await p.i.未成年確認のはいを押す(); });
  await c.expected(async () => {
    await expect(p.i.会員登録フォーム(), "未成年確認で「はい」を押したあとの会員登録フォーム").toBeVisible();
  });
  note(`${店舗の読み替え}。${入力値の補い}`);
});

caseTest("IT-F08-02-069", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.a.入力する(IN_MINOR, IN_MINORの申込者); });
  await c.step(3, async () => {
    await p.i.次のページへ進むを押す();
    await expect(p.i.未成年確認モーダル(), "未成年確認モーダル").toBeVisible();
  });
  await c.step(4, async () => { await p.i.未成年確認のいいえを押す(); });
  await c.expected(async () => {
    await expect.soft(p.i.未成年確認モーダル(), "未成年確認モーダル（閉じた）").toBeHidden();
    await expect.soft(p.i.欄("lastName"), "申込情報入力画面のお名前（姓）の欄（入力画面に留まる）").toBeVisible();
    await expect.soft(p.i.会員登録フォーム(), "会員登録フォームの数（遷移しない）").toHaveCount(0);
  });
  note(`${店舗の読み替え}。${入力値の補い}`);
});

caseTest("IT-F08-02-018", async (c) => {
  const p = 部品(c);
  let path = "";
  await c.step(1, async () => { path = await p.i.入力画面を開く(支店URL); });
  await c.expected(async () => {
    expect.soft(path, "入力画面のURLを開いたあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-019", async (c) => {
  const entry = new StoreEntryPage(c.page);
  let r = { status: 0, url: "" };
  await c.step(1, async () => { r = await entry.開く(支店URL, "会員登録フォーム"); });
  await c.expected(async () => {
    expect.soft(new URL(r.url).pathname, "会員登録フォームのURLを開いたあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(new OtcInputPage(c.page).ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(`${店舗の読み替え}。会員登録フォームのURLをブラウザで開いた（GET）。応答の状態は ${r.status}`);
});

caseTest("IT-F08-02-021", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => {
    await p.i.欄に入れる("lastName", "結合");
    await p.i.欄に入れる("firstName", "太郎");
    await p.i.欄に入れる("postal_code_1", "100");
    await p.i.欄に入れる("postal_code_2", "0001");
    await p.i.欄("postal_code_2").blur();
    await c.page.waitForTimeout(1500);
    await p.a.都道府県を選ぶ("東京都");
    await p.i.欄に入れる("addr01", "千代田区");
    await p.i.欄に入れる("addr02", "千代田1-1");
    await p.i.欄に入れる("addr03", "晴れる屋ビル3階");
    await p.i.欄に入れる("tel01", "03");
    await p.i.欄に入れる("tel02", "1234");
    await p.i.欄に入れる("tel03", "5678");
  });
  await c.step(3, async () => { await p.i.入力画面のキャンセルを押す(); });
  await c.step(4, async () => { await p.a.アカウントなしで進む(); });
  await c.expected(async () => {
    await expect(p.i.欄("lastName"), "再表示された申込情報入力画面のお名前（姓）の欄").toBeVisible();
    for (const [name, 名] of [["lastName", "お名前（姓）"], ["firstName", "お名前（名）"], ["postal_code_1", "郵便番号1"], ["postal_code_2", "郵便番号2"],
      ["addr01", "住所1"], ["addr02", "住所2"], ["addr03", "住所3"], ["tel01", "電話番号1"], ["tel02", "電話番号2"], ["tel03", "電話番号3"]] as const) {
      expect.soft(await p.i.値(name), `再表示された${名}（空）`).toBe("");
    }
    expect.soft(await p.i.値("pref"), "再表示された都道府県（選ばれていない）").toBe("");
  });
  note(`${店舗の読み替え}。氏名はお名前（姓・名）、住所は都道府県・住所1〜3として入れた`);
});

caseTest("IT-F08-02-022", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.a.入力する(IN_JP, IN_JPの申込者); });
  await c.step(3, async () => { await p.i.次のページへ進むを押す(); });
  await c.expected(async () => {
    await expect(p.i.会員登録フォーム(), "未ログインで「次のページへ進む」を押したあとの会員登録フォーム").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-024", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.i.入力画面のキャンセルを押す(); });
  await c.expected(async () => {
    expect.soft(p.i.パス, "「キャンセル」を押したあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-025", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => {
    if (!(await 入力して進む(p, IN_JP, IN_JPの申込者))) throw new Error("会員登録フォームが表示されないので、会員登録フォームの「キャンセル」を押せない");
  });
  await c.step(3, async () => { await p.i.会員登録フォームのキャンセルを押す(); });
  await c.expected(async () => {
    expect.soft(p.i.パス, "会員登録フォームの「キャンセル」を押したあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-026", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => {
    if (!(await 入力して進む(p, IN_JP, IN_JPの申込者))) throw new Error("会員登録フォームが表示されないので、「会員登録をスキップする」を押せない");
  });
  let r: { パス: string; 知らせ: string | null } = { パス: "", 知らせ: null };
  await c.step(3, async () => { r = await p.i.会員登録なしで進むを押す(); });
  await c.expected(async () => {
    expect.soft(r.知らせ, "会員登録項目の入力を求める知らせ（出ない）").toBeNull();
    expect.soft(r.パス, "「会員登録をスキップする」を押したあとの画面（確認画面）").toMatch(/\/otcbuy\/\w+\/confirm$/);
    await expect.soft(p.a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-028", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.i.適格請求書発行事業者を選ぶ("いいえ"); });
  await c.expected(async () => {
    await expect(p.i.欄("lastName"), "申込情報入力画面（読み込みが済んだ）").toBeVisible();
    await expect(p.i.登録番号欄(), "適格請求書発行事業者登録番号の欄（入力できない）").toBeDisabled();
  });
  note(`${店舗の読み替え}。画面は登録番号の欄を出したまま入力できなくする作りなので、「入力対象として表示されない」は入力できないこととして確かめた`);
});

caseTest("IT-F08-02-029", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.i.適格請求書発行事業者を選ぶ("はい"); });
  await c.expected(async () => {
    await expect.soft(p.i.登録番号欄(), "適格請求書発行事業者登録番号の欄（表示されている）").toBeVisible();
    await expect.soft(p.i.登録番号欄(), "適格請求書発行事業者登録番号の欄（入力できる）").toBeEnabled();
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-030", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => {
    if (!(await 入力して進む(p, IN_JP, IN_JPの申込者))) throw new Error("会員登録フォームが表示されないので、メールアドレスとパスワードを入れられない");
  });
  const mail = 印つきメール("f0802-player@example.invalid");
  await c.step(3, async () => { await p.i.会員登録の値を入れる(mail, "Passw0rd!F0802Player", false); });
  let r: { パス: string; 知らせ: string | null } = { パス: "", 知らせ: null };
  await c.step(4, async () => { r = await p.i.会員登録なしで進むを押す(); });
  await c.expected(async () => {
    expect.soft(r.パス, "会員登録なしの申込を選んだあとの画面（会員登録フォームのまま）").toMatch(/\/otcbuy\/\w+\/register_customer$/);
    await expect.soft(p.i.会員登録フォーム(), "会員登録フォーム（留まる）").toBeVisible();
    await expect.soft(p.a.確定ボタン(), "確認画面の確定のボタンの数（確認画面へ移らない）").toHaveCount(0);
  });
  note(`${店舗の読み替え}。会員登録なしの申込＝「会員登録をスキップする」。メールアドレスは正本の前半に実行の印を付けた値（${mail}）。` +
    `押したときの知らせ: ${r.知らせ ?? "（出なかった）"}`);
});

caseTest("IT-F08-02-031", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => {
    if (!(await 入力して進む(p, IN_JP, IN_JPの申込者))) throw new Error("会員登録フォームが表示されないので、会員登録の欄を空にできない");
  });
  await c.step(3, async () => { await p.i.会員登録の値を空にする(); });
  await c.step(4, async () => { await p.i.会員登録ありで進むを押す(); });
  await c.expected(async () => {
    await expect.soft(p.i.会員登録フォーム(), "会員登録ありの申込を選んだあとの会員登録フォーム（留まる）").toBeVisible();
    await expect.soft(p.a.確定ボタン(), "確認画面の確定のボタンの数（確認画面へ移らない）").toHaveCount(0);
  });
  note(`${店舗の読み替え}。会員登録ありの申込＝会員登録フォームの「次のページへ進む」。押したあとの画面のパス: ${p.i.パス}`);
});

caseTest("IT-F08-02-032", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await ゲストで入力画面を開く(p); });
  let before = "";
  await c.step(2, async () => { before = p.i.パス; await p.i.適格請求書発行事業者についてを押す(); });
  await c.expected(async () => {
    expect.soft(p.i.パス, "「適格請求書発行事業者について」を押したあとの画面（入力画面のまま）").toBe(before);
    await expect.soft(p.i.欄("lastName"), "申込情報入力画面のお名前（姓）の欄（遷移しない）").toBeVisible();
    await expect.soft(p.i.適格請求書のモーダル(), "適格請求書発行事業者についての説明").toBeVisible();
    const t = await p.i.適格請求書のモーダル().innerText().catch(() => "");
    expect.soft(t, "説明の中のインボイス制度の概要").toContain("インボイス制度");
    expect.soft(t, "説明の中の、事業者は登録番号を入力して申し込む旨").toMatch(/事業者[\s\S]*登録番号[\s\S]*申込/);
  });
  note(店舗の読み替え);
});

// ================= 保持された申込情報（会員登録フォーム） =================

caseTest("IT-F08-02-040", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.a.入力する(IN_JP, IN_JPの申込者); });
  const 結 = "結".repeat(128), ケ = "ケ".repeat(128), 千 = "千".repeat(128), 晴 = "晴".repeat(128);
  await c.step(3, async () => {
    for (const [n, v] of [["lastName", 結], ["firstName", 結], ["lastNameKana", ケ], ["firstNameKana", ケ], ["addr01", 千], ["addr02", 千], ["addr03", 晴]] as const) {
      await p.i.欄に入れる(n, v);
    }
  });
  let shown = false;
  await c.step(4, async () => {
    await p.i.次のページへ進むを押す();
    shown = await p.i.会員登録フォームか();
    if (!shown) note(`「次のページへ進む」を押したあと、会員登録フォームが表示されなかった（${p.i.パス}）`);
  });
  let ok = false;
  await c.step(5, async () => { ok = await 保持された申込情報を開く(p, shown); });
  await c.expected(async () => {
    expect.soft(shown, "「次のページへ進む」で会員登録フォームへ遷移した").toBe(true);
    expect(ok, "会員登録フォームから、保持された申込情報を表示する確認画面へ移れた").toBe(true);
    const name = (await p.a.確認の値("お名前")) ?? "";
    const kana = (await p.a.確認の値("お名前(フリガナ)")) ?? "";
    const addr = (await p.a.確認の値("住所")) ?? "";
    expect.soft(name.split(/[\s／]+/), "保持されたお名前（姓・名がそれぞれ「結」128文字）").toEqual([結, 結]);
    expect.soft(kana.split(/[\s／]+/), "保持されたお名前(フリガナ)（姓・名がそれぞれ「ケ」128文字）").toEqual([ケ, ケ]);
    expect.soft(addr.split("／").slice(1), "保持された住所1・住所2・住所3（「千」128文字・「千」128文字・「晴」128文字）").toEqual([千, 千, 晴]);
    expect.soft(文字数(addr, "千") + 文字数(addr, "晴"), "保持された住所1〜3の文字の合計").toBe(384);
  });
  note(`${店舗の読み替え}。確認画面の住所は「都道府県／住所1／住所2／住所3」の行で読んだ`);
});

caseTest("IT-F08-02-044", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.a.入力する(IN_TEL5_044, IN_JPの申込者); });
  let shown = false;
  await c.step(3, async () => {
    await p.i.次のページへ進むを押す();
    shown = await p.i.会員登録フォームか();
    if (!shown) note(`「次のページへ進む」を押したあと、会員登録フォームが表示されなかった（${p.i.パス}）`);
  });
  let ok = false;
  await c.step(4, async () => { ok = await 保持された申込情報を開く(p, shown); });
  await c.expected(async () => {
    expect.soft(shown, "「次のページへ進む」で会員登録フォームへ遷移した").toBe(true);
    expect(ok, "会員登録フォームから、保持された申込情報を表示する確認画面へ移れた").toBe(true);
    expect.soft(((await p.a.確認の値("電話番号")) ?? "").split("-"), "保持された電話番号1・2・3").toEqual(["12345", "12345", "12345"]);
  });
  note(`${店舗の読み替え}。確認画面の電話番号は「電話番号1-電話番号2-電話番号3」の形で読んだ`);
});

caseTest("IT-F08-02-045", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => { await p.a.入力する(IN_SUPPLY_045, IN_JPの申込者); });
  let shown = false;
  await c.step(3, async () => {
    await p.i.次のページへ進むを押す();
    shown = await p.i.会員登録フォームか();
    if (!shown) note(`「次のページへ進む」を押したあと、会員登録フォームが表示されなかった（${p.i.パス}）`);
  });
  let ok = false;
  await c.step(4, async () => { ok = await 保持された申込情報を開く(p, shown); });
  await c.expected(async () => {
    expect.soft(shown, "「次のページへ進む」で会員登録フォームへ遷移した").toBe(true);
    expect(ok, "会員登録フォームから、保持された申込情報を表示する確認画面へ移れた").toBe(true);
    expect.soft(((await p.a.確認の値("返却希望サプライ")) ?? "").split("・"), "保持された返却希望サプライ-入力項目").toContain("F0802-045-SUP");
  });
  note(`${店舗の読み替え}。確認画面の返却希望サプライは、選んだサプライと入力項目を「・」でつないだ表示で読んだ`);
});

caseTest("IT-F08-02-058", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  let shown = false;
  await c.step(2, async () => { shown = await 入力して進む(p, IN_REGNO_058, IN_JPの申込者); });
  let ok = false;
  await c.step(3, async () => { ok = await 保持された申込情報を開く(p, shown); });
  await c.expected(async () => {
    expect(ok, "会員登録フォームから、保持された申込情報を表示する確認画面へ移れた").toBe(true);
    expect.soft(await p.a.確認の値("適格請求書発行事業者確認"), "保持された適格請求書発行事業者確認と登録番号").toMatch(/^はい／登録番号:\s*TF0802-058$/);
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-059", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  await c.step(1, async () => { await 入力画面を開く(p); });
  let shown = false;
  await c.step(2, async () => { shown = await 入力して進む(p, IN_SUPPLY1_059, IN_JPの申込者); });
  let ok = false;
  await c.step(3, async () => { ok = await 保持された申込情報を開く(p, shown); });
  await c.expected(async () => {
    expect(ok, "会員登録フォームから、保持された申込情報を表示する確認画面へ移れた").toBe(true);
    const s = ((await p.a.確認の値("返却希望サプライ")) ?? "").split("・");
    expect.soft(s, "保持された返却希望サプライ（スリーブだけ）").toEqual(["スリーブ"]);
    expect.soft(s, "保持された返却希望サプライ（ストレージボックスは無い）").not.toContain("ストレージボックス");
  });
  note(店舗の読み替え);
});

// ================= 言語の切り替え =================

caseTest("IT-F08-02-047", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await p.i.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await p.i.申込前ログイン画面で言語を選ぶ("JP"); await p.a.アカウントなしで進む(); });
  await c.step(3, async () => { await p.i.入力画面で言語を選ぶ("EN"); await p.i.入力画面を待つ(); });
  let 見出し = "";
  await c.step(4, async () => { 見出し = await p.i.入力時間の見出し(); });
  await c.expected(async () => {
    expect(見出し, "入力時間の見出し").toBe("Remaining time to input:");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-048", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await p.i.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await p.i.申込前ログイン画面で言語を選ぶ("JP"); await p.a.アカウントなしで進む(); });
  await c.step(3, async () => { await p.i.入力画面で言語を選ぶ("EN"); await p.i.入力画面を待つ(); });
  let 住所欄 = "";
  await c.step(4, async () => { await expect(p.i.住所の枠(), "住所欄").toBeVisible(); 住所欄 = await p.i.住所の枠().innerText(); });
  await c.expected(async () => {
    expect(住所欄, "住所欄の文（日本語の注意書きが無い）").not.toContain("※町名・番地の入力漏れはご注意ください。");
  });
  note(店舗の読み替え);
});

caseTest("IT-F08-02-049", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await p.i.申込前ログイン画面を開く(支店URL, "en"); });
  await c.step(2, async () => { await p.i.申込前ログイン画面で言語を選ぶ("EN"); await p.a.アカウントなしで進む(); });
  await c.step(3, async () => { await p.i.入力画面で言語を選ぶ("JP"); await p.i.入力画面を待つ(); });
  let 見出し = "";
  await c.step(4, async () => { 見出し = await p.i.入力時間の見出し(); });
  await c.expected(async () => {
    expect(見出し, "入力時間の見出し").toBe("入力時間：残り");
  });
  note(店舗の読み替え);
});

// ================= ログインした会員 =================

/** 会員の情報が入力欄に反映されていることを確かめる（004・072〜074） */
function 会員の情報が入っている(v: 入力欄の値, 名: string): void {
  expect.soft(v.姓, "お名前（姓）").toBe("結合");
  expect.soft(v.名, "お名前（名）").toBe(名);
  expect.soft(v.セイ, "お名前（フリガナ）（姓）").toBe("ケツゴウ");
  expect.soft(v.メイ, "お名前（フリガナ）（名）").toBe("カイイン");
  expect.soft(v.郵便番号1, "郵便番号1").toBe("100");
  expect.soft(v.郵便番号2, "郵便番号2").toBe("0001");
  expect.soft(v.都道府県, "都道府県").toBe("東京都");
  expect.soft(v.住所1, "住所1").toBe("千代田区");
  expect.soft(v.住所2, "住所2").toBe("千代田1-1");
  expect.soft(v.住所3, "住所3").toBe("晴れる屋ビル3階");
  expect.soft([v.年, v.月, v.日], "生年月日（年・月・日）").toEqual(["1990", "1", "2"]);
  expect.soft([v.電話1, v.電話2, v.電話3], "電話番号1・2・3").toEqual(["03", "1234", "5678"]);
  expect.soft(v.職業, "職業").toBe("会社員");
}

async function 会員でログインする(c: CaseCtx, seedId: string): Promise<{ p: 部品; m: ReturnType<typeof F0802の会員> }> {
  const p = 部品(c);
  const m = F0802の会員(seedId);
  await c.step(1, async () => { await p.i.申込前ログイン画面を開く(支店URL); });
  await c.step(2, async () => { await new MemberApplyPage(c.page).ログインする(m.メール, m.パスワード); });
  return { p, m };
}
const 会員の注記 = (メール: string) => `${店舗の読み替え}。会員のメールアドレスは正本の前半に実行の印を付けた値（${メール}）`;

caseTest("IT-F08-02-004", async (c) => {
  const { p, m } = await 会員でログインする(c, "S-F08-02-MEMBER");
  let v: 入力欄の値 | null = null;
  await c.step(3, async () => { v = await p.i.入力欄の値(); });
  await c.expected(async () => {
    会員の情報が入っている(v!, "会員");
    expect.soft(v!.登録番号, "適格請求書発行事業者登録番号").toBe("T1234567890123");
  });
  note(`${会員の注記(m.メール)}。生年月日は選択欄の年・月・日の値で比べた`);
});

caseTest("IT-F08-02-056", async (c) => {
  const { p, m } = await 会員でログインする(c, "S-F08-02-MEMBER-NOREG-056");
  let v: 入力欄の値 | null = null;
  await c.step(3, async () => { v = await p.i.入力欄の値(); });
  await c.expected(async () => {
    expect(v!.姓, "申込情報入力画面に会員の情報が入った（お名前（姓））").toBe("結合");
    expect(v!.登録番号, "適格請求書発行事業者登録番号の欄（空のまま）").toBe("");
  });
  note(会員の注記(m.メール));
});

function 会員の登録番号を確かめる(seedId: string, 答え: "はい" | "いいえ", 名: string, 期待: (v: 入力欄の値) => void): CaseBody {
  return async (c) => {
    const { p, m } = await 会員でログインする(c, seedId);
    await c.step(3, async () => { await p.i.適格請求書発行事業者を選ぶ(答え); });
    let v: 入力欄の値 | null = null;
    await c.step(4, async () => { v = await p.i.入力欄の値(); });
    await c.expected(async () => {
      会員の情報が入っている(v!, 名);
      expect.soft(v!.登録番号を入力できる, `適格請求書発行事業者登録番号の欄（${答え === "はい" ? "入力できる" : "入力できない"}）`).toBe(答え === "はい");
      期待(v!);
    });
    note(`${会員の注記(m.メール)}。「入力対象として表示される／されない」は、登録番号の欄に入力できる／できないこととして確かめた（画面は欄を出したまま入力できなくする作り）`);
  };
}

caseTest("IT-F08-02-072", 会員の登録番号を確かめる("S-F08-02-CBMEMBER-072", "いいえ", "会員F0802CB072", (v) => {
  expect.soft(v.登録番号, "適格請求書発行事業者登録番号の欄の値（会員の登録番号が反映されない）").not.toBe("TF0802CB072000");
}));

caseTest("IT-F08-02-073", 会員の登録番号を確かめる("S-F08-02-CBMEMBER-073", "はい", "会員F0802CB073", (v) => {
  expect.soft(v.登録番号, "適格請求書発行事業者登録番号の欄の値（会員の登録番号）").toBe("TF0802CB073000");
}));

caseTest("IT-F08-02-074", 会員の登録番号を確かめる("S-F08-02-CBMEMBER-074", "はい", "会員F0802CB074", (v) => {
  expect.soft(v.登録番号, "適格請求書発行事業者登録番号の欄の値（空）").toBe("");
}));

caseTest("IT-F08-02-023", async (c) => {
  const { p, m } = await 会員でログインする(c, "S-F08-02-MEMBER");
  let 入れた: string[] = [];
  await c.step(3, async () => { 入れた = await p.i.空の必須項目に入れる(IN_JP); });
  await c.step(4, async () => { await p.i.ログイン中の次へを押す(); });
  await c.expected(async () => {
    expect.soft(p.i.パス, "「次のページへ進む」を押したあとの画面（確認画面）").toMatch(/\/otcbuy\/\w+\/confirm$/);
    await expect.soft(p.a.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible();
  });
  note(`${会員の注記(m.メール)}。不足していた必須項目として入れたもの: ${入れた.join("・") || "（無し）"}`);
});

caseTest("IT-F08-02-027", async (c) => {
  const { p, m } = await 会員でログインする(c, "S-F08-02-MEMBER");
  let 入れた: string[] = [];
  await c.step(3, async () => { 入れた = await p.i.空の必須項目に入れる(IN_JP); });
  await c.step(4, async () => {
    await p.i.ログイン中の次へを押す();
    await p.a.確認画面を待つ();
  });
  let n = { 件数: -1, 査定番号つき: -1 };
  await c.step(5, async () => { n = 会員の査定申込みの数(c.notes.get("〔会員ID-F0802-共有〕")); });
  await c.expected(async () => {
    expect.soft(n.件数, "会員の店頭買取査定申込みの数（0件のまま）").toBe(0);
    expect.soft(n.査定番号つき, "会員の、査定番号の付いた店頭買取査定申込みの数").toBe(0);
  });
  note(`${会員の注記(m.メール)}。不足していた必須項目として入れたもの: ${入れた.join("・") || "（無し）"}。申込みは、どの店舗のものも数えた`);
});

// ================= 会員登録して申込み（DB確認） =================

/** 手順1〜5（入力画面を開く → 入力して進む → 会員登録の値 → 次へ → 会員登録して申込み）。英語は「英語の入力画面を開く」 */
async function 会員登録して申し込む(c: CaseCtx, p: 部品, v: 申込入力, who: 申込者, メール: string, パスワード: string): Promise<void> {
  const 言語: 言語 = v.言語 === "EN" ? "en" : "ja";
  await c.step(1, async () => { await 入力画面を開く(p, 言語); });
  await c.step(2, async () => {
    if (!(await 入力して進む(p, v, who))) throw new Error("会員登録フォームが表示されないので、会員登録の値を入れられない");
  });
  await c.step(3, async () => { await p.i.会員登録の値を入れる(メール, パスワード); });
  await c.step(4, async () => { await p.i.会員登録ありで進むを押す(); await p.a.確認画面を待つ(); });
  await c.step(5, async () => { await 確定する(p); });
}

caseTest("IT-F08-02-014", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p, "en");
  const mail = 印つきメール("f0802-abroad-014@example.invalid");
  await 会員登録して申し込む(c, p, IN_EN, IN_ENの申込者, mail, "Passw0rdF0802Abroad-014!");
  let rows: db.会員[] = [];
  await c.step(6, async () => { rows = db.会員(mail); });
  await c.expected(async () => {
    expect(rows.length, `メールアドレス ${mail} の会員の数`).toBe(1);
    expect.soft(rows[0].都道府県, "登録された会員の都道府県").toBe("日本国外");
    expect.soft(rows[0].セイ, "登録された会員の氏名カナ（姓）").toBe("Smith");
    expect.soft(rows[0].メイ, "登録された会員の氏名カナ（名）").toBe("Alice");
  });
  note(`${店舗の読み替え}。メールアドレスは正本の前半に実行の印を付けた値（${mail}）。${入力値の補い}`);
});

caseTest("IT-F08-02-015", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  const mail = 印つきメール("f0802-player-015@example.invalid");
  await 会員登録して申し込む(c, p, IN_JP, IN_JPの申込者, mail, "Passw0rdF0802Player-015!");
  let rows: db.会員[] = [];
  let players: db.プレイヤー[] = [];
  await c.step(6, async () => { rows = db.会員(mail); players = db.プレイヤー(mail); });
  await c.expected(async () => {
    expect(rows.length, `メールアドレス ${mail} の会員の数`).toBe(1);
    expect.soft(players.filter((x) => x.会員ID === rows[0].id).length, "新しく登録された会員IDに紐づくプレイヤーの数").toBe(1);
  });
  note(`${店舗の読み替え}。メールアドレスは正本の前半に実行の印を付けた値（${mail}）`);
});

caseTest("IT-F08-02-057", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  const mail = 印つきメール("dpf0802-057@example.test");
  await 会員登録して申し込む(c, p, IN_JP, IN_JPの申込者, mail, "Passw0rd-F0802057");
  let rows: db.会員[] = [];
  await c.step(6, async () => { rows = db.会員(mail); });
  await c.expected(async () => {
    expect(rows.length, `メールアドレス ${mail} の会員の数`).toBe(1);
    expect.soft(rows[0].都道府県, "登録された会員の都道府県").toBe("東京都");
  });
  note(`${店舗の読み替え}。メールアドレスは正本の前半に実行の印を付けた値（${mail}）`);
});

caseTest("IT-F08-02-016", async (c) => {
  const p = 部品(c);
  const mail = 印つきメール("f0802-player-016@example.invalid");
  await c.step(1, async () => { await ゲストで入力画面を開く(p); });
  await c.step(2, async () => {
    if (!(await 入力して進む(p, { ...IN_JP, 電話: ["03", "9999", "0216"] }, IN_JPの申込者))) throw new Error("会員登録フォームが表示されないので、会員登録の値を入れられない");
  });
  await c.step(3, async () => { await 会員登録して確認画面へ(p, mail, "Passw0rdF0802Player-016!"); });
  await c.step(4, async () => { await 確定する(p); });
  let rows: db.会員[] = [];
  await c.step(5, async () => { rows = db.会員(mail); });
  await c.expected(async () => {
    expect(rows.length, `メールアドレス ${mail} の会員の数（電話番号のブラックリストに一致して登録されない）`).toBe(0);
  });
  note(`${店舗の読み替え}。メールアドレスは正本の前半に実行の印を付けた値（${mail}）`);
});

/** 050〜053: 住所のブラックリストのケース（手順1〜5） */
function 住所のブラックリスト(n: "050" | "051" | "052" | "053", 正本のメール: string, パスワード: string, 期待の数: 0 | 1): CaseBody {
  return async (c) => {
    const p = 部品(c);
    const mail = 印つきメール(正本のメール);
    const b = 住所ブラックリスト(n);
    const v: 申込入力 = { ...IN_JP, 住所1: b.住所1 ?? IN_JP.住所1, 住所2: b.住所2 };
    await c.step(1, async () => { await ゲストで入力画面を開く(p); });
    await c.step(2, async () => {
      if (!(await 入力して進む(p, v, IN_JPの申込者))) throw new Error("会員登録フォームが表示されないので、会員登録の値を入れられない");
    });
    await c.step(3, async () => { await 会員登録して確認画面へ(p, mail, パスワード); });
    await c.step(4, async () => { await 確定する(p); });
    let rows: db.会員[] = [];
    await c.step(5, async () => { rows = db.会員(mail); });
    await c.expected(async () => {
      expect(rows.length, `メールアドレス ${mail} の会員の数`).toBe(期待の数);
    });
    note(`${店舗の読み替え}。メールアドレスは正本の前半に実行の印を付けた値（${mail}）。` +
      `住所は正本の値に実行の印を付けて入れた（${b.住所1 !== undefined ? `住所1「${b.住所1}」、` : ""}住所2「${b.住所2}」。ブラックリストのキーワード「${b.キーワード}」）`);
  };
}

caseTest("IT-F08-02-050", 住所のブラックリスト("050", "f0802-050@example.invalid", "Passw0rdF0802Bl-050!", 0));
caseTest("IT-F08-02-051", 住所のブラックリスト("051", "f0802-051@example.invalid", "Passw0rdF0802Bl-051!", 0));
caseTest("IT-F08-02-052", 住所のブラックリスト("052", "f0802-052@example.invalid", "Passw0rdF0802Bl-052!", 1));
caseTest("IT-F08-02-053", 住所のブラックリスト("053", "f0802-053@example.invalid", "Passw0rdF0802Bl-053!", 1));

caseTest("IT-F08-02-060", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p, "en");
  const { 入力, 申込者: who } = CB海外の入力("060");
  const mail = 印つきメール("cbf0802-060@example.test");
  await c.step(1, async () => { await 入力画面を開く(p, "en"); });
  await c.step(2, async () => {
    if (!(await 入力して進む(p, 入力, who))) throw new Error("会員登録フォームが表示されないので、会員登録の値を入れられない");
  });
  await c.step(3, async () => { await 会員登録して確認画面へ(p, mail, "Passw0rd-CBF0802060"); });
  await c.step(4, async () => { await 確定する(p); });
  let rows: db.会員[] = [];
  let players: db.プレイヤー[] = [];
  let orders: db.査定申込み[] = [];
  await c.step(5, async () => { rows = db.会員(mail); players = db.プレイヤー(mail); orders = db.査定申込み(店舗ID(c, "CB060"), who.姓); });
  await c.expected(async () => {
    expect(rows.length, `メールアドレス ${mail} の会員の数`).toBe(1);
    expect.soft(rows[0].都道府県, "登録された会員の都道府県").toBe("日本国外");
    expect.soft(players.filter((x) => x.会員ID === rows[0].id).length, "その会員に紐づくプレイヤーの数").toBe(1);
  });
  note(`${店舗の読み替え}。メールアドレス（${mail}）と姓（${who.姓}）は正本の値に実行の印を付けた。${入力値の補い}。` +
    `参考: 姓 ${who.姓} の、この店舗の査定申込み ${orders.length} 件`);
});

caseTest("IT-F08-02-061", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p, "en");
  const { 入力, 申込者: who } = CB海外の入力("061");
  const mail = 印つきメール("cbf0802-061@example.test");
  await c.step(1, async () => { await 入力画面を開く(p, "en"); });
  await c.step(2, async () => {
    if (!(await 入力して進む(p, 入力, who))) throw new Error("会員登録フォームが表示されないので、会員登録の値を入れられない");
  });
  await c.step(3, async () => { await 会員登録して確認画面へ(p, mail, "Passw0rd-CBF0802061"); });
  await c.step(4, async () => { await 確定する(p); });
  let rows: db.会員[] = [];
  let players: db.プレイヤー[] = [];
  let orders: db.査定申込み[] = [];
  await c.step(5, async () => { rows = db.会員(mail); players = db.プレイヤー(mail); orders = db.査定申込み(店舗ID(c, "CB061"), who.姓); });
  await c.expected(async () => {
    expect.soft(rows.length, `メールアドレス ${mail} の会員の数（住所のブラックリストに一致して登録されない）`).toBe(0);
    expect.soft(orders.length, `氏名 ${who.姓} ${who.名} の査定申込みの数`).toBe(1);
    expect.soft(orders[0]?.都道府県, "その査定申込みの都道府県").toBe("日本国外");
  });
  note(`${店舗の読み替え}。メールアドレス（${mail}）・姓（${who.姓}）・住所2（${入力.住所2}）は正本の値に実行の印を付けた。${入力値の補い}。` +
    `参考: このメールアドレスのプレイヤー ${players.length} 件`);
});

caseTest("IT-F08-02-062", async (c) => {
  const p = 部品(c);
  await エントリーを始める(p);
  const who = CBSKIPの申込者();
  await c.step(1, async () => { await 入力画面を開く(p); });
  await c.step(2, async () => {
    if (!(await 入力して進む(p, IN_JP, who))) throw new Error("会員登録フォームが表示されないので、「会員登録をスキップする」を押せない");
  });
  await c.step(3, async () => { await p.i.会員登録なしで進むを押す(); await p.a.確認画面を待つ(); });
  await c.step(4, async () => { await 確定する(p); });
  let 会員数 = -1;
  let orders: db.査定申込み[] = [];
  await c.step(5, async () => { 会員数 = db.姓の会員数(who.姓); orders = db.査定申込み(店舗ID(c, "CB062"), who.姓); });
  await c.expected(async () => {
    expect.soft(会員数, `氏名 ${who.姓} ${who.名} の会員の数`).toBe(0);
    expect.soft(orders.length, "店舗の店頭買取査定申込みの数（この実行の申込者の分）").toBe(1);
  });
  note(`${店舗の読み替え}。姓は正本の値に実行の印を付けた（${who.姓}）。店舗の査定申込みは、共通の試験店舗の、この姓の申込みとして数えた`);
});

// ================= セッション・URL（開発者ツールの代わり） =================

caseTest("IT-F08-02-063", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await ゲストで入力画面を開く(p); });
  await c.step(2, async () => { await p.a.入力する(IN_JP, IN_JPの申込者); });
  await c.step(3, async () => { await p.i.フォームの送信先を書き換える(入力画面のURL(支店URL)); });
  await c.step(4, async () => { await p.i.次のページへ進むを押す(); });
  await c.expected(async () => {
    expect.soft(p.i.パス, "送ったあとの画面（申込前ログイン画面へ移らない）").not.toMatch(/\/entry$/);
    await expect.soft(p.i.欄("lastName"), "申込情報入力画面のお名前（姓）の欄").toBeVisible();
  });
  note(`${店舗の読み替え}。開発者ツールの代わりに、画面のフォームの送信先をスクリプトで書き換えた`);
});

caseTest("IT-F08-02-066", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await ゲストで入力画面を開く(p); });
  let path = "";
  await c.step(2, async () => { path = await p.i.空のPOSTを送る(会員登録フォームのURL(支店URL)); });
  await c.expected(async () => {
    expect.soft(path, "送ったあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(`${店舗の読み替え}。試験用のフォーム（入力項目なし）を画面に作って、会員登録フォームのURLへ POST で送った`);
});

caseTest("IT-F08-02-067", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await ゲストで入力画面を開く(p); });
  await c.step(2, async () => { await p.a.入力する(IN_JP, IN_JPの申込者); });
  await c.step(3, async () => { await p.i.フォームの送信先を書き換える(入力画面のURL(支店URL)); });
  await c.step(4, async () => { await p.i.クッキーを消す(); });
  await c.step(5, async () => { await p.i.次のページへ進むを押す(); });
  await c.expected(async () => {
    expect.soft(p.i.パス, "送ったあとの画面（申込前ログイン画面へ移らない）").not.toMatch(/\/entry$/);
    await expect.soft(p.i.欄("lastName"), "申込情報入力画面のお名前（姓）の欄").toBeVisible();
  });
  note(`${店舗の読み替え}。開発者ツールの代わりに、フォームの送信先をスクリプトで書き換え、このブラウザのクッキーを全て消した`);
});

caseTest("IT-F08-02-068", async (c) => {
  const p = 部品(c);
  await c.step(1, async () => { await ゲストで入力画面を開く(p); });
  await c.step(2, async () => { await p.a.入力する(IN_JP, IN_JPの申込者); });
  await c.step(3, async () => { await p.i.クッキーを消す(); });
  await c.step(4, async () => { await p.i.次のページへ進むを押す(); });
  await c.expected(async () => {
    expect.soft(p.i.パス, "送ったあとの画面（申込前ログイン画面）").toMatch(/\/otcbuy\/\w+\/entry$/);
    await expect.soft(p.i.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible();
  });
  note(`${店舗の読み替え}。開発者ツールの代わりに、このブラウザのクッキーを全て消した`);
});

// 存在しない店舗識別名のエントリー画面・申込フォーム・会員登録フォーム
caseTest("IT-F08-02-017", async ({ page, step, expected }) => {
  const entry = new StoreEntryPage(page);
  const name = "it_f0802_no_store";
  const r: Record<string, number> = {};
  await step(1, async () => { r.エントリー画面 = (await entry.開く(name, "申込前ログイン")).status; });
  await step(2, async () => { r.申込フォーム = (await entry.開く(name, "申込フォーム")).status; });
  await step(3, async () => { r.会員登録フォーム = (await entry.開く(name, "会員登録フォーム")).status; });
  await expected(async () => {
    expect.soft(r.エントリー画面, "エントリー画面の要求のHTTP応答").toBe(404);
    expect.soft(r.申込フォーム, "申込フォームの要求のHTTP応答").toBe(404);
    expect.soft(r.会員登録フォーム, "会員登録フォームの要求のHTTP応答").toBe(404);
  });
  note("事前準備の「存在する場合は削除する」は、その店舗識別名の店舗が無いので行っていない。エントリー画面＝申込前ログイン画面、申込フォーム＝店舗直下の入力画面、会員登録フォーム＝会員登録の画面として、それぞれのURLを開いた");
});
