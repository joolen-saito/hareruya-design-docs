/**
 * F08-01（店頭買取査定申込前ログイン）の画面シード。正本: cases/F08-01_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）で、シード表の「DBで準備」は、画面で作れる同じ前提か既存データへ読み替えた。DB へは書き込まない。
 * - 店舗（STORE-NNN）: 店舗識別名（it_f0801_NNN）は画面で指定できない。ケースごとに店舗を作らず、F08-05 で共通の試験店舗
 *   「店頭買取PD0805-003」（支店URL itf0805pd003。無ければ登録）を使う。手順の店舗識別名はこの店舗の支店URLとして読む。
 * - 会員（MEMBER-NNN）: フロントの会員登録で作り、管理画面の会員登録編集で本会員にする。メールアドレスの前半に実行の印を付ける。
 *   パスワードは正本の値。
 * - 査定申込（ORDER-011）: 会員でログインし、申込情報を画面で入力して申込む。申込日時・更新日時は 2026-09-29 にできない（画面が申込日時を決める）。
 *   ケースは操作前後の件数と内容の比較なので、日時の値そのものには依存しない。
 * - 会員ログイン試行制限の開始状態（LOGIN-LIMIT）: 試行回数の記録は消さず（共有のデータ・送信元単位の制限）、何もしない。
 *   ログインに失敗させるケース（008）は、送信元単位の制限にかかるので実装していない。
 * - 保持入力（HELD-INPUT-010）: ケースの新しいブラウザセッションの中で、手順の前に入力して保持させる（シードは作らない）。
 */
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 会員の査定申込み } from "../db/f08_05";
import { OtcCompletePage } from "../pages/front/f08_03_complete";
import { ensureStore } from "../pages/admin/m04_24_store";
import { MemberApplyPage } from "../pages/front/f08_05_apply";
import { OtcInputPage } from "../pages/front/f08_02_input";
import { F0802会員, PD_STORE, 会員を作る } from "./f08-02";

export { PD_STORE };

const 店舗の注記 = (正本の店舗識別名: string) =>
  `店舗識別名「${正本の店舗識別名}」の店舗を新しく作らず（店舗識別名は画面で指定できない）、F08-05 と共通の試験店舗「${PD_STORE.店名}」` +
  `（支店URL ${PD_STORE.支店URL}。無ければ登録）に読み替えた。手順の店舗識別名もこの店舗の支店URLとして読む`;

for (const n of ["001", "003", "004", "005", "006", "007", "008", "009", "010", "011"]) {
  defineSeed(`S-F08-01-STORE-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔店舗ID-F0801-${n}〕`, await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      return ensureStore(page, PD_STORE, (m) => reportSeedIssue(seed.シードID, m));
    }));
    reportSeedIssue(seed.シードID, 店舗の注記(`it_f0801_${n}`));
  });
}

defineSeed("S-F08-01-LOGIN-LIMIT", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "会員ログイン試行回数の記録は消さず（送信元単位の制限に関わる共有のデータ）、何もしなかった");
});

/** 会員（正本のメールアドレスの前半に実行の印を付けた値） */
export function F0801の会員(n: "006" | "008" | "011"): F0802会員 {
  const base = { 生年月日: ["1990", "1", "1"] as [string, string, string], 住所3: "晴れる屋ビル3階" };
  const [local, domain] = `f0801-member-${n}@example.invalid`.split("@");
  const メール = `${rc(local)}@${domain}`;
  if (n === "011") return { ...base, 姓: "非更新", 名: "確認", セイ: "ヒコウシン", メイ: "カクニン", メール, パスワード: "F0801-011Aa1!", 住所3: "非更新確認ビル十一" };
  return { ...base, 姓: "結合", 名: `会員F0801${n}`, セイ: "ケツゴウ", メイ: "カイイン", メール, パスワード: `F0801-${n}Aa1!` };
}

for (const n of ["006", "008", "011"] as const) {
  defineSeed(`S-F08-01-MEMBER-${n}`, async ({ browser, notes, seed }) => {
    const m = F0801の会員(n);
    notes.set(`〔会員ID-F0801-${n}〕`, await 会員を作る(browser, m, (s) => reportSeedIssue(seed.シードID, s)));
    reportSeedIssue(seed.シードID, `メールアドレスの前半に実行の印を付けた（${m.メール}）。電話番号などシード表に無い必須項目は任意の有効な値`);
  });
}

/** 非更新確認用の査定申込を、会員の画面操作で1件作る */
defineSeed("S-F08-01-ORDER-011", { needs: ["S-F08-01-STORE-011", "S-F08-01-MEMBER-011"] }, async ({ browser, notes, seed }) => {
  const m = F0801の会員("011");
  let 査定番号: string | null = null;
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const page = await ctx.newPage();
    page.setDefaultTimeout(60_000);
    const apply = new MemberApplyPage(page);
    await apply.申込前ログイン画面を開く(PD_STORE.支店URL);
    await apply.ログインする(m.メール, m.パスワード);
    await new OtcInputPage(page).空の必須項目に入れる({ 職業: "会社員", 電話連絡: "不必要", 大会参加: "いいえ", 適格請求書発行事業者: "いいえ", 利用規約同意: true });
    await apply.同意して次へ進む();
    await apply.査定申込みする();
    const done = new OtcCompletePage(page);
    await done.表示を待つ();
    査定番号 = await done.査定番号();
  } finally {
    await ctx.close();
  }
  reportSeedIssue(seed.シードID, "査定申込を会員の画面操作で1件作った。申込日時・更新日時・電話番号・フリーコメントは画面が決める値（シード表の値にできない）。状態は申込直後の状態");
});

defineSeed("S-F08-01-HELD-INPUT-010", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "保持させる入力は、ケースの新しいブラウザセッションの中で、手順の前に入力して行う（シードでは作らない）");
});
