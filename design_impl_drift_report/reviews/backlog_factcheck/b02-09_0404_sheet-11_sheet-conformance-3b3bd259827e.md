# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b02-09_0404_sheet-11_sheet.json#b02-09_0404_sheet-11_sheet-conformance-3b3bd259827e`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b02-09_0404_sheet-11_sheet.json`
- sourceFindingId: `b02-09_0404_sheet-11_sheet-conformance-3b3bd259827e`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b02-09_0404_sheet-11_sheet` / B02-09 ユニサーチフィード送信
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: SCPでフィードファイルとdoneファイルをユニサーチのサーバに送信する。入力データ詳細および実行結果詳細では、ユニサーチフィード作成処理で作成したTSVファイル、doneファイルをSCPで送信するとされている。
- implementationActual: 実装はTSVをgzip圧縮した .tsv.gz を作成し、phpseclib3\Net\SFTP の put() で gzipファイルとdoneファイルをSFTPアップロードしている。SCPコマンド実行は存在しない。
- mismatchReason: 設計はSCPでTSVファイルとdoneファイルを送信する外部契約だが、実装はSFTPライブラリで .tsv.gz とdoneファイルを送信している。反証検索として SCP/scp/feed_upload/SFTP/sftp/ssh_key/tsv.gz/gzipPath/upload を src/Eccube と html 配下で確認し、SCPコマンド実装は見つからず、SFTP実装のみ確認した。
- designRefDetail: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-11:1837,1844,1848
- implRef: src/Eccube/Service/UniSearch/UniSearchExportService.php:87,100,103 / src/Eccube/Service/UniSearch/UniSearchSftpService.php:23,48,66

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b02-09_0404_sheet-11_sheet-conformance-3b3bd259827e",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-11:1837,1844,1848",
  "designRefDetail": null,
  "designExpectation": "SCPでフィードファイルとdoneファイルをユニサーチのサーバに送信する。入力データ詳細および実行結果詳細では、ユニサーチフィード作成処理で作成したTSVファイル、doneファイルをSCPで送信するとされている。",
  "designQuote": "SCPでフィードファイルとdoneファイルをユニサーチのサーバに送信する。入力データ詳細および実行結果詳細では、ユニサーチフィード作成処理で作成したTSVファイル、doneファイルをSCPで送信するとされている。",
  "implRef": "src/Eccube/Service/UniSearch/UniSearchExportService.php:87,100,103 / src/Eccube/Service/UniSearch/UniSearchSftpService.php:23,48,66",
  "implementationActual": "実装はTSVをgzip圧縮した .tsv.gz を作成し、phpseclib3\\Net\\SFTP の put() で gzipファイルとdoneファイルをSFTPアップロードしている。SCPコマンド実行は存在しない。",
  "difference": "設計はSCPでTSVファイルとdoneファイルを送信する外部契約だが、実装はSFTPライブラリで .tsv.gz とdoneファイルを送信している。反証検索として SCP/scp/feed_upload/SFTP/sftp/ssh_key/tsv.gz/gzipPath/upload を src/Eccube と html 配下で確認し、SCPコマンド実装は見つからず、SFTP実装のみ確認した。",
  "mismatchReason": "設計はSCPでTSVファイルとdoneファイルを送信する外部契約だが、実装はSFTPライブラリで .tsv.gz とdoneファイルを送信している。反証検索として SCP/scp/feed_upload/SFTP/sftp/ssh_key/tsv.gz/gzipPath/upload を src/Eccube と html 配下で確認し、SCPコマンド実装は見つからず、SFTP実装のみ確認した。",
  "comparisonRows": [
    {
      "item": "転送方式",
      "design": "SCPでフィードファイルとdoneファイルをユニサーチサーバへ送信する。",
      "implementation": "UniSearchSftpService が phpseclib3\\Net\\SFTP を使い、SFTP::put() でアップロードする。",
      "mismatch": "SCP指定に対してSFTP実装になっている。"
    },
    {
      "item": "送信するフィードファイル",
      "design": "ユニサーチフィード作成処理で作成したTSVファイル、doneファイルを送信する。",
      "implementation": "UniSearchExportService は $gzipPath = compressFile($tsvPath, gzip) を作成し、$gzipPath と $donePath をアップロードする。",
      "mismatch": "TSVそのものではなく .tsv.gz を送信している。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b02-09_0404_sheet-11_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Service/UniSearch/UniSearchExportService.php:87,100,103 / src/Eccube/Service/UniSearch/UniSearchSftpService.php:23,48,66",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「SCPでフィードファイルとdoneファイルをユニサーチのサーバに送信する。入力データ詳細および実行結果詳細では、ユニサーチフィード作成処理で作成したTSVファイル、doneファイルをSCPで送信するとされている。」。実装は「実装はTSVをgzip圧縮した .tsv.gz を作成し、phpseclib3\\Net\\SFTP の put() で gzipファイルとdoneファイルをSFTPアップロードしている。SCPコマンド実行は存在しない。」。乖離理由は「設計はSCPでTSVファイルとdoneファイルを送信する外部契約だが、実装はSFTPライブラリで .tsv.gz とdoneファイルを送信している。反証検索として SCP/scp/feed_upload/SFTP/sftp/ssh_key/tsv.gz/gzipPath/upload を src/Eccube と html 配下で確認し、SCPコマンド実装は見つからず、SFTP実装のみ確認した。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Form・入力項目"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "src/Eccube/Service/UniSearch/UniSearchExportService.php:87,100,103",
    "src/Eccube/Service/UniSearch/UniSearchSftpService.php:23,48,66",
    "src/Eccube/Service/UniSearch/UniSearchExportService.php",
    "src/Eccube/Service/UniSearch/UniSearchSftpService.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Service/UniSearch/UniSearchExportService.php:87\n84:                 log_info('出力対象が0件のため空ファイルを作成しました。', ['path' => $tsvPath]);\n85:             }\n86: \n87:             $gzipPath = $this->compressFile($tsvPath, self::COMPRESS_GZIP);\n88: \n89:             $md5 = md5_file($gzipPath);\n90:             $this->filesystem->dumpFile($donePath, $md5);",
    "src/Eccube/Service/UniSearch/UniSearchSftpService.php:23\n20: use Eccube\\Repository\\Master\\MtbOptionRepository;\n21: use phpseclib3\\Crypt\\Common\\PrivateKey;\n22: use phpseclib3\\Crypt\\PublicKeyLoader;\n23: use phpseclib3\\Net\\SFTP;\n24: \n25: /**\n26:  * ユニサーチSFTP接続サービス",
    "src/Eccube/Service/UniSearch/UniSearchExportService.php:28\n25: /**\n26:  * ユニサーチ商品フィード連携バッチ用のサービス\n27:  */\n28: class UniSearchExportService\n29: {\n30:     private const COMPRESS_GZIP = 'gzip';\n31:     private const BACKUP_KEEP_COUNT = 5;"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
