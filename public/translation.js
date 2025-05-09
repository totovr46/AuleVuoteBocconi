const translations = {
        it: {
            title: "Aule Vuote Bocconi",
            description: "Questo strumento analizza le aule vuote nell'Università Bocconi che non sono classificate come \"aule studio\" sul sito ufficiale",
            disclaimer: [
                "La disponibilità indicata non garantisce l'effettiva accessibilità delle aule",
                "Questo servizio è puramente informativo e non intende sostituire le risorse ufficiali",
                "L'Università Bocconi non è responsabile per le informazioni qui riportate"
            ],
            searchFrom: "Cerca dalle:",
            searchTo: "Alle:",
            searchRoom: "Cerca Aula:",
            filterBuilding: "Filtra per edificio:",
            allBuildings: "Tutti gli edifici",
            buildings: {
                "sarfatti 25": "Leoni (Sarfatti 25)",
                "sraffa 13": "Velodromo (Sraffa 13)"
            },
            updateData: "Aggiorna Dati",
            analyzing: "Analisi in corso...",
            results: "Risultati dell'Analisi"
        },
        en: {
            title: "Bocconi Empty Classrooms",
            description: "This tool analyzes empty classrooms at Bocconi University that are not classified as \"study rooms\" on the official website",
            disclaimer: [
                "The indicated availability does not guarantee actual classroom accessibility",
                "This service is purely informational and is not intended to replace official resources",
                "Bocconi University is not responsible for the information reported here"
            ],
            searchFrom: "Search from:",
            searchTo: "To:",
            searchRoom: "Search Room:",
            filterBuilding: "Filter by building:",
            allBuildings: "All buildings",
            buildings: {
                "sarfatti 25": "Leoni (Sarfatti 25)",
                "sraffa 13": "Velodromo (Sraffa 13)"
            },
            updateData: "Update Data",
            analyzing: "Analysis in progress...",
            results: "Analysis Results"
        }
    };
    
    let currentLang = 'it';
    
    function toggleLanguage() {
        currentLang = currentLang === 'it' ? 'en' : 'it';
        const btn = document.querySelector('.language-btn');
        btn.textContent = currentLang === 'it' ? '🇬🇧 English' : '🇮🇹 Italiano';
        updatePageContent();
    }
    
    function updatePageContent() {
        const t = translations[currentLang];
        
        document.querySelector('h1').textContent = t.title;
        document.title = t.title;
        
        const descriptionP = document.querySelector('p');
        descriptionP.innerHTML = `${t.description} (<a href="https://didattica.unibocconi.it/aule/lista_orario.php" target="_blank">didattica.unibocconi.it</a>).`;
        
        const disclaimerItems = document.querySelectorAll('ul li');
        t.disclaimer.forEach((text, index) => {
            disclaimerItems[index].textContent = text;
        });
        
        document.querySelector('label[for="startTime"]').textContent = t.searchFrom;
        document.querySelector('label[for="endTime"]').textContent = t.searchTo;
        document.querySelector('label[for="searchAula"]').textContent = t.searchRoom;
        document.querySelector('label[for="filterEdificio"]').textContent = t.filterBuilding;
        
        const select = document.querySelector('#filterEdificio');
        select.options[0].textContent = t.allBuildings;
        
        document.querySelector('#refreshBtn').textContent = t.updateData;
        document.querySelector('.loading p').textContent = t.analyzing;
        document.querySelector('#results h2').textContent = t.results;
    }