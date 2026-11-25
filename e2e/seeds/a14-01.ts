/**
 * A14-01 カードIDからカード情報を取得のシード。正本: cases/A14-01_seed_data.tsv
 *
 * 正本の外の補い（記録にも書く）:
 * - カードは、依頼者決定 2026-11-14「マスタは作ってよい」で、カード詳細(登録)画面で登録する。カード名(日)・(英)には実行の印を付ける
 *   （ケースは控えたカードIDで API を開き、期待結果は DB の値と比べる）。印が付くので、シード表の「同じ名前のカードが残っていれば削除する」は行わない。
 * - 作成日時・更新日時、カード名(英)の値なし、カード詳細のレアリティ・レイアウト・プロモ種別の値なしは、画面で指定できないので、
 *   この実行で作ったカード・カード詳細の行にだけ DB で書く（lib/db_write.ts）。
 * - S-A14-01-MASTER は DB シードで登録せず、開発環境に既にあるマスターを名前で引いて使う。開発環境の特殊タイプID 3 は「ワールド」で、
 *   「基本」は別の ID なので、ケースは名前「基本」の特殊タイプの ID で読み替える。
 * - 色順（S-A14-01-COLSEQ-018）は、MTGマスターデータ管理で決まった印を付けた名称で1度だけ登録し、使い回す（並び順7）。
 */
import { SETUP_ADMIN } from "../config/env";
import { カードの値, カードの日時を書く, カード名英を値なしにする, カード詳細の関連を値なしにする, カード詳細の日時を書く, マスターの行, マスターの行をIDで } from "../db/a14_cards";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 色順を用意する } from "../pages/admin/a14_setup";
import { カード入力, カードを登録する, カード詳細IDs } from "../pages/admin/m14_card";
import { Browser } from "@playwright/test";

/** S-A14-01-MASTER の読み替え（シード表の ID → 開発環境の名前で引いた ID） */
export type マスターの読み替え = { カードタイプ: string; サブタイプ: string; 特殊タイプ: string; カラー: string };
let 読み替え: マスターの読み替え | null = null;
export function マスターのID(): マスターの読み替え {
  if (!読み替え) throw new Error("S-A14-01-MASTER をまだ用意していない");
  return 読み替え;
}

/** 色順の名称（決まった印つき） */
export const 色順の名称 = (): string => rcFixed("色順確認-A1401-018-A");

export async function カードを作る(browser: Browser, seedId: string, 番号: string, v: カード入力, 日時: string, notes: Notes, 詳細の日時 = false): Promise<{ カードID: string; カード詳細IDs: string[] }> {
  let カードID = "";
  let ids: string[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    カードID = await カードを登録する(page, v, `${seedId}: カードの登録`, (m) => reportSeedIssue(seedId, m));
    ids = v.詳細 === false ? [] : await カード詳細IDs(page);
  });
  notes.set(`〔カードID-A1401-${番号}〕`, カードID);
  if (ids.length === 1) notes.set(`〔カード詳細ID-A1401-${番号}〕`, ids[0]);
  カードの日時を書く(`${seedId}: カードの作成日時・更新日時`, カードID, 日時);
  if (詳細の日時 && ids.length) カード詳細の日時を書く(`${seedId}: カード詳細の作成日時・更新日時`, ids, 日時);
  reportSeedIssue(seedId, `カード（カードID ${カードID}「${v.カード名日 ?? v.カード名英}」${ids.length ? `・カード詳細ID ${ids.join("・")}` : ""}）をカード詳細(登録)画面で登録した` +
    `（カード名に実行の印。依頼者決定 2026-11-14「マスタは作ってよい」。印があるので、同じ名前のカードの削除は行っていない）。` +
    `作成日時・更新日時（${日時}）は画面で指定できないので、この実行で作った${詳細の日時 ? "カード・カード詳細" : "カード"}の行にだけ DB で書いた`);
  return { カードID, カード詳細IDs: ids };
}

defineSeed("S-A14-01-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "APIベースURLは開発環境の API サーバーの /api（ケースの「/cards/…」はアプリの経路 /api/cards/…）。ログインしていない試験ブラウザから、認証の見出しを付けずに送る");
});

defineSeed("S-A14-01-MASTER", async ({ seed }) => {
  const ct = マスターの行("カードタイプ", "インスタント");
  const st = マスターの行("サブタイプ", "アンテロープ");
  const sp = マスターの行("特殊タイプ", "基本");
  const co = マスターの行("カラー", "黒");
  if (!ct || !st || !sp || !co) throw new Error(`${seed.シードID}: 開発環境に「インスタント」「アンテロープ」「基本」「黒」のどれかのマスターが無い（DB シードでは登録しない）`);
  読み替え = { カードタイプ: ct.id, サブタイプ: st.id, 特殊タイプ: sp.id, カラー: co.id };
  const 違い = ([["カードタイプ", "4", ct], ["サブタイプ", "1", st], ["特殊タイプ", "3", sp], ["カラー", "3", co]] as const)
    .filter(([, id, r]) => r.id !== id).map(([k, id, r]) => {
      const 元 = マスターの行をIDで(k, id);
      return `${k}「${r.name_jp}」はシード表の ID ${id} でなく ID ${r.id}（開発環境の ID ${id} は「${元?.name_jp ?? "なし"}」）`;
    });
  reportSeedIssue(seed.シードID, `DB シードでは登録せず、開発環境に既にあるマスターを名前で引いて使った（カードタイプ「インスタント」ID ${ct.id}・サブタイプ「アンテロープ」ID ${st.id}・特殊タイプ「基本」ID ${sp.id}・カラー「黒」ID ${co.id}）` +
    (違い.length ? `。${違い.join("。")}。ケースはこの ID で読み替えた` : ""));
});

defineSeed("S-A14-01-FULL-001", async ({ browser, notes, seed }) => {
  await カードを作る(browser, seed.シードID, "001", { カード名日: rc("スカラベの饗宴-001"), カード名英: rc("Scarab Feast-001"), 点数で見たマナ: "1", 詳細: false }, "2026-09-01 10:00:00+09", notes);
});

defineSeed("S-A14-01-FULL-002", async ({ browser, notes, seed }) => {
  await カードを作る(browser, seed.シードID, "002", {
    カード名日: rc("スカラベの饗宴-002"), カード名英: rc("Scarab Feast-002"), アリーナ名日: "スカラベの饗宴-002", アリーナ名英: "Scarab Feast-002",
    ルールテキスト日: "結合試験カードテキスト-002", ルールテキスト英: "Integration card text-002", マナ・コスト: "(B)", 点数で見たマナ: "1", パワー: "1", タフネス: "2", 忠誠度: "3", 詳細: false,
  }, "2026-09-01 10:02:00+09", notes);
});

defineSeed("S-A14-01-FULL-003", async ({ browser, notes, seed }) => {
  await カードを作る(browser, seed.シードID, "003", {
    カード名日: rc("スカラベの饗宴-003"), カード名英: rc("Scarab Feast-003"), 点数で見たマナ: "0",
    カードタイプ: ["インスタント"], サブタイプ: ["アンテロープ"], 特殊タイプ: ["基本"], カラー: ["黒"], 詳細: false,
  }, "2026-09-01 10:03:00+09", notes);
  reportSeedIssue(seed.シードID, "点数で見たマナ・コストは画面で必須のため0を入れた（シード表のとおり）");
});

defineSeed("S-A14-01-NULL-009", async ({ browser, notes, seed }) => {
  const r = await カードを作る(browser, seed.シードID, "009", {
    カード名日: rc("値未設定確認カード-009"), カード名英: rc("A14CardNull009"), 点数で見たマナ: "0", 詳細: [{ Foil: "なし", フレーム: "通常" }],
  }, "2026-09-01 10:09:00+09", notes, true);
  カード名英を値なしにする(`${seed.シードID}: カード名(英)の値なし`, r.カードID);
  カード詳細の関連を値なしにする(`${seed.シードID}: カード詳細のレアリティ・レイアウト・プロモ種別の値なし`, r.カード詳細IDs[0], ["レアリティ", "レイアウト", "プロモ種別"]);
  const v = カードの値(r.カードID);
  reportSeedIssue(seed.シードID, "カード名(英)は画面で必須のため仮の値で登録し、DB で値なしにした。カード詳細のレアリティ・レイアウト・プロモ種別も画面で必須のため選択肢の先頭で登録し、DB で値なしにした（シード表のとおり。この実行で作った行だけ）。" +
    `空のままにした欄の DB の値: アリーナカード名(日)=${JSON.stringify(v.arena_format_name_jp)}・ルールテキスト(日)=${JSON.stringify(v.text_jp)}・マナ・コスト=${JSON.stringify(v.mana_cost)}・パワー=${JSON.stringify(v.power)}`);
});

defineSeed("S-A14-01-EMPTY-010", async ({ browser, notes, seed }) => {
  await カードを作る(browser, seed.シードID, "010", { カード名日: rc("関連情報なしカード-010"), カード名英: rc("A14CardEmpty010"), 点数で見たマナ: "0", 詳細: false }, "2026-09-01 10:10:00+09", notes);
});

defineSeed("S-A14-01-NULL-011", async ({ browser, notes, seed }) => {
  await カードを作る(browser, seed.シードID, "011", {
    カード名日: rc("値未設定確認カード-011"), カード名英: rc("A14CardImageNull011"), 点数で見たマナ: "0", 詳細: [{ Foil: "なし", フレーム: "通常" }],
  }, "2026-09-01 10:11:00+09", notes, true);
  reportSeedIssue(seed.シードID, "カード詳細のレアリティ・レイアウト・プロモ種別は画面で必須のため選択肢の先頭を選んだ（シード表のとおり）。カード画像は登録していない");
});

defineSeed("S-A14-01-COLSEQ-018", async ({ browser, notes, seed }) => {
  const 名称 = 色順の名称();
  let 作った = false;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    作った = await 色順を用意する(page, 名称, "7", `${seed.シードID}: 色順`);
  });
  const r = await カードを作る(browser, seed.シードID, "018", { カード名日: rc("スカラベの饗宴-018"), カード名英: rc("Scarab Feast-018"), 点数で見たマナ: "0", 色順: 名称, 詳細: false }, "2026-09-01 10:18:00+09", notes);
  const id = カードの値(r.カードID).color_sequence_id;
  if (!id) throw new Error(`${seed.シードID}: 登録したカードに色順が紐づいていない`);
  notes.set("〔色順ID-A1401-018〕", id);
  reportSeedIssue(seed.シードID, `色順「${名称}」（並び順7）は、MTGマスターデータ管理で決まった印を付けた名称で${作った ? "1度だけ登録した" : "前の実行で登録したものを使い回した"}` +
    `（全員が使うマスタ。依頼者決定 2026-11-14「マスタは作ってよい」。印があるので、同じ名称の行の値を消す操作は行っていない）。色順ID ${id} は DB で、カードに紐づく色順から控えた`);
});
