/**
 * M05-24 出荷実績入力用CSV出力の画面シード。正本: cases/M05-24_seed_data.tsv
 * 作り方は M05-22（seeds/m05-22.ts）の出荷指示リストのシードと同じ。
 * 1. 商品（S-M05-24-MASTER）: 共有の商品 M0524-COMMON をグッズ商品CSV登録で1つ作り、本店・EC-CUBE に入庫して別のメンバーが承認する（印つき）。
 * 2. 会員: 受注ごとに、フロントの新規会員登録で本会員を作る（seeds/f06-member.ts の 本会員を作る。メールの前半に実行の印）。
 * 3. 受注: 会員でフロントにログインし、共有の商品を数量1でカートに入れて注文する。続けて注文する。
 * 4. 受注情報編集: お届け先の姓（009）・国と都道府県（012）・注文者の住所（010 の旧住所）を画面で入れる。
 * 5. 出荷指示リスト: 出荷指示リスト検索の生成欄で、注文番号の範囲で生成する。範囲に入るのが自分の受注だけであることを DB の参照で確かめてから生成する
 *    （M05-22 と同じ）。生成で対応状況は「出荷指示」になる。
 * 6. 会員の現在値（010 の新しい値・011 の誕生日・012 の国と住所3）: 管理画面の会員登録/編集で入れる（受注のあとで会員を変えた状態）。
 * 7. DB での書き足し（E2E の行だけ。db/m05_07_24.ts・db/m05_10.ts）: 注文日・入金日・注文確定日・出荷指示日・出荷日（011）、
 *    会員の性別・職業の未設定（008）、2件目の配送（009）、受注から会員を外す（026。ゲスト受注）。どれも画面で指定できない値。
 *
 * シードでの解釈（正本の外の補い。記録 review/M05-24_progress_2026-11-11_dev.md にも書く）:
 * - 配送方法「宅配便」は開発環境の「ゆうパック」で読み替えた（M05-22 と同じ。配送方法のマスタは全員が使うので足さない）。
 * - 支払方法「クレジットカード決済」は、フロントの注文で選べる外部の決済画面へ移らない支払方法で読み替えた（期待結果は支払方法を見ない）。
 * - メールアドレス（m0524-004-01@example.test・old@example.test・new@example.test など）は、前の実行の会員と重ならないよう実行の印を付けた
 *   （ケースの文の同じ値も印つきで読む）。
 * - 都道府県「海外」は「日本国外」、国「日本」は「Japan」、「米国」は「United States」。
 * - 009 の第二配送先の配送ID（4052400902）は指定できないので、DB が振る番号を使う。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 受注IDの, 受注の配送先ID } from "../db/m05_09";
import { 受注から会員を外す } from "../db/m05_10";
import { 受注の出荷指示リスト, 注文番号の範囲の受注 } from "../db/m05_21";
import { 受注の対応状況名 } from "../db/m05_22";
import { 会員IDの, 会員の性別と職業を外す, 会員の値, 受注の日時, 受注の日時を書き足す, 受注の明細IDの一覧, 商品規格IDの, 二件目の配送を足す } from "../db/m05_07_24";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { 出荷指示リストを生成する } from "../pages/admin/m05_20_standby";
import { OrderEditPage } from "../pages/admin/m05_11_order_edit";
import { 範囲で出荷指示リストを生成する } from "../pages/admin/m05_21_picking";
import { 住所の入力, 住所を入れる, 受注情報編集を開く } from "../pages/admin/m05_09_delivery_slips";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { 会員が商品を注文する } from "../pages/front/m05_front_order";
import { markedMail, 本会員を作る } from "./f06-member";

/** 開発環境に手動テスト用の同じログインIDのメンバーがあることがある（M03-26・M03-27 で起きた）ので、実行の印つきで作る */
export const M0524_ADMIN: Account = { loginId: rc("m0524_admin").toLowerCase(), password: "Passw0rd!M0524" };
const PW = "Passw0rd!M0524C";
const 共有の商品コード = () => rc("M0524-COMMON");

defineSeed("S-M05-24-ADM", async ({ browser, seed }) => {
  await ensureM05Admin(browser, { 名前: rc("M05-24試験管理者"), account: M0524_ADMIN, メール: `${M0524_ADMIN.loginId}@example.test` });
  reportSeedIssue(seed.シードID, "権限は出荷指示リスト・受注CSV出力・出荷実績インポートを操作できる「システム管理者」、所属店舗・既定の検索店舗は本店。ログインID・名前に実行の印を付けた（開発環境に同じログインIDのメンバーがありうるため）");
});

let 共有の商品ID = "";
defineSeed("S-M05-24-MASTER", async ({ browser, notes, seed }) => {
  if (!共有の商品ID) {
    const [made] = await 商品を作って入庫する(browser, seed.シードID, [{ 商品コード: 共有の商品コード(), 商品名: rc("M05-24試験商品"), 価格: "1000", 入庫数: 30 }], (m) => reportSeedIssue(seed.シードID, m));
    共有の商品ID = made.productId;
  }
  notes.set("〔商品ID-M0524-共有〕", 共有の商品ID);
  notes.set("〔商品規格ID-M0524-共有〕", 商品規格IDの(共有の商品コード()));
  reportSeedIssue(seed.シードID, "店舗（本店＝店舗ID 1）・都道府県・国・対応状況・配送方法は開発環境に既にあるものを使った（マスタは共有なので書き換えない）。宅配便＝ゆうパック、都道府県「海外」＝日本国外、国「日本」＝Japan・「米国」＝United States。共有の商品 M0524-COMMON は実行の印つきで作った");
});

// ---- ケース専用のシード ----

type 会員の現在値 = {
  姓?: string; 名?: string; セイ?: string; メイ?: string; 郵便番号?: string; 都道府県?: string; 住所1?: string; 住所2?: string; 住所3?: string;
  メールの前半?: string; 電話?: [string, string, string]; FAX?: [string, string, string]; 国?: string; 誕生日?: [string, string, string];
};
type 受注の定め = {
  /** 会員のメールの前半（印を付ける） */
  メール: string; 姓?: string; 名?: string;
  注文者?: 住所の入力; お届け先?: 住所の入力;
  /** 生成のあとで会員の現在値を変える（管理画面の会員登録/編集） */
  会員を変える?: 会員の現在値;
  /** DB で書き足すもの（画面で指定できない状態） */
  日時?: 受注の日時; 性別と職業なし?: true; 二件目の配送の姓?: string; 会員なし?: true;
};
type 定め = { 受注: 受注の定め[] };

const 定めの表: Record<string, 定め> = {
  "BASE-004": { 受注: [{ メール: "m0524-004-01" }, { メール: "m0524-004-02" }] },
  "OPTIONAL-008": { 受注: [{ メール: "m0524-008", 性別と職業なし: true }] },
  "MULTI-SHIPPING-009": { 受注: [{ メール: "m0524-009", お届け先: { 姓: "第一配送先" }, 二件目の配送の姓: "第二配送先" }] },
  "MEMBER-CHANGED-010": {
    受注: [{
      メール: "m0524-010-old", 姓: "旧姓", 名: "旧名", 注文者: { 姓: "旧姓", 名: "旧名", 住所1: "旧住所" },
      会員を変える: {
        姓: "新姓", 名: "新名", セイ: "シンセイ", メイ: "シンメイ", 郵便番号: "1600022", 都道府県: "東京都", 住所1: "新宿区新宿", 住所2: "1-2-3", 住所3: "新住所3",
        メールの前半: "m0524-010-new", 電話: ["03", "1111", "2222"], FAX: ["03", "3333", "4444"], 国: "Japan",
      },
    }],
  },
  "DATETIME-011": {
    受注: [{
      メール: "m0524-011", 会員を変える: { 誕生日: ["1980", "1", "2"] },
      日時: { 注文日: "2026-08-01 09:10:11", 入金日: "2026-08-02 10:20:30", 注文確定日: null, 出荷指示日: null, 出荷日: null },
    }],
  },
  "OVERSEAS-012": {
    受注: [{
      メール: "m0524-012", お届け先: { 国: "United States", 都道府県: "日本国外", 海外郵便番号: "10012" },
      会員を変える: { 国: "United States", 都道府県: "日本国外", 住所3: "Building 5, Floor 2" },
    }],
  },
  "BASE-017": { 受注: [{ メール: "m0524-017" }] },
  "BASE-018": { 受注: [{ メール: "m0524-018" }] },
  "BASE-019": { 受注: [{ メール: "m0524-019" }] },
  "CBREFNONE-025": { 受注: [{ メール: "cbm0524-025" }] },
  "CBGUESTKNOWN-026": { 受注: [{ メール: "cbm0524-026", 会員なし: true }] },
};

/** シードが作ったもの（spec が使う） */
export type 作ったもの = { 会員メール: string[]; 会員ID: string[]; 受注ID: string[]; 注文番号: string[]; 配送先ID: string[][]; 出荷指示リストID: string };
const 作った = new Map<string, 作ったもの>();
export function 作ったものの(seedId: string): 作ったもの {
  const v = 作った.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}
/** 会員のメールアドレス（前半に実行の印） */
export const 会員のメール = (前半: string) => markedMail(前半);

async function 生成する(browser: Browser, seedId: string, 注文番号: string[], 持ち主: string[]): Promise<void> {
  const from = 注文番号[0], to = 注文番号[注文番号.length - 1];
  if (注文番号.length > 1 && Number(to) !== Number(from) + 注文番号.length - 1) {
    throw new Error(`${seedId}: 続けて注文した受注の注文番号 ${注文番号.join("・")} が連続していない（間にほかの方の注文が入った）。範囲で生成するとほかの方の受注を巻き込むので止める`);
  }
  const 範囲 = 注文番号の範囲の受注(from, to);
  const 自分 = new Set(注文番号);
  const 他 = 範囲.filter((r) => !自分.has(r.注文番号) || !持ち主.includes(r.メール));
  if (他.length > 0 || 範囲.length !== 注文番号.length) throw new Error(`${seedId}: 注文番号 ${from}〜${to} の範囲に自分の受注以外が入っている。生成すると巻き込むので止める`);
  await withAdminSession(browser, M0524_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    if (注文番号.length === 1) await 出荷指示リストを生成する(page, from, seedId);
    else await 範囲で出荷指示リストを生成する(page, from, to, seedId);
  });
}

/** 管理画面の会員登録/編集で会員の現在値を入れて登録する（郵便番号の自動入力が住所を上書きしないよう、郵便番号を先に入れて少し待つ） */
async function 会員を変える(browser: Browser, seedId: string, 会員ID: string, v: 会員の現在値): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const e = new M08CustomerEditPage(page);
    const st = await e.open(会員ID);
    if (st !== 200) throw new Error(`${seedId}: 会員ID ${会員ID} の会員登録/編集画面の応答 ${st}`);
    if (v.国 !== undefined) await e.選ぶ("country", v.国);
    if (v.郵便番号 !== undefined) {
      const d = v.郵便番号.replace(/\D/g, "");
      await e.set("postalCode][postalCode01", d.slice(0, 3)); await e.set("postalCode][postalCode02", d.slice(3));
      await page.waitForTimeout(2_000);
    }
    if (v.都道府県 !== undefined) await e.選ぶ("address][pref", v.都道府県);
    if (v.姓 !== undefined) await e.set("name][name01", v.姓);
    if (v.名 !== undefined) await e.set("name][name02", v.名);
    if (v.セイ !== undefined) await e.set("kana][kana01", v.セイ);
    if (v.メイ !== undefined) await e.set("kana][kana02", v.メイ);
    if (v.住所1 !== undefined) await e.set("address][addr01", v.住所1);
    if (v.住所2 !== undefined) await e.set("address][addr02", v.住所2);
    if (v.住所3 !== undefined) await e.set("address][addr03", v.住所3);
    if (v.メールの前半 !== undefined) await e.set("email", markedMail(v.メールの前半));
    if (v.電話) { await e.set("tel][tel01", v.電話[0]); await e.set("tel][tel02", v.電話[1]); await e.set("tel][tel03", v.電話[2]); }
    if (v.FAX) { await e.set("fax][fax01", v.FAX[0]); await e.set("fax][fax02", v.FAX[1]); await e.set("fax][fax03", v.FAX[2]); }
    if (v.誕生日) { await e.値で選ぶ("birth][year", v.誕生日[0]); await e.値で選ぶ("birth][month", v.誕生日[1]); await e.値で選ぶ("birth][day", v.誕生日[2]); }
    await e.登録する("続行");
    const ok = await e.成功メッセージ();
    if (!ok) throw new Error(`${seedId}: 会員ID ${会員ID} の会員登録/編集で保存の表示が出ない（エラー: ${(await e.エラー文()).join(" / ") || "なし"}）`);
  });
}

async function 作る(browser: Browser, seedId: string, notes: Notes, d: 定め): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 番号 = /-(\d{3})$/.exec(seedId)?.[1] ?? "";
  if (!共有の商品ID) throw new Error(`${seedId}: 共有の商品（S-M05-24-MASTER）がまだ無い`);

  // 1. 会員（受注ごと）
  const メール: string[] = [];
  const 会員ID: string[] = [];
  for (const o of d.受注) {
    await 本会員を作る(browser, { 姓: o.姓 ?? "出荷実績", 名: o.名 ?? `会員${番号}`, セイ: "シュッカジッセキ", メイ: "カイイン", 前半: o.メール, パスワード: PW });
    メール.push(会員のメール(o.メール)); 会員ID.push(会員IDの(会員のメール(o.メール)));
  }

  // 2. 受注（続けて注文する）
  const 注文番号: string[] = [];
  const 受注ID: string[] = [];
  for (const [i] of d.受注.entries()) {
    const n = await 会員が商品を注文する(browser, { メール: メール[i], パスワード: PW }, [{ 商品ID: 共有の商品ID, 数量: 1 }], `${seedId}: ${i + 1}件目の受注`);
    注文番号.push(n); 受注ID.push(受注IDの(n, メール[i]));
  }

  // 3. 受注情報編集（注文者・お届け先）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [i, o] of d.受注.entries()) {
      if (!o.注文者 && !o.お届け先) continue;
      await 受注情報編集を開く(page, 受注ID[i]);
      if (o.注文者) await 住所を入れる(page, "注文者", o.注文者);
      if (o.お届け先) await 住所を入れる(page, "お届け先", o.お届け先);
      const warnings = await new OrderEditPage(page).受注情報を登録する((m) => issue(`${注文番号[i]}: 受注情報の登録の確認「${m}」`));
      for (const w of warnings) issue(`${注文番号[i]}: 受注情報の登録の警告「${w}」`);
    }
  });

  // 4. 出荷指示リスト（範囲に入るのが自分の受注だけかを確かめてから生成する）
  await 生成する(browser, seedId, 注文番号, メール);
  const per = 受注ID.map((id) => 受注の出荷指示リスト(id));
  if (per.some((x) => x.length !== 1) || new Set(per.map((x) => x[0])).size !== 1) throw new Error(`${seedId}: 生成した出荷指示リストに受注がそろって入っていない`);
  const リスト = per[0][0];
  for (const id of 受注ID) {
    const st = 受注の対応状況名(id);
    if (st !== "出荷指示") throw new Error(`${seedId}: 生成のあとの受注ID ${id} の対応状況が「${st}」（「出荷指示」のはず）`);
  }

  // 5. DB での書き足し（E2E の行だけ。会員を外すのは最後）
  const 書いた: string[] = [];
  const 配送先ID: string[][] = 受注ID.map((id) => 受注の配送先ID(id));
  for (const [i, o] of d.受注.entries()) {
    if (o.日時) { 受注の日時を書き足す(seedId, 受注ID[i], メール[i], o.日時); 書いた.push(`${注文番号[i]} の ${Object.entries(o.日時).map(([a, b]) => `${a}=${b ?? "未設定"}`).join("・")}`); }
    if (o.性別と職業なし) {
      const c = 会員の値(会員ID[i]);
      if (c.性別 || c.職業) { 会員の性別と職業を外す(seedId, メール[i]); 書いた.push(`会員 ${会員ID[i]} の性別・職業を未設定（会員登録で${c.性別 ? "性別" : ""}${c.職業 ? "職業" : ""}が入っていた）`); }
    }
    if (o.二件目の配送の姓) {
      const id = 二件目の配送を足す(seedId, 受注ID[i], メール[i], o.二件目の配送の姓);
      配送先ID[i].push(id); 書いた.push(`${注文番号[i]} に2件目の配送（${id}・姓 ${o.二件目の配送の姓}）`);
    }
  }
  // 6. 会員の現在値（受注のあとで会員を変える。メールアドレスが変わると持ち主を確かめられないので、DB の書き足しのあと）
  for (const [i, o] of d.受注.entries()) {
    if (!o.会員を変える) continue;
    await 会員を変える(browser, seedId, 会員ID[i], o.会員を変える);
    issue(`会員 ${会員ID[i]} の現在値を管理画面の会員登録/編集で変えた（${Object.keys(o.会員を変える).join("・")}）`);
    if (o.会員を変える.メールの前半) メール[i] = 会員のメール(o.会員を変える.メールの前半);
  }
  for (const [i, o] of d.受注.entries()) {
    if (o.会員なし) { 受注から会員を外す(seedId, 受注ID[i], メール[i]); 書いた.push(`${注文番号[i]} の受注から会員を外した（ゲスト受注）`); }
  }
  if (書いた.length) issue(`DB で書き足した（E2E の行だけ）: ${書いた.join("・")}`);

  作った.set(seedId, { 会員メール: メール, 会員ID, 受注ID, 注文番号, 配送先ID, 出荷指示リストID: リスト });

  // 呼び名を控える（シード表の文に出る呼び名だけ）
  const 文字 = (i: number) => (d.受注.length > 1 ? "AB"[i] : "");
  const v: Record<string, string> = { [`〔出荷指示リストID-M0524-${番号}〕`]: リスト };
  for (const [i] of d.受注.entries()) {
    const s = 文字(i);
    v[`〔受注ID-M0524-${番号}${s}〕`] = 受注ID[i];
    v[`〔注文番号-M0524-${番号}${s}〕`] = 注文番号[i];
    v[`〔会員ID-M0524-${番号}${s}〕`] = 会員ID[i];
    v[`〔配送先ID-M0524-${番号}${s}〕`] = 配送先ID[i][0];
    v[`〔受注明細ID-M0524-${番号}${s}〕`] = 受注の明細IDの一覧(受注ID[i])[0] ?? "";
  }
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (!(label in v)) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, v[label]);
  }
}

for (const [k, d] of Object.entries(定めの表)) {
  const seedId = `S-M05-24-${k}`;
  defineSeed(seedId, { needs: ["S-M05-24-ADM", "S-M05-24-MASTER"] }, async ({ browser, notes }) => 作る(browser, seedId, notes, d));
}
