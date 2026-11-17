/**
 * A06-13 本人確認証明書更新（MTGBuyer の API の PUT …/otcBuyOrder/{店頭買取ID}/identification.json）。正本: cases/A06-13_test_cases.tsv
 * 実装したケースと解釈は記録 review/A06-13_progress_2026-11-17_dev.md。
 *
 * - 「ブラウザの開発者ツールから要求を送る」「Network で確かめる」は、ブラウザのページから API サーバーへ要求を送り、送った要求と応答をページに出して
 *   読む形にした（pages/admin/a06_mtgbuyer_api.ts）。証明書IDは、ケースの文のとおり URL のクエリで送る。
 * - 有効なトークンは、手順1の前に管理者のログイン API で受け取る（事前準備の「有効な jwt-token を取得する」）。
 * - 001（MTGBuyer の画面）、010・011（環境の鍵で署名した、管理者のいないトークン）は書いていない。
 */
import { Page, test } from "@playwright/test";
import { 店頭買取の受注 } from "../../db/a06";
import { caseTest, expect } from "../../lib/case";
import { トークンを受け取る, 証明書更新を送る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0613_ADM } from "../../seeds/a06-13";
import "../../seeds/a06-13";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

async function 有効なトークン(page: Page): Promise<string> {
  supplement("管理者の名前・ログインIDは、実行をまたいで使い回す決まった印（-E2E。ログインIDは小文字）を付けた値で作った。有効なトークンは、手順1の前に管理者のログイン API へログインID・パスワードを送って受け取った（値は記録しない）");
  return トークンを受け取る(page, A0613_ADM.loginId, A0613_ADM.password);
}
const json = (r: 応答) => (r.json ?? {}) as Record<string, unknown>;

caseTest("IT-A06-13-002", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔店頭買取ID-A0613-002〕");
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => { r = await 証明書更新を送る(page, "本人確認証明書の更新", id, "2", token); });
  await step(2, async () => { note(`要求の方式 PUT・HTTP ステータス ${r.ステータス}`); });
  await expected(async () => {
    expect.soft(r.送ったパス.split("?")[0].endsWith(`/otcBuyOrder/${id}/identification.json`), "要求を送ったパスが、その店頭買取IDの本人確認証明書更新（入口は /api/v1 に読み替え）").toBe(true);
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
  });
});

caseTest("IT-A06-13-005", async ({ page, step, expected }) => {
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => { r = await 証明書更新を送る(page, "本人確認証明書の更新（無い店頭買取ID）", "699999005", "2", token); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}・応答の項目 ${Object.keys(json(r)).join("、") || "なし"}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft("code" in json(r), "応答に処理結果コードがある").toBe(true);
    expect.soft(Array.isArray(json(r).errors), "応答にエラーの一覧（配列）がある").toBe(true);
  });
});

caseTest("IT-A06-13-014", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔店頭買取ID-A0613-014〕");
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => { r = await 証明書更新を送る(page, "本人確認証明書の更新", id, "2", token); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}・応答本体 ${r.本文 || "（空）"}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json, "応答本体（処理結果コード 200 の1項目だけの JSON）").toEqual({ code: 200 });
  });
});

caseTest("IT-A06-13-018", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔店頭買取ID-A0613-018〕");
  const token = await 有効なトークン(page);
  let r1!: 応答;
  let r2!: 応答;
  let 控えた更新日時 = "";
  let 一回目: ReturnType<typeof 店頭買取の受注> = null;
  await step(1, async () => { r1 = await 証明書更新を送る(page, "本人確認証明書の更新（1回目・パスポート）", id, "2", token); });
  await step(2, async () => {
    一回目 = 店頭買取の受注(id);
    控えた更新日時 = 一回目?.更新日時 ?? "";
    note(`1回目: HTTP ${r1.ステータス}・応答 ${r1.本文 || "（空）"}／DB: 本人確認証明書ID ${一回目?.本人確認証明書ID}・更新担当者 ${一回目?.更新担当者ID}・更新日時 ${控えた更新日時}（控えた）`);
  });
  await step(3, async () => { r2 = await 証明書更新を送る(page, "本人確認証明書の更新（2回目・自動車運転免許証）", id, "1", token); });
  await step(4, async () => { note(`2回目: HTTP ${r2.ステータス}・応答 ${r2.本文 || "（空）"}`); });
  let 二回目: ReturnType<typeof 店頭買取の受注> = null;
  await step(5, async () => {
    二回目 = 店頭買取の受注(id);
    note(`DB: 本人確認証明書ID ${二回目?.本人確認証明書ID}・更新担当者 ${二回目?.更新担当者ID}・更新日時 ${二回目?.更新日時}`);
  });
  await expected(async () => {
    const 管理者 = notes.get("〔管理者ID-A0613-共有〕");
    expect.soft(r1.ステータス, "1回目の HTTP ステータス").toBe(200);
    expect.soft(一回目?.本人確認証明書ID, "1回目のあとの本人確認証明書ID").toBe("2");
    expect.soft(一回目?.更新担当者ID, "1回目のあとの更新担当者ID（〔管理者ID-A0613-共有〕）").toBe(管理者);
    expect.soft(二回目?.本人確認証明書ID, "2回目のあとの本人確認証明書ID").toBe("1");
    expect.soft(二回目?.更新担当者ID, "2回目のあとの更新担当者ID（〔管理者ID-A0613-共有〕）").toBe(管理者);
    expect.soft((二回目?.更新日時 ?? "") >= 控えた更新日時 && 控えた更新日時 !== "", `2回目のあとの更新日時が、手順2で控えた値（${控えた更新日時}）以降`).toBe(true);
  });
});
