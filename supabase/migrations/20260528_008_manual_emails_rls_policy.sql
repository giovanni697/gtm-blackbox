-- Adiciona policy explícita na tabela manual_emails.
-- A tabela tem RLS habilitado mas nenhuma policy definida — o comportamento
-- padrão do Supabase (negar tudo para authenticated + anon) está correto,
-- mas policy explícita é mais defensiva e auto-documentada.

-- Nega acesso de leitura para qualquer role não-service (redundante mas explícito)
CREATE POLICY "no_client_access"
  ON manual_emails
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- Nota: service_role bypassa RLS por design — as páginas admin que usam
-- createServiceClient() continuam funcionando normalmente.
