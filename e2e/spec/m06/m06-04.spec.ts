/**
 * M06-04 買取ステータス変更。正本: cases/M06-04_test_cases.tsv
 *
 * 047 は画面だけで準備できる（記録 review/M06-04_progress_2026-11-01.md）。
 * そのほかは、依頼者の方針（2026-11-10「既存データか、画面から作ったデータに読み替えてよい」）で、DBで入れる値を画面の操作で読み替えた
 * シード（seeds/m06-04-status.ts）で流す。読み替えはシードの報告と、このファイルの手順の注記に残す。
 * 明細・金額・買取集計・決め打ちの日付がDBでしか作れないケース（025〜029・043・044・046・051〜053・065〜067・069・072）と、
 * MTGバイヤー（買取端末のアプリ）での査定が要るケース（054・055）は実装しない（記録 review/M06-04_progress_2026-11-10.md）。
 *
 * 決め打ちの識別の値（会員のメールの前半）は rc() で実行ごとの印を付けて読む（依頼者決定 2026-10-28）。
 */
import { Page, test } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { Notes } from "../../lib/notes";
import { Account, hideDebugToolbar, loginAdmin, withAdminSession } from "../../lib/session";
import { 店頭買取の状態, ステータス変更履歴 } from "../../db/m06_04";
import { OtcOrderDetailPage, OtcStatusChangePage, 経理払い出し済の確認 } from "../../pages/admin/m06_04_status";
import { changeMemberAuthority } from "../../pages/admin/member";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { OtcDetailPage, OtcListPage } from "../../pages/admin/m06_otc_list";
import { PurchaseHistoryPage } from "../../pages/front/m06_otc_buy";
import { QG_IT, QG_MEMBER_PASSWORD, qgMemberEmail, restoreFixedPriceSection } from "../../seeds/m06-04";
import {
  ITチームなしの権限, M0604_ACCOUNT, M0604_ACCOUNT_NAME, M0604_IT_A, M0604_IT_A_NAME, M0604_IT_B, M0604_L_IT, M0604_L_IT_NAME, M0604_NONACCOUNT,
  M0604_NONIT, M0604_NONPURCHASE, M0604_PURCHASE, M0604_REVOKE, 読み替えた買取,
} from "../../seeds/m06-04-status";

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

// ======================================================================
// 買取ステータス変更（依頼者 2026-11-10 の方針で、DBで入れる値を画面の操作で読み替えたシードで流す）
// ======================================================================

const 受注 = (notes: Notes, no: string) => notes.get(`〔店頭買取受注ID-M0604-${no}〕`);
const 査定 = (notes: Notes, no: string) => notes.get(`〔査定ID-M0604-${no}〕`);

/** いまの時刻（1970年からの秒）。画面・DBの日時（秒まで）と比べるので、範囲は秒に丸めて広げる */
const いま = () => Date.now() / 1000;
const 範囲内 = (v: number | null, 始: number, 終: number) => v !== null && v >= Math.floor(始) && v <= Math.ceil(終);
const 時刻 = (s: number | null) => (s === null ? "空" : new Date(s * 1000).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }));

/** 画面の日時（年/月/日 時:分:秒。アプリの時刻帯＝日本時間）を、1970年からの秒にする。読めなければ null */
function 画面の日時(text: string): number | null {
  const m = /(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})/.exec(text);
  if (!m) return null;
  const p = (i: number) => m[i].padStart(2, "0");
  return Date.parse(`${m[1]}-${p(2)}-${p(3)}T${p(4)}:${m[5]}:${m[6]}+09:00`) / 1000;
}

/** 今日の日付（日本時間。年-月-日） */
const 今日の日付 = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const 有効な選択肢 = ["査定中", "査定中断", "査定再開", "買取キャンセル", "経理払い出し待ち", "買取成立", "入庫済み", "未登録在庫あり", "入庫待ち", "管理者取消"];
const 廃止の選択肢 = ["払い出し待ち", "ダブルチェック済み", "データ出力済み"];

const 査定番号の注記 = "正本の「査定ID」は、画面では「査定番号」と表示される（一覧の査定IDの列と同じ番号。設計書 L0059 で査定IDから査定番号に名称を直した）";
const 履歴の注記 = "ステータス変更履歴0件はDBでしか作れないので、申込の「査定前」の履歴（変更者なし）がある。期待結果の件数は、その1件を除いて数えた";

/** ステータス変更画面をアドレスで開く（開けたことを確かめる） */
async function 変更画面を開く(page: Page, 受注ID: string): Promise<OtcStatusChangePage> {
  const s = new OtcStatusChangePage(page);
  expect(await s.open(受注ID), "ステータス変更画面の応答").toBeLessThan(400);
  expect(await s.開いている(受注ID), "ステータス変更画面が開いた").toBe(true);
  return s;
}

/** 保存を押した結果を注記に残す（送信されなかった・応答の状態） */
function 保存の結果を残す(r: { sent: boolean; 応答の状態: number | null; 止めた理由: string }, url: string): void {
  note(r.sent ? `保存の送信の応答 ${r.応答の状態}。保存のあとの画面 ${new URL(url).pathname}` : `ブラウザの入力チェックが保存の送信を止めた（${r.止めた理由}）`);
}

/**
 * 正本: 1. ステータス変更画面を開く／2. 変更後のステータスを選ぶ／3. 保存／4. DBでステータスを確認 → ステータスが「前」から「後」になる（後＝前なら変わらない）。
 * 003・016・017・018・056・057・058 が同じ形。
 */
function ステータスを変えてDBで見る(no: string, account: Account, 変更後: string, 前: string, 後: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = 受注(notes, no);
    const before = 店頭買取の状態(id);
    await loginAdmin(page, account);
    let s: OtcStatusChangePage | undefined;
    let after = before;
    await step(1, async () => { s = await 変更画面を開く(page, id); });
    await step(2, async () => { await s!.選ぶ(変更後); });
    await step(3, async () => { 保存の結果を残す(await s!.保存を押す(), page.url()); });
    await step(4, async () => { after = 店頭買取の状態(id); });
    await expected(async () => {
      expect.soft(before.ステータス, "変更の前のステータス").toBe(前);
      expect.soft(after.ステータス, "保存のあとのステータス").toBe(後);
    });
  };
}

caseTest("IT-M06-04-001", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "001");
  await loginAdmin(page, M0604_IT_A);
  const d = new OtcOrderDetailPage(page);
  const s = new OtcStatusChangePage(page);
  await step(1, async () => { expect(await d.open(id), "買取詳細の応答").toBeLessThan(400); });
  await step(2, async () => { await d.ステータス変更を押す(); });
  await expected(async () => {
    expect.soft(await s.開いている(id), "ステータス変更画面が開いている").toBe(true);
    expect.soft(await s.項目("査定番号"), "査定番号（正本の査定ID）").toBe(査定(notes, "001"));
    expect.soft(await s.項目("現在のステータス"), "現在のステータス").toBe("査定前");
    const sel = await s.選択中();
    expect.soft(sel.値, `変更後のステータスが未選択（選ばれている表示「${sel.表示}」）`).toBe("");
  });
  note(査定番号の注記);
});

caseTest("IT-M06-04-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0604_IT_A);
  let s: OtcStatusChangePage | undefined;
  let options: string[] = [];
  await step(1, async () => { s = await 変更画面を開く(page, 受注(notes, "002")); });
  await step(2, async () => { options = await s!.選択肢(); });
  await expected(async () => {
    expect.soft([...options].sort(), "変更後のステータスの選択肢（「ステータスを選択」を除く）").toEqual([...有効な選択肢].sort());
    expect.soft(options.includes("査定前"), "現在の「査定前」が選択肢に無い").toBe(false);
    for (const x of 廃止の選択肢) expect.soft(options.includes(x), `廃止された「${x}」が選択肢に無い`).toBe(false);
  });
});

caseTest("IT-M06-04-003", ステータスを変えてDBで見る("003", M0604_IT_A, "買取キャンセル", "査定前", "買取キャンセル"));

caseTest("IT-M06-04-004", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "004");
  await loginAdmin(page, M0604_IT_A);
  let s: OtcStatusChangePage | undefined;
  await step(1, async () => { s = await 変更画面を開く(page, id); });
  await step(2, async () => { await s!.選ぶ("買取キャンセル"); });
  await step(3, async () => { 保存の結果を残す(await s!.保存を押す(), page.url()); });
  await expected(async () => {
    const d = new OtcOrderDetailPage(page);
    expect.soft(d.開いている(id), `査定ID ${査定(notes, "004")} の買取詳細が開いている（${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(await d.項目("査定番号"), "買取詳細の査定番号").toBe(査定(notes, "004"));
  });
});

caseTest("IT-M06-04-005", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "005");
  await loginAdmin(page, M0604_IT_A);
  let s: OtcStatusChangePage | undefined;
  await step(1, async () => { s = await 変更画面を開く(page, id); });
  await step(2, async () => { await s!.戻るを押す(); });
  await expected(async () => {
    const d = new OtcOrderDetailPage(page);
    expect.soft(d.開いている(id), `査定ID ${査定(notes, "005")} の買取詳細が開いている（${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(await d.項目("査定番号"), "買取詳細の査定番号").toBe(査定(notes, "005"));
  });
  note("正本の「戻る」ボタンは、ステータス変更画面の左下のリンク「店頭買取詳細」（戻るのアイコンつき）を押した");
});

caseTest("IT-M06-04-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M0604_IT_A);
  let status = 0;
  await step(1, async () => { status = await new OtcStatusChangePage(page).open("999999"); });
  await expected(async () => {
    expect(status, "店頭買取受注ID 999999 のステータス変更画面の応答").toBe(404);
  });
});

caseTest("IT-M06-04-007", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "007");
  await loginAdmin(page, M0604_NONIT);
  let status = 0;
  await step(1, async () => { status = await new OtcStatusChangePage(page).open(id); });
  await expected(async () => {
    const d = new OtcOrderDetailPage(page);
    expect.soft(d.開いている(id), `査定ID ${査定(notes, "007")} の買取情報編集画面（買取詳細）へ遷移した（${new URL(page.url()).pathname}・応答 ${status}）`).toBe(true);
    expect.soft(await d.項目("査定番号").catch(() => ""), "遷移先の査定番号").toBe(査定(notes, "007"));
  });
  note("正本の「買取情報編集画面」は、店頭買取の買取詳細（査定番号・ステータス・買取情報を編集して保存する画面）と読んだ");
});

/** 008・009: ITチーム権限のある試験中権限変更メンバーで開き、手順2で権限を外してから保存する */
function 途中で権限を外す(no: "008" | "009"): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    const id = 受注(notes, no);
    await loginAdmin(page, M0604_REVOKE(no));
    let s: OtcStatusChangePage | undefined;
    let after = 店頭買取の状態(id);
    await step(1, async () => { s = await 変更画面を開く(page, id); });
    await step(2, async () => {
      await withAdminSession(browser, SETUP_ADMIN, async (p) => {
        p.setDefaultTimeout(60_000);
        const name = await ITチームなしの権限(p);
        await changeMemberAuthority(p, notes.get(`〔管理者ID-M0604-${no}〕`), name);
        note(`手順2はDBで書き換えず（DBへ書き込まない決まり）、別のブラウザで管理画面のメンバー編集を開き、権限をITチームの権限の無い既存の権限「${name}」に変えて登録した`);
      });
    });
    await step(3, async () => {
      await s!.選ぶ("買取キャンセル");
      保存の結果を残す(await s!.保存を押す(), page.url());
    });
    if (no === "008") await step(4, async () => { after = 店頭買取の状態(id); });
    await expected(async () => {
      if (no === "008") {
        expect(after.ステータス, `査定ID ${査定(notes, no)} のステータス（査定前から変わらない）`).toBe("査定前");
      } else {
        const d = new OtcOrderDetailPage(page);
        expect.soft(d.開いている(id), `査定ID ${査定(notes, no)} の買取情報編集画面（買取詳細）へ遷移した（${new URL(page.url()).pathname}）`).toBe(true);
        expect.soft(await d.項目("査定番号").catch(() => ""), "遷移先の査定番号").toBe(査定(notes, no));
      }
    });
  };
}
caseTest("IT-M06-04-008", 途中で権限を外す("008"));
caseTest("IT-M06-04-009", 途中で権限を外す("009"));

/**
 * 経理払い出し済ボタン: 1. 買取詳細を開く／2. ボタンを押す／3. 確認のOK／4. DBでステータス → 前から後へ（後＝前なら変わらない）。
 * 010・011・013・059・068 が同じ形。
 */
function 経理払い出し済を押してDBで見る(no: string, account: Account, 前: string, 後: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = 受注(notes, no);
    const before = 店頭買取の状態(id);
    await loginAdmin(page, account);
    const d = new OtcOrderDetailPage(page);
    let ask: 経理払い出し済の確認 | undefined;
    let after = before;
    await step(1, async () => { expect(await d.open(id), "買取詳細の応答").toBeLessThan(400); });
    await step(2, async () => { ask = await d.経理払い出し済を押す(); });
    await step(3, async () => {
      if (!ask!.ダイアログ) note("確認のダイアログが出なかった（押したまま送信された）");
      const r = await ask!.確認に答える(true);
      note(`確認のダイアログ「${ask!.ダイアログ?.message() ?? "なし"}」でOK。送信の応答 ${r?.status() ?? "なし"}・上部のメッセージ「${(await d.上部のメッセージ()).join(" / ")}」`);
    });
    await step(4, async () => { after = 店頭買取の状態(id); });
    await expected(async () => {
      expect.soft(before.ステータス, "押す前のステータス").toBe(前);
      expect.soft(after.ステータス, "押したあとのステータス").toBe(後);
    });
  };
}

caseTest("IT-M06-04-010", 経理払い出し済を押してDBで見る("010", M0604_ACCOUNT, "経理払い出し待ち", "買取成立"));
caseTest("IT-M06-04-011", 経理払い出し済を押してDBで見る("011", M0604_NONACCOUNT, "経理払い出し待ち", "経理払い出し待ち"));

caseTest("IT-M06-04-012", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "012");
  await loginAdmin(page, M0604_ACCOUNT);
  const d = new OtcOrderDetailPage(page);
  let ask: 経理払い出し済の確認 | undefined;
  await step(1, async () => { expect(await d.open(id), "買取詳細の応答").toBeLessThan(400); });
  await step(2, async () => { ask = await d.経理払い出し済を押す(); });
  await step(3, async () => {
    if (!ask!.ダイアログ) note("確認のダイアログが出なかった（押したまま送信された）");
    const r = await ask!.確認に答える(true);
    note(`送信の応答 ${r?.status() ?? "なし"}・上部のメッセージ「${(await d.上部のメッセージ()).join(" / ")}」`);
  });
  await expected(async () => {
    expect.soft(d.開いている(id), `査定ID ${査定(notes, "012")} の買取詳細へ戻った（${new URL(page.url()).pathname}）`).toBe(true);
    expect.soft(await d.項目("査定番号").catch(() => ""), "戻った画面の査定番号").toBe(査定(notes, "012"));
  });
});

caseTest("IT-M06-04-013", 経理払い出し済を押してDBで見る("013", M0604_ACCOUNT, "査定前", "査定前"));

/** 入庫済みボタン（014・015）: 1. 買取詳細を開く／2. 入庫済みを押す／3. DBでステータス */
function 入庫済みを押してDBで見る(固定: string, account: Account, 後: string): CaseBody {
  return async ({ page, step, expected }) => {
    const r = 読み替えた買取(固定);
    const before = 店頭買取の状態(r.受注ID);
    await loginAdmin(page, account);
    const d = new OtcOrderDetailPage(page);
    let after = before;
    await step(1, async () => { expect(await d.open(r.受注ID), "買取詳細の応答").toBeLessThan(400); });
    await step(2, async () => {
      const res = await d.入庫済みにするを押す();
      note(`正本の「入庫済み」ボタンは、画面の「入庫済みにする」を押した。送信の応答 ${res?.status() ?? "なし"}・上部のメッセージ「${(await d.上部のメッセージ()).join(" / ").slice(0, 200)}」`);
    });
    await step(3, async () => { after = 店頭買取の状態(r.受注ID); });
    await expected(async () => {
      expect.soft(before.ステータス, "押す前のステータス").toBe("入庫待ち");
      expect.soft(after.ステータス, "押したあとのステータス").toBe(後);
    });
    note(`正本の査定ID ${固定} は、シードが作った査定ID ${r.査定ID}（店頭買取受注ID ${r.受注ID}）に読み替えた。数量1の買取商品・在庫はDBでしか入らないので、明細の無い買取で見た`);
  };
}
caseTest("IT-M06-04-014", 入庫済みを押してDBで見る("600404014", M0604_PURCHASE, "入庫済み"));
caseTest("IT-M06-04-015", 入庫済みを押してDBで見る("600404015", M0604_NONPURCHASE, "入庫待ち"));

caseTest("IT-M06-04-016", ステータスを変えてDBで見る("016", M0604_IT_B, "買取キャンセル", "査定前", "査定前"));
caseTest("IT-M06-04-017", ステータスを変えてDBで見る("017", M0604_IT_A, "管理者取消", "入庫済み", "管理者取消"));
caseTest("IT-M06-04-018", ステータスを変えてDBで見る("018", M0604_IT_A, "買取キャンセル", "入庫済み", "入庫済み"));

/** 019・020・021・062: 変えたステータスに紐づく日時が、空から保存の時刻になる */
function 日時が入る(no: string, 変更後: string, 前: string, 日時: "買取成立日" | "買取キャンセル日" | "入庫日時", 状態も = false): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const r = /^\d{9}$/.test(no) ? 読み替えた買取(no) : { 受注ID: 受注(notes, no), 査定ID: 査定(notes, no) };
    const before = 店頭買取の状態(r.受注ID);
    await loginAdmin(page, M0604_IT_A);
    let s: OtcStatusChangePage | undefined;
    let after = before;
    let 始 = 0;
    let 終 = 0;
    await step(1, async () => { s = await 変更画面を開く(page, r.受注ID); });
    await step(2, async () => { await s!.選ぶ(変更後); });
    await step(3, async () => {
      始 = いま();
      const res = await s!.保存を押す();
      終 = いま();
      保存の結果を残す(res, page.url());
    });
    await step(4, async () => { after = 店頭買取の状態(r.受注ID); });
    await expected(async () => {
      expect.soft(before.ステータス, "変更の前のステータス").toBe(前);
      expect.soft(時刻(before[日時]), `変更の前の${日時}（空）`).toBe("空");
      if (状態も) expect.soft(after.ステータス, "保存のあとのステータス").toBe(変更後);
      expect.soft(範囲内(after[日時], 始, 終), `保存のあとの${日時}「${時刻(after[日時])}」が保存の時刻（${時刻(始)}〜${時刻(終)}）`).toBe(true);
    });
    if (/^\d{9}$/.test(no)) note(`正本の査定ID ${no} は、シードが作った査定ID ${r.査定ID}（店頭買取受注ID ${r.受注ID}）に読み替えた。決め打ちの買取成立日・明細・在庫はDBでしか入らないので入れていない`);
    note("保存の時刻は、試験の端末の時計で「保存」を押す直前から応答のあとまでとした（DBの日時は秒まで）");
  };
}
caseTest("IT-M06-04-019", 日時が入る("019", "買取成立", "査定前", "買取成立日"));
caseTest("IT-M06-04-020", 日時が入る("020", "買取キャンセル", "査定前", "買取キャンセル日"));
caseTest("IT-M06-04-021", 日時が入る("600404021", "入庫済み", "入庫待ち", "入庫日時"));

/** 022・063・070: 買取成立日が入っている買取を変えても、買取成立日が書き換わらない（063・070 はステータスも見る） */
function 成立日が変わらない(no: string, 変更後: string, 前: string, 状態も: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = 受注(notes, no);
    const before = 店頭買取の状態(id);
    await loginAdmin(page, M0604_IT_A);
    let s: OtcStatusChangePage | undefined;
    let after = before;
    await step(1, async () => { s = await 変更画面を開く(page, id); });
    await step(2, async () => { await s!.選ぶ(変更後); });
    await step(3, async () => { 保存の結果を残す(await s!.保存を押す(), page.url()); });
    await step(4, async () => { after = 店頭買取の状態(id); });
    await expected(async () => {
      expect.soft(before.ステータス, "変更の前のステータス").toBe(前);
      if (状態も) expect.soft(after.ステータス, "保存のあとのステータス").toBe(変更後);
      expect.soft(before.買取成立日 !== null, `変更の前の買取成立日が入っている（${時刻(before.買取成立日)}）`).toBe(true);
      expect.soft(時刻(after.買取成立日), "保存のあとの買取成立日（変更の前の値のまま）").toBe(時刻(before.買取成立日));
    });
    note(`正本の決め打ちの買取成立日はDBでしか入らないので、シードで一度「買取成立」にしたときの日時（${時刻(before.買取成立日)}）に読み替え、その値から書き換わらないことを見た`);
  };
}
caseTest("IT-M06-04-022", 成立日が変わらない("022", "買取成立", "管理者取消", false));

caseTest("IT-M06-04-023", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "023");
  const before = ステータス変更履歴(id);
  await loginAdmin(page, M0604_IT_A);
  let s: OtcStatusChangePage | undefined;
  let 始 = 0;
  let 終 = 0;
  let after = before;
  await step(1, async () => { 始 = いま(); });
  await step(2, async () => { s = await 変更画面を開く(page, id); });
  await step(3, async () => {
    await s!.選ぶ("買取キャンセル");
    保存の結果を残す(await s!.保存を押す(), page.url());
  });
  await step(4, async () => { 終 = いま(); });
  await step(5, async () => { after = ステータス変更履歴(id); });
  await expected(async () => {
    const added = after.slice(before.length);
    expect.soft(after.length - before.length, `増えた履歴の件数（変更の前 ${before.length}件: ${JSON.stringify(before)}）`).toBe(1);
    expect.soft(added.filter((h) => h.ステータス === "買取キャンセル" && h.変更者 === M0604_IT_A_NAME && 範囲内(h.変更日時, 始, 終)).length,
      `変更日時が操作の間（${時刻(始)}〜${時刻(終)}）・ステータス「買取キャンセル」・変更者「${M0604_IT_A_NAME}」の履歴（増えた履歴 ${JSON.stringify(added.map((h) => ({ ...h, 変更日時: 時刻(h.変更日時) })))}）`).toBe(1);
  });
  note(履歴の注記);
});

caseTest("IT-M06-04-024", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "024");
  const before = 店頭買取の状態(id);
  await loginAdmin(page, M0604_IT_A);
  let s: OtcStatusChangePage | undefined;
  let after = before;
  await step(1, async () => { s = await 変更画面を開く(page, id); });
  await step(2, async () => { await s!.選ぶ("買取キャンセル"); });
  await step(3, async () => { 保存の結果を残す(await s!.保存を押す(), page.url()); });
  await step(4, async () => { after = 店頭買取の状態(id); });
  await expected(async () => {
    expect.soft(時刻(after.更新日時), "更新日時（変更の前の値のまま）").toBe(時刻(before.更新日時));
    expect.soft(after.担当者 ?? "（担当者なし）", "担当者（変更の前の値のまま）").toBe(before.担当者 ?? "（担当者なし）");
    expect.soft(after.ステータス, "保存が行われた（ステータスが買取キャンセルになった）").toBe("買取キャンセル");
  });
  note(`正本の更新日時2026-08-01 09:00:00・担当者seed_owner はDBでしか入らないので、申込で入った値（更新日時 ${時刻(before.更新日時)}・担当者 ${before.担当者 ?? "なし"}）に読み替え、その値から書き換わらないことを見た`);
});

/** 030・031・035: 変更画面の送信の内容を開発者ツールの操作で変えて保存し、DBでステータスが変わらないことを見る */
function 不正な送信(no: string, 操作: "トークンを消す" | "トークンを変える" | "選択肢を足す"): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = 受注(notes, no);
    await loginAdmin(page, M0604_IT_A);
    let s: OtcStatusChangePage | undefined;
    let after = 店頭買取の状態(id);
    await step(1, async () => { s = await 変更画面を開く(page, id); });
    if (操作 === "選択肢を足す") {
      await step(2, async () => { await s!.選択肢を足して選ぶ("999999", "存在しないステータス"); });
      await step(3, async () => { 保存の結果を残す(await s!.保存を押す(), page.url()); });
      await step(4, async () => { after = 店頭買取の状態(id); });
    } else {
      await step(2, async () => { await s!.選ぶ("買取キャンセル"); });
      await step(3, async () => {
        if (操作 === "トークンを消す") note(`なりすまし対策トークンの入力要素を ${await s!.トークンを消す()} 個消した（開発者ツールの操作の代わりに画面のスクリプトで行った）`);
        else { await s!.トークンを変える("invalid-token"); note("なりすまし対策トークンの値を「invalid-token」にした（開発者ツールの操作の代わりに画面のスクリプトで行った）"); }
      });
      await step(4, async () => { 保存の結果を残す(await s!.保存を押す(), page.url()); });
      await step(5, async () => { after = 店頭買取の状態(id); });
    }
    await expected(async () => {
      expect(after.ステータス, `査定ID ${査定(notes, no)} のステータス（査定前から変わらない）`).toBe("査定前");
    });
  };
}
caseTest("IT-M06-04-030", 不正な送信("030", "トークンを消す"));
caseTest("IT-M06-04-031", 不正な送信("031", "トークンを変える"));

/** 032・034: 選ばない・選択肢に無い値で保存すると、同じ買取のステータス変更画面が開き直され、未選択・不正の表示なし */
function 開き直される(no: string, 選択肢を足す: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = 受注(notes, no);
    await loginAdmin(page, M0604_IT_A);
    let s: OtcStatusChangePage | undefined;
    let r = { sent: false, 応答の状態: null as number | null, 止めた理由: "" };
    await step(1, async () => { s = await 変更画面を開く(page, id); });
    if (選択肢を足す) {
      await step(2, async () => { await s!.選択肢を足して選ぶ("999999", "存在しないステータス"); note("変更後のステータスに値999999の選択肢を足して選んだ（開発者ツールの操作の代わりに画面のスクリプトで行った）"); });
      await step(3, async () => { r = await s!.保存を押す(); 保存の結果を残す(r, page.url()); });
    } else {
      await step(2, async () => { r = await s!.保存を押す(); 保存の結果を残す(r, page.url()); });
    }
    await expected(async () => {
      expect.soft(r.sent, `保存が送信され、画面が開き直された（${r.sent ? `応答 ${r.応答の状態}` : `ブラウザの入力チェックが止めた: ${r.止めた理由}`}）`).toBe(true);
      expect.soft(await s!.開いている(id), `査定ID ${査定(notes, no)} のステータス変更画面が開いている（${new URL(page.url()).pathname}）`).toBe(true);
      expect.soft(await s!.項目("査定番号").catch(() => ""), "開いている画面の査定番号").toBe(査定(notes, no));
      const sel = await s!.選択中().catch(() => ({ 値: "（選択欄が無い）", 表示: "" }));
      expect.soft(sel.値, `変更後のステータスが未選択（選ばれている表示「${sel.表示}」）`).toBe("");
      expect.soft(await s!.不正項目の表示の数(), "不正な項目を示す表示（赤枠・項目のエラー文）の数").toBe(0);
    });
  };
}
caseTest("IT-M06-04-032", 開き直される("032", false));
caseTest("IT-M06-04-034", 開き直される("034", true));
caseTest("IT-M06-04-035", 不正な送信("035", "選択肢を足す"));

/** 040・041: 買取詳細から変更し、遷移先の買取詳細の表示を見る（7手順） */
function 詳細で変更を見る(no: "040" | "041"): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = 受注(notes, no);
    const 査定番号 = notes.get(`〔査定番号-M0604-${no}〕`);
    await loginAdmin(page, M0604_L_IT);
    const d = new OtcOrderDetailPage(page);
    const s = new OtcStatusChangePage(page);
    let 始 = 0;
    let 終 = 0;
    let shown = { 査定番号: "", ステータス: "", 買取キャンセル日時: "" };
    let head = { 変更日時: "", ステータス: "", 変更者: "" };
    await step(1, async () => { 始 = いま(); });
    await step(2, async () => { expect(await d.open(id), "買取詳細の応答").toBeLessThan(400); });
    await step(3, async () => { await d.ステータス変更を押す(); });
    await step(4, async () => { await s.選ぶ("買取キャンセル"); });
    await step(5, async () => { 保存の結果を残す(await s.保存を押す(), page.url()); });
    await step(6, async () => {
      if (no === "040") shown = { 査定番号: await d.項目("査定番号"), ステータス: await d.項目("ステータス"), 買取キャンセル日時: await d.項目("買取キャンセル日時") };
      else head = (await d.履歴())[0] ?? head;
    });
    await step(7, async () => { 終 = いま(); });
    await expected(async () => {
      expect.soft(d.開いている(id), `遷移先が買取詳細（${new URL(page.url()).pathname}）`).toBe(true);
      if (no === "040") {
        expect.soft(shown.査定番号, "遷移先の査定番号").toBe(査定番号);
        expect.soft(shown.ステータス, "遷移先のステータス").toBe("買取キャンセル");
        expect.soft(範囲内(画面の日時(shown.買取キャンセル日時), 始, 終), `買取キャンセル日時「${shown.買取キャンセル日時}」が操作の間（${時刻(始)}〜${時刻(終)}）`).toBe(true);
      } else {
        expect.soft(範囲内(画面の日時(head.変更日時), 始, 終), `履歴の先頭行の変更日時「${head.変更日時}」が操作の間（${時刻(始)}〜${時刻(終)}）`).toBe(true);
        expect.soft(head.ステータス, "履歴の先頭行のステータス").toBe("買取キャンセル");
        expect.soft(head.変更者, "履歴の先頭行の変更者").toBe(M0604_L_IT_NAME);
      }
    });
    note("画面の日時（年/月/日 時:分:秒）は日本時間として、試験の端末の時計の操作の間と比べた");
  };
}
caseTest("IT-M06-04-040", 詳細で変更を見る("040"));
caseTest("IT-M06-04-041", 詳細で変更を見る("041"));

caseTest("IT-M06-04-042", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "042");
  const 査定ID = notes.get("〔査定ID-M0604-042〕");
  await loginAdmin(page, M0604_L_IT);
  const d = new OtcOrderDetailPage(page);
  const s = new OtcStatusChangePage(page);
  const list = new OtcListPage(page);
  let row = "";
  await step(1, async () => { expect(await d.open(id), "買取詳細の応答").toBeLessThan(400); });
  await step(2, async () => { await d.ステータス変更を押す(); });
  await step(3, async () => { await s.選ぶ("査定中"); });
  await step(4, async () => { 保存の結果を残す(await s.保存を押す(), page.url()); });
  await step(5, async () => { await list.open(); });
  await step(6, async () => {
    for (let i = 0; i < 3; i++) {
      if (i > 0) { note(`検索結果に査定ID ${査定ID} が出なかったので、検索し直した（${i}回目）`); await page.waitForTimeout(5_000); await list.open(); }
      await list.買取店舗を選ぶ("買取店舗A");
      await list.日時を空にする();
      await list.査定IDを入れる(査定ID);
      await list.検索する();
      if ((await list.結果の表().count()) > 0) break;
    }
  });
  await step(7, async () => {
    const rows = (await list.結果の表().count()) === 0 ? [] : await list.行();
    row = rows.find((r) => r.査定ID === 査定ID)?.ステータス ?? `（査定ID ${査定ID} の行が無い。行: ${JSON.stringify(rows)}）`;
  });
  await expected(async () => {
    expect(row, `検索結果の査定ID ${査定ID} の行のステータス`).toBe("査定中");
  });
  note("正本の査定申込日時(From)・買取日時(From)だけでなく、(To)も空にした（初めは何も入っていない。開いた直後に入っている査定申込日時を空にする操作をまとめて行った）");
});

caseTest("IT-M06-04-045", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "045");
  await loginAdmin(page, M0604_IT_A);
  let s: OtcStatusChangePage | undefined;
  let r = { sent: false, 応答の状態: null as number | null, 止めた理由: "" };
  await step(1, async () => { s = await 変更画面を開く(page, id); });
  await step(2, async () => { await s!.選ぶ("買取キャンセル"); });
  await step(3, async () => { await s!.トークンを変える("invalid-token"); note("なりすまし対策トークンの値を「invalid-token」にした（開発者ツールの操作の代わりに画面のスクリプトで行った）"); });
  await step(4, async () => { r = await s!.保存を押す(); 保存の結果を残す(r, page.url()); });
  await expected(async () => {
    expect(r.応答の状態, `保存の送信の応答（アクセス拒否＝403。保存のあとの画面 ${new URL(page.url()).pathname}）`).toBe(403);
  });
  note("正本の「アクセス拒否の応答」は、HTTPの応答の状態 403（アクセス拒否）と読んだ");
});

caseTest("IT-M06-04-048", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "048");
  const 控えた = notes.get("〔履歴変更日時-M0604-048〕");
  await loginAdmin(page, M0604_IT_A);
  let s: OtcStatusChangePage | undefined;
  let 始 = 0;
  let 終 = 0;
  let after = ステータス変更履歴(id);
  await step(1, async () => { 始 = いま(); });
  await step(2, async () => { s = await 変更画面を開く(page, id); });
  await step(3, async () => {
    await s!.選ぶ("買取キャンセル");
    保存の結果を残す(await s!.保存を押す(), page.url());
  });
  await step(4, async () => { 終 = いま(); });
  await step(5, async () => { after = ステータス変更履歴(id); });
  await expected(async () => {
    const 見る = after.filter((h) => !(h.ステータス === "査定前" && h.変更者 === null));
    const 表 = JSON.stringify(見る.map((h) => ({ ...h, 変更日時: 時刻(h.変更日時) })));
    expect.soft(見る.length, `ステータス変更履歴の件数（申込の査定前の1件を除く。${表}）`).toBe(2);
    expect.soft(見る[0]?.ステータス, "1件目のステータス").toBe("査定中");
    expect.soft(見る[0]?.変更者, "1件目の変更者").toBe(M0604_IT_A_NAME);
    expect.soft(時刻(見る[0]?.変更日時 ?? null), `1件目の変更日時（控えた ${控えた} のまま）`).toBe(時刻(画面の日時(控えた)));
    expect.soft(見る[1]?.ステータス, "2件目のステータス").toBe("買取キャンセル");
    expect.soft(見る[1]?.変更者, "2件目の変更者").toBe(M0604_IT_A_NAME);
    expect.soft(範囲内(見る[1]?.変更日時 ?? null, 始, 終), `2件目の変更日時「${時刻(見る[1]?.変更日時 ?? null)}」が操作の間（${時刻(始)}〜${時刻(終)}）`).toBe(true);
  });
  note(履歴の注記);
  note("控えた履歴の変更日時はDBで読まず、シードで買取詳細のステータス変更履歴（日本時間・秒まで）から控えた");
});

caseTest("IT-M06-04-049", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "049");
  const 控えた = notes.get("〔履歴変更日時-M0604-049〕");
  await loginAdmin(page, M0604_ACCOUNT);
  const d = new OtcOrderDetailPage(page);
  let ask: 経理払い出し済の確認 | undefined;
  let 始 = 0;
  let 終 = 0;
  let after = ステータス変更履歴(id);
  await step(1, async () => { 始 = いま(); });
  await step(2, async () => { expect(await d.open(id), "買取詳細の応答").toBeLessThan(400); });
  await step(3, async () => { ask = await d.経理払い出し済を押す(); });
  await step(4, async () => {
    if (!ask!.ダイアログ) note("確認のダイアログが出なかった（押したまま送信された）");
    const r = await ask!.確認に答える(true);
    note(`送信の応答 ${r?.status() ?? "なし"}・上部のメッセージ「${(await d.上部のメッセージ()).join(" / ")}」`);
  });
  await step(5, async () => { 終 = いま(); });
  await step(6, async () => { after = ステータス変更履歴(id); });
  await expected(async () => {
    const 表 = JSON.stringify(after.map((h) => ({ ...h, 変更日時: 時刻(h.変更日時) })));
    expect.soft(after.filter((h) => h.ステータス === "経理払い出し待ち" && h.変更者 === M0604_IT_A_NAME && 時刻(h.変更日時) === 時刻(画面の日時(控えた))).length,
      `ステータス「経理払い出し待ち」・変更者「${M0604_IT_A_NAME}」・変更日時 ${控えた} の履歴（${表}）`).toBe(1);
    expect.soft(after.filter((h) => h.ステータス === "買取成立" && h.変更者 === M0604_ACCOUNT_NAME && 範囲内(h.変更日時, 始, 終)).length,
      `変更日時が操作の間（${時刻(始)}〜${時刻(終)}）・ステータス「買取成立」・変更者「${M0604_ACCOUNT_NAME}」の履歴`).toBe(1);
  });
  note(履歴の注記);
  note("控えた履歴の変更日時はDBで読まず、シードで買取詳細のステータス変更履歴（日本時間・秒まで）から控えた");
});

caseTest("IT-M06-04-050", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "050");
  await loginAdmin(page, M0604_ACCOUNT);
  const d = new OtcOrderDetailPage(page);
  let ask: 経理払い出し済の確認 | undefined;
  let 日付 = "";
  let after = 店頭買取の状態(id);
  await step(1, async () => { 日付 = 今日の日付(); });
  await step(2, async () => { expect(await d.open(id), "買取詳細の応答").toBeLessThan(400); });
  await step(3, async () => { ask = await d.経理払い出し済を押す(); });
  await step(4, async () => {
    if (!ask!.ダイアログ) note("確認のダイアログが出なかった（押したまま送信された）");
    const r = await ask!.確認に答える(true);
    note(`送信の応答 ${r?.status() ?? "なし"}・上部のメッセージ「${(await d.上部のメッセージ()).join(" / ")}」`);
  });
  await step(5, async () => { after = 店頭買取の状態(id); });
  await expected(async () => {
    expect(after.買取成立日の日付, `買取成立日の日付（日本時間。手順1の日付 ${日付}）`).toBe(日付);
  });
});

caseTest("IT-M06-04-056", ステータスを変えてDBで見る("056", M0604_IT_A, "買取成立", "入庫済み", "入庫済み"));
caseTest("IT-M06-04-057", ステータスを変えてDBで見る("057", M0604_IT_A, "未登録在庫あり", "入庫済み", "入庫済み"));
caseTest("IT-M06-04-058", ステータスを変えてDBで見る("058", M0604_IT_A, "経理払い出し待ち", "入庫済み", "入庫済み"));
caseTest("IT-M06-04-059", 経理払い出し済を押してDBで見る("059", M0604_ACCOUNT, "入庫済み", "入庫済み"));
caseTest("IT-M06-04-062", 日時が入る("062", "買取キャンセル", "経理払い出し待ち", "買取キャンセル日", true));
caseTest("IT-M06-04-063", 成立日が変わらない("063", "管理者取消", "経理払い出し待ち", true));

caseTest("IT-M06-04-064", async ({ page, notes, step, expected }) => {
  const id = 受注(notes, "064");
  const before = 店頭買取の状態(id);
  await loginAdmin(page, M0604_IT_A);
  let s: OtcStatusChangePage | undefined;
  let after = before;
  await step(1, async () => { s = await 変更画面を開く(page, id); });
  await step(2, async () => { await s!.選ぶ("査定中"); });
  await step(3, async () => { 保存の結果を残す(await s!.保存を押す(), page.url()); });
  await step(4, async () => { after = 店頭買取の状態(id); });
  await expected(async () => {
    expect.soft(before.ステータス, "変更の前のステータス").toBe("経理払い出し待ち");
    expect.soft(after.ステータス, "保存のあとのステータス").toBe("査定中");
    expect.soft(時刻(after.買取成立日), "買取成立日（空のまま）").toBe("空");
    expect.soft(時刻(after.買取キャンセル日), "買取キャンセル日（空のまま）").toBe("空");
    expect.soft(時刻(after.入庫日時), "入庫日時（空のまま）").toBe("空");
  });
});

caseTest("IT-M06-04-068", 経理払い出し済を押してDBで見る("068", M0604_ACCOUNT, "買取成立", "買取成立"));
caseTest("IT-M06-04-070", 成立日が変わらない("070", "管理者取消", "買取キャンセル", true));
