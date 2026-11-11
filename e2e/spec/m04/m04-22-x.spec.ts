/**
 * M04-22 在庫移動・振替CSV登録の続き（-x）。正本: cases/M04-22_test_cases.tsv
 * 仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになった34件のうち29件。振り分け・シードでの解釈・判断待ちは
 * 記録 review/M04-22_progress_2026-11-11_dev.md。001・002 は spec/m04/m04-22.spec.ts。
 *
 * - 店舗は店舗IDで選ぶ（開発環境には同じ店名の「店舗A」「店舗B」がほかにもある）。
 * - 商品コード・CSVのファイル名・試験管理者のログインIDには実行の印が付いている（ケースの文の同じ値も、印を付けた値として読む）。
 * - DB で数える件数は、E2E の商品・E2E のメンバーに関係する在庫移動・振替だけ（共有の開発環境では、ほかの方の在庫移動も増える）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseBody, CaseCtx } from "../../lib/case";
import { Account, loginAdmin } from "../../lib/session";
import * as D from "../../db/m04_22_x";
import {
  approverOptions, chooseApproverDepartment, chooseApprovers, chooseCsvFile, chooseMoveTargets, chooseTransferTarget, CsvModalKind, csvModal,
  CSVファイル, isMoveTransferList, moveModalInputs, openCsvModal, openMoveTransferList, outboundApprovalRequestId, pressCsvRegisterButton,
  submitCsvModal, transferModalInputs, 在庫区分, 登録の結果,
} from "../../pages/admin/m04_22_move_transfer_csv";
import { M0422_EDIT, M0422の店舗 } from "../../seeds/m04-22";
import { CSVの, M0422_VIEW, 実際のコード } from "../../seeds/m04-22-x";

// シード（商品の登録・入庫・承認を画面で行う）が長いので、1件の上限を延ばす
test.beforeEach(async ({}, testInfo) => { testInfo.setTimeout(3_600_000); });

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type 店 = "A" | "B";
const 店の = (k: 店): string => {
  const id = M0422の店舗[k];
  if (!id) throw new Error(`店舗${k}の店舗IDを控えていない`);
  return id;
};
/** 期待結果の確かめ1つ（項目は業務の言葉） */
type 確かめ = { 項目: string; 実際: unknown; 期待: unknown };
const 確 = (項目: string, 実際: unknown, 期待: unknown): 確かめ => ({ 項目, 実際, 期待 });

/** 商品コード（正本）の、E2E の商品の在庫移動（移動タイプ「在庫移動」） */
const 移動の = (正本: string) => D.商品の移動振替(実際のコード(正本)).filter((m) => m.移動タイプ === "在庫移動");
/** 振替元の商品コード（正本）の、E2E の商品の在庫振替 */
const 振替の = (正本: string) => D.商品の移動振替(実際のコード(正本)).filter((m) => m.移動タイプ === "在庫振替")
  .filter((m) => D.対象商品(m.ID).some((d) => d.商品コード === 実際のコード(正本)));
const 在庫数 = (正本: string, k: 店, 区分: 在庫区分): number | null => D.在庫(実際のコード(正本), 店の(k), 区分)?.在庫数 ?? null;
const 元先 = (m: D.移動振替) => ({ 出庫元: [m.出庫元店舗ID, m.出庫元在庫区分], 入庫先: [m.入庫先店舗ID, m.入庫先在庫区分] });
const 結果の注記 = (r: 登録の結果) => note(`登録のあとの画面: ${r.パス}（${r.見出し}）／エラー: ${r.エラー.join(" / ") || "なし"}／成功: ${r.成功.join(" / ") || "なし"}`);

// ---------------------------------------------------------------- 在庫移動CSV登録

type 移動の定め = {
  番号: string;
  ログイン?: Account;
  出庫元: [店, 在庫区分];
  入庫先: [店, 在庫区分];
  /** 手順1でモーダルを開き、手順2で店舗・在庫区分を選ぶ（003）。省くと手順1で開いて選ぶ */
  開く手順?: true;
  /** 登録のあとに DB を確かめる手順がある（ブラウザ+DB確認） */
  DBの手順?: true;
  /** 期待結果の確かめ。DB の手順があれば、その手順で読んだ値から作る */
  確かめ: (r: 登録の結果) => 確かめ[];
  /** 手順1の前に控える値（023 の開始時の件数） */
  前?: () => void;
};

function 移動CSV登録(d: 移動の定め): CaseBody {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, d.ログイン ?? M0422_EDIT);
    const file: CSVファイル = CSVの[d.番号]();
    d.前?.();
    const 選ぶ = () => chooseMoveTargets(page, { 出庫元店舗ID: 店の(d.出庫元[0]), 出庫元在庫区分: d.出庫元[1], 入庫先店舗ID: 店の(d.入庫先[0]), 入庫先在庫区分: d.入庫先[1] });
    let n = 1;
    if (d.開く手順) {
      await step(n++, async () => { await openCsvModal(page, "在庫移動CSV登録"); });
      await step(n++, async () => { await 選ぶ(); });
    } else {
      await step(n++, async () => { await openCsvModal(page, "在庫移動CSV登録"); await 選ぶ(); });
    }
    let r!: 登録の結果;
    await step(n++, async () => {
      await chooseCsvFile(page, "在庫移動CSV登録", file);
      r = await submitCsvModal(page, "在庫移動CSV登録");
      結果の注記(r);
    });
    let 確かめたち: 確かめ[] = [];
    if (d.DBの手順) await step(n++, async () => { 確かめたち = d.確かめ(r); note(`DB で読んだ値: ${JSON.stringify(確かめたち.map((c) => [c.項目, c.実際]))}`); });
    await expected(async () => {
      if (!d.DBの手順) 確かめたち = d.確かめ(r);
      for (const c of 確かめたち) expect.soft(c.実際, c.項目).toEqual(c.期待);
    });
  };
}

/** 新しく登録された在庫移動が1件であること、その在庫移動 */
const 一件 = (正本: string): { 件数: number; m: D.移動振替 | undefined } => { const ms = 移動の(正本); return { 件数: ms.length, m: ms[0] }; };
const 移動点数 = (m: D.移動振替 | undefined) => (m ? D.対象商品(m.ID).map((x) => ({ 商品コード: x.商品コード, 移動点数: x.移動点数 })) : []);

caseTest("IT-M04-22-003", 移動CSV登録({
  番号: "003", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"], 開く手順: true, DBの手順: true,
  確かめ: () => {
    const { 件数, m } = 一件("MOVE-001-003");
    const 対象 = m ? D.対象商品(m.ID).map((x) => ({ 商品コード: x.商品コード, 商品名: x.商品名, 基準価格: x.基準価格, 登録時在庫数: x.登録時在庫数, 移動点数: x.移動点数 })) : [];
    return [
      確("新しく登録された在庫移動情報の件数", 件数, 1),
      確("移動タイプ", m?.移動タイプ, "在庫移動"),
      確("ステータス", m?.ステータス, "新規作成"),
      確("出庫元（店舗ID・在庫区分）と入庫先", m && 元先(m), { 出庫元: [店の("A"), "EC-CUBE"], 入庫先: [店の("B"), "EC-CUBE"] }),
      確("登録者（ログインID）", m?.登録者のログインID, M0422_EDIT.loginId),
      確("在庫移動対象商品（商品コード・商品名・基準価格・登録時在庫数・移動点数）", 対象,
        [{ 商品コード: 実際のコード("MOVE-001-003"), 商品名: "移動商品1", 基準価格: 1000, 登録時在庫数: 100, 移動点数: 10 }]),
    ];
  },
}));

caseTest("IT-M04-22-004", 移動CSV登録({
  番号: "004", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"], DBの手順: true,
  確かめ: () => [確("店舗A・EC-CUBE の MOVE-001-004 の在庫数", 在庫数("MOVE-001-004", "A", "EC-CUBE"), 90)],
}));

caseTest("IT-M04-22-005", 移動CSV登録({
  番号: "005", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"], DBの手順: true,
  確かめ: () => {
    const { 件数, m } = 一件("MOVE-001-005");
    const 履歴 = m ? D.ステータス変更履歴(m.ID).map((h) => ({ ステータス: h.ステータス, 更新者: h.更新者のログインID, 登録日時あり: h.更新日時 !== "" })) : [];
    return [
      確("登録された在庫移動情報の件数", 件数, 1),
      確("ステータス変更履歴（ステータス・更新者のログインID・登録日時の有無）", 履歴, [{ ステータス: "新規作成", 更新者: M0422_EDIT.loginId, 登録日時あり: true }]),
    ];
  },
}));

caseTest("IT-M04-22-006", 移動CSV登録({
  番号: "006", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"], DBの手順: true,
  確かめ: () => {
    const { 件数, m } = 一件("MOVE-001-006");
    const z = D.在庫(実際のコード("MOVE-001-006"), 店の("A"), "EC-CUBE");
    const 履歴 = z && m ? D.在庫変動履歴(z.在庫ID).filter((h) => h.登録元ID === m.ID).map((h) => ({ 変更前在庫: h.変更前在庫, 変更後在庫: h.変更後在庫, 減らした数: h.変更前在庫 - h.変更後在庫 })) : [];
    return [
      確("登録された在庫移動情報の件数", 件数, 1),
      確("店舗A・EC-CUBE の在庫変動履歴のうち、この在庫移動のもの（変更前・変更後・減らした数）", 履歴, [{ 変更前在庫: 100, 変更後在庫: 90, 減らした数: 10 }]),
    ];
  },
}));

caseTest("IT-M04-22-007", 移動CSV登録({
  番号: "007", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"],
  確かめ: (r) => [
    確("移った画面は、登録した在庫移動のピック・出庫承認申請画面（移動2（ピック時））のアドレス", outboundApprovalRequestId(r.パス) !== null, true),
    確("移った画面の見出しが「在庫移動・振替登録」の「ピック・出庫承認申請画面」", r.見出し.includes("在庫移動・振替登録") && r.見出し.includes("ピック・出庫承認申請画面"), true),
    確("画面上部の成功のメッセージがある", r.成功.length > 0, true),
  ],
}));

caseTest("IT-M04-22-008", 移動CSV登録({
  番号: "008", 出庫元: ["A", "EC-CUBE"], 入庫先: ["A", "スマレジ"], DBの手順: true,
  確かめ: () => {
    const { 件数, m } = 一件("MOVE-001-008");
    return [
      確("登録された在庫移動情報の件数", 件数, 1),
      確("出庫元と入庫先（同一店舗内の異なる在庫区分）", m && 元先(m), { 出庫元: [店の("A"), "EC-CUBE"], 入庫先: [店の("A"), "スマレジ"] }),
      確("店舗A・EC-CUBE の MOVE-001-008 の在庫数", 在庫数("MOVE-001-008", "A", "EC-CUBE"), 95),
    ];
  },
}));

caseTest("IT-M04-22-009", 移動CSV登録({
  番号: "009", 出庫元: ["A", "EC-CUBE"], 入庫先: ["A", "EC-CUBE"],
  確かめ: (r) => [
    確("在庫移動・振替検索一覧画面に戻った", isMoveTransferList(r.パス), true),
    確("画面にエラーが表示された", r.エラー.length > 0, true),
  ],
}));

caseTest("IT-M04-22-010", 移動CSV登録({
  番号: "010", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"],
  確かめ: (r) => [
    確("在庫移動・振替検索一覧画面に戻った", isMoveTransferList(r.パス), true),
    確("在庫数が満たないことを示すエラー（「在庫」を含むエラー）が表示された", r.エラー.some((t) => t.includes("在庫")), true),
  ],
}));

caseTest("IT-M04-22-013", 移動CSV登録({
  番号: "013", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"], DBの手順: true,
  確かめ: () => {
    const { 件数, m } = 一件("A255");
    const 対象 = m ? D.対象商品(m.ID).map((x) => ({ 商品コードの文字数: x.商品コードの文字数, 正本の商品コード: x.商品コード === 実際のコード("A255"), 移動点数: x.移動点数 })) : [];
    return [
      確("登録された在庫移動情報の件数", 件数, 1),
      確("在庫移動対象商品（商品コードの文字数・CSVの商品コードと同じか・移動点数）", 対象, [{ 商品コードの文字数: 255, 正本の商品コード: true, 移動点数: 1 }]),
    ];
  },
}));

caseTest("IT-M04-22-015", 移動CSV登録({
  番号: "015", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"], DBの手順: true,
  確かめ: () => { const { m } = 一件("MOVE-001-015"); return [確("在庫移動対象商品（移動点数が下限値0）", 移動点数(m), [{ 商品コード: 実際のコード("MOVE-001-015"), 移動点数: 0 }])]; },
}));

caseTest("IT-M04-22-016", 移動CSV登録({
  番号: "016", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"], DBの手順: true,
  確かめ: () => { const { m } = 一件("MOVE-MAX-001-016"); return [確("在庫移動対象商品（移動点数が上限値999999999）", 移動点数(m), [{ 商品コード: 実際のコード("MOVE-MAX-001-016"), 移動点数: 999999999 }])]; },
}));

/** 023: 開始時に控える件数（E2E の商品の在庫移動・参照管理者が登録した在庫移動） */
const 開始時 = { 商品: -1, 参照管理者: -1 };
caseTest("IT-M04-22-023", 移動CSV登録({
  番号: "023", ログイン: M0422_VIEW, 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"], DBの手順: true,
  前: () => {
    開始時.商品 = 移動の("MOVE-001-023").length;
    開始時.参照管理者 = D.メンバーが登録した移動振替の件数(M0422_VIEW.loginId, "在庫移動");
    note(`開始時の在庫移動情報の件数（E2E の範囲）: MOVE-001-023 を対象とするもの ${開始時.商品} 件・参照管理者が登録したもの ${開始時.参照管理者} 件（共有の開発環境のため、総件数でなく E2E の範囲で数える）`);
  },
  確かめ: () => [
    確("MOVE-001-023 を対象とする在庫移動情報の件数（開始時から増えない）", 移動の("MOVE-001-023").length, 開始時.商品),
    確("参照管理者が登録した在庫移動情報の件数（開始時から増えない）", D.メンバーが登録した移動振替の件数(M0422_VIEW.loginId, "在庫移動"), 開始時.参照管理者),
  ],
}));

caseTest("IT-M04-22-037", 移動CSV登録({
  番号: "037", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"],
  確かめ: (r) => [
    確("在庫移動・振替検索一覧画面に戻った", isMoveTransferList(r.パス), true),
    確("フォーマット不一致のエラーが表示された", r.エラー.some((t) => t.includes("フォーマット")), true),
  ],
}));

caseTest("IT-M04-22-044", 移動CSV登録({
  番号: "044", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"], DBの手順: true,
  確かめ: () => {
    const { m } = 一件("M0422-044-A");
    return [
      確("在庫移動対象商品（2行）", 移動点数(m), [{ 商品コード: 実際のコード("M0422-044-A"), 移動点数: 10 }, { 商品コード: 実際のコード("M0422-044-B"), 移動点数: 20 }]),
      確("店舗A・EC-CUBE の M0422-044-A の在庫数", 在庫数("M0422-044-A", "A", "EC-CUBE"), 90),
      確("店舗A・EC-CUBE の M0422-044-B の在庫数", 在庫数("M0422-044-B", "A", "EC-CUBE"), 80),
    ];
  },
}));

caseTest("IT-M04-22-045", 移動CSV登録({
  番号: "045", 出庫元: ["A", "EC-CUBE"], 入庫先: ["B", "EC-CUBE"], DBの手順: true,
  確かめ: (r) => {
    const { m } = 一件("M0422-045-A");
    return [
      確("エラーにならない（画面のエラーのメッセージ）", r.エラー, []),
      確("在庫移動対象商品（移動点数100）", 移動点数(m), [{ 商品コード: 実際のコード("M0422-045-A"), 移動点数: 100 }]),
      確("店舗A・EC-CUBE の M0422-045-A の在庫数", 在庫数("M0422-045-A", "A", "EC-CUBE"), 0),
    ];
  },
}));

caseTest("IT-M04-22-046", 移動CSV登録({
  番号: "046", 出庫元: ["A", "スマレジ"], 入庫先: ["B", "EC-CUBE"], DBの手順: true,
  確かめ: () => [
    確("店舗A・スマレジ の M0422-046-A の在庫数", 在庫数("M0422-046-A", "A", "スマレジ"), 45),
    確("店舗A・EC-CUBE の M0422-046-A の在庫数（変わらない）", 在庫数("M0422-046-A", "A", "EC-CUBE"), 100),
  ],
}));

caseTest("IT-M04-22-049", 移動CSV登録({
  番号: "049", 出庫元: ["A", "スマレジ"], 入庫先: ["A", "EC-CUBE"], DBの手順: true,
  確かめ: () => {
    const { 件数, m } = 一件("M0422-CB049-A");
    return [
      確("新しく登録された在庫移動情報の件数", 件数, 1),
      確("出庫元と入庫先", m && 元先(m), { 出庫元: [店の("A"), "スマレジ"], 入庫先: [店の("A"), "EC-CUBE"] }),
      確("ステータス", m?.ステータス, "新規作成"),
      確("店舗A・スマレジ の M0422-CB049-A の在庫数", 在庫数("M0422-CB049-A", "A", "スマレジ"), 45),
      確("店舗A・EC-CUBE の M0422-CB049-A の在庫数（変わらない）", 在庫数("M0422-CB049-A", "A", "EC-CUBE"), 100),
    ];
  },
}));

caseTest("IT-M04-22-050", 移動CSV登録({
  番号: "050", 出庫元: ["A", "スマレジ"], 入庫先: ["B", "スマレジ"], DBの手順: true,
  確かめ: () => {
    const { 件数, m } = 一件("M0422-CB050-A");
    return [
      確("新しく登録された在庫移動情報の件数", 件数, 1),
      確("出庫元と入庫先", m && 元先(m), { 出庫元: [店の("A"), "スマレジ"], 入庫先: [店の("B"), "スマレジ"] }),
      確("ステータス", m?.ステータス, "新規作成"),
      確("店舗A・スマレジ の M0422-CB050-A の在庫数", 在庫数("M0422-CB050-A", "A", "スマレジ"), 45),
      確("店舗A・EC-CUBE の M0422-CB050-A の在庫数（変わらない）", 在庫数("M0422-CB050-A", "A", "EC-CUBE"), 100),
    ];
  },
}));

// ---------------------------------------------------------------- 在庫振替CSV登録

type 振替の定め = {
  番号: string;
  ログイン?: Account;
  区分: 在庫区分;
  DBの手順?: true;
  確かめ: (r: 登録の結果) => 確かめ[];
  前?: () => void;
};

/** 店舗A・在庫区分・承認通知先「Approver-A」を選び、CSVを選んで登録する */
function 振替CSV登録(d: 振替の定め): CaseBody {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, d.ログイン ?? M0422_EDIT);
    const file: CSVファイル = CSVの[d.番号]();
    d.前?.();
    await step(1, async () => {
      await openCsvModal(page, "在庫振替CSV登録");
      await chooseTransferTarget(page, { 店舗ID: 店の("A"), 在庫区分: d.区分 });
      await chooseApprovers(page, [notes.get("〔管理者ID-M0422-共有C〕")], "承認通知先「Approver-A」");
    });
    let r!: 登録の結果;
    await step(2, async () => {
      await chooseCsvFile(page, "在庫振替CSV登録", file);
      r = await submitCsvModal(page, "在庫振替CSV登録");
      結果の注記(r);
    });
    let 確かめたち: 確かめ[] = [];
    if (d.DBの手順) await step(3, async () => { 確かめたち = d.確かめ(r); note(`DB で読んだ値: ${JSON.stringify(確かめたち.map((c) => [c.項目, c.実際]))}`); });
    await expected(async () => {
      if (!d.DBの手順) 確かめたち = d.確かめ(r);
      for (const c of 確かめたち) expect.soft(c.実際, c.項目).toEqual(c.期待);
    });
  };
}

const 振替の対象 = (正本: string) => 振替の(正本).flatMap((m) => D.対象商品(m.ID).map((x) => ({ 振替元: x.商品コード, 振替先: x.振替先商品コード, 移動点数: x.移動点数 })));
const 振替の確かめ = (元: string, 先: [string, number][], 区分: 在庫区分, 在庫: [number, number | null]): 確かめ[] => {
  const ms = 振替の(元);
  const 確かめたち = [
    確(`振替元商品コード ${元} を対象とする在庫振替情報の件数`, ms.length, 1),
    確("在庫振替情報のステータス", ms[0]?.ステータス, "振替承認待ち"),
    確("在庫振替対象商品（振替元・振替先・移動点数）", 振替の対象(元), 先.map(([b, n]) => ({ 振替元: 実際のコード(元), 振替先: 実際のコード(b), 移動点数: n }))),
    確(`店舗A・${区分} の ${元} の在庫数`, 在庫数(元, "A", 区分), 在庫[0]),
  ];
  if (在庫[1] !== null) 確かめたち.push(確(`店舗A・EC-CUBE の ${元} の在庫数（変わらない）`, 在庫数(元, "A", "EC-CUBE"), 在庫[1]));
  return 確かめたち;
};

caseTest("IT-M04-22-029", 振替CSV登録({
  番号: "029", 区分: "EC-CUBE",
  確かめ: (r) => [確("在庫移動・振替検索一覧画面に戻った", isMoveTransferList(r.パス), true), 確("画面にエラーが表示された", r.エラー.length > 0, true)],
}));

caseTest("IT-M04-22-040", 振替CSV登録({
  番号: "040", ログイン: M0422_VIEW, 区分: "EC-CUBE", DBの手順: true,
  確かめ: () => [確("振替元商品コード M0422-040-A を対象とする在庫振替情報の件数", 振替の("M0422-040-A").length, 0)],
}));

caseTest("IT-M04-22-041", 振替CSV登録({
  番号: "041", 区分: "EC-CUBE",
  確かめ: (r) => [
    確("在庫移動・振替検索一覧画面に戻った", isMoveTransferList(r.パス), true),
    確("フォーマット不一致のエラーが表示された", r.エラー.some((t) => t.includes("フォーマット")), true),
  ],
}));

caseTest("IT-M04-22-051", 振替CSV登録({
  番号: "051", 区分: "EC-CUBE", DBの手順: true,
  確かめ: () => 振替の確かめ("M0422-CB051-A", [["M0422-CB051-B", 10]], "EC-CUBE", [90, null]),
}));

caseTest("IT-M04-22-052", 振替CSV登録({
  番号: "052", 区分: "EC-CUBE", DBの手順: true,
  確かめ: () => 振替の確かめ("M0422-CB052-A", [["M0422-CB052-B", 10], ["M0422-CB052-C", 20]], "EC-CUBE", [70, null]),
}));

caseTest("IT-M04-22-053", 振替CSV登録({
  番号: "053", 区分: "スマレジ", DBの手順: true,
  確かめ: () => 振替の確かめ("M0422-CB053-A", [["M0422-CB053-B", 10]], "スマレジ", [70, 100]),
}));

caseTest("IT-M04-22-054", 振替CSV登録({
  番号: "054", 区分: "スマレジ", DBの手順: true,
  確かめ: () => 振替の確かめ("M0422-CB054-A", [["M0422-CB054-B", 10], ["M0422-CB054-C", 20]], "スマレジ", [50, 100]),
}));

// ---------------------------------------------------------------- エラーのあと、モーダルを開き直すと入力がリセットされている

function リセット(kind: CsvModalKind, 番号: string): CaseBody {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    await loginAdmin(page, M0422_EDIT);
    const file: CSVファイル = CSVの[番号]();
    await step(1, async () => {
      await openCsvModal(page, kind);
      if (kind === "在庫移動CSV登録") {
        await chooseMoveTargets(page, { 出庫元店舗ID: 店の("A"), 出庫元在庫区分: "EC-CUBE", 入庫先店舗ID: 店の("B"), 入庫先在庫区分: "EC-CUBE" });
      } else {
        await chooseTransferTarget(page, { 店舗ID: 店の("A"), 在庫区分: "EC-CUBE" });
        await chooseApprovers(page, [notes.get("〔管理者ID-M0422-共有C〕")], "承認通知先「Approver-A」");
      }
    });
    await step(2, async () => {
      await chooseCsvFile(page, kind, file);
      const r = await submitCsvModal(page, kind);
      結果の注記(r);
    });
    let 入力: unknown;
    await step(3, async () => {
      await pressCsvRegisterButton(page, kind);
      await expect(csvModal(page, kind).modal, `${kind}モーダルが表示される`).toBeVisible();
      入力 = kind === "在庫移動CSV登録" ? await moveModalInputs(page) : await transferModalInputs(page);
      note(`開き直したモーダルの入力: ${JSON.stringify(入力)}`);
    });
    await expected(async () => {
      const 期待 = kind === "在庫移動CSV登録"
        ? { 出庫元店舗: "", 入庫先店舗: "", 出庫元在庫区分: "", 入庫先在庫区分: "", ファイルの数: 0, ファイル名の表示: "選択されていません" }
        : { 店舗: "", 在庫区分: "", 承認通知先の所属: "", 承認通知先のメンバー: [], ファイルの数: 0, ファイル名の表示: "選択されていません" };
      expect.soft(入力, `${kind}モーダルの入力（店舗・在庫区分${kind === "在庫振替CSV登録" ? "・承認通知先" : ""}・ファイル）がリセットされている`).toEqual(期待);
    });
  };
}

caseTest("IT-M04-22-020", リセット("在庫移動CSV登録", "020"));
caseTest("IT-M04-22-030", リセット("在庫振替CSV登録", "030"));

// ---------------------------------------------------------------- 権限・承認通知先の選択肢

caseTest("IT-M04-22-022", async ({ page, step, expected }) => {
  await loginAdmin(page, M0422_VIEW);
  await step(1, async () => { await openMoveTransferList(page); });
  await step(2, async () => { await pressCsvRegisterButton(page, "在庫移動CSV登録"); });
  await expected(async () => {
    const { modal, title } = csvModal(page, "在庫移動CSV登録");
    await expect.soft(page.locator("form#form_search_stock_move_transfer"), "在庫移動・振替検索一覧画面が表示される").toBeVisible();
    await expect.soft(modal, "在庫移動CSV登録モーダルが表示される").toBeVisible();
    await expect.soft(title, "モーダルの見出しが「在庫移動CSV登録」").toHaveText("在庫移動CSV登録");
  });
});

caseTest("IT-M04-22-028", async ({ page, notes, step, expected }) => {
  test.info().annotations.push({ type: "正本の外の補い", description: "所属A・所属Bは、開発環境の既存の所属「試験所属A」「試験所属B」で読み替えた（所属のマスターに行を足さない）" });
  await loginAdmin(page, M0422_EDIT);
  const A = notes.get("〔管理者ID-M0422-共有C〕"), B = notes.get("〔管理者ID-M0422-共有D〕"), Z = notes.get("〔管理者ID-M0422-共有E〕");
  await step(1, async () => {
    await openCsvModal(page, "在庫振替CSV登録");
    await chooseTransferTarget(page, { 店舗ID: 店の("A"), 在庫区分: "EC-CUBE" });
  });
  await step(2, async () => { await chooseApprovers(page, [B], "承認通知先「Approver-B」"); });
  await step(3, async () => { await chooseApproverDepartment(page, "試験所属A"); });
  let 選択肢: Awaited<ReturnType<typeof approverOptions>> = [];
  await step(4, async () => {
    選択肢 = await approverOptions(page);
    note(`承認通知先（メンバー選択）の選択肢: ${選択肢.map((o) => `${o.表示名}${o.選択中 ? "（選択中）" : ""}`).join("、")}`);
  });
  await expected(async () => {
    expect.soft(選択肢.filter((o) => o.選択中).map((o) => o.管理者ID), "「Approver-B」の選択値が保持される").toEqual([B]);
    expect.soft(選択肢.filter((o) => !o.選択中).map((o) => ({ 管理者ID: o.管理者ID, 名前: o.名前 })), "選択肢が所属Aの承認者「Approver-A」「Approver-Z」の名前昇順へ差し替えられる")
      .toEqual([{ 管理者ID: A, 名前: "Approver-A" }, { 管理者ID: Z, 名前: "Approver-Z" }]);
  });
});
