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
    if (!projekt) {
        return;
    }

    // Überprüfen, ob projekt.arbeitspakete definiert ist
    if (!projekt.arbeitspakete) {
        return;
    }

    this.nachfolger.sort((aId, bId) => {
        const a = projekt.arbeitspakete.find(ap => ap.id === aId);
        const b = projekt.arbeitspakete.find(ap => ap.id === bId);

        // Überprüfen, ob das Arbeitspaket 'a' gefunden wurde
        if (!a) {
        }

        // Überprüfen, ob das Arbeitspaket 'b' gefunden wurde
        if (!b) {
        }

        // Wenn eines der Arbeitspakete nicht gefunden wurde, geben Sie 0 zurück
        if (!a || !b) {
            return 0;
        }

        return a.GP - b.GP; // Sortiere aufsteigend nach GP
    });
        this.nachfolger.sort((aId, bId) => {
            const a = projekt.arbeitspakete.find(ap => ap.id === aId);
            const b = projekt.arbeitspakete.find(ap => ap.id === bId);
            return a.GP - b.GP; // Sortiere aufsteigend nach GP
        });
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
        this.durchRechnen(); // Durchrechnen vor dem Anzeigen der Liste

        // Erstelle die Tabelle und füge sie zum Container hinzu
        const container = document.getElementById("arbeitspaketliste");
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");

        // Erstelle die Überschriften
        const headers = ["ID", "Dauer", "Vorgänger", "FAZ", "FEZ", "SAZ", "SEZ", "GP", "FP"];
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
                ap.FAZ,
                ap.FEZ,
                ap.SAZ,
                ap.SEZ,
                ap.GP,
                ap.FP
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
        this.gridContainer.style.gridTemplateColumns = `repeat(${2 * kritischerPfadLaenge}, 1fr)`;

        const startAp = this.projekt.arbeitspakete[0];
        this.einfuegenArbeitspakete(startAp, 1, 1);
	
        // Rufe verbindeNodes für jedes Arbeitspaket auf
        this.arbeitspakete.forEach(ap => this.verbindeNodes(ap.id));
    }

    verbindeNodes(apID) {
	const ap = this.arbeitspakete.find(a => a.id === apID);
	if (!ap) {
            console.error(`Arbeitspaket mit ID ${apID} nicht gefunden.`);
            return;
	}

	// Überprüfe, ob es sich um das letzte Arbeitspaket handelt
	if (ap.nachfolger.length === 0) return;

	const gridContainer = document.getElementById("grid-container");

	// Erstelle den .lines-Container
	const linesContainer = document.createElement("div");
	linesContainer.classList.add("lines");
	console.log(ap.gridColumn)
	linesContainer.style.gridColumnStart = ap.gridColumn + 1; // Nächste Zelle nach dem aktuellen AP
	linesContainer.style.gridRowStart = ap.gridRow;
	linesContainer.style.gridTemplateRows = `repeat(${ap.nachfolger.length}, 1fr)`;
	linesContainer.style.gridTemplateColumns = "1fr 1fr"; // Zwei Spalten: Nachfolger, Vorgänger

	ap.nachfolger.forEach(nfId => {
            const nf = this.arbeitspakete.find(a => a.id === nfId);

            const lineElement = document.createElement("div");
            lineElement.classList.add("line");

            // Bestimme die Klasse basierend auf der gridRow des Nachfolgers
            if (nf.gridRow === ap.gridRow) {
		lineElement.classList.add("o");
            } else if (nf.gridRow < ap.gridRow) {
		lineElement.classList.add("no");
            } else {
		lineElement.classList.add("so");
            }

            linesContainer.appendChild(lineElement);
	});

	gridContainer.appendChild(linesContainer);
    }
    
    einfuegenArbeitspakete(ap, spalte, zeile) {
        if (this.platzierteAPs.has(ap.id)) {
            return;
        }

        this.setzeArbeitspaketInGrid(ap, spalte, zeile);
        this.sortiereUndPlatziereNachfolger(ap, spalte, zeile);
    }

    setzeArbeitspaketInGrid(ap, spalte, zeile) {
        ap.gridRow = zeile;
	ap.gridColumn = spalte;
        this.bereinigeVorgaenger(ap, zeile);

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
            apElement.appendChild(infoDiv);
        });

        return apElement;
    }

    sortiereUndPlatziereNachfolger(ap, spalte, zeile) {
        let naechsteZeile = zeile;
        ap.sortiereNachfolger(this.projekt);
        ap.nachfolger.forEach((nachfolgerId, index) => {
            const nachfolger = this.projekt.arbeitspakete.find(a => a.id === nachfolgerId);
            naechsteZeile += index * 2;
            this.einfuegenArbeitspakete(nachfolger, spalte + 2, naechsteZeile);
        });
    }
    
    // Methode zum Bereinigen der Vorgänger
    bereinigeVorgaenger(ap, zeile) {
        const vorgaengerInDerselbenZeile = [];
        ap.vorgaenger.forEach(vgId => {
            const vg = this.arbeitspakete.find(a => a.id === vgId);
	    console.log(ap.id+"("+ap.gridRow+"):"+vgId+"("+vg.gridRow+")");
            if (vg && vg.gridRow === zeile) {
                vorgaengerInDerselbenZeile.push(vgId);
            }
        });

        const frstVorgaenger = ap.vorgaenger[0];
        ap.vorgaenger = ap.vorgaenger.filter(vgId => !vorgaengerInDerselbenZeile.includes(vgId));
        if (ap.vorgaenger.length === 0) { ap.vorgaenger.push(frstVorgaenger) }
    }
}


// Beispiel
const meinProjekt = new Projekt("Projekt1");
meinProjekt.generateRandomNetzplan();
meinProjekt.showArbeitsPaketListe();
meinProjekt.zeigeNetzplan();

