// Fix for the script.obfuscated.js
document.addEventListener('DOMContentLoaded', function() {
    const refreshBtn = document.getElementById('refreshBtn');
    const results = document.getElementById('results');
    const auleContainer = document.getElementById('auleContainer');
    const dataInfo = document.getElementById('dataInfo');
    const loading = document.querySelector('.loading');
    const errorMsg = document.getElementById('errorMsg');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const searchAulaInput = document.getElementById('searchAula');
    const filterEdificioSelect = document.getElementById('filterEdificio');
    
    // Carica i dati automaticamente all'avvio
    fetchData();
    
    refreshBtn.addEventListener('click', function() {
        fetchData();
    });
    
    function fetchData() {
        errorMsg.style.display = 'none';
        loading.style.display = 'block';
        results.style.display = 'none';
        
        fetch('/cache_orario.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Errore nel recupero dei dati dal file cache');
                }
                return response.json();
            })
            .then(cacheData => {
                // Verifica che i dati non siano troppo vecchi (più di 35 minuti)
                const now = Date.now();
                const cacheAge = now - cacheData.timestamp;
                if (cacheAge > 35 * 60 * 1000) {
                    showError("Attenzione: i dati potrebbero non essere aggiornati");
                }
                processData(cacheData.data);
            })
            .catch(error => {
                showError("Errore nel recupero dei dati: " + error.message);
                loading.style.display = 'none';
            });
    }

    
    function processData(data) {
        try {
            if (!data || data.length === 0) {
                throw new Error("Nessun dato ricevuto dal server o dati vuoti.");
            }
            
            // Converti i dati nel formato atteso dalla funzione di analisi
            const lessons = data.map(item => ({
                data: item.data,
                inizio: item.dalle,
                fine: item.alle,
                tipo: item.tipo,
                codice: item.codice,
                descrizione: item.corso,
                docenti: item.docente,
                aula: item.aula
            }));
            
            // Otteniamo gli orari di inizio e fine della giornata lavorativa
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;
            
            // Analizziamo la disponibilità delle aule
            const auleDisponibilita = analizzaDisponibilita(lessons, startTime, endTime);
            
            // Mostra i risultati
            displayResults(auleDisponibilita, lessons[0].data);
            
        } catch (error) {
            showError("Errore nell'analisi dei dati: " + error.message);
        } finally {
            loading.style.display = 'none';
        }
    }
    
    function analizzaDisponibilita(lessons, startTime, endTime) {
        const auleMap = {};

        lessons.forEach(lesson => {
            if (!auleMap[lesson.aula]) {
                auleMap[lesson.aula] = [];
            }

            auleMap[lesson.aula].push({
                inizio: lesson.inizio,
                fine: lesson.fine,
                descrizione: lesson.descrizione,
                docenti: lesson.docenti
            });
        });

        const auleDisponibilita = {};

        for (const aula in auleMap) {
            const lezioni = auleMap[aula].sort((a, b) => {
                return convertTimeToMinutes(a.inizio) - convertTimeToMinutes(b.inizio);
            });

            const slotLiberi = calcolaSlotLiberi(lezioni, startTime, endTime);

            auleDisponibilita[aula] = {
                lezioni: lezioni.filter(l => {
                    const start = convertTimeToMinutes(l.inizio);
                    return start < convertTimeToMinutes(endTime) && 
                          convertTimeToMinutes(l.fine) > convertTimeToMinutes(startTime);
                }),
                slotLiberi: slotLiberi
            };
        }

        return auleDisponibilita;
    }
    
    function calcolaSlotLiberi(lezioni, startTime, endTime) {
        const slotLiberi = [];
        let currentTime = startTime;

        const startMinutes = convertTimeToMinutes(startTime);
        const endMinutes = convertTimeToMinutes(endTime);

        for (const lezione of lezioni) {
            const lezioneStartMinutes = convertTimeToMinutes(lezione.inizio);

            // Se la lezione è prima dell'intervallo richiesto, saltala
            if (convertTimeToMinutes(lezione.fine) <= startMinutes) {
                currentTime = lezione.fine;
                continue;
            }

            // Se la lezione è dopo l'intervallo richiesto, esci dal ciclo
            if (lezioneStartMinutes >= endMinutes) {
                break;
            }

            // Se c'è un gap tra l'orario corrente e l'inizio della lezione
            if (lezioneStartMinutes > convertTimeToMinutes(currentTime)) {
                const slotStart = Math.max(convertTimeToMinutes(currentTime), startMinutes);
                const slotEnd = Math.min(lezioneStartMinutes, endMinutes);
                
                if (slotEnd > slotStart) {
                    const durata = slotEnd - slotStart;
                    
                    slotLiberi.push({
                        inizio: convertMinutesToTime(slotStart),
                        fine: convertMinutesToTime(slotEnd),
                        durata: formatDuration(durata),
                        durataMinuti: durata
                    });
                }
            }

            currentTime = lezione.fine;
        }

        // Controlla se c'è spazio dopo l'ultima lezione fino alla fine della giornata
        const lastEndMinutes = Math.min(convertTimeToMinutes(currentTime), endMinutes);
        if (endMinutes > lastEndMinutes) {
            const slotStart = Math.max(lastEndMinutes, startMinutes);
            if (endMinutes > slotStart) {
                const durata = endMinutes - slotStart;
                
                slotLiberi.push({
                    inizio: convertMinutesToTime(slotStart),
                    fine: endTime,
                    durata: formatDuration(durata),
                    durataMinuti: durata
                });
            }
        }

        return slotLiberi.filter(slot => slot.durataMinuti > 15);
    }
    
    function convertMinutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    function convertTimeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    function formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours === 0) {
            return `${mins} minuti`;
        } else if (mins === 0) {
            return `${hours} ${hours === 1 ? 'ora' : 'ore'}`;
        } else {
            return `${hours} ${hours === 1 ? 'ora' : 'ore'} e ${mins} minuti`;
        }
    }
    
    
    function displayResults(auleDisponibilita, data) {
        // Pulisci i contenitori
        auleContainer.innerHTML = '';
        
        // Imposta le informazioni sulla data
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        dataInfo.textContent = `Data: ${data} | Orario lavorativo: ${startTime} - ${endTime}`;
        
        // Recupera il valore del filtro corrente
        const searchTerm = searchAulaInput.value.toLowerCase();
        
        // Visualizza le informazioni per ogni aula
        for (const aula in auleDisponibilita) {
            // Salta le aule che non iniziano con "Aula"
            if (!aula.startsWith('Aula')) {
                continue;
            }
            
            const aulaInfo = auleDisponibilita[aula];
            
            // Se non ci sono slot liberi, salta questa aula
            if (aulaInfo.slotLiberi.length === 0) {
                continue;
            }
            
            // Crea l'elemento per l'aula
            const aulaElement = document.createElement('div');
            aulaElement.className = 'aula';
            
            // Crea l'header
            const headerElement = document.createElement('div');
            headerElement.className = 'header';
            
            const titleElement = document.createElement('h3');
            titleElement.textContent = aula;
            headerElement.appendChild(titleElement);
            
            aulaElement.appendChild(headerElement);
            
            // Aggiungi gli orari occupati
            const occupiedTitle = document.createElement('p');
            occupiedTitle.innerHTML = '<strong>Orari occupati:</strong>';
            aulaElement.appendChild(occupiedTitle);
            
            const occupiedList = document.createElement('ul');
            aulaInfo.lezioni.forEach(lezione => {
                const listItem = document.createElement('li');
                listItem.textContent = `${lezione.inizio} - ${lezione.fine} (${lezione.descrizione}, Docente: ${lezione.docenti})`;
                occupiedList.appendChild(listItem);
            });
            
            aulaElement.appendChild(occupiedList);
            
            // Aggiungi gli slot liberi
            const freeTitle = document.createElement('p');
            freeTitle.innerHTML = '<strong>Fasce orarie libere:</strong>';
            aulaElement.appendChild(freeTitle);
            
            aulaInfo.slotLiberi.forEach(slot => {
                const slotElement = document.createElement('div');
                slotElement.className = 'slot-libero';
                
                slotElement.textContent = `${slot.inizio} - ${slot.fine} (durata: ${slot.durata})`;
                aulaElement.appendChild(slotElement);
            });
            
            auleContainer.appendChild(aulaElement);
        }
        
        // Applica il filtro alle aule
        applyFilters();

        // Mostra i risultati
        results.style.display = 'block';
    }
    
    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }

    // Funzione per filtrare le aule in base al nome e all'edificio
    function applyFilters() {
        const searchTerm = searchAulaInput.value.toLowerCase();
        const edificioFilter = filterEdificioSelect.value.toLowerCase();
        const aule = auleContainer.querySelectorAll('.aula');

        // Filtra le aule
        aule.forEach(aula => {
            const aulaName = aula.querySelector('h3').textContent.toLowerCase();
            const matchesSearch = aulaName.includes(searchTerm);
            const matchesEdificio = edificioFilter === '' || aulaName.includes(edificioFilter);
            
            aula.style.display = (matchesSearch && matchesEdificio) ? 'block' : 'none';
        });
    }

    // Aggiungi event listener al filtro per edificio
    filterEdificioSelect.addEventListener('change', applyFilters);
    
    // Aggiorna l'event listener per la ricerca per aula
    searchAulaInput.addEventListener('input', applyFilters);
});