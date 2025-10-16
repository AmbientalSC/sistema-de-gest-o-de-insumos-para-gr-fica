# Sistema de Gestão de Insumos para Gráfica

## 🚀 Como Executar

```bash
npm install
npm run dev
```

O sistema estará disponível em: http://localhost:3001/

## 👥 Credenciais de Acesso

### Gestor
- **Usuário:** `gestor`
- **Senha:** `1234`
- **Permissões:** 
  - Gerenciar insumos (adicionar, editar, adicionar estoque)
  - Gerenciar usuários
  - Visualizar histórico de movimentações

### Colaborador
- **Usuário:** `colab`
- **Senha:** `1234`
- **Permissões:**
  - Dar baixa em insumos via scanner de código de barras

## 📱 Funcionalidades

### Para Gestores

#### 1. Gerenciamento de Insumos
- **Adicionar Insumo:**
  - Clique no botão "Adicionar Insumo"
  - Preencha os campos obrigatórios:
    - Nome do insumo
    - Código de barras (pode digitar ou escanear usando o botão 📷)
    - Unidade de medida (Folha, Kg, Litro, Unidade)
    - Quantidade atual
    - Quantidade mínima (para alertas de estoque baixo)
    - Localização
  - Campos opcionais:
    - Descrição
    - Fornecedor

- **Scanner de Código de Barras no Cadastro:**
  1. No formulário de cadastro/edição, clique no ícone 📷 ao lado do campo "Código de Barras"
  2. Permita acesso à câmera quando solicitado
  3. Aponte a câmera para o código de barras
  4. Quando detectado, aparecerá um ✓ verde e o campo será preenchido automaticamente
  5. O scanner fechará automaticamente após leitura bem-sucedida

- **Editar Insumo:**
  - Clique em "Editar" na linha do insumo
  - Modifique os campos desejados
  - Clique em "Salvar"

- **Adicionar Estoque:**
  - Clique em "Adicionar Estoque" na linha do insumo
  - Informe a quantidade a adicionar
  - Clique em "Adicionar"

- **Alertas de Estoque Baixo:**
  - Itens com quantidade ≤ quantidade mínima aparecem destacados em amarelo
  - Ícone ⚠️ aparece ao lado da quantidade

#### 2. Gerenciamento de Usuários
- **Adicionar Usuário:**
  - Clique em "Adicionar Usuário"
  - Preencha:
    - Nome completo
    - Nome de usuário (login)
    - Senha
    - Perfil (Gestor ou Colaborador)

#### 3. Histórico de Movimentações
- Visualize todas as entradas e saídas de estoque
- Informações exibidas:
  - Data e hora
  - Item movimentado
  - Tipo (Entrada/Saída)
  - Quantidade
  - Usuário responsável

### Para Colaboradores

#### Dar Baixa em Insumos
1. Faça login com credenciais de colaborador
2. Na tela principal, clique em "Escanear"
3. Aponte a câmera para o código de barras do insumo
4. O sistema identificará automaticamente o item
5. Confirme a quantidade a dar baixa
6. Clique em "Confirmar Baixa"
7. Mensagem de sucesso aparecerá
8. O estoque será atualizado automaticamente

## 🔧 Tecnologias Utilizadas

- **React** + **TypeScript**
- **Vite** (bundler e dev server)
- **Tailwind CSS** (via CDN - para produção, instalar via PostCSS)
- **html5-qrcode** (scanner de código de barras)

## 📝 Notas Importantes

### Scanner de Código de Barras
- Requer permissão de acesso à câmera
- Funciona melhor em ambiente com boa iluminação
- Para melhor desempenho, use câmera traseira em dispositivos móveis
- Suporta códigos de barras padrão (EAN, UPC, Code128, etc.)

### Dados Mock
- O sistema usa dados em memória (mockApi.ts)
- Dados são redefinidos ao recarregar a página
- Para persistência real, integrar com backend e banco de dados

### Itens Pré-cadastrados
1. **Papel A4** - Código: 1234567890123
2. **Tinta Preta** - Código: 2345678901234
3. **Caixa de Clips** - Código: 3456789012345

## 🔐 Segurança

⚠️ **Aviso:** Este é um sistema de demonstração. Para produção:
- Implementar autenticação JWT/OAuth
- Criptografar senhas (bcrypt)
- Validar inputs no backend
- Implementar HTTPS
- Adicionar rate limiting
- Implementar CORS adequadamente

## 📦 Estrutura do Projeto

```
├── components/
│   ├── auth/          # Login
│   ├── collaborator/  # Dashboard do colaborador
│   ├── common/        # Componentes compartilhados (Header, Icons)
│   └── manager/       # Dashboards e gerenciamento (Gestor)
├── hooks/             # Custom hooks (useAuth)
├── services/          # API mock
├── App.tsx            # Componente principal
├── types.ts           # Definições TypeScript
└── index.tsx          # Entry point
```

## 🐛 Solução de Problemas

### Erro: "HTML Element not found"
- Já corrigido: o scanner aguarda o DOM estar pronto antes de inicializar

### Câmera não abre
- Verifique permissões do navegador
- Use HTTPS em produção (requisito para acessar câmera)
- Teste em navegadores diferentes

### Código de barras não é reconhecido
- Verifique iluminação
- Limpe a lente da câmera
- Certifique-se que o código está legível
- Tente diferentes distâncias/ângulos

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação do projeto ou entre em contato com a equipe de desenvolvimento.
