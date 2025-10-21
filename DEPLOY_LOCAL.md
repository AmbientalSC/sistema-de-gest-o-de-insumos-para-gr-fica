Instruções rápidas para commit + deploy local

1) Abra PowerShell na raiz do projeto:
   cd C:\Users\thalita.lobato\Documents\GitHub\sistema-teste

2) Execute o script que cria commit e faz push (altera message via -Message):
   .\scripts\commit-and-deploy.ps1 -Message "UX: ajustes no dashboard e deploy via Actions"

3) Para incluir deploy local via gh-pages (requer Git autenticado), adicione o flag -LocalDeploy:
   .\scripts\commit-and-deploy.ps1 -Message "Deploy local" -LocalDeploy

Observações:
- O script realiza `git add -A` e tenta `git commit`. Se não houver mudanças, apenas faz push.
- O push dispara o workflow do GitHub Actions que faz o build e publica `dist` no GitHub Pages.
- Se preferir, você pode commitar manualmente com:
  git add .github/workflows/deploy.yml components/manager/Dashboard.tsx components/common/Header.tsx components/manager/UserManagement.tsx components/auth/Login.tsx services/firebaseApi.ts hooks/useAuth.tsx
  git commit -m "mensagem"
  git push origin main

