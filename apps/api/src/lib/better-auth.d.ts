// Type stub for the runtime better-auth.ts module.
// TS picks this up during type-checking, which keeps Better Auth's enormous
// inferred types out of the compilation graph. The runtime file (.ts) is
// still what Node/tsx/Next.js actually execute.

import type { AuthFacade, SimpleSession } from './auth-types.js'

export declare const auth: AuthFacade

export declare function getSessionFromHeaders(headers: Headers): Promise<SimpleSession | null>

export type { AuthFacade, SimpleSession } from './auth-types.js'
