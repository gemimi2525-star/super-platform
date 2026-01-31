"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — UI Components Index (Phase H + I)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Contract-faithful UI components:
 * - FinderMVP: Intent Origin Surface
 * - DockMVP: Calm Presence Surface
 * - UserPreferences: User-owned storage
 *
 * Phase I additions:
 * - createFinderIntent: Full intent with correlationId
 * - getDockClickActionLegacy: Capability-level focus
 *
 * @module coreos/ui
 * @version 2.0.0 (Phase H + I)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDockContract = exports.getDockClickActionLegacy = exports.getDockClickAction = exports.updateRunningCapabilities = exports.unpinFromDock = exports.pinToDock = exports.getDockItems = exports.createDockState = exports.validateFinderContract = exports.createFinderIntent = exports.createFinderOpenIntent = exports.isAlphabeticallySorted = exports.searchFinderCapabilities = exports.getFinderSearchableCapabilities = exports.getFinderVisibleCapabilities = exports.createFinderState = void 0;
// Finder MVP
var FinderMVP_1 = require("./FinderMVP");
Object.defineProperty(exports, "createFinderState", { enumerable: true, get: function () { return FinderMVP_1.createFinderState; } });
Object.defineProperty(exports, "getFinderVisibleCapabilities", { enumerable: true, get: function () { return FinderMVP_1.getFinderVisibleCapabilities; } });
Object.defineProperty(exports, "getFinderSearchableCapabilities", { enumerable: true, get: function () { return FinderMVP_1.getFinderSearchableCapabilities; } });
Object.defineProperty(exports, "searchFinderCapabilities", { enumerable: true, get: function () { return FinderMVP_1.searchFinderCapabilities; } });
Object.defineProperty(exports, "isAlphabeticallySorted", { enumerable: true, get: function () { return FinderMVP_1.isAlphabeticallySorted; } });
Object.defineProperty(exports, "createFinderOpenIntent", { enumerable: true, get: function () { return FinderMVP_1.createFinderOpenIntent; } });
Object.defineProperty(exports, "createFinderIntent", { enumerable: true, get: function () { return FinderMVP_1.createFinderIntent; } });
Object.defineProperty(exports, "validateFinderContract", { enumerable: true, get: function () { return FinderMVP_1.validateFinderContract; } });
// Dock MVP
var DockMVP_1 = require("./DockMVP");
Object.defineProperty(exports, "createDockState", { enumerable: true, get: function () { return DockMVP_1.createDockState; } });
Object.defineProperty(exports, "getDockItems", { enumerable: true, get: function () { return DockMVP_1.getDockItems; } });
Object.defineProperty(exports, "pinToDock", { enumerable: true, get: function () { return DockMVP_1.pinToDock; } });
Object.defineProperty(exports, "unpinFromDock", { enumerable: true, get: function () { return DockMVP_1.unpinFromDock; } });
Object.defineProperty(exports, "updateRunningCapabilities", { enumerable: true, get: function () { return DockMVP_1.updateRunningCapabilities; } });
Object.defineProperty(exports, "getDockClickAction", { enumerable: true, get: function () { return DockMVP_1.getDockClickAction; } });
Object.defineProperty(exports, "getDockClickActionLegacy", { enumerable: true, get: function () { return DockMVP_1.getDockClickActionLegacy; } });
Object.defineProperty(exports, "validateDockContract", { enumerable: true, get: function () { return DockMVP_1.validateDockContract; } });
// Note: UserPreferences is NOT included in synapse-core
// It depends on browser APIs and belongs in the product layer
//# sourceMappingURL=index.js.map