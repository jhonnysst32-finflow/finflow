-- ════════════════════════════════════════════════════════════════
-- FINFLOW — Script SQL completo para o Supabase
-- Cole este script inteiro no SQL Editor do Supabase e execute
-- ════════════════════════════════════════════════════════════════

-- ── Habilitar UUID ────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Tabela: contas bancárias ──────────────────────────────────
create table if not exists contas (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  nome            text not null,
  tipo            text not null check (tipo in ('corrente','credito','investimento')),
  saldo_inicial   numeric(12,2) default 0,
  limite          numeric(12,2) default 0,
  dia_vencimento  int,
  dia_fechamento  int,
  cor             text default '#5B8FCC',
  criado_em       timestamptz default now()
);

-- ── Tabela: transações ────────────────────────────────────────
create table if not exists transacoes (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  descricao         text not null,
  valor             numeric(12,2) not null,
  tipo              text not null check (tipo in ('receita','despesa')),
  categoria         text not null,
  conta_id          uuid references contas(id) on delete set null,
  segmento          text not null check (segmento in ('canal','pessoal')),
  data              date not null,
  nota              text default '',
  parcela_atual     int default 0,
  total_parcelas    int default 0,
  parcela_grupo_id  text,
  criado_em         timestamptz default now()
);

-- ── Tabela: orçamentos ────────────────────────────────────────
create table if not exists orcamentos (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  categoria   text not null,
  limite      numeric(12,2) not null,
  criado_em   timestamptz default now(),
  unique (user_id, categoria)
);

-- ── Tabela: recorrentes ───────────────────────────────────────
create table if not exists recorrentes (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  descricao        text not null,
  valor            numeric(12,2) not null,
  tipo             text not null check (tipo in ('receita','despesa')),
  categoria        text not null,
  conta_id         uuid references contas(id) on delete set null,
  segmento         text not null check (segmento in ('canal','pessoal')),
  dia_vencimento   int not null,
  ativo            boolean default true,
  criado_em        timestamptz default now()
);

-- ── Tabela: metas financeiras ─────────────────────────────────
create table if not exists metas (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  nome        text not null,
  icone       text default '🎯',
  valor       numeric(12,2) not null,
  acumulado   numeric(12,2) default 0,
  prazo       date,
  cor         text default '#5B8FCC',
  criado_em   timestamptz default now()
);

-- ── Tabela: dados do canal ────────────────────────────────────
create table if not exists canal_historico (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  mes         text not null,
  inscritos   int default 0,
  views       int default 0,
  rpm         numeric(8,2) default 0,
  receita     numeric(12,2) default 0,
  criado_em   timestamptz default now(),
  unique (user_id, mes)
);

-- ── Tabela: categorias customizadas ──────────────────────────
create table if not exists categorias_custom (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  segmento    text not null check (segmento in ('canal','pessoal')),
  nome        text not null,
  criado_em   timestamptz default now(),
  unique (user_id, segmento, nome)
);

-- ── Tabela: alertas vistos ────────────────────────────────────
create table if not exists alertas_vistos (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  alerta_id   text not null,
  visto_em    timestamptz default now(),
  unique (user_id, alerta_id)
);

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — cada usuário só acessa seus próprios dados
-- ════════════════════════════════════════════════════════════════

alter table contas           enable row level security;
alter table transacoes       enable row level security;
alter table orcamentos       enable row level security;
alter table recorrentes      enable row level security;
alter table metas            enable row level security;
alter table canal_historico  enable row level security;
alter table categorias_custom enable row level security;
alter table alertas_vistos   enable row level security;

-- Políticas: cada tabela segue o mesmo padrão
do $$ declare t text;
begin
  foreach t in array array[
    'contas','transacoes','orcamentos','recorrentes',
    'metas','canal_historico','categorias_custom','alertas_vistos'
  ] loop
    execute format('
      create policy "%s_select" on %s for select using (auth.uid() = user_id);
      create policy "%s_insert" on %s for insert with check (auth.uid() = user_id);
      create policy "%s_update" on %s for update using (auth.uid() = user_id);
      create policy "%s_delete" on %s for delete using (auth.uid() = user_id);
    ', t, t, t, t, t, t, t, t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════
-- PRONTO! Todas as tabelas e políticas criadas com sucesso.
-- ════════════════════════════════════════════════════════════════
