/**
 * M04-23 在庫分割結合CSV登録の画面シード。正本: cases/M04-23_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順。すべて管理画面から。記録 review/M04-23_progress_2026-11-11_dev.md）:
 * - 店舗: 試験店舗A（M04-23）・試験店舗B（M04-23）・ケースの店舗（在庫分割結合試験店舗甲〇一三 など）・連携分割店舗001 は、あれば使い、無ければ店舗登録で一度だけ作る。
 *   店舗IDは画面が振る番号（シード表の 423000001 などは指定できない）。ケースの店舗は流し直しでも同じ店舗を使う（作るのは一度だけ）。
 * - 商品コード・商品名・メンバーの名前とログインIDには、実行の印を付ける（依頼者決定 2026-10-28 の案A。開発環境には手動の試験用に、シード表と同じ名前の
 *   メンバー（承認一郎・承認次郎・一般三郎・M04-23試験管理者）が既にいる）。ケースの文の同じ値も印つきで読む。
 *   印を付けないのは、値そのものを確かめるもの（255文字の商品コード）と、「存在しない」ことが前提の商品コード（999991〜999994）だけ。
 * - 在庫数は、シード表のとおり在庫変更CSV登録（入庫/その他・試験データ準備・仕入単価0）で入庫し、別のメンバー（入庫承認者）が在庫編集承認一覧で一括承認する。
 *   流し直しで同じ商品の在庫が残っているとき（印を付けない255文字の商品コード）は、シード表の在庫数に届く分だけ入庫する。
 * - 所属のマスタ（在庫部・承認部・他店舗部・連携在庫部001）は足さない（共有の所属のマスタに足すかは依頼者の判断待ち。M04-02・M04-03 と同じ）。
 *   メンバーの所属は、メンバー登録画面の所属の選択肢の先頭を選ぶ。所属の名前を手順・期待結果が見るケース（004・006・083・084）は実装しない。
 * - 承認権限: 権限「システム管理者」は承認権限あり、「店舗オペレーター」は承認権限なし（開発環境の権限の設定で確かめた）。
 * - 承認通知先のメンバーの選択肢は、店舗を選ぶと、その店舗を編集可能店舗に含む承認権限のあるメンバーになる（画面のスクリプト）。
 *   手順で「承認一郎」を選ぶケース（025・026・028・038・060）は、ケースの店舗を承認一郎の編集可能店舗に足す（正本の外の補い）。
 * - 「受信メール0件であることを確かめる」「試験用の受信箱を用意する」は行わない（メール通知の受信は範囲外。今回の範囲のケースは受信を確かめない）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { 商品コードの規格の件数, 店舗がある, 店舗の在庫数 } from "../db/m04_23";
import {
  ケースの店舗, 試験店舗A, 試験店舗B, 連携分割店舗001, 管理者, 入庫して承認する, 在庫を確かめる, 在庫区分, 店舗を用意する, 無い商品を登録する,
  メンバーを用意する, 編集可能店舗を足す, expect,
} from "../pages/admin/m04_23_setup";
import { csvText, 分割CSVの項目名, 結合CSVの項目名 } from "../pages/admin/m04_23_split_join_csv";

// ---------------------------------------------------------------- アカウント

/** アプリのパスワードの入力規則（アプリの設定 eccube_password_pattern と同じ式） */
const PASSWORD_RULE = /^(?=.*?[a-z])(?=.*?\d)[!-~]+$/i;
/** 正本のパスワードが入力規則に合えば正本の値、合わなければ代わりの値（正本の外の補い） */
const パスワード = (正本: string, 代わり: string): string => (PASSWORD_RULE.test(正本) ? 正本 : 代わり);

const 管理者の = (名前: string, loginId: string, password: string): 管理者 => {
  const id = rc(loginId).toLowerCase();
  return { 名前: rc(名前), account: { loginId: id, password }, email: `${id}@example.test` };
};

/** S-M04-23-AUTH（M04-23試験管理者。正本のパスワード「M0423共通管理者用」は入力規則に合わないので代わりの値） */
export const 試験管理者 = 管理者の("M04-23試験管理者", "m0423_admin", パスワード("M0423共通管理者用", "M0423Admin!21"));
/** シードの入庫を登録するメンバーと、承認するメンバー（シード表の「…を編集可能店舗に含む管理者」「承認権限を持つ管理者」） */
const 入庫登録者 = 管理者の("M04-23入庫登録者", "m0423_stock_reg", "Passw0rd!M0423R");
const 入庫承認者 = 管理者の("M04-23入庫承認者", "m0423_stock_apr", "Passw0rd!M0423A");
/** S-M04-23-MASTER の承認一郎・承認次郎・一般三郎 */
export const 承認一郎 = 管理者の("承認一郎", "m0423_apr1", "Passw0rd!M0423A1");
export const 承認次郎 = 管理者の("承認次郎", "m0423_apr2", "Passw0rd!M0423A2");
export const 一般三郎 = 管理者の("一般三郎", "m0423_gen3", "Passw0rd!M0423G3");
/** S-M04-23-L-ADM（正本のログインID m0423-ladmin・パスワード M0423L-Admin1） */
export const 連携試験管理者 = 管理者の("M04-23連携試験管理者", "m0423-ladmin", パスワード("M0423L-Admin1", "M0423LAdmin!1"));
/** 060・061 のケース専用の管理者（正本のパスワード「分割試験専用六〇」「結合試験専用六一」は入力規則に合わないので代わりの値） */
export const ケースの管理者 = {
  "060": 管理者の("M04-23試験管理者-060", "m0423_admin-060", パスワード("分割試験専用六〇", "M0423Case!60")),
  "061": 管理者の("M04-23試験管理者-061", "m0423_admin-061", パスワード("結合試験専用六一", "M0423Case!61")),
};

/** 001・002 の spec が使う（既存の呼び出し） */
export function m0423Admin(): Account {
  if (!ids.試験管理者) throw new Error("S-M04-23-AUTH をまだ作っていない");
  return 試験管理者.account;
}

// ---------------------------------------------------------------- 店舗と、共通の用意（実行の中で一度だけ）

const ids: Record<string, string> = {};
/** 店舗ID（A・B・ケースの番号・L） */
const 店舗IDs: Record<string, string> = {};

export function 店舗IDの(key: string): string {
  const id = 店舗IDs[key];
  if (!id) throw new Error(`店舗（${key}）をまだ用意していない`);
  return id;
}

let 基本: Promise<void> | null = null;
/** 試験店舗A・B と、試験管理者・入庫登録者・入庫承認者を用意する（この実行で一度だけ） */
function 基本を用意する(browser: Browser, issue: (m: string) => void): Promise<void> {
  if (!基本) {
    基本 = withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      店舗IDs.A = await 店舗を用意する(page, 試験店舗A, issue);
      店舗IDs.B = await 店舗を用意する(page, 試験店舗B, issue);
      ids.試験管理者 = await メンバーを用意する(page, 試験管理者, { 所属店舗ID: 店舗IDs.A, 編集可能店舗ID: [店舗IDs.A] });
      ids.入庫登録者 = await メンバーを用意する(page, 入庫登録者, { 所属店舗ID: 店舗IDs.A, 編集可能店舗ID: [店舗IDs.A, 店舗IDs.B] });
      ids.入庫承認者 = await メンバーを用意する(page, 入庫承認者, { 所属店舗ID: 店舗IDs.A, 編集可能店舗ID: [店舗IDs.A, 店舗IDs.B] });
    });
    基本.catch(() => { 基本 = null; });
  }
  return 基本;
}

/** 在庫区分のラジオが「EC-CUBE」「スマレジ」であることを、在庫変更CSV登録画面で確かめる（シード表 MASTER ⑦・L-MASTER） */
async function 在庫区分を確かめる(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await page.goto(adminUrl("/product/stock/change/new"));
    const radios = page.locator('input[name="admin_stock_change_csv_list[change_stock_location_id]"]');
    await expect(radios.first(), "在庫変更CSV登録の在庫区分").toBeVisible();
    const labels = await radios.evaluateAll((ns) => ns.map((n) => ((n as HTMLInputElement).labels?.item(0)?.textContent ?? "").trim()));
    expect(labels, "在庫変更CSV登録の在庫区分の選択肢").toEqual(["EC-CUBE", "スマレジ"]);
  });
}

// ---------------------------------------------------------------- 共有のシード

defineSeed("S-M04-23-AUTH", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 基本を用意する(browser, issue);
  issue(`正本の店舗ID 423000001・423000002・管理者ID 423000021 は画面で指定できない。店舗は「${試験店舗A.店名}」（店舗ID ${店舗IDs.A}）・「${試験店舗B.店名}」（店舗ID ${店舗IDs.B}）を使い、` +
    `試験管理者は名前・ログインIDに実行の印を付けて作った（${試験管理者.名前}・${試験管理者.account.loginId}。管理者ID ${ids.試験管理者}）`);
  if (試験管理者.account.password !== "M0423共通管理者用") issue(`正本のパスワード「M0423共通管理者用」はメンバー登録画面の入力規則に合わないので、代わりの値「${試験管理者.account.password}」で登録した`);
  issue("権限は「システム管理者」（在庫分割・結合を操作できる）。所属はメンバー登録画面の所属の選択肢の先頭。ケースの店舗は、ケースのシードで編集可能店舗に足す");
  // 作ったアカウントでログインできることを確かめる
  await withAdminSession(browser, 試験管理者.account, async () => undefined);
});

defineSeed("S-M04-23-MASTER", async ({ browser, seed, notes }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 基本を用意する(browser, issue);
  notes.set("〔店舗ID-M0423-共有A〕", 店舗IDs.A);
  notes.set("〔店舗ID-M0423-共有B〕", 店舗IDs.B);
  issue("所属のマスタに「在庫部」「承認部」「他店舗部」を足さなかった（共有の所属のマスタに足すかは依頼者の判断待ち）。所属の名前を見るケース（004・006）は実装していない");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    ids.承認一郎 = await メンバーを用意する(page, 承認一郎, { 所属店舗ID: 店舗IDs.A, 編集可能店舗ID: [店舗IDs.A] });
    ids.承認次郎 = await メンバーを用意する(page, 承認次郎, { 所属店舗ID: 店舗IDs.A, 編集可能店舗ID: [店舗IDs.A] });
    ids.一般三郎 = await メンバーを用意する(page, 一般三郎, { 所属店舗ID: 店舗IDs.A, 編集可能店舗ID: [店舗IDs.A], 権限: "店舗オペレーター" });
  });
  notes.set("〔メンバーID-M0423-共有A〕", ids.承認一郎);
  notes.set("〔メンバーID-M0423-共有B〕", ids.承認次郎);
  notes.set("〔メンバーID-M0423-共有C〕", ids.一般三郎);
  issue(`承認一郎・承認次郎（権限「システム管理者」）・一般三郎（権限「店舗オペレーター」＝承認権限なし）は、名前・ログインIDに実行の印を付けて作った（${承認一郎.名前}・${承認次郎.名前}・${一般三郎.名前}）。` +
    "所属はシード表の在庫部・承認部の代わりに選択肢の先頭、メールアドレスはシード表の approver1@example.test などの代わりにログインIDのアドレス");
  await 在庫区分を確かめる(browser);
});

defineSeed("S-M04-23-L-MASTER", async ({ browser }) => {
  await 在庫区分を確かめる(browser);
});

defineSeed("S-M04-23-L-ADM", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 基本を用意する(browser, issue);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    店舗IDs.L = await 店舗を用意する(page, 連携分割店舗001, issue);
    ids.連携試験管理者 = await メンバーを用意する(page, 連携試験管理者, { 所属店舗ID: 店舗IDs.L, 編集可能店舗ID: [店舗IDs.L] });
    await 編集可能店舗を足す(page, ids.入庫登録者, [店舗IDs.L], `${seed.シードID}: 入庫登録者`);
    await 編集可能店舗を足す(page, ids.入庫承認者, [店舗IDs.L], `${seed.シードID}: 入庫承認者`);
  });
  issue(`正本のログインID「m0423-ladmin」は、実行の印を付けて「${連携試験管理者.account.loginId}」で作った（開発環境に手動の試験用の同じものがありうるため）。` +
    `編集可能店舗は、このシードを使うケースの店舗（${連携分割店舗001.店名}）`);
  if (連携試験管理者.account.password !== "M0423L-Admin1") issue(`正本のパスワードは入力規則に合わないので、代わりの値「${連携試験管理者.account.password}」で登録した`);
  await withAdminSession(browser, 連携試験管理者.account, async () => undefined);
});

// ---------------------------------------------------------------- ケースのシード

/** 正本の商品コードの実際の値（印を付けない: 255文字のもの・存在しないことが前提の 999991〜999994） */
export function 実際のコード(正本: string): string {
  if (正本.length === 255 || /^99999[1-4]$/.test(正本)) return 正本;
  return rc(正本);
}
const 長いコード = (先頭: string, 数字: string) => `${先頭}${数字.repeat(249)}`;

type 店舗の指定 = "A" | "B" | "L" | { 番号: string; 組: "甲" | "乙" };
type 在庫の定め = { 正本: string; 名前?: string; EC?: number; SM?: number };
type ケースの定め = {
  店舗: 店舗の指定;
  /** 作る商品と、シード表の在庫数（EC-CUBE・スマレジ） */
  商品: 在庫の定め[];
  /** 存在しないことが前提の商品コード */
  無いコード?: string[];
  /** 存在しないことが前提の店舗ID（036・037） */
  無い店舗ID?: string;
  /** ケース専用の承認者（正本の名前） */
  承認者?: string[];
  /** 手順で MASTER の承認一郎を選ぶ */
  承認一郎?: boolean;
  /** ケース専用の管理者（060・061） */
  管理者?: "060" | "061";
  /** 承認者（連携）・店舗 L の承認者 */
  連携承認者?: string;
  CSV: { 名前: string; 種類: "分割" | "結合"; 行: (string | number)[][] };
};

export type 用意したケース = {
  店舗ID: string; 店名: string; ファイル名: string; CSV: string;
  /** 正本の名前 → 実際の名前（承認者） */
  承認者: Record<string, string>;
  管理者?: 管理者;
};
const 用意した: Record<string, 用意したケース> = {};
export function ケースの用意(seedId: string): 用意したケース {
  const v = 用意した[seedId];
  if (!v) throw new Error(`${seedId} をまだ作っていない`);
  return v;
}

const 店名の = (s: 店舗の指定): string => (s === "A" ? 試験店舗A.店名 : s === "B" ? 試験店舗B.店名 : s === "L" ? 連携分割店舗001.店名 : ケースの店舗(s.番号, s.組).店名);
const 店舗のキー = (s: 店舗の指定): string => (typeof s === "string" ? s : s.番号);

function defineCaseSeed(seedId: string, d: ケースの定め, needs: string[]): void {
  defineSeed(seedId, { needs }, async ({ browser, seed, notes }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    await 基本を用意する(browser, issue);
    const key = 店舗のキー(d.店舗);
    const 店名 = 店名の(d.店舗);
    const 承認者: Record<string, string> = {};
    let 管理者ID = "";
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      // 店舗（シード表②）。ケースの店舗・連携の店舗は、試験管理者・入庫の登録者と承認者の編集可能店舗に足す（試験店舗B は試験管理者に足さない＝編集不可）
      if (!店舗IDs[key]) {
        店舗IDs[key] = typeof d.店舗 === "string" ? (d.店舗 === "L" ? await 店舗を用意する(page, 連携分割店舗001, issue) : 店舗IDs[d.店舗])
          : await 店舗を用意する(page, ケースの店舗(d.店舗.番号, d.店舗.組), issue);
      }
      const storeId = 店舗IDs[key];
      if (typeof d.店舗 !== "string") await 編集可能店舗を足す(page, ids.試験管理者, [storeId], `${seedId}: 試験管理者`);
      await 編集可能店舗を足す(page, ids.入庫登録者, [storeId], `${seedId}: 入庫登録者`);
      await 編集可能店舗を足す(page, ids.入庫承認者, [storeId], `${seedId}: 入庫承認者`);
      if (d.承認一郎) {
        if (!ids.承認一郎) throw new Error(`${seedId}: 承認一郎（S-M04-23-MASTER）をまだ作っていない`);
        await 編集可能店舗を足す(page, ids.承認一郎, [storeId], `${seedId}: 承認一郎`);
        issue(`承認通知先のメンバーの選択肢は店舗を編集可能店舗に含むメンバーなので、手順で承認一郎を選べるよう、承認一郎（${承認一郎.名前}）の編集可能店舗に「${店名}」を足した（正本の外の補い）`);
      }
      // ケース専用の承認者（シード表⑤。所属は選択肢の先頭）
      for (const name of [...(d.承認者 ?? []), ...(d.連携承認者 ? [d.連携承認者] : [])]) {
        const m = 管理者の(name, `m0423-${seedId.slice(-3)}-apr${Object.keys(承認者).length + 1}`, "Passw0rd!M0423Ap");
        await メンバーを用意する(page, m, { 所属店舗ID: storeId, 編集可能店舗ID: [storeId] });
        承認者[name] = m.名前;
      }
      // ケース専用の管理者（060・061 のシード表⑤）
      if (d.管理者) {
        const m = ケースの管理者[d.管理者];
        管理者ID = await メンバーを用意する(page, m, { 所属店舗ID: storeId, 編集可能店舗ID: [storeId] });
        issue(`ケース専用の管理者は、名前・ログインIDに実行の印を付けて作った（${m.名前}・${m.account.loginId}）` +
          (m.account.password.startsWith("M0423Case") ? `。正本のパスワードは入力規則に合わないので、代わりの値「${m.account.password}」で登録した` : ""));
      }
    });
    const storeId = 店舗IDs[key];

    // 存在しないことが前提のもの
    if (d.無い店舗ID && 店舗がある(d.無い店舗ID)) throw new Error(`${seedId}: 存在しないはずの店舗ID ${d.無い店舗ID} の店舗がある`);
    for (const c of d.無いコード ?? []) {
      const n = 商品コードの規格の件数(c);
      if (n !== 0) throw new Error(`${seedId}: 存在しないはずの商品コード ${c} の商品規格が ${n} 件ある`);
    }

    // 商品（シード表①）と在庫（③④）
    const 商品 = d.商品.map((p) => ({ 商品コード: 実際のコード(p.正本), 商品名: p.名前 ?? `M0423商品${実際のコード(p.正本)}` }));
    if (商品.length) {
      const already = await withAdminSession(browser, 入庫登録者.account, (page) => 無い商品を登録する(page, seedId, 商品, (c) => 商品コードの規格の件数(c) > 0, issue));
      if (already.length) issue(`商品コード ${already.map((c) => c.slice(0, 12) + (c.length > 12 ? "…" : "")).join("・")} の商品は前の実行で登録済みだったので、そのまま使った`);
    }
    const 求める: { 商品コード: string; 在庫区分: 在庫区分; 在庫増減数: number }[] = [];
    for (const p of d.商品) {
      if (p.EC !== undefined) 求める.push({ 商品コード: 実際のコード(p.正本), 在庫区分: "EC-CUBE", 在庫増減数: p.EC });
      if (p.SM !== undefined) 求める.push({ 商品コード: 実際のコード(p.正本), 在庫区分: "スマレジ", 在庫増減数: p.SM });
    }
    const 今 = (code: string, zone: 在庫区分) => 店舗の在庫数(code, storeId, zone === "EC-CUBE" ? 1 : 2);
    const 足す = 求める.map((w) => {
      const now = 今(w.商品コード, w.在庫区分) ?? 0;
      if (now > w.在庫増減数) throw new Error(`${seedId}: ${w.商品コード.slice(0, 20)} の${w.在庫区分}在庫が ${now} で、シード表の ${w.在庫増減数} より多い（入庫では減らせない）`);
      return { ...w, 在庫増減数: w.在庫増減数 - now };
    });
    if (足す.some((x) => x.在庫増減数 > 0)) {
      await 入庫して承認する(browser, seedId, { 登録者: 入庫登録者, 承認者: 入庫承認者, 店舗ID: storeId, 店名, 入庫: 足す }, issue);
    }
    在庫を確かめる(seedId, 今, 求める);

    // 控える番号
    for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
      if (l.startsWith("〔店舗ID-")) notes.set(l, storeId);
      else if (l.startsWith("〔管理者ID-")) notes.set(l, 管理者ID);
    }
    // CSV（シード表の最後の手順「手元のPCで…ファイルを作って保存する」）
    const header = d.CSV.種類 === "分割" ? 分割CSVの項目名 : 結合CSVの項目名;
    const 行 = d.CSV.行.map((r) => r.map((c, i) => (typeof c === "string" && (i === 0 || i === 2) ? 実際のコード(c) : c)));
    用意した[seedId] = {
      店舗ID: storeId, 店名, ファイル名: d.CSV.名前, CSV: csvText(header, 行), 承認者,
      ...(d.管理者 ? { 管理者: ケースの管理者[d.管理者] } : {}),
    };
  });
}

const 甲 = (番号: string) => ({ 番号, 組: "甲" as const });
const 乙 = (番号: string) => ({ 番号, 組: "乙" as const });
const MASTER = ["S-M04-23-AUTH", "S-M04-23-MASTER"];
const 分割の基本 = (): 在庫の定め[] => [{ 正本: "410001", EC: 100 }, { 正本: "410002", EC: 0 }];
const 結合の基本: 在庫の定め[] = [{ 正本: "420001", EC: 0 }, { 正本: "420002", SM: 100 }];
const split_ok = (番号: string) => ({ 名前: `split_ok-${番号}.csv`, 種類: "分割" as const, 行: [["410001", 10, "410002", 10]] });
const join_ok = (番号: string) => ({ 名前: `join_ok-${番号}.csv`, 種類: "結合" as const, 行: [["420001", 10, "420002", 2, 10]] });

defineCaseSeed("S-M04-23-CASE-009", { 店舗: "B", 商品: 分割の基本(), CSV: split_ok("009") }, MASTER);
defineCaseSeed("S-M04-23-CASE-010", { 店舗: "B", 商品: 結合の基本, CSV: join_ok("010") }, MASTER);
for (const n of ["013", "014", "015"]) {
  defineCaseSeed(`S-M04-23-CASE-${n}`, { 店舗: 甲(n), 商品: 分割の基本(), 承認者: [`承認一郎-${n}`], CSV: split_ok(n) }, MASTER);
}
for (const n of ["017", "018", "019"]) defineCaseSeed(`S-M04-23-CASE-${n}`, { 店舗: 甲(n), 商品: 結合の基本, CSV: join_ok(n) }, MASTER);
defineCaseSeed("S-M04-23-CASE-025", {
  店舗: 甲("025"), 商品: [{ 正本: "410002", EC: 0 }], 無いコード: ["999991"], 承認一郎: true,
  CSV: { 名前: "split_unknown_source-025.csv", 種類: "分割", 行: [["999991", 10, "410002", 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-026", {
  店舗: 甲("026"), 商品: [{ 正本: "410001", EC: 100 }], 無いコード: ["999992"], 承認一郎: true,
  CSV: { 名前: "split_unknown_destination-026.csv", 種類: "分割", 行: [["410001", 10, "999992", 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-028", {
  店舗: 甲("028"), 商品: [{ 正本: "410005", EC: 9 }, { 正本: "410006", EC: 0 }], 承認一郎: true,
  CSV: { 名前: "split_insufficient-028.csv", 種類: "分割", 行: [["410005", 10, "410006", 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-029", {
  店舗: 甲("029"), 商品: [{ 正本: "420002", SM: 100 }], 無いコード: ["999993"],
  CSV: { 名前: "join_unknown_destination-029.csv", 種類: "結合", 行: [["999993", 10, "420002", 2, 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-030", {
  店舗: 甲("030"), 商品: [{ 正本: "420001", EC: 0 }], 無いコード: ["999994"],
  CSV: { 名前: "join_unknown_source-030.csv", 種類: "結合", 行: [["420001", 10, "999994", 2, 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-033", {
  店舗: 甲("033"), 商品: [{ 正本: "420001", EC: 0 }, { 正本: "420005", SM: 9 }],
  CSV: { 名前: "join_insufficient-033.csv", 種類: "結合", 行: [["420001", 10, "420005", 2, 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-036", { 店舗: 甲("036"), 商品: 分割の基本(), 無い店舗ID: "999999", CSV: split_ok("036") }, MASTER);
defineCaseSeed("S-M04-23-CASE-037", { 店舗: 甲("037"), 商品: 結合の基本, 無い店舗ID: "999999", CSV: join_ok("037") }, MASTER);
defineCaseSeed("S-M04-23-CASE-038", { 店舗: 甲("038"), 商品: 分割の基本(), 承認一郎: true, CSV: split_ok("038") }, MASTER);
const 長041 = { 元: 長いコード("423041", "1"), 先: 長いコード("423041", "2") };
const 長043 = { 先: 長いコード("423043", "2"), 元: 長いコード("423043", "4") };
defineCaseSeed("S-M04-23-CASE-041", {
  店舗: 甲("041"), 承認者: ["承認一郎-041"],
  商品: [{ 正本: 長041.元, 名前: "M0423長コード商品423041-1", EC: 100 }, { 正本: 長041.先, 名前: "M0423長コード商品423041-2", EC: 0 }],
  CSV: { 名前: "split_code_255-041.csv", 種類: "分割", 行: [[長041.元, 1, 長041.先, 1]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-043", {
  店舗: 甲("043"),
  商品: [{ 正本: 長043.先, 名前: "M0423長コード商品423043-2", EC: 0 }, { 正本: 長043.元, 名前: "M0423長コード商品423043-4", SM: 100 }],
  CSV: { 名前: "join_code_255-043.csv", 種類: "結合", 行: [[長043.先, 1, 長043.元, 2, 1]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-045", {
  店舗: 甲("045"), 商品: 分割の基本(), 承認者: ["承認一郎-045"],
  CSV: { 名前: "split_quantity_min-045.csv", 種類: "分割", 行: [["410001", 0, "410002", 0]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-046", {
  店舗: 甲("046"), 商品: [{ 正本: "410010", EC: 999999999 }, { 正本: "410011", EC: 0 }], 承認者: ["承認一郎-046"],
  CSV: { 名前: "split_quantity_max-046.csv", 種類: "分割", 行: [["410010", 999999999, "410011", 999999999]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-050", {
  店舗: 甲("050"), 商品: 結合の基本,
  CSV: { 名前: "join_quantity_min-050.csv", 種類: "結合", 行: [["420001", 1, "420002", 2, 1]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-051", {
  店舗: 甲("051"), 商品: [{ 正本: "420010", EC: 0 }, { 正本: "420011", SM: 999999999 }],
  CSV: { 名前: "join_quantity_max-051.csv", 種類: "結合", 行: [["420010", 999999999, "420011", 2, 999999999]] },
}, MASTER);
defineCaseSeed("S-M04-23-CASE-060", { 店舗: 甲("060"), 商品: 分割の基本(), 管理者: "060", 承認一郎: true, CSV: split_ok("060") }, ["S-M04-23-MASTER"]);
defineCaseSeed("S-M04-23-CASE-061", { 店舗: 甲("061"), 商品: 結合の基本, 管理者: "061", CSV: join_ok("061") }, ["S-M04-23-MASTER"]);
defineCaseSeed("S-M04-23-L-CASE-063", {
  店舗: "L", 連携承認者: "承認連携001",
  商品: [{ 正本: "810001", 名前: rc("分割元連携カードA"), EC: 100 }, { 正本: "810002", 名前: rc("分割先連携カードB"), EC: 0 }],
  CSV: { 名前: "split-ok-L001.csv", 種類: "分割", 行: [["810001", 10, "810002", 10]] },
}, ["S-M04-23-L-ADM"]);
defineCaseSeed("S-M04-23-GF-069", {
  店舗: 甲("069"), 商品: [{ 正本: "M0423-069-A", EC: 0 }, { 正本: "M0423-069-B", EC: 100 }],
  CSV: { 名前: "M0423-069-join-src1.csv", 種類: "結合", 行: [["M0423-069-A", 10, "M0423-069-B", 1, 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-DPS-075", {
  店舗: 乙("075"), 承認者: ["承認通知先M0423-075"],
  商品: [{ 正本: "M0423-075-A", EC: 100 }, { 正本: "M0423-075-B", EC: 0 }, { 正本: "M0423-075-C", EC: 0 }],
  CSV: { 名前: "M0423-075-split-2dst.csv", 種類: "分割", 行: [["M0423-075-A", 10, "M0423-075-B", 10], ["M0423-075-A", 10, "M0423-075-C", 10]] },
}, MASTER);
for (const n of ["076", "077"]) {
  defineCaseSeed(`S-M04-23-DPS-${n}`, {
    店舗: 乙(n), 商品: [{ 正本: `M0423-${n}-A`, EC: 0 }, { 正本: `M0423-${n}-B`, SM: 100 }, { 正本: `M0423-${n}-C`, SM: 50 }],
    CSV: { 名前: `M0423-${n}-join-2src.csv`, 種類: "結合", 行: [[`M0423-${n}-A`, 10, `M0423-${n}-B`, 2, 10], [`M0423-${n}-A`, 10, `M0423-${n}-C`, 2, 20]] },
  }, MASTER);
}
defineCaseSeed("S-M04-23-DPS-078", {
  店舗: 乙("078"), 承認者: ["承認通知先M0423-078"], 商品: [{ 正本: "M0423-078-A", EC: 10 }, { 正本: "M0423-078-B", EC: 0 }],
  CSV: { 名前: "M0423-078-split-eq.csv", 種類: "分割", 行: [["M0423-078-A", 10, "M0423-078-B", 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-DPS-079", {
  店舗: 乙("079"), 商品: [{ 正本: "M0423-079-A", EC: 0 }, { 正本: "M0423-079-B", SM: 10 }],
  CSV: { 名前: "M0423-079-join-eq.csv", 種類: "結合", 行: [["M0423-079-A", 10, "M0423-079-B", 2, 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-DPS-080", {
  店舗: 乙("080"), 商品: [{ 正本: "M0423-080-A", EC: 0 }, { 正本: "M0423-080-B", EC: 100 }],
  CSV: { 名前: "M0423-080-join-src1.csv", 種類: "結合", 行: [["M0423-080-A", 10, "M0423-080-B", 1, 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-DPS-081", {
  店舗: 乙("081"), 承認者: ["承認通知先M0423-081"], 商品: [{ 正本: "M0423-081-A", SM: 100 }, { 正本: "M0423-081-B", SM: 0 }],
  CSV: { 名前: "M0423-081-split-smaregi.csv", 種類: "分割", 行: [["M0423-081-A", 10, "M0423-081-B", 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-CBJEC-085", {
  店舗: "A", 商品: [{ 正本: "M0423-CB085-A", EC: 0, SM: 0 }, { 正本: "M0423-CB085-B", EC: 100, SM: 50 }],
  CSV: { 名前: "m0423-cb085-join.csv", 種類: "結合", 行: [["M0423-CB085-A", 10, "M0423-CB085-B", 1, 10]] },
}, MASTER);
defineCaseSeed("S-M04-23-CBJSM-086", {
  店舗: "A", 商品: [{ 正本: "M0423-CB086-A", EC: 0, SM: 0 }, { 正本: "M0423-CB086-B", EC: 50, SM: 100 }],
  CSV: { 名前: "m0423-cb086-join.csv", 種類: "結合", 行: [["M0423-CB086-A", 10, "M0423-CB086-B", 2, 10]] },
}, MASTER);
