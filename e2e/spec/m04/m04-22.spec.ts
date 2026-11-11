/**
 * M04-22 在庫移動・振替CSV登録。正本: cases/M04-22_test_cases.tsv
 *
 * テストデータは、既存データか画面から作ったデータに読み替えた（依頼者の方針 2026-11-10。読み替えは seeds/m04-22.ts の先頭と、
 * 各ケースのエビデンスの「シード作成時の問題」）。主な読み替え: 店舗A・店舗B→共有の試験店舗A・試験店舗B（M04-23）、
 * 商品コード→実行ごとの商品、所属→所属のマスタの既存の名称、在庫の入庫→在庫編集と在庫編集承認一覧。
 * 在庫振替のケースは、承認者を試験店舗B 所属で作るので、正本の「店舗A」の役を 試験店舗B が務める（seeds/m04-22.ts の先頭）。
 *
 * 実装しないケース（実施不可の候補）:
 * - 024: 処理の途中で「DBセッションBのトランザクションを取り消す」（別のDB接続を開いたまま、取込の途中で取り消す）。
 *   E2E はDBへ参照以外の接続を保持して取り消す手段を持たない（lib/db_write.ts は1回で終わる書き込みだけ）。
 * - 043: 公開側のブラウザがユニサーチ試験環境へ接続できること（S-M04-22-QE-ENV。外部の試験環境）と、ユニサーチへのフィード反映が要る。
 *
 * 画面の作り・アプリの動きから決めたこと（手順の注記に残す）:
 * - モーダルの送信のボタンの表示名は「登録」。見出し違い・形式違いの誤りは、在庫移動・振替検索一覧の上部の赤い帯（誤り）で見る。
 * - 「登録者がm0422_editとなり」は、登録者の欄が持つ名前（メンバー名「M04-22編集管理者」）で見る。
 * - 移動点数0・在庫不足・同一の出庫元と入庫先の拒否は、正本どおりの結果（登録されること／誤りになること）を確かめる。
 */
import { Page, test } from "@playwright/test";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { Account, loginAdmin } from "../../lib/session";
import { ステータス変更履歴, 在庫, 在庫変動履歴, 在庫移動振替, 商品の在庫移動振替, 明細 } from "../../db/m04_09_move";
import { 明細の商品コードの形, 移動明細の商品一覧 } from "../../db/m04_22_move_transfer_csv";
import { searchStockList, stockRow, stockRowValues } from "../../pages/admin/m04_13_setup";
import { numberOf, StockHistoryPage } from "../../pages/admin/m04_17_stock_history";
import {
  CsvRegisterModal, errorAlerts, FILE_EMPTY_TEXT, MOVE_TRANSFER_LIST_PATH, onMoveTransferList, pageMessages, pathAndTailId, Zone,
} from "../../pages/admin/m04_22_csv_register";
import { CsvModalKind, csvModal, openMoveTransferList, pressCsvRegisterButton } from "../../pages/admin/m04_22_move_transfer_csv";
import { chooseHistoryShopAndSource } from "../../pages/admin/m04_23_split_join_csv";
import { APPROVER_A, APPROVER_B, APPROVER_Z, M0422_EDIT, M0422_VIEW, m0422Case, M0422CaseData, m0422Master, RD_OP } from "../../seeds/m04-22";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const MOVE: CsvModalKind = "在庫移動CSV登録";
const XFER: CsvModalKind = "在庫振替CSV登録";
const EDIT_NAME = "M04-22編集管理者";
type Side = "A" | "B";

/** 確かめる項目（何を・実際の状態・期待）。DB確認は手順の中で読み、期待結果でまとめて確かめる */
type Obs = { 何: string; 実際: unknown; 期待: unknown };

// ================================================================ 001・002（モーダルが開く）

/** 事前準備②のログインのあと、一覧を開いてボタンを押し、押したボタンのモーダルが表示されることを確かめる */
function opensModal(kind: CsvModalKind): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, M0422_EDIT);
    await step(1, () => openMoveTransferList(page));
    const { modal, title } = csvModal(page, kind);
    await step(2, async () => {
      await expect(modal, "ボタンを押す前はモーダルが表示されていない").toBeHidden();
      await pressCsvRegisterButton(page, kind);
    });
    await expected(async () => {
      await expect(modal, `${kind}モーダルが表示される`).toBeVisible();
      await expect(title, `モーダルの見出しが「${kind}」`).toHaveText(kind);
    });
  };
}
caseTest("IT-M04-22-001", opensModal("在庫移動CSV登録"));
caseTest("IT-M04-22-002", opensModal("在庫振替CSV登録"));

// ================================================================ 共通の部品

const storeOf = (d: M0422CaseData, s: Side) => (s === "A" ? d.A : d.B);

/** 「登録」を押し、移った先の画面のメッセージを注記に残す */
async function register(page: Page, modal: CsvRegisterModal): Promise<void> {
  note("モーダルの送信のボタンの表示名は「登録」。正本の「登録」ボタンとして押した");
  await modal.pressRegister();
  note(`「登録」を押したあとの画面: ${new URL(page.url()).pathname}／メッセージ: ${(await pageMessages(page)).join(" / ") || "（なし）"}`);
}

/** 在庫移動・振替検索一覧が表示されていること */
async function listObs(page: Page, what: string): Promise<Obs[]> {
  const v = await onMoveTransferList(page);
  return [
    { 何: `${what}: 在庫移動・振替検索一覧の画面のアドレス`, 実際: v.アドレス, 期待: MOVE_TRANSFER_LIST_PATH },
    { 何: `${what}: 在庫移動・振替検索一覧の検索欄の数`, 実際: v.検索欄, 期待: 1 },
  ];
}
/** 画面上部に誤りの帯が出ていること（文に正規表現が合う帯があること） */
async function errorObs(page: Page, what: string, re?: RegExp): Promise<Obs[]> {
  const errors = await errorAlerts(page);
  const out: Obs[] = [{ 何: `${what}: 画面上部の誤りの帯の数が1以上`, 実際: errors.length >= 1, 期待: true }];
  if (re) out.push({ 何: `${what}: 誤りの文に ${re} が合うものがある（実際: ${errors.join(" / ") || "（なし）"}）`, 実際: errors.some((e) => re.test(e)), 期待: true });
  return out;
}

const stockOf = (code: string, store: string, zone: Zone): number | null => 在庫(code, store, zone)?.在庫 ?? null;
const movesOf = (code: string): string[] => 商品の在庫移動振替(code);

type Ctx = { d: M0422CaseData; page: Page };
type MoveOpts = {
  user?: Account;
  /** 手順1が「モーダルを開く」だけ、手順2が店舗・在庫区分の選択、手順3が登録、手順4がDB確認（003）。無ければ 1=開く+選択、2=登録 */
  open4?: boolean;
  from: [Side, Zone];
  to: [Side, Zone];
  /** 手順の最後（DB確認）で読んで、期待結果で確かめる */
  db?: (c: Ctx) => Obs[];
  /** 「登録」を押した直後の画面を読んで、期待結果で確かめる */
  screen?: (c: Ctx) => Promise<Obs[]>;
  /** 「登録」のあとの手順（モーダルを再度開く 020）。読んだ入力の状態を返す */
  reopen?: boolean;
};

/** 在庫移動CSV登録: モーダルで出庫元・入庫先を選び、ファイルを選んで登録する形のケース */
function moveCase(caseNo: string, o: MoveOpts): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, o.user ?? M0422_EDIT);
    const d = m0422Case(caseNo);
    const modal = new CsvRegisterModal(page, MOVE);
    const fromTo = `出庫元 ${storeOf(d, o.from[0]).店名}・${o.from[1]}、入庫先 ${storeOf(d, o.to[0]).店名}・${o.to[1]}`;
    note(`店舗A・店舗B は ${d.A.店名}・${d.B.店名} に読み替えた（${fromTo}）`);
    const choose = async () => {
      await modal.chooseMoveFrom(storeOf(d, o.from[0]).店名, o.from[1]);
      await modal.chooseMoveTo(storeOf(d, o.to[0]).店名, o.to[1]);
    };
    const submit = async () => {
      await modal.chooseFile(d.csvPath);
      await register(page, modal);
    };
    let obs: Obs[] = [];
    let after: Obs[] = [];
    const ctx = { d, page };
    if (o.open4) {
      await step(1, () => modal.open());
      await step(2, () => choose());
      await step(3, async () => { await submit(); if (o.screen) after = await o.screen(ctx); });
    } else {
      await step(1, async () => { await modal.open(); await choose(); });
      await step(2, async () => { await submit(); if (o.screen) after = await o.screen(ctx); });
    }
    if (o.reopen) {
      await step(o.open4 ? 4 : 3, async () => {
        await modal.openOnList();
        const s = await modal.inputState();
        obs = [
          { 何: "再度開いたモーダルの出庫元店舗（未選択）", 実際: s.出庫元店舗, 期待: "" },
          { 何: "再度開いたモーダルの出庫元在庫区分（未選択）", 実際: s.出庫元在庫区分, 期待: "" },
          { 何: "再度開いたモーダルの入庫先店舗（未選択）", 実際: s.入庫先店舗, 期待: "" },
          { 何: "再度開いたモーダルの入庫先在庫区分（未選択）", 実際: s.入庫先在庫区分, 期待: "" },
          { 何: "再度開いたモーダルのファイルの選択（未選択の表示）", 実際: s.ファイル, 期待: FILE_EMPTY_TEXT },
        ];
      });
    } else if (o.db) {
      await step(o.open4 ? 4 : 3, async () => { obs = o.db!(ctx); });
    }
    await expected(async () => { for (const x of [...obs, ...after]) expect.soft(x.実際, x.何).toEqual(x.期待); });
  };
}

/** 登録された在庫移動（商品コードを対象とするもの）が1件であること。その ID と、件数の確かめ */
function onlyMove(d: M0422CaseData, canonical: string): { id: string | null; obs: Obs } {
  const ids = movesOf(d.code(canonical));
  return { id: ids.length === 1 ? ids[0] : null, obs: { 何: `商品コード ${d.code(canonical)} を対象とする在庫移動の件数`, 実際: ids.length, 期待: 1 } };
}

const MOVE_CODE = (n: string) => `MOVE-001-${n}`;

// ================================================================ 003〜008（正常な在庫移動）

caseTest("IT-M04-22-003", moveCase("003", {
  open4: true, from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  db: ({ d }) => {
    const code = MOVE_CODE("003");
    const { id, obs } = onlyMove(d, code);
    const head = id ? 在庫移動振替(id) : null;
    const lines = id ? 移動明細の商品一覧(id) : [];
    note(`登録者の欄はメンバー名「${EDIT_NAME}」（ログインID m0422_edit のメンバー）で見る。基準価格・商品名は、出庫元の商品の現在の値`);
    return [
      obs,
      { 何: "移動タイプ・ステータス・出庫元・入庫先・登録者", 期待: { 移動タイプ: "在庫移動", ステータス: "新規作成", 出庫元店舗: d.A.店名, 出庫元在庫区分: "EC-CUBE", 入庫先店舗: d.B.店名, 入庫先在庫区分: "EC-CUBE", 登録者: EDIT_NAME },
        実際: head && { 移動タイプ: head.移動タイプ, ステータス: head.ステータス, 出庫元店舗: head.出庫元店舗, 出庫元在庫区分: head.出庫元在庫区分, 入庫先店舗: head.入庫先店舗, 入庫先在庫区分: head.入庫先在庫区分, 登録者: head.登録者 } },
      { 何: "在庫移動対象商品の商品コード・商品名・基準価格・登録時在庫数・移動点数", 期待: [{ 商品コード: d.code(code), 商品名: d.name("移動商品1"), 基準価格: 1000, 登録時出庫元在庫: 100, 移動点数: 10 }],
        実際: lines.map((l) => ({ 商品コード: l.商品コード, 商品名: l.商品名, 基準価格: l.基準価格, 登録時出庫元在庫: l.登録時出庫元在庫, 移動点数: l.移動点数 })) },
    ];
  },
}));

caseTest("IT-M04-22-004", moveCase("004", {
  from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  db: ({ d }) => [{ 何: `${d.A.店名}・EC-CUBE の ${d.code(MOVE_CODE("004"))} の在庫数`, 実際: stockOf(d.code(MOVE_CODE("004")), d.A.店名, "EC-CUBE"), 期待: 90 }],
}));

caseTest("IT-M04-22-005", moveCase("005", {
  from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  db: ({ d }) => {
    const { id, obs } = onlyMove(d, MOVE_CODE("005"));
    const hist = id ? ステータス変更履歴(id) : [];
    return [
      obs,
      { 何: "ステータス変更履歴の件数とステータス・更新者", 期待: [{ ステータス: "新規作成", 更新者: EDIT_NAME }], 実際: hist.map((h) => ({ ステータス: h.ステータス, 更新者: h.更新者 })) },
      { 何: "ステータス変更履歴の登録日時が日時の形", 期待: [true], 実際: hist.map((h) => /^\d{4}-\d{2}-\d{2}/.test(h.更新日)) },
    ];
  },
}));

caseTest("IT-M04-22-006", moveCase("006", {
  from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  db: ({ d }) => {
    const code = d.code(MOVE_CODE("006"));
    const { id, obs } = onlyMove(d, MOVE_CODE("006"));
    const h = 在庫変動履歴(code, d.A.店名, "EC-CUBE").filter((x) => id !== null && x.履歴登録元ID === id);
    return [
      obs,
      { 何: `${d.A.店名}・EC-CUBE の ${code} の、この在庫移動による在庫変動履歴（変更前在庫・変更後在庫・増減数の絶対値）`,
        期待: [{ 変更前在庫: 100, 変更後在庫: 90, 増減: 10 }], 実際: h.map((x) => ({ 変更前在庫: x.変更前在庫, 変更後在庫: x.変更後在庫, 増減: x.増減数 === null ? null : Math.abs(x.増減数) })) },
    ];
  },
}));

caseTest("IT-M04-22-007", moveCase("007", {
  from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  screen: async ({ d, page }) => {
    const { id, obs } = onlyMove(d, MOVE_CODE("007"));
    const at = pathAndTailId(page);
    note("登録した在庫移動の「在庫移動・振替登録 編集（移動2（ピック時））」は、出庫の承認申請の画面（アドレスの末尾が登録した在庫移動のID）");
    return [
      obs,
      { 何: "登録後の画面のアドレス（出庫の承認申請の画面）", 実際: at.パス, 期待: "/product/stock/move/outbound_approval_request/" },
      { 何: "登録後の画面のアドレスの末尾の番号が、登録した在庫移動のID", 実際: at.番号, 期待: id },
    ];
  },
}));

caseTest("IT-M04-22-008", moveCase("008", {
  from: ["A", "EC-CUBE"], to: ["A", "スマレジ"],
  db: ({ d }) => {
    const code = d.code(MOVE_CODE("008"));
    const { id, obs } = onlyMove(d, MOVE_CODE("008"));
    const head = id ? 在庫移動振替(id) : null;
    return [
      obs,
      { 何: "出庫元・入庫先（同一店舗の異なる在庫区分）", 期待: { 出庫元店舗: d.A.店名, 出庫元在庫区分: "EC-CUBE", 入庫先店舗: d.A.店名, 入庫先在庫区分: "スマレジ" },
        実際: head && { 出庫元店舗: head.出庫元店舗, 出庫元在庫区分: head.出庫元在庫区分, 入庫先店舗: head.入庫先店舗, 入庫先在庫区分: head.入庫先在庫区分 } },
      { 何: `${d.A.店名}・EC-CUBE の ${code} の在庫数`, 実際: stockOf(code, d.A.店名, "EC-CUBE"), 期待: 95 },
    ];
  },
}));

// ================================================================ 009・010・013・015・016（誤り・限界値）

caseTest("IT-M04-22-009", moveCase("009", {
  from: ["A", "EC-CUBE"], to: ["A", "EC-CUBE"],
  screen: async ({ page }) => [...(await listObs(page, "「登録」のあと")), ...(await errorObs(page, "「登録」のあと"))],
}));

caseTest("IT-M04-22-010", moveCase("010", {
  from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  screen: async ({ page }) => [...(await listObs(page, "「登録」のあと")), ...(await errorObs(page, "「登録」のあと", /在庫/))],
}));

caseTest("IT-M04-22-013", moveCase("013", {
  from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  db: ({ d }) => {
    const { id, obs } = onlyMove(d, "文字Aを255文字連結した値");
    const lines = id ? 明細の商品コードの形(id) : [];
    const q = id ? 移動明細の商品一覧(id).map((l) => l.移動点数) : [];
    return [
      obs,
      { 何: "在庫移動対象商品の商品コードの文字数と先頭6文字（値は持ち出さない）", 期待: [{ 文字数: 255, 先頭: "AAAAAA" }], 実際: lines },
      { 何: "在庫移動対象商品の移動点数", 期待: [1], 実際: q },
    ];
  },
}));

caseTest("IT-M04-22-015", moveCase("015", {
  from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  db: ({ d }) => {
    const { id, obs } = onlyMove(d, MOVE_CODE("015"));
    return [obs, { 何: "在庫移動対象商品の移動点数（下限値0）", 期待: [0], 実際: id ? 移動明細の商品一覧(id).map((l) => l.移動点数) : [] }];
  },
}));

caseTest("IT-M04-22-016", moveCase("016", {
  from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  db: ({ d }) => {
    const { id, obs } = onlyMove(d, "MOVE-MAX-001-016");
    return [obs, { 何: "在庫移動対象商品の移動点数（上限値）", 期待: [999999999], 実際: id ? 移動明細の商品一覧(id).map((l) => l.移動点数) : [] }];
  },
}));

// ================================================================ 020（見出し違いのあと、モーダルを開き直す）

caseTest("IT-M04-22-020", moveCase("020", { from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"], reopen: true }));

// ================================================================ 022・023（編集権限の無いメンバー）

caseTest("IT-M04-22-022", async ({ page, step, expected }) => {
  await loginAdmin(page, M0422_VIEW);
  const { modal, title } = csvModal(page, MOVE);
  let onList: Obs[] = [];
  await step(1, async () => { await openMoveTransferList(page); onList = await listObs(page, "一覧を開いたとき"); });
  await step(2, () => pressCsvRegisterButton(page, MOVE));
  await expected(async () => {
    for (const x of onList) expect.soft(x.実際, x.何).toEqual(x.期待);
    await expect(modal, "在庫移動CSV登録モーダルが表示される").toBeVisible();
    await expect(title, "モーダルの見出しが「在庫移動CSV登録」").toHaveText(MOVE);
  });
});

caseTest("IT-M04-22-023", moveCase("023", {
  user: M0422_VIEW, from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  db: ({ d }) => [{ 何: `商品コード ${d.code(MOVE_CODE("023"))} を対象とする在庫移動の件数（店舗の編集権限が無いので追加されない）`, 実際: movesOf(d.code(MOVE_CODE("023"))).length, 期待: 0 }],
}));

// ================================================================ 026〜028（在庫振替の承認通知先の選択肢）

/** 開いている在庫振替CSV登録モーダルで、店舗（正本の「店舗A」の役の 試験店舗B）・在庫区分 EC-CUBE を選ぶ */
async function chooseTransferStoreAndZone(modal: CsvRegisterModal): Promise<void> {
  const m = m0422Master();
  note(`承認者は 試験店舗B 所属で作ったので、正本の「店舗A」の役は ${m.B.店名}。所属A・所属B は所属のマスタの既存の「${m.所属A}」「${m.所属B}」`);
  await modal.chooseTransferStore(m.B.店名);
  await modal.chooseTransferZone("EC-CUBE");
}

caseTest("IT-M04-22-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M0422_EDIT);
  const m = m0422Master();
  const modal = new CsvRegisterModal(page, XFER);
  let depts: string[] = [];
  await step(1, () => modal.open());
  await step(2, () => chooseTransferStoreAndZone(modal));
  await step(3, async () => { depts = await modal.departmentChoices(); });
  await expected(async () => {
    expect.soft(depts, "承認通知先（所属選択）の選択肢が、所属のマスターの並び順の「所属A」「所属B」だけ").toEqual([m.所属A, m.所属B]);
  });
});

caseTest("IT-M04-22-027", async ({ page, step, expected }) => {
  await loginAdmin(page, M0422_EDIT);
  const modal = new CsvRegisterModal(page, XFER);
  let dept = "";
  let names: string[] = [];
  await step(1, () => modal.open());
  await step(2, () => chooseTransferStoreAndZone(modal));
  await step(3, async () => {
    dept = await modal.所属.inputValue();
    names = (await modal.memberChoices()).map((o) => o.名前);
  });
  await expected(async () => {
    expect.soft(dept, "承認通知先（所属選択）は未選択").toBe("");
    expect.soft(names, "承認通知先（メンバー選択）が、承認権限を持つ「Approver-A」「Approver-B」「Approver-Z」の名前昇順").toEqual([APPROVER_A, APPROVER_B, APPROVER_Z]);
  });
});

caseTest("IT-M04-22-028", async ({ page, step, expected }) => {
  await loginAdmin(page, M0422_EDIT);
  const m = m0422Master();
  const modal = new CsvRegisterModal(page, XFER);
  note(`承認者は 試験店舗B 所属で作った（正本の「店舗A」の役は ${m.B.店名}）。所属A は所属のマスタの既存の「${m.所属A}」`);
  await step(1, async () => {
    await modal.open();
    await modal.chooseTransferStore(m.B.店名);
    await modal.chooseTransferZone("EC-CUBE");
  });
  await step(2, () => modal.chooseMembers([APPROVER_B]));
  await step(3, () => modal.chooseDepartment(m.所属A));
  let choices: Awaited<ReturnType<CsvRegisterModal["memberChoices"]>> = [];
  await step(4, async () => { choices = await modal.memberChoices(); });
  await expected(async () => {
    expect.soft(choices.filter((o) => o.選択).map((o) => o.名前), "「Approver-B」の選択値が保持されている").toEqual([APPROVER_B]);
    expect.soft(choices.filter((o) => !o.選択).map((o) => o.名前), "選択肢が所属Aの「Approver-A」「Approver-Z」の名前昇順へ差し替えられている").toEqual([APPROVER_A, APPROVER_Z]);
  });
});

// ================================================================ 在庫振替CSV登録の共通の形（029・030・040・041・051〜054）

type XferOpts = {
  user?: Account;
  zone?: Zone;
  /** 手順3: DB確認 */
  db?: (c: Ctx) => Obs[];
  /** 登録した直後の画面 */
  screen?: (c: Ctx) => Promise<Obs[]>;
  /** 手順3: モーダルを再度開く（030） */
  reopen?: boolean;
};

function xferCase(caseNo: string, o: XferOpts): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, o.user ?? M0422_EDIT);
    const d = m0422Case(caseNo);
    const m = m0422Master();
    const modal = new CsvRegisterModal(page, XFER);
    note(`承認者は 試験店舗B 所属で作ったので、正本の「店舗A」の役は ${m.B.店名}（店舗・在庫の読み替え）`);
    let obs: Obs[] = [];
    let after: Obs[] = [];
    const ctx = { d, page };
    await step(1, async () => {
      await modal.open();
      await modal.chooseTransferStore(m.B.店名);
      await modal.chooseTransferZone(o.zone ?? "EC-CUBE");
      await modal.chooseMembers([APPROVER_A]);
    });
    await step(2, async () => {
      await modal.chooseFile(d.csvPath);
      await register(page, modal);
      if (o.screen) after = await o.screen(ctx);
    });
    if (o.reopen) {
      await step(3, async () => {
        await modal.openOnList();
        const s = await modal.inputState();
        obs = [
          { 何: "再度開いたモーダルの店舗（未選択）", 実際: s.店舗, 期待: "" },
          { 何: "再度開いたモーダルの在庫区分（未選択）", 実際: s.在庫区分, 期待: "" },
          { 何: "再度開いたモーダルの承認通知先（所属選択。未選択）", 実際: s.承認通知先所属, 期待: "" },
          { 何: "再度開いたモーダルの承認通知先（メンバー選択。未選択）", 実際: s.承認通知先メンバー, 期待: "" },
          { 何: "再度開いたモーダルのファイルの選択（未選択の表示）", 実際: s.ファイル, 期待: FILE_EMPTY_TEXT },
        ];
      });
    } else if (o.db) {
      await step(3, async () => { obs = o.db!(ctx); });
    }
    await expected(async () => { for (const x of [...obs, ...after]) expect.soft(x.実際, x.何).toEqual(x.期待); });
  };
}

const FORMAT_ERROR = /フォーマット/;

caseTest("IT-M04-22-029", xferCase("029", {
  screen: async ({ page }) => [...(await listObs(page, "「登録」のあと")), ...(await errorObs(page, "「登録」のあと"))],
}));
caseTest("IT-M04-22-030", xferCase("030", { reopen: true }));

caseTest("IT-M04-22-037", moveCase("037", {
  from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  screen: async ({ page }) => {
    note("アプリの誤りの文は「CSVのフォーマットが一致しません。」。正本の「カラムが規定の「商品コード、移動点数」以外であることを示すフォーマット不一致のエラー」として、「フォーマット」を含む誤りの帯を確かめる");
    return [...(await listObs(page, "「登録」のあと")), ...(await errorObs(page, "「登録」のあと", FORMAT_ERROR))];
  },
}));

caseTest("IT-M04-22-040", xferCase("040", {
  user: M0422_VIEW,
  db: ({ d }) => [{ 何: `振替元商品コード ${d.code("M0422-040-A")} を対象とする在庫振替情報の件数（店舗の編集権限が無いので追加されない）`, 実際: movesOf(d.code("M0422-040-A")).length, 期待: 0 }],
}));

caseTest("IT-M04-22-041", xferCase("041", {
  screen: async ({ page }) => {
    note("アプリの誤りの文は「CSVのフォーマットが一致しません。」。「フォーマット」を含む誤りの帯を確かめる");
    return [...(await listObs(page, "「登録」のあと")), ...(await errorObs(page, "「登録」のあと", FORMAT_ERROR))];
  },
}));

// ================================================================ 044〜046・049・050（在庫移動の複数行・全数・在庫区分）

caseTest("IT-M04-22-044", moveCase("044", {
  from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  db: ({ d }) => {
    const a = d.code("M0422-044-A");
    const b = d.code("M0422-044-B");
    const ids = movesOf(a);
    const lines = ids.length === 1 ? 明細(ids[0]).map((l) => ({ 商品コード: l.商品コード, 移動点数: l.移動点数 })) : [];
    return [
      { 何: `商品コード ${a} を対象とする在庫移動の件数`, 実際: ids.length, 期待: 1 },
      { 何: "在庫移動対象商品の商品コードと移動点数（2行）", 期待: [{ 商品コード: a, 移動点数: 10 }, { 商品コード: b, 移動点数: 20 }], 実際: lines },
      { 何: `${d.A.店名}・EC-CUBE の在庫数（A・B）`, 期待: [90, 80], 実際: [stockOf(a, d.A.店名, "EC-CUBE"), stockOf(b, d.A.店名, "EC-CUBE")] },
    ];
  },
}));

caseTest("IT-M04-22-045", moveCase("045", {
  from: ["A", "EC-CUBE"], to: ["B", "EC-CUBE"],
  screen: async ({ page }) => [{ 何: "「登録」のあと: 画面上部の誤りの帯の数（エラーにならない）", 実際: (await errorAlerts(page)).length, 期待: 0 }],
  db: ({ d }) => {
    const code = d.code("M0422-045-A");
    const { id, obs } = onlyMove(d, "M0422-045-A");
    return [
      obs,
      { 何: "在庫移動対象商品の移動点数", 期待: [100], 実際: id ? 移動明細の商品一覧(id).map((l) => l.移動点数) : [] },
      { 何: `${d.A.店名}・EC-CUBE の ${code} の在庫数`, 実際: stockOf(code, d.A.店名, "EC-CUBE"), 期待: 0 },
    ];
  },
}));

caseTest("IT-M04-22-046", moveCase("046", {
  from: ["A", "スマレジ"], to: ["B", "EC-CUBE"],
  db: ({ d }) => {
    const code = d.code("M0422-046-A");
    return [
      { 何: `${d.A.店名}・スマレジ の ${code} の在庫数`, 実際: stockOf(code, d.A.店名, "スマレジ"), 期待: 45 },
      { 何: `${d.A.店名}・EC-CUBE の ${code} の在庫数`, 実際: stockOf(code, d.A.店名, "EC-CUBE"), 期待: 100 },
    ];
  },
}));

/** 在庫移動情報（出庫元・入庫先・ステータス）と、出庫元の2つの在庫区分の在庫数 */
function cbMove(canonical: string, from: [Side, Zone], to: [Side, Zone]): (c: Ctx) => Obs[] {
  return ({ d }) => {
    const code = d.code(canonical);
    const { id, obs } = onlyMove(d, canonical);
    const head = id ? 在庫移動振替(id) : null;
    return [
      obs,
      { 何: "在庫移動情報の出庫元・入庫先・ステータス", 期待: { 出庫元店舗: storeOf(d, from[0]).店名, 出庫元在庫区分: from[1], 入庫先店舗: storeOf(d, to[0]).店名, 入庫先在庫区分: to[1], ステータス: "新規作成" },
        実際: head && { 出庫元店舗: head.出庫元店舗, 出庫元在庫区分: head.出庫元在庫区分, 入庫先店舗: head.入庫先店舗, 入庫先在庫区分: head.入庫先在庫区分, ステータス: head.ステータス } },
      { 何: `${d.A.店名}・スマレジ の ${code} の在庫数`, 実際: stockOf(code, d.A.店名, "スマレジ"), 期待: 45 },
      { 何: `${d.A.店名}・EC-CUBE の ${code} の在庫数（変わらない）`, 実際: stockOf(code, d.A.店名, "EC-CUBE"), 期待: 100 },
    ];
  };
}
caseTest("IT-M04-22-049", moveCase("049", { from: ["A", "スマレジ"], to: ["A", "EC-CUBE"], db: cbMove("M0422-CB049-A", ["A", "スマレジ"], ["A", "EC-CUBE"]) }));
caseTest("IT-M04-22-050", moveCase("050", { from: ["A", "スマレジ"], to: ["B", "スマレジ"], db: cbMove("M0422-CB050-A", ["A", "スマレジ"], ["B", "スマレジ"]) }));

// ================================================================ 051〜054（在庫振替の登録）

/** 在庫振替情報（ステータス「振替承認待ち」）・在庫振替対象商品・振替元の在庫数。「店舗A」の役は 試験店舗B */
function xferDb(prefix: string, zone: Zone, lines: [string, number][], total: number, other?: { zone: Zone; stock: number }): (c: Ctx) => Obs[] {
  return ({ d }) => {
    const src = d.code(`${prefix}-A`);
    const ids = movesOf(src);
    const id = ids.length === 1 ? ids[0] : null;
    const head = id ? 在庫移動振替(id) : null;
    const rows = id ? 明細(id).map((l) => ({ 振替元: l.商品コード, 振替先: l.振替先商品コード, 点数: l.移動点数 })) : [];
    const out: Obs[] = [
      { 何: `振替元商品コード ${src} を対象とする在庫振替情報の件数`, 実際: ids.length, 期待: 1 },
      { 何: "在庫振替情報のステータス", 実際: head?.ステータス, 期待: "振替承認待ち" },
      { 何: "在庫振替対象商品（振替元・振替先・移動点数）", 期待: lines.map(([to, q]) => ({ 振替元: src, 振替先: d.code(`${prefix}-${to}`), 点数: q })), 実際: rows },
      { 何: `${d.B.店名}・${zone} の ${src} の在庫数`, 実際: stockOf(src, d.B.店名, zone), 期待: total },
    ];
    if (other) out.push({ 何: `${d.B.店名}・${other.zone} の ${src} の在庫数（変わらない）`, 実際: stockOf(src, d.B.店名, other.zone), 期待: other.stock });
    return out;
  };
}
caseTest("IT-M04-22-051", xferCase("051", { db: xferDb("M0422-CB051", "EC-CUBE", [["B", 10]], 90) }));
caseTest("IT-M04-22-052", xferCase("052", { db: xferDb("M0422-CB052", "EC-CUBE", [["B", 10], ["C", 20]], 70) }));
caseTest("IT-M04-22-053", xferCase("053", { zone: "スマレジ", db: xferDb("M0422-CB053", "スマレジ", [["B", 10]], 70, { zone: "EC-CUBE", stock: 100 }) }));
caseTest("IT-M04-22-054", xferCase("054", { zone: "スマレジ", db: xferDb("M0422-CB054", "スマレジ", [["B", 10], ["C", 20]], 50, { zone: "EC-CUBE", stock: 100 }) }));

// ================================================================ 047・048（他機能への反映）

/** 在庫履歴検索一覧をメニューから開き、検索条件をクリアし、キーワード・店舗・登録元「在庫移動」で検索する */
async function searchHistory(page: Page, code: string, shop: string): Promise<StockHistoryPage> {
  const h = new StockHistoryPage(page);
  await h.open();
  await h.clearConditions();
  await h.fillKeyword(code);
  await chooseHistoryShopAndSource(page, shop, "在庫移動");
  const status = await h.submit();
  expect(status, "在庫履歴検索一覧の検索の応答").toBeLessThan(400);
  return h;
}

caseTest("IT-M04-22-047", async ({ page, step, expected }) => {
  const d = m0422Case("047");
  const code = d.code("M0422RD-001");
  const modal = new CsvRegisterModal(page, MOVE);
  note(`M04-22 RD店舗A・RD店舗B は ${d.A.店名}・${d.B.店名} に読み替えた。商品コードは ${code}`);
  note("一覧の見出しは、正本の「在庫区分」が「在庫場所」、「在庫増減数」が「在庫変動数」");
  let before: { 件数: number | null; 行: number; メッセージ: string[] } = { 件数: null, 行: -1, メッセージ: [] };
  let after: Record<string, string>[] = [];
  await step(1, () => loginAdmin(page, RD_OP.account));
  await step(2, async () => {
    const h = await searchHistory(page, code, d.A.店名);
    before = { 件数: await h.resultCount(), 行: (await h.rows()).length, メッセージ: await h.messages() };
    note(`手順2の検索結果: 件数の表示 ${before.件数 ?? "（なし）"}・行 ${before.行}・メッセージ ${before.メッセージ.join(" / ") || "（なし）"}`);
  });
  await step(3, () => modal.open());
  await step(4, async () => {
    await modal.chooseMoveFrom(d.A.店名, "EC-CUBE");
    await modal.chooseMoveTo(d.B.店名, "EC-CUBE");
    await modal.chooseFile(d.csvPath);
    await register(page, modal);
  });
  let h: StockHistoryPage | null = null;
  await step(5, async () => { h = await searchHistory(page, code, d.A.店名); });
  await step(6, async () => { after = (await (h as unknown as StockHistoryPage).rows()).filter((r) => r["商品コード"] === code); });
  await expected(async () => {
    expect.soft(before.行, "手順2: 在庫移動の履歴の行の数").toBe(0);
    expect.soft(before.メッセージ.join(" "), "手順2: 該当なしのメッセージ").toContain("検索条件に該当するデータがありませんでした。");
    expect.soft(after.length, "手順5: 検索結果の商品の行の数").toBe(1);
    const r = after[0];
    if (!r) return;
    expect.soft({
      店舗: r["店舗"], 在庫区分: r["在庫場所"], 登録元: r["登録元"], 変更前在庫: numberOf(r["変更前在庫"] ?? ""), 変更後在庫: numberOf(r["変更後在庫"] ?? ""),
      在庫増減数: numberOf(r["在庫変動数"] ?? ""), 変更前総原価: numberOf(r["変更前総原価"] ?? ""), 変更後総原価: numberOf(r["変更後総原価"] ?? ""),
      在庫変動理由区分: r["在庫変動理由区分"],
    }, "手順5: 行の店舗・在庫区分・登録元・変更前後の在庫・在庫増減数・変更前後の総原価・在庫変動理由区分").toEqual({
      店舗: d.A.店名, 在庫区分: "EC-CUBE", 登録元: "在庫移動", 変更前在庫: 10, 変更後在庫: 7, 在庫増減数: -3, 変更前総原価: 1000, 変更後総原価: 700,
      在庫変動理由区分: "在庫移動(減算)",
    });
  });
});

caseTest("IT-M04-22-048", async ({ page, step, expected }) => {
  const d = m0422Case("048");
  const code = d.code("M0422RD-002");
  const modal = new CsvRegisterModal(page, MOVE);
  note(`M04-22 RD店舗A・RD店舗B は ${d.A.店名}・${d.B.店名} に読み替えた。商品コードは ${code}`);
  type V = Awaited<ReturnType<typeof stockRowValues>>;
  let before: V | null = null;
  let after: V | null = null;
  await step(1, async () => {
    await loginAdmin(page, RD_OP.account);
    await searchStockList(page, { store: d.A.店名, zone: "EC-CUBE", code });
    before = await stockRowValues(stockRow(page, code, d.A.店名, "EC-CUBE"));
  });
  await step(2, () => modal.open());
  await step(3, async () => {
    await modal.chooseMoveFrom(d.A.店名, "EC-CUBE");
    await modal.chooseMoveTo(d.B.店名, "EC-CUBE");
    await modal.chooseFile(d.csvPath);
    await register(page, modal);
  });
  await step(4, () => searchStockList(page, { store: d.A.店名, zone: "EC-CUBE", code }));
  await step(5, async () => { after = await stockRowValues(stockRow(page, code, d.A.店名, "EC-CUBE")); });
  await expected(async () => {
    const b = before as V | null;
    const a = after as V | null;
    expect.soft(b && { 在庫: numberOf(b.在庫), 総原価: numberOf(b.総原価) }, "手順1: 行の在庫と総原価").toEqual({ 在庫: 10, 総原価: 1000 });
    expect.soft(a && { 店舗: a.店舗, 在庫区分: a.在庫区分, 在庫: numberOf(a.在庫), 総原価: numberOf(a.総原価) }, "手順4: 行の店舗・在庫区分・在庫・総原価")
      .toEqual({ 店舗: d.A.店名, 在庫区分: "EC-CUBE", 在庫: 7, 総原価: 700 });
  });
});
