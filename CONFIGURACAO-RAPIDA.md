# 🚀 Guia Rápido - Configuração Firebase

## ⚡ Passos para Começar a Usar

### 1️⃣ **Ativar Authentication no Firebase Console**

```
1. Acesse: https://console.firebase.google.com
2. Selecione: gestao-estoque-f4b01
3. Menu lateral → Authentication
4. Aba "Sign-in method"
5. Clique em "Email/Password"
6. Toggle para ATIVADO ✅
7. Clique em "Salvar"
```

### 2️⃣ **Criar Primeiro Usuário Gestor**

#### Opção A: Via Firebase Console (Recomendado)

**Passo 1 - Criar no Authentication:**
```
1. Authentication → Users
2. Clique "Add user"
3. Preencha:
   Email: gestor@gestao-estoque.local
   Password: 1234 (ou sua senha)
4. Clique "Add user"
5. COPIE o UID gerado (ex: abc123xyz456)
```

**Passo 2 - Criar documento no Firestore:**
```
1. Firestore Database → Iniciar coleção
2. Collection ID: users
3. Document ID: [cole o UID copiado]
4. Adicione os campos:

   Campo: name
   Tipo: string
   Valor: Admin Gestor

   Campo: username
   Tipo: string
   Valor: gestor

   Campo: role
   Tipo: string
   Valor: GESTOR

   Campo: active
   Tipo: boolean
   Valor: true

   Campo: createdAt
   Tipo: timestamp
   Valor: [clique em "Set to server timestamp"]

   Campo: updatedAt
   Tipo: timestamp
   Valor: [clique em "Set to server timestamp"]

5. Clique "Salvar"
```

#### Opção B: Via Script (Depois do primeiro login)

Se preferir, após fazer login com gestor pela primeira vez, abra o console do navegador (F12) e execute:

```javascript
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './services/firebase';

const currentUser = auth.currentUser;
if (currentUser) {
  await setDoc(doc(db, 'users', currentUser.uid), {
    name: 'Admin Gestor',
    username: 'gestor',
    role: 'GESTOR',
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  alert('Documento criado no Firestore!');
  location.reload();
}
```

### 3️⃣ **Configurar Firestore Rules**

```
1. Firestore Database → Rules
2. Substitua o conteúdo por:
```

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função para verificar se é gestor
    function isManager() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'GESTOR';
    }
    
    // Função para verificar se usuário está ativo
    function isActive() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.active == true;
    }
    
    // Itens - todos autenticados podem ler/escrever
    match /items/{document=**} {
      allow read, write: if request.auth != null && isActive();
    }
    
    // Movimentações - todos autenticados podem ler/escrever
    match /movements/{document=**} {
      allow read, write: if request.auth != null && isActive();
    }
    
    // Usuários - leitura para todos, escrita só para gestores
    match /users/{userId} {
      allow read: if request.auth != null && isActive();
      allow write: if request.auth != null && isActive() && isManager();
    }
  }
}
```

```
3. Clique "Publicar"
```

### 4️⃣ **Testar o Sistema**

#### Teste 1: Login do Gestor
```
1. Abra o sistema
2. Username: gestor
3. Password: 1234 (ou sua senha)
4. ✅ Deve fazer login com sucesso
```

#### Teste 2: Criar Novo Usuário
```
1. Menu → Usuários
2. Clique "Adicionar Usuário"
3. Preencha:
   Nome: João Silva
   Usuário: joao
   Senha: 1234
   Perfil: Colaborador
4. Clique "Salvar"
5. ✅ Deve aparecer na tabela
```

#### Teste 3: Login do Colaborador
```
1. Faça logout
2. Username: joao
3. Password: 1234
4. ✅ Deve fazer login como colaborador
```

#### Teste 4: Desativar Usuário
```
1. Login como gestor
2. Menu → Usuários
3. Clique "Desativar" no usuário João
4. Faça logout
5. Tente login como joao
6. ❌ Deve receber erro: "Usuário desativado"
```

## 🎯 **Estrutura Final**

```
Firebase Authentication
├── gestor@gestao-estoque.local (UID: abc123)
└── joao@gestao-estoque.local (UID: xyz456)

Firestore Database
└── users/
    ├── abc123/
    │   ├── name: "Admin Gestor"
    │   ├── username: "gestor"
    │   ├── role: "GESTOR"
    │   └── active: true
    └── xyz456/
        ├── name: "João Silva"
        ├── username: "joao"
        ├── role: "COLABORADOR"
        └── active: true
```

## 📊 **Dados de Exemplo**

Depois de configurado, você pode adicionar dados de teste:

### Itens (via interface):
```
Cadastro de Insumos → Adicionar Insumo
- Nome: Papel A4
- Código de Barras: 7891234567890
- Quantidade: 100
- Unidade: Folha
- Localização: Estoque 1
```

### Ou via Firestore (opcional):
```
Coleção: items
Documento: [auto ID]
Campos:
  name: "Papel A4"
  barcode: "7891234567890"
  description: "Papel sulfite 75g"
  unitOfMeasure: "Folha"
  quantity: 100
  minQuantity: 20
  supplier: "Papelaria XYZ"
  location: "Estoque 1"
  createdAt: [timestamp]
  updatedAt: [timestamp]
```

## ✅ **Checklist de Configuração**

- [ ] Firebase Authentication ativado (Email/Password)
- [ ] Usuário gestor criado no Authentication
- [ ] Documento gestor criado no Firestore (collection: users)
- [ ] Firestore Rules configuradas e publicadas
- [ ] Login do gestor testado e funcionando
- [ ] Criação de novo usuário testada
- [ ] Login do colaborador testado
- [ ] Desativação de usuário testada

## 🆘 **Problemas Comuns**

### "Permission denied" ao acessar Firestore
**Solução:** Verifique se as Firestore Rules foram publicadas corretamente

### "Usuário ou senha inválidos" mesmo com dados corretos
**Solução:** Verifique se o usuário existe no Authentication E no Firestore

### Usuário criado mas não aparece na lista
**Solução:** Verifique se o documento foi criado na coleção `users` com o UID correto

### Login funciona mas não carrega dados
**Solução:** Verifique se as Firestore Rules permitem leitura para usuários autenticados

## 📞 **Links Úteis**

- 🔥 [Firebase Console](https://console.firebase.google.com)
- 📖 [Authentication Docs](https://firebase.google.com/docs/auth)
- 📖 [Firestore Docs](https://firebase.google.com/docs/firestore)
- 🔐 [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

✨ **Pronto! Seu sistema está integrado com Firebase e pronto para uso!** 🚀
