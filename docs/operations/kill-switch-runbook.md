# Kill Switch Runbook — BRAIN_AGENT_KILL

> **Default:** `true` (execution DISABLED)  
> **Variable:** `BRAIN_AGENT_KILL`  
> **Scope:** All Environments

---

## Policy

| Environment | Default Value | Can Change? |
|-------------|--------------|-------------|
| **Production** | `true` | ⚠️ Only with explicit approval |
| **Preview** | `true` | ✅ For testing only, restore after |
| **Development** | `true` | ✅ For local dev |

> **CRITICAL:** Production must ALWAYS have `BRAIN_AGENT_KILL=true` unless explicitly approved for a Phase 21+ execution window.

---

## How to Temporarily Disable (Preview Only)

### Step 1: Set to `false` on Preview

1. Go to **Vercel → Project → Settings → Environment Variables**
2. Click the ••• menu on `BRAIN_AGENT_KILL` → **Edit**
3. Change value to `false`
4. Change environment to **Preview only**
5. Click **Save**
6. **Redeploy** the target preview branch

### Step 2: Test

- Hit your `/api/brain/execute` endpoint on the Preview URL
- Verify execution works as expected

### Step 3: Restore to `true`

1. Go to **Vercel → Project → Settings → Environment Variables**
2. **Delete** the `BRAIN_AGENT_KILL` variable
3. **Re-create** it:
   - Name: `BRAIN_AGENT_KILL`
   - Value: `true`
   - Environment: **All Environments**
4. Click **Save**

> ⚠️ **Why delete and recreate?** Editing in-place on Vercel can sometimes concatenate values (e.g., `"truefalse"`). Deleting and recreating ensures a clean value.

---

## Troubleshooting

### Value is corrupted (e.g., `"truefalse"`)

This happens when the Vercel UI appends instead of replacing.

**Fix:**
1. Delete the variable entirely
2. Recreate with the correct single value: `true`
3. Verify by clicking Edit and reading the textarea value

### Kill switch not taking effect after change

Environment variable changes require a **new deployment**. Either:
- Push a new commit, or
- Click **Redeploy** on the target deployment in Vercel

### Checking current state via API

```
GET /api/brain/verify-ui?action=status
```

Response includes `"killSwitchActive": true/false`

> **Note:** This endpoint was removed in production (Phase 20 closeout). Use the Brain API status endpoint instead, or check `GET /api/brain` for status.

---

## Emergency: Disable ALL Execution

If suspicious activity is detected:

1. Set `BRAIN_AGENT_KILL=true` on **All Environments**
2. Redeploy Production immediately
3. Check audit logs for unauthorized executions
4. Report to security team
