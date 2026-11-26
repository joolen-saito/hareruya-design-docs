/**
 * A14-01 カードIDからカード情報を取得（GET /api/cards/{カードID}）。正本: cases/A14-01_test_cases.tsv
 * 判定済みのケースがある a14-01.spec.ts の指紋を変えないよう、別のファイルにした。書いたケース: 006・007・013。
 * 「開発者ツールの Network」の代わりの読み方は a14-01.spec.ts と同じ（試験ブラウザから認証の見出しなしで要求し、状態・本文を読む）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { カードのフォーマット } from "../../db/a14_01_b";
import { カードの関連, カード詳細の値, カードの値, 色順の行 } from "../../db/a14_cards";
import { カード情報を取得, カード情報を取得_転送を追う, 値, 項目がある, 一覧, 項目, 要約, 応答 } from "../../pages/api/a14_cards";
import "../../seeds/a14-01";
import "../../seeds/a14-01-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const NETWORK = "開発者ツールの Network の代わりに、試験ブラウザから送った要求の、要求メソッド・HTTP ステータス・応答本文をそのまま読む";
const n = (v: string) => Number(v);

caseTest("IT-A14-01-006", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-006〕");
  const 詳細 = (["A", "B", "C"] as const).map((k) => notes.get(`〔カード詳細ID-A1401-006${k}〕`));
  const sid = String(カードの値(id).color_sequence_id ?? ""); // 色順IDはシード表が控えると定めない。DB のカードの行から読む
  let db: { 固有色: { id: string; name_jp: string | null; name_en: string | null }[]; 詳細: { id: string; foil: string | null; frame: string | null }[]; 色順: ReturnType<typeof 色順の行> } | undefined;
  let r!: 応答;
  await step(1, async () => {
    db = {
      固有色: カードの関連(id).color_identities,
      詳細: 詳細.map((d) => ({ id: d, foil: カード詳細の値(d).foil as string | null, frame: カード詳細の値(d).frame as string | null })),
      色順: 色順の行(sid),
    };
    note(`DB: ${JSON.stringify(db)}`);
  });
  await step(2, async () => { r = await カード情報を取得(page, id); note(要約(r)); });
  await step(3, async () => { note(NETWORK); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    const 固有色 = 一覧(r.json, "color_identities") ?? [];
    const 黒 = 固有色.find((c) => c.name_jp === "黒");
    expect.soft(黒?.name_en, "color_identities に名称「黒」・「Black」の固有色が含まれる（名称（英））").toBe("Black");
    expect.soft(固有色.map((c) => String(c.id)), "color_identities の固有色ID（DB の値）").toEqual((db?.固有色 ?? []).map((c) => c.id));
    const cds = 一覧(r.json, "card_details") ?? [];
    for (const [i, d] of 詳細.entries()) {
      const e = cds.find((x) => String(x.id) === d);
      expect.soft(e, `card_details にカード詳細ID ${d}（${["A", "B", "C"][i]}）の要素がある`).toBeTruthy();
      expect.soft(e?.foil, `カード詳細 ${["A", "B", "C"][i]} の foil（0・1・2 の順）`).toBe(i);
      expect.soft(e?.frame, `カード詳細 ${["A", "B", "C"][i]} の frame（DB の値）`).toBe(db?.詳細[i].frame);
      expect.soft(項目がある(e, "foil_flg"), `カード詳細 ${["A", "B", "C"][i]} に foil_flg が含まれない`).toBe(false);
      expect.soft(項目がある(e, "promotion_flg"), `カード詳細 ${["A", "B", "C"][i]} に promotion_flg が含まれない`).toBe(false);
      expect.soft(項目がある(e, "promotion"), `カード詳細 ${["A", "B", "C"][i]} のプロモ種別が promotion の項目で返る`).toBe(true);
    }
    const cs = 項目(r.json, "color_sequence");
    expect.soft(項目がある(cs, "rank"), "color_sequence に rank が含まれない").toBe(false);
    expect.soft(値(cs, "sort_no"), "color_sequence.sort_no（色順の並び順）").toBe(n(db?.色順?.sort_no ?? "-1"));
  });
});

caseTest("IT-A14-01-007", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔カードID-A1401-007〕");
  let r!: 応答;
  await step(1, async () => { r = await カード情報を取得(page, id); note(要約(r)); });
  await step(2, async () => { note(NETWORK); note(`DB のカードフォーマット: ${JSON.stringify(カードのフォーマット(id))}`); });
  await expected(async () => {
    const 制限 = (一覧(r.json, "card_formats") ?? []).map((f) => f.restriction_id).sort();
    expect.soft(r.ステータス, "HTTPステータス").toBe(200);
    expect.soft(制限, "card_formats の restriction_id（1の使用可・2の制限・3の禁止の3件）").toEqual([1, 2, 3]);
  });
});

caseTest("IT-A14-01-013", async ({ page, step, expected }) => {
  let r!: 応答 & { 転送の状態: number };
  await step(1, async () => { r = await カード情報を取得_転送を追う(page, ""); note(要約(r)); });
  await step(2, async () => { note(NETWORK); note(`最初の応答 ${r.転送の状態}・転送を追った最後の応答のHTTPステータス ${r.ステータス}（${r.URL}）`); });
  await expected(async () => { expect(r.ステータス, "カードIDを付けない要求の HTTPステータス").toBe(404); });
});
