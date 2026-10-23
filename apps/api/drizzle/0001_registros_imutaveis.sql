-- Regras de imutabilidade garantidas pelo próprio banco, independentemente da aplicação.
-- (Um superusuário do Postgres ainda pode desativar triggers; isso fica sob controle do TI.)

-- Auditoria e observações: só inclusão.
CREATE FUNCTION impedir_alteracao() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Registros de % não podem ser alterados nem excluídos', TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER auditoria_imutavel
  BEFORE UPDATE OR DELETE ON auditoria
  FOR EACH ROW EXECUTE FUNCTION impedir_alteracao();
--> statement-breakpoint
CREATE TRIGGER auditoria_sem_truncate
  BEFORE TRUNCATE ON auditoria
  FOR EACH STATEMENT EXECUTE FUNCTION impedir_alteracao();
--> statement-breakpoint
CREATE TRIGGER observacoes_imutaveis
  BEFORE UPDATE OR DELETE ON observacoes
  FOR EACH ROW EXECUTE FUNCTION impedir_alteracao();
--> statement-breakpoint
CREATE TRIGGER observacoes_sem_truncate
  BEFORE TRUNCATE ON observacoes
  FOR EACH STATEMENT EXECUTE FUNCTION impedir_alteracao();
--> statement-breakpoint

-- Documentos: nunca são apagados fisicamente. A única alteração permitida é a exclusão
-- lógica (preencher excluido_em, excluido_por_id e motivo_exclusao), uma única vez.
CREATE FUNCTION documentos_validar_alteracao() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Documentos não podem ser apagados; use a exclusão lógica com motivo'
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF OLD.excluido_em IS NOT NULL THEN
    RAISE EXCEPTION 'O documento % já foi excluído e não pode mais ser alterado', OLD.id
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF (NEW.nota_fiscal_id, NEW.tipo_documento_id, NEW.referencia, NEW.nome_arquivo,
      NEW.mime_type, NEW.tamanho_bytes, NEW.sha256, NEW.chave_armazenamento, NEW.origem,
      NEW.enviado_por_id, NEW.enviado_em)
     IS DISTINCT FROM
     (OLD.nota_fiscal_id, OLD.tipo_documento_id, OLD.referencia, OLD.nome_arquivo,
      OLD.mime_type, OLD.tamanho_bytes, OLD.sha256, OLD.chave_armazenamento, OLD.origem,
      OLD.enviado_por_id, OLD.enviado_em) THEN
    RAISE EXCEPTION 'Somente a exclusão lógica pode alterar um documento'
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER documentos_somente_exclusao_logica
  BEFORE UPDATE OR DELETE ON documentos
  FOR EACH ROW EXECUTE FUNCTION documentos_validar_alteracao();
--> statement-breakpoint
CREATE TRIGGER documentos_sem_truncate
  BEFORE TRUNCATE ON documentos
  FOR EACH STATEMENT EXECUTE FUNCTION impedir_alteracao();
