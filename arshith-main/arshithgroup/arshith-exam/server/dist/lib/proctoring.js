import { z } from 'zod';
/** Proctoring rules stored on each assessment (camera-free, strict browser based monitoring). */
export const proctoringSchema = z.object({
    tabSwitchMonitoring: z.boolean().default(true),
    maxWarnings: z.number().int().min(1).max(50).default(3),
    autoSubmitOnLimit: z.boolean().default(true),
    requireFullscreen: z.boolean().default(true),
    blockClipboard: z.boolean().default(true),
    detectDevTools: z.boolean().default(true),
    idleTimeoutSec: z.number().int().min(0).max(3600).default(180),
    blockMultiMonitor: z.boolean().default(true),
});
export const defaultProctoring = () => proctoringSchema.parse({});
/** Event catalogue. Events tied to an enabled rule consume one warning. */
export const EVENT_RULES = {
    TAB_HIDDEN: { severity: 'HIGH', rule: 'tabSwitchMonitoring', weight: 10 },
    WINDOW_BLUR: { severity: 'MEDIUM', rule: 'tabSwitchMonitoring', weight: 6 },
    FULLSCREEN_EXIT: { severity: 'HIGH', rule: 'requireFullscreen', weight: 10 },
    COPY_ATTEMPT: { severity: 'MEDIUM', rule: 'blockClipboard', weight: 4 },
    PASTE_ATTEMPT: { severity: 'MEDIUM', rule: 'blockClipboard', weight: 4 },
    CUT_ATTEMPT: { severity: 'MEDIUM', rule: 'blockClipboard', weight: 4 },
    CONTEXT_MENU: { severity: 'LOW', weight: 2 },
    PRINT_ATTEMPT: { severity: 'HIGH', rule: 'blockClipboard', weight: 8 },
    SCREENSHOT_KEY: { severity: 'HIGH', rule: 'blockClipboard', weight: 8 },
    DEVTOOLS_OPEN: { severity: 'HIGH', rule: 'detectDevTools', weight: 10 },
    DEVTOOLS_SHORTCUT: { severity: 'MEDIUM', rule: 'detectDevTools', weight: 5 },
    MULTI_MONITOR: { severity: 'HIGH', rule: 'blockMultiMonitor', weight: 8 },
    IDLE_TIMEOUT: { severity: 'MEDIUM', weight: 4 },
    WINDOW_RESIZE: { severity: 'LOW', weight: 2 },
    NAVIGATION_ATTEMPT: { severity: 'LOW', weight: 2 },
    FULLSCREEN_ENTER: { severity: 'INFO', weight: 0 },
    TAB_VISIBLE: { severity: 'INFO', weight: 0 },
    WINDOW_FOCUS: { severity: 'INFO', weight: 0 },
};
export const eventCounts = (type, cfg) => {
    const r = EVENT_RULES[type];
    if (!r || !r.rule)
        return false;
    return cfg[r.rule] === true && r.severity !== 'INFO';
};
export const riskWeight = (type) => EVENT_RULES[type]?.weight ?? 3;
