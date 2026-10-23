CREATE TYPE "public"."origem_documento" AS ENUM('upload', 'scanner');--> statement-breakpoint
CREATE TYPE "public"."base_erp" AS ENUM('P', 'B');--> statement-breakpoint
CREATE TYPE "public"."perfil_usuario" AS ENUM('admin', 'scanner', 'viewer');--> statement-breakpoint
CREATE TABLE "auditoria" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auditoria_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"ocorrido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"usuario_id" uuid,
	"acao" text NOT NULL,
	"entidade" text NOT NULL,
	"entidade_id" text,
	"dados" jsonb,
	"ip" "inet",
	"request_id" text
);
--> statement-breakpoint
CREATE TABLE "documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nota_fiscal_id" uuid NOT NULL,
	"tipo_documento_id" uuid NOT NULL,
	"referencia" text NOT NULL,
	"nome_arquivo" text NOT NULL,
	"mime_type" text NOT NULL,
	"tamanho_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"chave_armazenamento" text NOT NULL,
	"origem" "origem_documento" NOT NULL,
	"enviado_por_id" uuid NOT NULL,
	"enviado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"excluido_em" timestamp with time zone,
	"excluido_por_id" uuid,
	"motivo_exclusao" text,
	CONSTRAINT "documentos_referencia_unica" UNIQUE("referencia"),
	CONSTRAINT "documentos_chave_armazenamento_unica" UNIQUE("chave_armazenamento"),
	CONSTRAINT "documentos_tamanho_positivo" CHECK ("documentos"."tamanho_bytes" > 0),
	CONSTRAINT "documentos_exclusao_completa" CHECK (("documentos"."excluido_em" is null and "documentos"."excluido_por_id" is null and "documentos"."motivo_exclusao" is null)
        or ("documentos"."excluido_em" is not null and "documentos"."excluido_por_id" is not null
            and length(trim(coalesce("documentos"."motivo_exclusao", ''))) > 0))
);
--> statement-breakpoint
CREATE TABLE "observacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nota_fiscal_id" uuid NOT NULL,
	"autor_id" uuid NOT NULL,
	"texto" text NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "observacoes_texto_valido" CHECK (length(trim("observacoes"."texto")) between 1 and 1000)
);
--> statement-breakpoint
CREATE TABLE "tipos_documento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tipos_documento_nome_unico" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base" "base_erp" NOT NULL,
	"codigo_empresa" text NOT NULL,
	"codigo_filial" text NOT NULL,
	"nome" text NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notas_fiscais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"referencia" text NOT NULL,
	"numero" text NOT NULL,
	"serie" text NOT NULL,
	"cliente_codigo" text NOT NULL,
	"cliente_loja" text NOT NULL,
	"cliente_nome" text NOT NULL,
	"cliente_documento" text NOT NULL,
	"data_emissao" date NOT NULL,
	"valor_total" numeric(15, 2) NOT NULL,
	"chave_acesso" text,
	"erp_recno" bigint,
	"cancelada_no_erp_em" timestamp with time zone,
	"sincronizada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notas_fiscais_referencia_unica" UNIQUE("referencia")
);
--> statement-breakpoint
CREATE TABLE "sessoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"ultimo_uso_em" timestamp with time zone DEFAULT now() NOT NULL,
	"revogada_em" timestamp with time zone,
	"ip" "inet",
	"user_agent" text,
	CONSTRAINT "sessoes_token_hash_unico" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"perfil" "perfil_usuario" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"deve_trocar_senha" boolean DEFAULT true NOT NULL,
	"tentativas_falhas" integer DEFAULT 0 NOT NULL,
	"bloqueado_ate" timestamp with time zone,
	"ultimo_acesso_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_nota_fiscal_id_notas_fiscais_id_fk" FOREIGN KEY ("nota_fiscal_id") REFERENCES "public"."notas_fiscais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_tipo_documento_id_tipos_documento_id_fk" FOREIGN KEY ("tipo_documento_id") REFERENCES "public"."tipos_documento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_enviado_por_id_usuarios_id_fk" FOREIGN KEY ("enviado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_excluido_por_id_usuarios_id_fk" FOREIGN KEY ("excluido_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observacoes" ADD CONSTRAINT "observacoes_nota_fiscal_id_notas_fiscais_id_fk" FOREIGN KEY ("nota_fiscal_id") REFERENCES "public"."notas_fiscais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observacoes" ADD CONSTRAINT "observacoes_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auditoria_entidade" ON "auditoria" USING btree ("entidade","entidade_id");--> statement-breakpoint
CREATE INDEX "auditoria_ocorrido_em" ON "auditoria" USING btree ("ocorrido_em");--> statement-breakpoint
CREATE INDEX "auditoria_usuario" ON "auditoria" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "documentos_ativos_por_nota" ON "documentos" USING btree ("nota_fiscal_id") WHERE "documentos"."excluido_em" is null;--> statement-breakpoint
CREATE INDEX "observacoes_por_nota" ON "observacoes" USING btree ("nota_fiscal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "empresas_codigo_erp" ON "empresas" USING btree ("base","codigo_empresa","codigo_filial");--> statement-breakpoint
CREATE UNIQUE INDEX "notas_fiscais_chave_erp" ON "notas_fiscais" USING btree ("empresa_id","numero","serie","cliente_codigo","cliente_loja");--> statement-breakpoint
CREATE INDEX "notas_fiscais_emissao" ON "notas_fiscais" USING btree ("data_emissao");--> statement-breakpoint
CREATE INDEX "notas_fiscais_numero" ON "notas_fiscais" USING btree ("numero");--> statement-breakpoint
CREATE INDEX "notas_fiscais_cliente_documento" ON "notas_fiscais" USING btree ("cliente_documento");--> statement-breakpoint
CREATE INDEX "sessoes_usuario" ON "sessoes" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_email_unico" ON "usuarios" USING btree (lower("email"));