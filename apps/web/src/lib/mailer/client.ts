import "server-only";

import { createMailer } from "./mailer-factory";
import type { Mailer } from "./types";

// Built lazily: the Resend SDK throws at construction when the API key is
// missing, which would fail `next build` (page-data collection imports this
// module) and crash a self-hosted instance that hasn't configured email yet.
// Deferring to first use turns that into a send-time error instead.
let instance: Mailer | undefined;

export const mailer: Mailer = new Proxy({} as Mailer, {
  get(_target, prop) {
    instance ??= createMailer();
    return Reflect.get(instance, prop);
  },
});

// Re-export types for convenience
export type {
  AddContactToSegmentOptions,
  Contact,
  CreateContactOptions,
  EmailAttachment,
  EmailResponse,
  Mailer,
  MailOptions,
  UpdateContactOptions,
} from "./types";

export { EmailError } from "./types";
