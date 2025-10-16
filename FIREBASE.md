# 🔥 Configuração Firebase

## ✅ Configuração Concluída

O Firebase já está configurado no projeto com:
- ✓ Firebase SDK instalado
- ✓ Autenticação configurada
- ✓ Firestore Database configurado
- ✓ API integrada

---

## 📋 Próximos Passos no Firebase Console

### 1️⃣ Habilitar Autenticação

1. Acesse: https://console.firebase.google.com/project/gestao-estoque-f4b01
2. Vá em **Authentication** (menu lateral)
3. Clique na aba **Sign-in method**
4. Clique em **Email/Password**
5. **Habilite** a opção "Email/Password"
6. Clique em **Save**

### 2️⃣ Criar Usuários Iniciais

Você tem duas opções:

#### Opção A: Criar Manualmente no Console (Recomendado)

1. No Firebase Console, vá em **Authentication** → **Users**
2. Clique em **Add user**
3. Crie os usuários:

**Gestor:**
- Email: `gestor@gestao-estoque.local`
- Password: `1234`

**Colaborador:**
- Email: `colab@gestao-estoque.local`
- Password: `1234`

4. Após criar os usuários no Authentication, vá em **Firestore Database**
5. Crie uma collection chamada `users`
6. Para cada usuário, crie um documento com o UID do Authentication:

**Documento do Gestor** (use o UID do user criado):
```json
{
  "name": "Admin Gestor",
  "username": "gestor",
  "role": "GESTOR",
  "createdAt": [timestamp atual]
}
```

**Documento do Colaborador** (use o UID do user criado):
```json
{
  "name": "Colaborador Exemplo",
  "username": "colab",
  "role": "COLABORADOR",
  "createdAt": [timestamp atual]
}
```

#### Opção B: Usar Script de Inicialização

*(Ainda não implementado - use a Opção A por enquanto)*

### 3️⃣ Configurar Regras do Firestore

1. Vá em **Firestore Database** → **Rules**
2. Cole as seguintes regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários autenticados podem ler tudo
    match /{document=**} {
      allow read: if request.auth != null;
    }
    
    // Apenas gestores podem escrever em users
    match /users/{userId} {
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'GESTOR';
    }
    
    // Items - gestores podem escrever, todos podem ler
    match /items/{itemId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'GESTOR';
    }
    
    // Movements - todos autenticados podem escrever (para checkout)
    match /movements/{movementId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Clique em **Publish**

---

## 🔄 Trocar de Mock para Firebase

Os componentes já estão importando de `mockApi.ts`. Para usar Firebase:

### Atualizar Importações

Em cada arquivo que usa `mockApi`, troque:

```typescript
// De:
import { apiLogin, apiGetItems, ... } from '../services/mockApi';

// Para:
import { apiLogin, apiGetItems, ... } from '../services/firebaseApi';
```

**Arquivos para atualizar:**
- `hooks/useAuth.tsx`
- `components/manager/ItemManagement.tsx`
- `components/manager/UserManagement.tsx`
- `components/manager/MovementHistory.tsx`
- `components/collaborator/CollaboratorDashboard.tsx`

---

## 🧪 Testar Localmente

```bash
npm run dev
```

Faça login com:
- **Gestor:** `gestor` / `1234`
- **Colaborador:** `colab` / `1234`

---

## 🚀 Deploy

Após configurar e testar:

```bash
git add .
git commit -m "feat: Integração com Firebase Auth e Firestore"
git push
npm run deploy
```

---

## 📊 Collections do Firestore

### `users`
```typescript
{
  id: string (UID do Firebase Auth),
  name: string,
  username: string,
  role: "GESTOR" | "COLABORADOR",
  createdAt: Timestamp
}
```

### `items`
```typescript
{
  id: string (auto-gerado),
  name: string,
  barcode: string,
  description: string,
  unitOfMeasure: "Folha" | "Kg" | "Litro" | "Unidade",
  quantity: number,
  minQuantity: number,
  supplier: string,
  location: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `movements`
```typescript
{
  id: string (auto-gerado),
  itemId: string,
  itemName: string,
  userId: string,
  userName: string,
  type: "ENTRADA" | "SAÍDA",
  quantity: number,
  timestamp: Timestamp
}
```

---

## ⚠️ Importante

- **Não commit** o arquivo `firebase.ts` com credenciais reais em produção
- Use **variáveis de ambiente** para produção
- Configure **regras de segurança** adequadas no Firestore
- Habilite **2FA** no Firebase Console para segurança

---

## 🆘 Problemas Comuns

### Erro: "Firebase: Error (auth/invalid-email)"
- Certifique-se de que Email/Password está habilitado no Authentication

### Erro: "Missing or insufficient permissions"
- Verifique as regras do Firestore
- Certifique-se de que o usuário está autenticado

### Login não funciona
- Verifique se os usuários foram criados no Authentication
- Verifique se os documentos foram criados no Firestore `users`

---

**Documentação Firebase:** https://firebase.google.com/docs
