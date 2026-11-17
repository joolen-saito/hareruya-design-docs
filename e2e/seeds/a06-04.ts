/**
 * A06-04 店頭買取受注コメント更新（MTGBuyer の API）のシードの作り方（画面操作）。
 * 値はシード表（integration_test/casegen/cases/A06-04_seed_data.tsv）の状態・属性と投入方法のとおり。
 *
 * シードでの解釈（正本の外の補い）:
 * - S-A06-04-ENV・S-A06-04-AB-ENV（試験端末の送信元IPの許可・API と DB 確認の用意）: IP 許可リストは全員が使う環境の設定。書き換えず、
 *   この端末から API サーバーへ要求が届く（誤ったログインIDで 401 が返る）ことを使う。MTGBuyer は使わない（API へ直接送る）。
 * - S-A06-04-AUTH（署名方式・署名の鍵）: 共有の開発環境では API の認証の秘密の値を書き換えず、環境に設定済みの値を使う（シード表の
 *   ≪共有の設定≫）。有効なトークンは管理者のログイン API で受け取る。
 * - S-A06-04-REFERENCES・S-A06-04-AB-STORE の試験店舗（「A06-04試験店舗」「A06-04AB試験店舗」）は、試験店舗の使い回し（依頼者決定 2026-11-13）で
 *   作らず、試験支店に読み替える。店頭買取ステータス ID 5「査定前」・職業「会社員」・国「日本」・都道府県「東京都」は、マスタを書き換えず DB で
 *   あることだけを確かめる（無ければ止める）。S-A06-04-AB-STATUSES（店頭買取ステータスの固定マスタ）も、DB へ投入せず、あることだけを確かめる。
 * - 管理者は、実行をまたいで使い回す決まった印（rcFixed）を名前・ログインIDに付けて1度だけ作る（依頼者決定 2026-11-11）。メールアドレスは試験用の
 *   example.test にした。S-A06-04-AB-ADM の所属「東京店」は、メンバー登録画面の所属の選択肢の先頭にした（共通の部品の作り）。
 * - 店頭買取の受注（S-A06-04-BASE-NNN・S-A06-04-AB-ORDER-019）は、試験支店のフロントの店頭買取査定申込（会員登録なし）で作り、完了画面の査定番号を
 *   査定IDとして控え、受注IDは DB で査定IDから読む（買取一覧で「最後に登録した行」を探す代わり。同じ申込者名の申込がほかにもあるため）。
 *   申込者の電話番号・郵便番号・住所・生年月日・職業は、共通の申込の部品の固定の値（シード表の値と違う）。どのケースもこれらを確かめない。
 * - 査定申込日時・更新日時の決まった値（シード表は DB で直接設定）は入れない。どのケースも日時を確かめない。
 * - S-A06-04-NOORDER-NNN は「DB で消して0件を確かめる」作り方。開発環境ではデータを消すシードとして、基盤がケースを流さない。
 *   ここでは消さずに、0件であることだけを確かめる。S-A06-04-GHOST-TOKEN-009（環境の鍵で署名したトークン）は作れないので、009 は書いていない。
 */
import { SETUP_ADMIN } from "../config/env";
import { 申込のマスタにある, 査定IDの受注ID, 店頭買取の受注, 店頭買取の受注がある, 店頭買取ステータスの名称 } from "../db/a06";
import { rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberFixed } from "../pages/admin/member";
import { OtcDetail } from "../pages/admin/m06_03_detail";
import { 店舗読み替えの注記, 試験支店ID, 試験店舗の名前を読む } from "../pages/admin/test_store";
import { 試験支店 } from "../pages/admin/reuse_store";
import { 申込を行う, 申込者の } from "./m06-common";

type 管理者 = Account & { 名前: string; メール: string };
const 管理者の = (ログインID: string, パスワード: string, 名前: string): 管理者 => {
  const loginId = rcFixed(ログインID).toLowerCase();
  // 開発環境のメンバー登録はパスワードを12文字以上に限る。シード表の11文字のパスワードは末尾に「X」を足して読み替える（A06-12 と同じ）
  const password = パスワード.length < 12 ? `${パスワード}X` : パスワード;
  return { loginId, password, 名前: rcFixed(名前), メール: `${loginId}@example.test` };
};
/** S-A06-04-ADM（有効なトークンを受け取る管理者） */
export const A0604_ADM = 管理者の("a0604_admin", "ZxA0604c001", "A06-04試験担当");
/** S-A06-04-OTHER-ADM（更新前の更新担当者） */
export const A0604_OTHER = 管理者の("a0604_other", "ZxA0604c002", "A06-04更新前担当");
/** S-A06-04-AB-ADM（管理画面と API の両方を使う管理者） */
export const A0604_AB_ADM = 管理者の("a0604abadm", "Passw0rd-A0604AB", "A06-04AB試験担当");

/** 試験支店の店名（メンバー登録画面の所属店舗の選択肢の表示名） */
let 店名の控え = "";
async function 試験支店の店名(page: Parameters<Parameters<typeof withAdminSession>[2]>[0]): Promise<string> {
  if (!店名の控え) 店名の控え = (await 試験店舗の名前を読む(page)).試験支店;
  return 店名の控え;
}

const 環境のシード: SeedBuilder = async ({ seed }) => {
  reportSeedIssue(seed.シードID, "試験端末の送信元IPの許可は、全員が使う環境の設定（IP 許可リスト）。書き換えず、この端末から API サーバーへ要求が届くことを使う。MTGBuyer は使わず、API へ直接送る");
};
defineSeed("S-A06-04-ENV", 環境のシード);
defineSeed("S-A06-04-AB-ENV", 環境のシード);
defineSeed("S-A06-04-AUTH", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有の開発環境では、API の認証の署名方式・秘密の値を書き換えず、環境に設定済みの値を使う（シード表の≪共有の設定≫）。有効なトークンは管理者のログイン API で受け取る");
});

/** マスタの値があることを DB で確かめる（無ければ止める。書き換えない） */
function マスタを確かめる(シードID: string, マスタ: "職業" | "国" | "都道府県", 名称: string): void {
  if (!申込のマスタにある(マスタ, 名称)) throw new Error(`${シードID}: ${マスタ}のマスタに「${名称}」が無い（書き換えずに使う前提を満たせない）`);
}

defineSeed("S-A06-04-REFERENCES", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店名 = await 試験支店の店名(page);
    reportSeedIssue(seed.シードID, 店舗読み替えの注記("A06-04試験店舗", 店名, 試験支店ID));
    notes.set("〔店舗ID-A0604-共有〕", 試験支店ID);
  });
  const s5 = 店頭買取ステータスの名称("5");
  if (s5 !== "査定前") throw new Error(`S-A06-04-REFERENCES: 店頭買取ステータス ID 5 の名称が「${s5}」（「査定前」でない。共有のマスタは書き換えない）`);
  マスタを確かめる(seed.シードID, "職業", "会社員");
  // 開発環境の国のマスタは英語の名称（ID 392「Japan」）。「日本」に当たる行として使う（共有のマスタは書き換えない）
  if (!申込のマスタにある("国", "日本")) {
    マスタを確かめる(seed.シードID, "国", "Japan");
    reportSeedIssue(seed.シードID, "国「日本」は、開発環境の国のマスタでは英語の名称「Japan」（ID 392）。この行を「日本」に当たる行として使った（マスタは書き換えない）");
  }
  マスタを確かめる(seed.シードID, "都道府県", "東京都");
  reportSeedIssue(seed.シードID, "店頭買取ステータス ID 5「査定前」・職業「会社員」・国「日本」・都道府県「東京都」は、マスタを書き換えず、あることを DB で確かめた");
});

defineSeed("S-A06-04-AB-STORE", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店名 = await 試験支店の店名(page);
    reportSeedIssue(seed.シードID, 店舗読み替えの注記("A06-04AB試験店舗", 店名, 試験支店ID));
    notes.set("〔店舗ID-A0604AB-共有〕", 試験支店ID);
  });
});

defineSeed("S-A06-04-AB-STATUSES", async ({ seed }) => {
  const 求める: [string, string][] = [["1", "買取成立"], ["2", "買取キャンセル"], ["5", "査定前"], ["6", "査定中"], ["8", "査定中断"], ["9", "査定再開"],
    ["10", "経理払い出し待ち"], ["11", "入庫済み"], ["12", "未登録在庫あり"], ["13", "入庫待ち"], ["14", "管理者取消"]];
  const 違う = 求める.map(([id, 名]) => [id, 名, 店頭買取ステータスの名称(id)] as const).filter(([, 名, 今]) => 今 !== 名);
  if (違う.length) reportSeedIssue(seed.シードID, `店頭買取ステータスのマスタがシード表と違う（書き換えない）: ${違う.map(([id, 名, 今]) => `ID ${id} はシード表「${名}」・DB「${今 ?? "無い"}」`).join("／")}`);
  if (店頭買取ステータスの名称("5") !== "査定前") throw new Error("S-A06-04-AB-STATUSES: 店頭買取ステータス ID 5 が「査定前」でない");
  reportSeedIssue(seed.シードID, "店頭買取ステータスは画面で作れない固定マスタ。DB へ投入せず、ある値をそのまま使う");
});

/** 管理者を（無ければ）メンバー登録画面で登録し、管理者IDを控える。所属店舗・デフォルト検索表示店舗・編集可能店舗は試験支店 */
const 管理者のシード = (a: 管理者, 呼び名: string, 権限: string, 補い: string): SeedBuilder => async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店名 = await 試験支店の店名(page);
    notes.set(呼び名, await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店名, ログインID: a.loginId, メールアドレス: a.メール, パスワード: a.password,
      権限, デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
    }, (m) => reportSeedIssue(seed.シードID, m)));
  });
  reportSeedIssue(seed.シードID, 補い);
  if (a.password.length === 12 && a.password.endsWith("X")) reportSeedIssue(seed.シードID, "パスワードはシード表の11文字の値の末尾に「X」を足して読み替えた（開発環境のメンバー登録は12文字以上でないと保存できない）");
};
defineSeed("S-A06-04-ADM", { needs: ["S-A06-04-REFERENCES"] }, 管理者のシード(A0604_ADM, "〔管理者ID-A0604-共有A〕", "システム管理者",
  "所属は選択肢の先頭、デフォルト検索表示店舗・編集可能店舗は所属店舗と同じ試験支店（シード表に記載なし）"));
defineSeed("S-A06-04-OTHER-ADM", { needs: ["S-A06-04-REFERENCES"] }, 管理者のシード(A0604_OTHER, "〔管理者ID-A0604-共有B〕", "システム管理者",
  "所属は選択肢の先頭、デフォルト検索表示店舗は所属店舗と同じ試験支店（シード表に記載なし）"));
defineSeed("S-A06-04-AB-ADM", { needs: ["S-A06-04-AB-STORE"] }, 管理者のシード(A0604_AB_ADM, "〔管理者ID-A0604AB-共有〕", "システム管理者",
  "権限グループはシード表の「システム権限」が開発環境の選択肢に無いため「システム管理者」で読み替えた（全員が使う権限グループは足さない）。所属は、シード表の「東京店」ではなく選択肢の先頭（共通の部品の作り）。デフォルト検索表示店舗は所属店舗と同じ試験支店（シード表に記載なし）"));

/**
 * 試験支店のフロントで会員登録なしの店頭買取査定申込をし、査定ID・受注IDを控える。続けて担当の管理者で買取詳細画面を開き、
 * フリーコメントを入れて保存する（更新担当者がこの管理者になる）。保存したあと、DB でフリーコメントと更新担当者を確かめる
 */
async function 申込んでコメントを入れる(ctx: Parameters<SeedBuilder>[0], v: { 姓: string; 名: string; セイ: string; メイ: string; 査定の呼び名: string; 受注の呼び名: string; 担当: 管理者; 担当の呼び名: string; コメント: string }): Promise<void> {
  const { browser, notes, seed } = ctx;
  const [査定ID] = await 申込を行う(browser, 試験支店.支店URL, [申込者の(v.姓, v.名, v.セイ, v.メイ)]);
  const 受注ID = 査定IDの受注ID(査定ID);
  if (!受注ID) throw new Error(`${seed.シードID}: 申込んだ査定ID ${査定ID} の店頭買取の受注が DB に無い`);
  notes.set(v.査定の呼び名, 査定ID);
  notes.set(v.受注の呼び名, 受注ID);
  await withAdminSession(browser, v.担当, async (page) => {
    const d = new OtcDetail(page);
    await d.open(受注ID);
    await d.フリーコメントを入れる(v.コメント);
    await d.保存を押す();
  });
  const r = 店頭買取の受注(受注ID);
  if (r?.フリーコメント !== v.コメント) throw new Error(`${seed.シードID}: 買取詳細画面でフリーコメントを保存したが、受注ID ${受注ID} のフリーコメントが「${r?.フリーコメント}」`);
  if (r?.更新担当者ID !== notes.get(v.担当の呼び名)) throw new Error(`${seed.シードID}: 受注ID ${受注ID} の更新担当者が ${r?.更新担当者ID}（求めるのは ${notes.get(v.担当の呼び名)}）`);
  reportSeedIssue(seed.シードID, `試験支店のフロントで申込んだ（査定ID ${査定ID}・受注ID ${受注ID}）。電話番号・郵便番号・住所・生年月日・職業は共通の申込の部品の固定の値、査定申込日時・更新日時は申込・保存したときの値（シード表の決まった値は入れていない。ケースは確かめない）`);
}

const 受注のシード = (n: string): SeedBuilder => (ctx) => 申込んでコメントを入れる(ctx, {
  姓: "晴屋", 名: "太郎", セイ: "ハレヤ", メイ: "タロウ", 査定の呼び名: `〔査定ID-A0604-${n}〕`, 受注の呼び名: `〔受注ID-A0604-${n}〕`,
  担当: A0604_OTHER, 担当の呼び名: "〔管理者ID-A0604-共有B〕", コメント: "更新前コメント",
});
const 受注の前提 = { needs: ["S-A06-04-REFERENCES", "S-A06-04-OTHER-ADM"] };
defineSeed("S-A06-04-BASE-001", 受注の前提, 受注のシード("001"));
defineSeed("S-A06-04-BASE-002", 受注の前提, 受注のシード("002"));
defineSeed("S-A06-04-BASE-003", 受注の前提, 受注のシード("003"));
defineSeed("S-A06-04-BASE-007", 受注の前提, 受注のシード("007"));
defineSeed("S-A06-04-BASE-008", 受注の前提, 受注のシード("008"));
defineSeed("S-A06-04-BASE-018", 受注の前提, 受注のシード("018"));

defineSeed("S-A06-04-AB-ORDER-019", { needs: ["S-A06-04-AB-STORE", "S-A06-04-AB-ADM"] }, (ctx) => 申込んでコメントを入れる(ctx, {
  姓: "A0604", 名: "査定001", セイ: "ゼンテイ", メイ: "ジュチュウ", 査定の呼び名: "〔査定ID-A0604AB-001〕", 受注の呼び名: "〔受注ID-A0604AB-001〕",
  担当: A0604_AB_ADM, 担当の呼び名: "〔管理者ID-A0604AB-共有〕", コメント: "更新前コメント001",
}));

const 無い受注のシード = (受注ID: string): SeedBuilder => async ({ seed }) => {
  if (店頭買取の受注がある(受注ID)) throw new Error(`${seed.シードID}: 受注ID ${受注ID} の店頭買取の受注がある（0件の前提を満たせない。消さない）`);
};
defineSeed("S-A06-04-NOORDER-010", 無い受注のシード("699999010"));
defineSeed("S-A06-04-NOORDER-011", 無い受注のシード("699999011"));
defineSeed("S-A06-04-NOORDER-012", 無い受注のシード("699999012"));
