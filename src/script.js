let apiKey = "";
const assistantIds = JSON.parse(localStorage.getItem("assistantIds")) || [];
const messages = JSON.parse(localStorage.getItem("messages")) || [];

document.addEventListener("DOMContentLoaded", () => {
  loadApiKey();
  updateAssistantIdSelect();
  renderMessages();

  const modal = document.getElementById("errorModal");
  const span = document.getElementById("closeModal");

  span.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  document
    .getElementById("question")
    .addEventListener("keypress", function (event) {
      if (
        event.key === "Enter" &&
        !document.getElementById("question").disabled
      ) {
        handleSubmit();
      }
    });
});

function addAssistantId() {
  const assistantIdInput = document.getElementById("assistantIdInput");
  const assistantId = assistantIdInput.value.trim();
  if (assistantId && !assistantIds.includes(assistantId)) {
    assistantIds.push(assistantId);
    localStorage.setItem("assistantIds", JSON.stringify(assistantIds));
    updateAssistantIdSelect();
    assistantIdInput.value = "";
  } else {
    alert("Por favor, insira um Assistant ID válido.");
  }
}

function updateAssistantIdSelect() {
  const assistantIdSelect = document.getElementById("assistantIdSelect");
  const assistantIdList = document.getElementById("assistantIdList");
  assistantIdSelect.innerHTML =
    '<option value="" disabled selected>Escolha um Assistant ID</option>';
  assistantIdList.innerHTML = "";
  assistantIds.forEach((id, index) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = id;
    assistantIdSelect.appendChild(option);

    const listItem = document.createElement("li");
    listItem.innerHTML = `${id} <button onclick="deleteAssistantId(${index})" class="icon-btn"><i class="fas fa-times" style="color: red;"></i></button>`;
    assistantIdList.appendChild(listItem);
  });
}

function toggleAssistantIdList() {
  const assistantIdList = document.getElementById("assistantIdList");
  assistantIdList.classList.toggle("active");
}

function deleteAssistantId(index) {
  assistantIds.splice(index, 1);
  localStorage.setItem("assistantIds", JSON.stringify(assistantIds));
  updateAssistantIdSelect();
}

function handleSubmit() {
  const question = document.getElementById("question").value;
  const selectedAssistantId =
    document.getElementById("assistantIdSelect").value;
  apiKey = document.getElementById("apiKeyInput").value.trim();

  if (!question) {
    alert("Por favor, insira uma pergunta.");
    return;
  }
  if (!selectedAssistantId) {
    alert("Por favor, escolha um Assistant ID.");
    return;
  }
  if (!apiKey) {
    alert("Por favor, insira sua API Key.");
    return;
  }

  saveApiKey(apiKey);

  document.getElementById("loader").style.display = "block";
  document.querySelector(".loader-bg").classList.add("active");
  disableUI(true);
  document.getElementById("question").value = "";

  createThread(selectedAssistantId, question)
    .then((result) => {
      checkThreadCompletionInterval(result);
    })
    .catch((error) => {
      displayError(error);
      document.getElementById("loader").style.display = "none";
      document.querySelector(".loader-bg").classList.remove("active");
      disableUI(false);
    });
}

function createThread(assistantId, question) {
  const url = "https://api.openai.com/v1/threads/runs";
  const data = {
    assistant_id: assistantId,
    thread: {
      messages: [{ role: "user", content: question }],
    },
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify(data),
  };

  return fetch(url, options)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        throw new Error(data.error.message);
      }
      if (data && data.id) {
        const response = {
          run_id: data.id,
          thread_id: data.thread_id,
        };
        addMessage("user", question);
        return response;
      } else {
        throw new Error("Erro ao criar a thread.");
      }
    });
}

function checkThreadCompletionInterval(data) {
  const interval = setInterval(() => {
    checkThreadCompletion(data)
      .then((threadId) => {
        clearInterval(interval);
        fetchResponse(threadId);
      })
      .catch((error) => {
        if (error.message !== "Thread ainda não completada.") {
          clearInterval(interval);
          displayError(error);
          document.getElementById("loader").style.display = "none";
          document.querySelector(".loader-bg").classList.remove("active");
          disableUI(false);
        }
      });
  }, 500);
}

function checkThreadCompletion(data) {
  const url = `https://api.openai.com/v1/threads/${data.thread_id}/runs/${data.run_id}`;
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "assistants=v2",
    },
  };

  return fetch(url, options)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        throw new Error(data.error.message);
      }
      if (data && data.status === "completed") {
        return data.thread_id;
      } else {
        throw new Error("Thread ainda não completada.");
      }
    });
}

function fetchResponse(threadId) {
  const url = `https://api.openai.com/v1/threads/${threadId}/messages`;
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "assistants=v2",
    },
  };

  fetch(url, options)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        throw new Error(data.error.message);
      }
      const botMessage = data.data[0].content[0].text.value;
      addMessage("bot", botMessage);
      document.getElementById("loader").style.display = "none";
      document.querySelector(".loader-bg").classList.remove("active");
      disableUI(false);
    })
    .catch((error) => {
      displayError(error);
      document.getElementById("loader").style.display = "none";
      document.querySelector(".loader-bg").classList.remove("active");
      disableUI(false);
    });
}

function addMessage(sender, text) {
  const messagesContainer = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.className = `message ${sender}`;
  messageElement.innerHTML = marked.parse(text);
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  messages.push({ sender, text });
  localStorage.setItem("messages", JSON.stringify(messages));
}

function renderMessages() {
  const messagesContainer = document.getElementById("messages");
  messagesContainer.innerHTML = "";
  messages.forEach(({ sender, text }) => addMessage(sender, text));
}

function clearChat() {
  const messagesContainer = document.getElementById("messages");
  messagesContainer.innerHTML = "";
  messages.length = 0;
  localStorage.removeItem("messages");
}

function saveChat() {
  localStorage.setItem("messages", JSON.stringify(messages));
}

function toggleApiKeyVisibility() {
  const apiKeyInput = document.getElementById("apiKeyInput");
  const apiKeyIcon = document.getElementById("apiKeyIcon");
  if (apiKeyInput.type === "password") {
    apiKeyInput.type = "text";
    apiKeyIcon.classList.remove("fa-eye");
    apiKeyIcon.classList.add("fa-eye-slash");
  } else {
    apiKeyInput.type = "password";
    apiKeyIcon.classList.remove("fa-eye-slash");
    apiKeyIcon.classList.add("fa-eye");
  }
}

function deleteApiKey() {
  localStorage.removeItem("apiKey");
  document.getElementById("apiKeyInput").value = "";
}

function displayError(error) {
  console.error("Error:", error);
  const modal = document.getElementById("errorModal");
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = error.message;
  modal.style.display = "block";
}

function saveApiKey(apiKey) {
  localStorage.setItem("apiKey", apiKey);
}

function loadApiKey() {
  const savedApiKey = localStorage.getItem("apiKey");
  if (savedApiKey) {
    document.getElementById("apiKeyInput").value = savedApiKey;
  }
}

function disableUI(disable) {
  document.getElementById("question").disabled = disable;
  document.querySelectorAll("button").forEach((button) => {
    button.disabled = disable;
  });
}
