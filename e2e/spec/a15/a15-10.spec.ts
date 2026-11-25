/**
 * A15-10 デッキ情報更新（デッキビルダーの API の PUT /api/deck/{デッキID}）。正本: cases/A15-10_test_cases.tsv
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザから API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む。
 * アクセストークンは、所有者の会員でログインの API から受け取る（署名鍵は使わない）。更新の対象デッキはシードが登録の API で作る。
 * 書いたケース: 001〜009・011〜014・016・031・032。
 * 書かないケース: 010（プレイヤーの無い顧客のトークンは正規の手段で得られない。A15-09 の010と同じ）、019・028・035・036（Redis の一時保存の内容を直接見る手順。E2E から Redis は参照できない）、
 *   033・034（イベント・管理画面の連携の別系統）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { デッキの内容を読む } from "../../db/a15_18";
import { ログインする, 署名を1文字変える } from "../../pages/api/a15_18_deck_update_import";
import { デッキを更新する, 更新要求, 応答 } from "../../pages/api/a15_10_deck_update";
import { 所有者の定め } from "../../seeds/a15-10";
import "../../seeds/a15-10";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザからデッキ情報更新 API（PUT /api/deck/{デッキの識別子}）へ要求を送り、応答の HTTP ステータスと本文を読んだ（Network の代わり）";
const トークンの補い = "所有者の有効なトークンは、シード表の「テスト用認証データ作成機構で発行」の代わりに、所有者の会員でログインの API を呼んで受け取った（値は記録しない）";
const 識別子の補い = "更新の対象デッキの識別子は、シード表の固定の値でなく、シードが登録の API で作ったときに振られた番号（控えた番号）";

const 番号 = (ctx: CaseCtx, 呼び名: string): string => ctx.notes.get(呼び名);
const デッキ = (ctx: CaseCtx, n: string): string => { supplement(識別子の補い); const id = 番号(ctx, `〔デッキID-A1510-${n}〕`); note(`更新の対象デッキの識別子: ${id}`); return id; };
const A = (ctx: CaseCtx, 種: string, 記: string): string => 番号(ctx, `〔${種}-A1510-共有${記}〕`);

async function トークン(ctx: CaseCtx, 持ち主: "共有A" | "共有B" = "共有A"): Promise<string> {
  const 定め = 所有者の定め[持ち主];
  const { token, 応答 } = await ログインする(ctx.page, 定め.メール, 定め.パスワード);
  supplement(トークンの補い);
  note(`ログイン: POST /api/user/login・応答 HTTP ${応答.ステータス}`);
  if (!token) throw new Error(`ログインの API がトークンを返さない（HTTP ${応答.ステータス} ${応答.本文}）`);
  return token;
}

async function 送る(ctx: CaseCtx, token: string | undefined, id: string, 要求: 更新要求, 何 = "更新"): Promise<応答> {
  const r = await デッキを更新する(ctx.page, token, id, 要求);
  note(`${何}: PUT /api/deck/${id}${token !== undefined ? "（jwt-token 付き）" : "（jwt-token なし）"}・要求 ${JSON.stringify(要求).slice(0, 400)}・応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 400)}`);
  return r;
}
const 要点 = (r: 応答): string => `応答 HTTP ${r.ステータス}・結果コード ${JSON.stringify(r.json?.code)}・結果メッセージ ${JSON.stringify(r.json?.message)}`;

/** FULL-001・002 の更新内容（フォーマットB・アーキタイプB・公開1・代表カードC・キャンペーンタグA・B・採用カードA〜F の区画1〜6・枚数2・1・1・3・1・1） */
function 更新内容(ctx: CaseCtx): 更新要求 {
  const 枚 = [2, 1, 1, 3, 1, 1];
  return {
    deck_name: "更新後デッキ", format_id: Number(A(ctx, "フォーマットID", "B")), archetype_id: Number(A(ctx, "アーキタイプID", "B")), scope_id: 1,
    image_card_id: Number(A(ctx, "カードID", "C")), campaign_tag_ids: [Number(A(ctx, "キャンペーンタグID", "A")), Number(A(ctx, "キャンペーンタグID", "B"))],
    cards: ["A", "B", "C", "D", "E", "F"].map((k, i) => ({ card_id: Number(A(ctx, "カードID", k)), board_id: i + 1, count: 枚[i] })), instant_save_flag: true,
  };
}
const 成功 = (r: 応答) => {
  expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
  expect.soft(r.json?.code, "処理結果コード").toBe(200);
  expect.soft(r.json?.message, "処理結果メッセージ").toBe("Deck update success");
};
const 失敗 = (r: 応答, 状態: number, 文: string) => {
  expect.soft(r.ステータス, "HTTP ステータス").toBe(状態);
  expect.soft(JSON.stringify(r.json?.message ?? ""), `応答のメッセージに「${文}」が含まれる（${要点(r)}）`).toContain(文);
};

caseTest("IT-A15-10-001", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 送る(ctx, await トークン(ctx), デッキ(ctx, "001"), 更新内容(ctx)); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => { 成功(r); expect.soft(r.ステータス, "HTTP ステータス200").toBe(200); });
});

caseTest("IT-A15-10-002", async (ctx) => {
  let r!: 応答; const id = デッキ(ctx, "002");
  await ctx.step(1, async () => { r = await 送る(ctx, await トークン(ctx), id, 更新内容(ctx)); });
  await ctx.step(2, async () => { const d = デッキの内容を読む(id); note(`DB: ${JSON.stringify(d).slice(0, 700)}`); });
  await ctx.expected(async () => {
    const d = デッキの内容を読む(id);
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(d.名前, "デッキ名").toBe("更新後デッキ");
    expect.soft(d.フォーマット, "フォーマット").toBe(A(ctx, "フォーマットID", "B"));
    expect.soft(d.アーキタイプ, "アーキタイプ").toBe(A(ctx, "アーキタイプID", "B"));
    expect.soft(d.公開区分, "公開範囲").toBe("1");
    expect.soft(d.画像カード名, "代表カード画像のカード").toBe("更新前デッキカード用");
    expect.soft(d.タグ, "キャンペーンタグ").toEqual(["結合試験キャンペーンA", "結合試験キャンペーンB"]);
    const 区画 = new Map(d.明細.map((x) => [x, true]));
    for (const [i, 名] of ["結合試験カードA", "結合試験カードB", "更新前デッキカード用", "更新前メイビー用", "更新前アトラクション用", "更新前ステッカー用"].entries()) {
      const 枚 = [2, 1, 1, 3, 1, 1][i];
      expect.soft(d.明細.some((x) => x.includes(名) && x.includes(`${枚}枚`)), `カード「${名}」が${枚}枚で保存された（明細 ${[...区画.keys()].join(" / ")}）`).toBe(true);
    }
  });
});

caseTest("IT-A15-10-003", async (ctx) => {
  const id = デッキ(ctx, "003"); const 前 = デッキの内容を読む(id); let r!: 応答;
  await ctx.step(1, async () => { note("所有者のトークン・デッキ・即時保存=真・公開範囲=1を指定する"); });
  await ctx.step(2, async () => { r = await 送る(ctx, await トークン(ctx), id, { scope_id: 1, instant_save_flag: true }); });
  await ctx.step(3, async () => { note(`DB（更新前）: ${JSON.stringify(前).slice(0, 500)}`); note(`DB（更新後）: ${JSON.stringify(デッキの内容を読む(id)).slice(0, 500)}`); });
  await ctx.expected(async () => {
    const 後 = デッキの内容を読む(id);
    expect.soft(r.ステータス, `HTTP ステータス（${要点(r)}）`).toBe(200);
    for (const k of ["名前", "フォーマット", "アーキタイプ", "画像カード名"] as const) expect.soft(後[k], `${k}が更新前から変わらない`).toBe(前[k]);
    expect.soft(後.タグ, "キャンペーンタグが更新前から変わらない").toEqual(前.タグ);
    expect.soft(後.明細, "採用カードが更新前から変わらない").toEqual(前.明細);
  });
});

/** キャンペーンタグの指定の違い（004 は単一値・005 は配列）。保存されたタグを DB で確かめる */
function タグを指定する(n: string, 配列か: boolean) {
  return async (ctx: CaseCtx): Promise<void> => {
    const id = デッキ(ctx, n); let r!: 応答;
    const 甲 = A(ctx, "キャンペーンタグID", "A"), 乙 = A(ctx, "キャンペーンタグID", "B");
    await ctx.step(1, async () => { note(`キャンペーンタグの識別子を${配列か ? "配列で" : "単一値で"}指定して送る`); r = await 送る(ctx, await トークン(ctx), id, { scope_id: 1, instant_save_flag: true, campaign_tag_ids: 配列か ? [Number(甲), Number(乙)] : Number(甲) }); });
    await ctx.step(2, async () => { note(`${要点(r)}。DB: タグ ${JSON.stringify(デッキの内容を読む(id).タグ)}`); });
    await ctx.expected(async () => {
      const d = デッキの内容を読む(id);
      expect.soft(r.ステータス, `HTTP ステータス（${要点(r)}）`).toBe(200);
      expect.soft(d.タグ, "指定したキャンペーンタグが保存された").toEqual(配列か ? ["結合試験キャンペーンA", "結合試験キャンペーンB"] : ["結合試験キャンペーンA"]);
    });
  };
}
caseTest("IT-A15-10-004", タグを指定する("004", false));
caseTest("IT-A15-10-005", タグを指定する("005", true));

caseTest("IT-A15-10-006", async (ctx) => {
  const id = デッキ(ctx, "006"); const rs: 応答[] = []; let t = "";
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { t = await トークン(ctx); rs.push(await 送る(ctx, t, id, { scope_id: 1, instant_save_flag: true }, "公開範囲=1")); });
  await ctx.step(3, async () => { rs.push(await 送る(ctx, t, id, { scope_id: 2, instant_save_flag: true }, "公開範囲=2")); });
  await ctx.step(4, async () => { note(`2回の応答: ${rs.map(要点).join(" ／ ")}`); });
  await ctx.expected(async () => {
    rs.forEach((r, i) => {
      expect.soft(r.ステータス, `${i + 1}回目の HTTP ステータス`).toBe(200);
      expect.soft(Object.keys(r.json ?? {}).includes("display_token"), `${i + 1}回目の応答に閲覧用トークンが含まれない（本文 ${r.本文.slice(0, 200)}）`).toBe(false);
    });
  });
});

caseTest("IT-A15-10-007", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 送る(ctx, await トークン(ctx), デッキ(ctx, "007"), { scope_id: 3, instant_save_flag: true }); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => {
    成功(r);
    expect.soft(typeof r.json?.display_token === "string" && (r.json?.display_token as string).length > 0, `応答に閲覧用トークンが含まれる（本文 ${r.本文.slice(0, 200)}）`).toBe(true);
  });
});

caseTest("IT-A15-10-008", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 送る(ctx, undefined, デッキ(ctx, "008"), { scope_id: 1, instant_save_flag: true }); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(r.json?.code, "処理結果コードが返る").toBeTruthy();
    expect.soft(/Access Token is incorrect|Authentication failed/.test(String(r.json?.message ?? "")), `メッセージが「Access Token is incorrect」または「Authentication failed」（${要点(r)}）`).toBe(true);
  });
});

caseTest("IT-A15-10-009", async (ctx) => {
  let r!: 応答;
  let 改ざん = "";
  await ctx.step(1, async () => { const t = await トークン(ctx); 改ざん = 署名を1文字変える(t); note("所有者のトークンの末尾1文字を変更した（値は記録しない）"); });
  await ctx.step(2, async () => { r = await 送る(ctx, 改ざん, デッキ(ctx, "009"), { scope_id: 1, instant_save_flag: true }); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(/Access Token is incorrect|Authentication failed/.test(String(r.json?.message ?? "")), `メッセージが認証エラー（${要点(r)}）`).toBe(true);
  });
});

caseTest("IT-A15-10-011", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 送る(ctx, await トークン(ctx), "159999", { scope_id: 1, instant_save_flag: true }); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => { 失敗(r, 404, "The deck does not exist"); expect.soft(r.ステータス, "HTTP ステータス404").toBe(404); });
});

caseTest("IT-A15-10-012", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { note("所有者Aのトークンと、所有者Bのデッキを指定する"); });
  await ctx.step(3, async () => { r = await 送る(ctx, await トークン(ctx), デッキ(ctx, "012"), { scope_id: 1, deck_name: "所有者外更新", instant_save_flag: true }); });
  await ctx.step(4, async () => { note(要点(r)); });
  await ctx.expected(async () => { 失敗(r, 401, "Authentication failed"); expect.soft(r.ステータス, "HTTP ステータス401").toBe(401); });
});

caseTest("IT-A15-10-013", async (ctx) => {
  const id = デッキ(ctx, "013"); let r!: 応答;
  await ctx.step(1, async () => { note("所有者Aのトークンと、所有者Bのデッキを指定する"); });
  await ctx.step(2, async () => { r = await 送る(ctx, await トークン(ctx), id, { scope_id: 1, deck_name: "所有者外更新", instant_save_flag: true }); });
  await ctx.step(3, async () => { note(`DB: デッキ名「${デッキの内容を読む(id).名前}」`); });
  await ctx.expected(async () => { expect.soft(デッキの内容を読む(id).名前, `デッキ名が「他者所有デッキ」から変更されない（${要点(r)}）`).toBe("他者所有デッキ"); });
});

caseTest("IT-A15-10-014", async (ctx) => {
  let r!: 応答;
  let 改ざん = "";
  await ctx.step(1, async () => { const t = await トークン(ctx); 改ざん = 署名を1文字変える(t); note("所有者のトークンの末尾1文字を変更した（値は記録しない）"); });
  await ctx.step(2, async () => { r = await 送る(ctx, 改ざん, "159999", { scope_id: 1, instant_save_flag: true }); });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス（認証の確認がデッキの存在確認より先）").toBe(401);
    expect.soft(/Access Token is incorrect|Authentication failed/.test(String(r.json?.message ?? "")), `メッセージが認証エラー（${要点(r)}）`).toBe(true);
  });
});

caseTest("IT-A15-10-016", async (ctx) => {
  const id = デッキ(ctx, "016"); let r!: 応答;
  await ctx.step(1, async () => { r = await 送る(ctx, await トークン(ctx), id, { deck_name: "公開範囲不正更新", scope_id: 4, instant_save_flag: true }); });
  await ctx.step(2, async () => { note(要点(r)); });
  await ctx.step(3, async () => { note(`DB: デッキ名「${デッキの内容を読む(id).名前}」`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(400);
    expect.soft(r.json?.code, "処理結果コードが返る").toBeTruthy();
    expect.soft(String(r.json?.message ?? "").length > 0, `検証エラーの内容が返る（${要点(r)}）`).toBe(true);
    expect.soft(デッキの内容を読む(id).名前, "デッキ名が「更新前デッキ」から変更されない").toBe("更新前デッキ");
  });
});

/** 採用カードの上書き（031 は1件・032 は同じ要求を2回） */
function 採用カードを更新する(n: string, 名: string, 公開: number, カード: string, 区画: number, 枚数: number, 二回: boolean) {
  return async (ctx: CaseCtx): Promise<void> => {
    const id = デッキ(ctx, n); const rs: 応答[] = [];
    const 要求 = (): 更新要求 => ({ deck_name: 名, scope_id: 公開, cards: [{ card_id: Number(A(ctx, "カードID", カード)), board_id: 区画, count: 枚数 }], instant_save_flag: true });
    let t = "";
    await ctx.step(1, async () => { t = await トークン(ctx); note(`デッキ名「${名}」・採用カード（カード${カード}・区画${区画}・枚数${枚数}）の1件だけを指定する`); if (二回) rs.push(await 送る(ctx, t, id, 要求(), "1回目")); });
    await ctx.step(2, async () => { rs.push(await 送る(ctx, t, id, 要求(), 二回 ? "2回目" : "更新")); });
    await ctx.step(3, async () => { note(`応答: ${rs.map(要点).join(" ／ ")}`); });
    await ctx.step(4, async () => { note(`DB: ${JSON.stringify(デッキの内容を読む(id)).slice(0, 500)}`); });
    await ctx.expected(async () => {
      rs.forEach((r, i) => expect.soft(r.ステータス, `${i + 1}回目の HTTP ステータス（${要点(r)}）`).toBe(200));
      const d = デッキの内容を読む(id);
      expect.soft(d.名前, "デッキ名").toBe(名);
      expect.soft(d.明細.length, `採用カードが1件だけ（${d.明細.join(" / ")}）`).toBe(1);
      expect.soft(d.明細[0] ?? "", `区画・枚数（${枚数}枚）`).toContain(`${枚数}枚`);
      expect.soft(d.明細[0] ?? "", `区画（${区画 === 2 ? "サイドボード" : "メインボード"}）`).toContain(区画 === 2 ? "サイドボード" : "メインボード");
    });
  };
}
caseTest("IT-A15-10-031", 採用カードを更新する("031", "採用カード1件デッキ", 1, "C", 2, 3, false));
caseTest("IT-A15-10-032", 採用カードを更新する("032", "重ね更新デッキ", 1, "B", 1, 2, true));
