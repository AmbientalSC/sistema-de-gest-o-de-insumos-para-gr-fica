# 🎯 PRÓXIMOS PASSOS - Deploy GitHub Pages

## ✅ O que já foi feito:

1. ✓ Projeto configurado para GitHub Pages
2. ✓ Build de produção criado (pasta `dist/`)
3. ✓ Repositório Git inicializado
4. ✓ Commits realizados
5. ✓ Dependência `gh-pages` instalada
6. ✓ Scripts de deploy configurados
7. ✓ Documentação completa criada

---

## 📋 PRÓXIMOS PASSOS (Execute agora):

### 1️⃣ Criar Repositório no GitHub

Acesse: **https://github.com/new**

Configurações:
- **Repository name:** `sistema-de-gestao-de-insumos-para-grafica`
- **Description:** Sistema de Gestão de Insumos para Gráfica com Scanner de Código de Barras
- **Public** ✓ (para GitHub Pages grátis)
- **NÃO** marque "Add a README file"

Clique em **"Create repository"**

---

### 2️⃣ Copie seu username do GitHub

Exemplo: se sua URL do GitHub é `https://github.com/joao-silva`
Seu username é: `joao-silva`

---

### 3️⃣ Execute os comandos abaixo no PowerShell

**Substitua `SEU_USUARIO` pelo seu username do GitHub!**

```powershell
# Conectar ao repositório remoto
git remote add origin https://github.com/SEU_USUARIO/sistema-de-gestao-de-insumos-para-grafica.git

# Renomear branch para main
git branch -M main

# Enviar código para o GitHub
git push -u origin main

# Fazer deploy para GitHub Pages
npm run deploy
```

---

### 4️⃣ Configurar GitHub Pages

1. Acesse: `https://github.com/SEU_USUARIO/sistema-de-gestao-de-insumos-para-grafica`
2. Clique em **Settings** (topo direita)
3. No menu lateral esquerdo, clique em **Pages**
4. Em **Source**, selecione:
   - **Branch:** `gh-pages` 
   - **Folder:** `/ (root)`
5. Clique em **Save**

---

### 5️⃣ Aguarde o Deploy

- O GitHub levará 1-2 minutos para fazer o deploy
- Uma mensagem verde aparecerá com a URL: 
  
  `Your site is live at https://SEU_USUARIO.github.io/sistema-de-gestao-de-insumos-para-grafica/`

---

## 🌐 Acessar o Site

Após completar os passos, acesse:

```
https://SEU_USUARIO.github.io/sistema-de-gestao-de-insumos-para-grafica/
```

---

## 🔄 Atualizações Futuras

Quando fizer mudanças no código:

```powershell
# 1. Commitar mudanças
git add .
git commit -m "descrição da mudança"
git push

# 2. Fazer deploy
npm run deploy
```

---

## ⚠️ Importante

### Se você nomeou o repositório diferente:

Atualize o arquivo `vite.config.ts`, linha com `base`:

```typescript
base: '/NOME-DO-SEU-REPOSITORIO/',
```

Depois:
```powershell
npm run build
git add .
git commit -m "fix: Atualizar base path"
git push
npm run deploy
```

---

## 🎯 Checklist Final

- [ ] Repositório criado no GitHub
- [ ] Comandos executados no PowerShell
- [ ] Push realizado com sucesso
- [ ] Deploy executado (`npm run deploy`)
- [ ] GitHub Pages configurado em Settings → Pages
- [ ] Site acessível na URL fornecida

---

## 🆘 Suporte

Se encontrar problemas, consulte: **[DEPLOY.md](DEPLOY.md)**

Para dúvidas sobre uso do sistema: **[INSTRUCOES.md](INSTRUCOES.md)**

---

**Boa sorte! 🚀**
