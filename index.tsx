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


// --- Início da Lógica do Aplicativo ---

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
let clientesDoRelatorio: any[] = []; // Guarda os clientes carregados do Firebase para exportação

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

// --- Elementos DOM ---
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
const passwordModal = document.getElementById('passwordModal') as HTMLDivElement;
const passwordForm = document.getElementById('passwordForm') as HTMLFormElement;
const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
const cancelPassword = document.getElementById('cancelPassword') as HTMLButtonElement;
const passwordError = document.getElementById('passwordError') as HTMLParagraphElement;
const fullNameInput = document.getElementById('fullName') as HTMLInputElement;
const signatureInput = document.getElementById('signature') as HTMLInputElement;
const clientNameDisplay = document.getElementById('clientNameDisplay') as HTMLSpanElement;

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', function() {
    loadBookingState();
    initializeEventListeners();
    updateBookingSummaryOnLoad();
});

function initializeEventListeners() {
    tabPrices.addEventListener('click', () => showView(pricesView, tabPrices));
    tabAgenda.addEventListener('click', () => {
        showView(agendaView, tabAgenda);
        renderAgendaSummary();
        renderCalendar();
    });
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

    serviceList.addEventListener('change', handleServiceSelection);
    goToAgendaBtn.addEventListener('click', () => {
        showView(agendaView, tabAgenda);
        renderAgendaSummary();
        renderCalendar();
    });

    goToFormFromAgendaBtn.addEventListener('click', syncServicesToAnamnesisForm);
    passwordForm.addEventListener('submit', handlePasswordSubmit);
    cancelPassword.addEventListener('click', closePasswordModal);
    passwordModal.addEventListener('click', (e) => { if (e.target === passwordModal) closePasswordModal(); });

    setupConditionalFields();
    setupNoneCheckboxes();

    fullNameInput.addEventListener('input', syncSignature);
    signatureInput.addEventListener('input', syncSignature);

    form.addEventListener('submit', handleFormSubmit);

    document.getElementById('downloadCsv')!.addEventListener('click', downloadCsvReport);
    document.getElementById('downloadPdf')!.addEventListener('click', downloadPdfReport);
}

function showView(viewToShow: HTMLElement, tabToActivate: HTMLElement) {
    [pricesView, agendaView, formView, reportView, instagramView].forEach(view => view.classList.add('hidden'));
    [tabPrices, tabAgenda, tabForm, tabReport, tabInstagram].forEach(tab => tab.classList.remove('tab-active'));
    
    viewToShow.classList.remove('hidden');
    tabToActivate.classList.add('tab-active');
    window.scrollTo(0, 0);
}

function handleServiceSelection(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.name === 'serviceSelection') {
        const selectedCheckboxes = serviceList.querySelectorAll('input[name="serviceSelection"]:checked');
        bookingState.services = [];
        bookingState.total = 0;

        selectedCheckboxes.forEach(checkbox => {
            const serviceElement = checkbox.closest('label') as HTMLLabelElement;
            const price = parseFloat(serviceElement.dataset.price!);
            const name = serviceElement.dataset.name!;
            const value = (checkbox as HTMLInputElement).value;
            bookingState.services.push({ name, price, value });
            bookingState.total += price;
        });
        updateBookingSummaryUI();
        saveBookingState();
    }
}

function updateBookingSummaryUI() {
    const count = bookingState.services.length;
    bookingCount.textContent = count.toString();
    bookingTotal.textContent = `R$${bookingState.total.toFixed(2).replace('.', ',')}`;

    if (count > 0) {
        bookingSummary.classList.remove('translate-y-full');
        goToAgendaBtn.disabled = false;
    } else {
        bookingSummary.classList.add('translate-y-full');
        goToAgendaBtn.disabled = true;
    }
}

function renderAgendaSummary() {
    agendaServiceList.innerHTML = bookingState.services.map(s => `
        <div class="flex justify-between">
            <span>${s.name}</span>
            <span class="font-medium">R$${s.price.toFixed(2).replace('.', ',')}</span>
        </div>`).join('');
    agendaTotal.textContent = `R$${bookingState.total.toFixed(2).replace('.', ',')}`;
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0,0,0,0);

    let calendarHTML = `<div class="flex justify-between items-center mb-4">...</div>`; // Conteúdo omitido para brevidade
    calendarContainer.innerHTML = calendarHTML;
    
    // Adiciona os event listeners para o calendário
}

function renderTimeSlots() {
    // Lógica para renderizar os horários
}

function checkIfReadyToProceed() {
    goToFormFromAgendaBtn.disabled = !(bookingState.date && bookingState.time);
}

function syncServicesToAnamnesisForm() {
    showView(formView, tabForm);
    const formProcedureCheckboxes = document.querySelectorAll('input[name="procedure"]') as NodeListOf<HTMLInputElement>;
    formProcedureCheckboxes.forEach(cb => cb.checked = false);
    bookingState.services.forEach(service => {
        const matchingCheckbox = document.querySelector(`input[name="procedure"][value="${service.value}"]`) as HTMLInputElement;
        if (matchingCheckbox) matchingCheckbox.checked = true;
    });
}

function openPasswordModal() {
    passwordModal.classList.remove('hidden');
    passwordInput.focus();
}

function closePasswordModal() {
    passwordModal.classList.add('hidden');
    passwordInput.value = '';
    passwordError.classList.add('hidden');
}

function handlePasswordSubmit(e: Event) {
    e.preventDefault();
    if (passwordInput.value === 'Apolo@0606') { // Sua senha
        sessionStorage.setItem('isAuthenticated', 'true');
        closePasswordModal();
        showView(reportView, tabReport);
        loadReport();
    } else {
        passwordError.classList.remove('hidden');
    }
}

function setupConditionalFields() {
    // Sua lógica de campos condicionais
}

function setupNoneCheckboxes() {
    // Sua lógica para checkboxes "nenhum"
}

function syncSignature() {
    const name = fullNameInput.value;
    clientNameDisplay.textContent = name || '...';
    signatureInput.value = name;
}

async function handleFormSubmit(event: Event) {
    event.preventDefault();
    
    const procedureError = document.getElementById('procedureError') as HTMLParagraphElement;
    if (document.querySelectorAll('input[name="procedure"]:checked').length === 0) {
        procedureError.classList.remove('hidden');
        procedureError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    procedureError.classList.add('hidden');

    const clientRecord = {
        id: Date.now(),
        name: (document.getElementById('fullName') as HTMLInputElement).value,
        phone: (document.getElementById('phone') as HTMLInputElement).value,
        procedure: bookingState.services.map(s => s.name).join(', '),
        registrationDate: new Date().toLocaleDateString('pt-BR'),
        appointmentDateTime: `${bookingState.displayDate} às ${bookingState.time}`,
        fullData: { /* objeto com todos os dados coletados do form */ }
    };

    try {
        await salvarCliente(clientRecord);
        // ... (lógica do WhatsApp e do modal de confirmação)
    } catch (error) {
        console.error("Erro ao salvar cliente: ", error);
        alert("Ocorreu um erro ao salvar a ficha. Por favor, tente novamente.");
    }
}

function showConfirmationModal() {
    // ...
}

function resetBookingProcess() {
    // ...
}

// --- Lógica do Relatório com Firebase ---
async function salvarCliente(clientData: any) {
    console.log("Salvando cliente no Firebase...");
    await db.collection("clientesJessicaRocha").doc(String(clientData.id)).set(clientData);
    console.log("Cliente salvo com sucesso!");
}

function loadReport() {
    const tableBody = document.getElementById('reportTableBody') as HTMLTableSectionElement;
    const noClientsMessage = document.getElementById('noClientsMessage') as HTMLParagraphElement;

    db.collection("clientesJessicaRocha").orderBy("id", "desc").onSnapshot((querySnapshot: any) => {
        const clients: any[] = [];
        querySnapshot.forEach((doc: any) => clients.push(doc.data()));
        clientesDoRelatorio = clients; // Atualiza a variável global

        tableBody.innerHTML = '';
        if (clients.length === 0) {
            noClientsMessage.classList.remove('hidden');
        } else {
            noClientsMessage.classList.add('hidden');
            clients.forEach(client => {
                tableBody.innerHTML += `
                    <tr class="hover:bg-pink-50/50">
                        <td class="px-6 py-4">${client.name}</td>
                        <td class="px-6 py-4">${client.phone}</td>
                        <td class="px-6 py-4">${client.procedure}</td>
                        <td class="px-6 py-4">${client.registrationDate}</td>
                    </tr>`;
            });
        }
    }, (error: any) => {
        console.error("Erro ao carregar relatório: ", error);
        noClientsMessage.textContent = "Erro ao carregar dados.";
        noClientsMessage.classList.remove('hidden');
    });
}

function downloadCsvReport() {
    const clients = clientesDoRelatorio;
    if (clients.length === 0) return alert('Nenhum cliente para exportar.');
    // ... lógica para gerar CSV com a variável 'clients'
}

function downloadPdfReport() {
    const clients = clientesDoRelatorio;
    if (clients.length === 0) return alert('Nenhum cliente para exportar.');
    // ... lógica para gerar PDF com a variável 'clients'
}

function updateBookingSummaryOnLoad() {
    const serviceCheckboxes = serviceList.querySelectorAll('input[name="serviceSelection"]') as NodeListOf<HTMLInputElement>;
    serviceCheckboxes.forEach(checkbox => {
        checkbox.checked = bookingState.services.some(s => s.value === checkbox.value);
    });
    updateBookingSummaryUI();
}
