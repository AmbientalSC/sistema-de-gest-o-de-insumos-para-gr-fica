# 📦 Sistema de Gestão de Insumos para Gráfica

Sistema completo de gestão de insumos com scanner de código de barras integrado, desenvolvido em React + TypeScript.

## ✨ Funcionalidades

- 🔐 **Autenticação** com dois perfis: Gestor e Colaborador
- 📱 **Scanner de Código de Barras** usando câmera do celular/webcam
- 📊 **Gestão de Insumos**: Cadastro, edição, controle de estoque
- 👥 **Gestão de Usuários**: Adicionar colaboradores e gestores
- 📈 **Histórico de Movimentações**: Rastreamento completo de entradas/saídas
- ⚠️ **Alertas de Estoque Baixo**: Notificações visuais automáticas
- 🎯 **Interface Responsiva**: Funciona em desktop e mobile

## 🚀 Acesso Rápido

### Demo Online
**Em breve:** https://SEU_USUARIO.github.io/sistema-de-gestao-de-insumos-para-grafica/

### Credenciais de Teste
- **Gestor:** usuário `gestor`, senha `1234`
- **Colaborador:** usuário `colab`, senha `1234`

## 💻 Executar Localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/sistema-de-gestao-de-insumos-para-grafica.git

# 2. Entre na pasta
cd sistema-de-gestao-de-insumos-para-grafica

# 3. Instale as dependências
npm install

# 4. Execute em modo desenvolvimento
npm run dev
```

O sistema estará disponível em: http://localhost:3000

## 📖 Documentação

- **[INSTRUCOES.md](INSTRUCOES.md)** - Manual completo de uso
- **[DEPLOY.md](DEPLOY.md)** - Guia de deploy para GitHub Pages

## 🛠️ Tecnologias

- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **html5-qrcode** - Scanner de código de barras

## 📂 Estrutura do Projeto

```
├── components/
│   ├── auth/           # Login
│   ├── collaborator/   # Dashboard do colaborador
│   ├── common/         # Componentes compartilhados
│   └── manager/        # Gestão (Gestor)
├── hooks/              # Custom hooks
├── services/           # API (mock)
└── types.ts            # TypeScript types
```

## 🚢 Deploy

### GitHub Pages

```bash
# Build e deploy
npm run deploy
```

Veja instruções completas em [DEPLOY.md](DEPLOY.md)

## 📝 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build local
npm run deploy   # Deploy para GitHub Pages
```

## 🔒 Segurança

⚠️ **Nota:** Este é um projeto de demonstração com dados mock em memória. Para uso em produção:

- Implementar backend real com banco de dados
- Adicionar autenticação JWT/OAuth
- Criptografar senhas com bcrypt
- Implementar validações server-side
- Configurar HTTPS
- Adicionar rate limiting

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido com ❤️ usando React e TypeScript

---

⭐ Se este projeto foi útil, considere dar uma estrela!
```
