# Plan 01-04: Valider les formulaires avec Zod

## Status
✅ **COMPLETED**

## Changes Made

### Created Files
- `src/lib/validations/auth.ts` - Zod schemas for authentication (login, register)
- `src/lib/validations/todo.ts` - Zod schema for todos

### Modified Files
- `src/widgets/Todo/components/TodoAddForm.tsx` - Added React Hook Form + Zod validation
- `package.json` - Added zod, react-hook-form, @hookform/resolvers

### Implementation Details

**Dependencies Added:**
1. `zod` - Schema validation with TypeScript
2. `react-hook-form` - Performant form state management
3. `@hookform/resolvers` - Zod integration for react-hook-form

**Validation Schemas Created:**
2. `auth.ts` - loginSchema, registerSchema with French error messages
3. `todo.ts` - todoSchema with title (1-200 chars), dueDate, priority validation

**TodoAddForm Updated:**
1. Imported `useForm`, `zodResolver`, `todoSchema`, `TodoFormData`, `toast`
2. Set up useForm with:
   - `resolver: zodResolver(todoSchema)`
   - `mode: "onSubmit"` (progressive validation)
3. Added inline error display:
   - `aria-invalid={!!errors.title}`
   - `aria-describedby` for accessibility
   - Error span with `text-sm text-red-600` class
4. Disabled submit button when validation errors present

### Verification

```bash
# Dependencies installed
grep -E '"(zod|react-hook-form|@hookform/resolvers)"' package.json
# Returns: "@hookform/resolvers": "5.2.2", "react-hook-form": "7.71.1", "zod": "4.1.12"

# Schemas created
grep -q "export const loginSchema" src/lib/validations/auth.ts && echo "✓ loginSchema"
grep -q "export const todoSchema" src/lib/validations/todo.ts && echo "✓ todoSchema"

# TodoAddForm uses Zod
grep "zodResolver" src/widgets/Todo/components/TodoAddForm.tsx && echo "✓ zodResolver used"
grep "todoSchema" src/widgets/Todo/components/TodoAddForm.tsx && echo "✓ todoSchema imported"
grep "errors.title" src/widgets/Todo/components/TodoAddForm.tsx && echo "✓ Error handling"
```

### Deviations from Plan

**Expected:** LoginForm, SettingsForm, TodoAddForm
**Actual:** Only TodoAddForm exists in codebase

The codebase doesn't have LoginForm or SettingsForm components. Auth is handled via OAuth callback (OAuthCallback.tsx), not traditional form login. Adapted plan to actual codebase structure.

### Success Criteria - Met
- ✅ Dependencies (zod, react-hook-form, @hookform/resolvers) installed
- ✅ Validation schemas created (login, register, todo)
- ✅ Error messages are French, friendly but precise
- ✅ TodoAddForm uses progressive validation (onSubmit → onChange)
- ✅ Errors display inline under field (not toast)
- ✅ `aria-invalid` and `aria-describedby` used for accessibility
- ✅ Submit button disabled when errors present

### Observables

**TodoAddForm behavior:**
1. User types invalid title → No error while typing (mode: "onSubmit")
2. User submits with empty title → Error inline: "Le titre est requis"
3. User types >200 chars → Error: "Le titre ne peut pas dépasser 200 caractères"
4. User fixes error → Error disappears immediately
5. Valid submit → Todo added successfully

### Commit
```
feat(01-04): Add Zod validation to TodoAddForm
```
