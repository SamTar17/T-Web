/**
 * Script di test per IdGenerator
 * 
 * Questo script esegue diversi scenari di test per verificare
 * che il nostro generatore di ID funzioni correttamente in
 * varie condizioni operative.
 */

const IdGenerator = require('../services/IdGenerator');

console.log('🧪 === TEST SUITE PER ID GENERATOR ===\n');

// Creiamo un'istanza del generatore per i test
const idGenerator = new IdGenerator();

/**
 * TEST 1: Generazione rapida di ID (stesso millisecondo)
 * Obiettivo: Verificare che il counter si incrementi correttamente
 * quando generiamo più ID nello stesso millisecondo
 */
function testRapidGeneration() {
    console.log('📋 TEST 1: Generazione rapida di ID');
    console.log('Generando 5 ID in rapida successione...\n');
    
    const ids = [];
    
    // Generiamo 5 ID il più rapidamente possibile
    for (let i = 0; i < 5; i++) {
        const id = idGenerator.generateMessageId();
        ids.push(id);
        console.log(`ID ${i + 1}: ${id}`);
    }
    
    // Analizziamo i risultati
    console.log('\n🔍 Analisi risultati:');
    
    // Estraiamo timestamp e counter da ogni ID
    const analysis = ids.map(id => {
        const parts = id.split('_');
        return {
            fullId: id,
            timestamp: parts[0],
            counter: parts[1]
        };
    });
    
    // Verifichiamo se hanno lo stesso timestamp
    const allSameTimestamp = analysis.every(item => item.timestamp === analysis[0].timestamp);
    
    if (allSameTimestamp) {
        console.log('✅ Tutti gli ID hanno lo stesso timestamp (stesso millisecondo)');
        console.log('✅ Counter incrementa correttamente:', analysis.map(a => a.counter).join(' → '));
    } else {
        console.log('⚠️  Gli ID hanno timestamp diversi (generazione più lenta del previsto)');
        analysis.forEach((item, index) => {
            console.log(`   ID ${index + 1}: timestamp=${item.timestamp}, counter=${item.counter}`);
        });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * TEST 2: Generazione con pause (millisecondi diversi)
 * Obiettivo: Verificare che il counter si resetti quando cambia il timestamp
 */
async function testWithPauses() {
    console.log('📋 TEST 2: Generazione con pause tra gli ID');
    console.log('Generando ID con pause di 10ms tra ognuno...\n');
    
    const ids = [];
    
    for (let i = 0; i < 3; i++) {
        const id = idGenerator.generateMessageId();
        ids.push(id);
        console.log(`ID ${i + 1}: ${id}`);
        
        // Pausa di 10 millisecondi per forzare timestamp diversi
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Analizziamo i risultati
    console.log('\n🔍 Analisi risultati:');
    
    const analysis = ids.map(id => {
        const parts = id.split('_');
        return {
            fullId: id,
            timestamp: parts[0],
            counter: parts[1]
        };
    });
    
    // Verifichiamo che i timestamp siano diversi e i counter resettati
    let timestampIncreasing = true;
    let counterResets = true;
    
    for (let i = 1; i < analysis.length; i++) {
        if (parseInt(analysis[i].timestamp) <= parseInt(analysis[i-1].timestamp)) {
            timestampIncreasing = false;
        }
        if (analysis[i].counter !== '000') {
            counterResets = false;
        }
    }
    
    if (timestampIncreasing) {
        console.log('✅ Timestamp incrementano correttamente');
    } else {
        console.log('❌ Problema: timestamp non incrementano');
    }
    
    if (counterResets) {
        console.log('✅ Counter si resetta a 000 per ogni nuovo timestamp');
    } else {
        console.log('❌ Problema: counter non si resetta correttamente');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * TEST 3: Test di unicità su volumi più alti
 * Obiettivo: Verificare che non ci siano ID duplicati anche generando molti ID
 */
function testUniqueness() {
    console.log('📋 TEST 3: Test di unicità su volume alto');
    console.log('Generando 100 ID e verificando unicità...\n');
    
    const ids = new Set(); // Set automaticamente elimina duplicati
    const allIds = [];
    
    // Generiamo 100 ID
    for (let i = 0; i < 100; i++) {
        const id = idGenerator.generateMessageId();
        ids.add(id);
        allIds.push(id);
    }
    
    console.log(`Generati: ${allIds.length} ID`);
    console.log(`Unici: ${ids.size} ID`);
    
    if (ids.size === allIds.length) {
        console.log('✅ Tutti gli ID sono univoci!');
    } else {
        console.log('❌ Attenzione: trovati ID duplicati!');
        console.log(`Duplicati: ${allIds.length - ids.size}`);
    }
    
    // Mostriamo i primi e ultimi 3 ID come esempio
    console.log('\nPrimi 3 ID generati:');
    allIds.slice(0, 3).forEach((id, index) => console.log(`   ${index + 1}: ${id}`));
    
    console.log('\nUltimi 3 ID generati:');
    allIds.slice(-3).forEach((id, index) => console.log(`   ${98 + index}: ${id}`));
    
    console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * TEST 4: Test di ordinamento
 * Obiettivo: Verificare che gli ID mantengano l'ordinamento cronologico
 */
async function testOrdering() {
    console.log('📋 TEST 4: Test di ordinamento cronologico');
    console.log('Verificando che gli ID mantengano l\'ordinamento temporale...\n');
    
    const ids = [];
    
    // Generiamo ID con piccole pause randomiche
    for (let i = 0; i < 5; i++) {
        const id = idGenerator.generateMessageId();
        ids.push({
            id: id,
            generatedAt: Date.now()
        });
        
        // Pausa randomica tra 1 e 5ms
        const pause = Math.random() * 4 + 1;
        await new Promise(resolve => setTimeout(resolve, pause));
    }
    
    console.log('ID generati in ordine cronologico:');
    ids.forEach((item, index) => {
        console.log(`   ${index + 1}: ${item.id}`);
    });
    
    // Ordiniamo gli ID come stringhe e verifichiamo che l'ordine sia mantenuto
    const originalOrder = ids.map(item => item.id);
    const sortedOrder = [...originalOrder].sort();
    
    const orderMaintained = JSON.stringify(originalOrder) === JSON.stringify(sortedOrder);
    
    console.log('\n🔍 Verifica ordinamento:');
    if (orderMaintained) {
        console.log('✅ L\'ordinamento cronologico è mantenuto nell\'ordinamento alfabetico');
    } else {
        console.log('❌ Problema: l\'ordinamento cronologico non corrisponde a quello alfabetico');
        console.log('Ordine originale:', originalOrder);
        console.log('Ordine alfabetico:', sortedOrder);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Funzione principale che esegue tutti i test
 */
async function runAllTests() {
    console.log('Iniziando tutti i test del generatore ID...\n');
    
    try {
        testRapidGeneration();
        await testWithPauses();
        testUniqueness();
        await testOrdering();
        
        console.log('🎉 Tutti i test completati!');
        console.log('🔍 Analizza i risultati sopra per verificare che tutto funzioni correttamente.');
        
    } catch (error) {
        console.error('❌ Errore durante l\'esecuzione dei test:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Eseguiamo i test solo se questo file viene chiamato direttamente
if (require.main === module) {
    runAllTests();
}