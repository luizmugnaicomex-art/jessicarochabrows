// --- Declarações para bibliotecas externas ---
declare const jspdf: any;

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
    
    // --- Funções de Persistência de Estado ---
    function saveBookingState() {
        sessionStorage.setItem('bookingState', JSON.stringify(bookingState));
    }

    function loadBookingState() {
        const savedState = sessionStorage.getItem('bookingState');
        if (savedState) {
            bookingState = JSON.parse(savedState);
            if (bookingState.date) {
                // Ensure currentDate reflects the saved date for calendar rendering
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
            loadReport();
        } else {
            openPasswordModal();
        }
    });

    // --- Lógica do Agendamento ---
    
    // 1. Seleção de Serviços
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

    // 2. Visualização do Agendamento (Calendário e Horários)
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

        let calendarHTML = `
            <div class="flex justify-between items-center mb-4">
                <button id="prevMonth" class="p-2 rounded-full hover:bg-pink-100 transition-colors duration-200"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg></button>
                <h3 class="font-semibold text-lg">${monthNames[month]} ${year}</h3>
                <button id="nextMonth" class="p-2 rounded-full hover:bg-pink-100 transition-colors duration-200"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></button>
            </div>
            <div class="grid grid-cols-7 text-center text-sm text-gray-500 mb-2 font-medium">
                <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
            </div>
            <div class="grid grid-cols-7 text-center gap-1">
        `;

        for (let i = 0; i < firstDay; i++) {
            calendarHTML += '<div></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            let classes = 'calendar-day h-9 w-9 flex items-center justify-center cursor-pointer';
            if (dayDate < today) {
                classes += ' disabled';
            }
            if (dateStr === bookingState.date) {
                classes += ' selected';
            }
            
            calendarHTML += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
        }

        calendarHTML += '</div>';
        calendarContainer.innerHTML = calendarHTML;

        document.getElementById('prevMonth')!.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
        document.getElementById('nextMonth')!.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });

        calendarContainer.querySelectorAll('.calendar-day:not(.disabled)').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                bookingState.date = (dayEl as HTMLElement).dataset.date!;
                bookingState.displayDate = new Date(bookingState.date + 'T00:00:00').toLocaleDateString('pt-BR');
                bookingState.time = null; // Reset time on new date selection
                renderCalendar();
                renderTimeSlots();
                checkIfReadyToProceed();
                saveBookingState();
            });
        });
    }
    
    function renderTimeSlots() {
        const selectedDate = new Date(bookingState.date + 'T00:00:00');
        const dayOfWeek = selectedDate.getDay(); // 0=Sunday, 6=Saturday
        
        let availableTimes: string[] = [];
        
        // Weekends (Saturday or Sunday)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            availableTimes = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
        } 
        // Weekdays (Monday to Friday)
        else {
            availableTimes = ['14:00', '14:30', '15:00', '15:30'];
        }

        let timeSlotsHTML = '';
        if(bookingState.date && availableTimes.length > 0) {
            availableTimes.forEach(time => {
                const classes = bookingState.time === time ? 'time-slot selected' : 'time-slot';
                timeSlotsHTML += `<button class="${classes} bg-pink-50 hover:bg-pink-200 text-gray-700 font-semibold py-2 px-2 rounded-lg transition-all duration-200">${time}</button>`;
            });
        } else if (!bookingState.date) {
            timeSlotsHTML = `<p class="text-gray-500 col-span-full">Por favor, selecione uma data para ver os horários disponíveis.</p>`;
        } else {
            timeSlotsHTML = `<p class="text-gray-500 col-span-full">Não há horários disponíveis para este dia.</p>`;
        }

        timeSlotsContainer.innerHTML = timeSlotsHTML;
        
        timeSlotsContainer.querySelectorAll('.time-slot').forEach(slotEl => {
            slotEl.addEventListener('click', () => {
                bookingState.time = slotEl.textContent;
                renderTimeSlots();
                checkIfReadyToProceed();
                saveBookingState();
            });
        });
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
        
        // ** Sincronização de Serviços com o Formulário **
        const formProcedureCheckboxes = document.querySelectorAll('input[name="procedure"]') as NodeListOf<HTMLInputElement>;
        
        // Primeiro, desmarca todos para garantir um estado limpo.
        formProcedureCheckboxes.forEach(cb => cb.checked = false); 
        
        // Em seguida, marca os que foram selecionados anteriormente.
        bookingState.services.forEach(service => {
            const matchingCheckbox = document.querySelector(`input[name="procedure"][value="${service.value}"]`) as HTMLInputElement;
            if (matchingCheckbox) {
                matchingCheckbox.checked = true;
            }
        });
    });


    // --- Lógica do Formulário (Existente com adaptações) ---

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
        if (passwordInput.value === 'Apolo@0606') {
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
    passwordModal.addEventListener('click', (e) => {
        if (e.target === passwordModal) closePasswordModal();
    });

    const setupConditionalField = (radioName: string, detailId: string) => {
        const radios = document.querySelectorAll(`input[name="${radioName}"]`);
        const detailInput = document.getElementById(detailId) as HTMLInputElement;
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                const currentRadio = radio as HTMLInputElement;
                if (currentRadio.value === 'Sim' && currentRadio.checked) {
                    detailInput.classList.remove('hidden'); detailInput.required = true;
                } else {
                    detailInput.classList.add('hidden'); detailInput.required = false; detailInput.value = '';
                }
            });
        });
    };

     const setupOtherField = (radioName: string, detailId: string, checkValue = 'Outro') => {
        const radios = document.querySelectorAll(`input[name="${radioName}"]`);
        const detailInput = document.getElementById(detailId) as HTMLInputElement;
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                const currentRadio = radio as HTMLInputElement;
                if (currentRadio.checked && currentRadio.value === checkValue) {
                    detailInput.classList.remove('hidden'); detailInput.required = true;
                } else {
                    detailInput.classList.add('hidden'); detailInput.required = false; detailInput.value = '';
                }
            });
        });
    };

    setupConditionalField('allergies', 'allergiesDetail');
    setupConditionalField('recentProcedure', 'recentProcedureDetail');
    setupConditionalField('medication', 'medicationDetail');
    setupOtherField('howMet', 'howMetOther');
    
    const procedureOtherCheckbox = document.getElementById('procedureOtherCheckbox') as HTMLInputElement;
    const procedureOtherInput = document.getElementById('procedureOther') as HTMLInputElement;
    procedureOtherCheckbox.addEventListener('change', () => {
        if (procedureOtherCheckbox.checked) {
            procedureOtherInput.classList.remove('hidden');
            procedureOtherInput.required = true;
        } else {
            procedureOtherInput.classList.add('hidden');
            procedureOtherInput.required = false;
            procedureOtherInput.value = '';
        }
    });

    setupConditionalField('browLamination', 'browLaminationDetail');
    
    const setupNoneCheckbox = (checkboxName: string, noneCheckboxId: string) => {
        const checkboxes = document.querySelectorAll(`input[name="${checkboxName}"]`) as NodeListOf<HTMLInputElement>;
        const noneCheckbox = document.getElementById(noneCheckboxId) as HTMLInputElement;

        noneCheckbox.addEventListener('change', () => {
            if (noneCheckbox.checked) {
                checkboxes.forEach(box => {
                    if(box !== noneCheckbox) { box.checked = false; box.disabled = true; }
                });
            } else {
                 checkboxes.forEach(box => box.disabled = false);
            }
        });
         checkboxes.forEach(box => {
            if(box !== noneCheckbox) {
                box.addEventListener('change', () => {
                    if (box.checked) {
                        noneCheckbox.checked = false; noneCheckbox.disabled = true;
                    } else {
                        const anyChecked = [...checkboxes].some(b => b !== noneCheckbox && b.checked);
                        if (!anyChecked) {
                            noneCheckbox.disabled = false;
                        }
                    }
                });
            }
        });
    };

    setupNoneCheckbox('skinCondition', 'skinConditionNone');
    setupNoneCheckbox('otherHealth', 'otherHealthNone');

    const fullNameInput = document.getElementById('fullName') as HTMLInputElement;
    const signatureInput = document.getElementById('signature') as HTMLInputElement;
    const clientNameDisplay = document.getElementById('clientNameDisplay') as HTMLSpanElement;
    fullNameInput.addEventListener('input', () => {
        clientNameDisplay.textContent = fullNameInput.value || '...';
        signatureInput.value = fullNameInput.value;
    });
    signatureInput.addEventListener('input', () => {
        fullNameInput.value = signatureInput.value;
        clientNameDisplay.textContent = signatureInput.value || '...';
    });
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const procedureError = document.getElementById('procedureError') as HTMLParagraphElement;
        procedureError.classList.add('hidden');
        
        if (document.querySelectorAll('input[name="procedure"]:checked').length === 0) {
            procedureError.classList.remove('hidden');
            document.getElementById('procedureError')!.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const getRadioValue = (name: string) => (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value || 'Não preenchido';
        
        // Dados do Formulário
        const fullName = (document.getElementById('fullName') as HTMLInputElement).value;
        const birthDateValue = (document.getElementById('birthDate') as HTMLInputElement).value;
        const birthDate = birthDateValue ? new Date(birthDateValue).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Não informado';
        const phone = (document.getElementById('phone') as HTMLInputElement).value;
        const email = (document.getElementById('email') as HTMLInputElement).value || 'Não informado';
        let howMet = getRadioValue('howMet');
        if (howMet === 'Outro') howMet += `: ${(document.getElementById('howMetOther') as HTMLInputElement).value}`;
        const proceduresSelected = [...document.querySelectorAll('input[name="procedure"]:checked')].map(el => (el as HTMLInputElement).value === 'Outro' ? `Outro: ${(document.getElementById('procedureOther') as HTMLInputElement).value || 'não especificado'}` : (el as HTMLInputElement).value);
        let allergies = getRadioValue('allergies');
        if (allergies === 'Sim') allergies += `: ${(document.getElementById('allergiesDetail') as HTMLInputElement).value}`;
        const pregnant = getRadioValue('pregnant');
        const skinType = getRadioValue('skinType');
        const otherHealthIssues = [...document.querySelectorAll('input[name="otherHealth"]:checked')].map(el => (el as HTMLInputElement).value).join(', ') || 'Nenhuma informada';
        const skinConditions = [...document.querySelectorAll('input[name="skinCondition"]:checked')].map(el => (el as HTMLInputElement).value).join(', ') || 'Nenhuma informada';
        const hasLesions = getRadioValue('hasLesions');
        let recentProcedure = getRadioValue('recentProcedure');
        if (recentProcedure === 'Sim') recentProcedure += `: ${(document.getElementById('recentProcedureDetail') as HTMLInputElement).value}`;
        let browLamination = getRadioValue('browLamination');
        if (browLamination === 'Sim') {
            const laminationDateValue = (document.getElementById('browLaminationDetail') as HTMLInputElement).value;
            browLamination += `: ${laminationDateValue ? new Date(laminationDateValue).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Data não informada'}`;
        }
        let medication = getRadioValue('medication');
        if (medication === 'Sim') medication += `: ${(document.getElementById('medicationDetail') as HTMLInputElement).value}`;
        const currentBrows = (document.getElementById('currentBrows') as HTMLTextAreaElement).value || 'Não preenchido';
        const goal = (document.getElementById('goal') as HTMLTextAreaElement).value || 'Não preenchido';
        const styleScale = (document.getElementById('styleScale') as HTMLInputElement).value;
        const imageAuth = (document.getElementById('imageAuth') as HTMLInputElement).checked ? 'Sim' : 'Não';
        const signature = (document.getElementById('signature') as HTMLInputElement).value;
        const today = new Date();
        const todayFormatted = today.toLocaleDateString('pt-BR');

        const clientRecord = {
            id: Date.now(),
            name: fullName,
            phone: phone,
            procedure: bookingState.services.map(s => s.name).join(', '),
            registrationDate: todayFormatted,
            appointmentDateTime: `${bookingState.displayDate} às ${bookingState.time}`,
            fullData: {
                fullName, birthDate, phone, email, howMet,
                services: bookingState.services,
                total: bookingState.total,
                appointmentDateTime: `${bookingState.displayDate} às ${bookingState.time}`,
                allergies, pregnant, skinType, otherHealthIssues, skinConditions, hasLesions, recentProcedure, browLamination, medication,
                currentBrows, goal, styleScale, imageAuth, signature, todayFormatted
            }
        };

        const clients = JSON.parse(localStorage.getItem('clients')!) || [];
        clients.push(clientRecord);
        localStorage.setItem('clients', JSON.stringify(clients));
        
        const servicesText = bookingState.services.map(s => ` - ${s.name}: R$${s.price.toFixed(2).replace('.', ',')}`).join('\n');
        const message = `
*✨ NOVO AGENDAMENTO E FICHA ✨*

*--- DADOS DO AGENDAMENTO ---*
*Cliente:* ${fullName}
*Data:* ${bookingState.displayDate}
*Horário:* ${bookingState.time}

*--- SERVIÇOS SELECIONADOS ---*
${servicesText}
*Total:* R$${bookingState.total.toFixed(2).replace('.', ',')}

*--- DADOS PESSOAIS ---*
*Nascimento:* ${birthDate}
*Celular:* ${phone}
*E-mail:* ${email}
*Como conheceu:* ${howMet}

*--- HISTÓRICO DE SAÚDE ---*
*Alergias?* ${allergies}
*Grávida/Amamentando?* ${pregnant}
*Tipo de Pele:* ${skinType}
*Outras Condições:* ${otherHealthIssues}
*Condições de Pele:* ${skinConditions}
*Lesões Ativas?* ${hasLesions}
*Proced. Recente?* ${recentProcedure}
*Já fez B. Lamination?* ${browLamination}
*Uso de Ácidos?* ${medication}

*--- EXPECTATIVAS ---*
*Sobrancelhas Hoje:* ${currentBrows}
*Objetivo:* ${goal}
*Escala (Natural/Marcada):* ${styleScale}/5

*--- TERMOS ---*
*Autoriza Uso de Imagem?* ${imageAuth}
*Assinatura:* ${signature}
-----------------------------
Ficha preenchida em ${todayFormatted}.
        `.trim().replace(/^\s+/gm, '');
        
        const whatsappNumber = '5571986301001';
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        
        const confirmationModal = document.createElement('div');
        confirmationModal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50';
        confirmationModal.innerHTML = `
            <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
                <h2 class="text-xl font-bold mb-4 text-gray-800">Agendamento Enviado!</h2>
                <p class="text-gray-600 mb-6">Seu pedido de agendamento foi enviado para confirmação e suas informações foram salvas.</p>
                <button id="closeConfirmModal" class="px-6 py-2 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors duration-200">OK</button>
            </div>
        `;
        document.body.appendChild(confirmationModal);
        document.getElementById('closeConfirmModal')!.onclick = () => {
            document.body.removeChild(confirmationModal);
            resetBookingProcess();
        };
    });
    
    function resetBookingProcess() {
         bookingState = { services: [], total: 0, date: null, time: null, displayDate: null };
         sessionStorage.removeItem('bookingState');
         form.reset();
         clientNameDisplay.textContent = '...';
         (serviceList.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>).forEach(cb => cb.checked = false);
         updateBookingSummaryUI();
         showView(pricesView, tabPrices);
    }

    // Lógica do Relatório
    function loadReport() {
        const clients = JSON.parse(localStorage.getItem('clients')!) || [];
        const tableBody = document.getElementById('reportTableBody') as HTMLTableSectionElement;
        const noClientsMessage = document.getElementById('noClientsMessage') as HTMLParagraphElement;
        tableBody.innerHTML = '';

        if (clients.length === 0) {
            noClientsMessage.classList.remove('hidden');
        } else {
            noClientsMessage.classList.add('hidden');
            clients.sort((a: any, b: any) => b.id - a.id); // Show newest first
            clients.forEach((client: any) => {
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
    }

    document.getElementById('downloadCsv')!.addEventListener('click', () => {
        const clients = JSON.parse(localStorage.getItem('clients')!) || [];
        if (clients.length === 0) { alert('Nenhum cliente para exportar.'); return; }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Nome,Celular,Procedimento,Data Agendamento,Data Cadastro\n"; // Cabeçalho
        clients.forEach((client: any) => {
            const procedure = client.procedure.replace(/,/g, ';'); // Replace commas to avoid CSV issues
            csvContent += `${client.name},${client.phone},"${procedure}",${client.appointmentDateTime || ''},${client.registrationDate}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "relatorio_clientes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById('downloadPdf')!.addEventListener('click', () => {
        const clients = JSON.parse(localStorage.getItem('clients')!) || [];
        if (clients.length === 0) { alert('Nenhum cliente para exportar.'); return; }

        const doc = new jsPDF();
        doc.text("Relatório de Clientes", 14, 16);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

        const tableColumn = ["Nome", "Celular", "Procedimento", "Agendamento", "Data Cadastro"];
        const tableRows: any[] = [];

        clients.forEach((client: any) => {
            const clientData = [
                client.name,
                client.phone,
                client.procedure,
                client.appointmentDateTime || 'N/A',
                client.registrationDate
            ];
            tableRows.push(clientData);
        });

        // @ts-ignore
        doc.autoTable(tableColumn, tableRows, { startY: 30 });
        doc.save('relatorio_clientes.pdf');
    });
    
    // --- Restauração da UI ao carregar a página ---
    const serviceCheckboxes = serviceList.querySelectorAll('input[name="serviceSelection"]') as NodeListOf<HTMLInputElement>;
    serviceCheckboxes.forEach(checkbox => {
        const isSelected = bookingState.services.some(s => s.value === checkbox.value);
        checkbox.checked = isSelected;
    });
    updateBookingSummaryUI();

});
