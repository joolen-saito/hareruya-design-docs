/**
 * F06-13 オンライン本人確認 のシード（画面操作）。正本: cases/F06-13_seed_data.tsv
 *
 * 読み替えたこと（シード表からは一意に決まらない・開発環境の決まりに合わせた点）:
 * - 会員: フロントの会員情報登録で登録し（seeds/f06-member.ts の 本会員を作る）、管理画面の会員一覧で会員IDを控える。メールアドレスの前半に実行の印を付ける。
 *   パスワードはシード表の値を、登録画面でそのまま指定する（シード表の「DBへ直接設定する」手順は使わない。画面で指定できるため）。
 *   選手情報IDは、会員の選手を DB の参照（SELECT）で控える（デッキ管理の新規登録画面を経由しない）。MTG Companion登録名は入れない。
 * - 本人確認ステータス（確認中・オンライン本人確認済み・簡易書留確認済み）は、管理画面の会員登録/編集画面のラジオで選んで保存する。
 * - 身分証明書マスタ（ID-MASTER）・保存先（STORAGE）・買取専用メールアドレス（MAILCFG）は共有の設定・マスタ。書き換えない。
 *   マスタは DB の参照で読み、シード表の8行と違えば注記に残す（止めない）。保存先と買取専用メールアドレスは今の環境の設定のまま使う（注記に残す）。
 * - テスト用カメラ入力（PHOTOS3・PHOTOS4）は、システムへ登録するデータではない。ブラウザのカメラ入力を差し替える（pages/front/f06_13_identification.ts）。
 * - PC版の管理者（PC-ADM-VIEW）は新しく作らず、全権限の管理者（SETUP_ADMIN）で代える。
 * - PC版の会員（PC-MEMBER）は、仮会員機能（共有の設定）を書き換えず、他の会員と同じく本会員を作る（seeds/f06-member.ts の 本会員を作る）。シード表の「仮会員機能が有効であることを確かめる」は読み替え（登録後に本登録のメールのURLを開く／最初から本会員になる）。電話番号は指定の値を入れる。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { available } from "../lib/db";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 会員の選手ID } from "../db/f06_16";
import { 身分証明書マスタ } from "../db/f06_13";
import { openEditFromResult, searchCustomer } from "../pages/admin/f06_customer";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { defineSeed } from "./current_seed";
import { 本会員を作る, markedMail } from "./f06-member";

export type 本人確認会員 = { メール: string; パスワード: string; 会員ID: string; 選手ID: string | null };
/** シード表の番号（"001" など。"PC001"）→ 作った会員 */
export const 会員一覧 = new Map<string, 本人確認会員>();
export const 会員 = (n: string): 本人確認会員 => { const m = 会員一覧.get(n); if (!m) throw new Error(`会員 ${n} が作られていない`); return m; };

type ステータス = "確認中" | "オンライン本人確認済み" | "簡易書留確認済み";

function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string | null): void {
  if (値 === null) return;
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

async function ステータスを設定する(browser: Browser, メール: string, 状態: ステータス): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, メール);
    await openEditFromResult(page, メール);
    const ed = new M08CustomerEditPage(page);
    await ed.ラジオを選ぶ("Player][IdentityConfirmStatus", 状態);
    await ed.登録する();
    if (!(await ed.成功メッセージ())) throw new Error(`会員 ${メール} の本人確認ステータスを「${状態}」にする保存が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
  });
}

function 会員の作り方(n: string, 状態?: ステータス): SeedBuilder {
  return async ({ browser, notes, seed }) => {
    const seedId = seed.シードID;
    const text = seed["状態・属性"];
    const m = /ログインID=(\S+?)@example\.test／パスワード=([^／]+)／/.exec(text);
    if (!m) throw new Error(`${seedId} のログインID・パスワードを読めない`);
    const [, 前半, パスワード] = m;
    const 会員ID = await 本会員を作る(browser, { 姓: "F06-13", 名: `会員${n}`, セイ: "シケン", メイ: "カイイン", 前半, パスワード });
    const メール = markedMail(前半);
    if (状態) await ステータスを設定する(browser, メール, 状態);
    const 選手ID = available ? 会員の選手ID(会員ID) : null;
    if (available && 選手ID === null) reportSeedIssue(seedId, "登録した会員の選手情報が DB の参照で見つからない");
    会員一覧.set(n, { メール, パスワード, 会員ID, 選手ID });
    控える(notes, seedId, `〔会員ID-F0613-${n}〕`, 会員ID);
    控える(notes, seedId, `〔選手情報ID-F0613-${n}〕`, 選手ID);
  };
}

// 本人確認ステータス=未確認の会員（ケース専用）
defineSeed("S-F06-13-MEMBER-001", 会員の作り方("001"));
defineSeed("S-F06-13-MEMBER-003", 会員の作り方("003"));
defineSeed("S-F06-13-MEMBER-005", 会員の作り方("005"));
defineSeed("S-F06-13-MEMBER-006", 会員の作り方("006"));
defineSeed("S-F06-13-MEMBER-007", 会員の作り方("007"));
defineSeed("S-F06-13-MEMBER-008", 会員の作り方("008"));
defineSeed("S-F06-13-MEMBER-009", 会員の作り方("009"));
defineSeed("S-F06-13-MEMBER-013", 会員の作り方("013"));
defineSeed("S-F06-13-MEMBER-014", 会員の作り方("014"));
defineSeed("S-F06-13-MEMBER-015", 会員の作り方("015"));
defineSeed("S-F06-13-MEMBER-016", 会員の作り方("016"));
defineSeed("S-F06-13-MEMBER-017", 会員の作り方("017"));
defineSeed("S-F06-13-MEMBER-018", 会員の作り方("018"));
defineSeed("S-F06-13-MEMBER-022", 会員の作り方("022"));
defineSeed("S-F06-13-MEMBER-024", 会員の作り方("024"));
defineSeed("S-F06-13-MEMBER-027", 会員の作り方("027"));
defineSeed("S-F06-13-MEMBER-028", 会員の作り方("028"));
defineSeed("S-F06-13-MEMBER-029", 会員の作り方("029"));
defineSeed("S-F06-13-MEMBER-030", 会員の作り方("030"));
defineSeed("S-F06-13-MEMBER-031", 会員の作り方("031"));
defineSeed("S-F06-13-MEMBER-032", 会員の作り方("032"));
defineSeed("S-F06-13-MEMBER-033", 会員の作り方("033"));
defineSeed("S-F06-13-MEMBER-034", 会員の作り方("034"));
defineSeed("S-F06-13-MEMBER-035", 会員の作り方("035"));
defineSeed("S-F06-13-MEMBER-036", 会員の作り方("036"));
defineSeed("S-F06-13-MEMBER-037", 会員の作り方("037"));
defineSeed("S-F06-13-MEMBER-038", 会員の作り方("038"));
defineSeed("S-F06-13-MEMBER-039", 会員の作り方("039"));
defineSeed("S-F06-13-MEMBER-040", 会員の作り方("040"));
defineSeed("S-F06-13-MEMBER-041", 会員の作り方("041"));
defineSeed("S-F06-13-MEMBER-043", 会員の作り方("043"));
defineSeed("S-F06-13-MEMBER-010", 会員の作り方("010", "確認中"));
defineSeed("S-F06-13-MEMBER-011", 会員の作り方("011", "オンライン本人確認済み"));
defineSeed("S-F06-13-MEMBER-012", 会員の作り方("012", "簡易書留確認済み"));
defineSeed("S-F06-13-GF-MEMBER-044", 会員の作り方("044"));
defineSeed("S-F06-13-GF-MEMBER-045", 会員の作り方("045"));
defineSeed("S-F06-13-PARTIAL-048", 会員の作り方("048"));
defineSeed("S-F06-13-CBPC-049", 会員の作り方("049"));


// ---- PC版の会員（共有の設定は書き換えず、本会員として登録する） ----
function PC会員の作り方(n: string, 前半: string): SeedBuilder {
  return async ({ browser, notes, seed }) => {
    const パスワード = "Passw0rd-PC0613a";
    const 会員ID = await 本会員を作る(browser, { 姓: "本人", 名: "確認", セイ: "ホンニン", メイ: "カクニン", 前半, パスワード, 電話番号: "0311112222" });
    会員一覧.set(n, { メール: markedMail(前半), パスワード, 会員ID, 選手ID: null });
    控える(notes, seed.シードID, `〔会員ID-F0613-${n}〕`, 会員ID);
  };
}
defineSeed("S-F06-13-PC-MEMBER-046", PC会員の作り方("PC001", "pc-f0613-001"));
defineSeed("S-F06-13-PC-MEMBER-047", PC会員の作り方("PC002", "pc-f0613-002"));

// ---- 共有のマスタ・設定・撮影データ（書き換えない） ----
const マスタの定め: [string, string, boolean][] = [
  ["1", "自動車運転免許証", true], ["2", "パスポート", true], ["3", "健康保険被保険者証", false], ["4", "外国人登録証明書", true],
  ["5", "住民基本台帳カード", false], ["6", "学生証・社員証", true], ["7", "身体障害者手帳", true], ["8", "マイナンバーカード", true],
];
const マスタを確かめる: SeedBuilder = async ({ seed }) => {
  if (!available) return;
  const have = 身分証明書マスタ();
  for (const [i, name, ok] of マスタの定め) {
    const h = have.find((x) => x.ID === i);
    if (!h || h.選択可 !== ok) reportSeedIssue(seed.シードID, `身分証明書ID ${i}（${name}）が${ok ? "選択可" : "選択不可"}の定めどおりでない（今の環境: ${h ? (h.選択可 ? "選択可" : "選択不可") : "行なし"}）`);
    else if (h.名前 !== name) reportSeedIssue(seed.シードID, `身分証明書ID ${i} の名前はシード表で「${name}」、今の環境のマスタでは「${h.名前}」`);
  }
};
const 注記だけ = (文: string): SeedBuilder => async ({ seed }) => reportSeedIssue(seed.シードID, 文);
const 保存先の注記 = "本人確認画像の保存先は共有の設定なので書き換えない（今の環境の設定のまま使う）";
const メール設定の注記 = "追加システム設定の買取専用メールアドレスは共有の設定なので書き換えない（今の環境の設定のまま使う）";
const カメラの注記 = "システムへ登録するデータは無い。ブラウザのカメラ入力を、絵を映すテスト用カメラ入力に差し替えて撮影する";
defineSeed("S-F06-13-ID-MASTER", マスタを確かめる);
defineSeed("S-F06-13-PC-ID-MASTER", マスタを確かめる);
defineSeed("S-F06-13-STORAGE", 注記だけ(保存先の注記));
defineSeed("S-F06-13-PC-STORAGE", 注記だけ(保存先の注記));
defineSeed("S-F06-13-MAILCFG", 注記だけ(メール設定の注記));
defineSeed("S-F06-13-PC-MAILCFG", 注記だけ(メール設定の注記));
defineSeed("S-F06-13-PHOTOS4", 注記だけ(カメラの注記));
defineSeed("S-F06-13-PHOTOS3", 注記だけ(カメラの注記));
defineSeed("S-F06-13-PC-PHOTOS4", 注記だけ(カメラの注記));
defineSeed("S-F06-13-PC-ADM-VIEW", async ({ seed }) => reportSeedIssue(seed.シードID, "管理者を新しく作らず、全権限の管理者（SETUP_ADMIN）で代える"));
defineSeed("S-F06-13-PC-ENV", async ({ seed }) => reportSeedIssue(seed.シードID, "仮会員機能（共有の設定）は書き換えない。PC版の会員は本会員として登録して作る（開発環境のメールの受け口を使う）"));
