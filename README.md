# ReCircula

App web responsivo para doações e trocas locais, construído com React, Vite e React Native Web; autenticação, banco e imagens ficam no Supabase.

## Funcionalidades

- Cadastro com confirmação de e-mail, login e navegação de visitante.
- Feed público de anúncios ativos, busca por título/descrição/local e filtros por categoria.
- Publicação de anúncios com imagem JPEG, PNG ou WebP de até 5 MB.
- Favoritos, conversas privadas entre participantes e envio de mensagens.
- Interface adaptada para celular e desktop.

## Desenvolvimento local

1. Instale Node.js 22.12 ou superior.
2. Instale as dependências travadas com `npm ci`.
3. Crie um projeto no [Supabase](https://supabase.com/) e configure o banco conforme abaixo.
4. Copie `.env.example` para `.env` e preencha os valores do projeto.
5. Rode `npm run dev` e abra o endereço local exibido pelo Vite.
6. Verifique a compilação de produção com `npm run build`.

## Configuração do Supabase

1. No painel do Supabase, abra **SQL Editor** e execute o conteúdo de `supabase/migrations/20261007180000_initial_schema.sql`.
2. Em **Authentication → URL Configuration**, configure o endereço local de desenvolvimento e o domínio de produção da Vercel como URLs permitidas de redirecionamento.
3. Em **Authentication → Providers → Email**, mantenha a confirmação por e-mail habilitada para produção. Configure o SMTP de produção do seu domínio; o serviço padrão do Supabase é limitado para uso real.
4. Copie a URL do projeto e a chave `anon`/publicável para `.env`:

   ```dotenv
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-publica
   ```

`anon`/publishable é uma chave pública e pode estar no cliente **somente porque** as tabelas e o bucket aplicam políticas RLS. Nunca coloque `service_role`, senhas, tokens administrativos ou credenciais privadas em variáveis `VITE_*`, no repositório ou no navegador.

## Painel administrativo

1. Aplique também `supabase/migrations/20261007193000_admin_dashboard.sql` no SQL Editor do Supabase.
2. Crie primeiro a conta normal do administrador e confirme o e-mail.
3. Promova a conta pelo **SQL Editor** confiável do Supabase, trocando pelo e-mail da conta:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@seu-dominio.com';
   ```

   Confira que uma única conta foi atualizada. Depois, saia e entre novamente para renovar as credenciais. Nunca atribua `role` via cadastro ou metadados editáveis pelo usuário (`user_metadata`).
4. A aba **Admin** aparece somente para uma sessão cujo `app_metadata.role` é `admin`. O banco também verifica esse papel antes de permitir o painel ou a moderação; ocultar a aba não é a única barreira.

O painel acompanha contas, anúncios, favoritos, conversas e volume/horário de mensagens, exibe atividade recente e permite ocultar/restaurar anúncios. **Não mostra nem dá acesso administrativo ao conteúdo das mensagens privadas.** Os registros detalhados começam após a instalação da migration; os indicadores totais contam os dados atuais. O painel mostra os últimos 100 eventos, 100 anúncios, 50 conversas e 100 contas. Não coleta buscas ou visualizações de página.

## Publicação na Vercel

1. Envie esta pasta para um repositório Git privado e importe-o na Vercel. Configure o **Root Directory** para a pasta que contém `package.json`, `index.html` e `vercel.json` (a raiz deste app), não para outro projeto ou template.
2. A Vercel usa `vercel.json`: comando de build `npm run build` e diretório de saída `dist`.
3. Em **Project Settings → Environment Variables**, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para os ambientes desejados.
4. Faça o deploy e adicione o endereço `.vercel.app` gerado à lista de URLs permitidas do Supabase. Repita para o domínio próprio se houver.

Não é possível concluir o deploy pela pasta local sem acesso ao seu projeto Supabase, repositório Git e conta Vercel. Depois de configurar os valores, execute novamente o build; variáveis Vite públicas são incorporadas ao bundle do navegador.

## Segurança e limites do MVP

- RLS no banco limita alterações de anúncios ao proprietário, favoritos à própria conta e conversas/mensagens aos dois participantes.
- Perfis públicos contêm somente nome de exibição, bairro e cidade; e-mail e senha ficam no Supabase Auth.
- Imagens de anúncios são públicas por URL; o upload é limitado a imagens de até 5 MB e cada usuário só pode gravar no próprio diretório.
- Há validação no cliente e restrições equivalentes no banco. O cliente usa somente a chave pública; não existe segredo privilegiado no bundle.
- As permissões do painel usam `app_metadata` administrado pelo Supabase, RLS e RPC restrita; a trilha administrativa registra metadados e nunca o texto das mensagens.
- Os cabeçalhos de segurança básicos são configurados em `vercel.json`.

Antes de divulgar amplamente, configure CAPTCHA e limites contra abuso no Supabase Auth, monitore quotas, defina um endereço real de suporte e um processo de denúncia/moderação de conversas. A aplicação não implementa notificações push, recuperação de conta personalizada, pagamentos nem painel de denúncias. Evite publicar endereço residencial ou outros dados pessoais nos anúncios.
