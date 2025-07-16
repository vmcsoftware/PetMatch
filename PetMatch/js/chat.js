document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const chatId = params.get("chatId");
  const currentUser = firebase.auth().currentUser;
  const messagesDiv = document.getElementById("messages");
  const sendBtn = document.getElementById("sendBtn");

  const chatRef = firebase.firestore().collection("chats").doc(chatId);

  // Atualizar mensagens em tempo real
  chatRef.onSnapshot((doc) => {
    const data = doc.data();
    messagesDiv.innerHTML = "";
    if (data.messages && data.messages.length > 0) {
      data.messages.forEach((msg) => {
        const div = document.createElement("div");
        div.className = "message";
        div.innerHTML = `<strong>${msg.sender === currentUser.uid ? "Você" : "Outro"}:</strong> ${msg.text}`;
        messagesDiv.appendChild(div);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  });

  // Enviar mensagem
  sendBtn.addEventListener("click", function () {
    const text = document.getElementById("messageInput").value.trim();
    if (text === "") return;

    chatRef.update({
      messages: firebase.firestore.FieldValue.arrayUnion({
        sender: currentUser.uid,
        text: text,
        timestamp: new Date()
      })
    })
    .then(() => {
      document.getElementById("messageInput").value = "";
    });
  });
});
