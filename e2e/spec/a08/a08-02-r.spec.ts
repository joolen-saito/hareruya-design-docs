/**
 * A08-02 指定言語の設定済みトップバナー一覧を取得（GET /topBanners/{言語コード}.json）の 007（-r。2026-11-25）。正本: cases/A08-02_test_cases.tsv
 * 要求の送り方・「開発者ツールの代わり」は a08-02.spec.ts と同じ。項目名・言語コードは正本のとおり（imageUrl・dispType・nameJp・code「de」）。
 * ケースの終わりに、足した E2E のトップバナーを片づける（DE の状態をもとに戻す）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 前の実行のバナーを片づける } from "../../db/a08_r";
import { 取得する, 応答 } from "../../pages/api/a08_02_top_banners";
import { 画像URL007, リンク007 } from "../../seeds/a08-02-r";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const o = (v: unknown): Record<string, unknown> | null => (v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

caseTest("IT-A08-02-007", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔トップバナーID-A0802-007〕");
  const 画像URL = notes.get("〔画像URL-A0802-007〕");
  const 言語ID = notes.get("〔言語ID-A0802-007〕");
  let r: 応答 | null = null;
  await step(1, async () => {
    r = await 取得する(page, "de");
    note(`GET /topBanners/de.json・応答 HTTP ${r.ステータス}・本文の先頭 ${r.本文.slice(0, 400)}`);
    supplement(`言語ID 108020701 は、既にあるドイツ語（言語コード DE）の言語ID ${言語ID} に、トップバナーID 108027001 は振られた番号 ${id} に、画像URLは末尾に実行の印を付けた値「${画像URL}」に読み替えた`);
  });
  await step(2, async () => { note("ブラウザで開いて開発者ツールの Network で見る代わりに、試験ブラウザから GET を送り、応答の HTTP ステータスと本文（JSON）を読む"); });
  try {
    await expected(async () => {
      const a = Array.isArray(r?.json) ? (r?.json as unknown[]) : null;
      expect.soft(r?.ステータス, "HTTP ステータス").toBe(200);
      expect.soft(a, "ラップオブジェクトを持たない配列").not.toBeNull();
      expect.soft(a?.length, "1要素の配列").toBe(1);
      const b = o(a?.[0]);
      expect.soft(b?.id, "id").toBe(Number(id));
      expect.soft(b?.imageUrl, "imageUrl（印を付けた値）").toBe(画像URL);
      expect.soft(String(画像URL).startsWith(画像URL007), "印を付ける前の値が正本の画像URL").toBe(true);
      expect.soft(b?.link, "link").toBe(リンク007);
      expect.soft(b?.dispType, "dispType").toBe(1);
      const ls = Array.isArray(b?.languages) ? (b?.languages as unknown[]) : [];
      expect.soft(ls.length, "languages が言語1件だけ").toBe(1);
      const l = o(ls[0]);
      expect.soft(l?.id, "languages の言語ID（ドイツ語）").toBe(Number(言語ID));
      expect.soft(l?.nameJp, "nameJp").toBe("ドイツ語");
      expect.soft(l?.nameEn, "nameEn").toBe("German");
      expect.soft(l?.code, "code").toBe("de");
    });
  } finally {
    前の実行のバナーを片づける("IT-A08-02-007: ケースの後始末", 画像URL007);
  }
});
