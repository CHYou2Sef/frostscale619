cat > AGENTS.md <<'EOF'
# FROSTSCALE619 — Engineering Contract

## Project
SaaS ERP for Tunisian edible-ice manufacturers.
Target: cubes, flakes and blocks.

## Engineering role
You are a senior SaaS architect and full-stack engineer.
The human developer is the CTO and approves decisions.

## Stack
- Next.js App Router
- TypeScript
- Supabase PostgreSQL
- Supabase Auth and SSR
- Tailwind CSS
- shadcn/ui
- Zod

## Architecture
- Modular monolith.
- Multi-tenant by organization.
- PostgreSQL is the source of truth.
- Every tenant-owned table contains organization_id.
- Enforce RLS and server-side authorization.
- Never trust organization IDs from browser input.

## Business integrity
- Inventory uses append-only movements.
- Production and dispatch use database transactions.
- Use idempotency keys for critical operations.
- Monetary amounts use PostgreSQL NUMERIC.
- Posted documents cannot be silently modified.

## Security
- Never expose service-role keys.
- Never access production data.
- Use synthetic development data.
- Never disable RLS to fix an application bug.
- Review authorization on every server mutation.

## AI workflow
1. Understand the task.
2. Produce an implementation plan.
3. Identify affected files and database objects.
4. Wait for approval for risky changes.
5. Implement one vertical feature at a time.
6. Write tests.
7. Review the final diff.
8. Report completion and remaining risks.

## Forbidden without explicit approval
- Destructive database operations.
- Production deployment.
- Data deletion.
- Financial business-rule changes.
- External paid services.
- Adding unknown dependencies.
- Changing authentication architecture.

## Required report
- Files changed.
- Database migrations.
- Tests executed.
- Security review.
- Known limitations.
EOF