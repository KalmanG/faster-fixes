import { cloudflare } from "@better-upload/server/clients";

type S3Client = ReturnType<typeof cloudflare>;

// Built lazily: the R2 client throws at construction when its env is missing,
// which would fail `next build` (page-data collection imports this module) and
// crash a self-hosted instance that runs without screenshot storage. Callers
// already treat upload failures as non-fatal.
let instance: S3Client | undefined;

export const s3Client: S3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    instance ??= cloudflare({
      accountId: process.env.R2_ACCOUNT_ID!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    });
    return Reflect.get(instance, prop);
  },
});
