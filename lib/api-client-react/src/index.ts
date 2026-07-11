// Note: Run `pnpm --filter @workspace/api-spec run codegen` to generate API types
// Generated API types are currently commented out until codegen is run successfully
// export * from './generated/api';
// export * from './generated/api.schemas';
export { setBaseUrl, setAuthTokenGetter, customFetch } from './custom-fetch';
export type { AuthTokenGetter, CustomFetchOptions, ErrorType, BodyType } from './custom-fetch';
