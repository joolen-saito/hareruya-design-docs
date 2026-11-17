/**
 * A06-04 店頭買取受注コメント更新（MTGBuyer の API の PUT …/otcBuyOrder/{受注ID}/freeComment.json）。正本: cases/A06-04_test_cases.tsv
 * 実装したケースと解釈は記録 review/A06-04_progress_2026-11-17_dev.md。
 *
 * - 「ブラウザの開発者ツールから要求を送る」「Network で確かめる」は、ブラウザのページから API サーバーへ要求を送り、送った要求と応答をページに出して
 *   読む形にした（pages/admin/a06_mtgbuyer_api.ts）。フリーコメントは、ケースの文のとおり URL のクエリパラメータで送る（pages/admin/a06_mtgbuyer_api.ts）。
 * - 有効なトークン（事前準備の「有効な jwt-token を取得している」）は、手順1の前に管理者のログイン API で受け取る。
 * - 009（環境の鍵で署名した、管理者のいないトークン）は、環境の署名の鍵を使わないと作れないので書いていない。
 */
import { Page, test } from "@playwright/test";
import { 店頭買取の受注 } from "../../db/a06";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { OtcDetail } from "../../pages/admin/m06_03_detail";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { 試験支店 } from "../../pages/admin/reuse_store";
import { コメント更新を送る, トークンを受け取る, 違う鍵のトークン, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0604_AB_ADM, A0604_ADM } from "../../seeds/a06-04";
import "../../seeds/a06-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 印の補い = "管理者の名前・ログインIDは、実行をまたいで使い回す決まった印（-E2E。ログインIDは小文字）を付けた値で作り、ケースの値もその値として読んだ";

/** 事前準備の「有効な jwt-token を取得している」: 管理者のログイン API で受け取る */
async function 有効なトークン(page: Page, a = A0604_ADM): Promise<string> {
  supplement(`${印の補い}。有効なトークンは、手順1の前に管理者のログイン API へ管理者のログインID・パスワードを送って受け取った（値は記録しない）`);
  return トークンを受け取る(page, a.loginId, a.password);
}

/** 応答データが無いこと（本文が空） */
function 応答データが無い(r: 応答): void {
  expect.soft(r.本文, "応答データ（無いこと）").toBe("");
}

/** 有効なトークンでフリーコメントを送り、DB でフリーコメントと更新担当者を確かめる（002・003） */
function 送って確かめる(n: string, 拡張子: string) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const 受注ID = notes.get(`〔受注ID-A0604-${n}〕`);
    const token = await 有効なトークン(page);
    let r!: 応答;
    let 受注: ReturnType<typeof 店頭買取の受注> = null;
    await step(1, async () => {
      r = await コメント更新を送る(page, "フリーコメントの更新", 受注ID, { コメント: "身分証明書なし", トークン: token, 拡張子: 拡張子 });
    });
    await step(2, async () => {
      受注 = 店頭買取の受注(受注ID);
      note(`DB: 受注ID ${受注ID} のフリーコメント「${受注?.フリーコメント}」・更新担当者の管理者ID ${受注?.更新担当者ID}（要求の応答は HTTP ${r.ステータス}）`);
    });
    await expected(async () => {
      const 今 = 店頭買取の受注(受注ID);
      expect.soft(今?.フリーコメント, `受注ID ${受注ID} のフリーコメント`).toBe("身分証明書なし");
      expect.soft(今?.更新担当者ID, `受注ID ${受注ID} の更新担当者（〔管理者ID-A0604-共有A〕）`).toBe(notes.get("〔管理者ID-A0604-共有A〕"));
    });
  };
}

caseTest("IT-A06-04-001", async ({ page, notes, step, expected }) => {
  const 受注ID = notes.get("〔受注ID-A0604-001〕");
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => {
    r = await コメント更新を送る(page, "フリーコメントの更新", 受注ID, { コメント: "身分証明書なし", トークン: token });
  });
  await step(2, async () => { note(`要求の方式 PUT・HTTP ステータス ${r.ステータス}・応答本体 ${r.本文 === "" ? "（空）" : r.本文.slice(0, 200)}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "PUT 要求の HTTP ステータス").toBe(200);
    応答データが無い(r);
  });
});

caseTest("IT-A06-04-002", 送って確かめる("002", ".json"));
caseTest("IT-A06-04-003", 送って確かめる("003", ""));

caseTest("IT-A06-04-007", async ({ page, notes, step, expected }) => {
  const 受注ID = notes.get("〔受注ID-A0604-007〕");
  let r!: 応答;
  await step(1, async () => {
    r = await コメント更新を送る(page, "フリーコメントの更新（トークンなし）", 受注ID, { コメント: "身分証明書なし" });
  });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => { expect(r.ステータス, "HTTP ステータス").toBe(401); });
});

caseTest("IT-A06-04-008", async ({ page, notes, step, expected }) => {
  const 受注ID = notes.get("〔受注ID-A0604-008〕");
  let token = "";
  let r!: 応答;
  await step(1, async () => {
    token = 違う鍵のトークン(notes.get("〔管理者ID-A0604-共有A〕"));
    note(`環境の署名の鍵と違う試験用の鍵（HS256）で、管理者ID ${notes.get("〔管理者ID-A0604-共有A〕")} を利用者IDに持つトークンを作った（${token.length}文字・値は記録しない）`);
  });
  await step(2, async () => {
    r = await コメント更新を送る(page, "フリーコメントの更新（違う鍵で署名したトークン）", 受注ID, { コメント: "身分証明書なし", トークン: token });
  });
  await step(3, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => { expect(r.ステータス, "HTTP ステータス").toBe(401); });
});

caseTest("IT-A06-04-010", async ({ page, step, expected }) => {
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => {
    r = await コメント更新を送る(page, "フリーコメントの更新（無い受注ID）", "699999010", { コメント: "身分証明書なし", トークン: token });
  });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => { expect(r.ステータス, "HTTP ステータス").toBe(404); });
});

caseTest("IT-A06-04-011", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => {
    r = await コメント更新を送る(page, "フリーコメントの更新（トークンもフリーコメントもなし・無い受注ID）", "699999011", {  });
  });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => { expect(r.ステータス, "HTTP ステータス（受注とコメントより先に認証を判定）").toBe(401); });
});

caseTest("IT-A06-04-012", async ({ page, step, expected }) => {
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => {
    r = await コメント更新を送る(page, "フリーコメントの更新（フリーコメントなし・無い受注ID）", "699999012", { トークン: token });
  });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => { expect(r.ステータス, "HTTP ステータス（コメントより先に受注の存在を判定）").toBe(404); });
});

caseTest("IT-A06-04-018", async ({ page, notes, step, expected }) => {
  const 受注ID = notes.get("〔受注ID-A0604-018〕");
  const token = await 有効なトークン(page);
  let r1!: 応答;
  let r2!: 応答;
  await step(1, async () => {
    r1 = await コメント更新を送る(page, "フリーコメントの更新（1回目）", 受注ID, { コメント: "身分証明書なし", トークン: token });
    expect.soft(r1.ステータス, "1回目の HTTP ステータス").toBe(200);
  });
  await step(2, async () => {
    r2 = await コメント更新を送る(page, "フリーコメントの更新（2回目・同じトークン）", 受注ID, { コメント: "書類不備あり", トークン: token });
  });
  await step(3, async () => {
    const 受注 = 店頭買取の受注(受注ID);
    note(`DB: 受注ID ${受注ID} のフリーコメント「${受注?.フリーコメント}」・更新担当者の管理者ID ${受注?.更新担当者ID}`);
  });
  await expected(async () => {
    const 受注 = 店頭買取の受注(受注ID);
    expect.soft(r2.ステータス, "2回目の HTTP ステータス").toBe(200);
    expect.soft(受注?.フリーコメント, `受注ID ${受注ID} のフリーコメント（2回目の値）`).toBe("書類不備あり");
    expect.soft(受注?.更新担当者ID, `受注ID ${受注ID} の更新担当者（〔管理者ID-A0604-共有A〕のまま）`).toBe(notes.get("〔管理者ID-A0604-共有A〕"));
  });
});

caseTest("IT-A06-04-019", async ({ page, notes, step, expected }) => {
  const 査定ID = notes.get("〔査定ID-A0604AB-001〕");
  const 受注ID = notes.get("〔受注ID-A0604AB-001〕");
  const list = new OtcListPage(page);
  const d = new OtcDetail(page);
  /** 買取一覧で試験支店・査定IDを入れて検索し、査定IDのリンクから買取詳細を開く */
  const 一覧から開く = async (): Promise<void> => {
    await list.open();
    await list.買取店舗を選ぶ(試験支店.店名);
    await list.査定IDを入れる(査定ID);
    await list.検索する();
    await list.詳細を開く(査定ID);
    await expect(page, "開いた買取詳細の画面").toHaveURL(d.詳細のURL(受注ID));
  };
  let token = "";
  let r!: 応答;
  await step(1, async () => {
    supplement(`${印の補い}。買取店舗「A06-04AB試験店舗」は試験店舗の使い回し（2026-11-13 依頼者決定）で試験支店「${試験支店.店名}」に読み替えた`);
    await loginAdmin(page, A0604_AB_ADM);
    await 一覧から開く();
  });
  await step(2, async () => {
    expect.soft(await d.フリーコメント().inputValue(), "買取詳細のフリーコメント欄（送る前）").toBe("更新前コメント001");
  });
  await step(3, async () => {
    token = await トークンを受け取る(page, A0604_AB_ADM.loginId, A0604_AB_ADM.password);
    note("有効な jwt-token は、管理者「A06-04AB試験担当」のログインID・パスワードで管理者のログイン API を呼んで受け取った（値は記録しない）");
    r = await コメント更新を送る(page, "店頭買取受注コメント更新", 受注ID, { コメント: "AB連携コメント001", トークン: token });
  });
  await step(4, async () => { expect.soft(r.ステータス, "応答の HTTP ステータス").toBe(200); });
  await step(5, async () => { await 一覧から開く(); });
  await expected(async () => {
    const v = await d.フリーコメント().inputValue();
    expect.soft(v, "買取詳細のフリーコメント欄（「更新前コメント001」でない）").not.toBe("更新前コメント001");
    expect.soft(v, "買取詳細のフリーコメント欄").toBe("AB連携コメント001");
  });
});
