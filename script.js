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


function exportarExcel() {
    const ws = XLSX.utils.json_to_sheet(corridas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Corridas");
    XLSX.writeFile(wb, "corridas.xlsx");
}

async function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Relatório de Corridas", 10, 10);
    let y = 20;

    corridas.forEach(c => {
        doc.text(`${c.cliente} - ${c.destino} - R$ ${c.valor}`, 10, y);
        y += 8;
    });

    doc.save("corridas.pdf");
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


