/**
 * M04-22 在庫移動・振替CSV登録の続き（-x）の画面シード。正本: cases/M04-22_seed_data.tsv
 * 仕分け直し（e2e/review/not_runnable_seed_recheck2.tsv）で流せる見込みになったケースのうち、テストコードを書いたもの
 * （振り分けは記録 review/M04-22_progress_2026-11-11_dev.md）。店舗A・店舗B・試験管理者（ADM-EDIT）は seeds/m04-22.ts。
 *
 * 作り方（シード表の投入方法の順。画面で作り、画面で作れない状態だけ E2E の行へ DB で書き足す。依頼者決定 2026-11-10）:
 * - S-M04-22-BASES: 店舗A・店舗Bは seeds/m04-22.ts と同じ（あれば内容を確かめて使う）。在庫区分・移動タイプ・初期ステータス・在庫変動区分は
 *   導入時の初期データとして入っていることを DB の参照で確かめる（無くても足さない。名前の違いは注記に残す）。
 * - S-M04-22-ADM-VIEW: メンバー登録画面で登録する。開発環境に手動テスト用の同じログインIDのメンバーがありうるので、ログインID・名前に実行の印を付ける。
 *   権限は ADM-EDIT と同じ読み替え（既存の「店舗オペレーター」）。所属店舗は「任意の店舗」として店舗ID 1、編集可能店舗は選ばない。
 * - S-M04-22-APPROVERS: 承認通知先の候補「Approver-A」「Approver-B」「Approver-Z」（承認権限あり）と「Viewer-A」（承認権限なし）を
 *   メンバー登録画面で登録する。名前は正本の値のまま（印を付けない）にして、前の実行のものを使い回す（ログインIDで探し、内容を確かめる）。
 *   印を付けて実行ごとに作ると、店舗Aに承認者が積み重なり、承認通知先の選択肢（ケースの期待結果）が変わるため。
 *   所属「所属A」「所属B」は、全員が使う所属のマスターに行を足さず、開発環境の既存の「試験所属A」「試験所属B」で読み替える（並び順の DB 設定もしない）。
 *   承認権限ありの権限は既存の「システム管理者」、なしの権限は「店舗オペレーター」（権限のマスターに行を足さない）。
 *   店舗B・所属Cのメンバー（承認権限なし）は作らない。承認通知先の選択肢は承認権限のあるメンバーだけから作られる（アプリの
 *   MemberRepository::getApprovalAuthorityMembers）ので、どのケースの画面にも出ない。所属Cも作らない（所属のマスターに行を足すため）。
 * - ケースの商品（MOVE-* など）: グッズ商品CSV登録で1行を取り込み、在庫検索一覧（店舗IDで絞る）の行から在庫編集を開いて入庫し、
 *   別の承認者が在庫編集承認一覧で承認する。入庫の登録者・承認者は正本の外の補い（「M04-22在庫登録者」「M04-22在庫承認者」。
 *   ログインID・名前に実行の印。店舗A・店舗Bを編集できるシステム管理者。所属店舗は店舗ID 1 にして、店舗Aの承認通知先の選択肢に出ないようにする）。
 *   商品コードに実行の印を付ける（ケースの文の同じ値も、印を付けた値として読む）。商品名はシード表の値（商品名が商品コードと同じものは印つきの商品コード）。
 *   商品ID・商品規格ID・在庫ID は、画面で作ったあと DB の参照で読んで控える。在庫数も DB の参照で確かめる。
 * - CSV ファイル: シード表の見出し・データ行で作る。商品コードは印つき。ファイル名は拡張子の前に実行の印を付ける
 *   （同名CSV取込履歴は0件のまま。前の実行・ほかの方の取込履歴は消さない。アプリは在庫移動・振替CSVの同名の取込を止めない）。
 * - S-M04-22-MOVE-CODE255-013: 商品コードは「文字Aを255文字連結した値」の末尾を実行の印に置き換えた255文字（印を付けても255文字のまま）。
 *   「同じ商品コードの試験商品があれば消す」は、印つきの商品コードの商品（同じ実行で作ったもの）だけが当たる。あれば消さずに止める。
 * - S-M04-22-MOVE-MAX-016: 店舗A・EC-CUBEの在庫数 999999999 は、画面で作った E2E の商品の在庫へ DB で書き足す（シード表の投入方法のとおり）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { available as dbAvailable } from "../lib/db";
import { rc, RUN_MARK } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import * as D from "../db/m04_22_x";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { openStockApprovalListForStore, searchStock } from "../pages/admin/m04_24_stock_move";
import { registerStockEdit } from "../pages/admin/stock_edit";
import {
  CSVファイル, createMemberWithDepartment, expectApprovalAllowed, expectApprovalDenied, expectMemberWithDepartment, 所属つきメンバー,
} from "../pages/admin/m04_22_move_transfer_csv";
import { M0422の店舗, STORE_A, STORE_B, 承認なしの権限, 店舗を用意する } from "./m04-22";

type 区分 = D.在庫区分;
const 承認ありの権限 = "システム管理者";
const 所属A = "試験所属A";
const 所属B = "試験所属B";

// ---------------------------------------------------------------- 共通のマスター（S-M04-22-BASES）

defineSeed("S-M04-22-BASES", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 店舗を用意する(browser, notes, issue);
  if (!dbAvailable) { issue("DB確認の接続先が無いので、初期データ（初期ステータス・在庫変動区分）が入っていることを確かめていない"); return; }
  const statuses = D.移動振替のステータス();
  const first = statuses.find((s) => s.番号 === "1");
  if (!first) throw new Error("在庫移動・振替のステータスに、新規の登録で付く番号1のステータスが無い（導入時の初期データが無い）");
  if (first.名前 !== "新規作成") issue(`初期ステータス（新規の登録で付く番号1）の名前は「${first.名前}」（シード表は「新規作成」）。マスターは書き換えない`);
  const kinds = D.移動の在庫変動区分();
  if (!kinds.includes("移動出庫")) issue(`在庫変動区分に「移動出庫」の名前は無い。在庫移動の出庫で付くのは「在庫移動(減算)」（ある区分: ${kinds.join("、")}）。マスターは書き換えない`);
  issue("在庫区分（EC-CUBE・スマレジ）と移動タイプ（在庫移動・在庫振替）はアプリの決まった値（マスターの表は無い）。モーダルの選択肢で確かめる");
});

// ---------------------------------------------------------------- 参照管理者（S-M04-22-ADM-VIEW）

const VIEW_LOGIN = rc("m0422_view").toLowerCase();
export const M0422_VIEW: Account = { loginId: VIEW_LOGIN, password: "Passw0rd!View422" };
export const M0422_VIEW_NAME = rc("M04-22参照管理者");

defineSeed("S-M04-22-ADM-VIEW", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 店舗を用意する(browser, notes, issue);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await expectApprovalDenied(page, 承認なしの権限);
    const id = await ensureMemberByStoreIds(page, {
      名前: M0422_VIEW_NAME, ログインID: VIEW_LOGIN, メールアドレス: `${VIEW_LOGIN}@example.test`, パスワード: M0422_VIEW.password,
      権限: 承認なしの権限, 所属店舗ID: "1", デフォルト検索表示店舗ID: "1", 編集可能店舗ID: [],
    });
    notes.set("〔管理者ID-M0422-共有B〕", id);
  });
  issue(`試験用の権限は、既存の権限「${承認なしの権限}」（承認権限だけが外れている）で読み替えた。所属店舗（任意の店舗）は店舗ID 1。編集可能店舗は選んでいない`);
  await withAdminSession(browser, M0422_VIEW, async (page) => {
    const res = await page.goto(adminUrl("/product/stock/move_transfer"));
    if (res?.status() !== 200) throw new Error(`${M0422_VIEW_NAME} で在庫移動・振替検索一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  });
});

// ---------------------------------------------------------------- 承認通知先の候補（S-M04-22-APPROVERS）

type 候補 = { 呼び名: string; 名前: string; ログインID: string; パスワード: string; 所属: string; 承認: boolean };
const 候補たち: 候補[] = [
  { 呼び名: "〔管理者ID-M0422-共有C〕", 名前: "Approver-A", ログインID: "m0422-apr-a", パスワード: "Passw0rd!M0422AprA", 所属: 所属A, 承認: true },
  { 呼び名: "〔管理者ID-M0422-共有D〕", 名前: "Approver-B", ログインID: "m0422-apr-b", パスワード: "Passw0rd!M0422AprB", 所属: 所属B, 承認: true },
  { 呼び名: "〔管理者ID-M0422-共有E〕", 名前: "Approver-Z", ログインID: "m0422-apr-z", パスワード: "Passw0rd!M0422AprZ", 所属: 所属A, 承認: true },
  { 呼び名: "〔管理者ID-M0422-共有F〕", 名前: "Viewer-A", ログインID: "m0422-viewer-a", パスワード: "Passw0rd!M0422ViewA", 所属: 所属A, 承認: false },
];

defineSeed("S-M04-22-APPROVERS", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const s = await 店舗を用意する(browser, notes, issue);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await expectApprovalAllowed(page, 承認ありの権限);
    await expectApprovalDenied(page, 承認なしの権限);
    for (const k of 候補たち) {
      const v: 所属つきメンバー = {
        名前: k.名前, ログインID: k.ログインID, パスワード: k.パスワード, メールアドレス: `${k.ログインID}@example.test`,
        権限: k.承認 ? 承認ありの権限 : 承認なしの権限, 所属店舗ID: s.A, 所属: k.所属, 編集可能店舗ID: [],
      };
      let id = D.ログインIDの管理者ID(k.ログインID);
      if (id) {
        await expectMemberWithDepartment(page, id, v);
        issue(`${k.名前}（ログインID ${k.ログインID}）は前の実行で登録したものを、内容を確かめて使った`);
      } else {
        id = await createMemberWithDepartment(page, v);
      }
      notes.set(k.呼び名, id);
    }
  });
  issue(`所属A・所属Bは、所属のマスターに行を足さず、開発環境の既存の「${所属A}」「${所属B}」で読み替えた。並び順の DB 設定はしていない。` +
    `承認権限ありの権限は「${承認ありの権限}」、なしの権限は「${承認なしの権限}」（権限のマスターに行を足さない）`);
  issue("店舗B・所属Cのメンバー（承認権限なし）と所属Cは作っていない（承認通知先の選択肢は承認権限のあるメンバーだけから作られ、どの画面にも出ない。所属Cは所属のマスターに行を足すことになる）");
  if (dbAvailable) {
    const others = D.店舗の承認者(s.A).filter((m) => !候補たち.some((k) => k.ログインID === m.ログインID));
    if (others.length) issue(`店舗A（店舗ID ${s.A}）には、ほかにも承認権限のあるメンバーが所属している（${others.map((m) => `${m.名前}・所属 ${m.所属}`).join("、")}）。シード表の「店舗Aに属して承認権限を持つ管理者は3名だけ」は満たせていない`);
  }
});

// ---------------------------------------------------------------- 入庫の登録者・承認者（正本の外の補い）

type 人 = { 名前: string; account: Account };
const 人の = (名前: string, login: string, password: string): 人 => ({ 名前: rc(名前), account: { loginId: rc(login).toLowerCase(), password } });
const 在庫登録者 = 人の("M04-22在庫登録者", "m0422_stock_op", "Passw0rd!M0422op");
const 在庫承認者 = 人の("M04-22在庫承認者", "m0422_stock_apr", "Passw0rd!M0422apr");
let 入庫の人あり = false;

async function 入庫の人を用意する(browser: Browser): Promise<void> {
  if (入庫の人あり) return;
  const { A, B } = M0422の店舗;
  if (!A || !B) throw new Error("店舗A・店舗Bの店舗IDを控えていない（S-M04-22-BASES を先に作る）");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const p of [在庫登録者, 在庫承認者]) {
      await ensureMemberByStoreIds(page, {
        名前: p.名前, ログインID: p.account.loginId, メールアドレス: `${p.account.loginId}@example.test`, パスワード: p.account.password,
        権限: 承認ありの権限, 所属店舗ID: "1", デフォルト検索表示店舗ID: "1", 編集可能店舗ID: [A, B],
      });
    }
  });
  入庫の人あり = true;
}

// ---------------------------------------------------------------- ケースの商品・在庫

type 店 = "A" | "B";
type 在庫の定め = { 店: 店; 区分: 区分; 数: number; 呼び名?: string; DBで?: true };
type 商品の定め = {
  /** 正本の商品コード（実際は印つき） */
  コード: string; 名前: string; 基準価格: number; 販売価格: number; 買取価格: number;
  在庫: 在庫の定め[]; 商品IDの呼び名?: string; 商品規格IDの呼び名?: string;
};

/** 正本の商品コードの、実際の商品コード（印つき）。013 は255文字のまま末尾を印に置き換える */
export function 実際のコード(正本: string): string {
  if (正本 === "A255") return rc("A".repeat(255 - RUN_MARK.length - 1));
  return rc(正本);
}
const 店の = (k: 店): string => {
  const id = M0422の店舗[k];
  if (!id) throw new Error(`店舗${k}の店舗IDを控えていない`);
  return id;
};
const 店名の = (k: 店): string => (k === "A" ? STORE_A.店名 : STORE_B.店名);

async function 入庫する(browser: Browser, seedId: string, code: string, 在: 在庫の定め): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 店舗ID = 店の(在.店);
  const what = `${seedId}: ${code} の店舗${在.店}・${在.区分} への入庫 ${在.数}`;
  await withAdminSession(browser, 在庫登録者.account, async (page) => {
    const list = await searchStock(page, code, 店舗ID);
    await list.openEdit(list.row(code, 店名の(在.店), 在.区分));
    await registerStockEdit(page, {
      changeType: "入庫/その他", reason: `${seedId}試験用`, quantity: String(在.数), purchasePrice: "10", approverName: 在庫承認者.名前,
    }, what, issue);
  });
  await withAdminSession(browser, 在庫承認者.account, async (page) => {
    const l = await openStockApprovalListForStore(page, 店舗ID);
    const rows = (await l.rowValues()).filter((r) => r.status === "未承認" && r.registrant === 在庫登録者.名前
      && r.changeType.endsWith("入庫/その他") && r.quantity.replace(/,/g, "") === String(在.数));
    if (rows.length === 0) throw new Error(`${what}: 在庫編集承認一覧に、${在庫登録者.名前} の未承認の行が無い`);
    if (rows.length > 1) issue(`在庫編集承認一覧に、${在庫登録者.名前} の増減数 ${在.数} の未承認の行が ${rows.length} 件あり、一覧の先頭を承認した`);
    await l.approve([rows[0].id], `${what} の承認`, issue);
  });
}

/** 商品を1件ずつグッズ商品CSV登録で作り、在庫を入れ、番号を控える */
async function 商品を作る(browser: Browser, seedId: string, notes: import("../lib/notes").Notes, defs: 商品の定め[]): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 入庫の人を用意する(browser);
  for (const d of defs) {
    const code = 実際のコード(d.コード);
    if (D.商品規格の件数(code) > 0) {
      throw new Error(`${seedId}: 商品コード ${code.length > 40 ? `${code.slice(0, 12)}…（${code.length}文字）` : code} の商品が既にある（同じ実行の印で作ったもの）。消さずに止める`);
    }
    const name = d.名前 === d.コード ? code : d.名前;
    await withAdminSession(browser, 在庫登録者.account, async (page) => {
      await registerGoodsCsv(page, {
        what: `${seedId}: グッズ商品CSV登録（${d.コード}）`, fileName: `${seedId.toLowerCase()}-goods-${Date.now()}.csv`,
        categoryId: await readGoodsRootCategoryId(page), onWarning: issue,
        common: { "原価単価": "10", "地域別販売制限": "0", "スマレジ連携フラグ": "0", "スマレジ商品コード": "", "部門ID": "" },
        lines: [{ code, nameJp: name, nameEn: name, values: { "基準価格": String(d.基準価格), "販売価格": String(d.販売価格), "買取価格": String(d.買取価格) } }],
      });
    });
    const no = D.商品の番号(code);
    if (d.商品IDの呼び名) notes.set(d.商品IDの呼び名, no.商品ID);
    if (d.商品規格IDの呼び名) notes.set(d.商品規格IDの呼び名, no.商品規格ID);
    for (const 在 of d.在庫) {
      const where = `${d.コード} の店舗${在.店}・${在.区分}`;
      const before = D.在庫(code, 店の(在.店), 在.区分);
      if (!before) throw new Error(`${seedId}: ${where} の在庫の行が、商品の登録で作られていない`);
      if (before.在庫数 !== 0) throw new Error(`${seedId}: ${where} の在庫数が、作られたときの0ではない（${before.在庫数}）`);
      if (在.DBで) {
        D.在庫数を書き足す(`${seedId}: ${where} の在庫数 ${在.数}`, before.在庫ID, 在.数);
      } else if (在.数 > 0) {
        await 入庫する(browser, seedId, code, 在);
      }
      const after = D.在庫(code, 店の(在.店), 在.区分);
      if (after?.在庫数 !== 在.数) throw new Error(`${seedId}: ${where} の在庫数が ${after?.在庫数}（求めるのは ${在.数}）`);
      if (在.呼び名) notes.set(在.呼び名, after.在庫ID);
    }
  }
  issue("商品ID・商品規格ID・在庫ID と在庫数は、画面で作ったあと DB の参照で読んで確かめ、控えた（在庫編集画面の表示の代わり）");
}

const 価格 = { 基準価格: 1000, 販売価格: 1000, 買取価格: 100 };
/** 店舗A・EC-CUBE 100 と店舗B・EC-CUBE 0 の商品（呼び名は 〔…-M0422-<n>〕 の A・B） */
const 標準 = (n: string, コード: string, 名前: string): 商品の定め => ({
  コード, 名前, ...価格, 商品IDの呼び名: `〔商品ID-M0422-${n}〕`, 商品規格IDの呼び名: `〔商品規格ID-M0422-${n}〕`,
  在庫: [{ 店: "A", 区分: "EC-CUBE", 数: 100, 呼び名: `〔在庫ID-M0422-${n}A〕` }, { 店: "B", 区分: "EC-CUBE", 数: 0, 呼び名: `〔在庫ID-M0422-${n}B〕` }],
});
/** 044 以降の書き方の呼び名（〔在庫ID-M0422-<コード>-店舗A・EC-CUBE〕・〔商品ID-M0422-<コード>〕） */
const 後半 = (コード: string, 名前: string, 在庫: { 店: 店; 区分: 区分; 数: number; 控える: boolean }[]): 商品の定め => {
  const key = コード.replace(/^M0422-/, "");
  return {
    コード, 名前, ...価格, 商品IDの呼び名: `〔商品ID-M0422-${key}〕`, 商品規格IDの呼び名: `〔商品規格ID-M0422-${key}〕`,
    在庫: 在庫.map((z) => ({ 店: z.店, 区分: z.区分, 数: z.数, ...(z.控える ? { 呼び名: `〔在庫ID-M0422-${key}-店舗${z.店}・${z.区分}〕` } : {}) })),
  };
};

function defineProductSeed(seedId: string, defs: 商品の定め[]): void {
  defineSeed(seedId, { needs: ["S-M04-22-BASES"] }, async ({ browser, notes }) => { await 商品を作る(browser, seedId, notes, defs); });
}

defineProductSeed("S-M04-22-MOVE-003", [標準("003", "MOVE-001-003", "移動商品1")]);
defineProductSeed("S-M04-22-MOVE-004", [標準("004", "MOVE-001-004", "移動商品1")]);
defineProductSeed("S-M04-22-MOVE-005", [標準("005", "MOVE-001-005", "移動商品1")]);
defineProductSeed("S-M04-22-MOVE-006", [標準("006", "MOVE-001-006", "移動商品1")]);
defineProductSeed("S-M04-22-MOVE-007", [標準("007", "MOVE-001-007", "移動商品1")]);
defineProductSeed("S-M04-22-MOVE-008", [{
  コード: "MOVE-001-008", 名前: "移動商品1", ...価格, 商品IDの呼び名: "〔商品ID-M0422-008〕", 商品規格IDの呼び名: "〔商品規格ID-M0422-008〕",
  在庫: [{ 店: "A", 区分: "EC-CUBE", 数: 100, 呼び名: "〔在庫ID-M0422-008A〕" }, { 店: "A", 区分: "スマレジ", 数: 50, 呼び名: "〔在庫ID-M0422-008B〕" }],
}]);
defineProductSeed("S-M04-22-MOVE-009", [{
  コード: "MOVE-001-009", 名前: "MOVE-001-009", ...価格, 商品IDの呼び名: "〔商品ID-M0422-009〕", 商品規格IDの呼び名: "〔商品規格ID-M0422-009〕",
  在庫: [{ 店: "A", 区分: "EC-CUBE", 数: 100, 呼び名: "〔在庫ID-M0422-009〕" }],
}]);
defineProductSeed("S-M04-22-MOVE-010", [標準("010", "MOVE-001-010", "MOVE-001-010")]);
defineProductSeed("S-M04-22-MOVE-CODE255-013", [{
  コード: "A255", 名前: "最大長商品", 基準価格: 3000, 販売価格: 3000, 買取価格: 100, 商品IDの呼び名: "〔商品ID-M0422-013〕", 商品規格IDの呼び名: "〔商品規格ID-M0422-013〕",
  在庫: [{ 店: "A", 区分: "EC-CUBE", 数: 10, 呼び名: "〔在庫ID-M0422-013A〕" }, { 店: "B", 区分: "EC-CUBE", 数: 0, 呼び名: "〔在庫ID-M0422-013B〕" }],
}]);
defineProductSeed("S-M04-22-MOVE-015", [標準("015", "MOVE-001-015", "MOVE-001-015")]);
defineProductSeed("S-M04-22-MOVE-MAX-016", [{
  コード: "MOVE-MAX-001-016", 名前: "移動上限商品", 基準価格: 1, 販売価格: 1, 買取価格: 1, 商品IDの呼び名: "〔商品ID-M0422-016〕", 商品規格IDの呼び名: "〔商品規格ID-M0422-016〕",
  在庫: [{ 店: "A", 区分: "EC-CUBE", 数: 999999999, 呼び名: "〔在庫ID-M0422-016A〕", DBで: true }, { 店: "B", 区分: "EC-CUBE", 数: 0, 呼び名: "〔在庫ID-M0422-016B〕" }],
}]);
defineProductSeed("S-M04-22-MOVE-023", [標準("023", "MOVE-001-023", "MOVE-001-023")]);
defineProductSeed("S-M04-22-HDRMOVE-037", [標準("037", "M0422-037-A", "M0422-037-A")]);
defineProductSeed("S-M04-22-XFERPERM-040", [
  { コード: "M0422-040-A", 名前: "M0422-040-A", ...価格, 商品IDの呼び名: "〔商品ID-M0422-040A〕", 商品規格IDの呼び名: "〔商品規格ID-M0422-040A〕", 在庫: [{ 店: "A", 区分: "EC-CUBE", 数: 100, 呼び名: "〔在庫ID-M0422-040A〕" }] },
  { コード: "M0422-040-B", 名前: "M0422-040-B", ...価格, 商品IDの呼び名: "〔商品ID-M0422-040B〕", 商品規格IDの呼び名: "〔商品規格ID-M0422-040B〕", 在庫: [{ 店: "A", 区分: "EC-CUBE", 数: 0, 呼び名: "〔在庫ID-M0422-040B〕" }] },
]);
defineProductSeed("S-M04-22-HDRXFER-041", [
  { コード: "M0422-041-A", 名前: "M0422-041-A", ...価格, 商品IDの呼び名: "〔商品ID-M0422-041A〕", 商品規格IDの呼び名: "〔商品規格ID-M0422-041A〕", 在庫: [{ 店: "A", 区分: "EC-CUBE", 数: 100, 呼び名: "〔在庫ID-M0422-041A〕" }] },
  { コード: "M0422-041-B", 名前: "M0422-041-B", ...価格, 商品IDの呼び名: "〔商品ID-M0422-041B〕", 商品規格IDの呼び名: "〔商品規格ID-M0422-041B〕", 在庫: [{ 店: "A", 区分: "EC-CUBE", 数: 0, 呼び名: "〔在庫ID-M0422-041B〕" }] },
]);
const EC = "EC-CUBE" as const, SM = "スマレジ" as const;
defineProductSeed("S-M04-22-MOVE-044", [
  後半("M0422-044-A", "M0422-044-移動商品A", [{ 店: "A", 区分: EC, 数: 100, 控える: true }, { 店: "B", 区分: EC, 数: 0, 控える: false }]),
  後半("M0422-044-B", "M0422-044-移動商品B", [{ 店: "A", 区分: EC, 数: 100, 控える: true }, { 店: "B", 区分: EC, 数: 0, 控える: false }]),
]);
defineProductSeed("S-M04-22-MOVE-045", [後半("M0422-045-A", "M0422-045-移動商品", [{ 店: "A", 区分: EC, 数: 100, 控える: true }, { 店: "B", 区分: EC, 数: 0, 控える: false }])]);
defineProductSeed("S-M04-22-MOVE-046", [後半("M0422-046-A", "M0422-046-移動商品", [
  { 店: "A", 区分: EC, 数: 100, 控える: true }, { 店: "A", 区分: SM, 数: 50, 控える: true }, { 店: "B", 区分: EC, 数: 0, 控える: false }])]);
defineProductSeed("S-M04-22-CBMVSM-049", [後半("M0422-CB049-A", "M0422-CB049-移動商品", [
  { 店: "A", 区分: EC, 数: 100, 控える: true }, { 店: "A", 区分: SM, 数: 50, 控える: true }, { 店: "B", 区分: EC, 数: 0, 控える: false }])]);
defineProductSeed("S-M04-22-CBMVSM2-050", [後半("M0422-CB050-A", "M0422-CB050-移動商品", [
  { 店: "A", 区分: EC, 数: 100, 控える: true }, { 店: "A", 区分: SM, 数: 50, 控える: true }, { 店: "B", 区分: SM, 数: 0, 控える: false }])]);
defineProductSeed("S-M04-22-CBXFER1-051", [
  後半("M0422-CB051-A", "M0422-CB051-振替元商品", [{ 店: "A", 区分: EC, 数: 100, 控える: true }]),
  後半("M0422-CB051-B", "M0422-CB051-振替先商品B", [{ 店: "A", 区分: EC, 数: 0, 控える: true }]),
]);
defineProductSeed("S-M04-22-CBXFER2-052", [
  後半("M0422-CB052-A", "M0422-CB052-振替元商品", [{ 店: "A", 区分: EC, 数: 100, 控える: true }]),
  後半("M0422-CB052-B", "M0422-CB052-振替先商品B", [{ 店: "A", 区分: EC, 数: 0, 控える: true }]),
  後半("M0422-CB052-C", "M0422-CB052-振替先商品C", [{ 店: "A", 区分: EC, 数: 0, 控える: true }]),
]);
defineProductSeed("S-M04-22-CBXFER3-053", [
  後半("M0422-CB053-A", "M0422-CB053-振替元商品", [{ 店: "A", 区分: EC, 数: 100, 控える: true }, { 店: "A", 区分: SM, 数: 80, 控える: true }]),
  後半("M0422-CB053-B", "M0422-CB053-振替先商品B", [{ 店: "A", 区分: SM, 数: 0, 控える: true }]),
]);
defineProductSeed("S-M04-22-CBXFER4-054", [
  後半("M0422-CB054-A", "M0422-CB054-振替元商品", [{ 店: "A", 区分: EC, 数: 100, 控える: true }, { 店: "A", 区分: SM, 数: 80, 控える: true }]),
  後半("M0422-CB054-B", "M0422-CB054-振替先商品B", [{ 店: "A", 区分: SM, 数: 0, 控える: true }]),
  後半("M0422-CB054-C", "M0422-CB054-振替先商品C", [{ 店: "A", 区分: SM, 数: 0, 控える: true }]),
]);

// ---------------------------------------------------------------- CSV だけのシード（ファイルは spec が作る）

const ファイルだけ = async ({ seed }: { seed: { シードID: string } }) => {
  reportSeedIssue(seed.シードID, "ファイル名の拡張子の前に実行の印を付けた（同名CSV取込履歴は0件のまま。前の実行・ほかの方の取込履歴は消さない）");
};
defineSeed("S-M04-22-MOVE-020", ファイルだけ);
defineSeed("S-M04-22-TRANSFER-ERROR-029", ファイルだけ);
defineSeed("S-M04-22-TRANSFER-ERROR-030", ファイルだけ);

// ---------------------------------------------------------------- CSV ファイル（シード表の見出し・データ行。商品コード・ファイル名は印つき）

const ファイル名 = (正本: string): string => {
  const m = /^(.*)(\.[a-z]+)$/.exec(正本);
  if (!m) throw new Error(`ファイル名「${正本}」に拡張子が無い`);
  return `${rc(m[1])}${m[2]}`;
};
const 行 = (cells: string[]): string => cells.join(",");
const csv = (正本の名前: string, 見出し: string, 行たち: string[][]): CSVファイル => ({
  名前: ファイル名(正本の名前), 中身: [見出し, ...行たち.map(行)].join("\n") + "\n",
});
const 移動 = (正本の名前: string, rows: [string, number][]): CSVファイル => csv(正本の名前, "商品コード,移動点数", rows.map(([c, n]) => [実際のコード(c), String(n)]));
const 振替 = (正本の名前: string, rows: [string, string, number][]): CSVファイル =>
  csv(正本の名前, "振替元商品コード,振替先商品コード,移動点数", rows.map(([a, b, n]) => [実際のコード(a), 実際のコード(b), String(n)]));

/** ケースの番号ごとの CSV ファイル（呼んだときに作る。印は実行の中で同じ） */
export const CSVの: Record<string, () => CSVファイル> = {
  "003": () => 移動("move-normal-003.csv", [["MOVE-001-003", 10]]),
  "004": () => 移動("move-normal-004.csv", [["MOVE-001-004", 10]]),
  "005": () => 移動("move-normal-005.csv", [["MOVE-001-005", 10]]),
  "006": () => 移動("move-normal-006.csv", [["MOVE-001-006", 10]]),
  "007": () => 移動("move-normal-007.csv", [["MOVE-001-007", 10]]),
  "008": () => 移動("move-internal-008.csv", [["MOVE-001-008", 5]]),
  "009": () => 移動("move-normal-009.csv", [["MOVE-001-009", 10]]),
  "010": () => 移動("move-insufficient-010.csv", [["MOVE-001-010", 101]]),
  "013": () => 移動("move-code255-013.csv", [["A255", 1]]),
  "015": () => 移動("move-qty0-015.csv", [["MOVE-001-015", 0]]),
  "016": () => 移動("move-qty-max-016.csv", [["MOVE-MAX-001-016", 999999999]]),
  "020": () => csv("move-wrong-header-020.csv", "商品コード,振替点数", []),
  "023": () => 移動("move-normal-023.csv", [["MOVE-001-023", 10]]),
  "029": () => ({ 名前: ファイル名("transfer.txt"), 中身: "x" }),
  "030": () => csv("transfer-wrong-header-030.csv", "商品コード,数量", [["TRANSFER-001", "1"]]),
  "037": () => csv("M0422-037-HDR.csv", "商品コード,振替点数", [[実際のコード("M0422-037-A"), "10"]]),
  "040": () => 振替("M0422-040-XFER.csv", [["M0422-040-A", "M0422-040-B", 10]]),
  "041": () => csv("M0422-041-HDR.csv", "振替元商品コード,振替先商品コード,数量", [[実際のコード("M0422-041-A"), 実際のコード("M0422-041-B"), "5"]]),
  "044": () => 移動("move-two-m0422-044.csv", [["M0422-044-A", 10], ["M0422-044-B", 20]]),
  "045": () => 移動("move-all-m0422-045.csv", [["M0422-045-A", 100]]),
  "046": () => 移動("move-smaregi-m0422-046.csv", [["M0422-046-A", 5]]),
  "049": () => 移動("m0422-cb049-move.csv", [["M0422-CB049-A", 5]]),
  "050": () => 移動("m0422-cb050-move.csv", [["M0422-CB050-A", 5]]),
  "051": () => 振替("m0422-cb051-xfer.csv", [["M0422-CB051-A", "M0422-CB051-B", 10]]),
  "052": () => 振替("m0422-cb052-xfer.csv", [["M0422-CB052-A", "M0422-CB052-B", 10], ["M0422-CB052-A", "M0422-CB052-C", 20]]),
  "053": () => 振替("m0422-cb053-xfer.csv", [["M0422-CB053-A", "M0422-CB053-B", 10]]),
  "054": () => 振替("m0422-cb054-xfer.csv", [["M0422-CB054-A", "M0422-CB054-B", 10], ["M0422-CB054-A", "M0422-CB054-C", 20]]),
};
