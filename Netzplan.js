// Definiere eine Klasse namens "Arbeitspaket"
class Arbeitspaket {
  // Konstruktor der Klasse, der aufgerufen wird, wenn ein neues Objekt erstellt wird
  constructor(id, dauer, vorgaenger = [], nachfolger = []) {
    this.id = id; // Eindeutige Identifikationsnummer des Arbeitspakets
    this.dauer = dauer; // Dauer des Arbeitspakets in Zeiteinheiten
    this.vorgaenger = vorgaenger; // Liste von Arbeitspaketen, die vor diesem Arbeitspaket abgeschlossen werden müssen
    this.nachfolger = nachfolger; // Liste von Arbeitspaketen, die nach diesem Arbeitspaket beginnen können

    // FAZ: Frühester Anfangszeitpunkt
    this.FAZ = 0;
    // FEZ: Frühester Endzeitpunkt
    this.FEZ = 0;
    // SAZ: Spätester Anfangszeitpunkt
    this.SAZ = 0;
    // SEZ: Spätester Endzeitpunkt
    this.SEZ = 0;
    // GP: Gesamtpuffer
    this.GP = 0;
    // FP: Freier Puffer
    this.FP = 0;

    // Platz im Grid des Netzplans (für die Darstellung)
    this.gridRow = null;
    this.gridColumn = null;
  }

  // Methode, um dieses Arbeitspaket als Nachfolger eines anderen Arbeitspakets zu definieren
  Folge(vorgaengerID, projekt) {
    // Suche das Arbeitspaket mit der gegebenen ID im Projekt
    const vorgaengerAP = projekt.arbeitspakete.find(
      (ap) => ap.id === vorgaengerID,
    );
    // Wenn das Arbeitspaket gefunden wurde
    if (vorgaengerAP) {
      // Füge die ID dieses Arbeitspakets zur Liste der Nachfolger des gefundenen Arbeitspakets hinzu
      vorgaengerAP.nachfolger.push(this.id);
      // Füge die ID des gefundenen Arbeitspakets zur Liste der Vorgänger dieses Arbeitspakets hinzu
      this.vorgaenger.push(vorgaengerID);
    }
  }

  // Methode zur Berechnung der frühesten Anfangs- und Endzeit des Arbeitspakets
  getFXZ(projekt) {
    // Wenn es Vorgänger gibt
    this.FAZ = this.vorgaenger.length
      ? Math.max(
          ...this.vorgaenger.map((vorgaengerID) => {
            // Suche den Vorgänger im Projekt
            const vorgaenger = projekt.arbeitspakete.find(
              (ap) => ap.id === vorgaengerID,
            );
            // Gibt den frühesten Endzeitpunkt des Vorgängers zurück oder 0, wenn nicht gefunden
            return vorgaenger ? vorgaenger.FEZ : 0;
          }),
        )
      : 0;
    // Der früheste Endzeitpunkt ist die Dauer des Arbeitspakets plus dessen frühester Anfangszeitpunkt
    this.FEZ = this.dauer + this.FAZ;
    return [this.FAZ, this.FEZ];
  }

  // Methode zur Berechnung der spätesten Anfangs- und Endzeit sowie der Puffer des Arbeitspakets
  getSXZ(projekt) {
    // Wenn es Nachfolger gibt
    this.SEZ = this.nachfolger.length
      ? Math.min(
          ...this.nachfolger.map((nachfolgerID) => {
            // Suche den Nachfolger im Projekt
            const nachfolger = projekt.arbeitspakete.find(
              (ap) => ap.id === nachfolgerID,
            );
            // Gibt den spätesten Anfangszeitpunkt des Nachfolgers zurück oder Infinity, wenn nicht gefunden
            return nachfolger ? nachfolger.SAZ : Infinity;
          }),
        )
      : this.FEZ;
    // Der späteste Anfangszeitpunkt ist der späteste Endzeitpunkt minus die Dauer des Arbeitspakets
    this.SAZ = this.SEZ - this.dauer;
    // Der Gesamtpuffer ist der Unterschied zwischen dem spätesten und dem frühesten Endzeitpunkt
    this.GP = this.SEZ - this.FEZ;
    // Der freie Puffer wird berechnet
    this.FP = this.nachfolger.length
      ? Math.min(
          ...this.nachfolger.map((nachfolgerID) => {
            // Suche den Nachfolger im Projekt
            const nachfolger = projekt.arbeitspakete.find(
              (ap) => ap.id === nachfolgerID,
            );
            // Gibt den frühesten Anfangszeitpunkt des Nachfolgers zurück oder Infinity, wenn nicht gefunden
            return nachfolger ? nachfolger.FAZ : Infinity;
          }),
        ) - this.FEZ
      : 0;
    return [this.SAZ, this.SEZ, this.GP, this.FP];
  }

  sortiereNachfolger(projekt) {
    // Überprüfen, ob das Projekt definiert ist und ob es Arbeitspakete enthält
    if (!projekt || !projekt.arbeitspakete) {
      return; // Beende die Funktion, wenn nicht
    }

    // Sortiere die Nachfolger basierend auf dem GP-Wert (Gesamtpuffer)
    this.nachfolger.sort((aId, bId) => {
      // Finde die Arbeitspakete 'a' und 'b' basierend auf ihren IDs
      const a = projekt.arbeitspakete.find((ap) => ap.id === aId);
      const b = projekt.arbeitspakete.find((ap) => ap.id === bId);

      // Überprüfen, ob das Arbeitspaket 'a' oder 'b' gefunden wurde
      if (!a || !b) {
        return 0; // Wenn eines der Arbeitspakete nicht gefunden wird, gebe 0 zurück (keine Sortierung)
      }

      // Sortiere aufsteigend nach dem GP-Wert
      return a.GP - b.GP;
    });

    // Entferne das Arbeitspaket selbst aus seinem Nachfolger-Array
    // (Ein Arbeitspaket sollte nicht sein eigener Nachfolger sein)
    this.nachfolger = this.nachfolger.filter((nfId) => nfId !== this.id);
  }
}

// Definiere eine Klasse namens "Projekt"
class Projekt {
  // Konstruktor der Klasse, der aufgerufen wird, wenn ein neues Objekt erstellt wird
  constructor(id) {
    this.id = id; // Eindeutige ID für das Projekt
    this.arbeitspakete = []; // Liste aller Arbeitspakete im Projekt
    this.kritischerPfad = []; // Liste der IDs der Arbeitspakete im kritischen Pfad
    this.netzplan = new Netzplan(this);
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
          const randomIndex = Math.floor(
            Math.random() * this.arbeitspakete.length,
          );
          const vorgaengerID = this.arbeitspakete[randomIndex].id;

          // Überprüfe, ob der Vorgänger bereits ein Vorgänger eines der Vorgänger ist
          let isNestedVorgaenger = false;
          for (const existingVorgaengerID of vorgaengerSet) {
            const existingVorgaenger = this.arbeitspakete.find(
              (ap) => ap.id === existingVorgaengerID,
            );
            if (
              existingVorgaenger &&
              existingVorgaenger.vorgaenger.includes(vorgaengerID)
            ) {
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
        const randomIndex =
          Math.floor(Math.random() * (this.arbeitspakete.length - i - 1)) +
          i +
          1;
        const nachfolgerID = this.arbeitspakete[randomIndex].id;
        ap.nachfolger.push(nachfolgerID);
        this.arbeitspakete[randomIndex].vorgaenger.push(ap.id);
      }
    }
  }

  // Methode zum Anzeigen der Liste der Arbeitspakete
  showArbeitsPaketListe() {
    // Wenn das Arbeitspaket noch nicht berechnet wurde, führe die Berechnung durch
    if (this.arbeitspakete[0].FEZ === 0) {
      this.durchRechnen();
    }

    // Erstelle die Tabelle und füge sie zum Container hinzu
    const container = document.getElementById("arbeitspaketliste");
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Erstelle die Überschriften für die Tabelle
    const headers = ["ID", "Dauer", "Vorgänger"];
    const headerRow = document.createElement("tr");
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Füge die Daten der Arbeitspakete zur Tabelle hinzu
    this.arbeitspakete.forEach((ap) => {
      const row = document.createElement("tr");
      const cells = [ap.id, ap.dauer, ap.vorgaenger.join(", ")];

      cells.forEach((cellData) => {
        const cell = document.createElement("td");
        cell.textContent = cellData;
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // Zeige den kritischen Pfad an
    const kritPathElement = document.createElement("p");
    kritPathElement.id = "KP";
    kritPathElement.textContent =
      "Kritischer Pfad: [" + this.kritischerPfad.reverse().join(" - ") + "]";
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
    ap.nachfolger.forEach((nfId) => {
      const nf = this.arbeitspakete.find((a) => a.id === nfId);
      this.vorwaertsRechnen(nf);
    });
  }

  // Methode zum Rückwärtsrechnen der Arbeitspakete
  rueckwaertsRechnen(ap) {
    ap.getSXZ(this);
    // Wenn das Arbeitspaket keinen Gesamtpuffer hat und noch nicht im kritischen Pfad ist, füge es hinzu
    if (ap.GP === 0 && !this.kritischerPfad.includes(ap.id)) {
      this.kritischerPfad.push(ap.id);
    }
    ap.vorgaenger.forEach((vgId) => {
      const vg = this.arbeitspakete.find((a) => a.id === vgId);
      this.aktualisiereVorgaengerNachfolger(vg.id, ap.id);
      this.rueckwaertsRechnen(vg);
    });
  }

  // Methode zum Aktualisieren der Vorgänger-Nachfolger-Beziehungen
  aktualisiereVorgaengerNachfolger(vgId, apId) {
    const vg = this.arbeitspakete.find((a) => a.id === vgId);
    const ap = this.arbeitspakete.find((a) => a.id === apId);

    // Überprüfe, ob die Arbeitspakete gefunden wurden
    if (!vg || !ap) {
      return;
    }

    // Aktualisiere die Nachfolger-Liste des Vorgängers
    for (let i = 0; i < vg.nachfolger.length; i++) {
      const nfId = vg.nachfolger[i];
      if (nfId === apId) {
        vg.nachfolger[i] = apId;
      }
    }
  }

  // Methode zum Finden des End-Arbeitspakets
  findeEndArbeitsPaket() {
    // Durchsuche die Liste der Arbeitspakete rückwärts
    for (let i = this.arbeitspakete.length - 1; i >= 0; i--) {
      // Wenn ein Arbeitspaket keine Nachfolger hat, ist es das End-Arbeitspaket
      if (this.arbeitspakete[i].nachfolger.length === 0) {
        return this.arbeitspakete[i];
      }
    }
    // Wenn kein End-Arbeitspaket gefunden wurde, wirf einen Fehler
    throw new Error("Kein Endknoten (letztes ArbeitsPaket) gefunden!");
  }

  // Methode zum Anzeigen des kritischen Pfads
  zeigeKritischenPfad() {
    this.durchRechnen();
    // Weitere Logik zum Anzeigen des kritischen Pfads kann hier hinzugefügt werden
  }

  // Methode zum Anzeigen des Netzplans
  zeigeNetzplan() {
    // Überprüfe, ob das erste Arbeitspaket bereits berechnet wurde
    if (this.arbeitspakete[0].FEZ === 0) {
      this.durchRechnen(); // Wenn nicht, führe die Berechnung durch
    }
    // Zeichne den Netzplan
    this.netzplan.zeichne();
  }
}

class Netzplan {
  // Konstruktor für die Netzplan-Klasse
  constructor(projekt) {
    this.projekt = projekt; // Das zugehörige Projekt
    this.gridContainer = document.getElementById("grid-container"); // HTML-Element, in dem der Netzplan angezeigt wird
    this.platzierteAPs = new Set(); // Ein Set, um die bereits platzierten Arbeitspakete zu speichern
    this.arbeitspakete = projekt.arbeitspakete; // Liste der Arbeitspakete aus dem Projekt
  }
  // Methode zum Zeichnen des Netzplans
  zeichne() {
    // Bindet den aktuellen Kontext an die Netzplan-Klasse
    Netzplan.bind(this);

    // Bestimmt die Größe des kritischen Pfads
    const kritischerPfadLaenge = this.projekt.kritischerPfad.length;

    // Setzt das Grid-Layout für den Netzplan
    this.gridContainer.style.gridTemplateColumns = `repeat(20,100px)`;
    this.gridContainer.style.gridTemplateRows = `repeat(8, 100px)`;

    // Beginnt mit dem ersten Arbeitspaket und bestimmt die Positionen
    const startAp = this.projekt.arbeitspakete[0];
    this.bestimmePositionen(startAp, 1, 1);

    // Nachdem alle Positionen festgelegt wurden, erstelle die Arbeitspaket-Elemente und verbinde sie
    this.arbeitspakete.forEach((ap) => {
      this.setzeArbeitspaketInGrid(ap, ap.gridColumn, ap.gridRow);
      this.verbindeNodes(ap.id);
    });
  }

  // Methode zum Bestimmen der Positionen der Arbeitspakete im Netzplan
  bestimmePositionen(ap, spalte, zeile) {
    // Überprüft, ob das Arbeitspaket bereits platziert wurde
    if (this.platzierteAPs.has(ap.id)) {
      if (ap.gridColumn < spalte) {
        ap.gridColumn = spalte;
      }
      return;
    }

    // Setzt die Position des Arbeitspakets
    ap.gridColumn = spalte;
    ap.gridRow = zeile;
    this.platzierteAPs.add(ap.id);
    this.setGridPosition(ap, zeile, spalte);

    // Sortiert und bestimmt die Positionen der Nachfolger
    this.sortiereUndBestimmePositionenDerNachfolger(ap, spalte, zeile);
  }

  // Methode zum Sortieren der Nachfolger und Bestimmen ihrer Positionen
  sortiereUndBestimmePositionenDerNachfolger(ap, spalte, zeile) {
    let naechsteZeile = zeile;

    // Sortiert die Nachfolger des Arbeitspakets
    ap.sortiereNachfolger(this.projekt);

    // Entfernt doppelte Einträge aus der Nachfolger-Liste
    ap.nachfolger = [...new Set(ap.nachfolger)];

    const l = ap.nachfolger.length;
    if (l === 0) {
      return;
    }

    // Bestimmt die Positionen der Nachfolger
    for (var i = 0; i < l; i++) {
      const nachfolgerId = ap.nachfolger[i];
      const nachfolger = this.projekt.arbeitspakete.find(
        (a) => a.id === nachfolgerId,
      );
      naechsteZeile = i * 2 + 1;
      this.bestimmePositionen(nachfolger, spalte + 2, naechsteZeile);
    }
  }

  // Methode zum Setzen der Position eines Arbeitspakets im Grid
  setGridPosition(arbeitspaket, row, col, retryCount = 0) {
    const maxRetries = 10; // Maximale Anzahl von Versuchen

    // Wenn die maximale Anzahl von Versuchen erreicht ist, beende die Methode
    if (retryCount >= maxRetries) {
      return;
    }

    // Überprüft, ob ein Nachfolger im gleichen oder in einer vorherigen Spalte liegt
    const nachfolgerInSameOrPreviousColumn = arbeitspaket.nachfolger.some(
      (nachfolgerId) => {
        const nachfolgerAP = this.arbeitspakete.find(
          (ap) => ap.id === nachfolgerId,
        );
        if (
          nachfolgerAP &&
          nachfolgerAP.gridColumn &&
          nachfolgerAP.gridColumn <= col
        ) {
          console.log(
            arbeitspaket.id +
              "->" +
              nachfolgerId +
              "(" +
              nachfolgerAP.gridColumn +
              "," +
              nachfolgerAP.gridRow +
              ")",
          );
          nachfolgerAP.gridColumn = col + 2;
          this.setGridPosition(
            nachfolgerAP,
            nachfolgerAP.gridRow,
            nachfolgerAP.gridColumn + 2,
            retryCount + 1,
          );
        }
      },
    );
  }

  // Methode zum Einfügen von Arbeitspaketen in den Netzplan
  einfuegenArbeitspakete(ap, spalte, zeile) {
    // Wenn das Arbeitspaket bereits platziert wurde, aber nicht in der gewünschten Spalte,
    // dann verschieben wir es zur gewünschten Spalte.
    if (this.platzierteAPs.has(ap.id)) {
      if (ap.gridColumn < spalte) {
        ap.gridColumn = spalte;
        const apElement = document.getElementById(ap.id);
        apElement.style.gridColumn = spalte;
      }
      return;
    }

    this.setzeArbeitspaketInGrid(ap, spalte, zeile);
    this.sortiereUndPlatziereNachfolger(ap, spalte, zeile);
  }

  // Methode zum Setzen eines Arbeitspakets in den Netzplan
  setzeArbeitspaketInGrid(ap, spalte, zeile) {
    ap.gridColumn = spalte;
    ap.gridRow = zeile;
    this.bereinigeVorgaenger(ap, zeile);

    // Erstellt ein HTML-Element für das Arbeitspaket und fügt es dem Netzplan hinzu
    const apElement = this.erstelleArbeitspaketElement(ap);
    apElement.style.gridColumn = ap.gridColumn;
    apElement.style.gridRow = ap.gridRow;
    this.gridContainer.appendChild(apElement);

    this.platzierteAPs.add(ap.id);
  }

  // Methode zum Erstellen eines HTML-Elements für ein Arbeitspaket
  erstelleArbeitspaketElement(ap) {
    // Erstelle ein div-Element für das Arbeitspaket
    const apElement = document.createElement("div");
    apElement.classList.add("node"); // Füge die Klasse "node" hinzu
    apElement.id = ap.id; // Setze die ID des Arbeitspakets als ID des Elements

    // Erstelle ein div-Element für die ID des Arbeitspakets
    const idDiv = document.createElement("div");
    idDiv.classList.add("ID");
    idDiv.textContent = ap.id;
    apElement.appendChild(idDiv);

    // Liste der Informationen, die im Arbeitspaket angezeigt werden sollen
    const infos = ["FAZ", "FEZ", "SAZ", "SEZ", "dauer", "GP", "FP"];
    infos.forEach((info) => {
      // Für jede Information, erstelle ein div-Element
      const infoDiv = document.createElement("div");
      infoDiv.classList.add(info);
      infoDiv.textContent = `${ap[info]}`; // Setze den Wert der Information als Textinhalt
      infoDiv.title = info; // Setze den Namen der Information als Titel (Tooltip)
      apElement.appendChild(infoDiv); // Füge das div-Element zum Arbeitspaket-Element hinzu
    });

    return apElement; // Gebe das erstellte Arbeitspaket-Element zurück
  }

  // Methode zum Sortieren und Platzieren der Nachfolger eines Arbeitspakets
  sortiereUndPlatziereNachfolger(ap, spalte, zeile) {
    let naechsteZeile = zeile; // Startzeile für den nächsten Nachfolger
    ap.sortiereNachfolger(this.projekt); // Sortiere die Nachfolger des Arbeitspakets
    ap.nachfolger = [...new Set(ap.nachfolger)]; // Entferne doppelte Einträge aus der Nachfolger-Liste
    const l = ap.nachfolger.length;
    if (l === 0) {
      return; // Beende die Methode, wenn es keine Nachfolger gibt
    }
    for (var i = 0; i < l; i++) {
      const nachfolgerId = ap.nachfolger[i];
      const nachfolger = this.projekt.arbeitspakete.find(
        (a) => a.id === nachfolgerId,
      );
      naechsteZeile = i * 2 + 1; // Berechne die Zeile für den nächsten Nachfolger
      // Wenn der Nachfolger noch nicht platziert wurde, füge ihn hinzu
      if (!this.platzierteAPs.has(nachfolgerId)) {
        this.einfuegenArbeitspakete(nachfolger, spalte + 2, naechsteZeile);
      }
    }
  }

  // Methode zum Bereinigen der Vorgänger eines Arbeitspakets
  bereinigeVorgaenger(ap) {
    const vorgaengerInDerselbenZeile = [];
    const vorgaengerInAndererZeile = [];
    // Teile die Vorgänger in zwei Listen auf: diejenigen in derselben Zeile und diejenigen in anderen Zeilen
    ap.vorgaenger.forEach((vgId) => {
      const vg = this.arbeitspakete.find((a) => a.id === vgId);
      if (vg && vg.gridRow === ap.gridRow) {
        vorgaengerInDerselbenZeile.push(vgId);
      } else {
        vorgaengerInAndererZeile.push(vgId);
      }
    });

    // Wenn es mehr als einen Vorgänger in derselben Zeile gibt
    if (vorgaengerInDerselbenZeile.length > 1) {
      // Behalte nur den letzten Vorgänger in derselben Zeile
      const letzterVorgaenger =
        vorgaengerInDerselbenZeile[vorgaengerInDerselbenZeile.length - 1];
      ap.vorgaenger = ap.vorgaenger.filter(
        (vgId) =>
          vgId === letzterVorgaenger || vorgaengerInAndererZeile.includes(vgId),
      );
    }
  }

  verbindeNodes(apID) {
    // Finde das Arbeitspaket (AP) mit der gegebenen ID.
    let ap = this.projekt.arbeitspakete.find((ap) => ap.id === apID);

    // Hole die Nachfolger des gefundenen APs.
    let nachfolger = ap.nachfolger;

    // Farbpalette für die Linien, basierend auf der ID des APs.
    const colorPalette = {
      A: "#666666", // Grau
      B: "#FF6B6B", // Rot
      C: "#4DB6AC", // Türkis
      D: "#FFD54F", // Gelb
      E: "#304FFE", // Blau
      F: "#C0CA33", // Hellgrün
      G: "#8E24AA", // Lila
      H: "#FFAB40", // Orange
      I: "#00ACC1", // Cyan
      J: "#7CB342", // Grün
    };

    // Bestimme die Farbe der Linie basierend auf der ID des APs.
    let lineColor = colorPalette[ap.id];

    // Gehe durch jeden Nachfolger des APs.
    nachfolger.forEach((nachfolgerID) => {
      // Finde das Arbeitspaket des Nachfolgers.
      let nachfolgerAP = this.projekt.arbeitspakete.find(
        (ap) => ap.id === nachfolgerID,
      );

      // Erstelle einen Container für die Linien.
      let linesContainer = document.createElement("div");
      linesContainer.className = "lines";

      // Definiere die Größe des Liniencontainers.
      linesContainer.style.gridTemplateColumns = "1fr 1fr"; // Vorgänger, Nachfolger

      // Setze die Position des Liniencontainers im Grid.
      linesContainer.style.gridRowStart = ap.gridRow;
      linesContainer.style.gridColumnStart = ap.gridColumn + 1;

      // Erstelle das tatsächliche Linien-DIV und füge es dem Container hinzu.
      let line = document.createElement("div");
      line.className = "line";
      line.style.backgroundColor = lineColor;

      // Bestimme die Richtung der Linie basierend auf der Position des Vorgängers und des Nachfolgers.
      if (ap.gridRow === nachfolgerAP.gridRow) {
        line.classList.add("o"); // Gerade Linie
      } else if (ap.gridRow > nachfolgerAP.gridRow) {
        line.classList.add("no"); // Linie geht nach oben
      } else {
        line.classList.add("so"); // Linie geht nach unten
      }
      linesContainer.appendChild(line);

      // Füge den .lines-Container zum Haupt-Grid-Container hinzu
      let gridContainer = document.getElementById("grid-container");
      gridContainer.appendChild(linesContainer);

      // Erstelle einen weiteren .lines-Container für den aktuellen Nachfolger
      let nfLinesContainer = document.createElement("div");
      nfLinesContainer.className = "lines";
      
      // Definiere die Größe des Liniencontainers für den Nachfolger.
      nfLinesContainer.style.gridTemplateColumns = "1fr 1fr"; // Vorgänger, Nachfolger

      // Setze die Position des Liniencontainers für den Nachfolger im Grid.
      nfLinesContainer.style.gridRowStart = nachfolgerAP.gridRow;
      nfLinesContainer.style.gridColumnStart = nachfolgerAP.gridColumn - 1;

      // Erstelle eine Linie, die vor dem Nachfolger positioniert wird.
      let lineBeforeSuccessor = document.createElement("div");
      lineBeforeSuccessor.className = "line";
      lineBeforeSuccessor.style.backgroundColor = lineColor;

      // Bestimme die Richtung der Linie basierend auf der Position des Vorgängers und des Nachfolgers.
      if (ap.gridRow === nachfolgerAP.gridRow) {
        lineBeforeSuccessor.classList.add("w"); // Gerade Linie
      } else if (ap.gridRow > nachfolgerAP.gridRow) {
        lineBeforeSuccessor.classList.add("sw"); // Linie geht schräg nach oben
      } else {
        lineBeforeSuccessor.classList.add("nw"); // Linie geht schräg nach unten
      }
      nfLinesContainer.appendChild(lineBeforeSuccessor);

      // Füge den .lines-Container für den Nachfolger zum Haupt-Grid-Container hinzu
	gridContainer.appendChild(nfLinesContainer);

      // Erstelle den verticalLinesContainer für den aktuellen Nachfolger
      if (ap.gridRow == nachfolgerAP.gridRow) {
        // Wenn das Arbeitspaket und sein Nachfolger in derselben Zeile sind, wird nichts gemacht.
      } else if (ap.gridRow > nachfolgerAP.gridRow) {
        // Wenn das Arbeitspaket über seinem Nachfolger liegt, erstelle vertikale Linien, die nach oben zeigen.
        for (let i = ap.gridRow - 1; i >= nachfolgerAP.gridRow + 1; i--) {
          let verticalLinesContainer = document.createElement("div");
          verticalLinesContainer.className = "lines";
          verticalLinesContainer.style.gridTemplateColumns = "1fr 1fr"; // Vorgänger, Nachfolger
          
          // Setze die Position des vertikalen Liniencontainers im Grid.
          verticalLinesContainer.style.gridRowStart = i;
          verticalLinesContainer.style.gridColumnStart = ap.gridColumn + 1;
          
          let lineDiv = document.createElement("div");
          lineDiv.className = "n"; // Klasse für Linien, die nach oben zeigen.
          lineDiv.style.backgroundColor = lineColor;
          verticalLinesContainer.appendChild(lineDiv);
          
          // Füge den verticalLinesContainer zum Haupt-Grid-Container hinzu.
          gridContainer.appendChild(verticalLinesContainer);
        }
      } else {
        // Wenn das Arbeitspaket unter seinem Nachfolger liegt, erstelle vertikale Linien, die nach unten zeigen.
        for (let i = ap.gridRow + 1; i <= nachfolgerAP.gridRow - 1; i++) {
          let verticalLinesContainer = document.createElement("div");
          verticalLinesContainer.className = "lines";
          verticalLinesContainer.style.gridTemplateColumns = "1fr 1fr"; // Vorgänger, Nachfolger

          // Setze die Position des vertikalen Liniencontainers im Grid.
          verticalLinesContainer.style.gridRowStart = i;
          verticalLinesContainer.style.gridColumnStart = ap.gridColumn + 1;
          
          let lineDiv = document.createElement("div");
          lineDiv.className = "s"; // Klasse für Linien, die nach unten zeigen.
          lineDiv.style.backgroundColor = lineColor;
          verticalLinesContainer.appendChild(lineDiv);
          
          // Füge den verticalLinesContainer zum Haupt-Grid-Container hinzu.
          gridContainer.appendChild(verticalLinesContainer);
        }
      }

      // Erstelle den horizontalLinesContainer für den aktuellen Nachfolger
      if (ap.gridColumn === nachfolgerAP.gridColumn - 2) {
        // Überspringe die Linie, da es sich um eine Schleife handelt oder eine Schleife zwischen zwei benachbarten Knoten.
      } else if (ap.gridRow === nachfolgerAP.gridRow) {
        // Wenn das Arbeitspaket und sein Nachfolger in derselben Zeile sind, erstelle horizontale Linien.
        for (let i = ap.gridColumn + 1; i <= nachfolgerAP.gridColumn - 1; i++) {
          let horizontalLinesContainer = document.createElement("div");
          horizontalLinesContainer.className = "hlines";
          horizontalLinesContainer.style.gridTemplateColumns = "1fr 1fr"; // Vorgänger, Nachfolger
          
          // Setze die Position des horizontalen Liniencontainers im Grid.
          horizontalLinesContainer.style.gridColumnStart = i;
          horizontalLinesContainer.style.gridRowStart = nachfolgerAP.gridRow;
          
          let lineDiv = document.createElement("div");
          lineDiv.className = "wc"; // Klasse für horizontale Linien.
          lineDiv.style.backgroundColor = lineColor;
          horizontalLinesContainer.appendChild(lineDiv);
          
          // Füge den horizontalLinesContainer zum Haupt-Grid-Container hinzu.
          gridContainer.appendChild(horizontalLinesContainer);
        }
      } else if (ap.gridRow > nachfolgerAP.gridRow) {
        // Wenn das Arbeitspaket über seinem Nachfolger liegt, erstelle horizontale Linien, die nach oben zeigen.
        for (let i = ap.gridColumn + 1; i <= nachfolgerAP.gridColumn - 1; i++) {
          let horizontalLinesContainer = document.createElement("div");
          if (i === ap.gridColumn + 1) {
            horizontalLinesContainer.className = "hlines-start";
          } else if (i == nachfolgerAP.gridColumn - 1) {
            horizontalLinesContainer.className = "hlines-end";
          } else {
            horizontalLinesContainer.className = "hlines";
          }
          horizontalLinesContainer.style.gridTemplateColumns = "1fr 1fr"; // Vorgänger, Nachfolger
          
          // Setze die Position des horizontalen Liniencontainers im Grid.
          horizontalLinesContainer.style.gridColumnStart = i;
          horizontalLinesContainer.style.gridRowStart = nachfolgerAP.gridRow + 1;
          
          let lineDiv = document.createElement("div");
          lineDiv.className = "wt"; // Klasse für horizontale Linien, die nach oben zeigen.
          lineDiv.style.backgroundColor = lineColor;
          horizontalLinesContainer.appendChild(lineDiv);
          
          // Füge den horizontalLinesContainer zum Haupt-Grid-Container hinzu.
          gridContainer.appendChild(horizontalLinesContainer);
        }
      } else {
        // Wenn das Arbeitspaket unter seinem Nachfolger liegt, erstelle horizontale Linien, die nach unten zeigen.
        for (let i = ap.gridColumn + 1; i <= nachfolgerAP.gridColumn - 1; i++) {
          let horizontalLinesContainer = document.createElement("div");
          if (i === ap.gridColumn + 1) {
            horizontalLinesContainer.className = "hlines-start";
          } else if (i == nachfolgerAP.gridColumn - 1) {
            horizontalLinesContainer.className = "hlines-end";
          } else {
            horizontalLinesContainer.className = "hlines";
          }
          horizontalLinesContainer.style.gridTemplateColumns = "1fr 1fr"; // Vorgänger, Nachfolger
          
          // Setze die Position des horizontalen Liniencontainers im Grid.
          horizontalLinesContainer.style.gridColumnStart = i;
          horizontalLinesContainer.style.gridRowStart = nachfolgerAP.gridRow - 1;
          
          let lineDiv = document.createElement("div");
          lineDiv.className = "ob"; // Klasse für horizontale Linien, die nach unten zeigen.
          lineDiv.style.backgroundColor = lineColor;
          horizontalLinesContainer.appendChild(lineDiv);
          
          // Füge den horizontalLinesContainer zum Haupt-Grid-Container hinzu.
          gridContainer.appendChild(horizontalLinesContainer);
        }
      }
    });
  }
}

// Ein neues Projekt wird erstellt und ein zufälliger Netzplan generiert.
const meinProjekt = new Projekt("Projekt1");
meinProjekt.generateRandomNetzplan();
meinProjekt.zeigeNetzplan();
meinProjekt.showArbeitsPaketListe();

// Zugriff auf das Hilfstext-Element im HTML.
const hilfstext = document.getElementById("hilfstext");

// Ein Wörterbuch, das die Abkürzungen mit den entsprechenden Erklärungen verknüpft.
const hilfstexte = {
  FAZ: "Frühester Anfangszeitpunkt (FAZ) = maximale FEZ der Vorgänger",
  FEZ: "Frühester Endzeitpunkt (FEZ) = FAZ + D(auer)",
  SAZ: "Spätester Anfangszeitpunkt (SAZ) = SEZ - D(auer)",
  SEZ: "Spätester Endzeitpunkt (SEZ) = minimale SAZ der Nachfolger",
  GP: "Gesamtpuffer (GP) = SAZ - FAZ = SEZ -FEZ",
  FP: "Freier Puffer = minimale FAZ der Nachfolger - FEZ",
};

// Event-Listener, um den Hilfstext auszublenden, wenn darauf geklickt wird.
hilfstext.addEventListener("click", hideHilfstext);

function hideHilfstext() {
  hilfstext.textContent = "";
  hilfstext.style.visibility = "hidden";
  aktiverHilfstext = false;
}

// Globale Variable, um den aktuellen Hilfstext zu speichern.
let aktiverHilfstext = null;

function showText(event) {
  // Zuerst den aktiven Hilfstext ausblenden, falls vorhanden.
  if (aktiverHilfstext) {
    hideHilfstext();
  }

  // Überprüfen, ob das angeklickte Element eine der spezifizierten Klassen hat.
  if (
    ["FAZ", "FEZ", "SAZ", "SEZ", "GP", "FP"].includes(event.target.className)
  ) {
    event.target.style.color = "var(--text-color)";
    event.target.style.borderColor = "var(--border-color)";
    hilfstext.textContent = hilfstexte[event.target.className];
    hilfstext.style.position = "absolute";
    hilfstext.style.left = event.target.getBoundingClientRect().left + "px";
    hilfstext.style.top = event.target.getBoundingClientRect().top + "px";
    hilfstext.style.visibility = "visible";
    aktiverHilfstext = true;
  }
}

// Schleife durch mögliche Container-IDs (A bis Z) und füge den Event-Listener hinzu.
for (let i = 65; i <= 90; i++) {
  const containerId = String.fromCharCode(i);
  const container = document.getElementById(containerId);
  if (container) {
    container.addEventListener("click", showText);
  }
}

// Überprüfen, ob ein Dark Mode im LocalStorage gespeichert ist.
let darkMode = localStorage.getItem("darkMode");
const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;

const enableDarkMode = () => {
  document.body.classList.add("dark-mode");
  localStorage.setItem("darkMode", "enabled");
  document.getElementById("darkModeToggle").checked = true;
};

const disableDarkMode = () => {
  document.body.classList.remove("dark-mode");
  localStorage.setItem("darkMode", null);
  document.getElementById("darkModeToggle").checked = false;
};

if (darkMode === "enabled") {
  enableDarkMode();
}

// Event-Listener für den Dark Mode Umschalter.
darkModeToggle.addEventListener("change", function () {
  darkMode = localStorage.getItem("darkMode");
  if (darkMode !== "enabled") {
    enableDarkMode();
  } else {
    disableDarkMode();
  }
});

// Verhindern, dass die Legende skaliert wird.
const legende = document.querySelector("#Legende");
const scale = window.devicePixelRatio;

legende.style.transform = `scale(${1 / scale})`;
hilfstext.style.transform = `scale(${1 / scale})`;

// Aktualisiere die Skalierung des Elements, wenn das Fenster neu dimensioniert wird.
window.addEventListener("resize", () => {
  const scale = window.devicePixelRatio;
  if (scale > 1.5) {
    legende.style.transform = `scale(${1.5 / scale})`;
    hilfstext.style.transform = `scale(${1.5 / scale})`;
  }
});

// Local Variables:
// jinx-languages: "de"
// End:
