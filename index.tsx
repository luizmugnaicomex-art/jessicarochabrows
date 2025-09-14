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


// --- A LÓGICA DO APP COMEÇA AQUI ---
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
    } = {
        services: [], total: 0, date: null, time: null, displayDate: null
    };
    let currentDate = new Date();
    let clientesDoRelatorio: any[] = [];

    // --- Funções de Persistência de Estado (sessionStorage para o agendamento em andamento) ---
    function saveBookingState() {
        sessionStorage.setItem('bookingState', JSON.stringify(bookingState));
    }

    function loadBookingState() {
        const savedState = sessionStorage.getItem('bookingState');
        if (savedState) {
            bookingState = JSON.parse(savedState);
            if (bookingState.date) {
                currentDate = new Date(bookingState.date + 'T00:00:00');
            }
        }
    }
    
    // --- Lógica das Abas ---
    const tabPrices = document.getElementById('tabPrices') as HTMLButtonElement;
    const tabAgenda = document.getElementById('tabAgenda') as HTMLButtonElement;
    const tabForm = document.getElementById('tabForm') as HTMLButtonElement;
    const tabReport = document.getElementById('tabReport') as HTMLButtonElement;
    const tabInstagram = document.getElementById('tabInstagram') as HTMLButtonElement;
    const pricesView = document.getElementById('pricesView') as HTMLDivElement;
    const agendaView = document.getElementById('agendaView') as HTMLDivElement;
    const formView = document.getElementById('formView') as HTMLDivElement;
    const reportView = document.getElementById('reportView') as HTMLDivElement;
    const instagramView = document.getElementById('instagramView') as HTMLDivElement;
    
    // --- Elementos do Agendamento ---
    const serviceList = document.getElementById('serviceList') as HTMLDivElement;
    const bookingSummary = document.getElementById('bookingSummary') as HTMLDivElement;
    const bookingTotal = document.getElementById('bookingTotal') as HTMLSpanElement;
    const bookingCount = document.getElementById('bookingCount') as HTMLSpanElement;
    const goToAgendaBtn = document.getElementById('goToAgendaBtn') as HTMLButtonElement;
    const agendaServiceList = document.getElementById('agendaServiceList') as HTMLDivElement;
    const agendaTotal = document.getElementById('agendaTotal') as HTMLSpanElement;
    const calendarContainer = document.getElementById('calendar') as HTMLDivElement;
    const timeSlotsContainer = document.getElementById('timeSlots') as HTMLDivElement;
    const goToFormFromAgendaBtn = document.getElementById('goToFormFromAgendaBtn') as HTMLButtonElement;
    
    // --- Elementos do Modal de Senha ---
    const passwordModal = document.getElementById('passwordModal') as HTMLDivElement;
    const passwordForm = document.getElementById('passwordForm') as HTMLFormElement;
    const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
    const cancelPassword = document.getElementById('cancelPassword') as HTMLButtonElement;
    const passwordError = document.getElementById('passwordError') as HTMLParagraphElement;

    // --- Outros Elementos ---
    const fullNameInput = document.getElementById('fullName') as HTMLInputElement;
    const signatureInput = document.getElementById('signature') as HTMLInputElement;
    const clientNameDisplay = document.getElementById('clientNameDisplay') as HTMLSpanElement;
    
    // --- Inicialização e Restauração de Estado ---
    loadBookingState();

    function showView(viewToShow: HTMLElement, tabToActivate: HTMLElement) {
        [pricesView, agendaView, formView, reportView, instagramView].forEach(view => view.classList.add('hidden'));
        [tabPrices, tabAgenda, tabForm, tabReport, tabInstagram].forEach(tab => tab.classList.remove('tab-active'));
        
        viewToShow.classList.remove('hidden');
        tabToActivate.classList.add('tab-active');
        window.scrollTo(0, 0);
    }

    tabPrices.addEventListener('click', () => showView(pricesView, tabPrices));
    tabAgenda.addEventListener('click', () => showView(agendaView, tabAgenda));
    tabForm.addEventListener('click', () => showView(formView, tabForm));
    tabInstagram.addEventListener('click', () => showView(instagramView, tabInstagram));
    
    tabReport.addEventListener('click', () => {
        if (sessionStorage.getItem('isAuthenticated') === 'true') {
            showView(reportView, tabReport);
            loadReport();
        } else {
            openPasswordModal();
        }
    });

    // --- Lógica Completa (copiada do seu original) ---
    // (O restante do seu código JavaScript vai aqui, exatamente como era antes, mas com as modificações para o Firebase)
});
