/**
 * F06-22 お問い合わせ。正本: cases/F06-22_test_cases.tsv
 * 013・014・015・016・048 はシード無し（2026-11-04）。残りは依頼者の方針（2026-11-10）で、既存のデータ・画面から作るデータに読み替えて書いた
 * （読み替えは seeds/f06-22.ts の先頭と、各シードの注記）。
 * 書かないケース: 012（事前予約期間の終了を DB で設定するイベント）・040（同じメールアドレスの会員3件を DB で設定）・
 * 042〜045・059（メールの宛先を確かめる。メール試験設備が無く、共有の受付アドレスの書き換え・件名の追加が要る）。
 */
import { Locator, test } from "@playwright/test";
import { お問い合わせ } from "../../db/f06_22_k";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { 会員としてログインする, 自動ログイン用Cookie } from "../../pages/front/f06_18_change";
import { ContactPage } from "../../pages/front/f06_22_contact_k";
import { 件名, 会員, 印つきメール, 店舗, 使う店舗 } from "../../seeds/f06-22";
import "../../seeds/f06-22-b"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-F06-22-013", async ({ page, step, expected }) => {
  const c = new ContactPage(page);
  let 遷移した = true;
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { 遷移した = await c.現在地を押そうとする(); });
  await expected(async () => {
    expect.soft(await c.現在地がリンクか(), "現在表示中の「お問い合わせ」が押下可能なリンクになっている").toBe(false);
    expect.soft(遷移した, "押して遷移した").toBe(false);
  });
});
caseTest("IT-F06-22-014", async ({ page, step, expected }) => {
  const c = new ContactPage(page);
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.押して遷移する(c.パンくずホーム); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-22-015", async ({ page, step, expected }) => {
  const c = new ContactPage(page);
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.押して遷移する(c.ご利用案内); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（ヘルプ）").toMatch(/\/help/); });
});
caseTest("IT-F06-22-016", async ({ page, step, expected }) => {
  const c = new ContactPage(page);
  await step(1, async () => { await c.トップを開く(); });
  await step(2, async () => { await c.開く(); });
  await step(3, async () => { await c.押して遷移する(c.戻る); });
  await expected(async () => { expect.soft(c.path, "遷移した画面（ブラウザ履歴の1つ前の本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-22-048", async ({ page, step, expected }) => {
  const ja = new ContactPage(page, "ja");
  const en = new ContactPage(page, "en");
  let jaN3 = -1, jaN1 = -1, enN3 = -1, enN1 = -1;
  let enType: string | null = null;
  await step(1, async () => { await ja.開く(); jaN3 = await ja.表示されている数(ja.電話番号の3分割欄); jaN1 = await ja.表示されている数(ja.電話番号の1欄); });
  await step(2, async () => { await en.開く(); enN3 = await en.表示されている数(en.電話番号の3分割欄); enN1 = await en.表示されている数(en.電話番号の1欄); enType = await en.電話番号欄の種類(); });
  await expected(async () => {
    expect.soft(jaN3, "日本語ページの電話番号の3分割欄の数").toBe(3);
    expect.soft(jaN1, "日本語ページの電話番号の1欄の数").toBe(0);
    expect.soft(enN3, "英語ページの電話番号の3分割欄の数").toBe(0);
    expect.soft(enN1, "英語ページの電話番号の1欄の数").toBe(1);
    expect.soft(enType, "英語ページの電話番号欄の入力の種類（数値）").toBe("number");
  });
});

// ---------------------------------------------------------------------------
// 共通の操作（2026-11-10 追加分）
// ---------------------------------------------------------------------------

const 店舗でのお買い物 = "店舗でのお買い物について";
const イベントについて = "イベントについて";
const キャンセル申込 = "イベントのキャンセル申込";
const キャンセル期限の文 = "イベントのキャンセル期限はイベント開催日の前日23時59分までになります。";

/** 公開営業店10（S-F06-22-STORES が選んだ既存の店舗） */
function 店舗A(): 使う店舗 {
  const a = 店舗("A");
  if (!a) throw new Error("公開営業店10 に当たる店舗が無い");
  return a;
}

type 入力 = {
  件名?: string; 詳細?: string; 店舗?: 使う店舗; 付帯?: string;
  イベント名?: string; 実施店舗?: 使う店舗; 開催日?: string; 開始時間?: string; キャンセル理由?: string; その他キャンセル理由?: string; アンケート?: string;
  姓?: string; 名?: string; 電話?: [string, string, string]; メール?: string; 内容?: string;
};

/**
 * 入力画面へ入れる。選択欄（件名→お問い合わせ詳細→店舗→キャンセル理由）を先に選び、そのあとで文字の欄を入れる
 * （件名を「店舗でのお買い物・イベント…」にすると、画面の仕掛けが内容の欄を空白にするため）。
 * 表示されていない欄（イベントのキャンセル申込のときの内容など）は入れず、手順の注記に残す。
 */
async function 入力する(c: ContactPage, v: 入力): Promise<void> {
  const 注記: string[] = [];
  const 入れる = async (項目: string, l: Locator, 値: string | undefined) => {
    if (値 === undefined) return;
    const r = await c.入れる(項目, l, 値);
    if (r) 注記.push(r);
  };
  if (v.件名 !== undefined) await c.選ぶ(c.件名, v.件名);
  if (v.詳細 !== undefined) await c.選ぶ(c.お問い合わせ詳細, v.詳細);
  if (v.店舗) await c.値で選ぶ(c.お問い合わせ店舗, v.店舗.店舗ID);
  if (v.実施店舗) await c.値で選ぶ(c.イベント実施店舗, v.実施店舗.店舗ID);
  if (v.キャンセル理由 !== undefined) await c.選ぶ(c.キャンセル理由, v.キャンセル理由);
  await 入れる("注文番号・買取番号などの付帯情報", c.付帯情報, v.付帯);
  await 入れる("イベント名", c.イベント名, v.イベント名);
  await 入れる("イベント開催日", c.開催日, v.開催日);
  await 入れる("イベント開始時間", c.開始時間, v.開始時間);
  await 入れる("その他キャンセル理由", c.その他キャンセル理由, v.その他キャンセル理由);
  await 入れる("アンケート", c.アンケート, v.アンケート);
  await 入れる("氏名(姓)", c.姓, v.姓);
  await 入れる("氏名(名)", c.名, v.名);
  if (v.電話) { const r = await c.電話番号を入れる(v.電話); if (r) 注記.push(r); }
  await 入れる("メールアドレス", c.メール, v.メール);
  await 入れる("内容", c.内容, v.内容);
  if (注記.length) note(`${注記.join("。")}（お問い合わせ詳細が「イベントのキャンセル申込」のとき、内容の欄は画面に出ず、送信時に画面の仕掛けがイベントの入力を内容へ転記する）`);
}

/** 「確認画面へ」を押す。アラートが出たら手順の注記に残す */
async function 確認画面へ(c: ContactPage): Promise<{ 移った: boolean; アラート: string | null }> {
  const r = await c.確認画面へを押す();
  if (r.アラート !== null) note(`「確認画面へ」を押すとアラート「${r.アラート}」が出た（閉じた）`);
  return r;
}

/** 入力して「確認画面へ」→「送信をする」（正本の手順3つ）。確認画面にならなければ止める */
async function 送信まで(c: ContactPage, step: CaseCtx["step"], 手順: { 入力: number; 確認: number; 送信: number }, v: 入力, 開く = false): Promise<void> {
  await step(手順.入力, async () => { if (開く) await c.開く(); await 入力する(c, v); });
  await step(手順.確認, async () => {
    await 確認画面へ(c);
    if (!(await c.確認画面か())) throw new Error("「確認画面へ」を押しても確認画面にならない");
  });
  await step(手順.送信, async () => { await c.送信するを押す(); });
}

const 共通の氏名: Pick<入力, "姓" | "名" | "電話"> = { 姓: "試験", 名: "太郎", 電話: ["03", "1234", "5678"] };

/** 事前準備の「ブラウザを新規セッションのログアウト状態にする」: ケースは新しいブラウザで始まるので、自動ログインのCookieが無いことを確かめるだけ */
async function ログアウト状態である({ page }: CaseCtx): Promise<void> {
  const cookies = await page.context().cookies();
  if (自動ログイン用Cookie(cookies).length) throw new Error("新しいブラウザに自動ログインのCookieがある");
}

type 保存 = ReturnType<typeof お問い合わせ>;

/** 選択肢の中での店舗の位置（無ければ -1） */
const 位置 = (opts: { 値: string }[], s: 使う店舗) => opts.findIndex((o) => o.値 === s.店舗ID);
const 店舗の呼び名 = ["公開営業店10", "公開営業店20", "閉店店舗30", "非公開店舗40"];

/** 010・011: 4店舗（閉店・非公開に当たる既存の店舗が無ければ、手順の前で止める） */
function 四店舗(): 使う店舗[] {
  const four = (["A", "B", "C", "D"] as const).map((k) => 店舗(k));
  if (four.some((s) => !s)) throw new Error("閉店店舗30・非公開店舗40 に当たる既存の店舗が無いので、このケースは確かめられない（シードの注記）");
  const out = four as 使う店舗[];
  note(`4店舗は既存の店舗: ${out.map((s, i) => `${店舗の呼び名[i]}＝「${s.表示}」（表示順 ${s.表示順}）`).join("、")}。登録済み店舗はこの4件だけではないので、ほかの店舗も選択肢に並ぶ`);
  return out;
}

caseTest("IT-F06-22-010", async (ctx) => {
  const { page, step, expected } = ctx;
  await ログアウト状態である(ctx);
  const [A, B, C, D] = 四店舗();
  const c = new ContactPage(page);
  let opts: { 値: string; 表示: string }[] = [];
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.選ぶ(c.件名, 件名[2]); });
  await step(3, async () => { await c.選ぶ(c.お問い合わせ詳細, 店舗でのお買い物); });
  await step(4, async () => { opts = (await c.選択肢(c.お問い合わせ店舗)).filter((o) => o.値 !== ""); });
  await expected(async () => {
    expect.soft(位置(opts, A) >= 0, "お問い合わせ店舗選択に公開営業店10がある").toBe(true);
    expect.soft(位置(opts, B) >= 0, "お問い合わせ店舗選択に公開営業店20がある").toBe(true);
    expect.soft(位置(opts, A) < 位置(opts, B), "公開営業店10が公開営業店20より前（表示順の順）").toBe(true);
    expect.soft(位置(opts, C), "お問い合わせ店舗選択での閉店店舗の位置（無い＝-1）").toBe(-1);
    expect.soft(位置(opts, D), "お問い合わせ店舗選択での非公開店舗の位置（無い＝-1）").toBe(-1);
  });
});

caseTest("IT-F06-22-011", async (ctx) => {
  const { page, step, expected } = ctx;
  await ログアウト状態である(ctx);
  const 店 = 四店舗();
  const c = new ContactPage(page);
  let opts: { 値: string; 表示: string }[] = [];
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.選ぶ(c.件名, 件名[2]); });
  await step(3, async () => { await c.選ぶ(c.お問い合わせ詳細, キャンセル申込); });
  await step(4, async () => { opts = (await c.選択肢(c.イベント実施店舗)).filter((o) => o.値 !== ""); });
  await expected(async () => {
    店.forEach((s, i) => expect.soft(位置(opts, s) >= 0, `イベント実施店舗に「${店舗の呼び名[i]}」がある`).toBe(true));
    const 表示順の順 = [...店].sort((a, b) => a.表示順 - b.表示順 || Number(a.店舗ID) - Number(b.店舗ID)).map((s) => s.店舗ID);
    const 画面の順 = [...店].sort((a, b) => 位置(opts, a) - 位置(opts, b)).map((s) => s.店舗ID);
    expect.soft(画面の順, "イベント実施店舗での4店舗の並び（店舗ID。表示順の昇順であること）").toEqual(表示順の順);
  });
});

/** 052〜054: キャンセル申込の欄（キャンセル理由はケースごと） */
const キャンセルの入力 = (理由: string): 入力 => ({ イベント名: "確認イベント", 実施店舗: 店舗A(), 開催日: "2026/09/15", 開始時間: "10:30", アンケート: "確認用回答", キャンセル理由: 理由 });

// ---------------------------------------------------------------------------
// 055〜058 初期表示（クエリのイベント詳細・未ログイン）
// ---------------------------------------------------------------------------

/** 055〜057: クエリのイベント詳細IDを指定して開き、件名の初期値と、キャンセル申込の欄を読む */
function クエリの初期表示(呼び名: string | null, 番号 = "") {
  return async (ctx: CaseCtx) => {
    const { page, step, expected, notes } = ctx;
    await ログアウト状態である(ctx);
    const c = new ContactPage(page);
    const A = 店舗A();
    const id = 呼び名 ? notes.get(呼び名) : 番号;
    let 件名の初期値 = "";
    let 欄 = { イベント名: "", 開催日: "", 開始時間: "", 実施店舗: "" };
    await step(1, async () => { await c.イベント詳細を指定して開く(id); });
    await step(2, async () => { 件名の初期値 = (await c.選択中(c.件名)).表示; });
    await step(3, async () => { await c.選ぶ(c.件名, 件名[2]); await c.選ぶ(c.お問い合わせ詳細, キャンセル申込); });
    await step(4, async () => {
      欄 = { イベント名: await c.イベント名.inputValue(), 開催日: await c.開催日.inputValue(), 開始時間: await c.開始時間.inputValue(), 実施店舗: (await c.選択中(c.イベント実施店舗)).値 };
    });
    await expected(async () => {
      expect.soft(件名の初期値, "件名の初期値").toBe(件名[0]);
      expect.soft(欄.イベント名, "イベント名（空欄）").toBe("");
      expect.soft(欄.開催日, "開催日（空欄）").toBe("");
      expect.soft(欄.開始時間, "開始時間（空欄）").toBe("");
      expect.soft(欄.実施店舗 === A.店舗ID, `イベント実施店舗に公開営業店10（「${A.表示}」）が選択されている`).toBe(false);
    });
  };
}
caseTest("IT-F06-22-055", クエリの初期表示("〔イベント詳細ID-F0622-055〕"));
caseTest("IT-F06-22-056", クエリの初期表示("〔イベント詳細ID-F0622-056〕"));
