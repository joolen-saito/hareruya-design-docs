/**
 * A05-02 注文印刷_該当受注のステータスを印刷済みに変更（印刷結果の受信）。正本: cases/A05-02_test_cases.tsv
 * ケースの「ブラウザの開発者ツールから POST する」は、同じブラウザの要求の機能で、手順のパス・値をそのまま送る（pages/api/a05_print.ts）。
 * 手順が ConnectionType・店舗IDを書かないケースは、どちらも付けない。手順のパスは正本のまま（設計書の「/order/prints/status/printed」と
 * 「/api/order/print/direct/1」）。新アプリの経路は POST /api/order/print/direct/{店舗ID} で、ConnectionType=SetResponse のときだけ更新する（記録 review/A05-02_progress_2026-11-11_dev.md）。
 * 受注は E2E がその実行で作ったものだけ（seeds/a05.ts）。008 の受注ID 520006008 は、画面が振った番号で読み替える。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { 受注がある, 受注の印刷の状態, 本店のEC在庫数, 印刷の状態 } from "../../db/a05";
import { 印刷結果のXML, 送る, 応答 } from "../../pages/api/a05_print";
import { 作った受注の } from "../../seeds/a05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 補い = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const DEVTOOLS = "開発者ツールの代わりに、同じブラウザ（同じ Cookie）の要求の機能で POST した";
const 旧パス = "/order/prints/status/printed";
const 新パス = "/api/order/print/direct/1";
const 見る = (r: 応答) => note(`応答: 状態 ${r.状態}・種類「${r.種類}」・本文 ${r.本文.length > 300 ? `${r.本文.slice(0, 300)}…（${r.本文.length}文字）` : `「${r.本文}」`}`);
const 記録 = (id: string, s: 印刷の状態) => note(`受注ID ${id}: 対応状況「${s.対応状況}」・ブラウザ印刷フラグ ${s.ブラウザ印刷 ? "あり" : "なし"}・注文確定日「${s.注文確定日 || "未設定"}」`);
const いま = (): string => new Date(Date.now() + 9 * 3600_000).toISOString().replace("T", " ").slice(0, 19);
const 秒前 = (s: string, n: number): string => new Date(Date.parse(`${s.replace(" ", "T")}+09:00`) + n * 1000 + 9 * 3600_000).toISOString().replace("T", " ").slice(0, 19);

// ---- 001: ConnectionType・店舗IDなしで、本店・支店の受注をピック中へ ----
caseTest("IT-A05-02-001", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔受注ID-A0502-001A〕"), b = notes.get("〔受注ID-A0502-001B〕");
  let xml = "";
  await step(1, async () => { note(`${DEVTOOLS}。ConnectionType と店舗IDは付けない（送り先 ${旧パス}）`); 記録(a, 受注の印刷の状態(a)); 記録(b, 受注の印刷の状態(b)); });
  await step(2, async () => {
    xml = 印刷結果のXML([{ printjobid: `${a}_DrawerOpen_Online`, success: true }, { printjobid: b, success: true }]);
    見る(await 送る(page, 旧パス, { form: { ResponseFile: xml } }));
  });
  let sa!: 印刷の状態, sb!: 印刷の状態;
  await step(3, async () => { sa = 受注の印刷の状態(a); sb = 受注の印刷の状態(b); 記録(a, sa); 記録(b, sb); });
  await expected(async () => {
    expect.soft(sa.対応状況, `受注ID ${a}（本店）の対応状況`).toBe("ピック中");
    expect.soft(sb.対応状況, `受注ID ${b}（支店）の対応状況`).toBe("ピック中");
  });
});

// ---- 002: ブラウザ印刷フラグありの受注をピック中へ ----
caseTest("IT-A05-02-002", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔受注ID-A0502-002〕");
  await step(1, async () => { note(`${DEVTOOLS}（送り先 ${旧パス}）`); 記録(id, 受注の印刷の状態(id)); });
  await step(2, async () => { 見る(await 送る(page, 旧パス, { form: { ResponseFile: 印刷結果のXML([{ printjobid: id, success: true }]) } })); });
  let s!: 印刷の状態;
  await step(3, async () => { s = 受注の印刷の状態(id); 記録(id, s); });
  await expected(async () => { expect.soft(s.対応状況, `受注ID ${id}（ブラウザ印刷フラグあり）の対応状況`).toBe("ピック中"); });
});

// ---- 003: 注文確定日が送信の前から応答までの日時になる ----
caseTest("IT-A05-02-003", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔受注ID-A0502-003〕");
  let 前 = "", 後 = "", s!: 印刷の状態;
  await step(1, async () => { 前 = いま(); note(`送信直前の日時 ${前}`); });
  await step(2, async () => { note(`${DEVTOOLS}（送り先 ${旧パス}）`); 見る(await 送る(page, 旧パス, { form: { ResponseFile: 印刷結果のXML([{ printjobid: id, success: true }]) } })); });
  await step(3, async () => { 後 = いま(); note(`応答受信時の日時 ${後}`); });
  await step(4, async () => { s = 受注の印刷の状態(id); 記録(id, s); });
  await expected(async () => {
    expect.soft(s.注文確定日, `受注ID ${id} の注文確定日が設定された`).not.toBe("");
    expect.soft(s.注文確定日 >= 前 && s.注文確定日 <= 秒前(後, 1), `受注ID ${id} の注文確定日「${s.注文確定日}」が ${前}〜${後} の間`).toBe(true);
  });
});

// ---- 004: クエリでなく POST ボディの ResponseFile だけが使われる ----
caseTest("IT-A05-02-004", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔受注ID-A0502-004A〕"), b = notes.get("〔受注ID-A0502-004B〕");
  const 開始 = 受注の印刷の状態(a); 記録(a, 開始); 記録(b, 受注の印刷の状態(b));
  let q = "";
  await step(1, async () => { q = 印刷結果のXML([{ printjobid: a, success: true }]); note(`クエリの ResponseFile に受注ID ${a} の印刷結果を入れた`); });
  await step(2, async () => { note(`${DEVTOOLS}（送り先 ${旧パス}）`); 見る(await 送る(page, 旧パス, { query: { ResponseFile: q }, form: { ResponseFile: 印刷結果のXML([{ printjobid: b, success: true }]) } })); });
  let sa!: 印刷の状態, sb!: 印刷の状態;
  await step(3, async () => { sa = 受注の印刷の状態(a); sb = 受注の印刷の状態(b); 記録(a, sa); 記録(b, sb); });
  await expected(async () => {
    expect.soft(sb.対応状況, `POST ボディに指定した受注ID ${b} の対応状況`).toBe("ピック中");
    expect.soft(sa.対応状況, `クエリだけに指定した受注ID ${a} の対応状況（開始時「${開始.対応状況}」のまま）`).toBe(開始.対応状況);
  });
});

// ---- 005: 未登録の受注ID 999999 を挟んでも前後の受注を更新する ----
caseTest("IT-A05-02-005", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔受注ID-A0502-005A〕"), b = notes.get("〔受注ID-A0502-005B〕");
  expect(受注がある("999999"), "受注ID 999999 は未登録（シード表の前提）").toBe(false);
  await step(1, async () => { note(`${DEVTOOLS}（送り先 ${旧パス}）`); 記録(a, 受注の印刷の状態(a)); 記録(b, 受注の印刷の状態(b)); });
  await step(2, async () => {
    見る(await 送る(page, 旧パス, { form: { ResponseFile: 印刷結果のXML([{ printjobid: a, success: true }, { printjobid: "999999", success: true }, { printjobid: b, success: true }]) } }));
  });
  let sa!: 印刷の状態, sb!: 印刷の状態;
  await step(3, async () => { sa = 受注の印刷の状態(a); sb = 受注の印刷の状態(b); 記録(a, sa); 記録(b, sb); });
  await expected(async () => {
    expect.soft(sa.対応状況, `受注ID ${a} の対応状況`).toBe("ピック中");
    expect.soft(sb.対応状況, `受注ID ${b} の対応状況`).toBe("ピック中");
  });
});

// ---- 006・007・010: 印刷結果が読めない・0件・無いときは更新しない ----
function 更新しない(呼び名: string, 送り方: (id: string) => { form?: Record<string, string>; 説明: string }, 手順の数: 2 | 3): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(呼び名);
    const 開始 = 受注の印刷の状態(id); 記録(id, 開始);
    const v = 送り方(id);
    let s!: 印刷の状態;
    if (手順の数 === 3) {
      await step(1, async () => { note(`${DEVTOOLS}（送り先 ${旧パス}）`); });
      await step(2, async () => { note(v.説明); 見る(await 送る(page, 旧パス, { form: v.form })); });
      await step(3, async () => { s = 受注の印刷の状態(id); 記録(id, s); });
    } else {
      await step(1, async () => { note(`${DEVTOOLS}（送り先 ${旧パス}）。${v.説明}`); 見る(await 送る(page, 旧パス, { form: v.form })); });
      await step(2, async () => { s = 受注の印刷の状態(id); 記録(id, s); });
    }
    await expected(async () => { expect.soft(s.対応状況, `受注ID ${id} の対応状況（開始時「${開始.対応状況}」のまま）`).toBe(開始.対応状況); });
  };
}
caseTest("IT-A05-02-006", 更新しない("〔受注ID-A0502-006〕", () => ({ form: { ResponseFile: '<?xml version="1.0"?><PrintResponseInfo>' }, 説明: "ResponseFile に終了タグのない XML を入れた" }), 3));
caseTest("IT-A05-02-007", 更新しない("〔受注ID-A0502-007〕", () => ({
  form: { ResponseFile: '<?xml version="1.0" encoding="utf-8"?><PrintResponseInfo Version="3.00"><ServerDirectPrint><Response Success="true"/></ServerDirectPrint></PrintResponseInfo>' },
  説明: "ResponseFile に印刷結果の要素が0件の XML を入れた",
}), 3));
caseTest("IT-A05-02-010", 更新しない("〔受注ID-A0502-010〕", () => ({ form: undefined, 説明: "ResponseFile を付けずに送った" }), 2));

// ---- 008: 金額・税・ポイント・在庫数量を再計算しない ----
caseTest("IT-A05-02-008", async ({ page, step, expected }) => {
  const o = 作った受注の("S-A05-02-NONRECALC-008")[0];
  補い(`正本の受注ID 520006008・商品ID 205020008・在庫ID 305020008 は指定できないので、画面が振った受注ID ${o.受注ID}（商品コード ${o.商品コード}）で読み替えた。手順の printjobid も同じ番号で送った`);
  const 開始 = 受注の印刷の状態(o.受注ID); const 開始の在庫 = 本店のEC在庫数(o.商品コード);
  note(`開始時: 金額 ${開始.支払合計}・税 ${開始.税}・ポイント ${開始.付与ポイント}・在庫数量 ${開始の在庫 ?? "読めない"}`);
  await step(1, async () => {
    note(`${DEVTOOLS}（送り先 ${旧パス}）`);
    見る(await 送る(page, 旧パス, { form: { ResponseFile: 印刷結果のXML([{ printjobid: o.受注ID, success: true }]) } }));
  });
  let s!: 印刷の状態, 在庫: number | null = null;
  await step(2, async () => { s = 受注の印刷の状態(o.受注ID); 在庫 = 本店のEC在庫数(o.商品コード); note(`金額 ${s.支払合計}・税 ${s.税}・ポイント ${s.付与ポイント}・在庫数量 ${在庫 ?? "読めない"}`); });
  await expected(async () => {
    expect.soft(Number(s.支払合計), "金額（1000）").toBe(1000);
    expect.soft(Number(s.税), "税（100）").toBe(100);
    expect.soft(Number(s.付与ポイント), "ポイント（50）").toBe(50);
    expect.soft(在庫, "関連商品の在庫数量（7）").toBe(7);
  });
});

// ---- 009: 正常・問題ありのどちらも 200・本文なし・text/xml ----
caseTest("IT-A05-02-009", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔受注ID-A0502-009A〕"), b = notes.get("〔受注ID-A0502-009B〕");
  let r1!: 応答, r2!: 応答;
  await step(1, async () => { note(`${DEVTOOLS}（送り先 ${旧パス}）`); r1 = await 送る(page, 旧パス, { form: { ResponseFile: 印刷結果のXML([{ printjobid: a, success: true }]) } }); });
  await step(2, async () => { 見る(r1); });
  await step(3, async () => { r2 = await 送る(page, 旧パス, { form: { ResponseFile: 印刷結果のXML([{ printjobid: `${b}_DrawerOpen_Online`, success: false, code: "EX_BADPORT" }]) } }); });
  await step(4, async () => { 見る(r2); });
  await expected(async () => {
    for (const [r, 何] of [[r1, "正常な印刷結果"], [r2, "問題を含む印刷結果"]] as const) {
      expect.soft(r.状態, `${何}の HTTP ステータス`).toBe(200);
      expect.soft(r.本文, `${何}のレスポンスボディ（空）`).toBe("");
      expect.soft(r.種類, `${何}の Content-Type`).toBe("text/xml; charset=utf-8");
    }
  });
});

// ---- 015: /api/order/print/direct/1 へ ConnectionType なしで送るとピック中へ ----
caseTest("IT-A05-02-015", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔受注ID-A0502-015〕");
  const 開始 = 受注の印刷の状態(id); 記録(id, 開始);
  let xml = "", s!: 印刷の状態;
  await step(1, async () => { xml = 印刷結果のXML([{ printjobid: id, success: true }]); note("印刷結果の XML（success=true・printjobid）を組み立てた"); });
  await step(2, async () => { note(`${DEVTOOLS}。ConnectionType は付けない（送り先 ${新パス}）`); 見る(await 送る(page, 新パス, { form: { ResponseFile: xml } })); });
  await step(3, async () => { s = 受注の印刷の状態(id); 記録(id, s); });
  await expected(async () => {
    expect.soft(開始.対応状況, "開始時の対応状況（注文受領）").toBe("注文受領");
    expect.soft(s.対応状況, `受注ID ${id} の対応状況`).toBe("ピック中");
  });
});

// ---- 016: ブラウザ印刷フラグが倒れる ----
caseTest("IT-A05-02-016", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔受注ID-A0502-016〕");
  記録(id, 受注の印刷の状態(id));
  let xml = "", s!: 印刷の状態;
  await step(1, async () => { xml = 印刷結果のXML([{ printjobid: id, success: true }]); note("印刷結果の XML（success=true・printjobid）を組み立てた"); });
  await step(2, async () => { note(`${DEVTOOLS}。手順に無い ConnectionType は付けない（送り先 ${新パス}）`); 見る(await 送る(page, 新パス, { form: { ResponseFile: xml } })); });
  await step(3, async () => { s = 受注の印刷の状態(id); 記録(id, s); });
  await expected(async () => { expect.soft(s.ブラウザ印刷, `受注ID ${id} のブラウザ印刷フラグ（立っていない）`).toBe(false); });
});

// ---- 017・018: 同じ受注の印刷結果が2件以上でも、フラグ・対応状況・注文確定日 ----
function 二件以上(呼び名: string, 未登録を挟む: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(呼び名);
    if (未登録を挟む) expect(受注がある("999999"), "受注ID 999999 は未登録（シード表の前提）").toBe(false);
    記録(id, 受注の印刷の状態(id));
    let 前 = "", 後 = "", s!: 印刷の状態;
    await step(1, async () => { 前 = いま(); note(`送信直前の日時 ${前}`); });
    await step(2, async () => {
      note(`${DEVTOOLS}。手順に無い ConnectionType は付けない（送り先 ${新パス}）`);
      const 結果 = 未登録を挟む
        ? [{ printjobid: id, success: true }, { printjobid: "999999", success: true }, { printjobid: `${id}_DrawerOpen_Online`, success: true }]
        : [{ printjobid: id, success: true }, { printjobid: `${id}_DrawerOpen_Online`, success: true }];
      見る(await 送る(page, 新パス, { form: { ResponseFile: 印刷結果のXML(結果) } }));
    });
    await step(3, async () => { 後 = いま(); note(`応答受信時の日時 ${後}`); });
    await step(4, async () => { s = 受注の印刷の状態(id); 記録(id, s); });
    await expected(async () => {
      expect.soft(s.ブラウザ印刷, `受注ID ${id} のブラウザ印刷フラグ（立っていない）`).toBe(false);
      expect.soft(s.対応状況, `受注ID ${id} の対応状況`).toBe("ピック中");
      expect.soft(s.注文確定日 !== "" && s.注文確定日 >= 前 && s.注文確定日 <= 秒前(後, 1), `受注ID ${id} の注文確定日「${s.注文確定日 || "未設定"}」が ${前}〜${後} の間`).toBe(true);
    });
  };
}
caseTest("IT-A05-02-017", 二件以上("〔受注ID-A0502-017〕", true));
caseTest("IT-A05-02-018", 二件以上("〔受注ID-A0502-018〕", false));
