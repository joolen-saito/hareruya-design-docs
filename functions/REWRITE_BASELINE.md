# 書き直しの比較元リビジョン

`check_rewrite_completeness.py` は「書き直し前」と比べて本文が捨てられていないかを見る。
2026-08-21 の再生成成果をコミットすると HEAD が書き直し**後**になり、
既定の `--rev HEAD` では欠落を検出できなくなる。書き直し前の状態は下のリビジョンにある。

| 用途 | リビジョン |
| --- | --- |
| 0203型への書き直し前（2026-08-21 のコミット直前） | `6cf10173b45b26be3d94cc16f0d86c4e528161cc` |

使い方:

```bash
python3 .cursor/skills/function-spec-html-render/scripts/check_rewrite_completeness.py \
  --all --rev 6cf10173b45b26be3d94cc16f0d86c4e528161cc
```

新しい書き直しを始めるときは、その直前のリビジョンをこの表へ追記する。
