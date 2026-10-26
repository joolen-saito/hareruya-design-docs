/**
 * M04-32 在庫編集承認一覧の画面シード。正本: cases/M04-32_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（104〜106・108〜116・118・120・122・124〜127・130・131・133・134・136〜144）が使うシードだけ。
 * どのシードも「支店（または本店）・申請者と承認者・グッズ商品・在庫編集（や在庫変更CSV登録・在庫移動）の申請と承認/却下」の並び。
 * - 支店: 店舗登録で登録する（店名・支店URL・支店・公開・開店はシード表の値。そのほかの必須項目は「任意の有効な値」として固定の値）。
 *   あれば内容を確かめて使う（M04-24 の部品）。本店は店舗ID 1（親店舗）で、店名は在庫検索一覧の検索欄「店舗」の選択肢から読む。
 * - 申請者・承認者: メンバー管理で登録する（あれば内容を確かめて使う）。権限は「システム管理者」（在庫管理を操作でき、権限管理で承認権限の列に
 *   チェックがある）。所属は選択肢の先頭（全員同じ）、所属店舗とデフォルト検索表示店舗はその店舗、編集可能店舗はその店舗だけ。
 *   M04-02 と同じ作り（defineRcOrg）。
 * - 商品: グッズ商品CSV登録で1行（134 は2行）を取り込み、取り込みで作られた規格を商品規格登録編集で公開にする（M04-02 と同じ作り）。
 *   商品公開ステータスは画面の説明の「公開」の値・確認モーダルは出ない（依頼者決定 2026-10-22: この2つだけでは条件付きにしない）。
 * - 在庫編集の承認・却下（シード）: 承認者で在庫編集承認一覧を店舗・登録者（メンバー選択）で検索し、未承認の行を選んで一括承認/一括却下する。
 *   シード表が「承認ステータスの「未承認」」を指定するものは、検索欄の「承認可能な在庫のみ表示」のチェック（初期で付いている）が承認ステータスの
 *   チェック欄を選べなくするので、未承認のチェックは付けられない（設計書 L0048 のとおり）。初期のまま検索し、注記に残す（条件付き）。
 * - 在庫変更CSV登録（シード）: 画面の雛形をダウンロードし、見出し行の下にシード表の1行を足したファイルを、正本のファイル名で置いて登録する（M04-21 と同じ作り）。
 * - 商品コードは正本の固定の値で、正本に清掃の手順が無い。前の実行の商品が残っていれば作らずに止める。
 */
import fs from "node:fs";
import { Browser, expect, Page, test } from "@playwright/test";
import { MAIL_URL, SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession as withAdminSessionRaw } from "../lib/session";
import { fillStockEdit, searchStockByCode, stockInRow, submitStockEdit } from "../pages/admin/m04_02_rc_stock";
import { expectNoProductCodes } from "../pages/admin/m04_17_seed_ops";
import {
  chooseFileAndRegister, downloadBytes, downloadStockChangeTemplate, fillStockChangeCsvForm, openStockChangeCsv,
} from "../pages/admin/m04_21_stock_change_csv";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { registerMove, requestOutboundApproval, searchStock } from "../pages/admin/m04_24_stock_move";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import { createGoodsProduct } from "../pages/admin/m04_31_seed_ops";
import {
  checkRow, confirmApprove, confirmReject, deleteMailsTo, expectDone, listRows, mailsTo, openBulk, searchApprovalList, topMessages,
} from "../pages/admin/m04_32_approval_list";
import { StockListPage } from "../pages/admin/stock_edit";
import { findMemberId } from "../pages/admin/member";

/** 共通の withAdminSession に、待ちの上限（操作120秒・画面の移動180秒）を付けたもの。誤ったセレクタでロックを長く持たないように（店舗登録の保存は30秒を超えることがある。2026-10-22 の104） */
function withAdminSession<T>(browser: Browser, account: Account, fn: (page: Page) => Promise<T>): Promise<T> {
  return withAdminSessionRaw(browser, account, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    return fn(page);
  });
}

// ---- 店舗・管理者 ----

export type Person = { 名前: string; account: Account; email: string };
export type Org32 = { 申請者: Person[]; 承認者: Person };
export type Store32 = { 本店: true } | { 支店: M0424StoreInput };

const person = (loginId: string, 名前: string, password: string): Person => ({ 名前, account: { loginId, password }, email: `${loginId}@example.test` });

/** ログインIDの接頭辞・表示名の接頭辞・パスワードから申請者1人・承認者1人の組を作る（例: rc0432-001 / RC0432-001） */
export function org32(prefix: string, label: string, password: string): Org32 {
  return { 申請者: [person(`${prefix}-ap`, `${label}申請者`, password)], 承認者: person(`${prefix}-ar`, `${label}承認者`, password) };
}

/** 支店（店名・支店URLはシード表の値、店名略称3文字はほかと重ならない値。そのほかは「任意の有効な値」） */
export function branch32(店名: string, 支店URL: string, 略称: string): Store32 {
  return {
    支店: {
      店名, 店名カナ: "シケンシテン", 店名英語: "Test Branch", 支店URL, 店名略称3文字: 略称, ショップ名略称: 店名,
      会社名: "M04-32試験会社", 会社名カナ: "エムゼロヨンサンジュウニシケンガイシャ", 郵便番号: "160-0022", 都道府県: "東京都",
      住所1: "新宿区新宿4-32-1", 住所2: "試験ビル", 電話番号: "03-0432-0001",
    },
  };
}
export const MAIN: Store32 = { 本店: true };

/** 店舗IDと店名。本店は在庫検索一覧の検索欄「店舗」の選択肢から店舗ID 1 の店名を読む */
async function resolveStore(page: Page, store: Store32, issue: (m: string) => void): Promise<{ id: string; 店名: string }> {
  if ("本店" in store) return { id: "1", 店名: await new StockListPage(page).shopNameById("1") };
  return { id: await ensureStore(page, store.支店, issue), 店名: store.支店.店名 };
}

/** 店舗の店名（シードを作らずに読むだけ） */
export async function storeName(browser: Browser, account: Account, store: Store32): Promise<string> {
  if (!("本店" in store)) return store.支店.店名;
  return withAdminSession(browser, account, (page) => new StockListPage(page).shopNameById("1"));
}

/** 店舗を用意し、申請者・承認者を登録する（あれば内容を確かめて使う）。全員ログインできることを確かめる */
async function ensureOrg(browser: Browser, org: Org32, store: Store32, issue: (m: string) => void): Promise<string> {
  const name = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const s = await resolveStore(page, store, issue);
    for (const who of [...org.申請者, org.承認者]) {
      await ensureMemberByStoreIds(page, {
        名前: who.名前, ログインID: who.account.loginId, メールアドレス: who.email, パスワード: who.account.password,
        権限: "システム管理者", 所属店舗ID: s.id, デフォルト検索表示店舗ID: s.id, 編集可能店舗ID: [s.id],
      });
    }
    return s.店名;
  });
  for (const who of [...org.申請者, org.承認者]) await withAdminSession(browser, who.account, async () => undefined);
  return name;
}

/** メンバー編集画面で、メンバーの所属の表示名を読む */
export async function departmentOf(browser: Browser, 名前: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const id = await findMemberId(page, 名前);
    if (!id) throw new Error(`メンバー「${名前}」がいない`);
    await page.goto(adminUrl(`/setting/system/member/${id}/edit`));
    const text = await page.locator('[name="admin_member[department]"] option:checked').textContent();
    return (text ?? "").trim();
  });
}

/** 店舗だけを用意し、申請者・承認者を登録するシード（シード表が組織を別のシードにしているもの: RC-ORG・CBORG） */
export function defineOrgSeed(seedId: string, org: Org32, store: Store32): void {
  defineSeed(seedId, async ({ browser }) => {
    await ensureOrg(browser, org, store, (m) => reportSeedIssue(seedId, m));
    reportSeedIssue(seedId, "権限は「システム管理者」（在庫管理を操作でき、承認権限の列にチェックがある権限）、所属は選択肢の先頭（全員同じ）、所属店舗とデフォルト検索表示店舗はその店舗");
  });
}

// ---- 在庫の操作の並び ----

export type Op =
  | { op: "在庫編集"; by?: number; code: string; 区分: string; 理由: string; 数: string; 単価?: string; 確認在庫?: number }
  | { op: "承認" | "却下"; target: "在庫編集" | "在庫変更CSV登録"; 行数?: number; 未承認?: boolean; 理由?: string; 確認?: { code: string; 在庫: number }[] }
  | { op: "在庫変更CSV"; code: string; 区分: string; 理由: string; 増減数: string; 単価: string; file: string; 所属選択: boolean; 成功の文?: string }
  | { op: "在庫移動"; code: string; 入庫先: "本店"; 点数: string };

export type Product32 = { 商品コード: string; 商品名: string };

/** シード: （必要なら店舗・管理者を用意し、）商品を作って、在庫の操作を順に行う */
export function defineStockSeed(seedId: string, o: {
  needs?: string[]; org: Org32; store: Store32; withOrg: boolean; products: Product32[]; ops: Op[];
  /** 105: 試験用メール受信環境で、この宛先の受信メールを削除する */
  mailsToClear?: string[];
  /**
   * 前の実行でこのシードが作り終え、ケースがデータを変えずに止まった（E2E側の不備）ときだけ使う。商品が残っていれば作り直さず、
   * 承認者で見た在庫編集承認一覧の行（承認状態・承認対象・合計在庫増減数）と在庫検索一覧の在庫がシード表の状態と同じことを確かめて使う。
   * 違えば止める。使ったことは注記（補い）に残す。
   */
  前回の残り?: {
    理由: string; 行: { 承認状態: string; 承認対象: string; 合計在庫増減数: string }[]; 在庫: { code: string; 在庫: number }[];
    /** シードの途中で止まったときの、続きの操作の番号（0始まり。ops の何番目から行うか）。無ければシードは作り終えていたとみなす */
    再開?: number;
  };
}): void {
  defineSeed(seedId, { needs: o.needs ?? [] }, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const shop = o.withOrg ? await ensureOrg(browser, o.org, o.store, issue) : await storeName(browser, o.org.申請者[0].account, o.store);
    if (o.withOrg) issue("権限は「システム管理者」（在庫管理を操作でき、承認権限の列にチェックがある権限）、所属は選択肢の先頭（全員同じ）、所属店舗とデフォルト検索表示店舗はその店舗");
    let startOp = 0;
    let skipCreate = false;
    if (o.前回の残り) {
      const left = await withAdminSession(browser, SETUP_ADMIN, async (page) =>
        expectNoProductCodes(page, o.products.map((p) => p.商品コード), seedId).then(() => false, () => true));
      if (left) {
        const want = o.前回の残り;
        await withAdminSession(browser, o.org.承認者.account, async (page) => {
          await searchApprovalList(page, { 店舗: shop, 承認可能のみ: false, 登録者: o.org.申請者.map((p) => p.名前) });
          const rows = (await listRows(page)).map((r) => ({ 承認状態: r.承認状態, 承認対象: r.承認対象, 合計在庫増減数: r.合計在庫増減数 }));
          const key = (x: { 承認状態: string; 承認対象: string; 合計在庫増減数: string }) => `${x.承認状態}/${x.承認対象}/${x.合計在庫増減数}`;
          expect(rows.map(key).sort(), `${seedId}: 残っていたデータの在庫編集承認一覧の行がシード表の状態と同じ`).toEqual(want.行.map(key).sort());
          for (const c of want.在庫) {
            const list = await searchStockByCode(page, { 商品コード: c.code, 店舗: shop, 在庫区分: "EC-CUBE" });
            expect(await stockInRow(list.row(c.code, shop, "EC-CUBE")), `${seedId}: 残っていた ${c.code} の在庫`).toBe(c.在庫);
          }
        });
        const where = want.再開 === undefined ? "シード表の状態" : `シード表の操作${want.再開}つ目までを終えた状態`;
        issue(`補い: 前回の実行（${want.理由}）でこのシードが作ったデータが残っていたので、作り直さずに使った。在庫編集承認一覧の行（${want.行.map((x) => `${x.承認状態}・${x.承認対象}・${x.合計在庫増減数}`).join("／")}）と在庫（${want.在庫.map((c) => `${c.code}=${c.在庫}`).join("・")}）が${where}と同じことを画面で確かめた` +
          (want.再開 === undefined ? "" : `。続き（操作${want.再開 + 1}つ目から）を行った`));
        // 作り終えていたときは操作を飛ばし、最後の片付け（105 の受信メールの削除）だけを行う
        startOp = want.再開 ?? o.ops.length;
        skipCreate = true;
      }
    }
    if (!skipCreate) await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await expectNoProductCodes(page, o.products.map((p) => p.商品コード), seedId);
      for (const p of o.products) {
        await createGoodsProduct(page, { 商品コード: p.商品コード, 商品名: p.商品名, 商品名英: p.商品名, 基準価格: "1", 販売価格: "1", 買取価格: "1", 原価単価: "10" }, seedId, issue);
      }
    });
    let dept = "";
    for (const [i, op] of o.ops.entries()) {
      if (i < startOp) continue;
      const what = `${seedId} の操作${i + 1}（${op.op}）`;
      if (op.op === "在庫編集") {
        const who = o.org.申請者[op.by ?? 0];
        await withAdminSession(browser, who.account, async (page) => {
          const list = await searchStockByCode(page, { 商品コード: op.code, 店舗: shop, 在庫区分: "EC-CUBE" });
          await list.openEdit(list.row(op.code, shop, "EC-CUBE"));
          await fillStockEdit(page, { 在庫変動区分: op.区分, 在庫変動理由: op.理由, 在庫増減数: op.数, 仕入単価: op.単価, 承認通知先: o.org.承認者.名前 });
          await submitStockEdit(page, what, issue);
          if (op.確認在庫 !== undefined) {
            const after = await searchStockByCode(page, { 商品コード: op.code, 店舗: shop, 在庫区分: "EC-CUBE" });
            expect(await stockInRow(after.row(op.code, shop, "EC-CUBE")), `${what}: ${op.code} の在庫`).toBe(op.確認在庫);
          }
        });
      } else if (op.op === "承認" || op.op === "却下") {
        await withAdminSession(browser, o.org.承認者.account, async (page) => {
          const r = await searchApprovalList(page, { 店舗: shop, 登録者: o.org.申請者.map((p) => p.名前), 承認ステータス: op.未承認 ? ["未承認"] : undefined });
          if (r.承認ステータス === "選べない") {
            issue(`補い: ${what}: シード表は承認ステータスの「未承認」を指定するが、「承認可能な在庫のみ表示」のチェック（初期で付いている）でチェック欄が選べない（設計書 L0048 のとおり）。初期のまま検索した`);
          }
          const rows = (await listRows(page)).filter((x) => x.承認対象 === op.target && x.承認状態 === "未承認" && x.チェックボックス);
          const want = op.行数 ?? 1;
          if (rows.length !== want) throw new Error(`${what}: 承認対象「${op.target}」の未承認の行が ${rows.length} 件（${want} 件のはず）: ${JSON.stringify(await listRows(page))}`);
          for (const row of rows) await checkRow(page, row, what);
          await openBulk(page, op.op === "承認" ? "一括承認" : "一括却下");
          const done = op.op === "承認" ? await confirmApprove(page) : await confirmReject(page, op.理由 ?? "");
          expectDone(what, done, issue);
          for (const c of op.確認 ?? []) {
            const after = await searchStockByCode(page, { 商品コード: c.code, 店舗: shop, 在庫区分: "EC-CUBE" });
            expect(await stockInRow(after.row(c.code, shop, "EC-CUBE")), `${what}: ${c.code} の在庫`).toBe(c.在庫);
          }
        });
      } else if (op.op === "在庫変更CSV") {
        if (!dept) dept = await departmentOf(browser, o.org.承認者.名前);
        const storeId = "本店" in o.store ? "1" : await withAdminSession(browser, SETUP_ADMIN, (page) => ensureStore(page, (o.store as { 支店: M0424StoreInput }).支店, issue));
        await withAdminSession(browser, o.org.申請者[0].account, async (page) => {
          await openStockChangeCsv(page);
          const template = await downloadBytes(await downloadStockChangeTemplate(page));
          const text = template.toString("latin1");
          const eol = text.includes("\r\n") ? "\r\n" : "\n";
          const head = text.replace(/(\r\n|\n)+$/, "");
          if (/\r|\n/.test(head)) throw new Error(`${what}: 在庫変更CSVの雛形が見出しの1行だけではない`);
          const body = Buffer.concat([template.subarray(0, Buffer.byteLength(head, "latin1")),
            Buffer.from(`${eol}${op.code},${op.増減数},${op.単価}${eol}`, "ascii")]);
          const file = test.info().outputPath(op.file);
          fs.writeFileSync(file, body);
          await fillStockChangeCsvForm(page, {
            店舗ID: storeId, 店名: shop, 在庫区分: "EC-CUBE", 在庫変動区分: op.区分, 在庫変動理由: op.理由, 所属: dept, 承認者: o.org.承認者.名前,
          });
          if (!op.所属選択) issue(`補い: ${what}: シード表は承認通知先（所属選択）を書かないが、画面で必須なので承認者の所属「${dept}」を選んだ`);
          const r = await chooseFileAndRegister(page, file);
          if (r.結果 !== "送信") throw new Error(`${what}: 在庫変更CSV登録が送信されなかった: ${JSON.stringify(r)}`);
          const m = await topMessages(page);
          if (op.成功の文 && !m.成功.includes(op.成功の文)) {
            // シード表の文「商品登録CSVファイルをアップロードしました。」は画面に出ず、画面は「保存しました」を出す（StockChangeCsvController.php L378 admin.common.save_complete）
            if (!m.成功.includes("保存しました")) throw new Error(`${what}: 「${op.成功の文}」も「保存しました」も表示されない（${JSON.stringify(m)}）`);
            issue(`補い: ${what}: シード表は「${op.成功の文}」と表示されたことを確かめると書くが、画面は「保存しました」を出す。「保存しました」が出たことで登録できたとみなした`);
          }
          issue(`${what}: ファイル ${op.file}（${op.code},${op.増減数},${op.単価}）を登録した: ${JSON.stringify(m.成功)}`);
        });
      } else if (op.op === "在庫移動") {
        const storeId = "本店" in o.store ? "1" : await withAdminSession(browser, SETUP_ADMIN, (page) => ensureStore(page, (o.store as { 支店: M0424StoreInput }).支店, issue));
        await withAdminSession(browser, o.org.申請者[0].account, async (page) => {
          const list = await searchStock(page, op.code, storeId);
          const moveId = await registerMove(page, list.row(op.code, shop, "EC-CUBE"), { 入庫先店舗ID: "1", 入庫先在庫区分: "EC-CUBE", 移動点数: op.点数 }, what);
          issue(`補い: ${what}: シード表は入庫先の在庫区分を書かないが、画面で選ぶので「EC-CUBE」を選んだ（在庫移動・振替ID ${moveId}）`);
          await requestOutboundApproval(page, moveId, o.org.承認者.名前, `${what}（出庫承認申請）`);
        });
      }
    }
    if (o.mailsToClear) {
      if (!MAIL_URL) throw new Error(`${seedId}: 試験用メール受信環境が無い`);
      for (const a of o.mailsToClear) {
        const n = await deleteMailsTo(MAIL_URL, a);
        const left = (await mailsTo(MAIL_URL, a)).length;
        if (left !== 0) throw new Error(`${seedId}: ${a} 宛の受信メールが ${left} 通残っている`);
        issue(`試験用メール受信環境で ${a} 宛の受信メールを ${n} 通削除し、0通であることを確かめた（受信環境の削除の機能を1通ずつ使った）`);
      }
    }
  });
}

// ---- シード表の各シード ----

const 入庫10 = (code: string): Op => ({ op: "在庫編集", code, 区分: "入庫/その他", 理由: "試験データ", 数: "10", 単価: "100" });
const 承認して = (code: string, 在庫: number, 未承認 = false): Op => ({ op: "承認", target: "在庫編集", 未承認, 確認: [{ code, 在庫 }] });

// 104
export const DP104 = org32("dp0432-104", "DP0432-104", "Passw0rd-DP0432104");
export const DP104_STORE = branch32("DP0432-104支店", "dp0432s104", "D04");
defineStockSeed("S-M04-32-APPR2STOCK-104", {
  org: DP104, store: DP104_STORE, withOrg: true,
  products: [{ 商品コード: "DP0432-104-CODE1", 商品名: "DP0432-104-NAME1" }, { 商品コード: "DP0432-104-CODE2", 商品名: "DP0432-104-NAME2" }],
  ops: [
    入庫10("DP0432-104-CODE1"), 入庫10("DP0432-104-CODE2"),
    { op: "承認", target: "在庫編集", 行数: 2, 未承認: true, 確認: [{ code: "DP0432-104-CODE1", 在庫: 10 }, { code: "DP0432-104-CODE2", 在庫: 10 }] },
    { op: "在庫編集", code: "DP0432-104-CODE1", 区分: "入庫/その他", 理由: "試験データ", 数: "3", 単価: "100" },
    { op: "在庫編集", code: "DP0432-104-CODE2", 区分: "入庫/その他", 理由: "試験データ", 数: "3", 単価: "100" },
  ],
});

// 105（申請者が2人）
export const DP105: Org32 = {
  申請者: [person("dp0432-105-ap1", "DP0432-105申請者1", "Passw0rd-DP0432105"), person("dp0432-105-ap2", "DP0432-105申請者2", "Passw0rd-DP0432105")],
  承認者: person("dp0432-105-ar", "DP0432-105承認者", "Passw0rd-DP0432105"),
};
export const DP105_STORE = branch32("DP0432-105支店", "dp0432s105", "D05");
defineStockSeed("S-M04-32-APPRMAIL-105", {
  前回の残り: {
    理由: "2026-10-22 15:18 の105。シードは作り終え、ケースは手順2の登録者（メンバー選択）の2人目の選択（データを変えない）で止まった",
    行: [{ 承認状態: "未承認", 承認対象: "在庫編集", 合計在庫増減数: "3" }, { 承認状態: "未承認", 承認対象: "在庫編集", 合計在庫増減数: "3" }],
    在庫: [{ code: "DP0432-105-CODE1", 在庫: 0 }, { code: "DP0432-105-CODE2", 在庫: 0 }],
  },
  org: DP105, store: DP105_STORE, withOrg: true,
  products: [{ 商品コード: "DP0432-105-CODE1", 商品名: "DP0432-105-NAME1" }, { 商品コード: "DP0432-105-CODE2", 商品名: "DP0432-105-NAME2" }],
  ops: [
    { op: "在庫編集", by: 0, code: "DP0432-105-CODE1", 区分: "入庫/その他", 理由: "試験データ", 数: "3", 単価: "100" },
    { op: "在庫編集", by: 1, code: "DP0432-105-CODE2", 区分: "入庫/その他", 理由: "試験データ", 数: "3", 単価: "100" },
  ],
  mailsToClear: ["dp0432-105-ap1@example.test", "dp0432-105-ap2@example.test"],
});

// 106
export const DP106 = org32("dp0432-106", "DP0432-106", "Passw0rd-DP0432106");
export const DP106_STORE = branch32("DP0432-106支店", "dp0432s106", "D06");
defineStockSeed("S-M04-32-DISPMODAL-106", {
  org: DP106, store: DP106_STORE, withOrg: true, products: [{ 商品コード: "DP0432-106-CODE", 商品名: "DP0432-106-NAME" }],
  ops: [
    { op: "在庫編集", code: "DP0432-106-CODE", 区分: "入庫/その他", 理由: "試験データ", 数: "5", 単価: "100" },
    承認して("DP0432-106-CODE", 5, true),
    { op: "在庫編集", code: "DP0432-106-CODE", 区分: "廃棄/廃棄(破損)", 理由: "試験データ", 数: "-2" },
  ],
});

// 108・109（100@40・200@30 を入庫して承認し、廃棄-100）
function odd(no: string, digit: string) {
  const org = org32(`dp0432-${no}`, `DP0432-${no}`, `Passw0rd-DP0432${no}`);
  const store = branch32(`DP0432-${no}支店`, `dp0432s${no}`, digit);
  const code = `DP0432-${no}-CODE`;
  return {
    org, store, code,
    ops: [
      { op: "在庫編集", code, 区分: "入庫/その他", 理由: "試験データ", 数: "100", 単価: "40" },
      承認して(code, 100, true),
      { op: "在庫編集", code, 区分: "入庫/その他", 理由: "試験データ", 数: "200", 単価: "30" },
      承認して(code, 300, true),
      { op: "在庫編集", code, 区分: "廃棄/廃棄(破損)", 理由: "試験データ", 数: "-100" },
    ] as Op[],
  };
}
export const DP108 = odd("108", "D08");
export const DP109 = odd("109", "D09");
defineStockSeed("S-M04-32-ODDCSV-108", { org: DP108.org, store: DP108.store, withOrg: true, products: [{ 商品コード: DP108.code, 商品名: "DP0432-108-NAME" }], ops: DP108.ops });
defineStockSeed("S-M04-32-ODDREJ-109", { org: DP109.org, store: DP109.store, withOrg: true, products: [{ 商品コード: DP109.code, 商品名: "DP0432-109-NAME" }], ops: DP109.ops });

// 110〜116（RC-*。組織は別のシード）
export type Rc32 = { org: Org32; store: Store32; code: string; name: string; label: string };
function rc(no: string, store: Store32): Rc32 {
  return { org: org32(`rc0432-${no}`, `RC0432-${no}`, `Passw0rd-RC0432${no}`), store, code: `RC0432${no}CODE`, name: `RC0432-${no}-NAME`, label: `RC0432-${no}` };
}
export const RC110 = rc("001", branch32("RC0432-001支店", "rc0432s001", "S01"));
export const RC111 = rc("002", branch32("RC0432-002支店", "rc0432s002", "S02"));
export const RC112 = rc("003", branch32("RC0432-003支店", "rc0432s003", "S03"));
export const RC113 = rc("004", MAIN);
export const RC114 = rc("005", branch32("RC0432-005支店", "rc0432s005", "S05"));
export const RC115 = rc("006", MAIN);
export const RC116 = rc("007", branch32("RC0432-007支店", "rc0432s007", "S07"));

const 入庫3 = (code: string, 理由: string): Op => ({ op: "在庫編集", code, 区分: "入庫/問屋仕入", 理由, 数: "3", 単価: "300" });
const 廃棄3 = (code: string, 理由: string, 確認在庫?: number): Op => ({ op: "在庫編集", code, 区分: "廃棄/廃棄(破損)", 理由, 数: "-3", 確認在庫 });

function defineRc(no: string, r: Rc32, last: Op): void {
  defineOrgSeed(`S-M04-32-RC-ORG-${no}`, r.org, r.store);
  defineStockSeed(`S-M04-32-RC-STOCK-${no}`, {
    needs: [`S-M04-32-RC-ORG-${no}`], org: r.org, store: r.store, withOrg: false, products: [{ 商品コード: r.code, 商品名: r.name }],
    ops: [入庫10(r.code), 承認して(r.code, 10), last],
  });
}
defineRc("110", RC110, 入庫3(RC110.code, "RC0432-001-入庫"));
defineRc("111", RC111, 入庫3(RC111.code, "RC0432-002-入庫"));
defineRc("112", RC112, 廃棄3(RC112.code, "RC0432-003-廃棄", 7));
defineRc("113", RC113, 入庫3(RC113.code, "RC0432-004-入庫"));
defineRc("114", RC114, 廃棄3(RC114.code, "RC0432-005-廃棄"));
defineRc("115", RC115, 廃棄3(RC115.code, "RC0432-006-廃棄"));
defineRc("116", RC116, 廃棄3(RC116.code, "RC0432-007-廃棄"));

// 118〜134（CBORG・CBSTOCK）
export type Cb32 = { org: Org32; store: Store32; code: string; name: string; label: string; shop: string };
export function cbm(no: string, digit: string): Cb32 {
  const shop = `CBM0432-${no}支店`;
  return {
    org: org32(`cbm0432-${no}`, `CBM0432-${no}`, `Passw0rd-CBM0432${no}`), store: branch32(shop, `cbm0432s${no}`, digit),
    code: `CBM0432-${no}-CODE`, name: `CBM0432-${no}-NAME`, label: `CBM0432-${no}`, shop,
  };
}
export const CB: Record<string, Cb32> = {};
const cbDigits: Record<string, string> = {
  "118": "C18", "120": "C20", "122": "C22", "124": "C24", "125": "C25", "126": "C26", "127": "C27", "130": "C30", "131": "C31", "133": "C33", "134": "C34",
};
for (const [no, d] of Object.entries(cbDigits)) CB[no] = cbm(no, d);

function defineCb(no: string, products: Product32[], ops: Op[], 前回の残り?: Parameters<typeof defineStockSeed>[1]["前回の残り"]): void {
  const c = CB[no];
  defineOrgSeed(`S-M04-32-CBORG-${no}`, c.org, c.store);
  defineStockSeed(`S-M04-32-CBSTOCK-${no}`, { needs: [`S-M04-32-CBORG-${no}`], org: c.org, store: c.store, withOrg: false, products, ops, 前回の残り });
}
const cbBase = (no: string, 在庫 = 10): Op[] => [
  { op: "在庫編集", code: CB[no].code, 区分: "入庫/その他", 理由: "試験データ", 数: String(在庫), 単価: "100" },
  承認して(CB[no].code, 在庫),
];
const cbProduct = (no: string): Product32[] => [{ 商品コード: CB[no].code, 商品名: CB[no].name }];
const cbIn3 = (no: string): Op => 入庫3(CB[no].code, `CBM0432-${no}-入庫`);

defineCb("118", cbProduct("118"), [...cbBase("118"), cbIn3("118")]);
defineCb("120", cbProduct("120"), [...cbBase("120"), cbIn3("120")]);
defineCb("122", cbProduct("122"), [...cbBase("122"), cbIn3("122")], {
  理由: "2026-10-22 02:52 の122。シードは作り終え、ケースは手順2の検索欄の操作（データを変えない）で止まった",
  行: [{ 承認状態: "承認済", 承認対象: "在庫編集", 合計在庫増減数: "10" }, { 承認状態: "未承認", 承認対象: "在庫編集", 合計在庫増減数: "3" }],
  在庫: [{ code: "CBM0432-122-CODE", 在庫: 10 }],
});
defineCb("124", cbProduct("124"), [...cbBase("124"), cbIn3("124"), { op: "承認", target: "在庫編集" }]);
defineCb("125", cbProduct("125"), [...cbBase("125"), cbIn3("125"), { op: "却下", target: "在庫編集", 理由: "CBM0432-125-却下" }]);
defineCb("126", cbProduct("126"), [...cbBase("126", 5), { op: "在庫移動", code: CB["126"].code, 入庫先: "本店", 点数: "1" }]);
defineCb("127", cbProduct("127"), [...cbBase("127"), cbIn3("127")]);
defineCb("130", cbProduct("130"), [...cbBase("130"), cbIn3("130"), { op: "承認", target: "在庫編集" }]);
defineCb("131", cbProduct("131"), [...cbBase("131"), cbIn3("131"), { op: "却下", target: "在庫編集", 理由: "CBM0432-131-却下" }]);
defineCb("133", cbProduct("133"), [...cbBase("133"), 廃棄3(CB["133"].code, "CBM0432-133-廃棄")]);
defineCb("134", [{ 商品コード: "CBM0432-134-CODEA", 商品名: "CBM0432-134-NAMEA" }, { 商品コード: "CBM0432-134-CODEB", 商品名: "CBM0432-134-NAMEB" }], [
  { op: "在庫編集", code: "CBM0432-134-CODEA", 区分: "入庫/その他", 理由: "試験データ", 数: "10", 単価: "100" },
  承認して("CBM0432-134-CODEA", 10),
  { op: "在庫編集", code: "CBM0432-134-CODEA", 区分: "入庫/問屋仕入", 理由: "CBM0432-134-入庫", 数: "3", 単価: "300" },
  { op: "在庫変更CSV", code: "CBM0432-134-CODEB", 区分: "入庫/問屋仕入", 理由: "CBM0432-134-入庫", 増減数: "2", 単価: "100", file: "cbm0432-134-stock.csv", 所属選択: false },
]);

// 136〜144（組織と在庫が1つのシード）
export type Cbx = { org: Org32; store: Store32; code: string; name: string; shop: string; label: string };
export function cbx(no: string): Cbx {
  const shop = `CB0432-${no}支店`;
  return {
    org: org32(`cbm0432-${no}`, `CB0432-${no}`, `Passw0rd-CBM0432${no}`), store: branch32(shop, `cbm0432s${no}`, `B${no.slice(1)}`),
    code: `CB0432${no}CODE`, name: `CB0432-${no}-NAME`, shop, label: `CB0432-${no}`,
  };
}
export const CBX: Record<string, Cbx> = {};
for (const no of ["136", "137", "138", "139", "140", "141", "142", "143", "144"]) CBX[no] = cbx(no);

const UPLOADED = "商品登録CSVファイルをアップロードしました。";
function defineCbx(seedId: string, no: string, rest: Op[], 前回の残り?: Parameters<typeof defineStockSeed>[1]["前回の残り"]): void {
  const c = CBX[no];
  defineStockSeed(seedId, {
    前回の残り,
    org: c.org, store: c.store, withOrg: true, products: [{ 商品コード: c.code, 商品名: c.name }],
    ops: [{ op: "在庫編集", code: c.code, 区分: "入庫/その他", 理由: "試験データ", 数: "10", 単価: "100" }, 承認して(c.code, 10), ...rest],
  });
}
const csvOp = (no: string, 区分: string, 理由: string, 増減数: string, 単価: string): Op =>
  ({ op: "在庫変更CSV", code: CBX[no].code, 区分, 理由, 増減数, 単価, file: `cb0432-${no}.csv`, 所属選択: true, 成功の文: UPLOADED });

defineCbx("S-M04-32-CBCSVWASTEAPPR-136", "136", [
  csvOp("136", "廃棄/廃棄(破損)", "CB0432-136-廃棄", "-3", ""),
  { op: "承認", target: "在庫変更CSV登録", 確認: [{ code: CBX["136"].code, 在庫: 7 }] },
], {
  理由: "2026-10-22 09:16 の136。在庫変更CSV登録は行われた（画面は「保存しました」）が、シード表の文「商品登録CSVファイルをアップロードしました。」が出ないのでシードを止めた",
  行: [{ 承認状態: "承認済", 承認対象: "在庫編集", 合計在庫増減数: "10" }, { 承認状態: "未承認", 承認対象: "在庫変更CSV登録", 合計在庫増減数: "-3" }],
  在庫: [{ code: "CB0432136CODE", 在庫: 7 }],
  再開: 3,
});
defineCbx("S-M04-32-CBCSVINREJ-137", "137", [
  csvOp("137", "入庫/問屋仕入", "CB0432-137-入庫", "3", "300"),
  { op: "却下", target: "在庫変更CSV登録", 理由: "CB0432-137-却下" },
]);
defineCbx("S-M04-32-CBINUNAPP-138", "138", [入庫3(CBX["138"].code, "CB0432-138-入庫")]);
defineCbx("S-M04-32-CBINAPPR-139", "139", [入庫3(CBX["139"].code, "CB0432-139-入庫"), { op: "承認", target: "在庫編集", 確認: [{ code: CBX["139"].code, 在庫: 13 }] }]);
defineCbx("S-M04-32-CBINREJ-140", "140", [入庫3(CBX["140"].code, "CB0432-140-入庫"), { op: "却下", target: "在庫編集", 理由: "CB0432-140-却下" }]);
defineCbx("S-M04-32-CBCSVWASTEAPPR-141", "141", [
  csvOp("141", "廃棄/廃棄(破損)", "CB0432-141-廃棄", "-3", ""),
  { op: "承認", target: "在庫変更CSV登録", 確認: [{ code: CBX["141"].code, 在庫: 7 }] },
]);
defineCbx("S-M04-32-CBWASTEUNAPP-142", "142", [廃棄3(CBX["142"].code, "CB0432-142-廃棄")]);
defineCbx("S-M04-32-CBCSVINUNAPP-143", "143", [csvOp("143", "入庫/問屋仕入", "CB0432-143-入庫", "3", "300")]);
defineCbx("S-M04-32-CBCSVINREJ-144", "144", [
  csvOp("144", "入庫/問屋仕入", "CB0432-144-入庫", "3", "300"),
  { op: "却下", target: "在庫変更CSV登録", 理由: "CB0432-144-却下" },
]);
