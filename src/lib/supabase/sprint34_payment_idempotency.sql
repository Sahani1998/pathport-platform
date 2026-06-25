-- Sprint 34: Payment idempotency keys
-- Prevents duplicate payment operations if a client retries a request.
-- Routes that mutate payment state store a hash of their idempotency key here.
-- A second attempt with the same key returns the cached response instantly.

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash      TEXT NOT NULL UNIQUE,          -- SHA-256 of (operation:entityId:callerUserId)
  operation     TEXT NOT NULL,                  -- e.g. 'payment-verify', 'invoice-issue'
  entity_id     UUID NOT NULL,                  -- payment_attempt.id or invoice.id
  caller_id     UUID NOT NULL,                  -- user who made the request
  response_body JSONB NOT NULL,                 -- cached response to return on replay
  http_status   SMALLINT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-expire after 24 h so the table stays small
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at
  ON public.idempotency_keys (created_at);

-- RLS: service-role only (all writes go through admin client)
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only"
  ON public.idempotency_keys
  USING (FALSE);

COMMENT ON TABLE public.idempotency_keys IS
  'Deduplication store for mutable payment API calls. '
  'A replay within 24 h returns the original response without re-executing.';
