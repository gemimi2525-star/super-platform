# Policy Authoring Language (PAL) — Specification v0.1

> *"Policy = Rule, ไม่ใช่ If-Else"*

**Status:** SPECIFICATION DRAFT — NOT IMPLEMENTED
**Authority:** SYNAPSE Canonical Pack v1.0
**Effective:** 2026-01-30
**Version:** 0.1 (Conceptual)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ⚠️ Scope Limitation

เอกสารนี้เป็น **SPECIFICATION ระดับแนวคิด** เท่านั้น

- ❌ ไม่ implement
- ❌ ไม่ parser
- ❌ ไม่ runtime
- ❌ ไม่ interpreter
- ✅ กำหนดแนวทางการเขียน Policy เชิง declarative

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 1: ปรัชญาของ Policy

### 1.1 Policy ไม่ใช่ Code

```
❌ WRONG (Imperative)
if (user.role === 'admin' && capability.id === 'user.manage') {
    return 'allow';
}

✅ CORRECT (Declarative)
ALLOW capability:user.manage WHEN role:admin
```

### 1.2 Policy คือ Rule

Policy ใน SYNAPSE:
- เป็น **statement of truth** ไม่ใช่ logic branch
- ถูก **evaluate** ไม่ใช่ execute
- มี **priority** และ **override** ชัดเจน
- deterministic 100%

### 1.3 Why Declarative?

| Imperative | Declarative |
|-----------|-------------|
| ซับซ้อน ยากแก้ไข | อ่านง่าย ชัดเจน |
| สามารถ hide logic | Intent ชัดเจนใน rule |
| ยากต่อการ audit | ง่ายต่อการตรวจสอบ |
| อาจ non-deterministic | Deterministic by design |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 2: PAL Concepts

### 2.1 Core Constructs

| Construct | Description |
|-----------|-------------|
| **ALLOW** | Permit the action |
| **DENY** | Block the action |
| **REQUIRE_STEPUP** | Require step-up authentication |
| **WHEN** | Condition clause |
| **UNLESS** | Negative condition |
| **PRIORITY** | Rule precedence |
| **SCOPE** | Where rule applies |

### 2.2 Evaluation Order (Resolution)

Policy Engine ใช้ลำดับนี้:
1. **DENY** ชนะ ALLOW (deny-first)
2. **Higher priority** ชนะ lower priority
3. **More specific scope** ชนะ general scope
4. ถ้าไม่มี rule = **DENY** (default deny)

### 2.3 Rule Components

```
[PRIORITY] [ACTION] [TARGET] [CONDITION] [OVERRIDE?]
```

ตัวอย่าง:
```
PRIORITY:100 DENY capability:* WHEN state:locked
PRIORITY:50 ALLOW capability:core.settings WHEN role:user
PRIORITY:10 REQUIRE_STEPUP capability:user.manage WHEN policy:sensitive_access
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 3: PAL Grammar (Conceptual)

### 3.1 BNF-like Definition

```bnf
<policy>      ::= <rule>+
<rule>        ::= [<priority>] <action> <target> [<condition>]
<priority>    ::= "PRIORITY:" <number>
<action>      ::= "ALLOW" | "DENY" | "REQUIRE_STEPUP"
<target>      ::= <target-type> ":" <target-value>
<target-type> ::= "capability" | "role" | "action"
<target-value>::= <identifier> | "*"
<condition>   ::= <when-clause> | <unless-clause> | <combined>
<when-clause> ::= "WHEN" <predicate>
<unless-clause>::= "UNLESS" <predicate>
<predicate>   ::= <key> ":" <value> | <predicate> "AND" <predicate>
<key>         ::= "role" | "state" | "policy" | "stepUp" | "time"
<value>       ::= <identifier> | <boolean> | <pattern>
```

### 3.2 Examples

#### Basic Allow
```policy
ALLOW capability:core.settings WHEN role:user
```
> ผู้ใช้ที่มี role:user สามารถเข้า core.settings ได้

#### Deny with Priority
```policy
PRIORITY:100 DENY capability:* WHEN state:locked
```
> เมื่อระบบ locked, block ทุก capability (priority สูงสุด)

#### Step-Up Requirement
```policy
REQUIRE_STEPUP capability:user.manage WHEN policy:sensitive_access
```
> user.manage ต้อง step-up ถ้า policy sensitive_access active

#### Combined Conditions
```policy
ALLOW capability:audit.view 
  WHEN role:admin AND policy:audit_enabled
  UNLESS state:locked
```
> admin ดู audit ได้ ถ้า audit_enabled และไม่ locked

#### Time-based (Conceptual)
```policy
DENY capability:system.configure 
  WHEN time:outside_business_hours 
  UNLESS role:emergency_admin
```
> ห้าม configure นอกเวลาทำการ ยกเว้น emergency_admin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 4: Priority and Scope

### 4.1 Priority Levels

| Range | Usage |
|-------|-------|
| 900-999 | System Critical (lock, emergency) |
| 700-899 | Security Policies |
| 500-699 | Business Rules |
| 300-499 | Role-based Access |
| 100-299 | Default Policies |
| 1-99 | User Preferences |

### 4.2 Scope Types

```policy
SCOPE:global    -- Apply everywhere
SCOPE:capability:user.*  -- Only user.* capabilities  
SCOPE:role:admin  -- Only for admin role
SCOPE:context:step-up  -- Only during step-up flow
```

### 4.3 Override Rules

```policy
-- Base rule (low priority)
PRIORITY:100 ALLOW capability:* WHEN role:user

-- Override for specific case (high priority)
PRIORITY:500 DENY capability:user.manage 
  WHEN role:user 
  UNLESS stepUp:active
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 5: Policy Decision Types

### 5.1 Decision Outcomes

| Decision | Meaning |
|----------|---------|
| `allow` | Action permitted |
| `deny` | Action blocked |
| `require_stepup` | Need additional authentication |
| `unknown` | No applicable rule (→ deny) |

### 5.2 Decision Object (Reference)

```typescript
type PolicyDecision = 
    | { type: 'allow' }
    | { type: 'deny'; reason: string }
    | { type: 'require_stepup'; challenge: string; capabilityId: CapabilityId };
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 6: Constraints

### 6.1 PAL Must Be Deterministic

```
RULE: Same input → Same output
```

PAL rules ต้อง:
- ไม่ depend on random
- ไม่ depend on current time (except for explicit time rules)
- ไม่ depend on external state
- ไม่ have side effects

### 6.2 PAL Cannot Generate Intent

```
❌ FORBIDDEN
WHEN condition THEN EMIT(intent)

✅ PAL only evaluates — never executes
```

### 6.3 PAL Cannot Bypass System

```
❌ FORBIDDEN
ALLOW bypass:policy_engine

✅ PAL is part of policy engine, not above it
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 7: Current Implementation Mapping

### 7.1 How Current Policy Engine Works

```typescript
// Current: Hardcoded resolution order
evaluate(context): PolicyDecision {
    // 1. locked → deny all
    // 2. step-up required → require_stepup
    // 3. explicit deny
    // 4. default deny unknown
    return { type: 'allow' };
}
```

### 7.2 Future PAL Integration (Conceptual)

```typescript
// Future: Rule-based evaluation
evaluate(context): PolicyDecision {
    const rules = loadPALRules();
    const sorted = sortByPriority(rules);
    for (const rule of sorted) {
        if (matches(rule, context)) {
            return rule.decision;
        }
    }
    return { type: 'deny', reason: 'no matching rule' };
}
```

> ⚠️ Implementation is DEFERRED — this is spec only

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

PAL เป็น "ภาษา" ไม่ใช่ "code"
PAL เป็น "กฎ" ไม่ใช่ "logic"

> **Policy ที่ดีอ่านเหมือนกฎหมาย**
> **Policy ที่แย่อ่านเหมือน code**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Policy Authoring Language (PAL) Specification v0.1*
*DRAFT — NOT IMPLEMENTED*
