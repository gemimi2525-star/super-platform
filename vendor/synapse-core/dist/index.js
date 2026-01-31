"use strict";
/**
 * SYNAPSE Core - Governance Kernel
 *
 * This is the main entry point for the SYNAPSE governance kernel.
 *
 * FROZEN v1.0 - DO NOT MODIFY
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Types
__exportStar(require("./types/index.js"), exports);
// Kernel
__exportStar(require("./kernel/index.js"), exports);
__exportStar(require("./kernel/event-bus.js"), exports);
// Policy Engine
__exportStar(require("./policy-engine/index.js"), exports);
// Audit
__exportStar(require("./audit/index.js"), exports);
// Attestation
__exportStar(require("./attestation/index.js"), exports);
//# sourceMappingURL=index.js.map