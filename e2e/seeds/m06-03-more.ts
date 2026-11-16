/**
 * M06-03 買取詳細の残りのシード（2026-11-12 追加）。正本: cases/M06-03_seed_data.tsv
 *
 * 作り方の方針は seeds/m06-03.ts と同じ（依頼者の方針 2026-11-10・11-11）:
 * - 買取はフロントの店頭買取査定申込で作った実行の印つきの買取。MTGバイヤー（買取端末のアプリ）での査定・買取成立は、
 *   印つきの買取にだけ、ステータス・実在庫・個別入力商品・合計金額をDBで足して置き換える（lib/db_write.ts の窓口）。
 * - 東京店舗は買取店舗A、大阪店舗は買取店舗B（M06-01 の試験店舗）に読み替える。
 * - 店舗の EC-CUBE 在庫（店舗在庫）の数量・総原価: 印つきの商品の、買取店舗A の在庫の行は、まだ無い（商品を登録した店舗にだけ行がある）。
 *   そこで、準備の買取（印つき）を画面で「入庫済みにする」で入庫して行を作り、その行の在庫数・総原価をDBでシード表の値にし、
 *   準備の入庫で作られた在庫履歴をDBで消す（どれも印つきの商品の行だけ）。
 * - 権限なし担当者: 権限のマスターに足さず、権限管理の表で、ステータス変更画面・経理払い出し済/入庫済みを拒否し、買取一覧・買取詳細を許可している
 *   既存の権限を探して使う（無ければ止める）。
 * - 共有の設定（追加システム設定の固定価格商品部門ID）を書き換えるシード（RF-CONFIG。QG-SUMMARY は seeds/m06-04.ts）は、書き換える前に
 *   全項目を読んで控え、ケースの終わりに画面で戻して開き直して確かめる（lib/shared_restore.ts）。夜の1本流しのときだけ流れる。
 * 作らないシード: S-M06-03-DELETED（削除済みのメンバー・商品に紐づく買取。メンバー・商品は物理削除で、買取から参照されていると消せない）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { Notes } from "../lib/notes";
import { reportSeedIssue } from "../lib/seeds";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { defineSeed } from "./current_seed";
import { withCreateOnceLock } from "../lib/create_once_lock";
import { ensureMemberByStoreIdsFix as ensureMemberByStoreIds } from "../pages/admin/m04_24_reuse_k";
import { expectSaved } from "../pages/admin/common";
import { DepartmentPage } from "../pages/admin/m03_18_department";
import { customerIdByEmail } from "../pages/admin/m06_04_member";
import { 権限URL, 権限の許可を読む, 拒否している, 許可している } from "../pages/admin/m06_04_status";
import { OtcDetail } from "../pages/admin/m06_03_detail";
import { OtcDetailPage, OtcListPage } from "../pages/admin/m06_otc_list";
import { 商品のカテゴリを選ぶ } from "../pages/admin/f01_02_layout";
import { registerFrontMember } from "../pages/front/member_entry";
import { applyAsMember, PurchaseHistoryPage } from "../pages/front/m06_otc_buy";
import { 会員の買取の査定合計金額を設定する } from "../db/m06_04_prep";
import {
  商品規格がある, 査定番号の買取の件数, 店舗在庫の履歴を消す, 店舗在庫を設定する, 店舗在庫を調べる, 部門のID, 規格と商品のID,
} from "../db/m06_03";
import {
  M0603_STOCK, NEEDS_ONLY_STOCK, L_A, L_B, カードのカテゴリ, 共通商品, 商品を作る, 定義, 注文, 注文を作る, 追加商品, 作った,
} from "./m06-03";
import { QG_IT, QG_MEMBER_PASSWORD, QG_STORE } from "./m06-04";
import { 追加システム設定を控えて書き換える } from "./add-system-restore";

export const M0603_NONE: Account = { loginId: "m0603_none", password: "Passw0rd!M0603NO" };
export const M0603_DP085: Account = { loginId: "dpm0603-085", password: "Passw0rd-M0603085" };
export const M0603_DP086: Account = { loginId: "dpm0603-086", password: "Passw0rd-M0603086" };
export const QG0603_ACC: Account = { loginId: "qg0603acc", password: "Passw0rd-Qg0603Ac" };
export const M0603_RF: Account = { loginId: "m0603_rf", password: "Passw0rd-M0603RF" };
export const M0603_RFAPP: Account = { loginId: "m0603_rfapp", password: "Passw0rd-M0603AP" };

/** 正本の決め打ちの商品コード・商品名に実行の印を付けた値 */
const A = () => rc(共通商品.A);
const C = () => rc(共通商品.C);
const D = () => rc(共通商品.D);
const X = (k: keyof typeof 追加商品) => rc(追加商品[k]);

// ---------------------------------------------------------------- 管理者

/** 権限管理の表から、IT・経理・買取管理（ステータス変更画面・経理払い出し済/入庫済み）を拒否し、買取一覧・買取詳細を許可している既存の権限を探す */
async function 権限なしの権限(browser: Browser): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const perms = await 権限の許可を読む(page);
    const name = [...perms.entries()].find(([n, p]) => n !== "システム管理者"
      && 拒否している(p, [権限URL.ステータス変更画面, 権限URL.経理払い出し済と入庫済み]) && 許可している(p, [権限URL.買取一覧, 権限URL.買取詳細]))?.[0];
    if (!name) {
      throw new Error("権限管理に、ステータス変更画面・経理払い出し済/入庫済みを拒否し、買取一覧・買取詳細を許可している既存の権限が無い。"
        + `権限のマスターに足す・既存の権限の設定を変えるのは共有の設定の変更なので止めた（判断待ち。いまある権限: ${[...perms.keys()].join("、")}）`);
    }
    return name;
  });
}

defineSeed("S-M06-03-NONPRIV", { needs: ["S-M06-01-SHOPS"] }, async ({ browser, notes, seed }) => {
  const a = notes.get(L_A);
  const 権限 = await 権限なしの権限(browser);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-03 権限なし担当者", ログインID: M0603_NONE.loginId, メールアドレス: `${M0603_NONE.loginId}@example.test`, パスワード: M0603_NONE.password,
    権限, 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a],
  }));
  reportSeedIssue(seed.シードID, `「IT・経理・買取管理の権限なし」は、権限管理で店頭買取のステータス変更画面・経理払い出し済/入庫済みを拒否し、買取一覧・買取詳細を許可している既存の権限「${権限}」に読み替えた（権限の設定は変えない）。東京店舗は買取店舗A`);
});

defineSeed("S-M06-03-DP-MEMBER-085", { needs: ["S-M06-01-SHOPS"] }, async ({ browser, notes, seed }) => {
  const a = notes.get(L_A); const b = notes.get(L_B);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "データパターン複数店舗担当者085", ログインID: M0603_DP085.loginId, メールアドレス: "dpm0603-085@example.test", パスワード: M0603_DP085.password,
    権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a, b],
  }));
  reportSeedIssue(seed.シードID, "東京店舗・大阪店舗は買取店舗A・B に読み替えた。買取管理を使える権限は既存の「システム管理者」");
});

defineSeed("S-M06-03-DP-NOSTORE-086", { needs: ["S-M06-01-SHOPS"] }, async ({ browser, notes, seed }) => {
  const a = notes.get(L_A);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "データパターン店舗なし担当者086", ログインID: M0603_DP086.loginId, メールアドレス: "dpm0603-086@example.test", パスワード: M0603_DP086.password,
    権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [],
  }));
  reportSeedIssue(seed.シードID, "所属店舗の東京店舗は買取店舗A に読み替え、編集可能店舗は1つも選ばずに登録した。買取管理を使える権限は既存の「システム管理者」");
});

defineSeed("S-M06-03-QG-ACC", { needs: ["S-M06-04-QG-STORE"] }, async ({ browser, notes, seed }) => {
  const id = notes.get("〔店舗ID-M0604-QG共有〕");
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "QG0603 経理担当者", ログインID: QG0603_ACC.loginId, メールアドレス: "qg0603acc@example.test", パスワード: QG0603_ACC.password,
    権限: "システム管理者", 所属店舗ID: id, デフォルト検索表示店舗ID: id, 編集可能店舗ID: [id],
  }));
  reportSeedIssue(seed.シードID, "経理チーム・買取管理を使える権限は、既存の「システム管理者」（経理払い出し済を許可している）に読み替えた。所属は先頭の所属");
});

defineSeed("S-M06-03-RF-ADM", { needs: ["S-M06-01-SHOPS"] }, async ({ browser, notes, seed }) => {
  const a = notes.get(L_A);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-03連携担当者", ログインID: M0603_RF.loginId, メールアドレス: "m0603_rf@example.test", パスワード: M0603_RF.password,
    権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a],
  }));
  reportSeedIssue(seed.シードID, "東京店舗は買取店舗A。権限は既存の「システム管理者」（買取管理・在庫検索一覧・在庫履歴検索一覧・買取商品履歴・在庫編集を使える）。デフォルト検索表示店舗は、選べるのが所属店舗だけなので全店でなく買取店舗A にした（ケースは店舗を選んで検索する）");
});

defineSeed("S-M06-03-RF-APPR", { needs: ["S-M06-01-SHOPS"] }, async ({ browser, notes, seed }) => {
  const a = notes.get(L_A);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-03連携承認者", ログインID: M0603_RFAPP.loginId, メールアドレス: "m0603_rfapp@example.test", パスワード: M0603_RFAPP.password,
    権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a],
  }));
  reportSeedIssue(seed.シードID, "東京店舗は買取店舗A。在庫編集の承認ができる権限は既存の「システム管理者」");
});

// ---------------------------------------------------------------- 不存在

defineSeed("S-M06-03-ABSENT", async ({ seed }) => {
  const n = 査定番号の買取の件数("20260999-99");
  if (n !== 0) throw new Error(`査定番号 20260999-99 の買取が ${n} 件ある。ほかの方のデータの可能性があり、共有の環境では消さない決まりなので止めた`);
  if (商品規格がある("999999")) throw new Error("商品規格ID 999999 の商品規格がある。ほかの方のデータの可能性があり、共有の環境では消さない決まりなので止めた");
  reportSeedIssue(seed.シードID, "削除はしない。査定番号 20260999-99 の買取と商品規格ID 999999 がDBに無いことを確かめただけ");
});

// ---------------------------------------------------------------- 店舗在庫（買取店舗A の EC-CUBE 在庫）

let 準備の番号 = 0;

/**
 * 印つきの商品の、買取店舗A の EC-CUBE 在庫を、在庫数・総原価の値にし、在庫履歴を0件にする。店舗在庫の番号を返す。
 * 行が無ければ、準備の買取（印つき・数量1・小計0）を画面で入庫済みにして行を作る。
 */
export async function 店舗Aの在庫を用意する(browser: Browser, notes: Notes, 商品コード: string, 在庫: number, 総原価: number, issue: (m: string) => void): Promise<string> {
  const 店 = notes.get(L_A);
  let s = 店舗在庫を調べる(商品コード, 店);
  if (!s) {
    const 準備 = await 注文を作る(browser, { 姓: `M0603-PREP${++準備の番号}`, 状態: "入庫待ち", 在庫: [{ コード: 商品コード, 数量: 1, 単価: 0 }] });
    await withAdminSession(browser, M0603_STOCK, async (page) => {
      page.setDefaultTimeout(60_000);
      const d = new OtcDetail(page);
      await d.open(準備.受注ID);
      await d.入庫済みにするを押して応答を待つ();
      await expectSaved(page, `準備の買取 ${準備.査定ID} を入庫済みにする（商品 ${商品コード} の買取店舗A の在庫の行を作る）`);
    });
    s = 店舗在庫を調べる(商品コード, 店);
    if (!s) throw new Error(`準備の買取を入庫済みにしても、商品 ${商品コード} の買取店舗A の EC-CUBE 在庫の行ができない`);
    issue(`商品 ${商品コード} の買取店舗A の EC-CUBE 在庫の行は、準備の買取（査定番号 ${準備.査定ID}・印つき・数量1・小計0）を画面で入庫済みにして作った`);
  }
  店舗在庫を設定する(s.ID, 在庫, 総原価);
  const 消した = 店舗在庫の履歴を消す(s.ID);
  issue(`商品 ${商品コード} の買取店舗A の EC-CUBE 在庫を、DBで在庫 ${在庫}・総原価 ${総原価} にし、準備の操作で作られた在庫履歴 ${消した} 件を消した（在庫履歴0件）`);
  return s.ID;
}

// ---------------------------------------------------------------- 個別入力商品の買取

/** 個別入力商品「個別商品A」の部門（正本は部門ID 10。無ければ既存の部門の先頭） */
function 部門10(issue: (m: string) => void): string {
  const d = 部門のID("10");
  if (!d.望んだとおり) issue(`部門ID 10 の部門が無いので、個別商品A の部門は既存の部門の先頭（ID ${d.ID}）にした`);
  return d.ID;
}

const 個別の注記 = "個別入力商品は、MTGバイヤーの「個別入力する」の代わりに、印つきの買取にDBで足した（商品コードなし＝実在庫未登録）。ステータスもDBで設定した";

定義({
  id: "S-M06-03-UNREG-TWO", 注記: [個別の注記, "個別商品B の価格・枚数・基準価格は正本が任意としているので、500円・1枚・1500円にした。UNREG-A-NM の買取金額は1,000円にした"],
  async 作る(browser, issue) {
    return { 作った: await 注文を作る(browser, {
      姓: "M0603-UNREG-TWO", 状態: "未登録在庫あり", 在庫: [{ コード: X("UNREG"), 数量: 2, 単価: 1000 }],
      未登録の個別: [{ 名前: "個別商品A", 数量: 2, 単価: 1000, 販売: 3000, 部門ID: 部門10(issue) }, { 名前: "個別商品B", 数量: 1, 単価: 500 }],
    }) };
  },
});

const 個別商品Cの買取 = (姓: string): 注文 => ({ 姓, 状態: "未登録在庫あり", 未登録の個別: [{ 名前: "個別商品C", 数量: 2, 単価: 1000 }] });

定義({ id: "S-M06-03-UNREG-ONE", 注記: [個別の注記], async 作る(browser) { return { 作った: await 注文を作る(browser, 個別商品Cの買取("M0603-UNREG-ONE")) }; } });
定義({ id: "S-M06-03-UNREG-ONE-042", 注記: [個別の注記], async 作る(browser) { return { 作った: await 注文を作る(browser, 個別商品Cの買取("M0603-042")) }; } });
定義({ id: "S-M06-03-UNREG-ONE-046", 注記: [個別の注記], async 作る(browser) { return { 作った: await 注文を作る(browser, 個別商品Cの買取("M0603-046")) }; } });

定義({
  id: "S-M06-03-UNREG-TWO-041", 注記: [個別の注記, "個別商品B の価格・枚数・基準価格は正本が任意としているので、500円・1枚・1500円にした"],
  async 作る(browser, issue) {
    return { 作った: await 注文を作る(browser, {
      姓: "M0603-041", 状態: "未登録在庫あり",
      未登録の個別: [{ 名前: "個別商品A", 数量: 2, 単価: 1000, 販売: 3000, 部門ID: 部門10(issue) }, { 名前: "個別商品B", 数量: 1, 単価: 500 }],
    }) };
  },
});

定義({
  id: "S-M06-03-INDIV-MIX", 注記: [個別の注記, "個別商品D・E の価格・枚数は正本が任意としているので、1,000円・1枚にした。個別商品E は、買取詳細の実在庫情報登録（商品検索モーダルで SRCH-BLK-NM を選んで決定）で登録した"],
  async 作る(browser) {
    const 作った = await 注文を作る(browser, {
      姓: "M0603-INDIV-MIX", 状態: "未登録在庫あり", 未登録の個別: [{ 名前: "個別商品D", 数量: 1, 単価: 1000 }, { 名前: "個別商品E", 数量: 1, 単価: 1000 }],
    });
    await withAdminSession(browser, M0603_STOCK, async (page) => {
      page.setDefaultTimeout(60_000);
      const d = new OtcDetail(page);
      await d.open(作った.受注ID);
      await d.実在庫登録を押す("個別商品E");
      await d.モーダルで検索する(X("SRCH_NM"));
      const row = await d.モーダルで規格を選ぶ(X("SRCH_NM"));
      await d.決定して送る(row);
      await expectSaved(page, "個別商品E の実在庫情報登録");
    });
    return { 作った };
  },
});

定義({
  id: "S-M06-03-INBOUND-BLOCKED", 注記: [個別の注記, "個別入力した商品の名前・価格・枚数は正本が任意としているので「個別入力した商品」・1,000円・1枚にした。BASE-A-NM の総原価は正本に指定が無いので 10,000円にした"],
  async 作る(browser, issue, notes) {
    await 店舗Aの在庫を用意する(browser, notes, A(), 10, 10000, issue);
    return { 作った: await 注文を作る(browser, {
      姓: "M0603-INBOUND-BLOCKED", 状態: "未登録在庫あり", 在庫: [{ コード: A(), 数量: 2, 単価: 1000 }], 未登録の個別: [{ 名前: "個別入力した商品", 数量: 1, 単価: 1000 }],
    }) };
  },
});

// ---------------------------------------------------------------- 実在庫の増減・原価の按分

const 原価の注記 = "BlackLotus・Badlands・Mox Pearl は、印つきのサプライ品（商品名に印）で作った原価試験用の商品。実在庫（数量・小計）と買取合計金額は、MTGバイヤーの査定の代わりにDBで印つきの買取に設定した";

function 原価の買取(id: string, 姓: string, 在庫: () => { コード: string; 数量: number; 単価: number }[], 合計金額: number, 注記: string[] = []): void {
  定義({ id, 注記: [原価の注記, ...注記], async 作る(browser) { return { 作った: await 注文を作る(browser, { 姓, 状態: "入庫待ち", 在庫: 在庫(), 合計金額 }) }; } });
}
原価の買取("S-M06-03-COST-DECREASE-030", "M0603-030", () => [{ コード: X("BL_NM"), 数量: 3, 単価: 100000 }], 300000);
原価の買取("S-M06-03-COST-INCREASE-031", "M0603-031", () => [{ コード: X("BL_NM"), 数量: 3, 単価: 100000 }], 300000);
原価の買取("S-M06-03-COST-TRANSFER-032", "M0603-032", () => [{ コード: X("BL_NM"), 数量: 3, 単価: 100000 }], 300000);
原価の買取("S-M06-03-COST-MULTI-033", "M0603-033", () => [{ コード: X("BL_NM"), 数量: 3, 単価: 100000 }, { コード: X("BAD_NM"), 数量: 1, 単価: 80000 }], 380000);
原価の買取("S-M06-03-ZEROSPLIT-089", "M0603-089", () => [
  { コード: X("BL_NM"), 数量: 3, 単価: 100000 }, { コード: X("BAD_NM"), 数量: 1, 単価: 80000 }, { コード: X("MOX_NM"), 数量: 1, 単価: 50000 },
], 430000);
原価の買取("S-M06-03-ODDSPLIT-090", "M0603-090", () => [{ コード: D(), 数量: 1, 単価: 2000 }, { コード: A(), 数量: 2, 単価: 500 }, { コード: C(), 数量: 1, 単価: 5 }], 3005);
原価の買取("S-M06-03-TIESPLIT-091", "M0603-091", () => [{ コード: A(), 数量: 2, 単価: 1000 }, { コード: D(), 数量: 1, 単価: 1000 }, { コード: C(), 数量: 1, 単価: 5 }], 3005,
  ["商品規格ID 6303111・6303141 は画面が振る番号。BASE-A-NM を M0603-ORD-D-NM より先に登録したので、BASE-A-NM の番号が若い"]);
原価の買取("S-M06-03-ODDTRANS-092", "M0603-092", () => [{ コード: A(), 数量: 1, 単価: 3000 }, { コード: D(), 数量: 1, 単価: 1000 }, { コード: X("A_SP"), 数量: 2, 単価: 1001 }], 6002);
原価の買取("S-M06-03-ONEDEC-093", "M0603-093", () => [{ コード: X("BL_NM"), 数量: 3, 単価: 100000 }, { コード: X("MOX_NM"), 数量: 1, 単価: 50000 }], 350000);

定義({
  id: "S-M06-03-BASE-019", async 作る(browser) { return { 作った: await 注文を作る(browser, { 姓: "M0603-019A", 状態: "入庫待ち", 在庫: [{ コード: A(), 数量: 5, 単価: 1000 }] }) }; },
});
定義({
  id: "S-M06-03-UNREG-TWO-019", 注記: [個別の注記, "個別入力商品（1件目・2件目）の名前・価格・枚数は正本が任意としているので「個別商品019-1」「個別商品019-2」・1,000円・1枚にした"],
  async 作る(browser) {
    return { 作った: await 注文を作る(browser, {
      姓: "M0603-019B", 状態: "未登録在庫あり", 在庫: [{ コード: X("UNREG"), 数量: 2, 単価: 1000 }],
      未登録の個別: [{ 名前: "個別商品019-1", 数量: 1, 単価: 1000 }, { 名前: "個別商品019-2", 数量: 1, 単価: 1000 }],
    }) };
  },
});
定義({
  id: "S-M06-03-BASE-040", 注記: ["BASE-A-NM の買取金額は正本に指定が無いので 1,000円にした"],
  async 作る(browser) { return { 作った: await 注文を作る(browser, { 姓: "M0603-040", 状態: "入庫待ち", 在庫: [{ コード: A(), 数量: 5, 単価: 1000 }] }) }; },
});

// ---------------------------------------------------------------- 入庫（専用商品と店舗在庫）

type 専用品 = { コード: string; 名前: string; 状態?: string; 数量: number; 単価: number; 店舗在庫?: { 在庫: number; 総原価: number } };

/** 専用商品（グッズ商品CSV登録の印つきのサプライ品。規格ごとに別の商品）を作り、店舗在庫を用意し、入庫待ちの買取を作る */
function 入庫の買取(id: string, no: string, 品: 専用品[], 注記: string[] = []): void {
  定義({
    id, needs: NEEDS_ONLY_STOCK,
    注記: ["商品は規格ごとに別の印つきのサプライ品（同じ商品名でないもの）で作った。商品ID・規格IDは画面が振る番号", ...注記],
    async 作る(browser, issue, notes) {
      await 商品を作る(browser, 品.map((p) => ({ コード: rc(p.コード), 名前: rc(p.名前), 基準価格: 2000, 買取価格: 1000, 状態: p.状態 ?? "NM" })), issue);
      for (const p of 品) if (p.店舗在庫) await 店舗Aの在庫を用意する(browser, notes, rc(p.コード), p.店舗在庫.在庫, p.店舗在庫.総原価, issue);
      const 作った = await 注文を作る(browser, { 姓: `M0603-${no}`, 状態: "入庫待ち", 在庫: 品.map((p) => ({ コード: rc(p.コード), 数量: p.数量, 単価: p.単価 })) });
      return { 作った, 商品コード: 品.map((p) => rc(p.コード)) };
    },
  });
}
入庫の買取("S-M06-03-BASE-059", "059", [
  { コード: "BASE-A-NM-059", 名前: "M0603-059-商品A", 数量: 5, 単価: 1000, 店舗在庫: { 在庫: 10, 総原価: 10000 } },
  { コード: "BASE-B-NM-059", 名前: "M0603-059-商品B", 数量: 3, 単価: 800, 店舗在庫: { 在庫: 20, 総原価: 40000 } },
  { コード: "BASE-C-SP-059", 名前: "M0603-059-商品C", 状態: "SP", 数量: 1, 単価: 500, 店舗在庫: { 在庫: 0, 総原価: 0 } },
]);
入庫の買取("S-M06-03-BASE-060", "060", [
  { コード: "BASE-A-NM-060", 名前: "M0603-060-商品A", 数量: 5, 単価: 1000, 店舗在庫: { 在庫: 10, 総原価: 10000 } },
  { コード: "BASE-B-NM-060", 名前: "M0603-060-商品B", 数量: 3, 単価: 800, 店舗在庫: { 在庫: 20, 総原価: 40000 } },
  { コード: "BASE-C-SP-060", 名前: "M0603-060-商品C", 状態: "SP", 数量: 1, 単価: 500, 店舗在庫: { 在庫: 0, 総原価: 0 } },
], ["店舗在庫の総原価は正本に指定が無いので、10,000円・40,000円・0円（原価単価 1,000円・2,000円・0円）にした"]);
入庫の買取("S-M06-03-HIST-074", "074", [
  { コード: "M0603-074-A-NM", 名前: "M0603-074-商品", 数量: 5, 単価: 1000, 店舗在庫: { 在庫: 10, 総原価: 10000 } },
], ["店舗在庫の総原価は正本に指定が無いので 10,000円にした"]);

// ---------------------------------------------------------------- 商品検索（080）

定義({
  id: "S-M06-03-SEARCH-080", needs: NEEDS_ONLY_STOCK, 注記: ["商品は印つきのサプライ品で作り、商品登録編集でカテゴリーを最上位の「カード」（無ければ「シングルカード」）だけにした。商品IDは画面が振る番号"],
  async 作る(browser, issue) {
    const code = rc("M0603-080-A-NM");
    await 商品を作る(browser, [{ コード: code, 名前: rc("M0603-080-検索商品"), 基準価格: 2000 }], issue);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const card = await カードのカテゴリ(page);
      await 商品のカテゴリを選ぶ(page, 規格と商品のID(code).商品ID, [card.id], "S-M06-03-SEARCH-080: 商品のカテゴリ", issue);
    });
    return { 作った: await 注文を作る(browser, { 姓: "M0603-080", 状態: "入庫待ち" }), 商品コード: [code] };
  },
});

// ---------------------------------------------------------------- 店舗・編集可能店舗（085・086）

定義({
  id: "S-M06-03-DP-STORE2-085", 注記: ["大阪店舗は買取店舗B に読み替えた"],
  async 作る(browser) { return { 作った: await 注文を作る(browser, { 姓: "M0603-085", 店: "B", 状態: "入庫待ち", 更新前: true, 在庫: [{ コード: A(), 数量: 5, 単価: 1000 }] }) }; },
});
定義({
  id: "S-M06-03-DP-NOSTOCK-086",
  async 作る(browser) { return { 作った: await 注文を作る(browser, { 姓: "M0603-086", 状態: "入庫待ち", 在庫: [{ コード: A(), 数量: 5, 単価: 1000 }] }) }; },
});

// ---------------------------------------------------------------- 会員の買取（082・083）

const qgEmail = (no: "001" | "002") => `${rc(`qg0603-${no}`)}@example.test`;

function QGの買取(seedId: string, no: "001" | "002"): void {
  defineSeed(seedId, { needs: ["S-M06-04-QG-STORE", "S-M06-04-QG-IT"] }, async ({ browser, notes, seed }) => {
    const email = qgEmail(no);
    const 姓 = `QG0603-${no}-会員`;
    const 会員 = { 姓, 名: "試験", セイ: "キュージー", メイ: "シケン" };
    for (const step of ["登録", "申込"] as const) {
      const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
      try {
        await hideDebugToolbar(context);
        const page = await context.newPage();
        page.setDefaultTimeout(60_000);
        if (step === "登録") { await registerFrontMember(page, { ...会員, メール: email, パスワード: QG_MEMBER_PASSWORD }); continue; }
        await applyAsMember(page, QG_STORE.支店URL, { メール: email, パスワード: QG_MEMBER_PASSWORD }, 会員);
        const history = new PurchaseHistoryPage(page);
        await history.openList();
        notes.set(`〔買取番号-M0603-QG${no}〕`, await history.最新の買取番号());
      } finally {
        await context.close();
      }
    }
    const 番号 = notes.get(`〔買取番号-M0603-QG${no}〕`);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const customerId = await customerIdByEmail(page, email);
      if (!customerId) throw new Error(`会員 ${email} が会員一覧に出ない`);
      notes.set(`〔会員ID-M0603-QG${no}〕`, customerId);
    });
    const 開く = async (page: import("@playwright/test").Page) => {
      const list = new OtcListPage(page);
      await list.open();
      await list.日時を空にする();
      await list.買取店舗を選ぶ("");
      await list.査定IDを入れる(番号);
      await list.検索する();
      return list;
    };
    await withAdminSession(browser, QG_IT, async (page) => {
      page.setDefaultTimeout(60_000);
      await (await 開く(page)).詳細を開く(番号);
      await new OtcDetailPage(page).ステータスを変える("経理払い出し待ち");
    });
    会員の買取の査定合計金額を設定する(番号, rc(`qg0603-${no}`), 45678);
    await withAdminSession(browser, QG_IT, async (page) => {
      page.setDefaultTimeout(60_000);
      const rows = await (await 開く(page)).行();
      if (rows.length !== 1 || rows[0].ステータス !== "経理払い出し待ち" || rows[0].買取店舗 !== QG_STORE.店名) {
        throw new Error(`${姓} の買取が、QG店頭買取店舗の「経理払い出し待ち」の1件でない（${JSON.stringify(rows)}）`);
      }
    });
    reportSeedIssue(seed.シードID, `会員の登録は、管理画面に会員の新規登録の画面が無いので、フロントの会員登録（本登録のメール）で作った。メールアドレスの前半に実行の印を付けた（${email}）`);
    reportSeedIssue(seed.シードID, "査定金額合計45678円は画面で指定できないので、DBで印つきの会員の買取の査定合計金額を45678にした。ステータス「経理払い出し待ち」はステータス変更画面（qg0604it）で変え、買取一覧で確かめた");
  });
}
QGの買取("S-M06-03-QG-ORDER-082", "001");
QGの買取("S-M06-03-QG-ORDER-083", "002");

// ---------------------------------------------------------------- 連携（094・095・096）

/** 部門を名前で探し、無ければ部門登録で1度だけ作る（同時に作らないよう鍵を取る）。部門IDを返す */
async function 部門を用意する(browser: Browser, 名: string, コード: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const dept = new DepartmentPage(page);
    const find = async () => {
      await dept.openNew();
      const found = (await dept.allRows()).filter((r) => r.部門名 === 名);
      if (found.length > 1) throw new Error(`部門「${名}」が${found.length}件ある。どれを使うか決められない`);
      return found[0]?.ID;
    };
    const have = await find();
    if (have) return have;
    return withCreateOnceLock(`section-${名}`, async () => (await find()) ?? dept.register({ 部門名: 名, 部門コード: コード, 免税区分: "対象外", MTGBuyer表示フラグ: true }, `部門「${名}」の登録`));
  });
}

defineSeed("S-M06-03-RF-CONFIG", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const id = await 部門を用意する(browser, "RF0603固定価格部門", "9060300");
  notes.set("〔部門ID-M0603-RF共有〕", id);
  // 共有の設定: 書き換える前に画面の全項目を控え、ケースの終わりに画面で戻して開き直して確かめる（seeds/add-system-restore.ts・lib/shared_restore.ts）
  const 無い = await 追加システム設定を控えて書き換える(browser, seed.シードID, { 固定価格商品部門ID: id });
  if (無い.length) throw new Error(`追加システム設定の画面に ${無い.join("・")} の欄が無い`);
  issue(`追加システム設定の固定価格商品部門IDを、部門「RF0603固定価格部門」（ID ${id}）にした。書き換える前に全項目を控え、ケースの終わりに画面で戻して確かめる`);
});

function RFの買取(seedId: string, no: "001" | "002" | "003", 店舗在庫: boolean): void {
  定義({
    id: seedId, needs: [...NEEDS_ONLY_STOCK, "S-M06-03-RF-ADM"],
    注記: [
      "商品は印つきのサプライ品（グッズ商品CSV登録）で作った。正本の「カード指定・商品画像・割引率」の手順は、ケースの確かめに関わらないので行っていない",
      "MTGバイヤー（買取端末のアプリ）での査定・買取成立は、DBで置き換えた: 印つきの買取をステータス「入庫待ち」にし、実在庫（数量5・買取金額1,000円）を足した（実在庫の変更履歴は0件）。東京店舗は買取店舗A",
      ...(店舗在庫 ? ["店舗の EC-CUBE 在庫（在庫10・総原価10,000円）は、在庫編集と承認の代わりに、準備の入庫で作った行をDBで在庫10・総原価10,000にした。そのため、正本の「登録元が在庫編集の在庫履歴1件」は無い（在庫履歴0件。登録元が店頭買取の履歴が0件であることは同じ）"] : []),
    ],
    async 作る(browser, issue, notes) {
      const code = rc(`RF0603-${no}-NM`);
      await 商品を作る(browser, [{ コード: code, 名前: rc(`RF0603-${no}商品`), 基準価格: 2000, 買取価格: 1000 }], issue);
      if (店舗在庫) await 店舗Aの在庫を用意する(browser, notes, code, 10, 10000, issue);
      const 作った: 作った = await 注文を作る(browser, { 姓: `M0603RF-ORDER${no}`, 状態: "入庫待ち", 在庫: [{ コード: code, 数量: 5, 単価: 1000 }] });
      return { 作った, 商品コード: [code] };
    },
  });
}
RFの買取("S-M06-03-RF-ORDER-094", "001", true);
RFの買取("S-M06-03-RF-ORDER-095", "002", true);
RFの買取("S-M06-03-RF-ORDER-096", "003", false);

export const RFの商品コード = (no: "001" | "002" | "003") => rc(`RF0603-${no}-NM`);
