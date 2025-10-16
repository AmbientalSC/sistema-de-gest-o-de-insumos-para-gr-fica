# 🚀 Deploy para GitHub Pages

## Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. **Nome do repositório:** `sistema-de-gestao-de-insumos-para-grafica`
3. **Descrição:** Sistema de Gestão de Insumos para Gráfica com Scanner de Código de Barras
4. **Visibilidade:** Public (para usar GitHub Pages gratuitamente)
5. **NÃO** marque "Add a README file"
6. Clique em **"Create repository"**

## Passo 2: Conectar Repositório Local ao GitHub

Depois de criar o repositório, execute os comandos abaixo no PowerShell:

```powershell
# Substitua SEU_USUARIO pelo seu username do GitHub
git remote add origin https://github.com/SEU_USUARIO/sistema-de-gestao-de-insumos-para-grafica.git

# Renomear branch para main (padrão do GitHub)
git branch -M main

# Fazer push inicial
git push -u origin main
```

## Passo 3: Deploy para GitHub Pages

Após fazer o push, execute:

```powershell
npm run deploy
```

Este comando irá:
1. Fazer build do projeto (`npm run build`)
2. Criar/atualizar branch `gh-pages`
3. Fazer deploy dos arquivos da pasta `dist`

## Passo 4: Configurar GitHub Pages

1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Pages**
3. Em **Source**, selecione:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Clique em **Save**

## Passo 5: Acessar o Site

Após alguns minutos, seu site estará disponível em:

```
https://SEU_USUARIO.github.io/sistema-de-gestao-de-insumos-para-grafica/
```

---

## ⚠️ Importante

### Atualizar o `base` no vite.config.ts

Se você nomeou o repositório diferente, atualize a linha `base` no arquivo `vite.config.ts`:

```typescript
base: '/NOME-DO-SEU-REPOSITORIO/',
```

### Atualizações Futuras

Para atualizar o site após fazer mudanças:

```powershell
# 1. Fazer commit das mudanças
git add .
git commit -m "descrição das mudanças"
git push

# 2. Deploy
npm run deploy
```

---

## 🔍 Verificação

Após o deploy, você pode verificar:

1. **Build local:** `npm run preview` (testa o build localmente)
2. **Status do deploy:** Aba "Actions" no repositório GitHub
3. **GitHub Pages:** Settings → Pages (mostra a URL do site)

---

## 🐛 Solução de Problemas

### Erro: "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/SEU_USUARIO/sistema-de-gestao-de-insumos-para-grafica.git
```

### Página 404 após deploy
- Verifique se o branch `gh-pages` foi criado
- Confirme configuração em Settings → Pages
- Aguarde 1-2 minutos para propagação

### Recursos não carregam (404)
- Verifique se `base` no `vite.config.ts` está correto
- Deve terminar com `/`
- Exemplo: `base: '/sistema-de-gestao-de-insumos-para-grafica/'`

---

## 📝 Resumo dos Comandos

```powershell
# Setup inicial
git init
git add .
git commit -m "feat: Sistema completo"
git remote add origin https://github.com/SEU_USUARIO/sistema-de-gestao-de-insumos-para-grafica.git
git branch -M main
git push -u origin main

# Deploy
npm run deploy

# Atualizações futuras
git add .
git commit -m "mensagem"
git push
npm run deploy
```
