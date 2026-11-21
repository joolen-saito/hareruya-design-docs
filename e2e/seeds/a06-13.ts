/**
 * A06-13 本人確認証明書更新（MTGBuyer の API）のシードの作り方（画面操作）。
 * 値はシード表（integration_test/casegen/cases/A06-13_seed_data.tsv）の状態・属性と投入方法のとおり。
 *
 * シードでの解釈（正本の外の補い）:
 * - S-A06-13-AUTH の署名の鍵・署名方式・送信元IPの許可は、共有の開発環境では書き換えず、環境に設定済みの値を使う（シード表の≪共有の設定≫）。
 *   IP 許可リストには触れない（書き足さないので、消す行も無い）。有効なトークンは管理者のログイン API で受け取る。
 * - 試験店舗「A06-13試験店舗」は、試験店舗の使い回し（依頼者決定 2026-11-13）で作らず、試験支店に読み替える。
 * - 店頭買取ステータス・本人確認証明書・職業・国・都道府県のマスタは、書き換えず DB であることだけを確かめる（シード表は DB へ直接設定）。
 * - 管理者は、実行をまたいで使い回す決まった印（rcFixed）を名前・ログインIDに付けて1度だけ作る（依頼者決定 2026-11-11）。
 * - 店頭買取の受注は、試験支店のフロントの店頭買取査定申込（会員登録なし）で作り、完了画面の査定番号を査定IDとして控え、受注IDは DB で読む。
 *   申込者の姓には実行の印を付ける（画面で指定できない本人確認証明書ID=1・更新担当者を、E2E の受注の行にだけ DB で書くため。lib/db_write.ts）。
 *   電話番号・郵便番号・住所・生年月日・職業は共通の申込の部品の固定の値、査定申込日時・更新日時は申込・書き込みのときの値（ケースは確かめない）。
 */
import { SETUP_ADMIN } from "../config/env";
import { 申込のマスタにある, 査定IDの受注ID, 申込番号の査定ID, 店頭買取の受注, 店頭買取の受注がある, 店頭買取ステータスの名称, 本人確認証明書の名称, 本人確認証明書と更新担当者を書く } from "../db/a06";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberFixed } from "../pages/admin/member";
import { 試験支店 } from "../pages/admin/reuse_store";
import { 店舗読み替えの注記, 試験支店ID, 試験店舗の名前を読む } from "../pages/admin/test_store";
import { 申込を行う, 申込者の } from "./m06-common";

type 管理者 = Account & { 名前: string; メール: string };
const 管理者の = (ログインID: string, パスワード: string, 名前: string): 管理者 => {
  const loginId = rcFixed(ログインID).toLowerCase();
  // 開発環境のメンバー登録はパスワードを12文字以上に限る。シード表の11文字のパスワードは末尾に「X」を足して読み替える（A06-12 と同じ）
  const password = パスワード.length < 12 ? `${パスワード}X` : パスワード;
  return { loginId, password, 名前: rcFixed(名前), メール: `${loginId}@example.test` };
};
/** S-A06-13-AUTH の管理者（有効なトークンを受け取る） */
export const A0613_ADM = 管理者の("a0613_admin", "ZxA0613c001", "A06-13試験担当");
/** S-A06-13-REFERENCES の更新前担当者 */
export const A0613_BEFORE = 管理者の("a0613_before", "ZxA0613b001", "A06-13更新前担当");

/** 管理者を（無ければ）登録し、管理者IDを控える。所属店舗・デフォルト検索表示店舗・編集可能店舗は試験支店 */
async function 管理者を用意する(ctx: Parameters<SeedBuilder>[0], a: 管理者, 呼び名: string): Promise<void> {
  const { browser, notes, seed } = ctx;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店名 = (await 試験店舗の名前を読む(page)).試験支店;
    reportSeedIssue(seed.シードID, 店舗読み替えの注記("A06-13試験店舗", 店名, 試験支店ID));
    notes.set("〔店舗ID-A0613-共有〕", 試験支店ID);
    notes.set(呼び名, await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店名, ログインID: a.loginId, メールアドレス: a.メール, パスワード: a.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
    }, (m) => reportSeedIssue(seed.シードID, m)));
  });
  if (a.password.length === 12 && a.password.endsWith("X")) reportSeedIssue(seed.シードID, "パスワードはシード表の11文字の値の末尾に「X」を足して読み替えた（開発環境のメンバー登録は12文字以上でないと保存できない）");
}

defineSeed("S-A06-13-AUTH", async (ctx) => {
  await 管理者を用意する(ctx, A0613_ADM, "〔管理者ID-A0613-共有〕");
  reportSeedIssue(ctx.seed.シードID, "署名の鍵・署名方式・送信元IPの許可は、共有の開発環境では書き換えず、環境に設定済みの値を使う（IP 許可リストには触れない）。所属は選択肢の先頭");
});

defineSeed("S-A06-13-REFERENCES", async (ctx) => {
  await 管理者を用意する(ctx, A0613_BEFORE, "〔更新前担当者ID-A0613-共有〕");
  const id = ctx.seed.シードID;
  if (店頭買取ステータスの名称("5") !== "査定前") throw new Error(`${id}: 店頭買取ステータス ID 5 が「査定前」でない（共有のマスタは書き換えない）`);
  const 証明書1 = 本人確認証明書の名称("1");
  const 証明書2 = 本人確認証明書の名称("2");
  if (証明書1 !== "自動車運転免許証" || 証明書2 !== "パスポート") reportSeedIssue(id, `本人確認証明書のマスタがシード表と違う（書き換えない）: ID 1「${証明書1}」・ID 2「${証明書2}」`);
  if (!証明書1 || !証明書2) throw new Error(`${id}: 本人確認証明書 ID 1・2 のどちらかが無い`);
  for (const [m, v] of [["職業", "会社員"], ["国", "日本"], ["都道府県", "東京都"]] as const) {
    // 開発環境の国のマスタは英語の名称（ID 392「Japan」）。「日本」が無ければ「Japan」の行を「日本」に当たる行として使う（マスタは書き換えない）
    if (!申込のマスタにある(m, v) && !(m === "国" && 申込のマスタにある(m, "Japan"))) throw new Error(`${id}: ${m}のマスタに「${v}」が無い`);
  }
  reportSeedIssue(id, "店頭買取ステータス・本人確認証明書・職業・国・都道府県のマスタは、書き換えず、あることを DB で確かめた。更新前担当者の権限はシステム管理者、所属は選択肢の先頭。国「日本」は、開発環境の国のマスタでは英語の名称「Japan」（ID 392）の行として確かめた");
});

/** 試験支店のフロントで申込み、本人確認証明書ID=1・更新担当者=更新前担当者を DB で書く */
const 受注のシード = (n: string): SeedBuilder => async ({ browser, notes, seed }) => {
  const 姓 = rc("晴屋");
  const [番号] = await 申込を行う(browser, 試験支店.支店URL, [申込者の(姓, "太郎", "ハレルヤ", "タロウ")]);
  const 査定ID = 申込番号の査定ID(番号);
  const 受注ID = 査定IDの受注ID(査定ID);
  if (!受注ID) throw new Error(`${seed.シードID}: 申込んだ査定ID ${査定ID} の店頭買取の受注が DB に無い`);
  notes.set(`〔査定ID-A0613-${n}〕`, 査定ID);
  notes.set(`〔店頭買取ID-A0613-${n}〕`, 受注ID);
  本人確認証明書と更新担当者を書く(受注ID, "1", notes.get("〔更新前担当者ID-A0613-共有〕"), 姓);
  const r = 店頭買取の受注(受注ID);
  if (r?.本人確認証明書ID !== "1" || r?.更新担当者ID !== notes.get("〔更新前担当者ID-A0613-共有〕")) throw new Error(`${seed.シードID}: 受注ID ${受注ID} の本人確認証明書ID・更新担当者を書けていない`);
  reportSeedIssue(seed.シードID, `試験支店のフロントで申込んだ（査定ID ${査定ID}・店頭買取ID ${受注ID}。申込者の姓に実行の印）。本人確認証明書ID=1・更新担当者は DB で書いた（画面で指定できないため・シード表の作り方）。電話番号などの申込者の値は共通の部品の固定の値、査定申込日時・更新日時は申込・書き込みのときの値`);
};
const 受注の前提 = { needs: ["S-A06-13-AUTH", "S-A06-13-REFERENCES"] };
defineSeed("S-A06-13-ORDER-002", 受注の前提, 受注のシード("002"));
defineSeed("S-A06-13-ORDER-014", 受注の前提, 受注のシード("014"));
defineSeed("S-A06-13-ORDER-018", 受注の前提, 受注のシード("018"));

defineSeed("S-A06-13-NOORDER-005", async ({ seed }) => {
  if (店頭買取の受注がある("699999005")) throw new Error(`${seed.シードID}: 店頭買取ID 699999005 の受注がある（0件の前提を満たせない。消さない）`);
});
