// --- Declarações para bibliotecas externas e Firebase ---
declare const firebase: any;
declare const jspdf: any;

// --- Bloco de configuração e inicialização do Firebase ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- A LÓGICA DO APP COMEÇA APÓS O CARREGAMENTO DA PÁGINA ---
document.addEventListener('DOMContentLoaded', function() {
    
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const form = document.getElementById('anamneseForm') as HTMLFormElement;

    // --- Estado do Agendamento e Variáveis Globais ---
    let bookingState = { services: [], total: 0, date: null, time: null, displayDate: null };
    let currentDate = new Date();
    let clientesDoRelatorio: any[] = [];
    
    // --- Lógica das Abas ---
    const tabPrices = document.getElementById('tabPrices') as HTMLButtonElement;
    // ... (e todas as outras constantes de elementos DOM que você tinha)
    
    function showView(viewToShow: HTMLElement, tabToActivate: HTMLElement) {
        // ... (sua função showView)
    }

    tabPrices.addEventListener('click', () => showView(pricesView, tabPrices));
    // ... (todos os seus outros addEventListener)

    // --- Lógica do Formulário ---
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        // ... (sua lógica de validação)

        const clientRecord = { /* ... seu objeto clientRecord ... */ };

        try {
            await salvarCliente(clientRecord);
            // ... (sua lógica de WhatsApp e modal de sucesso)
        } catch (error) {
            console.error("Erro ao salvar cliente: ", error);
            alert("Falha ao salvar a ficha.");
        }
    });

    // --- Lógica do Relatório com Firebase ---
    async function salvarCliente(clientData: any) {
        await db.collection("clientesJessicaRocha").doc(String(clientData.id)).set(clientData);
    }

    function loadReport() {
        db.collection("clientesJessicaRocha").orderBy("id", "desc").onSnapshot((querySnapshot: any) => {
            // ... (sua lógica para preencher a tabela do relatório com os dados do snapshot)
        });
    }

    // --- Funções de Exportação ---
    function downloadCsvReport() {
        const clients = clientesDoRelatorio;
        // ... (sua lógica de exportação usando a variável 'clients')
    }

    function downloadPdfReport() {
        const clients = clientesDoRelatorio;
        // ... (sua lógica de exportação usando a variável 'clients')
    }

    // --- E todas as outras funções que você tinha ---
});
