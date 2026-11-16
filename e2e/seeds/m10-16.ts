/**
 * M10-16 追加システム設定 のシード（画面操作）。正本: cases/M10-16_seed_data.tsv
 *
 * - 管理者（ADM-A・ADM-A-0NN・ADM-B-041・L-ADM）: メンバー管理で登録する（権限は「システム管理者」。追加システム設定を操作できる）。
 *   登録後の編集画面のアドレスの番号を、シード表の呼び名（〔管理者ID-M1016-…〕）で控える。名前が同じメンバーがいれば内容を確かめて使う。
 *   - 管理者識別子（M1016-A など）は画面で指定できない（DB での準備）。設定しない。ケースは管理者IDで見分ける。
 *   - パスワードが12文字に満たない正本の値（M1016Pw006! など）は画面の入力規則に合わないので、末尾に「X」を足して12文字にした値で登録し、その値でログインする
 *     （ケースはパスワードを確かめない。前例 F07-04）。
 * - 追加システム設定（BASE・L-BASE）≪共有の設定を書き換える≫:
 *   seeds/add-system-restore.ts で、書き換える前に画面の全項目を控え、元の値のまま保存できることを確かめてから、元へ戻すことを登録し、
 *   ケースの前提に要る項目だけを書き換える（項目はケースの事前準備が開始値を挙げたもの。下の「ケースごとの書き換える項目」）。
 *   ケースの終わりに、基盤が画面で控えた全項目の値へ戻し、開き直して全項目が控えと同じかを確かめる。
 *   - 「ピッキングリスト分割しきい値価格」「タイトルを変更する商品ID( , 区切り)」は画面に入力欄が無く、設定できない（シードの注記に残す）。
 *   - 監査用管理者（管理者ID 10160999・識別子 M1016-SEED）・更新した管理者・更新日時（2026-08-01 10:00:00）・設定行ID=1 は DB での準備で、設定しない。
 *     更新した管理者・更新日時が「変わらない」ことは、ケースの操作の前の値と比べて確かめる（spec）。
 * - SHOP ≪共有の設定を書き換える≫: 本店の店舗基本設定を seeds/shop-restore.ts で控えて書き換え、ケースの終わりに戻す。
 *   住所「東京都千代田区千代田1-1」は、都道府県「東京都」・市区町村名「千代田区」・番地・ビル名「千代田1-1」に分けて入れた。
 * - L-MEMBER-045: メンバー管理で登録する。所属店舗・デフォルト検索表示店舗・編集可能店舗は店名「東京店」の店舗のうち番号のいちばん小さいもの、
 *   所属・権限は開発環境にあるものへ読み替える（M11-02 と同じ: トレード→試験所属A、システム権限→システム管理者）。自動ログアウト設定を有効にする。
 *   名前・ログインID・メールアドレスには実行の印を付ける（決め打ちの識別の値。依頼者決定 2026-10-28）。
 *
 * 作らないシード: LEGACY（DB で行を登録する）・DEFAULT-MISSING・MISSING-KEY（設定行を消す DB での準備）・L-DATA-046（DB のフィクスチャ）。
 */
import { Browser, test } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 店名の店舗ID } from "../db/m11_02";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { MemberEditPage } from "../pages/admin/m11_02_member";
import { 識別ID12から18 } from "../pages/admin/m10_16_add_system";
import { 追加システム設定を控えて書き換える } from "./add-system-restore";
import { 本店の基本設定を控えて書き換える } from "./shop-restore";

// ---- 管理者 ----

/** 正本のパスワードが12文字に満たなければ、末尾に「X」を足して12文字にする（画面の入力規則） */
export const 画面で使えるパスワード = (正本: string): string => (正本.length >= 12 ? 正本 : 正本 + "X".repeat(12 - 正本.length));

export const M1016_ADMIN_A: Account = { loginId: "m1016_admin_a", password: "M1016ReadOnly!" };
export const M1016_L_ADMIN: Account = { loginId: "m1016ladm", password: "M1016LinkAdm!1" };
/** ケース専用の管理者（番号は 006・041 など。B-041 は "B-041"） */
export function M1016管理者(番号: string): Account {
  const b = 番号.startsWith("B-");
  const n = b ? 番号.slice(2) : 番号;
  const 正本 = b ? `M1016PwB${n}!` : ["049", "050", "051"].includes(n) ? `M1016Pw${n}` : `M1016Pw${n}!`;
  return { loginId: `m1016_admin_${b ? "b" : "a"}-${n}`, password: 画面で使えるパスワード(正本) };
}

async function 管理者を用意する(browser: Browser, 名前: string, a: Account): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new MemberEditPage(page);
    await p.新規登録を開く();
    const 本店 = ((await page.locator('[name="admin_member[baseInfo]"] option[value="1"]').textContent()) ?? "").trim();
    if (!本店) throw new Error("メンバー登録の所属店舗に本店（店舗ID 1）の選択肢が無い");
    return ensureMember(page, {
      名前, 所属店舗: 本店, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`, パスワード: a.password,
      権限: "システム管理者", デフォルト検索表示店舗: 本店, 編集可能店舗: [本店],
    });
  });
}

function 控える(notes: Notes, seed: { "状態・属性": string; 投入方法: string }, id: string): void {
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) if (/^〔管理者ID-M1016-/.test(l)) notes.set(l, id);
}

defineSeed("S-M10-16-ADM-A", async ({ browser, notes, seed }) => {
  控える(notes, seed, await 管理者を用意する(browser, "M10-16共通試験管理者A", M1016_ADMIN_A));
  reportSeedIssue(seed.シードID, "管理者識別子（M1016-A）は画面で指定できない（DB での準備）ため設定していない。権限は「システム管理者」（追加システム設定を操作できる）、所属店舗は本店");
});

defineSeed("S-M10-16-L-ADM", async ({ browser, notes, seed }) => {
  控える(notes, seed, await 管理者を用意する(browser, "M10-16連携試験管理者", M1016_L_ADMIN));
  reportSeedIssue(seed.シードID, "管理者識別子（M1016-L）は画面で指定できない（DB での準備）ため設定していない。権限は「システム管理者」、所属店舗は本店");
});

const ケース専用の管理者 = [
  "006", "007", "008", "009", "010", "011", "012", "014", "015", "017", "018", "019", "020", "021", "023", "024", "025", "026", "027", "028", "029",
  "031", "032", "035", "036", "037", "039", "040", "041", "042", "049", "050", "051",
];
for (const n of ケース専用の管理者) {
  defineSeed(`S-M10-16-ADM-A-${n}`, async ({ browser, notes, seed }) => {
    const a = M1016管理者(n);
    控える(notes, seed, await 管理者を用意する(browser, seed.論理名, a));
    reportSeedIssue(seed.シードID, `管理者識別子は画面で指定できない（DB での準備）ため設定していない。パスワードは画面の入力規則（12文字以上）に合う「${a.password}」で登録した`);
  });
}
defineSeed("S-M10-16-ADM-B-041", async ({ browser, notes, seed }) => {
  控える(notes, seed, await 管理者を用意する(browser, seed.論理名, M1016管理者("B-041")));
  reportSeedIssue(seed.シードID, "管理者識別子（M1016-B-041）は画面で指定できない（DB での準備）ため設定していない");
});

// ---- 追加システム設定（共有の設定。控えて書き換え、ケースの終わりに基盤が戻す） ----

/** S-M10-16-BASE の全項目の値（シード表の状態・属性） */
export const M1016_BASE: Record<string, string> = {
  入荷通知最大数: "6", 買取専用メールアドレス: "buying-before@example.com", "レコメンドの検索期間（日数）": "8", 買取査定申込み完了画面の自動遷移秒数: "20",
  スマレジ契約ID: "CONTRACT 01", スマレジアクセストークン: "TOKEN 01", スマレジへの送信URL: "https://example.com/smaregi", "配送日指定が繰上る時刻(hh:mm)": "12:30",
  入荷通知メールの許可: "送信しない", まとめて買取商品ID: "100", 固定価格商品部門ID: "10",
  ...Object.fromEntries(識別ID12から18.map((k, i) => [k, `m${12 + i}-before@example.com`])),
  Small_packetが選択可能な合計金額の閾値: "1000", 英語サイト専用タグID: "50", "管理画面自動ログアウト時間（分）": "10", ピッキングリスト分割しきい値価格: "980",
  スマレジ通信エラー送信メールアドレス: "smaregi-before@example.com", "タイトルを変更する商品ID( , 区切り)": "100,200",
};
/** S-M10-16-L-BASE（連携試験用。レコメンドの検索期間30・自動遷移秒数15 のほかは BASE と同じ） */
export const M1016_L_BASE: Record<string, string> = { ...M1016_BASE, "レコメンドの検索期間（日数）": "30", 買取査定申込み完了画面の自動遷移秒数: "15" };

const 全部 = Object.keys(M1016_BASE);
const 数値8 = ["入荷通知最大数", "レコメンドの検索期間（日数）", "買取査定申込み完了画面の自動遷移秒数", "まとめて買取商品ID", "Small_packetが選択可能な合計金額の閾値", "英語サイト専用タグID", "管理画面自動ログアウト時間（分）", "ピッキングリスト分割しきい値価格"];
/**
 * ケースごとの書き換える項目（ケースの事前準備が開始値を挙げた項目。共有の設定を書き換える範囲を最小にする）。
 * 004（全項目の表示値を確かめる）と 006（全項目を書き換える）は全項目。
 */
const ケースごとの書き換える項目: Record<string, string[]> = {
  "004": 全部, "006": 全部,
  "007": ["入荷通知最大数"], "008": ["入荷通知最大数"], "009": ["入荷通知最大数"], "010": ["入荷通知最大数"], "011": ["入荷通知最大数"], "012": ["入荷通知最大数"],
  "039": ["入荷通知最大数"], "040": ["入荷通知最大数"], "041": ["入荷通知最大数"], "049": ["入荷通知最大数"],
  "050": ["入荷通知最大数", "買取専用メールアドレス"],
  "014": ["買取査定申込み完了画面の自動遷移秒数", "スマレジ契約ID", "スマレジアクセストークン", "スマレジへの送信URL", "まとめて買取商品ID", ...識別ID12から18, "スマレジ通信エラー送信メールアドレス", "タイトルを変更する商品ID( , 区切り)"],
  "015": ["入荷通知最大数", "買取専用メールアドレス", "レコメンドの検索期間（日数）", "配送日指定が繰上る時刻(hh:mm)", "固定価格商品部門ID", "Small_packetが選択可能な合計金額の閾値", "英語サイト専用タグID", "管理画面自動ログアウト時間（分）", "ピッキングリスト分割しきい値価格"],
  "017": ["買取専用メールアドレス", ...識別ID12から18, "管理画面自動ログアウト時間（分）"], "018": ["買取専用メールアドレス", ...識別ID12から18, "管理画面自動ログアウト時間（分）"],
  "019": 数値8, "020": 数値8, "023": [...数値8, "固定価格商品部門ID"], "021": ["固定価格商品部門ID"],
  "024": ["買取専用メールアドレス", ...識別ID12から18, "スマレジ通信エラー送信メールアドレス"],
  "025": ["スマレジ契約ID", "スマレジアクセストークン"], "026": ["スマレジ契約ID", "スマレジアクセストークン"],
  "027": ["スマレジへの送信URL"], "028": ["スマレジへの送信URL"], "029": ["スマレジへの送信URL"],
  "031": ["配送日指定が繰上る時刻(hh:mm)"], "032": ["配送日指定が繰上る時刻(hh:mm)"],
  "035": ["入荷通知メールの許可"], "036": ["入荷通知メールの許可"],
  "037": ["タイトルを変更する商品ID( , 区切り)"], "051": ["タイトルを変更する商品ID( , 区切り)"],
  "042": ["入荷通知最大数", "レコメンドの検索期間（日数）", "買取査定申込み完了画面の自動遷移秒数", "スマレジ契約ID", "スマレジアクセストークン", "スマレジへの送信URL",
    "配送日指定が繰上る時刻(hh:mm)", "入荷通知メールの許可", "まとめて買取商品ID", "固定価格商品部門ID", "Small_packetが選択可能な合計金額の閾値", "英語サイト専用タグID"],
};
/** L-BASE のケース（045 は自動ログアウト時間を確かめてから書き換える） */
const 連携のケースの書き換える項目: Record<string, string[]> = { "045": ["管理画面自動ログアウト時間（分）"] };

function いまのケースの番号(): string {
  const m = /^IT-M10-16-(\d{3}) /.exec(test.info().title);
  if (!m) throw new Error(`M10-16 のケースの中で呼ばれていない（${test.info().title}）`);
  return m[1];
}

async function 設定を書き換える(browser: Browser, seedId: string, 基準: Record<string, string>, 項目: string[]): Promise<void> {
  const 値 = Object.fromEntries(項目.map((k) => [k, 基準[k]]));
  const 無い = await 追加システム設定を控えて書き換える(browser, seedId, 値);
  reportSeedIssue(seedId, `共有の追加システム設定は、画面で全項目の元の値を控えて（元の値のまま保存できることも確かめて）から、このケースの前提に要る項目（${項目.join("・")}）だけをシード表の値へ書き換えた。ほかの項目は書き換えていない。ケースの終わりに基盤が画面で元の値へ戻し、開き直して確かめる`);
  if (無い.length) reportSeedIssue(seedId, `画面に入力欄が無いため設定できなかった項目: ${無い.join("・")}`);
  reportSeedIssue(seedId, "監査用管理者（管理者ID 10160999・識別子 M1016-SEED）・各設定行の更新した管理者・更新日時（2026-08-01 10:00:00）・設定行ID=1 は DB での準備で、設定していない");
}

defineSeed("S-M10-16-BASE", async ({ browser, seed }) => {
  const n = いまのケースの番号();
  const 項目 = ケースごとの書き換える項目[n];
  if (!項目) throw new Error(`IT-M10-16-${n} の書き換える項目を決めていない`);
  await 設定を書き換える(browser, seed.シードID, M1016_BASE, 項目);
});

defineSeed("S-M10-16-L-BASE", async ({ browser, seed }) => {
  const n = いまのケースの番号();
  const 項目 = 連携のケースの書き換える項目[n];
  if (!項目) throw new Error(`IT-M10-16-${n} の書き換える項目を決めていない`);
  await 設定を書き換える(browser, seed.シードID, M1016_L_BASE, 項目);
});

// ---- 本店の店舗基本設定（共有の設定。控えて書き換え、ケースの終わりに基盤が戻す） ----

export const M1016_SHOP = { 店名: "基本情報非影響店舗", 郵便番号: "100-0001", 都道府県: "東京都", 市区町村名: "千代田区", "番地・ビル名": "千代田1-1", 電話番号: "03-1234-5678" };
defineSeed("S-M10-16-SHOP", async ({ browser, seed }) => {
  await 本店の基本設定を控えて書き換える(browser, seed.シードID, M1016_SHOP, false);
  reportSeedIssue(seed.シードID, "本店の店舗基本設定は、画面で全項目を控えてから店名・郵便番号・住所・電話番号だけを書き換えた。住所「東京都千代田区千代田1-1」は都道府県「東京都」・市区町村名「千代田区」・番地・ビル名「千代田1-1」に分けた。ケースの終わりに基盤が画面で元の値へ戻す");
});

// ---- 連携ログアウト確認メンバー ----

export const M1016_L_MEMBER_045: Account = { loginId: rc("m1016lmem002").toLowerCase(), password: "M1016LinkOut2!" };
defineSeed("S-M10-16-L-MEMBER-045", async ({ browser, notes, seed }) => {
  const 東京店 = 店名の店舗ID("東京店");
  if (!東京店) throw new Error("店名「東京店」の店舗が無い");
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new MemberEditPage(page);
    await p.新規登録を開く();
    await p.入れる({
      名前: rc("連携ログアウト確認メンバー-002"), 所属店舗ID: 東京店, 所属: "試験所属A", ログインID: M1016_L_MEMBER_045.loginId,
      メールアドレス: `${M1016_L_MEMBER_045.loginId}@example.test`, パスワード: M1016_L_MEMBER_045.password, 権限: "システム管理者",
      編集可能店舗ID: [東京店], デフォルト検索表示店舗ID: 東京店, 稼働: "稼働", 二段階認証: false, 自動ログアウト: true, スマレジ用アカウント: false,
    });
    const r = await p.登録を押す();
    const m = /\/member\/(\d+)\/edit/.exec(page.url());
    if (!m || r.誤り.length) throw new Error(`メンバーを登録できない（${r.誤り.join(" / ") || page.url()}）`);
    return m[1];
  });
  notes.set("〔メンバーID-M1016-045〕", id);
  reportSeedIssue(seed.シードID, `名前・ログインID・メールアドレスには実行の印を付けた（ログインID ${M1016_L_MEMBER_045.loginId}）。所属店舗・デフォルト検索表示店舗・編集可能店舗は店名「東京店」の店舗（番号 ${東京店}）、所属「トレード」は開発環境の「試験所属A」、権限「システム権限」は「システム管理者」へ読み替えた`);
});
