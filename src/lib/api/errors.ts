import { ApiError } from './client';

/**
 * Length of the correlation id fragment shown to users. Long enough to be
 * unique in practice, short enough to read out over the phone.
 *
 * It is a prefix of the full id, so it still finds the request in Grafana:
 *   {container=~"masjid-.*"} |= "<ref>"
 */
const REF_LENGTH = 8;

/**
 * The correlation id of a failed request, if it has one.
 * Returns undefined for validation errors and anything not from the API.
 */
export function requestRef(err: unknown): string | undefined {
    return err instanceof ApiError ? err.requestId : undefined;
}

/**
 * Appends the request's correlation id to a user-facing error message, so a
 * user can quote it and the exact server-side trace can be pulled up.
 *
 *   withRequestRef('Failed to update campaign.', err)
 *   // → 'Failed to update campaign. (ref: 4f2a1c9d)'
 *
 * The message is passed in rather than derived, so each call site keeps
 * whatever wording it already had. Errors without an id — client-side
 * validation, network failures — are returned unchanged.
 */
export function withRequestRef(message: string, err: unknown): string {
    const ref = requestRef(err);
    return ref ? `${message} (ref: ${ref.slice(0, REF_LENGTH)})` : message;
}

/**
 * Pulls a displayable message out of an unknown thrown value, falling back when
 * there isn't one. Lets `catch` blocks stay typed as `unknown` — the default —
 * instead of widening to `any` just to reach `.message`.
 */
export function messageOf(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message) {
        return err.message;
    }
    // Non-Error throws still commonly carry a string message.
    if (typeof err === 'object' && err !== null && 'message' in err) {
        const { message } = err as { message?: unknown };
        if (typeof message === 'string' && message) {
            return message;
        }
    }
    return fallback;
}
