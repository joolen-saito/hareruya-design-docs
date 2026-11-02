/**
 * M05-05 受注詳細カスタムCSV出力の画面シード。正本: cases/M05-05_seed_data.tsv
 *
 * 実装したシード: S-M05-05-ADM、DATA-002・004・005・006・007・012・018・020・031、MEMBER-036（画面だけで作れるもの）。
 * 実装しないシード: DATA-001・003・009〜011・013〜015・017・019・023〜026・028・032 は投入方法に「DBへ直接設定する」（注文日・対応状況・
 * 配送先の欠けなど画面で指定できない値）を含む。DATA-008・011 はスマレジ連携の値、CSV-ENV は共有の開発環境の設定の書き換えで、
 * 使うケースはこの回の対象に含めない（記録 e2e/review/M05-05_progress_2026-10-31.md）。
 *
 * 作り方（シード表の投入方法の順）:
 * 1. 会員: フロントに登録済みの試験用会員。無ければフロントの新規会員登録画面で登録（本登録のメールは手元のメールの受け口で読む。依頼者決定 2026-10-31）。
 *    管理画面の会員一覧で会員IDを控える。
 * 2. 注文: 商品詳細で販売中の商品1点をカートに入れ、ご注文手続きで銀行振込以外で外部の決済画面へ移らない方法（代金引換）を選び、注文を確定する。
 * 3. 受注一覧で注文番号を検索し、「受注詳細CSVダウンロード」の「注文ID」列・「配送ID」列の値を控える。
 * 4. カスタムCSV出力設定（配送CSV）で、名前を入れ、項目を移して定義を登録し、登録後のアドレスの末尾の番号（定義ID）を控える。
 * 決め打ちの識別の値（定義の名前・会員のメールの前半）には、実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 * 項目は「CSV出力しない項目」の画面の名前で選ぶ。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 注文IDと配送ID } from "../db/m05_05";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { customerIdByEmail } from "../pages/admin/f03_07_restock";
import { createCustomShippingCsv, OrderCsvPage, setShippingCsvOutput } from "../pages/admin/m05_05_custom_csv";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { ensureBuyer, ensureFrontMember, M05_BUYER, 会員が注文する } from "../pages/front/m05_front_order";
import { FrontMember } from "../pages/front/member_entry";

export const M0505_ADMIN: Account = { loginId: "m0505_admin", password: "Passw0rd!M0505" };

/** 定義の名前（正本の値に実行の印を付ける） */
export const 定義名 = (正本の名前: string): string => rc(正本の名前);

defineSeed("S-M05-05-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-05試験管理者", account: M0505_ADMIN, メール: "m0505_admin@example.test" });
  reportSeedIssue("S-M05-05-ADM", "権限は、受注情報検索とカスタムCSVダウンロードを操作できる「システム管理者」にした（正本に権限の名前が無い）");
});

/** シード表の呼び名（〔注文ID-M0505-002〕など）を、控えた値から埋める。キーは「種別＋末尾の英字」（例: 注文番号A・定義ID） */
function noteLabels(seedId: string, notes: Notes, values: Record<string, string>): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const m = /^〔(.+?)-M0505-\d+([A-Z]?)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const v = values[`${m[1]}${m[2]}`];
    if (!v) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, v);
  }
}

/** 試験用会員でフロントから注文し、受注詳細CSVから注文ID・配送IDを控える。注文番号・注文ID・配送IDを返す */
async function orderAndRead(browser: Browser, seedId: string, 会員: FrontMember = M05_BUYER): Promise<{ 注文番号: string; 注文ID: string; 配送ID: string[]; 行: string[][] }> {
  const 注文番号 = await 会員が注文する(browser, { メール: 会員.メール, パスワード: 会員.パスワード }, `${seedId} の注文`);
  return withAdminSession(browser, M0505_ADMIN, async (page) => {
    const csv = new OrderCsvPage(page);
    await csv.openSearch();
    const n = await csv.注文番号で検索する(注文番号);
    if (n < 1) throw new Error(`${seedId}: 注文番号 ${注文番号} の受注が受注一覧に出ない`);
    try {
      const r = await csv.受注詳細CSVをダウンロードする();
      const head = r.行[0] ?? [];
      const iOrder = head.indexOf("注文ID"), iShip = head.indexOf("配送ID"), iNo = head.indexOf("注文番号");
      if (iOrder < 0 || iShip < 0) throw new Error(`受注詳細CSVの見出しに「注文ID」「配送ID」が無い（見出し: ${head.join("、")}）`);
      const rows = r.行.slice(1).filter((x) => iNo < 0 || x[iNo] === 注文番号);
      if (rows.length === 0) throw new Error(`受注詳細CSVに注文番号 ${注文番号} の行が無い`);
      return { 注文番号, 注文ID: rows[0][iOrder], 配送ID: rows.map((x) => x[iShip]), 行: r.行 };
    } catch (e) {
      // 受注詳細CSVが出力できないときは、画面が振った番号を参照（SELECT）で読んで控える（F03-08 と同じ扱い）
      reportSeedIssue(seedId, `受注詳細CSVダウンロードで注文ID・配送IDを読めなかった（${(e as Error).message.split("\n")[0]}）ので、DBの参照で読んで控えた`);
      const x = 注文IDと配送ID(注文番号);
      return { 注文番号, 注文ID: x.注文ID, 配送ID: x.配送ID, 行: [] };
    }
  });
}

async function defineCsv(browser: Browser, seedId: string, name: string, items: string[]): Promise<string> {
  return withAdminSession(browser, M0505_ADMIN, (page) => createCustomShippingCsv(page, name, items, `${seedId} の定義「${name}」`));
}

async function memberId(browser: Browser, mail: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, (page) => customerIdByEmail(page, mail));
}

defineSeed("S-M05-05-DATA-002", { needs: ["S-M05-05-ADM"] }, async ({ browser, notes }) => {
  const id = "S-M05-05-DATA-002";
  await ensureBuyer(browser);
  const 会員ID = await memberId(browser, M05_BUYER.メール);
  const o = await orderAndRead(browser, id);
  const A = await defineCsv(browser, id, 定義名("M0505選択定義A-002"), ["注文番号", "配送ID"]);
  const B = await defineCsv(browser, id, 定義名("M0505選択定義B-002"), ["会員ID"]);
  noteLabels(id, notes, { 会員ID, 注文番号: o.注文番号, 注文ID: o.注文ID, 配送ID: o.配送ID[0], 定義IDA: A, 定義IDB: B });
});

/** 注文ID を出力しない設定にする前に、元から出力する側にあったか（ケースの後で元に戻すため） */
let 注文IDは元から出力していた: boolean | null = null;
defineSeed("S-M05-05-DATA-004", { needs: ["S-M05-05-ADM"] }, async ({ browser, notes }) => {
  const id = "S-M05-05-DATA-004";
  await ensureBuyer(browser);
  const 会員ID = await memberId(browser, M05_BUYER.メール);
  const o = await orderAndRead(browser, id);
  // ≪共有の設定≫ CSV出力項目設定（配送CSVの出力項目）で「注文ID」を出力しない側へ移す。ケースの終了後に元へ戻す
  const r = await withAdminSession(browser, M0505_ADMIN, (page) => setShippingCsvOutput(page, "注文ID", false, `${id} の出力項目設定`));
  if (注文IDは元から出力していた === null) 注文IDは元から出力していた = r.移す前に出力していた;
  const D = await defineCsv(browser, id, 定義名("M0505無効項目定義-004"), ["注文ID"]);
  noteLabels(id, notes, { 会員ID, 注文番号: o.注文番号, 注文ID: o.注文ID, 配送ID: o.配送ID[0], 定義ID: D });
});

/** M05-05-004 の後始末: 「注文ID」を出力する側へ戻す（元から出力していたときだけ） */
export async function 注文IDの出力を元に戻す(browser: Browser): Promise<string> {
  const 戻す = 注文IDは元から出力していた !== false;
  await withAdminSession(browser, M0505_ADMIN, (page) => setShippingCsvOutput(page, "注文ID", 戻す, "M05-05-004 の後始末（出力項目設定を元に戻す）"));
  return 戻す ? "「注文ID」を出力する側へ戻した" : "元から出力しない設定だったので、そのままにした";
}

defineSeed("S-M05-05-DATA-005", { needs: ["S-M05-05-ADM"] }, async ({ browser, notes }) => {
  const id = "S-M05-05-DATA-005";
  await ensureBuyer(browser);
  const o = await orderAndRead(browser, id);
  const D = await defineCsv(browser, id, 定義名("M0505基本定義-005"), ["注文番号"]);
  // 定義ID 999999 が未登録であること（アドレスの末尾の定義IDを書き換えて開き、エラーページになる）
  await withAdminSession(browser, M0505_ADMIN, async (page) => {
    await new OrderCsvPage(page).openCustomCsvSetting();
    const type = /\/custom_csv\/(\d+)/.exec(new URL(page.url()).pathname)?.[1];
    if (!type) throw new Error(`${id}: カスタムCSV出力設定のアドレスから種別の番号を読めない（${page.url()}）`);
    const res = await page.goto(adminUrl(`/setting/shop/custom_csv/${type}/999999`));
    if ((res?.status() ?? 0) < 400) {
      // エラーページにならず、新規作成の空の画面が開く作り。定義が表示された（名前が入っている・削除ボタンがある）ときだけ、登録済みとして止める
      const name = await page.locator('[name="admin_custom_csv[name]"]').inputValue().catch(() => "");
      const del = await page.locator('[data-bs-target="#DeleteModal"]').count();
      if (name !== "" || del > 0) throw new Error(`${id}: 定義ID 999999 が登録済みで表示された（名前「${name}」）。削除は自動ではしない`);
      reportSeedIssue(id, "定義ID 999999 の画面はエラーページにならず、定義の無い（名前が空・削除ボタンなしの）新規作成の画面が開いた（応答 200）。定義は表示されていないので、未登録として進めた");
    }
  });
  noteLabels(id, notes, { 注文番号: o.注文番号, 注文ID: o.注文ID, 配送ID: o.配送ID[0], 定義ID: D });
});

for (const [n, 名前] of [["006", "M0505基本定義-006"], ["007", "M0505基本定義-007"], ["031", "M0505基本定義-031"]] as const) {
  defineSeed(`S-M05-05-DATA-${n}`, { needs: ["S-M05-05-ADM"] }, async ({ browser, notes }) => {
    const id = `S-M05-05-DATA-${n}`;
    await ensureBuyer(browser);
    const o = await orderAndRead(browser, id);
    const D = await defineCsv(browser, id, 定義名(名前), ["注文番号"]);
    noteLabels(id, notes, { 注文番号: o.注文番号, 注文ID: o.注文ID, 配送ID: o.配送ID[0], 定義ID: D });
  });
}

defineSeed("S-M05-05-DATA-012", { needs: ["S-M05-05-ADM"] }, async ({ browser, notes }) => {
  const id = "S-M05-05-DATA-012";
  await ensureBuyer(browser);
  const a = await orderAndRead(browser, id);
  const b = await orderAndRead(browser, id);
  // 注文番号Aの検索結果が1件目の受注1件だけであることを確かめる
  await withAdminSession(browser, M0505_ADMIN, async (page) => {
    const csv = new OrderCsvPage(page);
    await csv.openSearch();
    const n = await csv.注文番号で検索する(a.注文番号);
    if (n < 1) throw new Error(`${id}: 注文番号 ${a.注文番号} の受注が受注一覧に出ない`);
    if (n !== 1) reportSeedIssue(id, `注文番号 ${a.注文番号} の検索結果が ${n} 件（手元のDBに同じ注文番号の古い受注があるため）。正本は1件と定める`);
  });
  const D = await defineCsv(browser, id, 定義名("M0505基本定義-012"), ["注文番号"]);
  noteLabels(id, notes, { 注文番号A: a.注文番号, 注文IDA: a.注文ID, 配送IDA: a.配送ID[0], 注文番号B: b.注文番号, 注文IDB: b.注文ID, 配送IDB: b.配送ID[0], 定義ID: D });
});

defineSeed("S-M05-05-DATA-020", { needs: ["S-M05-05-ADM"] }, async ({ browser, notes }) => {
  const id = "S-M05-05-DATA-020";
  const D = await defineCsv(browser, id, 定義名("M0505基本定義-020"), ["注文番号"]);
  await withAdminSession(browser, M0505_ADMIN, async (page) => {
    const csv = new OrderCsvPage(page);
    await csv.openSearch();
    const n = await csv.注文番号で検索する("99999999", { 対応状況をすべて選ぶ: true });
    if (n !== 0) throw new Error(`${id}: 注文番号 99999999 の受注が ${n} 件ある（0件のはず）。受注の削除は自動ではしない`);
  });
  noteLabels(id, notes, { 定義ID: D });
});

// 036: 会員の姓は正本の値（CSVに出力されるので値そのものを確かめる）。メールの前半は実行の印つき
const MEMBER_036: FrontMember = {
  姓: "試験M0505036", 名: "受注管理会員", セイ: "シケン", メイ: "カイイン",
  メール: `${rc("dpm0505-036")}@example.test`, パスワード: "Passw0rd-M0505036",
};
defineSeed("S-M05-05-MEMBER-036", { needs: ["S-M05-05-ADM"] }, async ({ browser, notes }) => {
  const id = "S-M05-05-MEMBER-036";
  await ensureFrontMember(browser, MEMBER_036);
  const 会員ID = await memberId(browser, MEMBER_036.メール);
  const o = await orderAndRead(browser, id, MEMBER_036);
  const D = await defineCsv(browser, id, 定義名("M0505会員姓定義-036"), ["注文番号", "お名前(姓)"]);
  noteLabels(id, notes, { 会員ID, 注文番号: o.注文番号, 注文ID: o.注文ID, 配送ID: o.配送ID[0], 定義ID: D });
});
