/**
 * F06-18 会員情報変更の画面シード。正本: cases/F06-18_seed_data.tsv
 *
 * - 会員は、フロントの会員情報登録画面で全項目を入れて登録し、本登録のメール（手元の受け口）のURLで本会員にする。
 *   会員番号は管理画面の会員一覧のメールアドレス検索で控える。メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 * - 本人確認ステータスは管理画面の会員登録/編集画面で整える（確認済み＝オンライン本人確認済み、簡易書留確認済み）。
 * - 画面で指定できないもの（スマレジ会員番号を空にする・選手情報更新日時）は、E2E が作った会員の行だけ DB で書き足す（lib/db_write.ts）。
 * 読み替え（記録 review/F06-18_progress_2026-11-11_dev.md）:
 * - シード表の会員ID（member06180001 など）は、会員番号（画面が振る数字）と別の文字の識別子として書かれているが、アプリに会員番号のほかの会員IDは無い。
 *   画面が振った会員番号を会員IDとして使う（DB で書き換えない）。
 * - ケース専用のシードの固定の番号（306180017 など）は、画面が振る番号に読み替える（同じ番号の会員を DB で消してから作る作り方はしない）。
 * - メールアドレスは、シード表の …@example.com の前半に実行の印を付けた …@example.test（手元の受け口で読む）。
 * - 職業の「会社員」「学生」は、開発環境のマスタに既にある（全員が使うマスタなので足さない。あることを確かめるだけ）。
 * - 支店通知再送記録: 支店システムは無い（2026-11-06）。新しく作った会員には記録が無い。
 */
import { SETUP_ADMIN } from "../config/env";
import { available } from "../lib/db";
import { defineSeed, SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 会員の保存内容 } from "../db/m08_04";
import { スマレジ会員番号を空にする, 既定配送先ID, 職業の名前, 選手情報, 選手情報の更新日時を決める } from "../db/f06_18";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { フロントで会員登録する } from "../pages/front/m08_member";
import { 会員IDを探す } from "./m08-common";
import { markedMail } from "./f06-member";

export type F0618会員 = { 会員ID: string; メール: string; パスワード: string };
const 作った = new Map<string, F0618会員>();

/** シードで作った試験会員（ログインに使う） */
export function 試験会員(シードID: string): F0618会員 {
  const m = 作った.get(シードID);
  if (!m) throw new Error(`${シードID} の試験会員をまだ作っていない`);
  return m;
}

type 本人確認 = "未確認" | "オンライン本人確認済み" | "簡易書留確認済み";

const 国内 = {
  姓: "佐藤", 名: "太郎", セイ: "サトウ", メイ: "タロウ", 生年月日: ["1990", "1", "2"] as [string, string, string], 性別: "男性" as const,
  国: "Japan" as const, 郵便番号: "100-0001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1番",
  電話番号: "0311111111", 会社名: "試験会社", 職業: "会社員", MTG姓: "SATO", MTG名: "TARO",
};
const 海外 = {
  姓: "Smith", 名: "John", セイ: "スミス", メイ: "ジョン", 生年月日: ["1985", "4", "5"] as [string, string, string], 性別: "男性" as const,
  国: "United States" as const, 郵便番号: "1234567890", 住所1: "350 Fifth Avenue", 住所2: "New York", 住所3: "Suite 1801",
  電話番号: "0312222222", 会社名: "海外試験会社", 職業: "会社員", MTG姓: "SMITH", MTG名: "JOHN",
};

/** 会員を登録して本会員にし、本人確認ステータスを整え、スマレジ会員番号を空にする */
async function 会員を作る(ctx: SeedCtx, o: { 前半: string; パスワード: string; 住所: "国内" | "海外"; 本人確認: 本人確認 }): Promise<F0618会員> {
  const { browser, seed } = ctx;
  const メール = markedMail(o.前半);
  await フロントで会員登録する(browser, { ...(o.住所 === "国内" ? 国内 : 海外), メール, パスワード: o.パスワード });
  const 会員ID = await 会員IDを探す(browser, メール);
  if (o.本人確認 !== "未確認") {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const edit = new M08CustomerEditPage(page);
      const status = await edit.open(会員ID);
      if (status !== 200) throw new Error(`${seed.シードID}: 会員番号 ${会員ID} の会員登録/編集画面を開けない（応答 ${status}）`);
      if (o.本人確認 === "オンライン本人確認済み") {
        await edit.オンライン本人確認済みにする();
      } else {
        await edit.ラジオを選ぶ("Player][IdentityConfirmStatus", o.本人確認);
        await edit.登録する();
        const err = await edit.エラー文();
        if (err.length || (await edit.成功メッセージ()) === null) throw new Error(`${seed.シードID}: 本人確認ステータスを${o.本人確認}にできない（${err.join(" / ")}）`);
      }
    });
  }
  if (available) {
    const 実際 = 会員の保存内容(会員ID)?.本人確認ステータス;
    if (実際 !== o.本人確認) throw new Error(`${seed.シードID}: 会員 ${メール} の本人確認ステータスが「${実際}」（求めるのは「${o.本人確認}」）`);
    if (選手情報(会員ID)?.スマレジ会員番号) スマレジ会員番号を空にする(seed.シードID, 会員ID, メール);
    if (選手情報(会員ID)?.スマレジ会員番号) throw new Error(`${seed.シードID}: 会員 ${メール} のスマレジ会員番号を空にできていない`);
  }
  const m = { 会員ID, メール, パスワード: o.パスワード };
  作った.set(seed.シードID, m);
  return m;
}

// ---- 共有の試験会員 ----
defineSeed("S-F06-18-JP", async (ctx) => {
  const m = await 会員を作る(ctx, { 前半: "f0618", パスワード: "F0618-Passw0rd-JP", 住所: "国内", 本人確認: "オンライン本人確認済み" });
  ctx.notes.set("〔会員レコードID-F0618-共有JP〕", m.会員ID);
  if (!available) throw new Error("S-F06-18-JP: 選手情報・既定配送先の番号はDBの参照で控えるので、DBの接続が要る");
  const p = 選手情報(m.会員ID);
  if (!p) throw new Error("S-F06-18-JP: 会員の選手情報が無い");
  ctx.notes.set("〔選手情報レコードID-F0618-共有JP〕", p.ID);
  const a = 既定配送先ID(m.会員ID);
  if (!a) throw new Error("S-F06-18-JP: 会員の既定配送先が無い");
  ctx.notes.set("〔既定配送先レコードID-F0618-共有JP〕", a);
  選手情報の更新日時を決める("S-F06-18-JP", m.会員ID, m.メール, "2026-09-01 00:00:00+09:00");
  if (選手情報(m.会員ID)?.更新日時 !== "2026-09-01 00:00:00") throw new Error("S-F06-18-JP: 選手情報更新日時を 2026-09-01 00:00:00+09:00 にできていない");
});

defineSeed("S-F06-18-OVERSEAS", async (ctx) => {
  const m = await 会員を作る(ctx, { 前半: "f0618-overseas", パスワード: "F0618-Passw0rd-OVERSEAS", 住所: "海外", 本人確認: "オンライン本人確認済み" });
  ctx.notes.set("〔会員レコードID-F0618-共有OVERSEAS〕", m.会員ID);
  ctx.notes.set("〔会員ID-F0618-共有OVERSEAS〕", m.会員ID);
});

defineSeed("S-F06-18-OCCUPATION", async () => {
  // 職業のマスタは全員が使うので足さない。「会社員」「学生」が既にあることを確かめる
  if (!available) return;
  const names = 職業の名前();
  for (const n of ["会社員", "学生"]) {
    if (!names.includes(n)) throw new Error(`S-F06-18-OCCUPATION: 職業のマスタに「${n}」が無い（全員が使うマスタなので足さない）`);
  }
});

// ---- ケース専用の試験会員（パスワードは F0618-Passw0rd-<ケースの番号>） ----
const 専用 = (前半: string, 住所: "国内" | "海外", 本人確認: 本人確認, n: string) => async (ctx: SeedCtx) => {
  await 会員を作る(ctx, { 前半, パスワード: `F0618-Passw0rd-${n}`, 住所, 本人確認 });
};
defineSeed("S-F06-18-JP-017", 専用("f0618-017", "国内", "未確認", "017"));
defineSeed("S-F06-18-JP-019", 専用("f0618-019", "国内", "未確認", "019"));
defineSeed("S-F06-18-JP-020", 専用("f0618-020", "国内", "オンライン本人確認済み", "020"));
defineSeed("S-F06-18-REGISTERED-MAIL-021", 専用("f0618-registered-021", "国内", "簡易書留確認済み", "021"));
defineSeed("S-F06-18-JP-024", 専用("f0618-024", "国内", "未確認", "024"));
defineSeed("S-F06-18-OVERSEAS-027", 専用("f0618-overseas-027", "海外", "未確認", "027"));
defineSeed("S-F06-18-OVERSEAS-029", 専用("f0618-overseas-029", "海外", "未確認", "029"));
defineSeed("S-F06-18-JP-034", 専用("f0618-034", "国内", "未確認", "034"));
defineSeed("S-F06-18-JP-036", 専用("f0618-036", "国内", "未確認", "036"));
defineSeed("S-F06-18-JP-041", 専用("f0618-041", "国内", "未確認", "041"));
defineSeed("S-F06-18-JP-055", 専用("f0618-055", "国内", "未確認", "055"));
defineSeed("S-F06-18-JP-056", 専用("f0618-056", "国内", "未確認", "056"));
defineSeed("S-F06-18-JP-057", 専用("f0618-057", "国内", "未確認", "057"));
defineSeed("S-F06-18-JP-058", 専用("f0618-058", "国内", "未確認", "058"));
defineSeed("S-F06-18-JP-060", 専用("f0618-060", "国内", "未確認", "060"));
defineSeed("S-F06-18-COMPANY-070", 専用("f0618-070", "国内", "オンライン本人確認済み", "070"));
