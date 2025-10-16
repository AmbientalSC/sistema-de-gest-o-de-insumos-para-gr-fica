/**
 * Script para criar dados iniciais no Firebase
 * Execute este script UMA VEZ após configurar o Firebase
 * 
 * Como usar:
 * 1. Certifique-se de estar logado no Firebase console
 * 2. Vá para Authentication e habilite "Email/Password"
 * 3. Execute: node --loader ts-node/esm initFirebase.ts
 * 
 * Ou simplesmente crie os usuários manualmente no Firebase Console:
 * - gestor@gestao-estoque.local / senha: 1234
 * - colab@gestao-estoque.local / senha: 1234
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Role } from '../types';

const USERS_COLLECTION = 'users';

async function initializeFirebase() {
  console.log('🔥 Inicializando Firebase com dados de exemplo...\n');

  try {
    // Criar usuário Gestor
    console.log('Criando usuário Gestor...');
    const gestorCredential = await createUserWithEmailAndPassword(
      auth,
      'gestor@gestao-estoque.local',
      '1234'
    );

    await setDoc(doc(db, USERS_COLLECTION, gestorCredential.user.uid), {
      name: 'Admin Gestor',
      username: 'gestor',
      role: Role.Manager,
      createdAt: Timestamp.now()
    });
    console.log('✅ Gestor criado com sucesso!\n');

    // Criar usuário Colaborador
    console.log('Criando usuário Colaborador...');
    const colabCredential = await createUserWithEmailAndPassword(
      auth,
      'colab@gestao-estoque.local',
      '1234'
    );

    await setDoc(doc(db, USERS_COLLECTION, colabCredential.user.uid), {
      name: 'Colaborador Exemplo',
      username: 'colab',
      role: Role.Collaborator,
      createdAt: Timestamp.now()
    });
    console.log('✅ Colaborador criado com sucesso!\n');

    console.log('🎉 Inicialização concluída!\n');
    console.log('Credenciais criadas:');
    console.log('- Gestor: gestor / 1234');
    console.log('- Colaborador: colab / 1234\n');

  } catch (error: any) {
    console.error('❌ Erro durante inicialização:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n⚠️  Usuários já existem. Você pode usar as credenciais:');
      console.log('- Gestor: gestor / 1234');
      console.log('- Colaborador: colab / 1234\n');
    }
  }
}

// Executar apenas se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeFirebase().then(() => process.exit(0));
}

export { initializeFirebase };
