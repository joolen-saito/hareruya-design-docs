/**
 * A14-01 の 006・007 のシード（記録 review/A14-01_progress_2026-11-25_dev.md の 11/26 の節）。作り方は seeds/a14-01.ts と同じ（カード詳細(登録)画面・名前に実行の印）。
 * - S-A14-01-FULL-006: 固有色「黒」・色順（名称は決まった印つき・並び順12）・カード詳細3件（Foil なし・通常・特殊 = 0・1・2、フレームはいずれも通常）。
 *   カード詳細の控えは、DB のFoil値が 0・1・2 のものを A・B・C とした。レアリティ・レイアウト・プロモ種別は画面で必須のため選択肢の先頭（シード表は、A にレイアウトID=1 などを指定するが、ケースは確かめない）。
 *   固有色IDは名前「黒」のマスタで引く（シード表のID 3は開発環境では別の色のことがある）。
 * - S-A14-01-FULL-007: カードフォーマット3件（フォーマットは開発環境の番号の小さい順に3つ・制限は使用可・制限・禁止）。
 */
import { SETUP_ADMIN } from "../config/env";
import { カード詳細の値, カードの値, マスターの行 } from "../db/a14_cards";
import { 先頭のフォーマット } from "../db/a14_01_b";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 色順を用意する } from "../pages/admin/a14_setup";
import { カードを作る } from "./a14-01";

export const 色順006の名称 = (): string => rcFixed("色順確認-A1401-006-A");

defineSeed("S-A14-01-FULL-006", async ({ browser, notes, seed }) => {
  const 黒 = マスターの行("カラー", "黒");
  if (!黒) throw new Error(`${seed.シードID}: 開発環境に色「黒」のマスターが無い`);
  const 名称 = 色順006の名称();
  let 作った = false;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    作った = await 色順を用意する(page, 名称, "12", `${seed.シードID}: 色順`);
  });
  const r = await カードを作る(browser, seed.シードID, "006", {
    カード名日: rc("スカラベの饗宴-006"), カード名英: rc("Scarab Feast-006"), 点数で見たマナ: "0", 固有色: ["黒"], 色順: 名称,
    詳細: [{ Foil: "なし", フレーム: "通常" }, { Foil: "通常", フレーム: "通常" }, { Foil: "特殊", フレーム: "通常" }],
  }, "2026-09-01 10:06:00+09", notes, true);
  const 旗ごと = new Map(r.カード詳細IDs.map((id) => [String(カード詳細の値(id).foil), id]));
  for (const [旗, 添字] of [["0", "A"], ["1", "B"], ["2", "C"]] as const) {
    const id = 旗ごと.get(旗);
    if (!id) throw new Error(`${seed.シードID}: Foil が ${旗} のカード詳細が作られていない（作られたのは ${r.カード詳細IDs.join("・")}）`);
    notes.set(`〔カード詳細ID-A1401-006${添字}〕`, id);
  }
  notes.set("〔色順ID-A1401-006〕", String(カードの値(r.カードID).color_sequence_id ?? ""));
  reportSeedIssue(seed.シードID, `色順「${名称}」（並び順12）は、MTGマスターデータ管理で決まった印つきの名称で${作った ? "1度だけ登録した" : "前の実行で登録したものを使い回した"}（全員が使うマスタ。依頼者決定 2026-11-14）。` +
    `固有色は名前「黒」（色ID ${黒.id}）。シード表のID 3・色順ID 4 は開発環境では別の行のことがあるので、名前で読み替えた`);
});

defineSeed("S-A14-01-FULL-007", async ({ browser, notes, seed }) => {
  const f = 先頭のフォーマット(3);
  if (f.length < 3) throw new Error(`${seed.シードID}: 開発環境にフォーマットが3つ無い`);
  const r = await カードを作る(browser, seed.シードID, "007", {
    カード名日: rc("スカラベの饗宴-007"), カード名英: rc("Scarab Feast-007"), 点数で見たマナ: "0", 詳細: false,
    リーガリティ: [{ フォーマット: f[0].名日, リーガリティ: "使用可" }, { フォーマット: f[1].名日, リーガリティ: "制限" }, { フォーマット: f[2].名日, リーガリティ: "禁止" }],
  }, "2026-09-01 10:07:00+09", notes);
  reportSeedIssue(seed.シードID, `フォーマットは、シード表のID 1・2・3でなく、開発環境で番号の小さい順の3つ（${f.map((x) => `ID ${x.id}「${x.名日}」`).join("・")}）に、制限を 使用可・制限・禁止 の順に付けた（カードID ${r.カードID}）`);
});
