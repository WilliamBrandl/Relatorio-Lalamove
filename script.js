/* ====== Estado inicial (localStorage) ====== */
let corridas = JSON.parse(localStorage.getItem("corridas") || "[]");

let grafico;

/* DOM */
const listaCorridasDiv = document.getElementById("listaCorridas");
const form = document.getElementById("formCorrida");

const mediaSemanalP = document.getElementById("mediaSemanalP");
const totalMensalP = document.getElementById("totalMensalP");
const totalPorClienteP = document.getElementById("totalPorClienteP");

const inputCliente = document.getElementById("cliente");
const inputDestino = document.getElementById("destino");
const inputValor = document.getElementById("valor");
const filtroCliente = document.getElementById("filtroCliente");
const contadorCorridas = document.getElementById("contadorCorridas");


/* ===== Salvar no localStorage ===== */
function salvar() {
    localStorage.setItem("corridas", JSON.stringify(corridas));
}

/* ===== Adicionar corrida ===== */
form.onsubmit = function (e) {
    e.preventDefault();

    const cliente = inputCliente.value.trim();
    const destino = inputDestino.value.trim();
    const valor = parseFloat(inputValor.value);

    if (!cliente || !destino || isNaN(valor)) return;

    corridas.push({
        id: Date.now(),
        cliente,
        destino,
        valor,
        data: new Date()
    });

    salvar();
    atualizarLista();
    atualizarResumo();
    atualizarGrafico();
    form.reset();
};


filtroCliente.oninput = () => atualizarLista();


/* ===== Atualizar lista ===== */

function atualizarLista() {
    listaCorridasDiv.innerHTML = "";
    const termo = filtroCliente.value.toLowerCase();

    const filtradas = corridas.filter(c => c.cliente.toLowerCase().includes(termo));

    contadorCorridas.textContent = `${filtradas.length} corrida${filtradas.length !== 1 ? 's' : ''}`;

    filtradas
        .sort((a, b) => b.id - a.id)
        .forEach(c => {
            const div = document.createElement("div");
            div.className = "corrida-card";

            div.innerHTML = `
                <div class="corrida-main">
                    <span class="corrida-dest">${c.destino}</span>
                    <span class="corrida-meta">${c.cliente} • ${new Date(c.data).toLocaleString()}</span>
                    <span class="corrida-valor">R$ ${c.valor.toFixed(2)}</span>
                </div>
                <div class="corrida-actions">
                    <button class="btn-editar" onclick="editarCorrida(${c.id})">Editar</button>
                    <button class="btn-excluir" onclick="excluirCorrida(${c.id})">Excluir</button>
                </div>
            `;

            listaCorridasDiv.appendChild(div);
        });
}


/* ===== Excluir ===== */
function excluirCorrida(id) {
    corridas = corridas.filter(c => c.id !== id);
    salvar();
    atualizarLista();
    atualizarResumo();
    atualizarGrafico();
}

/* ===== Editar ===== */

function editarCorrida(id) {
    const c = corridas.find(c => c.id === id);
    if (!c) return;

    const novoCliente = prompt("Editar cliente:", c.cliente);
    if (novoCliente === null) return;

    const novoDestino = prompt("Editar destino:", c.destino);
    if (novoDestino === null) return;

    const novoValorStr = prompt("Editar valor:", c.valor);
    if (novoValorStr === null) return;
    const novoValor = parseFloat(novoValorStr);

    const dataAtual = new Date(c.data);
    const dataFormatada = dataAtual.toISOString().slice(0, 10); // yyyy-mm-dd

    const novaDataStr = prompt("Editar data (AAAA-MM-DD):", dataFormatada);
    if (novaDataStr === null) return;

    const novaData = new Date(novaDataStr + "T12:00:00");

    if (!novoCliente || !novoDestino || isNaN(novoValor) || isNaN(novaData.getTime())) {
        alert("Dados inválidos.");
        return;
    }

    c.cliente = novoCliente;
    c.destino = novoDestino;
    c.valor = novoValor;
    c.data = novaData.toISOString();

    salvar();
    atualizarLista();
    atualizarResumo();
    atualizarGrafico();
}


/* ===== Resumos ===== */

function atualizarResumo() {
    const now = new Date();

    const inicioSemana = new Date();
    inicioSemana.setHours(0, 0, 0, 0);
    inicioSemana.setDate(inicioSemana.getDate() - 6); // hoje + 6 dias

    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

    let somaSemana = 0;
    let totalMensal = 0;

    corridas.forEach(c => {
        const dataCorrida = new Date(c.data);
        const valor = Number(c.valor);

        if (isNaN(dataCorrida.getTime()) || isNaN(valor)) return;

        const dataNormalizada = new Date(
            dataCorrida.getFullYear(),
            dataCorrida.getMonth(),
            dataCorrida.getDate()
        );

        if (dataNormalizada >= inicioSemana) {
            somaSemana += valor;
        }

        if (
            dataNormalizada.getFullYear() === now.getFullYear() &&
            dataNormalizada.getMonth() === now.getMonth()
        ) {
            totalMensal += valor;
        }
    });

    const mediaSemanal = somaSemana / 7;

    mediaSemanalP.textContent = "R$ " + mediaSemanal.toFixed(2);
    totalMensalP.textContent = "R$ " + totalMensal.toFixed(2);

    const mapa = {};
    corridas.forEach(c => {
        const valor = Number(c.valor);
        if (!isNaN(valor)) {
            mapa[c.cliente] = (mapa[c.cliente] || 0) + valor;
        }
    });

    totalPorClienteP.textContent = Object.entries(mapa)
        .map(([cliente, total]) => `${cliente}: R$ ${total.toFixed(2)}`)
        .join(" | ") || "Nenhum";
}




function login() {
    const u = document.getElementById("loginUser").value;
    const p = document.getElementById("loginPass").value;

    if (u === "la belle" && p === "0704") {
        localStorage.setItem("logado", "true");
        document.getElementById("loginTela").style.display = "none";
        document.querySelector(".container").style.display = "block";
    } else {
        document.getElementById("loginErro").textContent = "Login inválido";
    }
}

function atualizarGrafico() {
    const porCliente = {};

    corridas.forEach(c => {
        porCliente[c.cliente] = (porCliente[c.cliente] || 0) + c.valor;
    });

    const labels = Object.keys(porCliente);
    const dados = Object.values(porCliente);

    if (grafico) grafico.destroy();

    grafico = new Chart(document.getElementById("graficoMensal"), {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data: dados
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


async function exportarExcel() {
    if (!corridas.length) {
        alert("Nenhuma corrida para exportar.");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Relatório");

    // ===== LOGO =====
    const response = await fetch("assets/Logo La Belle.png");
    const imageBlob = await response.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    const logoId = workbook.addImage({
        buffer: imageBuffer,
        extension: "png"
    });

    sheet.addImage(logoId, {
        tl: { col: 0, row: 0 },
        ext: { width: 180, height: 80 }
    });

    // ===== TÍTULO =====
    sheet.mergeCells("C1:F2");
    sheet.getCell("C1").value = "RELATÓRIO DE CORRIDAS";
    sheet.getCell("C1").font = { size: 16, bold: true };
    sheet.getCell("C1").alignment = { vertical: "middle", horizontal: "center" };

    // ===== CABEÇALHO =====
    sheet.addRow([]);
    sheet.addRow(["Data", "Cliente", "Destino", "Valor (R$)"]);

    const header = sheet.getRow(4);
    header.font = { bold: true };
    header.alignment = { horizontal: "center" };

    // ===== DADOS =====
    corridas.forEach(c => {
        sheet.addRow([
            new Date(c.data).toLocaleDateString(),
            c.cliente,
            c.destino,
            Number(c.valor)
        ]);
    });

    // Ajuste de colunas
    sheet.columns = [
        { width: 15 },
        { width: 25 },
        { width: 30 },
        { width: 15 }
    ];

    // ===== TOTAL =====
    const ultimaLinha = sheet.rowCount + 1;
    sheet.getCell(`C${ultimaLinha}`).value = "Total:";
    sheet.getCell(`D${ultimaLinha}`).value = {
        formula: `SUM(D5:D${ultimaLinha - 1})`
    };
    sheet.getCell(`C${ultimaLinha}`).font = { bold: true };
    sheet.getCell(`D${ultimaLinha}`).font = { bold: true };

    // ===== EXPORTAR =====
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "relatorio-corridas.xlsx";
    link.click();
}

async function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let y = 15;

    /* ===== LOGO ===== */
    const logo = new Image();
    logo.src = "assets/Logo La Belle.png";
    await new Promise(r => logo.onload = r);

    doc.addImage(logo, "PNG", 15, y, 40, 20);

    doc.setFontSize(16);
    doc.text("RELATÓRIO DE CORRIDAS", pageWidth / 2, y + 10, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, pageWidth / 2, y + 17, { align: "center" });

    y += 30;

    /* ===== TABELA ===== */
    doc.setFontSize(11);
    doc.text("Data", 12, y);
    doc.text("Cliente", 38, y);
    doc.text("Destino", 85, y);
    doc.text("Valor", 170, y);

    y += 4;
    doc.line(10, y, 200, y);
    y += 6;

    let total = 0;

    corridas.forEach(c => {
    if (y > 200) return;

    const valor = Number(c.valor) || 0;
    const data = new Date(c.data).toLocaleDateString();

    const clienteMaxWidth = 40;
    const destinoMaxWidth = 65;

    const clienteLinhas = doc.splitTextToSize(c.cliente, clienteMaxWidth);
    const destinoLinhas = doc.splitTextToSize(c.destino, destinoMaxWidth);

    const alturaLinha = Math.max(
        clienteLinhas.length,
        destinoLinhas.length
    ) * 5;

    doc.setFontSize(10);

    doc.text(data, 12, y);
    doc.text(clienteLinhas, 38, y);
    doc.text(destinoLinhas, 85, y);
    doc.text(`R$ ${valor.toFixed(2)}`, 170, y);

    total += valor; // ✅ AQUI ESTAVA O ERRO

    y += alturaLinha;
});


    /* ===== TOTAL ===== */
    y += 6;
    doc.setFontSize(12);
    doc.text(`Total Geral: R$ ${total.toFixed(2)}`, 140, y);

    /* ===== GRÁFICO ===== */
    const canvas = document.getElementById("graficoMensal");
    const graficoImg = canvas.toDataURL("image/png");

    y += 10;
    doc.setFontSize(13);
    doc.text("Distribuição por Cliente", pageWidth / 2, y, { align: "center" });

    y += 6;
    doc.addImage(graficoImg, "PNG", 35, y, 140, 70);

    /* ===== RODAPÉ ===== */
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(
        "Relatório gerado automaticamente • Sistema de Controle de Corridas",
        pageWidth / 2,
        290,
        { align: "center" }
    );

    doc.save("relatorio-corridas.pdf");
}




window.onload = () => {
    if (localStorage.getItem("logado") === "true") {
        document.getElementById("loginTela").style.display = "none";
        document.querySelector(".container").style.display = "block";
    }

    atualizarLista();
    atualizarResumo();
    atualizarGrafico();
};


