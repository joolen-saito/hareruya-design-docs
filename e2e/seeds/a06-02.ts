/**
 * A06-02 未完了店頭買取一覧取得（MTGBuyer の API）のシード。正本: cases/A06-02_seed_data.tsv。記録 review/A06-02_progress_2026-11-20_dev.md。
 * 書いたのは 014・015 が使う S-A06-02-AUTH-ENV だけ。
 * - S-A06-02-AUTH-ENV（署名方式・署名の鍵とAPIの再起動）: シード表は≪共有の設定≫で「共有の開発環境では行わず手元の環境で行う」とする。
 *   共有の開発環境では API の認証の秘密の値を書き換えず、再起動もせず、環境に設定済みの値を使う（A06-04・A06-13 と同じ）。
 *   この端末から API サーバーへ要求が届くことは、ケースの要求そのもので見る（IP 許可リストには触れない）。
 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";

defineSeed("S-A06-02-AUTH-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有の開発環境では、API の認証の署名方式・秘密の値を書き換えず、API の再起動もせず、環境に設定済みの値を使う" +
    "（シード表の≪共有の設定≫。IP 許可リストにも触れない）");
});
