// NOVO: Aviso para o TypeScript sobre a variável global do Firebase
declare const firebase: any;

// --- Declarações para bibliotecas externas ---
declare const jspdf: any;

// NOVO: Bloco de configuração e inicialização do Firebase
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
        services: [],
        total: 0,
        date: null,
        time: null,
        displayDate: null
    };
    let currentDate = new Date();
    // NOVO: Variável global para guardar os clientes do relatório
    let clientesDoRelatorio: any[] = [];
    
    // --- Funções de Persistência de Estado (localStorage para o agendamento em andamento) ---
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
    
    // Lógica das Abas
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
            loadReport(); // MODIFICADO: Agora carrega do Firebase
        } else {
            openPasswordModal();
        }
    });

    // --- Lógica do Agendamento (continua a mesma) ---
    serviceList.addEventListener('change', (e) => {
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
    });

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
    
    goToAgendaBtn.addEventListener('click', () => {
        showView(agendaView, tabAgenda);
        renderAgendaSummary();
        renderCalendar();
    });

    function renderAgendaSummary() {
         agendaServiceList.innerHTML = bookingState.services.map(s => `
            <div class="flex justify-between">
                <span>${s.name}</span>
                <span class="font-medium">R$${s.price.toFixed(2).replace('.', ',')}</span>
            </div>`).join('');
        agendaTotal.textContent = `R$${bookingState.total.toFixed(2).replace('.', ',')}`;
    }

    function renderCalendar() {
        // ... (código do calendário continua o mesmo)
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0,0,0,0);
        let calendarHTML = `...`; // O HTML é grande, omitido para brevidade, mas é o mesmo
        calendarContainer.innerHTML = calendarHTML;
        // ... (event listeners do calendário continuam os mesmos)
    }
    
    function renderTimeSlots() {
        // ... (código dos horários continua o mesmo)
    }

    function checkIfReadyToProceed() {
        if (bookingState.date && bookingState.time) {
            goToFormFromAgendaBtn.disabled = false;
        } else {
            goToFormFromAgendaBtn.disabled = true;
        }
    }
    
    goToFormFromAgendaBtn.addEventListener('click', () => {
        showView(formView, tabForm);
        const formProcedureCheckboxes = document.querySelectorAll('input[name="procedure"]') as NodeListOf<HTMLInputElement>;
        formProcedureCheckboxes.forEach(cb => cb.checked = false); 
        bookingState.services.forEach(service => {
            const matchingCheckbox = document.querySelector(`input[name="procedure"][value="${service.value}"]`) as HTMLInputElement;
            if (matchingCheckbox) {
                matchingCheckbox.checked = true;
            }
        });
    });

    // --- Lógica do Formulário ---
    function openPasswordModal() {
        passwordModal.classList.remove('hidden');
        passwordInput.focus();
    }

    function closePasswordModal() {
        passwordModal.classList.add('hidden');
        passwordInput.value = '';
        passwordError.classList.add('hidden');
    }

    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (passwordInput.value === 'Apolo@0606') { // Senha de acesso ao relatório
            sessionStorage.setItem('isAuthenticated', 'true');
            closePasswordModal();
            showView(reportView, tabReport);
            loadReport();
        } else {
            passwordError.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    cancelPassword.addEventListener('click', closePasswordModal);
    
    // ... (restante da lógica do formulário, como setupConditionalField, etc. continua a mesma)

    // MODIFICADO: A função de submit agora é 'async' para salvar no Firebase
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // ... (toda a validação e coleta de dados do formulário continua a mesma)
        const fullName = (document.getElementById('fullName') as HTMLInputElement).value;
        // ... (coleta de todas as outras variáveis)
        const signature = (document.getElementById('signature') as HTMLInputElement).value;
        const todayFormatted = new Date().toLocaleDateString('pt-BR');

        const clientRecord = {
            id: Date.now(),
            name: fullName,
            phone: (document.getElementById('phone') as HTMLInputElement).value,
            procedure: bookingState.services.map(s => s.name).join(', '),
            registrationDate: todayFormatted,
            appointmentDateTime: `${bookingState.displayDate} às ${bookingState.time}`,
            fullData: { /* ... (todos os dados detalhados) */ }
        };

        // MODIFICADO: Troca localStorage por Firebase
        try {
            await salvarCliente(clientRecord);

            // ... (código para montar a mensagem do WhatsApp continua o mesmo)
            const whatsappUrl = `...`;
            window.open(whatsappUrl, '_blank');

            // ... (código para mostrar o modal de confirmação continua o mesmo)
            // ... ao fechar o modal, chama resetBookingProcess()
            
        } catch (error) {
            console.error("Erro ao salvar cliente: ", error);
            alert("Ocorreu um erro ao salvar a ficha. Por favor, tente novamente.");
        }
    });
    
    function resetBookingProcess() {
         // ... (código de reset continua o mesmo)
    }

    // --- Lógica do Relatório ---
    // NOVO: Função para salvar cliente no Firebase
    async function salvarCliente(clientData: any) {
        console.log("Salvando cliente no Firebase...");
        // Usa o ID como nome do documento para garantir que seja único
        await db.collection("clientesAnamnese").doc(String(clientData.id)).set(clientData);
        console.log("Cliente salvo com sucesso!");
    }

    // MODIFICADO: loadReport agora inicia um ouvinte em tempo real
    function loadReport() {
        const tableBody = document.getElementById('reportTableBody') as HTMLTableSectionElement;
        const noClientsMessage = document.getElementById('noClientsMessage') as HTMLParagraphElement;

        db.collection("clientesAnamnese").orderBy("id", "desc").onSnapshot(querySnapshot => {
            const clients: any[] = [];
            querySnapshot.forEach(doc => {
                clients.push(doc.data());
            });

            clientesDoRelatorio = clients; // Salva na variável global para exportação

            tableBody.innerHTML = '';
            if (clients.length === 0) {
                noClientsMessage.classList.remove('hidden');
            } else {
                noClientsMessage.classList.add('hidden');
                clients.forEach(client => {
                    const row = `
                        <tr class="hover:bg-pink-50/50">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${client.name}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.phone}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.procedure}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.registrationDate}</td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });
            }
        }, error => {
            console.error("Erro ao carregar relatório: ", error);
            noClientsMessage.textContent = "Erro ao carregar dados.";
            noClientsMessage.classList.remove('hidden');
        });
    }

    // MODIFICADO: Funções de exportação usam a variável global 'clientesDoRelatorio'
    document.getElementById('downloadCsv')!.addEventListener('click', () => {
        const clients = clientesDoRelatorio;
        if (clients.length === 0) { alert('Nenhum cliente para exportar.'); return; }
        // ... (lógica de criar CSV continua a mesma, usando a variável 'clients')
    });

    document.getElementById('downloadPdf')!.addEventListener('click', () => {
        const clients = clientesDoRelatorio;
        if (clients.length === 0) { alert('Nenhum cliente para exportar.'); return; }
        // ... (lógica de criar PDF continua a mesma, usando a variável 'clients')
    });
    
    // --- Restauração da UI ao carregar a página (continua a mesma) ---
    const serviceCheckboxes = serviceList.querySelectorAll('input[name="serviceSelection"]') as NodeListOf<HTMLInputElement>;
    serviceCheckboxes.forEach(checkbox => {
        const isSelected = bookingState.services.some(s => s.value === (checkbox as HTMLInputElement).value);
        checkbox.checked = isSelected;
    });
    updateBookingSummaryUI();
});
