"""
QuantMesh SQL Optimizer Agent
Analyzes SQL queries and suggests optimizations using rule-based pattern matching.
"""

import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="QuantMesh SQL Optimizer Agent")


class SQLInput(BaseModel):
    query: str
    dialect: str = "postgresql"


OPTIMIZATION_RULES = [
    {
        "id": "SELECT_STAR",
        "pattern": r"\bSELECT\s+\*\b",
        "severity": "MEDIUM",
        "title": "Avoid SELECT *",
        "suggestion": "Specify only the columns you need. SELECT * fetches unnecessary data, increases I/O, and prevents covering index usage.",
        "fix_hint": "Replace SELECT * with explicit column names.",
    },
    {
        "id": "NO_WHERE_CLAUSE",
        "pattern": r"\bFROM\s+\w+\s*(?:;|$)",
        "severity": "HIGH",
        "title": "Missing WHERE clause",
        "suggestion": "Query scans the entire table. Add a WHERE clause to filter rows and enable index usage.",
        "fix_hint": "Add WHERE conditions to filter results.",
    },
    {
        "id": "LIKE_LEADING_WILDCARD",
        "pattern": r"\bLIKE\s+'%",
        "severity": "HIGH",
        "title": "Leading wildcard in LIKE",
        "suggestion": "LIKE '%value' cannot use indexes and forces a full table scan. Consider using full-text search or reversing the pattern.",
        "fix_hint": "Use full-text search (tsvector/tsquery in PostgreSQL) or application-level filtering.",
    },
    {
        "id": "NESTED_SUBQUERY",
        "pattern": r"\bWHERE\b.*\bIN\s*\(\s*SELECT\b",
        "severity": "MEDIUM",
        "title": "Subquery in WHERE IN",
        "suggestion": "Correlated subqueries in WHERE IN can be slow. Consider rewriting as a JOIN.",
        "fix_hint": "Rewrite as: ... JOIN subquery_table ON ... instead of WHERE col IN (SELECT ...).",
    },
    {
        "id": "ORDER_BY_WITHOUT_LIMIT",
        "pattern": r"\bORDER\s+BY\b(?!.*\bLIMIT\b)",
        "severity": "LOW",
        "title": "ORDER BY without LIMIT",
        "suggestion": "Sorting the entire result set without LIMIT is expensive. If you only need top-N results, add LIMIT.",
        "fix_hint": "Add LIMIT N to reduce sort cost.",
    },
    {
        "id": "NOT_IN_NULL_TRAP",
        "pattern": r"\bNOT\s+IN\b",
        "severity": "MEDIUM",
        "title": "NOT IN may return unexpected results with NULLs",
        "suggestion": "NOT IN returns no rows if the subquery contains NULL values. Use NOT EXISTS instead.",
        "fix_hint": "Rewrite as: WHERE NOT EXISTS (SELECT 1 FROM ... WHERE ...).",
    },
    {
        "id": "FUNCTION_ON_INDEXED_COLUMN",
        "pattern": r"\bWHERE\s+\w+\s*\(\s*\w+\s*\)",
        "severity": "HIGH",
        "title": "Function applied to indexed column",
        "suggestion": "Wrapping a column in a function (e.g., UPPER(name), YEAR(date)) prevents index usage.",
        "fix_hint": "Create a functional index or rewrite the condition to avoid wrapping the column.",
    },
    {
        "id": "MULTIPLE_OR_CONDITIONS",
        "pattern": r"\bOR\b.*\bOR\b.*\bOR\b",
        "severity": "LOW",
        "title": "Multiple OR conditions",
        "suggestion": "Many OR conditions can prevent index usage. Consider using IN (...) or UNION ALL.",
        "fix_hint": "Rewrite as: WHERE col IN (val1, val2, val3, ...).",
    },
    {
        "id": "CROSS_JOIN",
        "pattern": r"\bCROSS\s+JOIN\b",
        "severity": "HIGH",
        "title": "CROSS JOIN detected",
        "suggestion": "CROSS JOIN produces a Cartesian product (rows × rows). This is almost always unintentional and extremely expensive.",
        "fix_hint": "Replace with INNER JOIN or LEFT JOIN with proper ON conditions.",
    },
    {
        "id": "DISTINCT_OVERUSE",
        "pattern": r"\bSELECT\s+DISTINCT\b",
        "severity": "LOW",
        "title": "DISTINCT may mask duplicates from bad JOINs",
        "suggestion": "DISTINCT adds a sort/hash step. If you need it, check if your JOINs are producing unintended row multiplication.",
        "fix_hint": "Review JOIN conditions for missing ON predicates.",
    },
]

INDEX_PATTERNS = [
    {
        "pattern": r"\bWHERE\s+(\w+)\s*=",
        "suggestion": "Consider a B-tree index on column '{col}' for equality lookups.",
    },
    {
        "pattern": r"\bORDER\s+BY\s+(\w+)",
        "suggestion": "Consider an index on column '{col}' to avoid filesort.",
    },
    {
        "pattern": r"\bGROUP\s+BY\s+(\w+)",
        "suggestion": "Consider an index on column '{col}' for GROUP BY optimization.",
    },
    {
        "pattern": r"\bJOIN\s+\w+\s+(?:\w+\s+)?ON\s+\w+\.(\w+)\s*=",
        "suggestion": "Consider an index on join column '{col}' for faster lookups.",
    },
]


def analyze_sql(query: str, dialect: str = "postgresql") -> dict:
    """Analyze SQL query and return optimization suggestions."""
    query_upper = query.upper().strip()
    issues = []
    
    for rule in OPTIMIZATION_RULES:
        if re.search(rule["pattern"], query_upper, re.IGNORECASE | re.DOTALL):
            issues.append({
                "id": rule["id"],
                "severity": rule["severity"],
                "title": rule["title"],
                "suggestion": rule["suggestion"],
                "fixHint": rule["fix_hint"],
            })
    
    index_suggestions = []
    for idx_rule in INDEX_PATTERNS:
        matches = re.findall(idx_rule["pattern"], query_upper, re.IGNORECASE)
        for col in matches:
            suggestion = idx_rule["suggestion"].format(col=col.lower())
            if suggestion not in [s["suggestion"] for s in index_suggestions]:
                index_suggestions.append({
                    "column": col.lower(),
                    "suggestion": suggestion,
                })
    
    severity_weights = {"HIGH": 20, "MEDIUM": 10, "LOW": 5}
    penalty = sum(severity_weights.get(i["severity"], 5) for i in issues)
    score = max(0, 100 - penalty)
    
    join_count = len(re.findall(r"\bJOIN\b", query_upper))
    subquery_count = len(re.findall(r"\bSELECT\b", query_upper)) - 1
    
    return {
        "optimizationScore": score,
        "issueCount": len(issues),
        "issues": issues,
        "indexSuggestions": index_suggestions,
        "complexity": {
            "joinCount": join_count,
            "subqueryCount": max(0, subquery_count),
            "estimatedComplexity": (
                "LOW" if join_count <= 1 and subquery_count <= 0
                else "MEDIUM" if join_count <= 3
                else "HIGH"
            ),
        },
        "dialect": dialect,
    }


@app.post("/agent/sql-optimize")
async def optimize_sql(payload: SQLInput):
    """Analyze SQL query and suggest optimizations."""
    if not payload.query or len(payload.query.strip()) < 10:
        raise HTTPException(status_code=400, detail="Query too short to analyze.")
    if len(payload.query) > 10000:
        raise HTTPException(status_code=400, detail="Query too long (max 10,000 chars).")
    
    result = analyze_sql(payload.query, payload.dialect)
    return result


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sql-optimizer"}
