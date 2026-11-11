/**
 * M04-23 在庫分割結合CSV登録の画面シード。正本: cases/M04-23_seed_data.tsv
 *
 * テストデータは「既存データ または 画面から作ったデータ」に読み替える（依頼者の方針 2026-11-10）。読み替えは、シードごとに
 * reportSeedIssue で「シード作成時の問題」としてエビデンスに残す。共通の読み替えは次のとおり。
 * - 店舗: ケースごとの店舗（「在庫分割結合試験店舗甲〇一三」など）は、共有の「試験店舗A（M04-23）」に読み替える
 *   （共有の環境に、実行のたびに店舗を数十件残さないため）。編集不可の店舗（009・010）は「試験店舗B（M04-23）」のまま。
 *   ケースの店舗IDの呼び名（〔店舗ID-M0423-013〕など）には、読み替えた店舗の店舗IDを控える。
 *   RD店舗A・RD店舗B は試験店舗A（M04-23）・試験店舗B（M04-23）に、連携分割店舗001・連携結合店舗002 は試験店舗A（M04-23）に読み替える。
 * - 商品コード: 店舗を共有するので、ケースごと・実行ごとに別の商品にする。410001 などケースをまたいで同じ正本の値は
 *   「正本の値-ケース番号-実行の印」、ケースに固有の値は「正本の値-実行の印」で作る。255文字の商品コード（041・043）は、
 *   文字数を変えないよう、先頭6桁のあとに実行の印を入れ、残りを正本の数字で埋めて255文字にする。
 *   存在しない商品コード（999991 など）は正本の値のまま、商品マスターに無いことを確かめる。
 * - 所属: マスタデータ管理の所属のマスタ（共有のマスタ）に行を足さない。在庫部・承認部・他店舗部・連携在庫部001・RD所属A は、
 *   所属のマスタの既存の名称（画面の並び順の1・2・3番目）に読み替える。アプリは「所属が属する店舗」を持たず、承認通知先の所属の
 *   選択肢は、その店舗の承認権限を持つメンバーの所属から作る（アプリの在庫分割CSV登録の入力の定義）。所属の店舗・並び順をDBで
 *   設定する手順は、この作りでは不要（できない）。
 * - 承認権限なしの権限: 権限管理の表で「承認権限」のチェックが外れている既存の権限を使う（権限のマスターに行を足さない）。
 * - 在庫の入庫: 正本の「在庫変更CSV登録」の代わりに、在庫検索一覧から開く在庫編集で、同じ入庫/その他・試験データ準備・増減数・
 *   仕入単価で登録し、別の承認者が在庫編集承認一覧で承認する（M04-02・M04-21 のシードと同じ部品）。
 * - 受信箱: 開発環境のメールの受け口（E2E_MAIL_URL）を読む。承認通知先のメールアドレスは正本の値のまま（承認通知先のメンバーは作り直さないので、
 *   実行の印を付けない）。受信メールを確かめるケース（016・082）は、操作の前に控えたメールの番号より後に、そのアドレスへ届いたメールだけを数える。
 * - パスワード: 画面の入力規則（半角の英字と数字を含む半角の記号・英数字）に合わない正本のパスワードは、規則に合う代わりの値で登録する。
 * - QE-DETAIL-074（公開側の商品詳細の在庫）: 店舗は読み替えず本店（店舗ID 1）。申請者・承認者は正本の名前・ログインIDで「あれば使い、無ければ作る」
 *   （所属は所属のマスタの既存の先頭の名称・権限はシステム管理者・所属店舗と編集可能店舗は本店）。商品コード・商品名に実行の印を付ける。
 *   公開側の商品詳細に在庫が出るよう、取り込みで作られた規格を公開で登録する（正本の「表示対象」）。QE-ENV（ユニサーチ試験環境への接続）は書き換えない。
 */
import fs from "node:fs";
import { Browser, expect, Page, test } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { chooseByLabel, expectSaved } from "../pages/admin/common";
import { findMemberId } from "../pages/admin/member";
import { ensureTenant, TenantInput } from "../pages/admin/tenant";
import { expectMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureMemberWithDept } from "../pages/admin/m04_21_stock_change_csv";
import { countProductsByCode } from "../pages/admin/m04_13_setup";
import { SplitJoinListPage } from "../pages/admin/m04_13_split_join";
import { approveRows, readSupplyGoodsCategoryId, uploadGoodsLines } from "../pages/admin/m04_17_seed_ops";
import { approvalRows, fillStockEdit, searchApprovals, searchStockByCode, stockInRow, submitStockEdit } from "../pages/admin/m04_02_rc_stock";
import { 印つき商品の在庫数を書き換える } from "../db/m04_23_split_join_csv";
import { authoritiesWithoutApproval, readDepartmentNames, stockChangeCsvZoneLabels, tenantIdExists } from "../pages/admin/m04_23_split_join_csv";
import { StockListPage } from "../pages/admin/stock_edit";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";

// ================================================================ 共有のシード

/** 正本の店名（裁定 E09） */
const 試験店舗A = "試験店舗A（M04-23）";
const 試験店舗B = "試験店舗B（M04-23）";
const STORE_A: TenantInput = { 店名: 試験店舗A, 店名カナ: "シケンテンポエー", 店名英語: "Test Store A", 支店URL: "m0423a", 店名略称3文字: "Q3A", ショップ名略称: 試験店舗A };
const STORE_B: TenantInput = { 店名: 試験店舗B, 店名カナ: "シケンテンポビー", 店名英語: "Test Store B", 支店URL: "m0423b", 店名略称3文字: "Q3B", ショップ名略称: 試験店舗B };

const NAME = "M04-23試験管理者";
const LOGIN_ID = "m0423_admin";
/** 正本のパスワード */
const CANON_PASSWORD = "M0423共通管理者用";
/** 正本のパスワードを画面が拒んだときに使う代わりの値（入力規則: 半角の英字と数字を含む、半角の記号・英数字） */
const SUBSTITUTE_PASSWORD = "M0423Admin!21";
/** アプリのパスワードの入力規則（アプリのパスワードの書式の設定と同じ式）と、12文字以上 */
const passwordOk = (p: string) => /^(?=.*?[a-z])(?=.*?\d)[!-~]+$/i.test(p) && p.length >= 12;

/** 実際にログインに使えるアカウント。シードが決める（正本のパスワードで登録できなければ代わりの値） */
let account: Account | null = null;
export function m0423Admin(): Account {
  if (!account) throw new Error("S-M04-23-AUTH をまだ作っていない");
  return account;
}

/** メンバー登録画面で、パスワードを変えて登録を試みる。画面の結果（成功・拒否の文）を返す */
async function tryRegister(page: Page, storeId: string, password: string): Promise<{ ok: true; id: string } | { ok: false; errors: string }> {
  await page.goto(adminUrl("/setting/system/member"));
  await page.getByRole("link", { name: "新規登録" }).click();
  await page.waitForLoadState("load");
  const f = (name: string) => page.locator(`[name="admin_member[${name}]"]`);
  await f("name").fill(NAME);
  await f("baseInfo").selectOption(storeId);
  await f("department").selectOption({ index: 1 });
  await f("login_id").fill(LOGIN_ID);
  await f("email").fill("m0423_admin@example.test");
  await page.locator('[name="admin_member[plain_password][first]"]').fill(password);
  await page.locator('[name="admin_member[plain_password][second]"]').fill(password);
  await chooseByLabel(f("Authority"), "システム管理者");
  await page.locator('[name="admin_member[editableBaseInfos][]"]').selectOption([storeId]);
  await f("defaultSearchBaseInfo").selectOption(storeId);
  await page.getByLabel("稼働", { exact: true }).check();
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "登録", exact: true }).click()]);
  try {
    await expectSaved(page, `メンバー「${NAME}」の登録`);
  } catch (e) {
    return { ok: false, errors: (e as Error).message.split("\n")[0] };
  }
  const m = /\/member\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`メンバー「${NAME}」を登録したが、メンバー編集画面へ遷移しない（${page.url()}）`);
  return { ok: true, id: m[1] };
}

defineSeed("S-M04-23-AUTH", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  // 今回登録したときは、登録できた値。登録済みを使うとき（流し直し）は、正本の値が入力規則に合えば正本の値、合わなければ代わりの値
  let password = passwordOk(CANON_PASSWORD) ? CANON_PASSWORD : SUBSTITUTE_PASSWORD;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const storeId = await ensureTenant(page, STORE_A, issue);
    issue(`正本の店舗ID 423000001・管理者ID 423000021 は画面で指定できない。店舗は店舗一覧の「${試験店舗A}」（店舗ID ${storeId}）を使った`);
    let id = await findMemberId(page, NAME);
    if (!id) {
      const first = await tryRegister(page, storeId, CANON_PASSWORD);
      if (first.ok) { id = first.id; password = CANON_PASSWORD; }
      else {
        issue(`正本のパスワード「${CANON_PASSWORD}」でのメンバー登録を画面が拒んだ（${first.errors}）。入力規則に合う代わりの値「${SUBSTITUTE_PASSWORD}」で登録した`);
        const second = await tryRegister(page, storeId, SUBSTITUTE_PASSWORD);
        if (!second.ok) throw new Error(`代わりのパスワードでもメンバー登録できない: ${second.errors}`);
        id = second.id;
        password = SUBSTITUTE_PASSWORD;
      }
    }
    await expectMemberByStoreIds(page, id, {
      名前: NAME, ログインID: LOGIN_ID, メールアドレス: "m0423_admin@example.test", パスワード: "", 権限: "システム管理者",
      所属店舗ID: storeId, デフォルト検索表示店舗ID: storeId, 編集可能店舗ID: [storeId],
    });
  });
  // ログインの失敗を重ねない（正本の「ログイン失敗回数0」を崩さない）よう、別の値での試しのログインはしない
  if (password !== CANON_PASSWORD) issue(`ケースのログインは代わりのパスワード「${SUBSTITUTE_PASSWORD}」で行う`);
  account = { loginId: LOGIN_ID, password };
  await withAdminSession(browser, account, async () => undefined);
});

// ---- S-M04-23-MASTER（店舗・所属・承認者） ----

export type M0423Store = { id: string; 店名: string };
export type M0423Master = {
  A: M0423Store; B: M0423Store;
  /** 正本の所属名から、読み替えた既存の所属の名称 */
  在庫部: string; 承認部: string; 他店舗部: string;
  /** 所属のマスタの名称（画面の並び順） */
  所属の並び: string[];
  /** 承認権限なしに使う既存の権限 */
  承認権限なしの権限: string;
};
let master: M0423Master | null = null;
export function m0423Master(): M0423Master {
  if (!master) throw new Error("S-M04-23-MASTER をまだ作っていない");
  return master;
}

export const 承認一郎 = "承認一郎";
export const 承認次郎 = "承認次郎";
export const 一般三郎 = "一般三郎";
export const M0423_APR1: Account = { loginId: "m0423_apr1", password: "Passw0rd!M0423Ap1" };
export const M0423_APR2: Account = { loginId: "m0423_apr2", password: "Passw0rd!M0423Ap2" };
const M0423_GEN3: Account = { loginId: "m0423_gen3", password: "Passw0rd!M0423Gn3" };
/** 承認権限なしの権限として先に探す名前（M04-09 のシードが作る試験用の権限。あればそれを使う） */
const PREFERRED_NO_APPROVAL = "M04-09試験権限（承認なし）";

defineSeed("S-M04-23-MASTER", async ({ browser, seed, notes }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const a = await ensureTenant(page, STORE_A, issue);
    const b = await ensureTenant(page, STORE_B, issue);
    const depts = await readDepartmentNames(page);
    if (depts.length < 3) throw new Error(`所属のマスタの既存の名称が3つ未満（${depts.join("、")}）。在庫部・承認部・他店舗部に読み替えられない（共有のマスタに足すかは判断待ち）`);
    const noApproval = await authoritiesWithoutApproval(page);
    if (noApproval.length === 0) throw new Error("権限管理に「承認権限」のチェックが外れている既存の権限が無い。一般三郎（承認権限なし）を作れない（権限を足すかは判断待ち）");
    const noAuth = noApproval.includes(PREFERRED_NO_APPROVAL) ? PREFERRED_NO_APPROVAL : noApproval[0];
    master = {
      A: { id: a, 店名: 試験店舗A }, B: { id: b, 店名: 試験店舗B },
      在庫部: depts[0], 承認部: depts[1], 他店舗部: depts[2], 所属の並び: depts, 承認権限なしの権限: noAuth,
    };
    issue(`所属のマスタ（共有のマスタ）に行を足さず、既存の所属に読み替えた: 在庫部→「${depts[0]}」・承認部→「${depts[1]}」・他店舗部→「${depts[2]}」（所属のマスタの画面の並び順の1〜3番目）。正本の所属ID 423000011〜423000013・所属が属する店舗・並び順のDBでの設定は行わない（アプリの承認通知先の所属は、その店舗の承認権限を持つメンバーの所属から作られ、所属に店舗の項目は無い）`);
    issue(`一般三郎の「承認権限を付けていない権限グループ」は、権限管理で承認権限のチェックが外れている既存の権限「${noAuth}」にした。承認一郎・承認次郎の「承認権限を付けた権限グループ」はシステム管理者`);
    issue(`承認一郎・承認次郎は、在庫の入庫の承認者・登録者にも使うため、編集可能店舗を試験店舗A（M04-23）・試験店舗B（M04-23）の2店にした（正本は編集可能店舗を書かない）`);
    const members: [string, Account, string, string, string[], string][] = [
      [承認一郎, M0423_APR1, depts[0], "approver1@example.test", [a, b], "システム管理者"],
      [承認次郎, M0423_APR2, depts[1], "approver2@example.test", [a, b], "システム管理者"],
      [一般三郎, M0423_GEN3, depts[0], "m0423_gen3@example.test", [a], noAuth],
    ];
    const ids: string[] = [];
    for (const [名前, acc, 所属, email, editable, 権限] of members) {
      ids.push(await ensureMemberWithDept(page, {
        名前, ログインID: acc.loginId, メールアドレス: email, パスワード: acc.password, 権限,
        所属店舗ID: a, 所属, デフォルト検索表示店舗ID: a, 編集可能店舗ID: editable,
      }));
    }
    // ⑦ 在庫区分1・2はシステムに固定で用意されている。在庫変更CSV登録の在庫区分の選択肢で確かめる
    expect(await stockChangeCsvZoneLabels(page), "在庫変更CSV登録の在庫区分の選択肢").toEqual(["EC-CUBE", "スマレジ"]);
    notes.set("〔店舗ID-M0423-共有A〕", a);
    notes.set("〔店舗ID-M0423-共有B〕", b);
    notes.set("〔メンバーID-M0423-共有A〕", ids[0]);
    notes.set("〔メンバーID-M0423-共有B〕", ids[1]);
    notes.set("〔メンバーID-M0423-共有C〕", ids[2]);
  });
  for (const acc of [M0423_APR1, M0423_APR2]) await withAdminSession(browser, acc, async () => undefined);
});

// ================================================================ ケース専用のシードの作り方

export type Zone = "EC-CUBE" | "スマレジ";
export type Actor = { account: Account; 名前: string };
export const REGISTRANT: Actor = { account: M0423_APR2, 名前: 承認次郎 };
export const APPROVER: Actor = { account: M0423_APR1, 名前: 承認一郎 };

/**
 * 在庫検索一覧（店舗・在庫区分・商品コード）から在庫編集を開き、入庫/その他・増減数・仕入単価・承認通知先で登録し、
 * 承認者が在庫編集承認一覧で承認する。承認のあと、在庫検索一覧で在庫数を確かめる。
 * 承認一覧は、店舗・登録者で絞り、在庫区分と増減数の合う未承認の在庫編集の行を承認する（同じ登録者の別のシードの行が並んでいても、
 * 承認されるのは同じ増減数の入庫の行で、どちらのシードも承認のあとの在庫数で確かめる）。
 */
export async function stockIn(browser: Browser, issue: (m: string) => void, v: {
  店名: string; code: string; zone: Zone; qty: number; unit: number; reason?: string; reg?: Actor; app?: Actor;
}): Promise<void> {
  const reg = v.reg ?? REGISTRANT;
  const app = v.app ?? APPROVER;
  const what = `${v.code}（${v.店名}・${v.zone}）の入庫（${v.qty}・仕入単価${v.unit}）`;
  await withAdminSession(browser, reg.account, async (page) => {
    const list = await searchStockByCode(page, { 商品コード: v.code, 店舗: v.店名, 在庫区分: v.zone });
    const row = list.row(v.code, v.店名, v.zone);
    expect(await stockInRow(row), `${what}: 入庫の前の在庫は0`).toBe(0);
    await list.openEdit(row);
    await fillStockEdit(page, {
      在庫変動区分: "入庫/その他", 在庫変動理由: v.reason ?? "試験データ準備", 在庫増減数: String(v.qty), 仕入単価: String(v.unit), 承認通知先: app.名前,
    });
    await submitStockEdit(page, `${what}の在庫編集`, issue);
  });
  await withAdminSession(browser, app.account, async (page) => {
    await searchApprovals(page, { 店舗: v.店名, 登録者: reg.名前 });
    const rows = (await approvalRows(page)).filter((r) => r.承認状態 === "未承認" && r.承認対象 === "在庫編集"
      && r.店舗在庫区分.includes(v.zone) && r.増減数.replace(/[^\d]/g, "") === String(v.qty));
    if (rows.length > 1) issue(`${what}: 在庫編集承認一覧に、合う未承認の行が ${rows.length} 件あり、まとめて承認した（同じ登録者のほかの入庫の行）`);
    if (rows.length) await approveRows(page, rows.map((r) => r.id), `${what}の承認`, issue);
    const list = await searchStockByCode(page, { 商品コード: v.code, 店舗: v.店名, 在庫区分: v.zone });
    expect(await stockInRow(list.row(v.code, v.店名, v.zone)), `${what}: 承認のあとの在庫`).toBe(v.qty);
  });
}

type Prod = {
  /** 正本の商品コード */
  code: string;
  /** 正本の商品名（無ければ「M0423商品」＋商品コード） */
  name?: string;
  ec?: number; sm?: number;
  /** 画面で指定できない在庫数を、DBで書き換えて設定する（在庫区分と在庫数） */
  db?: [Zone, number];
  /** 買取価格（無ければ10） */
  buy?: string;
};

type CaseSpec = {
  caseNo: string;
  /** 控える店舗IDの呼び名 */
  storeLabel?: string;
  store: "A" | "B";
  products: Prod[];
  /** 商品マスターに無いことを確かめる商品コード（正本の値のまま） */
  unknown?: string[];
  /** ケース専用の承認通知先のメンバー（試験店舗A（M04-23）・在庫部に読み替えた所属・システム管理者） */
  approver?: { 名前: string; email: string; login: string };
  /** 承認通知先が2名のケース（082）の、2人目 */
  approver2?: { 名前: string; email: string; login: string };
  /** ケース専用の管理者（060・061） */
  admin?: { label: string; login: string; canonPassword: string; substitute: string };
  csv: { file: string; kind: "split" | "join"; rows: string[][] };
  /** 入庫の仕入単価（正本の在庫変更CSVの仕入単価。既定0） */
  unit?: number;
  /** 入庫の登録者・承認者・在庫変動理由（既定は承認次郎・承認一郎・試験データ準備） */
  reg?: Actor; app?: Actor; reason?: string;
  /** 読み替えの補足（シード作成時の問題に出す） */
  notes?: string[];
  /** 店舗一覧に無いことを確かめる店舗ID（036・037） */
  noStoreId?: string;
  /** 先に作るシード（既定は S-M04-23-MASTER だけ） */
  needs?: string[];
};

export type M0423CaseData = {
  store: M0423Store;
  /** 正本の商品コード → 作った商品コード（正本の値のままのもの＝存在しない商品コードは、そのまま返す） */
  code: (canonical: string) => string;
  /** 正本の商品名 → 作った商品名 */
  name: (canonical: string) => string;
  /** 正本のファイル名で作ったCSVの置き場 */
  csvPath: string;
  csvFile: string;
  approver?: string;
  approver2?: string;
  /** 承認通知先のメールアドレス（承認通知先が2名のときは2人分） */
  approverMails: string[];
  admin?: Account;
};
const caseData = new Map<string, M0423CaseData>();
export function m0423Case(caseNo: string): M0423CaseData {
  const d = caseData.get(caseNo);
  if (!d) throw new Error(`ケース ${caseNo} のシードをまだ作っていない`);
  return d;
}

const SPLIT_HEAD = ["分割元商品コード", "分割数", "分割先商品コード", "分割先在庫数"];
const JOIN_HEAD = ["結合先商品コード", "結合数", "結合元商品コード", "結合元在庫区分", "結合元在庫数"];

/** 正本の商品コードから、実際に作る商品コード（ファイルの先頭の読み替えの説明を参照） */
function actualCode(caseNo: string, canonical: string): string {
  if (canonical.length === 255) {
    const tail = canonical.slice(6 + RUN_MARK.length);
    return `${canonical.slice(0, 6)}${RUN_MARK}${tail}`;
  }
  if (/^4[12]\d{4}$/.test(canonical)) return rc(`${canonical}-${caseNo}`);
  return rc(canonical);
}

/** 先頭6桁の後に数字を249文字連結した255文字の商品コード（正本 CASE-041・043） */
const longCode = (head: string, digit: string) => `${head}${digit.repeat(249)}`;

function defineCase(seedId: string, spec: CaseSpec): void {
  defineSeed(seedId, { needs: ["S-M04-23-MASTER", ...(spec.needs ?? [])] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const m = m0423Master();
    const store = spec.store === "A" ? m.A : m.B;
    const codes = new Map(spec.products.map((p) => [p.code, actualCode(spec.caseNo, p.code)]));
    const names = new Map(spec.products.map((p) => [p.name ?? `M0423商品${p.code}`, p.name ? rc(p.name) : `M0423商品${codes.get(p.code)}`]));
    const nameOf = (p: Prod) => names.get(p.name ?? `M0423商品${p.code}`)!;
    issue(`店舗は共有の「${store.店名}」（店舗ID ${store.id}）に読み替えた。商品コードは ${[...codes].map(([c, a]) => `${c.length > 20 ? `${c.slice(0, 8)}…（255文字）` : c}→${a.length > 40 ? `${a.slice(0, 16)}…（${a.length}文字）` : a}`).join("・")} で作った`);
    issue("在庫の入庫は、正本の在庫変更CSV登録の代わりに在庫編集（入庫/その他）で登録し、在庫編集承認一覧で承認した");
    for (const n of spec.notes ?? []) issue(n);
    let admin: Account | undefined;

    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      if (spec.noStoreId) expect(await tenantIdExists(page, spec.noStoreId), `店舗一覧に店舗ID ${spec.noStoreId} の店舗は無い`).toBe(false);
      for (const code of spec.unknown ?? []) {
        expect(await countProductsByCode(page, code), `商品コード ${code} の商品は無い`).toBe(0);
      }
      const categoryId = await readSupplyGoodsCategoryId(page);
      await uploadGoodsLines(page, {
        what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}-goods.csv`, categoryId, onIssue: issue,
        lines: spec.products.map((p) => ({ 商品コード: codes.get(p.code)!, 商品名: nameOf(p), 基準価格: "100", 販売価格: "100", 買取価格: p.buy ?? "10" })),
      });
      for (const ap of [spec.approver, spec.approver2]) {
        if (!ap) continue;
        await ensureMemberWithDept(page, {
          名前: ap.名前, ログインID: ap.login, メールアドレス: ap.email, パスワード: "Passw0rd!M0423Nt",
          権限: "システム管理者", 所属店舗ID: m.A.id, 所属: m.在庫部, デフォルト検索表示店舗ID: m.A.id, 編集可能店舗ID: [m.A.id],
        });
        issue(`承認通知先「${ap.名前}」の所属店舗・編集可能店舗は ${m.A.店名}、所属は「${m.在庫部}」（在庫部の読み替え）。メールアドレスは ${ap.email}（受信メールは、ケースが操作の前に控えたメールの番号より後に届いたものだけを数えて、受信メール0件に代える）`);
      }
      if (spec.admin) {
        const password = passwordOk(spec.admin.canonPassword) ? spec.admin.canonPassword : spec.admin.substitute;
        if (password !== spec.admin.canonPassword) issue(`正本のパスワード「${spec.admin.canonPassword}」は画面の入力規則に合わないので、代わりの値「${password}」で登録した`);
        const id = await ensureMemberWithDept(page, {
          名前: `M04-23試験管理者${spec.caseNo}`, ログインID: spec.admin.login, メールアドレス: `${spec.admin.login.replace(/_/g, "-")}@example.test`, パスワード: password,
          権限: "システム管理者", 所属店舗ID: m.A.id, 所属: m.在庫部, デフォルト検索表示店舗ID: m.A.id, 編集可能店舗ID: [m.A.id],
        });
        notes.set(spec.admin.label, id);
        admin = { loginId: spec.admin.login, password };
      }
    });
    for (const p of spec.products) {
      const code = codes.get(p.code)!;
      if (p.ec) await stockIn(browser, issue, { 店名: store.店名, code, zone: "EC-CUBE", qty: p.ec, unit: spec.unit ?? 0, reason: spec.reason, reg: spec.reg, app: spec.app });
      if (p.sm) await stockIn(browser, issue, { 店名: store.店名, code, zone: "スマレジ", qty: p.sm, unit: spec.unit ?? 0, reason: spec.reason, reg: spec.reg, app: spec.app });
    }
    for (const p of spec.products.filter((x) => x.db)) {
      const [zone, qty] = p.db!;
      const code = codes.get(p.code)!;
      const n = 印つき商品の在庫数を書き換える(code, store.id, zone === "EC-CUBE" ? 1 : 2, qty, RUN_MARK, `${seedId}: ${code} の${zone}在庫数を ${qty} にする（画面で指定できない値）`);
      if (n !== 1) throw new Error(`${code} の${zone}在庫の書き換えが ${n} 行`);
      issue(`DBで在庫数を${qty}に設定した（${code}・${store.店名}・${zone}。正本の「画面で指定できないためDBへ直接設定する」。実行の印つきの商品の在庫の行だけを書き換えた）`);
      await withAdminSession(browser, (spec.reg ?? REGISTRANT).account, async (page) => {
        const list = await searchStockByCode(page, { 商品コード: code, 店舗: store.店名, 在庫区分: zone });
        expect(await stockInRow(list.row(code, store.店名, zone)), `${code} の ${store.店名}・${zone} の在庫は ${qty}`).toBe(qty);
      });
    }
    await withAdminSession(browser, (spec.reg ?? REGISTRANT).account, async (page) => {
      // 入庫しない商品の在庫が0であること
      for (const p of spec.products.filter((x) => !x.ec && !(x.db && x.db[0] === "EC-CUBE"))) {
        const code = codes.get(p.code)!;
        const list = await searchStockByCode(page, { 商品コード: code, 店舗: store.店名, 在庫区分: "EC-CUBE" });
        expect(await stockInRow(list.row(code, store.店名, "EC-CUBE")), `${code} の ${store.店名}・EC-CUBE の在庫は0`).toBe(0);
      }
      // 新しく作った商品コードなので、在庫分割結合は0件
      const list = new SplitJoinListPage(page);
      await list.open();
      const first = codes.get(spec.products[0].code)!;
      await list.search(first);
      expect((await list.rows()).length, `在庫分割結合検索/一覧で ${first} の在庫分割結合は0件`).toBe(0);
    });
    // 正本のファイル名で、UTF-8 のCSVを作る（1行目は項目名）
    const head = spec.csv.kind === "split" ? SPLIT_HEAD : JOIN_HEAD;
    const body = spec.csv.rows.map((r) => r.map((v) => codes.get(v) ?? v).join(","));
    const csvPath = test.info().outputPath(spec.csv.file);
    fs.writeFileSync(csvPath, [head.join(","), ...body].join("\n") + "\n", "utf8");
    if (spec.storeLabel) notes.set(spec.storeLabel, store.id);
    caseData.set(spec.caseNo, {
      store, csvPath, csvFile: spec.csv.file, approver: spec.approver?.名前, approver2: spec.approver2?.名前,
      approverMails: [spec.approver?.email, spec.approver2?.email].filter((x): x is string => !!x),
      code: (c) => codes.get(c) ?? c,
      name: (n) => names.get(n) ?? n,
      admin,
    });
    if (admin) await withAdminSession(browser, admin, async () => undefined);
  });
}

const split = (file: string, ...rows: string[][]) => ({ file, kind: "split" as const, rows });
const join = (file: string, ...rows: string[][]) => ({ file, kind: "join" as const, rows });
const r = (s: string) => s.split(",");
const apr1 = (caseNo: string) => ({ 名前: `承認一郎-${caseNo}`, email: `approver1-${caseNo}@example.test`, login: `m0423_apr1_${caseNo}` });
const dpm = (caseNo: string) => ({ 名前: `承認通知先M0423-${caseNo}`, email: `dpm0423-${caseNo}@example.test`, login: `m0423_dpm_${caseNo}` });
const sp = (): Prod[] => [{ code: "410001", ec: 100 }, { code: "410002" }];
const dpmAB = (caseNo: string, x: "a" | "b", 呼び名: "甲" | "乙") => ({ 名前: `承認通知先${呼び名}M0423-${caseNo}`, email: `dpm0423-${caseNo}-${x}@example.test`, login: `m0423_dpm_${caseNo}${x}` });
const jp = (): Prod[] => [{ code: "420001" }, { code: "420002", sm: 100 }];

// ---- 編集不可の店舗（試験店舗B（M04-23）） ----
defineCase("S-M04-23-CASE-009", { caseNo: "009", storeLabel: "〔店舗ID-M0423-009〕", store: "B", products: sp(), csv: split("split_ok-009.csv", r("410001,10,410002,10")) });
defineCase("S-M04-23-CASE-010", { caseNo: "010", storeLabel: "〔店舗ID-M0423-010〕", store: "B", products: jp(), csv: join("join_ok-010.csv", r("420001,10,420002,2,10")) });

// ---- 正常な分割・結合 ----
for (const n of ["013", "014", "015"]) {
  defineCase(`S-M04-23-CASE-${n}`, { caseNo: n, storeLabel: `〔店舗ID-M0423-${n}〕`, store: "A", products: sp(), approver: apr1(n), csv: split(`split_ok-${n}.csv`, r("410001,10,410002,10")) });
}
for (const n of ["017", "018", "019"]) {
  defineCase(`S-M04-23-CASE-${n}`, { caseNo: n, storeLabel: `〔店舗ID-M0423-${n}〕`, store: "A", products: jp(), csv: join(`join_ok-${n}.csv`, r("420001,10,420002,2,10")) });
}

// ---- 存在しない商品・在庫不足 ----
defineCase("S-M04-23-CASE-025", { caseNo: "025", storeLabel: "〔店舗ID-M0423-025〕", store: "A", products: [{ code: "410002" }], unknown: ["999991"], csv: split("split_unknown_source-025.csv", r("999991,10,410002,10")) });
defineCase("S-M04-23-CASE-026", { caseNo: "026", storeLabel: "〔店舗ID-M0423-026〕", store: "A", products: [{ code: "410001", ec: 100 }], unknown: ["999992"], csv: split("split_unknown_destination-026.csv", r("410001,10,999992,10")) });
defineCase("S-M04-23-CASE-028", { caseNo: "028", storeLabel: "〔店舗ID-M0423-028〕", store: "A", products: [{ code: "410005", ec: 9 }, { code: "410006" }], csv: split("split_insufficient-028.csv", r("410005,10,410006,10")) });
defineCase("S-M04-23-CASE-029", { caseNo: "029", storeLabel: "〔店舗ID-M0423-029〕", store: "A", products: [{ code: "420002", sm: 100 }], unknown: ["999993"], csv: join("join_unknown_destination-029.csv", r("999993,10,420002,2,10")) });
defineCase("S-M04-23-CASE-030", { caseNo: "030", storeLabel: "〔店舗ID-M0423-030〕", store: "A", products: [{ code: "420001" }], unknown: ["999994"], csv: join("join_unknown_source-030.csv", r("420001,10,999994,2,10")) });
defineCase("S-M04-23-CASE-033", { caseNo: "033", storeLabel: "〔店舗ID-M0423-033〕", store: "A", products: [{ code: "420001" }, { code: "420005", sm: 9 }], csv: join("join_insufficient-033.csv", r("420001,10,420005,2,10")) });

// ---- 開発者ツールで値を書き換える ----
defineCase("S-M04-23-CASE-036", { noStoreId: "999999", caseNo: "036", storeLabel: "〔店舗ID-M0423-036〕", store: "A", products: sp(), csv: split("split_ok-036.csv", r("410001,10,410002,10")) });
defineCase("S-M04-23-CASE-037", { noStoreId: "999999", caseNo: "037", storeLabel: "〔店舗ID-M0423-037〕", store: "A", products: jp(), csv: join("join_ok-037.csv", r("420001,10,420002,2,10")) });
defineCase("S-M04-23-CASE-016", { caseNo: "016", storeLabel: "〔店舗ID-M0423-016〕", store: "A", products: sp(), approver: apr1("016"), csv: split("split_ok-016.csv", r("410001,10,410002,10")) });
defineCase("S-M04-23-CASE-038", { caseNo: "038", storeLabel: "〔店舗ID-M0423-038〕", store: "A", products: sp(), csv: split("split_ok-038.csv", r("410001,10,410002,10")) });

// ---- 255文字の商品コード・数量の下限 ----
const L041S = longCode("423041", "1");
const L041D = longCode("423041", "2");
const L043D = longCode("423043", "2");
const L043S = longCode("423043", "4");
defineCase("S-M04-23-CASE-041", {
  caseNo: "041", storeLabel: "〔店舗ID-M0423-041〕", store: "A", approver: apr1("041"),
  products: [{ code: L041S, name: "M0423長コード商品423041-1", ec: 100 }, { code: L041D, name: "M0423長コード商品423041-2" }],
  csv: split("split_code_255-041.csv", [L041S, "1", L041D, "1"]),
});
defineCase("S-M04-23-CASE-043", {
  caseNo: "043", storeLabel: "〔店舗ID-M0423-043〕", store: "A",
  products: [{ code: L043D, name: "M0423長コード商品423043-2" }, { code: L043S, name: "M0423長コード商品423043-4", sm: 100 }],
  csv: join("join_code_255-043.csv", [L043D, "1", L043S, "2", "1"]),
});
defineCase("S-M04-23-CASE-045", { caseNo: "045", storeLabel: "〔店舗ID-M0423-045〕", store: "A", products: sp(), approver: apr1("045"), csv: split("split_quantity_min-045.csv", r("410001,0,410002,0")) });
defineCase("S-M04-23-CASE-046", {
  caseNo: "046", storeLabel: "〔店舗ID-M0423-046〕", store: "A", approver: apr1("046"),
  products: [{ code: "410010", db: ["EC-CUBE", 999999999] }, { code: "410011" }],
  csv: split("split_quantity_max-046.csv", r("410010,999999999,410011,999999999")),
});
defineCase("S-M04-23-CASE-051", {
  caseNo: "051", storeLabel: "〔店舗ID-M0423-051〕", store: "A",
  products: [{ code: "420010" }, { code: "420011", db: ["スマレジ", 999999999] }],
  csv: join("join_quantity_max-051.csv", r("420010,999999999,420011,2,999999999")),
});
defineCase("S-M04-23-CASE-050", { caseNo: "050", storeLabel: "〔店舗ID-M0423-050〕", store: "A", products: jp(), csv: join("join_quantity_min-050.csv", r("420001,1,420002,2,1")) });

// ---- ログアウトしたセッションでの送信 ----
defineCase("S-M04-23-CASE-060", {
  caseNo: "060", storeLabel: "〔店舗ID-M0423-060〕", store: "A", products: sp(),
  admin: { label: "〔管理者ID-M0423-060〕", login: "m0423_admin-060", canonPassword: "分割試験専用六〇", substitute: "M0423Split060!" },
  csv: split("split_ok-060.csv", r("410001,10,410002,10")),
});
defineCase("S-M04-23-CASE-061", {
  caseNo: "061", storeLabel: "〔店舗ID-M0423-061〕", store: "A", products: jp(),
  admin: { label: "〔管理者ID-M0423-061〕", login: "m0423_admin-061", canonPassword: "結合試験専用六一", substitute: "M0423Join061!" },
  csv: join("join_ok-061.csv", r("420001,10,420002,2,10")),
});

// ---- 結合元在庫区分 EC-CUBE（GF-069） ----
defineCase("S-M04-23-GF-069", {
  caseNo: "069", storeLabel: "〔店舗ID-M0423-069〕", store: "A", products: [{ code: "M0423-069-A" }, { code: "M0423-069-B", ec: 100 }],
  csv: join("M0423-069-join-src1.csv", r("M0423-069-A,10,M0423-069-B,1,10")),
});

// ---- 複数行・同数・在庫区分（DPS・CB） ----
defineCase("S-M04-23-DPS-075", {
  caseNo: "075", storeLabel: "〔店舗ID-M0423-075〕", store: "A", approver: dpm("075"),
  products: [{ code: "M0423-075-A", ec: 100 }, { code: "M0423-075-B" }, { code: "M0423-075-C" }],
  csv: split("M0423-075-split-2dst.csv", r("M0423-075-A,10,M0423-075-B,10"), r("M0423-075-A,10,M0423-075-C,10")),
});
for (const n of ["076", "077"]) {
  defineCase(`S-M04-23-DPS-${n}`, {
    caseNo: n, storeLabel: `〔店舗ID-M0423-${n}〕`, store: "A",
    products: [{ code: `M0423-${n}-A` }, { code: `M0423-${n}-B`, sm: 100 }, { code: `M0423-${n}-C`, sm: 50 }],
    csv: join(`M0423-${n}-join-2src.csv`, r(`M0423-${n}-A,10,M0423-${n}-B,2,10`), r(`M0423-${n}-A,10,M0423-${n}-C,2,20`)),
  });
}
defineCase("S-M04-23-DPS-082", {
  caseNo: "082", storeLabel: "〔店舗ID-M0423-082〕", store: "A", approver: dpmAB("082", "a", "甲"), approver2: dpmAB("082", "b", "乙"),
  products: [{ code: "M0423-082-A", ec: 100 }, { code: "M0423-082-B" }], csv: split("M0423-082-split-ok.csv", r("M0423-082-A,10,M0423-082-B,10")),
});
defineCase("S-M04-23-DPS-078", {
  caseNo: "078", storeLabel: "〔店舗ID-M0423-078〕", store: "A", approver: dpm("078"),
  products: [{ code: "M0423-078-A", ec: 10 }, { code: "M0423-078-B" }], csv: split("M0423-078-split-eq.csv", r("M0423-078-A,10,M0423-078-B,10")),
});
defineCase("S-M04-23-DPS-079", {
  caseNo: "079", storeLabel: "〔店舗ID-M0423-079〕", store: "A",
  products: [{ code: "M0423-079-A" }, { code: "M0423-079-B", sm: 10 }], csv: join("M0423-079-join-eq.csv", r("M0423-079-A,10,M0423-079-B,2,10")),
});
defineCase("S-M04-23-DPS-080", {
  caseNo: "080", storeLabel: "〔店舗ID-M0423-080〕", store: "A",
  products: [{ code: "M0423-080-A" }, { code: "M0423-080-B", ec: 100 }], csv: join("M0423-080-join-src1.csv", r("M0423-080-A,10,M0423-080-B,1,10")),
});
defineCase("S-M04-23-DPS-081", {
  caseNo: "081", storeLabel: "〔店舗ID-M0423-081〕", store: "A", approver: dpm("081"),
  products: [{ code: "M0423-081-A", sm: 100 }, { code: "M0423-081-B" }], csv: split("M0423-081-split-smaregi.csv", r("M0423-081-A,10,M0423-081-B,10")),
});
defineCase("S-M04-23-CBJEC-085", {
  caseNo: "085", store: "A", products: [{ code: "M0423-CB085-A" }, { code: "M0423-CB085-B", ec: 100, sm: 50 }],
  csv: join("m0423-cb085-join.csv", r("M0423-CB085-A,10,M0423-CB085-B,1,10")),
});
defineCase("S-M04-23-CBJSM-086", {
  caseNo: "086", store: "A", products: [{ code: "M0423-CB086-A" }, { code: "M0423-CB086-B", sm: 100, ec: 50 }],
  csv: join("m0423-cb086-join.csv", r("M0423-CB086-A,10,M0423-CB086-B,2,10")),
});

// ================================================================ 連携（L-*）

export const M0423L_ADMIN: Account = { loginId: "m0423-ladmin", password: "M0423L-Admin1" };
export const L_ADMIN_NAME = "M04-23連携管理者";

defineSeed("S-M04-23-L-ADM", { needs: ["S-M04-23-MASTER"] }, async ({ browser, seed }) => {
  const m = m0423Master();
  reportSeedIssue(seed.シードID, `各ケース専用店舗（連携分割店舗001・連携結合店舗002）は ${m.A.店名} に読み替えたので、編集可能店舗は ${m.A.店名}。名前・メールアドレス・所属・権限（システム管理者）は正本に無いのでE2Eで決めた`);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberWithDept(page, {
    名前: L_ADMIN_NAME, ログインID: M0423L_ADMIN.loginId, メールアドレス: "m0423-ladmin@example.test", パスワード: M0423L_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: m.A.id, 所属: m.在庫部, デフォルト検索表示店舗ID: m.A.id, 編集可能店舗ID: [m.A.id],
  }));
  await withAdminSession(browser, M0423L_ADMIN, async () => undefined);
});

defineSeed("S-M04-23-L-MASTER", async ({ browser, seed }) => {
  reportSeedIssue(seed.シードID, "正本の「DB投入で在庫区分1と2を有効にする」は行わない。在庫区分1（EC-CUBE）・2（スマレジ）はシステムに固定で用意されている（S-M04-23-MASTER の⑦と同じ）ので、在庫変更CSV登録の在庫区分の選択肢で確かめた");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    expect(await stockChangeCsvZoneLabels(page), "在庫変更CSV登録の在庫区分の選択肢").toEqual(["EC-CUBE", "スマレジ"]);
  });
});

defineCase("S-M04-23-L-CASE-063", {
  caseNo: "063", store: "A",
  approver: { 名前: "承認連携001", email: "m0423-l001-approver@example.test", login: "m0423_l001_apr" },
  products: [{ code: "810001", name: "分割元連携カードA", ec: 100 }, { code: "810002", name: "分割先連携カードB" }],
  csv: split("split-ok-L001.csv", r("810001,10,810002,10")),
  notes: [
    "連携分割店舗001 は試験店舗A（M04-23）、連携在庫部001 は在庫部の読み替えの所属に読み替えた（所属のマスタに行を足さない。所属の店舗のDBでの設定は行わない）",
    "承認連携001 のメールアドレス「承認連携001@example.test」は、全角を含むので m0423-l001-approver@example.test にした（ケースはメールを確かめない）",
    "商品名は、ほかの実行の行と見分けるため、正本の商品名の末尾に実行の印を付けた",
  ],
});
defineCase("S-M04-23-L-CASE-064", {
  caseNo: "064", store: "A",
  products: [{ code: "820001", name: "結合先連携カードC" }, { code: "820002", name: "結合元連携カードD", sm: 100 }],
  csv: join("join-ok-L002.csv", r("820001,10,820002,2,10")),
  notes: ["連携結合店舗002 は試験店舗A（M04-23）に読み替えた", "商品名は、ほかの実行の行と見分けるため、正本の商品名の末尾に実行の印を付けた"],
});

// ================================================================ 他機能への反映（RD-*）

export const RD_OP: Actor = { account: { loginId: "m0423rd-op", password: "Passw0rd-M0423RDop" }, 名前: "M04-23 RD作業者" };
export const RD_APR: Actor = { account: { loginId: "m0423rd-apr", password: "Passw0rd-M0423RDapr" }, 名前: "M04-23 RD承認者" };

defineSeed("S-M04-23-RD-STORES", { needs: ["S-M04-23-MASTER"] }, async ({ seed }) => {
  const m = m0423Master();
  reportSeedIssue(seed.シードID, `M04-23 RD店舗A・M04-23 RD店舗B は ${m.A.店名}（店舗ID ${m.A.id}）・${m.B.店名}（店舗ID ${m.B.id}）に読み替えた（店舗を新たに作らない）。M04-23 RD所属A は所属のマスタの既存の「${m.在庫部}」に読み替えた（所属のマスタに行を足さない。所属の店舗のDBでの設定は行わない）`);
});

async function ensureRdMember(browser: Browser, seedId: string, who: Actor, email: string, 権限: string): Promise<void> {
  const m = m0423Master();
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberWithDept(page, {
    名前: who.名前, ログインID: who.account.loginId, メールアドレス: email, パスワード: who.account.password, 権限,
    所属店舗ID: m.A.id, 所属: m.在庫部, デフォルト検索表示店舗ID: m.A.id, 編集可能店舗ID: [m.A.id, m.B.id],
  }));
  await withAdminSession(browser, who.account, async () => undefined);
  reportSeedIssue(seedId, `権限グループは「${権限}」（${権限 === "システム管理者" ? "承認権限あり" : "権限管理で承認権限のチェックが外れている既存の権限"}）`);
}

defineSeed("S-M04-23-RD-OP", { needs: ["S-M04-23-RD-STORES"] }, async ({ browser, seed }) => {
  await ensureRdMember(browser, seed.シードID, RD_OP, "m0423rd-op@example.test", m0423Master().承認権限なしの権限);
});
defineSeed("S-M04-23-RD-APR", { needs: ["S-M04-23-RD-STORES"] }, async ({ browser, seed }) => {
  await ensureRdMember(browser, seed.シードID, RD_APR, "m0423rd-apr@example.test", "システム管理者");
});

for (const [n, caseNo] of [["001", "083"], ["002", "084"]] as const) {
  defineSeedRd(`S-M04-23-RD-STOCK-${caseNo}`, n, caseNo);
}
function defineSeedRd(seedId: string, n: string, caseNo: string): void {
  defineCase(seedId, {
    caseNo, store: "A", unit: 100, reg: RD_OP, app: RD_APR, reason: "M04-23 RD結合テスト", needs: ["S-M04-23-RD-OP", "S-M04-23-RD-APR"],
    products: [{ code: `M0423RD-${n}-S`, name: `M04-23 RD分割元${n}`, ec: 10, buy: "100" }, { code: `M0423RD-${n}-D`, name: `M04-23 RD分割先${n}`, buy: "100" }],
    csv: split(`rd-split-${n}.csv`, r(`M0423RD-${n}-S,4,M0423RD-${n}-D,4`)),
    notes: ["商品コード・商品名は、ほかの実行の行と見分けるため、正本の値の末尾に実行の印を付けた"],
  });
}

// ================================================================ 公開側の商品詳細の在庫（QE-*）

export type M0423QE074 = {
  本店名: string; 所属: string; 申請者: Actor; 承認者: Actor;
  分割元: { 商品ID: string; 商品コード: string; 商品名: string }; 分割先コード: string; csvPath: string;
};
let qe074: M0423QE074 | null = null;
export function m0423QE074(): M0423QE074 {
  if (!qe074) throw new Error("S-M04-23-QE-DETAIL-074 をまだ作っていない");
  return qe074;
}

defineSeed("S-M04-23-QE-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "検索サービス（ユニサーチ）の接続の設定は書き換えない（共有の設定）。公開側のブラウザはケースの新しいブラウザ（日本語・PC・ログアウト）で代える");
});

defineSeed("S-M04-23-QE-DETAIL-074", async ({ browser, seed, notes }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const src = { 商品コード: rc("QE0423-001-CODE"), 商品名: rc("QE0423-001-NAME") };
  const dst = { 商品コード: rc("QE0423-001-DST-CODE"), 商品名: rc("QE0423-001-DST-NAME") };
  const password = "Passw0rd-QE0423001";
  const ap: Actor = { account: { loginId: "qe0423-001-ap", password }, 名前: "QE0423-001申請者" };
  const ar: Actor = { account: { loginId: "qe0423-001-ar", password }, 名前: "QE0423-001承認者" };
  let 本店名 = ""; let 所属 = ""; let 商品ID = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    本店名 = await new StockListPage(page).shopNameById("1");
    const depts = await readDepartmentNames(page);
    if (depts.length === 0) throw new Error("所属のマスタに既存の名称が無い（所属を足すかは判断待ち）");
    所属 = depts[0];
    for (const [who, mail] of [[ap, "qe0423-001-ap@example.test"], [ar, "qe0423-001-ar@example.test"]] as const) {
      await ensureMemberWithDept(page, {
        名前: who.名前, ログインID: who.account.loginId, メールアドレス: mail, パスワード: who.account.password, 権限: "システム管理者",
        所属店舗ID: "1", 所属, デフォルト検索表示店舗ID: "1", 編集可能店舗ID: ["1"],
      });
    }
    const categoryId = await readSupplyGoodsCategoryId(page);
    await uploadGoodsLines(page, {
      what: `${seed.シードID} のグッズ商品CSV登録`, fileName: `qe0423-001-goods-${RUN_MARK}.csv`, categoryId, onIssue: issue,
      lines: [src, dst].map((p) => ({ 商品コード: p.商品コード, 商品名: p.商品名, 基準価格: "100", 販売価格: "100", 買取価格: "1" })),
    });
    for (const p of [src, dst]) {
      const id = await openProductEditByCode(page, p.商品コード);
      if (p === src) 商品ID = id;
      const rows = await classRowsFromProductEdit(page, id);
      if (rows.length !== 1) throw new Error(`${p.商品コード} の取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      await savePublishedClass(page, { productId: id, classId: rows[0].商品規格ID }, `${p.商品名} の取り込みで作られた規格`, issue);
    }
  });
  notes.set("〔商品ID-M0423-001〕", 商品ID);
  for (const who of [ap, ar]) await withAdminSession(browser, who.account, async () => undefined);
  await stockIn(browser, issue, { 店名: 本店名, code: src.商品コード, zone: "EC-CUBE", qty: 10, unit: 100, reason: "試験データ", reg: ap, app: ar });
  const csvPath = test.info().outputPath("qe0423-001.csv");
  fs.writeFileSync(csvPath, [SPLIT_HEAD.join(","), [src.商品コード, "4", dst.商品コード, "4"].join(",")].join("\n") + "\n", "utf8");
  qe074 = { 本店名, 所属, 申請者: ap, 承認者: ar, 分割元: { 商品ID, ...src }, 分割先コード: dst.商品コード, csvPath };
  issue(`店舗は本店（${本店名}）。申請者「${ap.名前}」・承認者「${ar.名前}」は所属「${所属}」（所属のマスタの既存の先頭の名称。正本は任意の有効な値で同じ所属）・権限はシステム管理者（承認権限あり）・編集可能店舗は本店（あれば使う）`);
  issue(`商品コード ${src.商品コード}・${dst.商品コード} で作り、取り込みで作られた規格を公開で登録した。分割元の本店のEC-CUBE在庫へ10を入庫（在庫変動理由「試験データ」・仕入単価100）し、承認者が承認した。CSVの商品コードも印つきの値`);
});
