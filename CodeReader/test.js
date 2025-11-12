// Dichiarazione della variabile 'dronePiuVicino' con parametri a (array di oggetti), p (oggetto contente le coordinate), epsilon (soglia di precisione)
function dronePiuVicino(a, p, epsilon) {
    if(a && a.length > 0){ // <- Se l'array esiste e non è vuoto ... altrimenti ...
        let min = 0;    // <- Metto la posizione minima a 0
        for(let i = 1; i < a.length; i++){  // <- Itero partendo da 1 perché al limite quello in 0 sarà l'oggetto che ci interessa e lo abbiamo già memorizzato sopra
            let dMin = (dist(a[min], p)) // <- Scompatto il codice e inizializzo una variabile dMin con il valore della distanza dell'oggetto in posizione min nell'array a
            let actDist = dist(a[i], p); // <- Uguale per quello che si sta confrontando nell'iterazione
            if((actDist < dMin && Math.abs(dMin - actDist) >= epsilon)){ // <- Se la distanza attuale è minore della distanza minima fino ad ora e il valore assoluto della differenza è più grande della soglia di tolleranza
                min = i // <- Allora aggiorno la variabile min con la posizione i del punto più vicino a p
            }
        }
        return a[min]; // <- Restituisco l'oggetto più vicino a p
    }
    return null; // <- Restituisco null se l'array non esiste o è vuoto
}

// Funzione per il calcolo separato della distanza per rendere il codice più pulito
function dist(coord1, coord2){
    return (Math.sqrt(Math.pow((coord1.x - coord2.x), 2) + Math.pow((coord1.y - coord2.y), 2) + Math.pow((coord1.z - coord2.z), 2)))
}

a = [{x:0, y:1, z:0}, {x:0, y:2, z:1}, {x:0, y:0, z:1}]
console.log(dronePiuVicino(a, {x:0, y:0, z:0}, 0.5))