/**
 * A14-02 カード詳細IDからカード詳細情報を取得のシード。正本: cases/A14-02_seed_data.tsv
 *
 * 正本の外の補い（記録にも書く）:
 * - マスター（レイアウト・レアリティ・プロモーション・イラストレーター・カードセットブロック）とカードセットは全員が使うので、
 *   依頼者決定 2026-11-14「マスタは作ってよい」で、決まった印を付けた名前で1度だけ登録して使い回す。ただし、シード表と同じ名前・値の行が
 *   開発環境に既にあるもの（レイアウト「通常/Normal」・レアリティ「レア/Rare/R」）は、登録せずにその行を使う（m14_card の「あれば使い、無ければ登録する」）。
 *   決まった印が付くので、プロモーション・イラストレーター・カードセットブロック・カードセットの名前はシード表の値に印の付いた値になる（ケースは DB の値と比べる）。
 * - カードは、シードごとに実行の印を付けたカード名(英)で登録する。シード表の「同じ名前のカードが残っていれば削除する」は、印があるので行わない。
 * - カード詳細の選択肢は、表示名でなくマスターの ID（値）で選ぶ（表示名が日本語名か英語名かに左右されない）。
 * - S-A14-02-MISSING-RELATIONS の参照用のマスター・カードセットは、S-A14-02-BASE のマスター・カードセットで代える（ケースは404だけを見る）。
 *   画面で必須のレイアウト・レアリティ・プロモ種別の未設定は、この実行で作ったカード詳細の行にだけ DB で書く。
 * - カードセットのシンボル画像のファイル名（set/a14-02.png）は、画面ではファイルを置くので決まった名前にできず、E2E のカードセットの行にだけ DB で書く。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { MTGマスターのID, MTGの種別, カード詳細の関連を値なしにする, カードセットのID, カードセットのシンボル画像を書く, カードセットの値 } from "../db/a14_cards";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { カードセットを登録する } from "../pages/admin/a14_setup";
import { ensureMaster, カードを登録する, カード詳細IDs, マスター種別, 詳細入力 } from "../pages/admin/m14_card";

/** S-A14-02-BASE のマスター・カードセットの名前（シード表の値。印を付けるものは決まった印つき） */
export const 名前 = {
  レイアウト: { 日: "通常", 英: "Normal" },
  レアリティ: { 日: "レア", 英: "Rare", コード: "R" },
  プロモ種別: { 日: rcFixed("試験プロモ"), 英: rcFixed("Test Promotion"), コード: "TP" },
  イラストレーター: { 日: rcFixed("試験イラストレーター"), 英: rcFixed("Test Illustrator") },
  カードセットブロック: { 日: rcFixed("結合試験ブロックA1402"), 英: rcFixed("Integration Block A1402") },
  カードセット: { 日: rcFixed("結合試験セット"), 英: rcFixed("Integration Set"), 略称: "A14", リリース日: "2026-09-01", シンボル画像: "set/a14-02.png" },
} as const;

type IDs = { レイアウト: string; レアリティ: string; プロモ種別: string; イラストレーター: string; カードセットブロック: string; カードセット: string };
let 用意したID: IDs | null = null;

const 画面の種別: Record<MTGの種別, マスター種別> = { レイアウト: "カードレイアウト", レアリティ: "レアリティ", プロモ種別: "プロモーション", イラストレーター: "イラストレーター", カードセットブロック: "カードセットブロック" };

/** S-A14-02-BASE のマスター・カードセットを用意して ID を返す（1度だけ） */
export async function マスターを用意する(browser: Browser, seedId: string): Promise<IDs> {
  if (用意したID) return 用意したID;
  const 登録した: string[] = [];
  const 使った: string[] = [];
  let セットID = カードセットのID(名前.カードセット.英);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const k of ["レイアウト", "レアリティ", "プロモ種別", "イラストレーター", "カードセットブロック"] as const) {
      const v = 名前[k] as { 日: string; 英: string; コード?: string };
      const made = await ensureMaster(page, 画面の種別[k], v.日, v.英, `${seedId}: ${k}`, v.コード);
      (made ? 登録した : 使った).push(`${k}「${v.日}」`);
    }
    if (!セットID) {
      const c = 名前.カードセット;
      セットID = await カードセットを登録する(page, { 名日: c.日, 名英: c.英, 略称: c.略称, ブロック: 名前.カードセットブロック.日, リリース日: c.リリース日 }, `${seedId}: カードセット`);
      登録した.push(`カードセット「${c.日}」`);
    } else 使った.push(`カードセット「${名前.カードセット.日}」`);
  });
  const id = (k: MTGの種別): string => {
    const v = MTGマスターのID(k, (名前[k] as { 日: string }).日);
    if (!v) throw new Error(`${seedId}: ${k}「${(名前[k] as { 日: string }).日}」の行を DB で引けない`);
    return v;
  };
  if (!セットID) throw new Error(`${seedId}: カードセット「${名前.カードセット.日}」を用意できなかった`);
  if (カードセットの値(セットID)?.symbol_image !== 名前.カードセット.シンボル画像) {
    カードセットのシンボル画像を書く(`${seedId}: カードセットのシンボル画像`, セットID, 名前.カードセット.シンボル画像);
  }
  用意したID = { レイアウト: id("レイアウト"), レアリティ: id("レアリティ"), プロモ種別: id("プロモ種別"), イラストレーター: id("イラストレーター"), カードセットブロック: id("カードセットブロック"), カードセット: セットID };
  reportSeedIssue(seedId, `マスター・カードセットは全員が使うので、決まった印を付けた名前で1度だけ登録して使い回す（依頼者決定 2026-11-14「マスタは作ってよい」）。` +
    (登録した.length ? `この実行で登録した: ${登録した.join("・")}。` : "") + (使った.length ? `既にあった行を使った: ${使った.join("・")}（レイアウト「通常」・レアリティ「レア」はシード表と同じ名前・値の行が開発環境にあるので登録していない）。` : "") +
    `カードセットのシンボル画像「${名前.カードセット.シンボル画像}」は画面で決まったファイル名にできないので、E2E のカードセットの行にだけ DB で書いた。` +
    `各 ID は画面に表示されないので DB で名前から引いて控えた（レイアウト ${用意したID.レイアウト}・レアリティ ${用意したID.レアリティ}・プロモ種別 ${用意したID.プロモ種別}・イラストレーター ${用意したID.イラストレーター}・カードセットブロック ${用意したID.カードセットブロック}・カードセット ${用意したID.カードセット}）`);
  return 用意したID;
}

/** 用意したマスターの ID（ケースが使う） */
export function A1402のID(): IDs {
  if (!用意したID) throw new Error("S-A14-02-BASE をまだ用意していない");
  return 用意したID;
}

export const 全部の関連 = (m: IDs): 詳細入力["ID"] => ({ カードセット: m.カードセット, レアリティ: m.レアリティ, レイアウト: m.レイアウト, イラストレーター: m.イラストレーター, プロモ種別: m.プロモ種別 });

async function カードを作る(browser: Browser, seedId: string, カード名英: string, 詳細: 詳細入力[]): Promise<{ カードID: string; カード詳細IDs: string[] }> {
  let カードID = "";
  let ids: string[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    カードID = await カードを登録する(page, { カード名英, 点数で見たマナ: "0", 詳細 }, `${seedId}: カードの登録`, (m) => reportSeedIssue(seedId, m));
    ids = await カード詳細IDs(page);
  });
  if (ids.length !== 詳細.length) throw new Error(`${seedId}: 登録したカード（カードID ${カードID}）のカード詳細が ${ids.length} 件（${詳細.length} 件のはず）`);
  reportSeedIssue(seedId, `カード（カードID ${カードID}「${カード名英}」・カード詳細ID ${ids.join("・")}）をカード詳細(登録)画面で登録した（カード名(英)に実行の印。印があるので、同じ名前のカードの削除は行っていない）`);
  return { カードID, カード詳細IDs: ids };
}

function 控える(notes: Notes, ids: IDs): void {
  notes.set("〔レイアウトID-A1402-共有〕", ids.レイアウト);
  notes.set("〔レアリティID-A1402-共有〕", ids.レアリティ);
  notes.set("〔カードセットID-A1402-共有〕", ids.カードセット);
  notes.set("〔イラストレーターID-A1402-共有〕", ids.イラストレーター);
  notes.set("〔プロモ種別ID-A1402-共有〕", ids.プロモ種別);
  notes.set("〔カードセットブロックID-A1402-共有〕", ids.カードセットブロック);
}

defineSeed("S-A14-02-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "APIベースURLは開発環境の API サーバーの /api（ケースの「/cardDetails/…」はアプリの経路 /api/cardDetails/…）。ログインしていない試験ブラウザから、認証の見出しを付けずに送る");
});

defineSeed("S-A14-02-BASE", async ({ browser, notes, seed }) => {
  const m = await マスターを用意する(browser, seed.シードID);
  控える(notes, m);
  const r = await カードを作る(browser, seed.シードID, rc("A14-02 Base Card"), [{
    ID: 全部の関連(m), カード番号: "A14-02-001", 裏面カード詳細ID: "140202", 効果テキスト日: "結合試験効果テキスト", 効果テキスト英: "Integration effect text",
    パワー: "3", タフネス: "4", フレーバー日: "結合試験フレーバー日本語", フレーバー英: "Integration flavor text", Foil: "特殊", フレーム: "通常",
  }]);
  notes.set("〔カードID-A1402-共有〕", r.カードID);
  notes.set("〔カード詳細ID-A1402-共有〕", r.カード詳細IDs[0]);
});

defineSeed("S-A14-02-MISSING-RELATIONS", async ({ browser, notes, seed }) => {
  const m = await マスターを用意する(browser, seed.シードID);
  const 全部 = 全部の関連(m);
  const r = await カードを作る(browser, seed.シードID, rc("A14-02 Reference Card"), [
    { ID: 全部, Foil: "なし", フレーム: "通常" },
    { ID: 全部, Foil: "なし", フレーム: "通常" },
    { ID: { ...全部, カードセット: undefined }, Foil: "なし", フレーム: "通常" },
    { ID: { ...全部, イラストレーター: undefined }, Foil: "なし", フレーム: "通常" },
    { ID: 全部, Foil: "なし", フレーム: "通常" },
  ]);
  const [A, B, C, D, E] = r.カード詳細IDs;
  カード詳細の関連を値なしにする(`${seed.シードID}: 1件目のレイアウトなし`, A, ["レイアウト"]);
  カード詳細の関連を値なしにする(`${seed.シードID}: 2件目のレアリティなし`, B, ["レアリティ"]);
  カード詳細の関連を値なしにする(`${seed.シードID}: 5件目のプロモ種別なし`, E, ["プロモ種別"]);
  notes.set("〔参照用カードID-A1402-共有〕", r.カードID);
  for (const [k, v] of [["A", A], ["B", B], ["C", C], ["D", D], ["E", E]] as const) notes.set(`〔カード詳細ID-A1402-共有${k}〕`, v);
  notes.set("〔参照用レイアウトID-A1402-共有〕", m.レイアウト);
  notes.set("〔参照用レアリティID-A1402-共有〕", m.レアリティ);
  notes.set("〔参照用カードセットID-A1402-共有〕", m.カードセット);
  notes.set("〔参照用イラストレーターID-A1402-共有〕", m.イラストレーター);
  notes.set("〔参照用プロモ種別ID-A1402-共有〕", m.プロモ種別);
  reportSeedIssue(seed.シードID, "参照用のマスター・カードセットは登録せず、S-A14-02-BASE のマスター・カードセットで代えた（ケースは HTTP ステータスと404の応答だけを見る）。" +
    "3件目はカードセット、4件目はイラストレーターを画面で選ばなかった。1件目のレイアウト・2件目のレアリティ・5件目のプロモ種別は画面で必須なので、選んで登録したあと、この実行で作ったカード詳細の行にだけ DB で未設定にした（シード表のとおり）");
});

for (const [seedId, 番号, foil] of [["S-A14-02-FOIL0-013", "013", "なし"], ["S-A14-02-FOIL1-014", "014", "通常"]] as const) {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const m = await マスターを用意する(browser, seed.シードID);
    const r = await カードを作る(browser, seed.シードID, rc(`A14-02 Foil Card ${番号}`), [{ ID: 全部の関連(m), Foil: foil, フレーム: "通常" }]);
    notes.set(`〔カードID-A1402-${番号}〕`, r.カードID);
    notes.set(`〔カード詳細ID-A1402-${番号}〕`, r.カード詳細IDs[0]);
    reportSeedIssue(seed.シードID, `Foil は画面の選択肢「${foil}」（値 ${番号 === "013" ? 0 : 1}。シード表の「${番号 === "013" ? "なし" : "あり"}」に当たる）を選んだ`);
  });
}
