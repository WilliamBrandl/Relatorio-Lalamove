const corridaForm = document.getElementById('corridaForm');
const tabelaBody = document.querySelector('#tabelaCorridas tbody');
const mediaSemanalP = document.getElementById('mediaSemanal');
const totalMensalP = document.getElementById('totalMensal');
const totalPorClienteP = document.getElementById('totalPorCliente');
const filtroCliente = document.getElementById('filtroCliente');
const filtroMes = document.getElementById('filtroMes');
const limparFiltro = document.getElementById('limparFiltro');
const exportExcelBtn = document.getElementById('exportExcel');
const exportPDFBtn = document.getElementById('exportPDF');

let corridas = [];

// Carregar corridas do localStorage
window.onload = function() {
    const dados = localStorage.getItem('corridasLalamove');
    if (dados) {
        corridas = JSON.parse(dados);
        corridas.forEach(function(c){ c.data = new Date(c.data); });
        atualizarTabela();
    }
};

// Adicionar corrida
corridaForm.addEventListener('submit', function(e){
    e.preventDefault();
    const partida = document.getElementById('partida').value;
    const cliente = document.getElementById('cliente').value;
    const motivo = document.getElementById('motivo').value;
    const destino = document.getElementById('destino').value;
    const valor = parseFloat(document.getElementById('valor').value);

    const corrida = { partida, cliente, motivo, destino, valor, data: new Date() };
    corridas.push(corrida);

    salvarLocalStorage();
    atualizarTabela();
    corridaForm.reset();

    // Animação de confirmação
    corridaForm.style.animation = "flash 0.3s ease-in-out";
    setTimeout(function(){ corridaForm.style.animation = ""; }, 300);
});

// Atualizar tabela com filtros
function atualizarTabela() {
    const clienteFiltro = filtroCliente.value.toLowerCase();
    const mesFiltro = filtroMes.value;
    tabelaBody.innerHTML = '';

    corridas.forEach(function(c, index) {
        const mesCorrida = c.data.toISOString().slice(0,7);
        if ((!clienteFiltro || c.cliente.toLowerCase().includes(clienteFiltro)) &&
            (!mesFiltro || mesFiltro === mesCorrida)) {

            const row = document.createElement('tr');
            row.classList.add('fade-in');
            row.innerHTML =
                '<td>' + c.data.toLocaleDateString() + '</td>' +
                '<td>' + c.partida + '</td>' +
                '<td>' + c.cliente + '</td>' +
                '<td>' + c.motivo + '</td>' +
                '<td>' + c.destino + '</td>' +
                '<td>R$ ' + c.valor.toFixed(2) + '</td>' +
                '<td><button class="delete-btn" onclick="excluirCorrida(' + index + ')">Excluir</button></td>';
            tabelaBody.appendChild(row);
        }
    });

    calcularResumo();
}

// Calcular resumo
function calcularResumo() {
    const now = new Date();
    const semanaCorridas = corridas.filter(function(c){
        return (now - c.data)/(1000*60*60*24) <= 7;
    });
    const totalSemanal = semanaCorridas.reduce(function(acc, c){ return acc + c.valor; }, 0);
    const mediaSemanal = semanaCorridas.length ? totalSemanal / semanaCorridas.length : 0;
    mediaSemanalP.textContent = 'Média Semanal: R$ ' + mediaSemanal.toFixed(2);

    const mesCorridas = corridas.filter(function(c){
        return c.data.getMonth() === now.getMonth() && c.data.getFullYear() === now.getFullYear();
    });
    const totalMensal = mesCorridas.reduce(function(acc, c){ return acc + c.valor; }, 0);
    totalMensalP.textContent = 'Total Mensal: R$ ' + totalMensal.toFixed(2);

    const clienteMap = {};
    corridas.forEach(function(c){
        clienteMap[c.cliente] = (clienteMap[c.cliente] || 0) + c.valor;
    });
    let clienteResumo = Object.entries(clienteMap).map(function(entry){
        return entry[0] + ': R$ ' + entry[1].toFixed(2);
    }).join(' | ');
    totalPorClienteP.textContent = 'Total por Cliente: ' + (clienteResumo || 'Nenhum');
}

// Excluir corrida
function excluirCorrida(index) {
    if(confirm('Deseja realmente excluir esta corrida?')) {
        corridas.splice(index, 1);
        salvarLocalStorage();
        atualizarTabela();
    }
}

// Salvar no localStorage
function salvarLocalStorage() {
    localStorage.setItem('corridasLalamove', JSON.stringify(corridas));
}

// Filtros
filtroCliente.addEventListener('input', atualizarTabela);
filtroMes.addEventListener('change', atualizarTabela);
limparFiltro.addEventListener('click', function(){
    filtroCliente.value = '';
    filtroMes.value = '';
    atualizarTabela();
});

// Exportar Excel
exportExcelBtn.addEventListener('click', function(){
    const ws = XLSX.utils.json_to_sheet(corridas.map(function(c){
        return {
            Data: c.data.toLocaleDateString(),
            Partida: c.partida,
            Cliente: c.cliente,
            Motivo: c.motivo,
            Destino: c.destino,
            Valor: c.valor.toFixed(2)
        };
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Corridas');
    XLSX.writeFile(wb, 'Relatorio_Lalamove.xlsx');
});

// Exportar PDF
exportPDFBtn.addEventListener('click', function(){
    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF();
    doc.text('Relatório Lalamove', 14, 20);
    let y = 30;

    corridas.forEach(function(c){
        const linha = c.data.toLocaleDateString() + ' | ' +
                      c.partida + ' | ' +
                      c.cliente + ' | ' +
                      c.motivo + ' | ' +
                      c.destino + ' | R$ ' + c.valor.toFixed(2);
        doc.text(linha, 14, y);
        y += 10;
        if(y > 280){
            doc.addPage();
            y = 20;
        }
    });

    doc.save('Relatorio_Lalamove.pdf');
});
