/**
 * A07-02 ネット買取受注一覧取得（MTGバイヤーの API）のシード。正本: cases/A07-02_seed_data.tsv
 *
 * 作り方（シード表の手順を画面で行う。読み替えた点は、シードの注記と記録 review/A07-02_progress_2026-11-17_dev.md に書く）:
 * - API の試験環境（S-A07-02-API）: 共有の開発環境では、認証の秘密の値・署名方式・送信元IPの許可を書き換えない。環境に設定済みの値のまま使い、
 *   認証トークンは管理者ログインの API で受け取る（pages/admin/a07_api.ts）。
 * - マスタ（S-A07-02-MASTERS）: DB へは書かない。開発環境の買取状況（商品到着・振込完了・査定中・査定中断・査定再開）と都道府県「東京都」があることを参照で確かめる。
 * - 査定担当A・B（ADM1・ADM2）: メンバー管理で登録する試験管理者。実行をまたいで使い回す決まった印を名前・ログインIDに付ける（lib/run_marker の rcFixed。
 *   依頼者決定 2026-11-11）。所属店舗は試験支店（依頼者決定 2026-11-13。店舗は作らない）。応答の査定担当者名は、この印つきの名前と比べる。
 * - 会員: 正本は管理画面の会員登録。フロントの会員登録（依頼者決定 2026-10-31）で、お名前・住所・電話番号はシード表の値、メールアドレスは
 *   シード表の値の @ の前に実行の印を付けた値で作る。顧客IDは、登録した会員のメールアドレスで DB を参照して控える。
 * - 買取: その会員でフロントからネット買取を申し込み、完了画面の買取番号を控える（申込みの順）。買取状況「商品到着」と管理者用メモは買取情報編集で保存する。
 * - 画面で指定できない値（査定申込日・ハイフン付きの電話番号と郵便番号・査定担当者・買取状況「振込完了」）は、実行の印つきの買取にだけ DB で書く（db/a07_02.ts）。
 * - S-A07-02-ORDER-016 の「ほかの受注の状況を振込完了にする」は、ほかの方のデータなので行わない（ケースの期待結果はほかの受注の有無に左右されない）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc, rcFixed } from "../lib/run_marker";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { ensureMemberFixed, findMemberIdByLoginId } from "../pages/admin/member";
import { メンバーの編集可能店舗を外す, メンバーを削除する } from "../pages/admin/m05_20_standby";
import { 試験店舗の名前を読む, 店舗読み替えの注記 } from "../pages/admin/test_store";
import { BuyEditPage, BuyListPage } from "../pages/admin/m07_buy";
import { registerFrontMember } from "../pages/front/member_entry";
import { ログインする, 買取する商品を選ぶ, 申込む } from "../pages/front/m07_net_buy";
import { 管理者のトークン } from "../pages/admin/a07_api";
import * as db from "../db/a07_02";

/** 査定担当A・B（決まった印つきの名前・ログインID）。パスワードはシード表の「任意の有効な値」 */
export const 査定担当A = { 名前: rcFixed("査定担当A"), account: { loginId: rcFixed("a0702_assessor_a").toLowerCase(), password: "Passw0rd!A0702A" } as Account };
export const 査定担当B = { 名前: rcFixed("査定担当B"), account: { loginId: rcFixed("a0702_assessor_b").toLowerCase(), password: "Passw0rd!A0702B" } as Account };
/** 削除用009（実行の印つき）。認証トークンは削除の前に受け取って控える（プロセスの中だけ） */
export const 削除用009 = { 名前: rc("削除用009"), account: { loginId: rc("a0702_del009").toLowerCase(), password: "Passw0rd!A0702D" } as Account };
export const 控えたトークン = new Map<string, string>();

const 会員のパスワード = "Passw0rd!A0702Mem";
/** 会員のメールアドレス（シード表の値の @ の前に実行の印） */
export const A0702のメール = (シード表のメール: string): string => `${rc(シード表のメール.replace(/@example\.test$/, ""))}@example.test`.toLowerCase();

async function 管理者を用意する(browser: Browser, seedId: string, a: { 名前: string; account: Account }): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 店 = await 試験店舗の名前を読む(page);
    const id = await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店.試験支店, ログインID: a.account.loginId, メールアドレス: `${a.account.loginId}@example.test`, パスワード: a.account.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店.試験支店, 編集可能店舗: [店.試験支店],
    }, (m) => reportSeedIssue(seedId, `シード作成時の問題: ${m}`));
    reportSeedIssue(seedId, `シード作成時の問題: 管理者はメンバー管理で登録した（名前「${a.名前}」・決まった印つき。所属・権限・所属店舗は任意の値＝システム管理者・試験支店。${店舗読み替えの注記("任意", 店.試験支店, "1574")}）。あれば使い回した（管理者ID ${id}）`);
    return id;
  });
}

defineSeed("S-A07-02-API", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "シード作成時の問題: 共有の開発環境では、APIの認証の秘密の値・署名方式・送信元IPの許可を書き換えず、環境に設定済みの値のまま使った。認証トークンは、管理者のログインIDとパスワードで管理者ログインのAPIを呼んで受け取った（シード表の署名シークレットでは作っていない）");
});

defineSeed("S-A07-02-MASTERS", async ({ seed }) => {
  const st = db.買取状況の一覧();
  const want: [string, string][] = [["2", "商品到着"], ["7", "振込完了"], ["10", "査定中"], ["11", "査定中断"], ["12", "査定再開"]];
  const ng = want.filter(([id, n]) => !st.some((s) => s.ID === id && s.名前 === n));
  if (ng.length) throw new Error(`買取状況のマスタがシード表と違う: ${ng.map(([i, n]) => `${i}=${n}`).join("・")}（ある値: ${st.map((s) => `${s.ID}=${s.名前}`).join(" ")}）`);
  if (!db.都道府県がある("東京都")) throw new Error("都道府県のマスタに「東京都」が無い");
  reportSeedIssue(seed.シードID, "シード作成時の問題: マスタはDBへ書かず、開発環境の買取状況（2=商品到着・7=振込完了・10=査定中・11=査定中断・12=査定再開）と都道府県「東京都」があることをDBの参照で確かめた");
});

defineSeed("S-A07-02-ADM1", async ({ browser, seed, notes }) => {
  notes.set("〔管理者会員ID-A0702-共有A〕", await 管理者を用意する(browser, seed.シードID, 査定担当A));
});
defineSeed("S-A07-02-ADM2", async ({ browser, seed, notes }) => {
  notes.set("〔管理者会員ID-A0702-共有B〕", await 管理者を用意する(browser, seed.シードID, 査定担当B));
});

/** 009: 管理者を登録して番号を控え、認証トークンを受け取ってから、メンバー管理で削除する */
defineSeed("S-A07-02-NOMEMBER-009", async ({ browser, seed, notes }) => {
  const id = await 管理者を用意する(browser, seed.シードID, 削除用009);
  notes.set("〔管理者会員ID-A0702-009〕", id);
  控えたトークン.set("009", await 管理者のトークン(削除用009.account.loginId, 削除用009.account.password));
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await メンバーの編集可能店舗を外す(page, id);
    await メンバーを削除する(page, id);
    if (await findMemberIdByLoginId(page, 削除用009.account.loginId, 削除用009.名前)) throw new Error(`管理者ID ${id} を削除したが、まだ残っている`);
  });
  reportSeedIssue(seed.シードID, `シード作成時の問題: 「試験環境の認証トークン発行機能」の代わりに、削除の前に管理者ログインのAPIで認証トークンを受け取って控え、そのあとメンバー管理で削除した（管理者ID ${id}。削除の前に編集可能店舗を外した）`);
});

type 買取の定め = {
  ラベル: string; メール: string; 姓: string; 名: string; 電話: string; 郵便番号: string; 住所1: string; 住所2: string;
  /** 申込みの順の状況。「商品到着」は買取情報編集で、「振込完了」は DB で設定する。「注文」はそのまま */
  状況: ("商品到着" | "振込完了" | "注文")[];
  申込日: string; メモ?: string; 査定担当?: "A";
  /** 控える受注の呼び名（申込みの順。〔ネット買取受注ID-A0702-…〕の … の部分） */
  受注の呼び名: string[];
};

/** 会員を作り、申し込み、画面とDBで状態を整え、顧客ID・受注IDを控える */
function defineBuyOrderSeed(seedId: string, d: 買取の定め): void {
  defineSeed(seedId, { needs: d.査定担当 ? ["S-A07-02-ADM1"] : [] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, `シード作成時の問題: ${m}`);
    const メール = A0702のメール(d.メール);
    const [電1, 電2, 電3] = d.電話.split("-") as [string, string, string];
    const [郵1, 郵2] = d.郵便番号.split("-");
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    const 番号: string[] = [];
    try {
      await hideDebugToolbar(ctx);
      const page = await ctx.newPage();
      page.setDefaultTimeout(60_000);
      await registerFrontMember(page, { 姓: d.姓, 名: d.名, セイ: "ケンショウ", メイ: "テスト", メール, パスワード: 会員のパスワード,
        詳細: { 郵便番号1: 郵1, 郵便番号2: 郵2, 都道府県: "東京都", 住所1: d.住所1, 住所2: d.住所2, 電話: [電1, 電2, 電3] } });
      let 会員ID = db.メールの会員ID(メール);
      for (let i = 0; !会員ID && i < 6; i++) { await page.waitForTimeout(10_000); 会員ID = db.メールの会員ID(メール); }
      if (!会員ID) throw new Error(`${seedId}: 登録した会員 ${メール} が DB に無い`);
      notes.set(`〔顧客ID-A0702-${d.ラベル}〕`, 会員ID);
    } finally { await ctx.close(); }
    // 登録の直後はログイン済みの画面になるので、申込みは別のブラウザでログインし直して行う（seeds/m07-02.ts と同じ形）
    const ctx2 = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(ctx2);
      const page = await ctx2.newPage();
      page.setDefaultTimeout(60_000);
      await ログインする(page, { メール, パスワード: 会員のパスワード });
      const 商品ID = await 買取する商品を選ぶ(page);
      for (let i = 0; i < d.状況.length; i++) 番号.push(String(Number(await 申込む(page, 商品ID))));
    } finally { await ctx2.close(); }
    d.受注の呼び名.forEach((l, i) => notes.set(`〔ネット買取受注ID-A0702-${l}〕`, 番号[i]));
    issue(`会員は、正本の管理画面の会員登録の代わりにフロントの会員登録で作った（依頼者決定 2026-10-31。お名前「${d.姓} ${d.名}」・郵便番号・都道府県・住所・電話番号はシード表の値。メールアドレスはシード表の値に実行の印を付けた ${メール}）。顧客IDは、登録した会員のメールアドレスでDBを参照して控えた。買取は既存の買取できる商品1点を数量1で${d.状況.length}回申し込み、完了画面の買取番号を控えた（${番号.join("・")}）`);
    // 画面: 買取情報編集で、商品到着（と管理者用メモ）を保存する
    const 到着 = 番号.filter((_, i) => d.状況[i] === "商品到着");
    if (到着.length) {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        for (const n of 到着) {
          const l = new BuyListPage(page);
          await l.open();
          await l.買取番号を入れる(n);
          await l.検索する();
          await l.編集画面を開く(n);
          const e = new BuyEditPage(page);
          if (d.メモ !== undefined) await page.locator('[name="admin_purchase_detail[memo]"]').fill(d.メモ);
          await e.買取状況を変えて保存する("商品到着");
        }
      });
      issue(`買取 ${到着.join("・")} は、買取情報編集で買取状況「商品到着」${d.メモ !== undefined ? `・管理者用メモ「${d.メモ}」` : "（管理者用メモは入れない）"}を保存した`);
    }
    // DB: 画面で指定できない値
    const 担当ID = d.査定担当 ? notes.get("〔管理者会員ID-A0702-共有A〕") : null;
    for (let i = 0; i < 番号.length; i++) {
      const n = 番号[i];
      db.申込日を設定する(n, メール, `${d.申込日}+09`);
      db.電話と郵便番号を設定する(n, メール, d.電話, d.郵便番号);
      const 今 = db.買取の値を読む(n);
      if (d.査定担当) db.査定担当者を設定する(n, メール, 担当ID);
      else if (今?.査定担当 !== null) db.査定担当者を設定する(n, メール, null);
      if (d.状況[i] === "振込完了") db.買取状況を設定する(n, メール, "振込完了");
    }
    issue(`画面で指定できない値は、実行の印つきの買取にだけDBで書いた: 査定申込日 ${d.申込日}（日本時間）・電話番号 ${d.電話}・郵便番号 ${d.郵便番号}（ハイフン付き）${d.査定担当 ? `・査定担当者 ${査定担当A.名前}（管理者ID ${担当ID}）` : "・査定担当者なし"}${d.状況.includes("振込完了") ? `・買取状況「振込完了」（${番号.filter((_, i) => d.状況[i] === "振込完了").join("・")}）` : ""}`);
    // 整えた値を読み、シード表と合うかを確かめる
    for (let i = 0; i < 番号.length; i++) {
      const v = db.買取の値を読む(番号[i]);
      if (!v) throw new Error(`${seedId}: 買取 ${番号[i]} が DB に無い`);
      const 違い = [
        v.姓 !== d.姓 && `姓「${v.姓}」`, v.名 !== d.名 && `名「${v.名}」`, v.都道府県 !== "東京都" && `都道府県「${v.都道府県}」`,
        v.住所1 !== d.住所1 && `住所1「${v.住所1}」`, v.住所2 !== d.住所2 && `住所2「${v.住所2}」`,
        v.状況ID !== db.買取状況のID(d.状況[i]) && `買取状況ID「${v.状況ID}」（${d.状況[i]}のはず）`,
        d.メモ !== undefined && d.状況[i] === "商品到着" && v.メモ !== d.メモ && `管理者用メモ「${v.メモ}」`,
      ].filter(Boolean);
      if (違い.length) throw new Error(`${seedId}: 買取 ${番号[i]} の値がシード表と違う: ${違い.join("・")}`);
    }
  });
}

defineBuyOrderSeed("S-A07-02-BASIC-001", { ラベル: "001", メール: "a0702-customer-001@example.test", 姓: "検証", 名: "一郎", 電話: "090-7001-0001", 郵便番号: "101-0001",
  住所1: "千代田区晴屋1-1-1", 住所2: "A07ビル1F", 状況: ["商品到着"], 申込日: "2026-08-20 09:00:00", メモ: "基本応答確認", 査定担当: "A", 受注の呼び名: ["001"] });
defineBuyOrderSeed("S-A07-02-DETAIL-002", { ラベル: "002", メール: "a0702-customer-002@example.test", 姓: "晴屋", 名: "太郎", 電話: "090-1234-5678", 郵便番号: "101-0001",
  住所1: "千代田区晴屋1-2-3", 住所2: "神田ビル4F", 状況: ["商品到着"], 申込日: "2026-08-20 10:15:30", メモ: "確認済み", 査定担当: "A", 受注の呼び名: ["002"] });
defineBuyOrderSeed("S-A07-02-ORDER-004", { ラベル: "004", メール: "a0702-customer-004@example.test", 姓: "検証", 名: "四郎", 電話: "090-7201-0004", 郵便番号: "101-0004",
  住所1: "千代田区晴屋4-1-1", 住所2: "A07ビル4F", 状況: Array(12).fill("商品到着"), 申込日: "2026-08-20 12:00:00", 受注の呼び名: "ABCDEFGHIJKL".split("").map((c) => `004${c}`) });
defineBuyOrderSeed("S-A07-02-DETAIL-006", { ラベル: "006", メール: "a0702-customer-006@example.test", 姓: "検証", 名: "六郎", 電話: "090-7001-0006", 郵便番号: "101-0006",
  住所1: "千代田区晴屋6-1-1", 住所2: "A07ビル6F", 状況: ["商品到着"], 申込日: "2026-08-20 13:00:00", メモ: "管理者間比較", 査定担当: "A", 受注の呼び名: ["006"] });
defineBuyOrderSeed("S-A07-02-AUTH-007", { ラベル: "007", メール: "a0702-customer-007@example.test", 姓: "検証", 名: "七郎", 電話: "090-7507-0007", 郵便番号: "101-0007",
  住所1: "千代田区晴屋7-1-1", 住所2: "A07ビル7F", 状況: ["振込完了"], 申込日: "2026-08-20 13:30:00", 受注の呼び名: ["007"] });
defineBuyOrderSeed("S-A07-02-AUTH-008", { ラベル: "008", メール: "a0702-customer-008@example.test", 姓: "検証", 名: "八郎", 電話: "090-7508-0008", 郵便番号: "101-0008",
  住所1: "千代田区晴屋8-1-1", 住所2: "A07ビル8F", 状況: ["振込完了"], 申込日: "2026-08-20 13:45:00", 受注の呼び名: ["008"] });
defineBuyOrderSeed("S-A07-02-OPTIONAL-011", { ラベル: "011", メール: "a0702-customer-011@example.test", 姓: "検証", 名: "十一郎", 電話: "090-7301-0011", 郵便番号: "101-0011",
  住所1: "千代田区晴屋11-1-1", 住所2: "A07ビル11F", 状況: ["商品到着"], 申込日: "2026-08-20 14:00:00", 受注の呼び名: ["011"] });
defineBuyOrderSeed("S-A07-02-ORDER-016", { ラベル: "016", メール: "a0702-customer-016@example.test", 姓: "検証", 名: "十六郎", 電話: "090-7016-0016", 郵便番号: "101-0016",
  住所1: "千代田区晴屋16-1-1", 住所2: "A07ビル16F", 状況: ["商品到着", "振込完了"], 申込日: "2026-08-20 15:00:00", 受注の呼び名: ["016A", "016B"] });
