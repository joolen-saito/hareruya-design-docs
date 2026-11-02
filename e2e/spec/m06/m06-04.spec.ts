/**
 * M06-04 買取ステータス変更。正本: cases/M06-04_test_cases.tsv
 *
 * 画面だけで準備できる 047 だけを実装した（記録 review/M06-04_progress_2026-11-01.md）。
 * MTGバイヤー（買取端末のアプリ）での査定が要るシード（054・055）と、DBへ直接設定するシードを使うケースは実装しない。
 *
 * 決め打ちの識別の値（会員のメールの前半）は rc() で実行ごとの印を付けて読む（依頼者決定 2026-10-28）。
 */
import { test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { OtcDetailPage, OtcListPage } from "../../pages/admin/m06_otc_list";
import { PurchaseHistoryPage } from "../../pages/front/m06_otc_buy";
import { QG_IT, QG_MEMBER_PASSWORD, qgMemberEmail, restoreFixedPriceSection } from "../../seeds/m06-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 今日の年・月・日（アプリの時刻帯の日本時間） */
function 今日(): { y: number; m: number; d: number } {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [y, m, d] = p.split("-").map(Number);
  return { y, m, d };
}

/** 共有の設定（固定価格商品部門ID）は、ケースが終わるたびに控えた値へ戻す（シードの作る前の値） */
test.afterEach(async ({ browser }) => {
  for (const m of await restoreFixedPriceSection(browser)) note(m);
});

// 買取成立にすると、フロントの買取履歴の処理状態が買取完了になり、成立日が入る
caseTest("IT-M06-04-047", async ({ page, browser, notes, step, expected }) => {
  const no = notes.get("〔買取番号-M0604-QG002〕");
  const email = qgMemberEmail();
  // ブラウザB: 管理画面（日本語表示の新しいブラウザセッション）
  const contextB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(contextB);
    const pageB = await contextB.newPage();
    pageB.setDefaultTimeout(60_000);
    const a = new PurchaseHistoryPage(page);
    const list = new OtcListPage(pageB);
    let state2 = "";
    await step(1, async () => {
      await frontLogin(page, { メール: email, パスワード: QG_MEMBER_PASSWORD });
      await a.openList();
    });
    await step(2, async () => {
      await a.openDetail(no);
      state2 = await a.detailValue("処理状態");
    });
    await step(3, async () => {
      await loginAdmin(pageB, QG_IT);
      await list.open();
      await list.日時を空にする();
      await list.買取店舗を選ぶ("");
      await list.査定IDを入れる(no);
      await list.検索する();
      await list.詳細を開く(no);
    });
    await step(4, async () => { await new OtcDetailPage(pageB).ステータスを変える("買取成立"); });
    let state5 = "";
    let date5 = "";
    await step(5, async () => {
      await a.openList();
      await a.openDetail(no);
      state5 = await a.detailValue("処理状態");
      date5 = await a.detailValue("成立日");
    });
    await expected(async () => {
      expect.soft(state2, "手順2の処理状態").toContain("受付完了");
      expect.soft(state5, "手順5の処理状態").toContain("買取完了");
      const t = 今日();
      const nums = (date5.match(/\d+/g) ?? []).map(Number);
      expect.soft(nums.slice(0, 3), `成立日（手順4でステータスを買取成立に変えた日 ${t.y}/${t.m}/${t.d}。表示は「${date5}」）`).toEqual([t.y, t.m, t.d]);
    });
    note("正本の事前準備④は管理画面の会員登録（新規）で会員を作るが、この環境の管理画面に会員の新規登録の画面が無いので、フロントの会員登録（本登録のメール）で作った");
    note("正本の事前準備④のITチームの所属は選択肢に無いので、先頭の所属で補った（権限はシステム管理者）");
  } finally {
    await contextB.close();
  }
});
