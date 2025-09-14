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

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// A LÓGICA DO APP COMEÇA APÓS O CARREGAMENTO DA PÁGINA
document.addEventListener('DOMContentLoaded', function() {
    
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const form = document.getElementById('anamneseForm') as HTMLFormElement;

    // --- Estado do Agendamento ---
    let bookingState: {
        services: { name: string, price: number, value: string }[],
        total: number,
        date: string | null,
        time: string | null,
        displayDate: string | null
    } = { services: [], total: 0, date: null, time: null, displayDate: null };
    let currentDate = new Date();
    let clientesDoRelatorio: any[] = [];

    // --- Funções de Persistência de Estado ---
    function saveBookingState() { sessionStorage.setItem('bookingState', JSON.stringify(bookingState)); }
    function loadBookingState() {
        const savedState = sessionStorage.getItem('bookingState');
        if (savedState) {
            bookingState = JSON.parse(savedState);
            if (bookingState.date) {
                currentDate = new Date(bookingState.date + 'T00:00:00');
            }
        }
    }

    // --- Seletores de Elementos DOM ---
    // (Cole aqui todas as suas constantes: tabPrices, agendaView, etc...)

    // --- Inicialização ---
    loadBookingState();
    // (Cole aqui o restante da sua função de inicialização e todas as outras funções:
    // showView, handleServiceSelection, renderCalendar, handleFormSubmit, etc...)

    // --- Lógica do Relatório com Firebase ---
    async function salvarCliente(clientData: any) {
        console.log("Salvando cliente no Firebase...");
        await db.collection("clientesJessicaRocha").doc(String(clientData.id)).set(clientData);
        console.log("Cliente salvo com sucesso!");
    }

    function loadReport() {
        // ... (Cole aqui a função loadReport que usa o onSnapshot do Firebase)
    }

    // ... (Cole aqui o resto de todas as suas funções)
});
