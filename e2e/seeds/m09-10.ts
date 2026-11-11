/**
 * M09-10 支店トップページ管理 のシード（実装したケースが使うもの）。正本: cases/M09-10_seed_data.tsv
 *
 * - タグの名称・商品コード・商品名は決め打ちの識別の値なので、実行の印を付ける（依頼者決定 2026-10-28）。
 * - 店舗は、実行の印を付けて毎回登録しない（店舗を登録すると全商品の初期在庫が作られ、共有の開発環境に店舗と在庫が増え続けるため。依頼者決定 2026-11-11）。
 *   固定の名前・略称・支店URLの試験店舗14店（「支店トップ試験-M0910-A」〜「-P」）を、無いときだけ作り、あれば使い回す（M10-15・M05-27 と同じ考え方）。
 *   正本の店名・省略名は、シードごとに割り当てた試験店舗の名前・支店URLに読み替える（共有の環境には本物の「トーナメントセンター 東京」（支店URL tc）もあるので、正本の名前のままでは作れない）。
 *   共有可のシードは1店ずつ専用（ワーカーごとに1回だけ作るので、ほかのシードが同じ店を書き換えないように）。ケース専用のシードは、種類ごとに店を分け、
 *   ケースの直前に毎回その店の設定を前提どおりに入れ直す（タイル・在庫・ピックアップ設定を試験店舗の分だけ DB で空に戻してから、画面で設定する）。ケースは直列で流す前提。
 * - 正本の「省略名」は、画面では支店URL（店舗登録の支店URL）。ハイフンを含む省略名はDBへ直接設定する作り方なので、
 *   画面で入れられる半角英数字の試験店舗の支店URLをそのまま省略名として使う（PM 方針 2026-11-10「画面で作れるものは代える」。条件付き）。
 * - タイルIDは画面に出ないので、シード表のとおり登録後に登録内容を参照して控える。DB確認の接続が無い環境では、
 *   「どの支店の何行目のタイルか」を文で控え、そのことをシードの問題として報告する（タイルIDそのものを使うのはDB確認のケースだけ）。
 * - 依頼者の方針（2026-11-10）: 支店共通（支店ID 1）・既存の支店のバナー画像・リンクタグ・タイルは書き換えない・消さない。
 *   S-M09-10-COMMON（支店共通へ書く）は、書き換えず、いまの内容を読むだけにする。支店共通の内容そのものを前提にするシード
 *   （CBCOMMONKEEP-053・CBCOMMONNEW-054・DP-APPLIED/UNAPPLIED-049・CBFMTNONE-057・CBLATESTCOM-060・CBPICKCOM-061・CBOTHERCOM-063・CBNOTILECOM-065）は書かない。
 * - 画面で作れない準備（バナー画像を空にする・タイルを消す・タイルタグを空にする・ピックアップ対象にする）は、この実行で画面から作った
 *   固定の名前の試験店舗と「実行の印つき」の商品に限り、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） でDBへ書く（注記に「DBで〜した」を残す）。
 * - 支店の登録と、支店トップページの設定（LOCAL 系）は全権限の管理者（SETUP_ADMIN）で行う（F01-02 と同じ）。
 *   商品の在庫を入れる支店（033・048・052・058・064）は、在庫編集の登録者と承認者を別のメンバーにする。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { writeTestData } from "../db/write_adapter";
import { available as DBがある } from "../lib/db";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Notes } from "../lib/notes";
import { Account, withAdminSession } from "../lib/session";
import { findTenantId } from "../pages/admin/tenant";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { ensureMember } from "../pages/admin/member";
import { タグを付けて商品を登録する, タグを用意する } from "../pages/admin/f01_02_setup";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { openProductEditByCode, publishImportedClass, readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";
import {
  タイル入力, 支店トップページ管理, 支店トップページを設定する, 支店を用意する, 新バナー画像, 旧バナー画像, 画像ファイル, 編集可能店舗に加える,
} from "../pages/admin/m09_10_branch_toppage";
import { 支店のタイル } from "../db/m09_10_branch_toppage";
import { ensureAnalysisAdmin } from "./m12-common";

export const M0910_ADMIN: Account = { loginId: "m0910_admin", password: "Passw0rd!M0910" };

/** 正本の店名・タグの名称・商品コードなどに実行の印を付けた値 */
export const 印 = (正本: string): string => rc(正本);
/** 正本の支店URL（省略名）から、画面で入れられる支店URL（半角英数字＋印の小文字）を作る */
export const 支店URL = (正本: string): string => `${正本.replace(/[^0-9A-Za-z]/g, "").toLowerCase()}${RUN_MARK.toLowerCase()}`;

/** S-M09-10-TAGS の4つのタグ（正本の名称） */
export const 共有タグ = { 共通: "M0910共通バナータグ", A: "M0910バナータグA", B: "M0910バナータグB", その他: "M0910その他タグ" } as const;
export const タグ名 = (k: keyof typeof 共有タグ): string => 印(共有タグ[k]);

/** タイル（正本の「1行目=セレクトボックス1番目・フォーマット別特集・タグA、2行目=2番目・最新エキスパンション・タグB、3行目=3番目・ピックアップ商品、4行目=4番目・その他・その他タグ」） */
export const 標準のタイル = (): タイル入力[] => [
  { 位置: 1, 属性: "フォーマット別特集", タグ: タグ名("A") },
  { 位置: 2, 属性: "最新エキスパンション", タグ: タグ名("B") },
  { 位置: 3, 属性: "ピックアップ商品", タグ: null },
  { 位置: 4, 属性: "その他", タグ: タグ名("その他") },
];
/** 正本の例「4行とも『ピックアップ商品』でタイルタグは選ばない」 */
const 全部ピックアップ = (): タイル入力[] => ([1, 2, 3, 4] as const).map((位置) => ({ 位置, 属性: "ピックアップ商品", タグ: null }));

const issueOf = (seedId: string) => (m: string) => reportSeedIssue(seedId, m);

// ---- 試験店舗（固定の名前・略称・支店URL。無いときだけ作り、あれば使い回す） ----

/** 試験店舗の店名に必ず入る固定の印（DB書き込みの対象の確かめで、試験店舗だけに書くことを確かめる） */
const 店の印 = "-M0910-";
type 試験店舗 = { 店名: string; url: string };
const 試験店舗の表: Record<string, 試験店舗> = Object.fromEntries(
  ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P"].map((k) => [k, { 店名: `支店トップ試験${店の印}${k}`, url: `m0910${k.toLowerCase()}` }]),
);
/**
 * シードごとの試験店舗。共有可のシード（A〜F）は1店ずつ専用。ケース専用のシードは種類ごとに分ける。
 *   G=支店共通設定を適用の3ケース、H=通常の4タイル、J=タイルが少ない・初期・バナー無し、K=リンク商品あり（033）、
 *   L=タイルに商品を載せる2ケース（048・052）、M=051、N=タイルの表示確認3ケース（058・059・064）、P=ピックアップ（062）
 */
const 店の割当: Record<string, string> = {
  "S-M09-10-LOCAL": "A", "S-M09-10-NO-BANNER": "B", "S-M09-10-PARTIAL": "C", "S-M09-10-ZERO-TILES": "D", "S-M09-10-PUBLIC": "E", "S-M09-10-LEGACY-NOTAG": "F",
  "S-M09-10-COMMON-APPLY-006": "G", "S-M09-10-COMMON-APPLY-007": "G", "S-M09-10-COMMON-APPLY-008": "G",
  "S-M09-10-LOCAL-017": "H", "S-M09-10-LOCAL-018": "H", "S-M09-10-LOCAL-027": "H", "S-M09-10-LOCAL-028": "H", "S-M09-10-LOCAL-029": "H", "S-M09-10-LOCAL-031": "H",
  "S-M09-10-PARTIAL-015": "J", "S-M09-10-INITIAL-047": "J", "S-M09-10-DP-NOBANNER-050": "J",
  "S-M09-10-LOCAL-033": "K",
  "S-M09-10-QI-TILE-048": "L", "S-M09-10-DP-ONEPROD-052": "L",
  "S-M09-10-DP-MIXTILE-051": "M",
  "S-M09-10-CBFMTOWN-058": "N", "S-M09-10-CBLATESTNONE-059": "N", "S-M09-10-CBOTHEROWN-064": "N",
  "S-M09-10-CBPICKOWN-062": "P",
};
const 店の定め = (seedId: string): 試験店舗 => {
  const k = 店の割当[seedId];
  if (!k) throw new Error(`${seedId} に試験店舗を割り当てていない`);
  return 試験店舗の表[k];
};
/** シードの試験店舗の、固定の店名と支店URL（ケースが使う） */
export const 試験店舗の店名 = (seedId: string): string => 店の定め(seedId).店名;
export const 試験店舗の支店URL = (seedId: string): string => 店の定め(seedId).url;

/** 使い回す試験店舗を、前の実行の状態から、ケースの前提（タイル・ピックアップ・在庫が空）へ戻す。試験店舗の分だけ DB で消す */
function 試験店舗を前提の状態に戻す(seedId: string, 支店ID: string, 商品あり: boolean): void {
  const 確かめ = { 対象の確かめ: "select shop_name from dtb_base_info where id = $1", 確かめのparams: [支店ID], 印: 店の印 };
  const t = writeTestData({
    理由: `${seedId}: 使い回す試験店舗の、前の実行で残ったタイルを消す（設定は前提どおりに画面で入れ直す）`,
    sql: "delete from dtb_tile where base_info_id = $1", params: [支店ID], ...確かめ, 最大行数: 50,
  });
  let n = 0;
  if (商品あり) {
    n = writeTestData({
      理由: `${seedId}: 使い回す試験店舗に前の実行の商品の在庫・ピックアップ設定が残ると、タイルの商品が前提と食い違うので、試験店舗の分だけ空に戻す`,
      sql: "update dtb_product_stock set stock = 0, pick_up_flg = false where base_info_id = $1 and (stock > 0 or pick_up_flg = true)",
      params: [支店ID], ...確かめ, 最大行数: 500,
    });
  }
  reportSeedIssue(seedId, `使い回す試験店舗（支店ID ${支店ID}）の前の実行の状態を、DBで試験店舗の分だけ戻した（タイル ${t}行を削除${商品あり ? `・在庫またはピックアップ設定が残った ${n}行を空に` : ""}）`);
}

/** 試験店舗を、あれば使い、無ければ作る。あったときは前提の状態へ戻す。支店IDを返す */
async function 試験店舗を用意する(browser: Browser, seedId: string, 商品あり: boolean): Promise<string> {
  const 店 = 店の定め(seedId);
  const r = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const found = await findTenantId(page, 店.店名);
    return { id: found ?? await 支店を用意する(page, 店.店名, 店.url, issueOf(seedId)), 既存: found !== null };
  });
  if (r.既存) 試験店舗を前提の状態に戻す(seedId, r.id, 商品あり);
  return r.id;
}

// ---- 管理者・タグ・画像・ブラウザ ----

defineSeed("S-M09-10-ADM", async ({ browser }) => {
  // 権限はコンテンツ管理を操作できる「システム管理者」（メンバー管理に、コンテンツ管理だけの権限が無い。M09-04 と同じ）
  await ensureAnalysisAdmin(browser, { 名前: "M09-10試験管理者", account: M0910_ADMIN, メール: "m0910_admin@example.test" });
});

defineSeed("S-M09-10-TAGS", async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const keys = ["共通", "A", "B", "その他"] as const;
    for (let i = 0; i < keys.length; i++) notes.set(`〔タグID-M0910-共有${i + 1}〕`, await タグを用意する(page, タグ名(keys[i]), "S-M09-10-TAGS"));
  });
});

/**
 * S-M09-10-COMMON: 支店共通（支店ID 1）の設定。依頼者の方針により支店共通は書き換えない。
 * 支店共通のいまの内容を読むだけ（タイルIDは、DB確認の接続があれば参照、無ければ文で控える）。ケースは支店共通のいまの内容と比べる・表示を確かめる。
 */
defineSeed("S-M09-10-COMMON", { needs: ["S-M09-10-TAGS"] }, async ({ notes, seed }) => {
  const labels = [1, 2, 3, 4].map((i) => `〔タイルID-M0910-共有共通${i}〕`);
  if (DBがある) {
    const tiles = 支店のタイル("1");
    labels.forEach((l, i) => notes.set(l, tiles[i]?.タイルID ?? `支店共通の${i + 1}行目のタイル（登録なし）`));
  } else {
    labels.forEach((l, i) => notes.set(l, `支店共通の${i + 1}行目のタイル（番号は画面に出ず、DB確認の接続が無いので参照できない）`));
  }
  reportSeedIssue(seed.シードID, "支店共通（支店ID 1）は書き換えない方針のため、シード表の「バナー画像 common-banner.png・M0910共通バナータグ・タイル4件」は作らず、支店共通のいまの登録内容を読むだけにした。"
    + "ケースは支店共通のいまの内容と比べる（シード表の値そのものは確かめない）");
});

defineSeed("S-M09-10-IMAGES", async () => {
  // e2e/fixtures/m09-10 の2つのPNG（新＝青の縦縞、旧＝赤の横縞）。5MB以下で、中身が違うことを確かめる
  const 新 = 新バナー画像(); const 旧 = 旧バナー画像();
  if (新.length > 5 * 1024 * 1024 || 新.subarray(1, 4).toString() !== "PNG") throw new Error("S-M09-10-IMAGES: m0910-new-banner.png が5MB以下のPNGでない");
  if (新.equals(旧)) throw new Error("S-M09-10-IMAGES: m0910-new-banner.png と m0910-old-banner.png の中身が同じ");
});

defineSeed("S-M09-10-QI-BROWSER", async () => { /* 公開側は、ケースのページ（管理画面とは別の、ログインしていない新しいブラウザの状態）を日本語のURL /ja/ で、幅1280pxで開く */ });

/** 連携試験の管理者（登録者）と承認者。支店ごとに編集可能店舗を足していくので、実行の印つきのメンバーにする（前の実行の編集可能店舗と食い違わないように） */
export const QI管理者 = { 名前: () => 印("M09-10連携試験管理者"), account: (): Account => ({ loginId: `m0910qi${RUN_MARK.toLowerCase()}`, password: "Passw0rd-M0910QI" }) };
export const QI承認者 = { 名前: () => 印("M09-10連携試験承認者"), account: (): Account => ({ loginId: `m0910qiap${RUN_MARK.toLowerCase()}`, password: "Passw0rd-M0910QIAP" }) };
const QIのID = new Map<string, string>();

async function QIメンバーを用意する(browser: Browser, who: typeof QI管理者, key: string): Promise<void> {
  const shop = await 本店の店名(browser);
  const a = who.account();
  const id = await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMember(page, {
    名前: who.名前(), 所属店舗: shop, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`, パスワード: a.password,
    権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
  }));
  QIのID.set(key, id);
}
defineSeed("S-M09-10-QI-ADM", async ({ browser }) => { await QIメンバーを用意する(browser, QI管理者, "ADM"); });
defineSeed("S-M09-10-QI-APPROVER", async ({ browser }) => { await QIメンバーを用意する(browser, QI承認者, "APPROVER"); });

// ---- 支店トップページ設定だけの支店（LOCAL 系） ----

type 支店の定め = {
  支店ID呼び名: string;
  画像名: string; タイル: () => タイル入力[];
  /** 1行目から順に控えるタイルIDの呼び名（シード表が控えると定めたものだけ） */
  タイルID呼び名?: string[];
  /** 登録後に、バナー画像欄の画像のURLの末尾のファイル名を控える呼び名 */
  ファイル名呼び名?: string;
  /** バナーリンクタグ（省略すると M0910バナータグA。null は未選択） */
  バナーリンクタグ?: keyof typeof 共有タグ | null;
  /** 画面で作れない準備を、試験店舗にDBで行う（タイルIDを控えたあとに呼ぶ） */
  後処理?: (c: { seedId: string; 支店ID: string }) => void;
};

/** DBで、試験店舗のバナー画像を空にする */
function バナー画像を空にする(c: { seedId: string; 支店ID: string }): void {
  const n = writeTestData({
    理由: `${c.seedId}: バナー画像未設定は画面で指定できないため、試験店舗のバナー画像を空にする`,
    sql: "update dtb_base_info set banner_image = null where id = $1",
    params: [c.支店ID], 対象の確かめ: "select shop_name from dtb_base_info where id = $1", 確かめのparams: [c.支店ID], 印: 店の印, 最大行数: 1,
  });
  reportSeedIssue(c.seedId, `バナー画像未設定は画面で指定できないため、DBで、試験店舗（支店ID ${c.支店ID}）のバナー画像を空にした（${n}行）`);
}
/** DBで、試験店舗のタイルを消す（タイル属性がピックアップ商品のものだけ、または全部） */
function タイルを消す(c: { seedId: string; 支店ID: string }, 範囲: "全部" | "ピックアップ商品"): void {
  const n = writeTestData({
    理由: `${c.seedId}: タイルが少ない状態は画面で指定できない（画面は4行そろえて登録する）ため、試験店舗の仮のタイル（${範囲}）を削除する`,
    sql: 範囲 === "全部" ? "delete from dtb_tile where base_info_id = $1" : "delete from dtb_tile where base_info_id = $1 and tile_type_id = 4",
    params: [c.支店ID], 対象の確かめ: "select shop_name from dtb_base_info where id = $1", 確かめのparams: [c.支店ID], 印: 店の印, 最大行数: 4,
  });
  reportSeedIssue(c.seedId, `画面は4行そろえて登録するため、DBで、試験店舗（支店ID ${c.支店ID}）の仮のタイル（${範囲}）を削除した（${n}行）`);
}
/** DBで、試験店舗のタイルのうち、タイル属性が 属性 のもののタイルタグを空にする */
function タイルタグを空にする(c: { seedId: string; 支店ID: string }, 属性: string): void {
  const n = writeTestData({
    理由: `${c.seedId}: ピックアップ商品以外のタイルタグ未選択は画面で保存できないため、試験店舗の「${属性}」のタイルのタイルタグを空にする`,
    sql: "update dtb_tile set tag_id = null where base_info_id = $1 and tile_type_id in (select id from mtb_tile_type where name = $2)",
    params: [c.支店ID, 属性], 対象の確かめ: "select shop_name from dtb_base_info where id = $1", 確かめのparams: [c.支店ID], 印: 店の印, 最大行数: 4,
  });
  reportSeedIssue(c.seedId, `ピックアップ商品以外のタイルタグ未選択は画面で保存できないため、DBで、試験店舗（支店ID ${c.支店ID}）の「${属性}」のタイルのタイルタグを空にした（${n}行）`);
}
/** DBで、印つきの商品の、支店の在庫のピックアップ設定を有効にする */
function ピックアップにする(seedId: string, 支店ID: string, 商品コード: string[]): void {
  for (const code of 商品コード) {
    const n = writeTestData({
      理由: `${seedId}: ピックアップ対象は画面で指定できないため、この実行で作った印つきの商品（${code}）の、支店の在庫のピックアップ設定を有効にする`,
      sql: "update dtb_product_stock set pick_up_flg = true where base_info_id = $1 and stock_location_id = 1 and product_class_id in (select id from dtb_product_class where product_code = $2)",
      params: [支店ID, code], 対象の確かめ: "select product_code from dtb_product_class where product_code = $1", 確かめのparams: [code], 印: RUN_MARK, 最大行数: 5,
    });
    if (n < 1) throw new Error(`${seedId}: 商品 ${code} の支店 ${支店ID} の在庫が見つからず、ピックアップ設定を有効にできない`);
  }
  reportSeedIssue(seedId, `ピックアップ対象は画面で指定できないため、DBで、画面で作った印つきの商品（${商品コード.join("・")}）の、支店ID ${支店ID} の在庫のピックアップ設定を有効にした`);
}

/** タイルIDを控える。DB確認の接続があれば登録内容を参照し、無ければ「どの支店の何行目か」を文で控える */
function タイルIDを控える(seedId: string, notes: Notes, 支店ID: string, labels: string[]): void {
  if (!DBがある) {
    labels.forEach((l, i) => notes.set(l, `支店ID ${支店ID} の${i + 1}行目のタイル（番号は画面に出ず、DB確認の接続が無いので参照できない）`));
    reportSeedIssue(seedId, "DB確認の接続が無いので、タイルIDを参照できず、どの支店の何行目のタイルかを文で控えた");
    return;
  }
  const tiles = 支店のタイル(支店ID);
  if (tiles.length < labels.length) throw new Error(`${seedId}: 支店ID ${支店ID} のタイルが ${tiles.length} 件（${labels.length} 件のはず）`);
  labels.forEach((l, i) => notes.set(l, tiles[i].タイルID));
}

async function 支店トップの支店を作る(browser: Browser, seedId: string, notes: Notes, d: 支店の定め): Promise<void> {
  const issue = issueOf(seedId);
  const 店名 = 試験店舗の店名(seedId);
  const id = await 試験店舗を用意する(browser, seedId, seedId === "S-M09-10-LOCAL-033");
  notes.set(d.支店ID呼び名, id);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await 支店トップページを設定する(page, {
      支店名: 店名, 共通設定: false, 画像: 画像ファイル(d.画像名, 旧バナー画像()),
      バナーリンクタグ: d.バナーリンクタグ === null ? null : タグ名(d.バナーリンクタグ ?? "A"), タイル: d.タイル(),
    }, seedId, issue);
    if (d.ファイル名呼び名) {
      const p = new 支店トップページ管理(page);
      await p.開いて支店を選ぶ(店名);
      const url = await p.バナー画像欄のURL();
      const name = url.split("?")[0].split("/").pop() ?? "";
      if (!name) throw new Error(`${seedId}: 登録後のバナー画像欄に画像のURLが無い`);
      notes.set(d.ファイル名呼び名, name);
    }
  });
  if (d.タイルID呼び名) タイルIDを控える(seedId, notes, id, d.タイルID呼び名);
  d.後処理?.({ seedId, 支店ID: id });
}

function 共通適用の支店(n: string): Record<string, 支店の定め> {
  return {
    [`S-M09-10-COMMON-APPLY-${n}`]: {
      支店ID呼び名: `〔支店ID-M0910-${n}〕`, 画像名: `m0910-b-banner-${n}.png`, タイル: 標準のタイル,
      タイルID呼び名: ["A", "B", "C", "D"].map((x) => `〔タイルID-M0910-${n}${x}〕`),
    },
  };
}

const LOCAL: Record<string, 支店の定め> = {
  "S-M09-10-LOCAL": {
    支店ID呼び名: "〔支店ID-M0910-共有東京〕", 画像名: "m0910-old-banner.png", タイル: 標準のタイル,
    タイルID呼び名: [1, 2, 3, 4].map((i) => `〔タイルID-M0910-共有東京${i}〕`),
  },
  "S-M09-10-LOCAL-017": {
    支店ID呼び名: "〔支店ID-M0910-017〕", 画像名: "m0910-old-banner-017.png", タイル: 標準のタイル,
    タイルID呼び名: ["A", "B", "C", "D"].map((x) => `〔タイルID-M0910-017${x}〕`),
  },
  "S-M09-10-LOCAL-018": { 支店ID呼び名: "〔支店ID-M0910-018〕", 画像名: "m0910-old-banner-018.png", タイル: 標準のタイル },
  "S-M09-10-LOCAL-027": {
    支店ID呼び名: "〔支店ID-M0910-027〕", 画像名: "m0910-old-banner-027.png", タイル: 標準のタイル,
    タイルID呼び名: ["A", "B", "C", "D"].map((x) => `〔タイルID-M0910-027${x}〕`),
  },
  "S-M09-10-LOCAL-028": {
    支店ID呼び名: "〔支店ID-M0910-028〕", 画像名: "m0910-old-banner-028.png", タイル: 全部ピックアップ,
    タイルID呼び名: ["A", "B", "C", "D"].map((x) => `〔タイルID-M0910-028${x}〕`),
  },
  "S-M09-10-LOCAL-029": {
    支店ID呼び名: "〔支店ID-M0910-029〕", 画像名: "m0910-old-banner-029.png", タイル: 全部ピックアップ,
    ファイル名呼び名: "〔バナー画像ファイル名-M0910-029〕",
  },
  "S-M09-10-LOCAL-031": { 支店ID呼び名: "〔支店ID-M0910-031〕", 画像名: "m0910-old-banner-031.png", タイル: 全部ピックアップ },
  ...共通適用の支店("006"), ...共通適用の支店("007"), ...共通適用の支店("008"),
  "S-M09-10-PARTIAL": {
    支店ID呼び名: "〔支店ID-M0910-共有D〕", 画像名: "m0910-d-banner.png", タイル: () => 標準のタイル().slice(0, 2),
    タイルID呼び名: ["〔タイルID-M0910-共有D1〕", "〔タイルID-M0910-共有D2〕"],
  },
  "S-M09-10-PARTIAL-015": {
    支店ID呼び名: "〔支店ID-M0910-015〕", 画像名: "m0910-d-banner-015.png", タイル: () => 標準のタイル().slice(0, 2),
    タイルID呼び名: ["〔タイルID-M0910-015A〕", "〔タイルID-M0910-015B〕"],
  },
  "S-M09-10-NO-BANNER": {
    支店ID呼び名: "〔支店ID-M0910-共有C〕", 画像名: "m0910-c-banner.png", タイル: 標準のタイル,
    タイルID呼び名: [1, 2, 3, 4].map((i) => `〔タイルID-M0910-共有C${i}〕`), 後処理: バナー画像を空にする,
  },
  "S-M09-10-ZERO-TILES": {
    支店ID呼び名: "〔支店ID-M0910-共有E〕", 画像名: "m0910-e-banner.png", タイル: 全部ピックアップ, バナーリンクタグ: null,
    後処理: (c) => タイルを消す(c, "全部"),
  },
  "S-M09-10-LEGACY-NOTAG": {
    支店ID呼び名: "〔支店ID-M0910-共有G〕", 画像名: "m0910-g-banner.png", バナーリンクタグ: null,
    タイル: () => [{ 位置: 1, 属性: "その他", タグ: タグ名("その他") }, ...([2, 3, 4] as const).map((位置) => ({ 位置, 属性: "ピックアップ商品", タグ: null }))],
    タイルID呼び名: ["〔タイルID-M0910-共有G1〕"],
    後処理: (c) => { タイルタグを空にする(c, "その他"); タイルを消す(c, "ピックアップ商品"); },
  },
  "S-M09-10-INITIAL-047": { 支店ID呼び名: "〔支店ID-M0910-047〕", 画像名: "m0910-047-banner.png", タイル: 標準のタイル },
  "S-M09-10-DP-NOBANNER-050": {
    支店ID呼び名: "〔支店ID-M0910-050〕", 画像名: "m0910-050-banner.png", タイル: 標準のタイル, 後処理: バナー画像を空にする,
  },
  "S-M09-10-LOCAL-033": { 支店ID呼び名: "〔支店ID-M0910-033〕", 画像名: "m0910-old-banner-033.png", タイル: 全部ピックアップ },
};
for (const [seedId, d] of Object.entries(LOCAL)) {
  defineSeed(seedId, { needs: ["S-M09-10-TAGS"] }, async ({ browser, notes }) => { await 支店トップの支店を作る(browser, seedId, notes, d); });
}
/** LOCAL 系の支店の、試験店舗の店名と支店URL（ケースが使う） */
export const LOCALの店名 = (seedId: string): string => { if (!LOCAL[seedId]) throw new Error(`${seedId} は LOCAL 系でない`); return 試験店舗の店名(seedId); };
export const LOCALの支店URL = (seedId: string): string => { if (!LOCAL[seedId]) throw new Error(`${seedId} は LOCAL 系でない`); return 試験店舗の支店URL(seedId); };

// ---- 商品と支店の在庫 ----

type 作る商品 = { code: string; name: string; タグID: string | null };
type 価格 = { 基準価格: string; 販売価格: string; 買取価格: string; 原価単価: string };

/**
 * グッズ商品CSV登録で商品を作り、取込の規格を公開にし、タグを付け、支店の在庫を入庫・承認する。商品IDを返す（商品コード→商品ID）。
 * 登録者・承認者は、その支店を編集できる別々のメンバー。
 */
async function 商品と在庫を用意する(browser: Browser, seedId: string, a: {
  支店名: string; 登録者: Account; 承認者: Account; 承認者名: string; 商品: 作る商品[]; 価格: 価格; 在庫: number;
}): Promise<Map<string, string>> {
  const issue = issueOf(seedId);
  const ids = new Map<string, string>();
  await withAdminSession(browser, a.登録者, async (page) => {
    const categoryId = await readGoodsRootCategoryId(page);
    const region = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { "購入グループ名称": "通常商品", ...region },
      lines: a.商品.map((p) => ({ code: p.code, nameJp: p.name, nameEn: p.name, branchStatus: "公開", values: { ...a.価格 } })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    for (const p of a.商品) {
      const productId = await openProductEditByCode(page, p.code);
      await publishImportedClass(page, productId, { 商品コード: p.code, 言語: "日本語" }, `${seedId}: ${p.code}`, issue);
      await タグを付けて商品を登録する(page, productId, p.タグID, null, `${seedId}: ${p.code}`, issue);
      ids.set(p.code, productId);
    }
    for (const p of a.商品) {
      const stock = await searchStockByCode(page, { 商品コード: p.code, 店舗: a.支店名, 在庫区分: "EC-CUBE" });
      await stock.openEdit(stock.row(p.code, a.支店名, "EC-CUBE"));
      await registerStockEdit(page, { changeType: "入庫/その他", reason: "M09-10試験データ", quantity: String(a.在庫), purchasePrice: "10", approverName: a.承認者名 }, `${seedId}: ${p.code} の在庫編集`, issue);
    }
    const registrant = await loggedInMemberName(page);
    await withAdminSession(browser, a.承認者, async (ap) => {
      const list = new StockApprovalListPage(ap);
      await list.open(a.支店名);
      // 新しく登録した支店なので、この登録者の未承認の申請は、いま入れた分だけ
      const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant);
      if (rows.length !== a.商品.length) throw new Error(`${seedId}: 在庫編集の未承認の行が ${rows.length} 件（${a.商品.length} 件のはず）`);
      await list.approve(rows.map((r) => r.id), `${seedId}: 在庫編集の承認`, issue);
      await list.open(a.支店名);
      const after = (await list.rowValues()).filter((r) => rows.some((x) => x.id === r.id));
      if (after.some((r) => r.status === "未承認")) throw new Error(`${seedId}: 承認のあとも未承認のまま: ${after.map((r) => `${r.id}:${r.status}`).join(",")}`);
    });
    for (const p of a.商品) {
      const stock = await searchStockByCode(page, { 商品コード: p.code, 店舗: a.支店名, 在庫区分: "EC-CUBE" });
      const text = (await stock.row(p.code, a.支店名, "EC-CUBE").innerText()).replace(/\s+/g, " ");
      if (!new RegExp(`(^|\\D)${a.在庫}(\\D|$)`).test(text)) issue(`${p.code} の在庫一覧の行に在庫 ${a.在庫} が読み取れなかった（「${text.slice(0, 120)}」）`);
    }
  });
  return ids;
}

/** S-M09-10-LINK-PRODUCTS-033: BAN-001-033・BAN-002-033（バナータグA）と EXCLUDED-001-033（タグなし）。登録者・承認者はこのシード専用 */
defineSeed("S-M09-10-LINK-PRODUCTS-033", { needs: ["S-M09-10-LOCAL-033", "S-M09-10-TAGS"] }, async ({ browser, notes }) => {
  const seedId = "S-M09-10-LINK-PRODUCTS-033";
  const 支店名 = LOCALの店名("S-M09-10-LOCAL-033");
  const shop = await 本店の店名(browser);
  const 作る = async (役: string, 表示: string): Promise<{ 名前: string; account: Account }> => {
    const id = `m0910${役}033${RUN_MARK}`.toLowerCase();
    const 名前 = 印(`M0910${表示}-033`);
    const pass = "Passw0rd!M0910";
    await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMember(page, {
      名前, 所属店舗: shop, ログインID: id, メールアドレス: `${id}@example.test`, パスワード: pass, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [支店名, shop],
    }));
    return { 名前, account: { loginId: id, password: pass } };
  };
  const 登録者 = await 作る("r", "登録者"); const 承認者 = await 作る("a", "承認者");
  const tagA = notes.get("〔タグID-M0910-共有2〕");
  await 商品と在庫を用意する(browser, seedId, {
    支店名, 登録者: 登録者.account, 承認者: 承認者.account, 承認者名: 承認者.名前, 在庫: 10,
    価格: { 基準価格: "100", 販売価格: "100", 買取価格: "100", 原価単価: "10" },
    商品: [
      { code: 印("BAN-001-033"), name: 印("BAN-001-033"), タグID: tagA },
      { code: 印("BAN-002-033"), name: 印("BAN-002-033"), タグID: tagA },
      { code: 印("EXCLUDED-001-033"), name: 印("EXCLUDED-001-033"), タグID: null },
    ],
  });
});

// ---- タイルに商品を載せる支店（048・052・058・064） ----

type 商品の支店 = {
  支店ID呼び名: string;
  /** 作るタグ（正本の名称） */
  タグ: string[];
  商品: { code: string; name: string; タグ: string | null; 商品ID呼び名?: string; 既存タグID?: string }[];
  /** タイル（作ったタグは正本の名称で、共有のタグは S-M09-10-TAGS の鍵で書く） */
  タイル: (作ったタグ: (正本: string) => string) => タイル入力[];
  /** バナー画像のファイル名とバナーリンクタグ（正本が任意の画像・未指定とするものは null） */
  画像名: string; 新しい画像: boolean; バナーリンクタグ: string | null;
  価格?: 価格; 在庫?: number;
  /** 作ったタグの名称（正本）→控える呼び名 */
  タグID呼び名?: Record<string, string>;
  タイルID呼び名?: string[];
  /** 画面で作れない準備を、試験店舗・この実行の印つきの商品にDBで行う */
  後処理?: (c: { seedId: string; 支店ID: string }) => void;
};

async function 商品の支店を作る(browser: Browser, seedId: string, notes: Notes, d: 商品の支店): Promise<void> {
  const issue = issueOf(seedId);
  const 店名 = 試験店舗の店名(seedId);
  const id = await 試験店舗を用意する(browser, seedId, true);
  notes.set(d.支店ID呼び名, id);
  // 管理画面のメンバー管理で、連携試験の管理者と承認者の編集可能店舗にこの支店を加える
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const k of ["ADM", "APPROVER"]) {
      const mid = QIのID.get(k);
      if (!mid) throw new Error(`${seedId}: 連携試験の${k === "ADM" ? "管理者" : "承認者"}の管理者IDを控えていない`);
      await 編集可能店舗に加える(page, mid, 店名, seedId, issue);
    }
  });
  const タグID = new Map<string, string>();
  await withAdminSession(browser, QI管理者.account(), async (page) => {
    for (const t of d.タグ) タグID.set(t, await タグを用意する(page, 印(t), seedId));
  });
  const ids = await 商品と在庫を用意する(browser, seedId, {
    支店名: 店名, 登録者: QI管理者.account(), 承認者: QI承認者.account(), 承認者名: QI承認者.名前(), 在庫: d.在庫 ?? 1,
    価格: d.価格 ?? { 基準価格: "500", 販売価格: "500", 買取価格: "300", 原価単価: "10" },
    商品: d.商品.map((p) => ({ code: 印(p.code), name: 印(p.name), タグID: p.既存タグID ?? (p.タグ === null ? null : タグID.get(p.タグ)!) })),
  });
  for (const [t, l] of Object.entries(d.タグID呼び名 ?? {})) notes.set(l, タグID.get(t)!);
  for (const p of d.商品) if (p.商品ID呼び名) notes.set(p.商品ID呼び名, ids.get(印(p.code))!);
  await withAdminSession(browser, QI管理者.account(), async (page) => {
    await 支店トップページを設定する(page, {
      支店名: 店名, 共通設定: false, 画像: 画像ファイル(d.画像名, d.新しい画像 ? 新バナー画像() : 旧バナー画像()),
      バナーリンクタグ: d.バナーリンクタグ, タイル: d.タイル((t) => 印(t)),
    }, seedId, issue);
  });
  if (d.タイルID呼び名) タイルIDを控える(seedId, notes, id, d.タイルID呼び名);
  d.後処理?.({ seedId, 支店ID: id });
}

const 埋め草 = (): タイル入力[] => ([2, 3, 4] as const).map((位置) => ({ 位置, 属性: "その他", タグ: タグ名("その他") }));
const ピックアップ3 = (): タイル入力[] => ([2, 3, 4] as const).map((位置) => ({ 位置, 属性: "ピックアップ商品", タグ: null }));

export const 連番 = (接頭: string, n: number): string[] => Array.from({ length: n }, (_, i) => `${接頭}-${String(i + 1).padStart(3, "0")}`);

/** 開発環境のタグ「スタンダード」「レガシー」「統率者」のタグID（シード表 S-M09-10-FORMAT-PRODUCTS が定めた値。共有のタグなので書き換えない・商品に付けるだけ） */
export const フォーマットタグID = { スタンダード: "9", レガシー: "11", 統率者: "14" } as const;

export const 商品の支店の定め: Record<string, 商品の支店> = {
  "S-M09-10-PUBLIC": {
    支店ID呼び名: "〔支店ID-M0910-共有F〕", タグ: ["モダン特集", "M0910最新タグ", "統率者"],
    タグID呼び名: { "モダン特集": "〔タグID-M0910-共有F1〕", "M0910最新タグ": "〔タグID-M0910-共有F2〕", "統率者": "〔タグID-M0910-共有F3〕" },
    商品: [
      ...連番("FMT", 4).map((c) => ({ code: c, name: c, タグ: "モダン特集" })),
      ...連番("LATEST", 4).map((c) => ({ code: c, name: c, タグ: "M0910最新タグ" })),
      ...連番("PICK", 4).map((c) => ({ code: c, name: c, タグ: null })),
      ...連番("OTHER", 4).map((c) => ({ code: c, name: c, タグ: "統率者" })),
      { code: "EXCLUDED-001", name: "EXCLUDED-001", タグ: null },
    ],
    価格: { 基準価格: "100", 販売価格: "100", 買取価格: "100", 原価単価: "10" }, 在庫: 10,
    タイル: (t) => [
      { 位置: 1, 属性: "フォーマット別特集", タグ: t("モダン特集") }, { 位置: 2, 属性: "最新エキスパンション", タグ: t("M0910最新タグ") },
      { 位置: 3, 属性: "ピックアップ商品", タグ: null }, { 位置: 4, 属性: "その他", タグ: t("統率者") },
    ],
    タイルID呼び名: [1, 2, 3, 4].map((i) => `〔タイルID-M0910-共有F${i}〕`),
    画像名: "m0910-f-banner.png", 新しい画像: false, バナーリンクタグ: "A",
    後処理: (c) => ピックアップにする(c.seedId, c.支店ID, 連番("PICK", 4).map(印)),
  },
  "S-M09-10-DP-MIXTILE-051": {
    支店ID呼び名: "〔支店ID-M0910-051〕", タグ: ["タグ甲M0910-051", "タグ乙M0910-051"],
    商品: [
      { code: "M0910-051-K1", name: "M0910-051-K1", タグ: "タグ甲M0910-051" },
      { code: "M0910-051-O1", name: "M0910-051-O1", タグ: "タグ乙M0910-051" },
      { code: "M0910-051-S1", name: "M0910-051-S1", タグ: null, 既存タグID: フォーマットタグID.スタンダード },
      { code: "M0910-051-L1", name: "M0910-051-L1", タグ: null, 既存タグID: フォーマットタグID.レガシー },
      { code: "M0910-051-C1", name: "M0910-051-C1", タグ: null, 既存タグID: フォーマットタグID.統率者 },
    ],
    タイル: (t) => [{ 位置: 1, 属性: "その他", タグ: t("タグ甲M0910-051") }, { 位置: 2, 属性: "その他", タグ: t("タグ乙M0910-051") }, { 位置: 3, 属性: "ピックアップ商品", タグ: null }, { 位置: 4, 属性: "ピックアップ商品", タグ: null }],
    画像名: "m0910-051-banner.png", 新しい画像: false, バナーリンクタグ: null,
    後処理: (c) => タイルを消す(c, "ピックアップ商品"),
  },
  "S-M09-10-CBLATESTNONE-059": {
    支店ID呼び名: "〔支店ID-M0910-059〕", タグ: ["タグM0910-CB059"],
    商品: [{ code: "M0910-059-Z1", name: "M0910-059-Z1", タグ: "タグM0910-CB059" }],
    タイル: () => [{ 位置: 1, 属性: "最新エキスパンション", タグ: タグ名("その他") }, ...埋め草()],
    画像名: "m0910-new-banner.png", 新しい画像: true, バナーリンクタグ: "A",
    後処理: (c) => タイルタグを空にする(c, "最新エキスパンション"),
  },
  "S-M09-10-CBPICKOWN-062": {
    支店ID呼び名: "〔支店ID-M0910-062〕", タグ: [],
    商品: [{ code: "M0910-062-Z1", name: "M0910-062-Z1", タグ: null }],
    タイル: () => [{ 位置: 1, 属性: "ピックアップ商品", タグ: null }, ...埋め草()],
    画像名: "m0910-new-banner.png", 新しい画像: true, バナーリンクタグ: "A",
    後処理: (c) => ピックアップにする(c.seedId, c.支店ID, [印("M0910-062-Z1")]),
  },
  "S-M09-10-QI-TILE-048": {
    支店ID呼び名: "〔支店ID-M0910-QI001〕", タグ: ["QIタグ甲-001", "QIタグ乙-001"],
    商品: [
      { code: "M0910-QI001-A", name: "QIタイル商品甲-001", タグ: "QIタグ甲-001", 商品ID呼び名: "〔商品ID-M0910-QI001甲〕" },
      { code: "M0910-QI001-B", name: "QIタイル商品乙-001", タグ: "QIタグ乙-001", 商品ID呼び名: "〔商品ID-M0910-QI001乙〕" },
    ],
    タイル: (t) => [{ 位置: 1, 属性: "その他", タグ: t("QIタグ甲-001") }, ...ピックアップ3()],
    画像名: "qi-banner-001.png", 新しい画像: false, バナーリンクタグ: null,
  },
  "S-M09-10-DP-ONEPROD-052": {
    支店ID呼び名: "〔支店ID-M0910-052〕", タグ: ["タグ丙M0910-052"],
    商品: [{ code: "M0910-052-Z1", name: "M0910-052-Z1", タグ: "タグ丙M0910-052" }],
    タイル: (t) => [{ 位置: 1, 属性: "その他", タグ: t("タグ丙M0910-052") }, ...ピックアップ3()],
    画像名: "m0910-052-banner.png", 新しい画像: false, バナーリンクタグ: null,
  },
  "S-M09-10-CBFMTOWN-058": {
    支店ID呼び名: "〔支店ID-M0910-058〕", タグ: ["特集CB-M0910-058"],
    商品: [{ code: "M0910-058-Z1", name: "M0910-058-Z1", タグ: "特集CB-M0910-058" }],
    タイル: (t) => [{ 位置: 1, 属性: "フォーマット別特集", タグ: t("特集CB-M0910-058") }, ...埋め草()],
    画像名: "m0910-new-banner.png", 新しい画像: true, バナーリンクタグ: "A",
  },
  "S-M09-10-CBOTHEROWN-064": {
    支店ID呼び名: "〔支店ID-M0910-064〕", タグ: ["タグM0910-CB064"],
    商品: [{ code: "M0910-064-Z1", name: "M0910-064-Z1", タグ: "タグM0910-CB064" }],
    タイル: (t) => [{ 位置: 1, 属性: "その他", タグ: t("タグM0910-CB064") }, ...埋め草()],
    画像名: "m0910-new-banner.png", 新しい画像: true, バナーリンクタグ: "A",
  },
};
for (const [seedId, d] of Object.entries(商品の支店の定め)) {
  const needs = ["S-M09-10-QI-ADM", "S-M09-10-QI-APPROVER", ...(d.バナーリンクタグ || seedId.includes("CB") ? ["S-M09-10-TAGS"] : [])];
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    await 商品の支店を作る(browser, seedId, notes, { ...d, バナーリンクタグ: d.バナーリンクタグ ? タグ名(d.バナーリンクタグ as keyof typeof 共有タグ) : null });
  });
}
export const 商品の支店の店名 = (seedId: string): string => { if (!商品の支店の定め[seedId]) throw new Error(`${seedId} は商品の支店でない`); return 試験店舗の店名(seedId); };
export const 商品の支店のURL = (seedId: string): string => { if (!商品の支店の定め[seedId]) throw new Error(`${seedId} は商品の支店でない`); return 試験店舗の支店URL(seedId); };

/**
 * S-M09-10-FORMAT-PRODUCTS: タイルが0件の支店E（S-M09-10-ZERO-TILES）に、共有のタグ「スタンダード」「レガシー」「統率者」に紐づく6商品を作る。
 * 共有のタグは書き換えない（商品にタグを付けるだけ。タグIDはシード表の値）。
 * 「この3タグに紐づく他の商品を非公開にする」準備は、ほかの人の商品を書き換えるので行わない（ケースは表示された商品が6商品のものかを見る）。
 */
defineSeed("S-M09-10-FORMAT-PRODUCTS", { needs: ["S-M09-10-ZERO-TILES", "S-M09-10-QI-ADM", "S-M09-10-QI-APPROVER"] }, async ({ browser, seed }) => {
  const seedId = seed.シードID;
  const issue = issueOf(seedId);
  const 店名 = LOCALの店名("S-M09-10-ZERO-TILES");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const k of ["ADM", "APPROVER"]) {
      const mid = QIのID.get(k);
      if (!mid) throw new Error(`${seedId}: 連携試験の${k === "ADM" ? "管理者" : "承認者"}の管理者IDを控えていない`);
      await 編集可能店舗に加える(page, mid, 店名, seedId, issue);
    }
  });
  const 商品 = [
    ...["M0910-STD-001", "M0910-STD-002"].map((c) => ({ code: 印(c), name: 印(c), タグID: フォーマットタグID.スタンダード as string })),
    ...["M0910-LEG-001", "M0910-LEG-002"].map((c) => ({ code: 印(c), name: 印(c), タグID: フォーマットタグID.レガシー as string })),
    ...["M0910-CMD-001", "M0910-CMD-002"].map((c) => ({ code: 印(c), name: 印(c), タグID: フォーマットタグID.統率者 as string })),
  ];
  await 商品と在庫を用意する(browser, seedId, {
    支店名: 店名, 登録者: QI管理者.account(), 承認者: QI承認者.account(), 承認者名: QI承認者.名前(), 在庫: 10,
    価格: { 基準価格: "100", 販売価格: "100", 買取価格: "100", 原価単価: "10" }, 商品,
  });
  issue("共有のタグ「スタンダード」「レガシー」「統率者」（タグID 9・11・14）は書き換えず、印つきの6商品に付けただけ。この3タグに紐づくほかの商品を非公開にする準備は、ほかの人の商品を書き換えるので行っていない");
});
