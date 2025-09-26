## Summary
Brief description of what this PR accomplishes and why it's needed.

## Working Spec
- Risk Tier: X (description of why this tier)
- Motion Design Invariants: List key invariants maintained
- Acceptance IDs covered: A1, A2, A3

## Contracts
- API Contract: path/to/contract.yaml (v1.X → v1.Y)
- Consumer tests: ✅ X tests (description of coverage)
- Provider verification: ✅ (verification method)

## Tests
- Unit: X tests, branch cov X% (target X%) - description of coverage
- Mutation: X% (target X%) - description of mutation coverage
- Integration: X flows (method) - description of integration coverage
- E2E smoke: X (method) - description of e2e coverage
- Golden Frame: X reference renders validated (ΔE < X.X, SSIM > X.XX) across GPU types
- A11y: axe X critical; keyboard navigation tested; reduced motion support verified

## Non-functional
- Performance: Xms avg (budget Xms) - performance impact description
- Memory: XMB peak (budget XMB) - memory usage description
- Security: X SAST criticals; security review completed

## Observability
- New metrics: list of new metrics added
- OTel spans: list of new tracing spans
- Performance dashboards: monitoring setup description

## Migration & Rollback
- Database: migration description or "none required"
- Kill switch env: FEATURE_FLAG=false
- Rollback: rollback procedures

## Known Limits / Follow-ups
- Limitations of current implementation
- Future work planned for subsequent milestones
- Technical debt introduced (if any)

## Files Changed
- `src/path/file.ts` - description of changes
- `tests/path/file.test.ts` - description of test changes
- `apps/contracts/api.yaml` - description of contract changes
