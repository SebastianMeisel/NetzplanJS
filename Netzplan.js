class Arbeitspaket {
    constructor(id, dauer, vorgaenger = [], nachfolger = []) {
	this.id = id;
	this.dauer = dauer;
	this.vorgaenger = vorgaenger;
	this.nachfolger = nachfolger;
	this.FAZ = 0;
	this.FEZ = 0;
	this.SAZ = 0;
	this.SEZ = 0;
	this.GP = 0;
	this.FP = 0;
	this.gridRow = null; // Platz im Grid des Netzplans
	this.gridColumn = null; // Platz im Grid des Netzplans
    }
    
    Folge(vorgaengerID, projekt) {
	// Füge dieses Arbeitspaket als Nachfolger des Vorgängers hinzu
	const vorgaengerAP = projekt.arbeitspakete.find(ap => ap.id === vorgaengerID);
	if (vorgaengerAP) {
	    vorgaengerAP.nachfolger.push(this.id);
	    this.vorgaenger.push(vorgaengerID);
	}
    }

    getFXZ(projekt) {
	// Berechnet die früheste Anfangs- und Endzeit des Arbeitspakets
	this.FAZ = this.vorgaenger.length ? Math.max(...this.vorgaenger.map(vorgaengerID => {
            const vorgaenger = projekt.arbeitspakete.find(ap => ap.id === vorgaengerID);
            return vorgaenger ? vorgaenger.FEZ : 0;
	})) : 0;
	this.FEZ = this.dauer + this.FAZ;
	return [this.FAZ, this.FEZ];
    }

    getSXZ(projekt) {
	// Berechnet die späteste Anfangs- und Endzeit sowie die Puffer des Arbeitspakets
	this.SEZ = this.nachfolger.length ? Math.min(...this.nachfolger.map(nachfolgerID => {
            const nachfolger = projekt.arbeitspakete.find(ap => ap.id === nachfolgerID);
            return nachfolger ? nachfolger.SAZ : Infinity;
	})) : this.FEZ;
	this.SAZ = this.SEZ - this.dauer;
	this.GP = this.SEZ - this.FEZ;
	this.FP = this.nachfolger.length ? Math.min(...this.nachfolger.map(nachfolgerID => {
            const nachfolger = projekt.arbeitspakete.find(ap => ap.id === nachfolgerID);
            return nachfolger ? nachfolger.FAZ : Infinity;
	})) - this.FEZ : 0;
	return [this.SAZ, this.SEZ, this.GP, this.FP];
    }

    sortiereNachfolger(projekt) {
	// Überprüfen, ob das Projekt definiert ist
	if (!projekt || !projekt.arbeitspakete) {
            return;
	}

	// Sortiere nachfolger basierend auf dem GP-Wert
	this.nachfolger.sort((aId, bId) => {
            const a = projekt.arbeitspakete.find(ap => ap.id === aId);
            const b = projekt.arbeitspakete.find(ap => ap.id === bId);

            // Überprüfen, ob das Arbeitspaket 'a' oder 'b' gefunden wurde
            if (!a || !b) {
		return 0;
            }

            return a.GP - b.GP; // Sortiere aufsteigend nach GP
	});

	// Entferne das Arbeitspaket selbst aus seinem nachfolger-Array
	this.nachfolger = this.nachfolger.filter(nfId => nfId !== this.id);
    }
}

class Projekt {
    // Konstruktor für die Projekt-Klasse
    constructor(id) {
        this.id = id; // Eindeutige ID für das Projekt
        this.arbeitspakete = []; // Liste aller Arbeitspakete im Projekt
        this.kritischerPfad = []; // Liste der IDs der Arbeitspakete im kritischen Pfad
    }

    // Methode zum Generieren eines zufälligen Netzplans
    generateRandomNetzplan() {
        // Erstelle ein erstes Arbeitspaket ohne Vorgänger
        const apA = new Arbeitspaket("A", Math.floor(Math.random() * 10) + 1);
        this.arbeitspakete.push(apA);

        // Erstelle weitere Arbeitspakete mit zufälligen Vorgängern
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const maxTries = 10; // Maximale Anzahl der Versuche, einen geeigneten Vorgänger zu finden

        for (let i = 1; i < 10; i++) {
            const id = alphabet[i];
            const dauer = Math.floor(Math.random() * 10) + 1;

            // Wähle zufällige Vorgänger
            let vorgaengerCount = Math.floor(Math.random() * 3) + 1;
            vorgaengerCount = Math.min(vorgaengerCount, this.arbeitspakete.length);
            const vorgaengerSet = new Set();

            // Wähle zufällige Vorgänger aus, ohne doppelte oder verschachtelte Vorgänger
            while (vorgaengerSet.size < vorgaengerCount) {
                let tries = 0; // Zähler für die Anzahl der Versuche
                while (tries < maxTries) {
                    const randomIndex = Math.floor(Math.random() * this.arbeitspakete.length);
                    const vorgaengerID = this.arbeitspakete[randomIndex].id;

                    // Überprüfe, ob der Vorgänger bereits ein Vorgänger eines der Vorgänger ist
                    let isNestedVorgaenger = false;
                    for (const existingVorgaengerID of vorgaengerSet) {
                        const existingVorgaenger = this.arbeitspakete.find(ap => ap.id === existingVorgaengerID);
                        if (existingVorgaenger && existingVorgaenger.vorgaenger.includes(vorgaengerID)) {
                            isNestedVorgaenger = true;
                            break;
                        }
                    }

                    if (!isNestedVorgaenger) {
                        vorgaengerSet.add(vorgaengerID);
                        break; // Beenden Sie die innere Schleife, wenn ein geeigneter Vorgänger gefunden wurde
                    }

                    tries++;
                }

                if (tries >= maxTries) {
                    break; // Beenden Sie die äußere Schleife, wenn die maximale Anzahl der Versuche erreicht ist
                }
            }

            // Füge Vorgänger und Nachfolger hinzu
            const ap = new Arbeitspaket(id, dauer);
            for (const vorgaengerID of vorgaengerSet) {
                ap.Folge(vorgaengerID, this);
            }

            this.arbeitspakete.push(ap);
        }

        // Stelle sicher, dass jedes AP (außer dem letzten) mindestens einen Nachfolger hat
        for (let i = 0; i < this.arbeitspakete.length - 1; i++) {
            const ap = this.arbeitspakete[i];
            if (ap.nachfolger.length === 0) {
                const randomIndex = Math.floor(Math.random() * (this.arbeitspakete.length - i - 1)) + i + 1;
                const nachfolgerID = this.arbeitspakete[randomIndex].id;
                ap.nachfolger.push(nachfolgerID);
                this.arbeitspakete[randomIndex].vorgaenger.push(ap.id);
            }
        }
    }


    // Methode zum Anzeigen der Liste der Arbeitspakete
    showArbeitsPaketListe() {
	if (this.arbeitspakete[0].FEZ === 0) {
	    this.durchRechnen(); // Durchrechnen vor dem Anzeigen der Liste
	}
        // Erstelle die Tabelle und füge sie zum Container hinzu
        const container = document.getElementById("arbeitspaketliste");
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");

        // Erstelle die Überschriften
        const headers = ["ID", "Dauer", "Vorgänger"]; //, "FAZ", "FEZ", "SAZ", "SEZ", "GP", "FP"];
        const headerRow = document.createElement("tr");
        headers.forEach(header => {
            const th = document.createElement("th");
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Füge die Daten hinzu
        this.arbeitspakete.forEach(ap => {	    
            const row = document.createElement("tr");
            const cells = [
                ap.id,
                ap.dauer,
                ap.vorgaenger.join(", "),
                // ap.FAZ,
                // ap.FEZ,
                // ap.SAZ,
                // ap.SEZ,
                // ap.GP,
                // ap.FP
            ];

            cells.forEach(cellData => {
                const cell = document.createElement("td");
                cell.textContent = cellData;
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        container.appendChild(table);

        // Kritischen Pfad ausgeben
        const kritPathElement = document.createElement("p");
        kritPathElement.textContent = "Kritischer Pfad: [" + this.kritischerPfad.reverse().join(" - ") + "]";
        container.appendChild(kritPathElement);
    }

    // Methode zum Durchrechnen der Arbeitspakete
    durchRechnen() {
        const startAp = this.arbeitspakete[0];
        this.vorwaertsRechnen(startAp);
        const endAp = this.findeEndArbeitsPaket();
        this.rueckwaertsRechnen(endAp);
    }

    // Methode zum Vorwärtsrechnen der Arbeitspakete
    vorwaertsRechnen(ap) {
        ap.getFXZ(this);
        ap.nachfolger.forEach(nfId => {
            const nf = this.arbeitspakete.find(a => a.id === nfId);
            this.vorwaertsRechnen(nf);
        });
    }

    // Methode zum Rückwärtsrechnen der Arbeitspakete
    rueckwaertsRechnen(ap) {
        ap.getSXZ(this);
        if (ap.GP === 0 && !this.kritischerPfad.includes(ap.id)) {
            this.kritischerPfad.push(ap.id);
        }
        ap.vorgaenger.forEach(vgId => {
            const vg = this.arbeitspakete.find(a => a.id === vgId);
            this.aktualisiereVorgaengerNachfolger(vg.id, ap.id)
            this.rueckwaertsRechnen(vg);
        });
    }

    // Methode zum Aktualisieren der Vorgänger-Nachfolger-Beziehungen
    aktualisiereVorgaengerNachfolger(vgId, apId) {
        const vg = this.arbeitspakete.find(a => a.id === vgId);
        const ap = this.arbeitspakete.find(a => a.id === apId);

        if (!vg || !ap) {
            return;
        }

        for (let i = 0; i < vg.nachfolger.length; i++) {
            const nfId = vg.nachfolger[i];
            if (nfId === apId) {
                vg.nachfolger[i] = apId;
            }
        }
    }

    // Methode zum Finden des End-Arbeitspakets
    findeEndArbeitsPaket() {
        for (let i = this.arbeitspakete.length - 1; i >= 0; i--) {
            if (this.arbeitspakete[i].nachfolger.length === 0) {
                return this.arbeitspakete[i];
            }
        }
        throw new Error("Kein Endknoten (letztes ArbeitsPaket) gefunden!");
    }

    // Methode zum Anzeigen des kritischen Pfads
    zeigeKritischenPfad() {
        this.durchRechnen();
    }

    zeigeNetzplan() {
        const netzplan = new Netzplan(this);
	if (this.arbeitspakete[0].FEZ === 0) {
	    this.durchRechnen(); // Durchrechnen vor dem Anzeigen der Liste
	}
        netzplan.zeichne();
    }
}

class Netzplan {
    constructor(projekt) {
        this.projekt = projekt;
        this.gridContainer = document.getElementById("grid-container");
        this.platzierteAPs = new Set();
	this.arbeitspakete = projekt.arbeitspakete
    }

    zeichne() {
	Netzplan.bind(this);
        const kritischerPfadLaenge = this.projekt.kritischerPfad.length;
        this.gridContainer.style.gridTemplateColumns = `repeat(20,100px)`;
        this.gridContainer.style.gridTemplateRows = `repeat(8, 100px)`;

        const startAp = this.projekt.arbeitspakete[0];
        this.einfuegenArbeitspakete(startAp, 1, 1);
	
        // Rufe verbindeNodes für jedes Arbeitspaket auf
        this.arbeitspakete.forEach(ap => this.verbindeNodes(ap.id));
    }

    verbindeNodes(apID) {
        let ap = this.projekt.arbeitspakete.find(ap => ap.id === apID);
        let nachfolger = ap.nachfolger;
	const colorPalette = {
	    'A': '#666666', // Gray
	    'B': '#FF6B6B', // Red
	    'C': '#4DB6AC', // Teal
	    'D': '#FFD54F', // Yellow
	    'E': '#304FFE', // Blue
	    'F': '#C0CA33', // Lime
	    'G': '#8E24AA', // Purple
	    'H': '#FFAB40', // Orange
	    'I': '#00ACC1', // Cyan
	    'J': '#7CB342'  // Light Green
	};
	let lineColor = colorPalette[ap.id];
	
        nachfolger.forEach(nachfolgerID => {
            let nachfolgerAP = this.projekt.arbeitspakete.find(ap => ap.id === nachfolgerID);

            // Erstelle den .lines-Container für den aktuellen Nachfolger
            let linesContainer = document.createElement('div');
            linesContainer.className = 'lines';
            linesContainer.style.gridTemplateColumns = '1fr 1fr'; // Vorgänger, Nachfolger

            // Setze gridRow und gridColumn für den .lines-Container
            linesContainer.style.gridRowStart = ap.gridRow;
            linesContainer.style.gridColumnStart = ap.gridColumn + 1;

            let line = document.createElement('div');
            line.className = 'line';
	    line.style.backgroundColor = lineColor;

            if (ap.gridRow === nachfolgerAP.gridRow) {
                line.classList.add('o');
            } else if (ap.gridRow > nachfolgerAP.gridRow) {
                line.classList.add('no');
            } else {
                line.classList.add('so');
            }
            linesContainer.appendChild(line);

	    // Füge den .lines-Container in das Grid ein
            let gridContainer = document.getElementById('grid-container');
            gridContainer.appendChild(linesContainer);
	    
	    // Erstelle den .lines-Container für den aktuellen Nachfolger
            let nfLinesContainer = document.createElement('div');
            nfLinesContainer.className = 'lines';
            nfLinesContainer.style.gridTemplateColumns = '1fr 1fr'; // Vorgänger, Nachfolger

            // Setze gridRow und gridColumn für den .lines-Container
            nfLinesContainer.style.gridRowStart = nachfolgerAP.gridRow;
            nfLinesContainer.style.gridColumnStart = nachfolgerAP.gridColumn - 1;
	    
            // Linie vor dem Nachfolger
            let lineBeforeSuccessor = document.createElement('div');
            lineBeforeSuccessor.className = 'line';
    	    lineBeforeSuccessor.style.backgroundColor = lineColor;


            if (ap.gridRow === nachfolgerAP.gridRow) {
                lineBeforeSuccessor.classList.add('w');
            } else if (ap.gridRow > nachfolgerAP.gridRow) {
                lineBeforeSuccessor.classList.add('sw');
            } else {
                lineBeforeSuccessor.classList.add('nw');
            }
            nfLinesContainer.appendChild(lineBeforeSuccessor);

            // Füge den .lines-Container in das Grid ein
            gridContainer.appendChild(nfLinesContainer);

            // Erstelle den verticalLinesContainer für den aktuellen Nachfolger
            if (ap.gridRow == nachfolgerAP.gridRow) {
            } else if (ap.gridRow > nachfolgerAP.gridRow) {
		// Füge .line-.nl-DIVs in der gridColumn neben dem Arbeitspaket (AP) ein
		for (let i = ap.gridRow - 1; i >= nachfolgerAP.gridRow + 1; i--) {
		    let verticalLinesContainer = document.createElement('div');
		    verticalLinesContainer.className = 'lines';
		    verticalLinesContainer.style.gridTemplateColumns = '1fr 1fr'; // Vorgänger, Nachfolger
		    // Setze gridRow und gridColumn für den verticalLinesContainer
		    verticalLinesContainer.style.gridRowStart = i;
		    verticalLinesContainer.style.gridColumnStart = ap.gridColumn + 1;
                    let lineDiv = document.createElement('div');
                    lineDiv.className = 'n';
	    	    lineDiv.style.backgroundColor = lineColor;
                    verticalLinesContainer.appendChild(lineDiv);
		    // Füge den verticalLinesContainer in das Grid ein
		    gridContainer.appendChild(verticalLinesContainer);

		}
	    } else {

		// Füge .line-.sl-DIVs in der gridColumn neben dem Arbeitspaket (AP) ein
		for (let i = ap.gridRow + 1; i <= nachfolgerAP.gridRow - 1; i++) {
		    let verticalLinesContainer = document.createElement('div');
		    verticalLinesContainer.className = 'lines';
		    verticalLinesContainer.style.gridTemplateColumns = '1fr 1fr'; // Vorgänger, Nachfolger

		    // Setze gridRow und gridColumn für den verticalLinesContainer
		    verticalLinesContainer.style.gridRowStart = i;
		    verticalLinesContainer.style.gridColumnStart = ap.gridColumn + 1;
                    let lineDiv = document.createElement('div');
                    lineDiv.className = 's';
		    lineDiv.style.backgroundColor = lineColor;
                    verticalLinesContainer.appendChild(lineDiv);
		    // Füge den verticalLinesContainer in das Grid ein
		    gridContainer.appendChild(verticalLinesContainer);
		}
            }

            // Erstelle den horizontalLinesContainer für den aktuellen Nachfolger
	    if (ap.gridColumn === nachfolgerAP.gridColumn - 2 || (nachfolgerAP.gridRow === 1 && ap.gridRow === 1)) {
		// Skip line because it is a self-loop or a loop between two adjacent nodes
	    } else if (ap.gridRow === nachfolgerAP.gridRow ) {
		// Füge .line-.wt-DIVs in der gridColumn neben dem Arbeitspaket (AP) ein
		for (let i = ap.gridColumn + 1; i <= nachfolgerAP.gridColumn - 1; i++) {
		    let horizontalLinesContainer = document.createElement('div');
		    // if (i === ap.gridColumn + 1) {
		    // 	horizontalLinesContainer.className = 'hlines-start';
		    // } else if (i == nachfolgerAP.gridColumn -1 ) {
		    // 	horizontalLinesContainer.className = 'hlines-end';
		    // } else {
			horizontalLinesContainer.className = 'hlines';
		    // }
		    horizontalLinesContainer.style.gridTemplateColumns = '1fr 1fr'; // Vorgänger, Nachfolger
		    // Setze gridRow und gridColumn für den horizontalLinesContainer
		    horizontalLinesContainer.style.gridColumnStart = i;
		    horizontalLinesContainer.style.gridRowStart = nachfolgerAP.gridRow;
                    let lineDiv = document.createElement('div');
                    lineDiv.className = 'wc';
		    lineDiv.style.backgroundColor = lineColor;
                    horizontalLinesContainer.appendChild(lineDiv);
		    // Füge den horizontalLinesContainer in das Grid ein
		    gridContainer.appendChild(horizontalLinesContainer);
		}
            } else if (ap.gridRow > nachfolgerAP.gridRow) {
		// Füge .line-.wt-DIVs in der gridColumn neben dem Arbeitspaket (AP) ein
		for (let i = ap.gridColumn + 1; i <= nachfolgerAP.gridColumn - 1; i++) {
		    let horizontalLinesContainer = document.createElement('div');
		    if (i === ap.gridColumn + 1) {
			horizontalLinesContainer.className = 'hlines-start';
		    } else if (i == nachfolgerAP.gridColumn -1 ) {
			horizontalLinesContainer.className = 'hlines-end';
		    } else {
			horizontalLinesContainer.className = 'hlines';
		    }
		    horizontalLinesContainer.style.gridTemplateColumns = '1fr 1fr'; // Vorgänger, Nachfolger
		    // Setze gridRow und gridColumn für den horizontalLinesContainer
		    horizontalLinesContainer.style.gridColumnStart = i;
		    horizontalLinesContainer.style.gridRowStart = nachfolgerAP.gridRow + 1;
                    let lineDiv = document.createElement('div');
                    lineDiv.className = 'wt';
		    lineDiv.style.backgroundColor = lineColor;
                    horizontalLinesContainer.appendChild(lineDiv);
		    // Füge den horizontalLinesContainer in das Grid ein
		    gridContainer.appendChild(horizontalLinesContainer);
		}
	    } else {
		// Füge .line-.ob-DIVs in der gridColumn neben dem Arbeitspaket (AP) ein
		for (let i = ap.gridColumn + 1; i <= nachfolgerAP.gridColumn - 1; i++) {
		    let horizontalLinesContainer = document.createElement('div');
		    if (i === ap.gridColumn + 1) {
			horizontalLinesContainer.className = 'hlines-start';
		    } else if (i == nachfolgerAP.gridColumn -1 ) {
			horizontalLinesContainer.className = 'hlines-end';
		    } else {
			horizontalLinesContainer.className = 'hlines';
		    }
		    horizontalLinesContainer.style.gridTemplateColumns = '1fr 1fr'; // Vorgänger, Nachfolger

		    // Setze gridRow und gridColumn für den horizontalLinesContainer
		    horizontalLinesContainer.style.gridColumnStart = i;
		    horizontalLinesContainer.style.gridRowStart = nachfolgerAP.gridRow - 1;
                    let lineDiv = document.createElement('div');
                    lineDiv.className = 'ob';
		    lineDiv.style.backgroundColor = lineColor;
                    horizontalLinesContainer.appendChild(lineDiv);
		    // Füge den horizontalLinesContainer in das Grid ein
		    gridContainer.appendChild(horizontalLinesContainer);
		}
            }

        });
    }

    einfuegenArbeitspakete(ap, spalte, zeile) {
        if (this.platzierteAPs.has(ap.id)) {
            return;
        }

        this.setzeArbeitspaketInGrid(ap, spalte, zeile);
        this.sortiereUndPlatziereNachfolger(ap, spalte, zeile);
    }

    setzeArbeitspaketInGrid(ap, spalte, zeile) {
	ap.gridColumn = spalte;
        ap.gridRow = zeile;
        this.bereinigeVorgaenger(ap, zeile);
	ap.gridColumn = spalte;
        ap.gridRow = zeile;

        const apElement = this.erstelleArbeitspaketElement(ap);
        apElement.style.gridColumn = spalte;
        apElement.style.gridRow = zeile;
        this.gridContainer.appendChild(apElement);

        this.platzierteAPs.add(ap.id);
    }

    erstelleArbeitspaketElement(ap) {
        const apElement = document.createElement("div");
        apElement.classList.add("node");
	apElement.id = ap.id;
	
        const idDiv = document.createElement("div");
        idDiv.classList.add("ID");
        idDiv.textContent = ap.id;
        apElement.appendChild(idDiv);

        const infos = ['FAZ', 'FEZ', 'SAZ', 'SEZ', 'dauer', 'GP', 'FP'];
        infos.forEach(info => {
            const infoDiv = document.createElement("div");
            infoDiv.classList.add(info);
            infoDiv.textContent = `${ap[info]}`;
	    infoDiv.title = info;
            apElement.appendChild(infoDiv);
        });

        return apElement;
    }

    sortiereUndPlatziereNachfolger(ap, spalte, zeile) {
        let naechsteZeile = zeile;
	let d = new Date();
        ap.sortiereNachfolger(this.projekt);
	ap.nachfolger = [...new Set(ap.nachfolger)];
	const l = ap.nachfolger.length;
	if (l === 0){
	    return;
	}
        for (var i=0; i<l; i++) {
	    const nachfolgerId = ap.nachfolger[i];
	    const nachfolger = this.projekt.arbeitspakete.find(a => a.id === nachfolgerId );
	    naechsteZeile = i * 2 + 1;
	    if (!this.platzierteAPs.has(nachfolgerId)) {
		this.einfuegenArbeitspakete(nachfolger, spalte + 2, naechsteZeile);
	    }
        }
    }

    // Methode zum Bereinigen der Vorgänger
    bereinigeVorgaenger(ap) {
        const vorgaengerInDerselbenZeile = [];
        const vorgaengerInAndererZeile = [];
        ap.vorgaenger.forEach(vgId => {
            const vg = this.arbeitspakete.find(a => a.id === vgId);
            if (vg && vg.gridRow === ap.gridRow) {
                vorgaengerInDerselbenZeile.push(vgId);
            } else {
		vorgaengerInAndererZeile.push(vgId);
	    }
        });

        if (vorgaengerInDerselbenZeile.length > 1) {
            // Behalte nur den letzten Vorgänger in derselben Zeile
            const letzterVorgaenger = vorgaengerInDerselbenZeile[vorgaengerInDerselbenZeile.length - 1];
            ap.vorgaenger = ap.vorgaenger.filter(vgId => (vgId === letzterVorgaenger || vorgaengerInAndererZeile.includes(vgId)));
        }
    }
}


const meinProjekt = new Projekt("Projekt1");
meinProjekt.generateRandomNetzplan();
meinProjekt.zeigeNetzplan();
meinProjekt.showArbeitsPaketListe();

const hilfstext = document.getElementById("hilfstext");

const hilfstexte = {
    "FAZ": "Frühester Anfangszeitpunkt (FAZ) = maximale FEZ der Vorgänger",
    "FEZ": "Frühester Endzeitpunkt (FEZ) = FAZ + D(auer)",
    "SAZ": "Spätester Anfangszeitpunkt (SAZ) = SEZ - D(auer)",
    "SEZ": "Spätester Endzeitpunkt (SEZ) = minimale SAZ der Nachfolger",
    "GP": "Gesamtpuffer (GP) = SAZ - FAZ = SEZ -FEZ",
    "FP": "Freier Puffer = minimale FAZ der Nachfolger - FEZ"
};

// Event listener to hide hilfstext when clicked
hilfstext.addEventListener('click', hideHilfstext);

function hideHilfstext() {
    hilfstext.textContent = "";
    hilfstext.style.visibility = "hidden";
    aktiverHilfstext = false;
}

// Function to change the text color of an element
let aktiverHilfstext = null; // Globale Variable, um den aktuellen Hilfstext zu speichern
function showText(event) {
    // First, hide any active hilfstext
    if (aktiverHilfstext) {
        hideHilfstext();
    } 
    // Check if the clicked element has one of the specified classes
    if (["FAZ", "FEZ", "SAZ", "SEZ", "GP", "FP"].includes(event.target.className)) {
        event.target.style.color = "var(--text-color)";
        event.target.style.borderColor = "var(--border-color)";
	hilfstext.textContent = hilfstexte[event.target.className];
	hilfstext.style.position = "absolute";
	hilfstext.style.left = event.target.getBoundingClientRect().left+"px";
	hilfstext.style.top = event.target.getBoundingClientRect().top+"px";
	// Aktuellen Hilfstext speichern
	hilfstext.style.visibility = "visible";
	aktiverHilfstext = true;
    }
}

// Loop through possible container IDs (A to Z) and attach the event listener
for (let i = 65; i <= 90; i++) { // ASCII values for A to Z
    const containerId = String.fromCharCode(i);
    const container = document.getElementById(containerId);
    if (container) {
        container.addEventListener("click", showText);
    }
}

// Überprüfen, ob ein Dark Mode gesetzt ist
let darkMode = localStorage.getItem("darkMode");
const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;
const enableDarkMode = () => {
    // 1. add the class darkmode to the body
    document.body.classList.add("dark-mode");
    // 2. update darkMode in the LocalStorage
    localStorage.setItem("darkMode", "enabled");
}

const disableDarkMode = () => {
    // 1. add the class darkmode to the body
    document.body.classList.remove("dark-mode");
    // 2. update darkMode in the LocalStorage
    localStorage.setItem("darkMode", null);
}

if (darkMode === "enabled") {
    enableDarkMode();
}

darkModeToggle.addEventListener("change", function() {
    darkMode = localStorage.getItem("darkMode");
    if (darkMode !== "enabled") {
	enableDarkMode();
    } else {
	disableDarkMode();
    }
});

// Prevent Legende from scaling
// Get the element
const legende = document.querySelector("#Legende");
// Get the current scale of the page
const scale = window.devicePixelRatio;


// Set the scale of the element to 1
legende.style.transform = `scale(${1 / scale})`;
hilfstext.style.transform = `scale(${1 / scale})`;

// Update the scale of the element whenever the window is resized
window.addEventListener("resize", () => {
    const scale = window.devicePixelRatio;
    if (scale > 1.5 ) {
	legende.style.transform = `scale(${1.5 / scale})`;
    // Limit the scale of the element to 2
    hilfstext.style.transform = `scale(${1.5 / scale})`;
}});
