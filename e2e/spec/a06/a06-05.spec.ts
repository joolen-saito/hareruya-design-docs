/**
 * A06-05 店頭買取受注ステータス更新（MTGBuyer の API の PUT …/otcBuyOrder/{受注ID}/status.json）。正本: cases/A06-05_test_cases.tsv
 * 実装したケースと解釈は記録 review/A06-05_progress_2026-11-20_dev.md。
 *
 * - 「ブラウザの開発者ツールから要求を送る」「Network で確かめる」は、ブラウザのページから API サーバーへ要求を送り、送った要求と応答をページに出して
 *   読む形にした（pages/admin/a06_mtgbuyer_api.ts の 送る）。ステータスは、ケースの文のとおり URL のクエリパラメータ status で送る。
 *   アプリはステータスを要求の本文（フォームの値）から読む作り（OtcBuyOrderController の updateStatus）なので、クエリで送ると読まれない見込み（ECCUBE_HARERUYA-4345 と同じ型）。
 * - 有効なトークンは、手順1の前に管理者のログイン API で受け取る。
 * - 「シード投入時から書き換わらない」は、シードを作り終えたあと（手順1の前）に受注と履歴を DB で控え、その値と比べる（シードは更新日時 T0 を入れず、
 *   申込み・ステータス変更で登録された履歴を消していない。seeds/a06-05.ts の注記）。
 * - 014・015（管理者を削除したあとのトークン）は、管理者を削除するシードを流さない決まり（依頼者決定 2026-11-17）なので書いていない。
 */
import { Page, test } from "@playwright/test";
import { 受注の今, 履歴, 履歴の行 } from "../../db/a06_05";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { OtcOrderDetailPage } from "../../pages/admin/m06_04_status";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { 試験支店 } from "../../pages/admin/reuse_store";
import { 送る, トークンを受け取る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { フロントにログインする } from "../../pages/front/login_without_top";
import { PurchaseHistoryPage } from "../../pages/front/m06_otc_buy";
import { A0605_AB_ADM, A0605_ADM, A0605_会員, ステータス名 } from "../../seeds/a06-05";
import "../../seeds/a06-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 印の補い = "管理者の名前・ログインIDは、実行をまたいで使い回す決まった印（-E2E。ログインIDは小文字）を付けた値で作り、ケースの値もその値として読んだ";

/** 店頭買取受注ステータス更新を送る（ステータスはケースの文のとおり URL のクエリ status で送る） */
function ステータス更新を送る(page: Page, 何: string, 受注ID: string, v: { status?: string; トークン?: string }): Promise<応答> {
  return 送る(page, 何, {
    方式: "PUT", パス: `/api/admin/otcBuyOrder/${受注ID}/status.json`,
    query: v.status === undefined ? [] : [["status", v.status]], トークン: v.トークン,
  });
}

/** 事前準備の「有効な jwt-token が発行されている」: 管理者のログイン API で受け取る */
async function 有効なトークン(page: Page, a = A0605_ADM): Promise<string> {
  supplement(`${印の補い}。有効なトークンは、手順1の前に管理者のログイン API へ管理者のログインID・パスワードを送って受け取った（値は記録しない）`);
  return トークンを受け取る(page, a.loginId, a.password);
}

type 控え = { 受注ID: string; 今: ReturnType<typeof 受注の今>; 履歴: 履歴の行[] };
/** 受注と履歴を控える（「シード投入時」の値。手順1の前に読む） */
function 控える(受注IDs: string[]): 控え[] {
  const out = 受注IDs.map((id) => ({ 受注ID: id, 今: 受注の今(id), 履歴: 履歴(id) }));
  supplement(`「シード投入時」の受注と履歴は、手順1の前に DB で控えた値とした（シードは更新日時T0を入れず、申込み・ステータス変更の履歴を消していない）: ${out.map((x) => `受注 ${x.受注ID}＝ステータス ${x.今?.ステータスID}・査定担当者 ${x.今?.査定担当者ID}・更新日時 ${x.今?.更新日時}・履歴 ${x.履歴.length}件`).join("／")}`);
  return out;
}
/** 控えた値から書き換わった項目（無ければ空）。期待結果で「空であること」を確かめる */
function 書き換わった項目(before: 控え[]): string[] {
  const out: string[] = [];
  for (const b of before) {
    const 今 = 受注の今(b.受注ID);
    const h = 履歴(b.受注ID).map((x) => x.番号).join(",");
    if (今?.ステータスID !== b.今?.ステータスID) out.push(`受注 ${b.受注ID} のステータス ${b.今?.ステータスID} → ${今?.ステータスID}`);
    if (今?.査定担当者ID !== b.今?.査定担当者ID) out.push(`受注 ${b.受注ID} の査定担当者 ${b.今?.査定担当者ID} → ${今?.査定担当者ID}`);
    if (今?.更新日時 !== b.今?.更新日時) out.push(`受注 ${b.受注ID} の更新日時 ${b.今?.更新日時} → ${今?.更新日時}`);
    if (h !== b.履歴.map((x) => x.番号).join(",")) out.push(`受注 ${b.受注ID} のステータス変更履歴 ${b.履歴.length}件 → ${h ? h.split(",").length : 0}件`);
  }
  return out;
}
const 受注IDsの = (notes: CaseCtx["notes"], 頭: string, keys: string[]) => keys.map((k) => notes.get(`〔${頭}${k}〕`));

/** errors 配列を持たない応答か */
const errorsが無い = (r: 応答) => !(r.json && typeof r.json === "object" && Array.isArray((r.json as { errors?: unknown }).errors));
const errorsの = (r: 応答): string[] => (r.json && typeof r.json === "object" && Array.isArray((r.json as { errors?: unknown }).errors) ? ((r.json as { errors: unknown[] }).errors.map(String)) : []);

caseTest("IT-A06-05-001", async ({ page, notes, step, expected }) => {
  const 受注ID = notes.get("〔受注ID-A0605-001〕");
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => { r = await ステータス更新を送る(page, "ステータスの更新（status=6）", 受注ID, { status: "6", トークン: token }); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}・応答本体 ${r.本文 === "" ? "（空）" : r.本文.slice(0, 200)}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.本文, "応答データ（無いこと）").toBe("");
  });
});

caseTest("IT-A06-05-002", async ({ page, notes, step, expected }) => {
  const 組 = [["A", "6"], ["B", "8"], ["C", "9"], ["D", "8"], ["E", "9"], ["F", "6"], ["G", "9"], ["H", "6"], ["I", "8"]] as const;
  const token = await 有効なトークン(page);
  await step(1, async () => {
    for (const [k, s] of 組) await ステータス更新を送る(page, `受注 002${k} のステータスの更新（status=${s}）`, notes.get(`〔受注ID-A0605-002${k}〕`), { status: s, トークン: token });
  });
  await step(2, async () => {
    note(`DB: ${組.map(([k]) => { const id = notes.get(`〔受注ID-A0605-002${k}〕`); return `受注 ${id} のステータス ${ステータス名[受注の今(id)?.ステータスID ?? ""] ?? 受注の今(id)?.ステータスID}`; }).join("／")}`);
  });
  await expected(async () => {
    for (const [k, s] of 組) {
      const id = notes.get(`〔受注ID-A0605-002${k}〕`);
      expect.soft(受注の今(id)?.ステータスID, `受注 ${id}（002${k}）のステータス（${ステータス名[s]}）`).toBe(s);
    }
  });
});

caseTest("IT-A06-05-005", async ({ page, notes, step, expected }) => {
  const 受注ID = notes.get("〔受注ID-A0605-005〕");
  const token = await 有効なトークン(page);
  const before = 控える([受注ID]);
  await step(1, async () => { await ステータス更新を送る(page, "ステータスの更新（status=6）", 受注ID, { status: "6", トークン: token }); });
  await step(2, async () => {
    const 今 = 受注の今(受注ID);
    note(`DB: 受注 ${受注ID} の金額 ${今?.金額}円・ステータス ${今?.ステータスID}`);
    supplement("税90円・ポイント90・在庫数量9は、店頭買取の受注の欄に無く（明細と在庫の関連付けが要る）、シードで入れていないので確かめていない。金額だけを確かめた");
  });
  await expected(async () => {
    expect.soft(受注の今(受注ID)?.金額, `受注 ${受注ID} の金額（更新前のまま900円）`).toBe("900");
    expect.soft(受注の今(受注ID)?.金額, `受注 ${受注ID} の金額（手順1の前に控えた値のまま）`).toBe(before[0].今?.金額);
  });
});

const SAMEの組 = [["A", "6"], ["B", "8"], ["C", "9"]] as const;
caseTest("IT-A06-05-006", async ({ page, notes, step, expected }) => {
  const token = await 有効なトークン(page);
  const rs: 応答[] = [];
  await step(1, async () => {
    for (const [k, s] of SAMEの組) rs.push(await ステータス更新を送る(page, `受注 SAME-${k} のステータスの更新（同じ status=${s}）`, notes.get(`〔受注ID-A0605-共有SAME-${k}〕`), { status: s, トークン: token }));
  });
  await step(2, async () => { note(`HTTP ステータス ${rs.map((r) => r.ステータス).join("・")}`); });
  await expected(async () => { rs.forEach((r, i) => expect.soft(r.ステータス, `SAME-${SAMEの組[i][0]} の HTTP ステータス`).toBe(200)); });
});

caseTest("IT-A06-05-007", async ({ page, notes, step, expected }) => {
  const token = await 有効なトークン(page);
  const before = 控える(受注IDsの(notes, "受注ID-A0605-共有SAME-", SAMEの組.map(([k]) => k)));
  await step(1, async () => {
    for (const [k, s] of SAMEの組) await ステータス更新を送る(page, `受注 SAME-${k} のステータスの更新（同じ status=${s}）`, notes.get(`〔受注ID-A0605-共有SAME-${k}〕`), { status: s, トークン: token });
  });
  await step(2, async () => { note(`DB: ${before.map((b) => `受注 ${b.受注ID} の履歴 ${履歴(b.受注ID).length}件・更新日時 ${受注の今(b.受注ID)?.更新日時}`).join("／")}`); });
  await expected(async () => { expect.soft(書き換わった項目(before), "シード投入時（手順1の前に控えた値）から書き換わった項目（無いこと）").toEqual([]); });
});

caseTest("IT-A06-05-008", async ({ page, notes, step, expected }) => {
  const 組 = [["A", "1"], ["B", "2"], ["C", "5"], ["D", "10"], ["E", "11"], ["F", "12"], ["G", "13"], ["H", "14"]] as const;
  const token = await 有効なトークン(page);
  await step(1, async () => {
    for (const [k, s] of 組) await ステータス更新を送る(page, `受注 TARGETS-${k} のステータスの更新（status=${s}）`, notes.get(`〔受注ID-A0605-共有TARGETS-${k}〕`), { status: s, トークン: token });
  });
  await step(2, async () => { note(`DB: ${組.map(([k]) => { const id = notes.get(`〔受注ID-A0605-共有TARGETS-${k}〕`); return `受注 ${id} のステータス ${受注の今(id)?.ステータスID}`; }).join("／")}`); });
  await expected(async () => {
    for (const [k] of 組) { const id = notes.get(`〔受注ID-A0605-共有TARGETS-${k}〕`); expect.soft(受注の今(id)?.ステータスID, `受注 ${id}（TARGETS-${k}）のステータス（査定中のまま）`).toBe("6"); }
  });
});

caseTest("IT-A06-05-009", async ({ page, notes, step, expected }) => {
  const 組 = [["A", "1"], ["B", "2"], ["C", "10"], ["D", "11"], ["E", "12"], ["F", "13"], ["G", "14"]] as const;
  const token = await 有効なトークン(page);
  await step(1, async () => {
    for (const [k] of 組) await ステータス更新を送る(page, `受注 SOURCES-${k} のステータスの更新（status=8）`, notes.get(`〔受注ID-A0605-共有SOURCES-${k}〕`), { status: "8", トークン: token });
  });
  await step(2, async () => { note(`DB: ${組.map(([k]) => { const id = notes.get(`〔受注ID-A0605-共有SOURCES-${k}〕`); return `受注 ${id} のステータス ${受注の今(id)?.ステータスID}`; }).join("／")}`); });
  await expected(async () => {
    for (const [k, s] of 組) { const id = notes.get(`〔受注ID-A0605-共有SOURCES-${k}〕`); expect.soft(受注の今(id)?.ステータスID, `受注 ${id}（SOURCES-${k}）のステータス（${ステータス名[s]}のまま）`).toBe(s); }
  });
});

const ASSESSORの組 = [["A", "6"], ["B", "9"], ["C", "6"], ["D", "9"]] as const;
caseTest("IT-A06-05-010", async ({ page, notes, step, expected }) => {
  const token = await 有効なトークン(page);
  const rs: 応答[] = [];
  await step(1, async () => {
    for (const [k, s] of ASSESSORの組) rs.push(await ステータス更新を送る(page, `受注 ASSESSOR-${k} のステータスの更新（status=${s}）`, notes.get(`〔受注ID-A0605-共有ASSESSOR-${k}〕`), { status: s, トークン: token }));
  });
  await step(2, async () => { note(`HTTP ステータス ${rs.map((r) => r.ステータス).join("・")}`); });
  await expected(async () => { rs.forEach((r, i) => expect.soft(r.ステータス, `ASSESSOR-${ASSESSORの組[i][0]} の HTTP ステータス`).toBe(400)); });
});

caseTest("IT-A06-05-011", async ({ page, notes, step, expected }) => {
  const token = await 有効なトークン(page);
  const before = 控える(受注IDsの(notes, "受注ID-A0605-共有ASSESSOR-", ASSESSORの組.map(([k]) => k)));
  await step(1, async () => {
    for (const [k, s] of ASSESSORの組) await ステータス更新を送る(page, `受注 ASSESSOR-${k} のステータスの更新（status=${s}）`, notes.get(`〔受注ID-A0605-共有ASSESSOR-${k}〕`), { status: s, トークン: token });
  });
  await step(2, async () => { note(`DB: ${before.map((b) => `受注 ${b.受注ID} のステータス ${受注の今(b.受注ID)?.ステータスID}・査定担当者 ${受注の今(b.受注ID)?.査定担当者ID}・履歴 ${履歴(b.受注ID).length}件`).join("／")}`); });
  await expected(async () => { expect.soft(書き換わった項目(before), "シード投入時（手順1の前に控えた値）から書き換わった項目（無いこと）").toEqual([]); });
});

/** 012・013・027: errors 配列を持たない HTTP 401 */
function 認証できない(受注の呼び名: string | null, 受注ID固定: string | null, status: string, トークン: string | undefined, 何: string) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const 受注ID = 受注の呼び名 ? notes.get(受注の呼び名) : 受注ID固定!;
    let r!: 応答;
    await step(1, async () => { r = await ステータス更新を送る(page, `ステータスの更新（${何}）`, 受注ID, { status, トークン }); });
    await step(2, async () => { note(`HTTP ステータス ${r.ステータス}・応答本体 ${r.本文.slice(0, 200) || "（空）"}`); });
    await expected(async () => {
      expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
      expect.soft(errorsが無い(r), "応答に errors 配列が無いこと").toBe(true);
    });
  };
}
caseTest("IT-A06-05-012", 認証できない("〔受注ID-A0605-共有BASE〕", null, "6", undefined, "jwt-token なし"));
caseTest("IT-A06-05-013", 認証できない("〔受注ID-A0605-共有BASE〕", null, "6", "invalid.jwt.token", "jwt-token「invalid.jwt.token」"));
caseTest("IT-A06-05-027", 認証できない(null, "699027", "699027", undefined, "jwt-token なし・無い受注・無いステータス"));

caseTest("IT-A06-05-016", async ({ page, step, expected }) => {
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => { r = await ステータス更新を送る(page, "ステータスの更新（無い受注ID 699999）", "699999", { status: "6", トークン: token }); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => { expect(r.ステータス, "HTTP ステータス").toBe(404); });
});

caseTest("IT-A06-05-017", async ({ page, notes, step, expected }) => {
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => { r = await ステータス更新を送る(page, "ステータスの更新（無いステータス 699999）", notes.get("〔受注ID-A0605-共有BASE〕"), { status: "699999", トークン: token }); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}・errors ${JSON.stringify(errorsの(r))}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(400);
    expect.soft(errorsが無い(r), "JSON 応答に errors 配列が含まれること").toBe(false);
  });
});

caseTest("IT-A06-05-018", async ({ page, notes, step, expected }) => {
  const token = await 有効なトークン(page);
  const before = 控える([notes.get("〔受注ID-A0605-共有BASE〕")]);
  await step(1, async () => { await ステータス更新を送る(page, "ステータスの更新（無いステータス 699999）", before[0].受注ID, { status: "699999", トークン: token }); });
  await step(2, async () => { note(`DB: 受注 ${before[0].受注ID} のステータス ${受注の今(before[0].受注ID)?.ステータスID}・履歴 ${履歴(before[0].受注ID).length}件`); });
  await expected(async () => { expect.soft(書き換わった項目(before), "シード投入時（手順1の前に控えた値）から書き換わった項目（無いこと）").toEqual([]); });
});

caseTest("IT-A06-05-028", async ({ page, step, expected }) => {
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => { r = await ステータス更新を送る(page, "ステータスの更新（無い受注 699028・無いステータス 699028）", "699028", { status: "699028", トークン: token }); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}・errors ${JSON.stringify(errorsの(r))}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(errorsの(r), "errors 配列").toContain("買取情報が見つかりません");
  });
});

caseTest("IT-A06-05-029", async ({ page, notes, step, expected }) => {
  const 受注ID = notes.get("〔受注ID-A0605-029〕");
  const token = await 有効なトークン(page);
  let 控えた: { 更新日時: string; 件数: number } = { 更新日時: "", 件数: 0 };
  let r2!: 応答;
  await step(1, async () => { await ステータス更新を送る(page, "ステータスの更新（1回目・status=6）", 受注ID, { status: "6", トークン: token }); });
  await step(2, async () => {
    控えた = { 更新日時: 受注の今(受注ID)?.更新日時 ?? "", 件数: 履歴(受注ID).length };
    note(`DB: 受注 ${受注ID} の更新日時 ${控えた.更新日時}・ステータス変更履歴 ${控えた.件数}件（控えた）`);
    supplement("「履歴が1件のまま」は、手順2で控えた件数のまま増えないことで確かめた（シードは申込みで登録された履歴を消していない）");
  });
  await step(3, async () => { r2 = await ステータス更新を送る(page, "ステータスの更新（2回目・同じ status=6）", 受注ID, { status: "6", トークン: token }); });
  await step(4, async () => { note(`DB: 受注 ${受注ID} の更新日時 ${受注の今(受注ID)?.更新日時}・ステータス変更履歴 ${履歴(受注ID).length}件`); });
  await expected(async () => {
    expect.soft(r2.ステータス, "手順3の HTTP ステータス").toBe(200);
    expect.soft(履歴(受注ID).length, `受注 ${受注ID} のステータス変更履歴の件数（手順2の件数のまま）`).toBe(控えた.件数);
    expect.soft(受注の今(受注ID)?.更新日時, `受注 ${受注ID} の更新日時（手順2で控えた値のまま）`).toBe(控えた.更新日時);
  });
});

caseTest("IT-A06-05-030", async ({ page, notes, step, expected }) => {
  const 受注ID = notes.get("〔受注ID-A0605-030〕");
  const token = await 有効なトークン(page);
  const before = 控える([受注ID]);
  await step(1, async () => {
    const r = await ステータス更新を送る(page, "ステータスの更新（status=6）", 受注ID, { status: "6", トークン: token });
    expect.soft(r.ステータス, "手順1の HTTP ステータス").toBe(200);
  });
  await step(2, async () => { await ステータス更新を送る(page, "ステータスの更新（status=8）", 受注ID, { status: "8", トークン: token }); });
  await step(3, async () => {
    note(`DB: 受注 ${受注ID} のステータス ${受注の今(受注ID)?.ステータスID}・増えた履歴 ${JSON.stringify(履歴(受注ID).slice(before[0].履歴.length))}`);
    supplement("「ステータス変更履歴が2件」は、手順1の前に控えた履歴に足された行が2件であることで確かめた（シードは申込みで登録された履歴を消していない）");
  });
  await expected(async () => {
    const 足された = 履歴(受注ID).filter((h) => !before[0].履歴.some((b) => b.番号 === h.番号));
    expect.soft(受注の今(受注ID)?.ステータスID, `受注 ${受注ID} のステータス（査定中断）`).toBe("8");
    expect.soft(足された.map((h) => h.ステータスID), "足されたステータス変更履歴（査定中・査定中断）").toEqual(["6", "8"]);
    expect.soft(足された.map((h) => h.管理者ID), "足された履歴を登録した管理者（どちらも〔管理者ID-A0605-共有ADM〕）").toEqual([notes.get("〔管理者ID-A0605-共有ADM〕"), notes.get("〔管理者ID-A0605-共有ADM〕")]);
  });
});

/** 035〜038: 終了系・同じステータスの更新（応答と、シード投入時からの無書き込み） */
function 書き換わらない更新(n: string, status: string, 応答の期待: number, エラー文?: string) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const 受注ID = notes.get(`〔受注ID-A0605-${n}〕`);
    const token = await 有効なトークン(page);
    const before = 控える([受注ID]);
    let r!: 応答;
    await step(1, async () => { r = await ステータス更新を送る(page, `ステータスの更新（status=${status}）`, 受注ID, { status, トークン: token }); });
    await step(2, async () => { note(`DB: 受注 ${受注ID} のステータス ${受注の今(受注ID)?.ステータスID}・査定担当者 ${受注の今(受注ID)?.査定担当者ID}・履歴 ${履歴(受注ID).length}件`); });
    await expected(async () => {
      expect.soft(r.ステータス, "HTTP ステータス").toBe(応答の期待);
      if (エラー文) expect.soft(errorsの(r), "errors 配列").toContain(エラー文);
      expect.soft(書き換わった項目(before), "シード投入時（手順1の前に控えた値）から書き換わった項目（無いこと）").toEqual([]);
    });
  };
}
caseTest("IT-A06-05-035", 書き換わらない更新("035", "8", 200));
caseTest("IT-A06-05-036", 書き換わらない更新("036", "6", 400, "この査定はすでに終了しているため開くことができません。"));
caseTest("IT-A06-05-037", 書き換わらない更新("037", "9", 400, "この査定はすでに終了しているため開くことができません。"));
caseTest("IT-A06-05-038", 書き換わらない更新("038", "1", 400, "この査定はすでに終了しているためステータスの更新に失敗しました。"));

/** AB: 管理画面の買取一覧で試験支店・査定IDを入れて検索する */
async function 一覧で検索する(page: Page, 査定ID: string): Promise<OtcListPage> {
  const list = new OtcListPage(page);
  await list.open();
  await list.買取店舗を選ぶ(試験支店.店名);
  await list.査定IDを入れる(査定ID);
  await list.検索する();
  return list;
}
const AB店舗の補い = `${印の補い}。買取店舗「A06-05 AB試験店舗」は試験店舗の使い回し（2026-11-13 依頼者決定）で試験支店「${試験支店.店名}」に読み替えた`;

caseTest("IT-A06-05-031", async ({ page, notes, step, expected }) => {
  const 査定ID = notes.get("〔査定ID-A0605AB-001〕");
  const 受注ID = notes.get("〔受注ID-A0605AB-001〕");
  const d = new OtcOrderDetailPage(page);
  const 開く = async () => { const list = await 一覧で検索する(page, 査定ID); await list.詳細を開く(査定ID); expect.soft(d.開いている(受注ID), `受注 ${受注ID} の買取詳細を開いている`).toBe(true); };
  let r!: 応答;
  await step(1, async () => { supplement(AB店舗の補い); await loginAdmin(page, A0605_AB_ADM); await 開く(); });
  await step(2, async () => { const h = await d.履歴(); note(`ステータス変更履歴: ${JSON.stringify(h)}`); expect.soft(h.some((x) => x.ステータス === "査定中"), "ステータス変更履歴に「査定中」の行が無いこと").toBe(false); });
  await step(3, async () => {
    const token = await トークンを受け取る(page, A0605_AB_ADM.loginId, A0605_AB_ADM.password);
    note("有効な jwt-token は、管理者「A06-05 AB試験担当」のログインID・パスワードで管理者のログイン API を呼んで受け取った（値は記録しない）");
    r = await ステータス更新を送る(page, "店頭買取受注ステータス更新（status=6）", 受注ID, { status: "6", トークン: token });
  });
  await step(4, async () => { expect.soft(r.ステータス, "応答の HTTP ステータス").toBe(200); });
  await step(5, async () => { await 開く(); });
  await step(6, async () => { note(`ステータス変更履歴: ${JSON.stringify(await d.履歴())}`); });
  await expected(async () => {
    const 先頭 = (await d.履歴())[0];
    expect.soft(先頭?.ステータス, "ステータス変更履歴の先頭の行のステータス").toBe("査定中");
    expect.soft(先頭?.変更者, "ステータス変更履歴の先頭の行の変更者").toBe(A0605_AB_ADM.名前);
  });
});

caseTest("IT-A06-05-032", async ({ page, notes, step, expected }) => {
  const 査定ID = notes.get("〔査定ID-A0605AB-002〕");
  const 受注ID = notes.get("〔受注ID-A0605AB-002〕");
  let list!: OtcListPage;
  const 行のステータス = async () => (await list.行()).find((x) => x.査定ID === 査定ID)?.ステータス ?? "（行が無い）";
  let 前 = ""; let r!: 応答;
  await step(1, async () => { supplement(AB店舗の補い); await loginAdmin(page, A0605_AB_ADM); list = await 一覧で検索する(page, 査定ID); });
  await step(2, async () => { 前 = await 行のステータス(); note(`査定ID ${査定ID} の行のステータス「${前}」`); });
  await step(3, async () => {
    const token = await トークンを受け取る(page, A0605_AB_ADM.loginId, A0605_AB_ADM.password);
    note("有効な jwt-token は、管理者「A06-05 AB試験担当」で管理者のログイン API を呼んで受け取った（値は記録しない）");
    r = await ステータス更新を送る(page, "店頭買取受注ステータス更新（status=6）", 受注ID, { status: "6", トークン: token });
  });
  await step(4, async () => { expect.soft(r.ステータス, "応答の HTTP ステータス").toBe(200); });
  await step(5, async () => { list = await 一覧で検索する(page, 査定ID); });
  await step(6, async () => { note(`査定ID ${査定ID} の行のステータス「${await 行のステータス()}」`); });
  await expected(async () => {
    expect.soft(前, "手順2の行のステータス").toBe("査定前");
    expect.soft(await 行のステータス(), "手順6の行のステータス").toBe("査定中");
  });
});

/** 033・034: 会員のフロントの処理状態（一覧／詳細）が、API で査定中にしたあと「査定中」になる */
function 会員の画面で見る(n: "003" | "004", 見る: "一覧" | "詳細") {
  return async ({ page, browser, notes, step, expected }: CaseCtx): Promise<void> => {
    const 会員 = A0605_会員(n);
    const 買取番号 = notes.get(`〔買取番号-A0605AB-${n}〕`);
    const 受注ID = notes.get(`〔受注ID-A0605AB-${n}〕`);
    const h = new PurchaseHistoryPage(page);
    const 読む = async () => 見る === "一覧" ? (await h.一覧の行(買取番号)).処理状態 : h.detailValue("処理状態");
    const 開く = async () => { await h.openList(); if (見る === "詳細") await h.openDetail(買取番号); };
    let 前 = ""; let r!: 応答;
    await step(1, async () => {
      supplement(`会員のログインID（メールアドレス）は、実行の印を付けた値（${会員.メール}）。${AB店舗の補い}`);
      await フロントにログインする(page, 会員);
      await 開く();
    });
    await step(2, async () => { 前 = await 読む(); note(`買取番号 ${買取番号} の処理状態「${前}」`); });
    await step(3, async () => {
      const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
      try {
        const p = await ctx.newPage();
        const token = await トークンを受け取る(p, A0605_AB_ADM.loginId, A0605_AB_ADM.password);
        r = await ステータス更新を送る(p, "店頭買取受注ステータス更新（status=6）", 受注ID, { status: "6", トークン: token });
        note(`管理者「A06-05 AB試験担当」の操作は別のブラウザ（新しいブラウザの窓）で行った。応答 HTTP ${r.ステータス}`);
      } finally { await ctx.close(); }
    });
    await step(4, async () => { expect.soft(r.ステータス, "応答の HTTP ステータス").toBe(200); });
    await step(5, async () => { await 開く(); });
    await step(6, async () => { note(`買取番号 ${買取番号} の処理状態「${await 読む()}」`); });
    await expected(async () => {
      expect.soft(前, "手順2の処理状態").toBe("受付完了");
      expect.soft(await 読む(), "手順6の処理状態").toBe("査定中");
    });
  };
}
caseTest("IT-A06-05-033", 会員の画面で見る("003", "一覧"));
caseTest("IT-A06-05-034", 会員の画面で見る("004", "詳細"));

