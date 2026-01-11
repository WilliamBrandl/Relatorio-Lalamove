/* ====== Estado inicial (localStorage) ====== */
let corridas = JSON.parse(localStorage.getItem("corridas") || "[]");

let grafico;

/* DOM */
const listaCorridasDiv = document.getElementById("listaCorridas");
const form = document.getElementById("formCorrida");

const totalSemanalP = document.getElementById("totalSemanalP");
const mediaSemanalP = document.getElementById("mediaSemanalP");
const totalMensalP = document.getElementById("totalMensalP");
const totalPorClienteP = document.getElementById("totalPorClienteP");

const inputCliente = document.getElementById("cliente");
const inputDestino = document.getElementById("destino");
const inputValor = document.getElementById("valor");
const filtroCliente = document.getElementById("filtroCliente");


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

    corridas
        .filter(c => c.cliente.toLowerCase().includes(termo))
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
    const novoDestino = prompt("Editar destino:", c.destino);
    const novoValor = parseFloat(prompt("Editar valor:", c.valor));

    if (novoCliente && novoDestino && !isNaN(novoValor)) {
        c.cliente = novoCliente;
        c.destino = novoDestino;
        c.valor = novoValor;

        salvar();
        atualizarLista();
        atualizarResumo();
        atualizarGrafico();
    }
}

/* ===== Resumos ===== */
function atualizarResumo() {
    const now = new Date();

    const semana = corridas.filter(c => (now - new Date(c.data)) / 86400000 <= 7);
    const mes = corridas.filter(c => {
        const d = new Date(c.data);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalSemanal = semana.reduce((acc, c) => acc + c.valor, 0);
    const mediaSemanal = semana.length ? totalSemanal / semana.length : 0;
    const totalMensal = mes.reduce((acc, c) => acc + c.valor, 0);

    totalSemanalP.textContent = "R$ " + totalSemanal.toFixed(2);
    mediaSemanalP.textContent = "R$ " + mediaSemanal.toFixed(2);
    totalMensalP.textContent = "R$ " + totalMensal.toFixed(2);

    const mapa = {};
    corridas.forEach(c => {
        mapa[c.cliente] = (mapa[c.cliente] || 0) + c.valor;
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
};


/* Inicializar */
window.onload = () => {
    atualizarLista();
    atualizarResumo();
    atualizarGrafico();
};
