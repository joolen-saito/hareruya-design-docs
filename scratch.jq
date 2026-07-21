.requirementConformanceAudit.materialGapRows[] |
"### \(.requirementId) [lvl:\(.elementLevel) cat:\(.category)] verdict=\(.verdict) bucket=\(.conformanceBucket)",
"REQ: \(.designRequirement)",
"NOTE: \(.auditNote)",
"CANDS: \((.candidateRefs // []) | map(if type=="object" then (.ref // .term // (.|tostring)) else . end) | join("  ||  "))",
""
