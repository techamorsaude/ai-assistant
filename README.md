# Assistente AI

## Visão Geral

Este projeto é uma interface web que permite fazer perguntas a um assistente virtual e receber respostas. A interface tem várias funcionalidades, incluindo a adição de IDs de assistentes, a inserção de uma chave de API, e a visualização de mensagens trocadas com o assistente.

## Estrutura do Projeto

O projeto é composto por três arquivos principais:

- index.html: Estrutura da página web.
- styles.css: Estilos da página (como as coisas aparecem).
- script.js: Funcionalidades (como as coisas funcionam).

## index.html

Este arquivo define a estrutura da página. Ele diz onde cada parte da página vai e o que cada parte faz.

### Estrutura Básica

<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <title>Assistente AI</title> <link rel="stylesheet" href="src/styles.css" /> <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" /> </head> <body> <!-- Todo o conteúdo vai aqui --> <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script> <script src="src/script.js"></script> </body> </html>

### Container Principal

<div class="container"> <div class="top-box"> <!-- Inputs e botões para Assistant ID e API Key --> </div> <div class="chat-box"> <!-- Mensagens e input de pergunta --> </div> <div id="loader" class="loader"></div> <div class="loader-bg"></div> </div>

- container: Um grande contêiner que mantém todas as partes da página juntas.
- top-box: Uma caixa na parte superior que contém inputs para IDs de assistente e a chave da API.
- chat-box: Uma caixa grande que contém o histórico de mensagens e o input para fazer perguntas.
- loader: Um indicador de carregamento que aparece quando algo está sendo processado.
- loader-bg: Um fundo que aparece atrás do loader para escurecer a tela enquanto carrega.

## styles.css

Este arquivo define como a página vai parecer, usando estilos CSS.

### Estilos Globais

- { outline: none; padding: 0; margin: 0; box-sizing: border-box; }

- Remove todas as bordas de foco padrão e define o padding e a margem como zero para todos os elementos.

### Estilos do Corpo

body { font-family: Arial, sans-serif; background-color: #f5f5f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }

- Define a fonte como Arial e coloca o corpo no centro da tela com um fundo cinza claro.

### Container Principal

.container { width: 98%; max-width: 60%; height: 98vh; display: flex; flex-direction: column; position: relative; }

- Define o tamanho do container principal e o alinha no centro da tela.

### Caixa Superior (top-box)

.top-box { background-color: #ffffff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border-radius: 10px; padding: 20px; margin-bottom: 10px; flex: 0 0 30%; display: flex; flex-direction: column; gap: 20px; }

- Define o estilo da caixa superior, incluindo o fundo branco, sombra, bordas arredondadas e espaçamento interno.

## script.js

Este arquivo define como a página funciona, usando JavaScript.

### Inicialização do Documento

document.addEventListener("DOMContentLoaded", () => { loadApiKey(); updateAssistantIdSelect(); renderMessages();

const modal = document.getElementById("errorModal"); const span = document.getElementById("closeModal");

span.onclick = function () { modal.style.display = "none"; };

window.onclick = function (event) { if (event.target == modal) { modal.style.display = "none"; } };

document.getElementById("question").addEventListener("keypress", function (event) { if (event.key === "Enter" && !document.getElementById("question").disabled) { handleSubmit(); } }); });

- Quando a página é carregada, ela inicializa várias funções e adiciona event listeners para botões e inputs.

### Adicionar Assistant ID

function addAssistantId() { const assistantIdInput = document.getElementById("assistantIdInput"); const assistantId = assistantIdInput.value.trim(); if (assistantId && !assistantIds.includes(assistantId)) { assistantIds.push(assistantId); localStorage.setItem("assistantIds", JSON.stringify(assistantIds)); updateAssistantIdSelect(); assistantIdInput.value = ""; } else { alert("Por favor, insira um Assistant ID válido."); } }

- Pega o ID do assistente inserido e o adiciona à lista de IDs, armazenando-o no localStorage.

### Atualizar Seleção de Assistant ID

function updateAssistantIdSelect() { const assistantIdSelect = document.getElementById("assistantIdSelect"); const assistantIdList = document.getElementById("assistantIdList"); assistantIdSelect.innerHTML = '<option value="" disabled selected>Escolha um Assistant ID</option>'; assistantIdList.innerHTML = ""; assistantIds.forEach((id, index) => { const option = document.createElement("option"); option.value = id; option.textContent = id; assistantIdSelect.appendChild(option);

bash

Copiar código

``const listItem = document.createElement("li"); listItem.innerHTML = `${id} <button onclick="deleteAssistantId(${index})" class="icon-btn"><i class="fas fa-times" style="color: red;"></i></button>`; assistantIdList.appendChild(listItem);``

}); }

- Atualiza a lista de IDs de assistente disponíveis para seleção.

### Enviar Pergunta

function handleSubmit() { const question = document.getElementById("question").value; const selectedAssistantId = document.getElementById("assistantIdSelect").value; apiKey = document.getElementById("apiKeyInput").value.trim();

if (!question) { alert("Por favor, insira uma pergunta."); return; } if (!selectedAssistantId) { alert("Por favor, escolha um Assistant ID."); return; } if (!apiKey) { alert("Por favor, insira sua API Key."); return; }

saveApiKey(apiKey);

document.getElementById("loader").style.display = "block"; document.querySelector(".loader-bg").classList.add("active"); disableUI(true); document.getElementById("question").value = "";

createThread(selectedAssistantId, question) .then((result) => { checkThreadCompletionInterval(result); }) .catch((error) => { displayError(error); document.getElementById("loader").style.display = "none"; document.querySelector(".loader-bg").classList.remove("active"); disableUI(false); }); }

- Envia a pergunta para o assistente, mostrando um loader enquanto espera pela resposta.

### Criar uma Thread

function createThread(assistantId, question) { const url = "[https://api.openai.com/v1/threads/runs](https://api.openai.com/v1/threads/runs)"; const data = { assistant_id: assistantId, thread: { messages: [{ role: "user", content: question }], }, };

const options = { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "OpenAI-Beta": "assistants=v2", }, body: JSON.stringify(data), };

return fetch(url, options) .then((response) => response.json()) .then((data) => { if (data.error) { throw new Error(data.error.message); } if (data && data.id) { const response = { run_id: data.id, thread_id: data.thread_id, }; addMessage("user", question); return response; } else { throw new Error("Erro ao criar a thread."); } }); }

- Cria uma nova thread de conversa com o assistente.

### Verificar Conclusão da Thread

function checkThreadCompletionInterval(data) { const interval = setInterval(() => { checkThreadCompletion(data) .then((threadId) => { clearInterval(interval); fetchResponse(threadId); }) .catch((error) => { if (error.message !== "Thread ainda não completada.") { clearInterval(interval); displayError(error); document.getElementById("loader").style.display = "none"; document.querySelector(".loader-bg").classList.remove("active"); disableUI(false); } }); }, 1000); }

- Verifica a cada segundo se a thread foi concluída, até obter a resposta.

## Conclusão

Esta documentação detalha como cada parte do código funciona, ajudando a entender como a interface interage com o assistente virtual e gerencia o fluxo de perguntas e respostas. Esperamos que isso ajude a entender melhor o projeto e como ele foi construído!