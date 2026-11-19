/**
 * A06-02 未完了店頭買取一覧取得（MTGBuyer の API。GET …/admin/otcBuyOrders.json）。正本: cases/A06-02_test_cases.tsv。
 * 記録 review/A06-02_progress_2026-11-20_dev.md。要求の送り方は pages/admin/a06_mtgbuyer_api.ts（A06-01・A06-04 と同じ）。
 * - ケースの文のパス `/api/admin/otcBuyOrders.json` は、API サーバーの入口 /api/v1 に読み替えて送る（課題 4239）。
 * - 書いたのは、店頭買取のデータを作らずに確かめられる 014（トークンなし）・015（違う鍵で署名したトークン）だけ。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 送る, 違う鍵のトークン, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import "../../seeds/a06-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

const 一覧のパス = "/api/admin/otcBuyOrders.json";

function 一覧を取る(page: Parameters<typeof 送る>[0], 何: string, トークン?: string): Promise<応答> {
  return 送る(page, 何, { 方式: "GET", パス: 一覧のパス, トークン });
}

caseTest("IT-A06-02-014", async ({ page, step, expected }) => {
  supplement("ケースの文のパス（/api/admin/…）は、API サーバーの入口 /api/v1 に読み替えて送った（課題 4239）。" +
    "要求はテストから API サーバーへ直接送り、送った要求と応答をページに出した（開発者ツールの代わり）。新しいブラウザのコンテキストで、jwt-token を自動で付ける設定は無い");
  let r!: 応答;
  await step(1, async () => { r = await 一覧を取る(page, "未完了店頭買取一覧取得（jwt-token なし）"); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => { expect(r.ステータス, "HTTP ステータス").toBe(401); });
});

caseTest("IT-A06-02-015", async ({ page, step, expected }) => {
  supplement("ケースの文のパス（/api/admin/…）は、API サーバーの入口 /api/v1 に読み替えて送った（課題 4239）。" +
    "トークンの利用者IDは、正本が定めないので 1 にした（署名が違うことを確かめるケースで、値は確かめない）");
  let token = "";
  let r!: 応答;
  await step(1, async () => {
    token = 違う鍵のトークン("1");
    note(`環境の署名の鍵と違う試験用の鍵（HS256）でトークンを作った（${token.length}文字・値は記録しない）`);
  });
  await step(2, async () => { r = await 一覧を取る(page, "未完了店頭買取一覧取得（違う鍵で署名したトークン）", token); });
  await step(3, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => { expect(r.ステータス, "HTTP ステータス").toBe(401); });
});
