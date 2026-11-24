/** Derived lifecycle phase, always computed from server time. */
export function phaseOf(s, now = new Date()) {
    if (s.status === 'DRAFT')
        return 'DRAFT';
    if (s.status === 'CANCELLED')
        return 'CANCELLED';
    if (s.status === 'CLOSED')
        return 'ENDED';
    if (now >= s.endAt)
        return 'ENDED';
    if (s.status === 'PAUSED')
        return now < s.startAt ? 'UPCOMING' : 'PAUSED';
    if (now < s.startAt)
        return 'UPCOMING';
    return 'ACTIVE';
}
export const addMinutes = (d, m) => new Date(d.getTime() + m * 60000);
