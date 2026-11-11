/**
 * A02-01・A02-03 のシードの組み立て（シードの登録はしない。seeds/a02-01.ts・seeds/a02-03.ts が使う）。
 *
 * 1商品ずつ: グッズ商品CSV登録で1件目の商品規格（状態NM）を取り込む → 商品登録編集の「カード指定」で既にあるカード詳細を紐付ける →
 * 商品規格一覧の「新規作成」で残りの商品規格を足す → 本店・EC-CUBE へ入庫して別の管理者が承認する → 削除する商品規格を削除する →
 * 画面で作れない状態（通常価格・週間販売数量・商品画像と規格画像の順位・最後の1件の商品規格の削除済み）だけ、E2E の行に DB で書き足す。
 *
 * 正本の外の補い（記録にも書く）:
 * - カードのマスタ（カードセット・カード・カード詳細）は新しく作らず、開発環境に既にある商品の付いていないものを使う（M04-03 と同じ）。
 *   カード名・カードセット・Foil・プロモ・リリース日はそのカード詳細の値のまま（ケースが確かめる商品・商品規格の値には関わらない）。
 * - シード表の「カード商品CSV登録」は、グッズ商品CSV登録＋カード指定で代えた（カード商品CSV登録は基準価格からスマレジ連携を決め、外部のスマレジへ送ることがある）。
 * - 店舗ID 1（シード表の「TC東京」）は、開発環境の店舗ID 1（本店）。在庫はその店舗・EC-CUBE へ入庫する。
 * - 商品コードには実行の印を付ける（商品名は付けない。API は商品ID・旧商品IDで引き、期待結果が商品名そのものを見る）。
 * - 商品画像・規格画像は、決まったファイル名で画面から置けない（シード表も保存先へ直接置くと定める）ので、画像の行だけを DB に足す（実体は置かない）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import {
  通常価格を書く, 規格を削除済みにする, 規格画像を紐付ける, 商品画像を足す, 週間販売数量を足す,
} from "../db/a02_popup";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { カードを紐付ける, 商品を削除する, 商品を取り込む } from "../pages/admin/a02_setup";
import { 入庫して承認する, 規格を削除する, 規格を足す } from "../pages/admin/a17_05_setup";

export type 状態 = "NM" | "SP" | "MP" | "HP";
const 状態の名前: Record<状態, string> = { NM: "ニアミント", SP: "スライトリープレイド", MP: "モデレトリープレイド", HP: "ヘビープレイド" };

export type 規格の定め = {
  /** 呼び名の印（〔商品規格ID-…{番号}{印}〕の印。1件だけで印の無いものは ""） */
  印: string;
  言語: "日本語" | "英語";
  状態: 状態;
  価格: string;
  在庫: number;
  通常価格?: number;
  週間販売数量?: number;
  /** 規格画像（ファイル名と順位） */
  規格画像?: { ファイル名: string; 順位: number }[];
  /** 入庫のあと商品規格登録編集で削除する */
  削除?: boolean;
  /** 最後の1件の商品規格を削除済み（廃止・非表示）にする（画面では削除できないので DB） */
  DBで削除済み?: boolean;
  /** 取込で作らず、商品規格一覧の「新規作成」で足す（販売価格0など、取込の行に入れない値の規格） */
  取込しない?: boolean;
};

export type 商品の定め = {
  /** 呼び名の印（〔商品ID-…{番号}{印}〕の印。1件だけで印の無いものは ""） */
  印: string;
  商品名日: string;
  商品名英: string;
  /** カード詳細を紐付ける（既にあるカード詳細。A02-03 は旧商品IDのカードの1件のカード詳細） */
  カード: { カードID: string; カード詳細ID: string; カード名: string } | null;
  非公開?: boolean;
  /** 規格画像でない商品画像（並び順の先頭から） */
  商品画像?: string[];
  規格: 規格の定め[];
  /** 作って商品IDを控えたあと、商品を削除する */
  商品を消す?: boolean;
};

export type 作った商品 = { 商品ID: string; 規格ID: Record<string, string> };

/** シード表の状態・属性に出てくる呼び名だけを控える */
export function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

/**
 * 1商品を作る。コードの頭（正本の値。例 A0201-001）に、商品の印・規格の印を足して実行の印を付けた商品コードにする。
 * 呼び名の頭（例 A0201-001）で〔商品ID-…〕〔商品規格ID-…〕〔カードID-…〕〔カード詳細ID-…〕を控える。
 */
export async function 商品を作る(browser: Browser, seedId: string, 呼び名の頭: string, d: 商品の定め, notes: Notes): Promise<作った商品> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const コード = (印: string) => rc(`${呼び名の頭}${d.印}-${印 || "1"}`);
  // 取込で作る1件目は、状態NMの規格（言語は定めのとおり）。NM の規格が無い商品は、取込の規格を最後に削除する
  const 取込の規格 = d.規格.find((k) => k.状態 === "NM" && !k.取込しない);
  const 取込 = 取込の規格 ?? { 印: "X", 言語: "日本語" as const, 状態: "NM" as const, 価格: "100", 在庫: 0, 削除: true };
  const 規格ID: Record<string, string> = {};
  let 商品ID = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const r = await 商品を取り込む(page, seedId, { 商品コード: コード(取込.印), 商品名日: d.商品名日, 商品名英: d.商品名英, 価格: 取込.価格, 言語: 取込.言語, 非公開: d.非公開 }, issue);
    商品ID = r.商品ID;
    規格ID[取込.印] = r.規格ID;
    if (d.カード) await カードを紐付ける(page, 商品ID, d, d.カード, issue);
    for (const k of d.規格) {
      if (k === 取込の規格) continue;
      規格ID[k.印] = await 規格を足す(page, 商品ID, { 言語: k.言語, 状態: 状態の名前[k.状態], 商品コード: コード(k.印), 価格: k.価格 }, `${seedId}: ${コード(k.印)}`, issue);
    }
  });
  if (!取込の規格) issue(`${呼び名の頭}${d.印}: 取込で作る状態NMの商品規格が無い商品なので、グッズ商品CSV登録の取込で作られた言語JP・状態NMの商品規格は、残りの商品規格を足したあと削除した`);
  // 入庫（在庫が1以上の規格だけ。0の規格は入庫しない）
  await 入庫して承認する(browser, seedId, d.規格.filter((k) => k.在庫 > 0).map((k) => ({ 商品コード: コード(k.印), 数量: k.在庫 })), issue);
  // 画面での削除（入庫のあと）
  const 消す = [...d.規格.filter((k) => k.削除), ...(取込の規格 ? [] : [取込])];
  if (消す.length) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const k of 消す) await 規格を削除する(page, 商品ID, 規格ID[k.印], `${seedId}: ${コード(k.印)} の削除`, issue);
    });
  }
  // 画面で作れない状態（DB。E2E の行だけ）
  let 並び = 1;
  for (const f of d.商品画像 ?? []) 商品画像を足す(`${seedId}: 商品画像 ${f}`, 商品ID, f, 並び++);
  for (const k of d.規格) {
    const id = 規格ID[k.印];
    if (k.通常価格 !== undefined) 通常価格を書く(`${seedId}: 通常価格`, id, k.通常価格);
    if (k.週間販売数量 !== undefined) 週間販売数量を足す(`${seedId}: 週間販売数量`, id, k.週間販売数量);
    for (const img of k.規格画像 ?? []) {
      const imageId = 商品画像を足す(`${seedId}: 規格画像 ${img.ファイル名}`, 商品ID, img.ファイル名, 並び++);
      規格画像を紐付ける(`${seedId}: 規格画像 ${img.ファイル名} の順位 ${img.順位}`, id, imageId, img.順位);
    }
    if (k.DBで削除済み) 規格を削除済みにする(`${seedId}: 最後の1件の商品規格を削除済みにする`, id);
  }
  if (d.規格.some((k) => k.週間販売数量 !== undefined)) issue("週間販売数量（店舗ID 1・EC販売分）は画面で指定できないので、E2E の商品規格に DB で行を足した（シード表のとおり）");
  if (d.規格.some((k) => k.規格画像?.length) || d.商品画像?.length) issue("商品画像・規格画像は決まったファイル名で画面から置けないので、画像の行だけを DB に足した（実体は置かない。シード表は保存先へ直接置くと定める）");
  if (d.規格.some((k) => k.通常価格 !== undefined)) issue("通常価格は商品規格登録編集画面に入力欄が無いので、E2E の商品規格に DB で書いた");
  if (d.規格.some((k) => k.DBで削除済み)) issue("唯一の商品規格は画面で削除できないので、DB で削除済み（廃止・非表示）にした（シード表のとおり）");
  if (d.カード) issue(`カードのマスタは新しく作らず、開発環境に既にある商品の付いていないカード詳細（カード詳細ID ${d.カード.カード詳細ID}「${d.カード.カード名}」・カードID ${d.カード.カードID}）を紐付けた`);
  // 呼び名を控える
  控える(notes, seedId, `〔商品ID-${呼び名の頭}${d.印}〕`, 商品ID);
  for (const k of d.規格) 控える(notes, seedId, `〔商品規格ID-${呼び名の頭}${k.印}〕`, 規格ID[k.印]);
  if (d.カード) {
    控える(notes, seedId, `〔カードID-${呼び名の頭}${d.印}〕`, d.カード.カードID);
    控える(notes, seedId, `〔カード詳細ID-${呼び名の頭}${d.印}〕`, d.カード.カード詳細ID);
  }
  if (d.商品を消す) {
    await withAdminSession(browser, SETUP_ADMIN, (page) => 商品を削除する(page, 商品ID, `${seedId}: 商品ID ${商品ID} の削除`));
    issue(`商品ID ${商品ID} は、画面で登録して商品IDを控えたあと、商品登録編集の「削除」で削除した（シード表のとおり）`);
  }
  return { 商品ID, 規格ID };
}
