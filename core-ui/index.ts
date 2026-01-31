/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Core UI
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.3: Core UI Component Library (Core Hub)
 * 
 * Central export for all Core UI components.
 * Every component uses Core System tokens (PHASE 7.1).
 * 
 * USAGE:
 * import { CoreButton, CoreInput, CoreCard, CoreDropdown, CoreHub } from '@/core-ui';
 * 
 * @version 3.0.0
 * @date 2026-01-29
 */

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────
export { Slot, Slottable, type SlotProps } from './primitives/Slot';

// ─────────────────────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreButton,
    type CoreButtonProps,
    type CoreButtonVariant,
    type CoreButtonSize,
    type CoreButtonShape,
} from './button/CoreButton';

// ─────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────
export { CoreInput, type CoreInputProps } from './input/CoreInput';

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreCard,
    CoreCardHeader,
    CoreCardBody,
    CoreCardFooter,
    type CoreCardProps,
    type CoreCardVariant,
    type CoreCardPadding,
} from './card/CoreCard';

// ─────────────────────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreBadge,
    type CoreBadgeProps,
    type CoreBadgeVariant,
    type CoreBadgeSize,
    type CoreBadgeType,
} from './badge/CoreBadge';

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreDropdown,
    CoreDropdownTrigger,
    CoreDropdownContent,
    CoreDropdownItem,
    CoreDropdownDivider,
    CoreDropdownLabel,
    type CoreDropdownProps,
    type CoreDropdownTriggerProps,
    type CoreDropdownContentProps,
    type CoreDropdownItemProps,
    type CoreDropdownDividerProps,
    type CoreDropdownLabelProps,
} from './dropdown/CoreDropdown';

// ─────────────────────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreTable,
    CoreTableHead,
    CoreTableBody,
    CoreTableRow,
    CoreTableHeader,
    CoreTableCell,
    CoreTableLoading,
    type CoreTableProps,
    type CoreTableHeadProps,
    type CoreTableBodyProps,
    type CoreTableRowProps,
    type CoreTableHeaderProps,
    type CoreTableCellProps,
    type CoreTableLoadingProps,
} from './table/CoreTable';

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreEmptyState,
    type CoreEmptyStateProps,
    type CoreEmptyStateSize,
} from './empty-state/CoreEmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Divider / Section Header
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreDivider,
    CoreSectionHeader,
    type CoreDividerProps,
    type CoreDividerOrientation,
    type CoreDividerSpacing,
    type CoreSectionHeaderProps,
    type CoreSectionHeaderSize,
} from './divider/CoreDivider';

// ─────────────────────────────────────────────────────────────────────────────
// Icon
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreIcon,
    CoreIconCircle,
    type CoreIconProps,
    type CoreIconSize,
    type CoreIconColor,
    type CoreIconCircleProps,
    type CoreIconCircleVariant,
} from './icon/CoreIcon';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7.3: App Icon (Core Hub)
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreAppIcon,
    type CoreAppIconProps,
    type CoreAppIconSize,
} from './app-icon/CoreAppIcon';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7.3: App Grid (Core Hub)
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreAppGrid,
    type CoreAppGridProps,
} from './app-grid/CoreAppGrid';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7.3: Core Hub (Launcher)
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreHub,
    type CoreHubProps,
} from './hub/CoreHub';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7.3: Core Actions (ActionBar, ActionButton)
// ─────────────────────────────────────────────────────────────────────────────
export {
    CoreActionButton,
    CoreActionBar,
    CoreActionBarDivider,
    type CoreActionButtonProps,
    type CoreActionButtonVariant,
    type CoreActionButtonSize,
    type CoreActionBarProps,
    type CoreActionBarDividerProps,
} from './actions';
