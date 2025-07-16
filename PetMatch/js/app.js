// Login
document.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", function () {
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Login bem-sucedido
          window.location.href = "explorar.html";
        })
        .catch((error) => {
          alert("Erro: " + error.message);
        });
    });
  }

  // Login com Google
  const googleSignInBtn = document.getElementById("googleSignInBtn");
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", function () {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          const user = result.user;
          
          // Verificar se é um novo usuário e salvar dados no Firestore
          firebase.firestore().collection("users").doc(user.uid).get()
            .then((doc) => {
              if (!doc.exists) {
                // Novo usuário, salvar dados
                firebase.firestore().collection("users").doc(user.uid).set({
                  name: user.displayName,
                  email: user.email,
                  photoURL: user.photoURL,
                  createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
              }
              window.location.href = "explorar.html";
            });
        })
        .catch((error) => {
          alert("Erro no login com Google: " + error.message);
        });
    });
  }
});

// Cadastro
document.addEventListener("DOMContentLoaded", function () {
  const registerBtn = document.getElementById("registerBtn");
  if (registerBtn) {
    registerBtn.addEventListener("click", function () {
      const name = document.getElementById("registerName").value;
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;

      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;

          // Salvar dados adicionais no Firestore
          firebase.firestore().collection("users").doc(user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          })
          .then(() => {
            alert("Cadastro realizado com sucesso!");
            window.location.href = "explorar.html";
          });

        })
        .catch((error) => {
          alert("Erro: " + error.message);
        });
    });
  }

  // Cadastro com Google
  const googleSignUpBtn = document.getElementById("googleSignUpBtn");
  if (googleSignUpBtn) {
    googleSignUpBtn.addEventListener("click", function () {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          const user = result.user;
          
          // Salvar dados do usuário no Firestore
          firebase.firestore().collection("users").doc(user.uid).set({
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          })
          .then(() => {
            alert("Cadastro com Google realizado com sucesso!");
            window.location.href = "explorar.html";
          });
        })
        .catch((error) => {
          alert("Erro no cadastro com Google: " + error.message);
        });
    });
  }
});

// Cadastro de cachorro - Preview da foto
document.addEventListener("DOMContentLoaded", function () {
  const dogPhotoFile = document.getElementById("dogPhotoFile");
  const photoPreview = document.getElementById("photoPreview");
  const previewImage = document.getElementById("previewImage");
  const removePhoto = document.getElementById("removePhoto");

  if (dogPhotoFile) {
    dogPhotoFile.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          previewImage.src = e.target.result;
          photoPreview.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (removePhoto) {
    removePhoto.addEventListener("click", function () {
      dogPhotoFile.value = "";
      photoPreview.style.display = "none";
      previewImage.src = "";
    });
  }
});

// Cadastro de cachorro - Salvar
document.addEventListener("DOMContentLoaded", function () {
  const saveDogBtn = document.getElementById("saveDogBtn");
  if (saveDogBtn) {
    saveDogBtn.addEventListener("click", function () {
      const user = firebase.auth().currentUser;
      if (!user) {
        alert("Você precisa estar logado.");
        return;
      }

      const photoFile = document.getElementById("dogPhotoFile").files[0];
      if (!photoFile) {
        alert("Por favor, selecione uma foto do cachorro.");
        return;
      }

      // Validar outros campos
      const name = document.getElementById("dogName").value;
      const breed = document.getElementById("dogBreed").value;
      const age = document.getElementById("dogAge").value;
      const gender = document.getElementById("dogGender").value;
      const city = document.getElementById("dogCity").value;
      const description = document.getElementById("dogDescription").value;

      if (!name || !breed || !age || !gender || !city) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
      }

      // Mostrar progresso
      const uploadProgress = document.getElementById("uploadProgress");
      const progressFill = document.getElementById("progressFill");
      const progressText = document.getElementById("progressText");
      uploadProgress.style.display = "block";
      saveDogBtn.disabled = true;
      saveDogBtn.textContent = "Salvando...";

      // Upload da foto
      const storageRef = firebase.storage().ref();
      const photoRef = storageRef.child(`dog-photos/${user.uid}/${Date.now()}_${photoFile.name}`);
      const uploadTask = photoRef.put(photoFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          // Progresso do upload
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressFill.style.width = progress + '%';
          progressText.textContent = Math.round(progress) + '%';
        },
        (error) => {
          // Erro no upload
          alert("Erro ao fazer upload da foto: " + error.message);
          uploadProgress.style.display = "none";
          saveDogBtn.disabled = false;
          saveDogBtn.textContent = "Salvar";
        },
        () => {
          // Upload concluído
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            // Salvar dados do cachorro com URL da foto
            const dogData = {
              ownerId: user.uid,
              name: name,
              breed: breed,
              age: parseInt(age),
              gender: gender,
              city: city,
              photo: downloadURL,
              description: description,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            firebase.firestore().collection("dogs").add(dogData)
              .then(() => {
                alert("Cão cadastrado com sucesso!");
                window.location.href = "explorar.html";
              })
              .catch((error) => {
                alert("Erro ao salvar dados: " + error.message);
                uploadProgress.style.display = "none";
                saveDogBtn.disabled = false;
                saveDogBtn.textContent = "Salvar";
              });
          });
        }
      );
    });
  }
});
// Exibir lista de cães
document.addEventListener("DOMContentLoaded", function () {
  const dogList = document.getElementById("dogList");
  if (dogList) {
    firebase.firestore().collection("dogs").get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const dog = doc.data();
          const card = document.createElement("div");
          card.className = "dog-card";
          card.innerHTML = `
            <img src="${dog.photo}" alt="${dog.name}" style="width:100%;border-radius:8px;" />
            <h3>${dog.name}</h3>
            <p>Raça: ${dog.breed}</p>
            <p>Idade: ${dog.age} anos</p>
            <p>Sexo: ${dog.gender}</p>
            <p>Cidade: ${dog.city}</p>
            <button onclick="likeDog('${doc.id}')">Curtir ❤️</button>
          `;
          dogList.appendChild(card);
        });
      });
  }
});

// Curtir cachorro
function likeDog(dogId) {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Você precisa estar logado.");
    return;
  }

  firebase.firestore().collection("likes").add({
    userId: user.uid,
    dogId: dogId,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    alert("Você curtiu este cão!");
  });
}
// Listar likes
document.addEventListener("DOMContentLoaded", function () {
  const matchList = document.getElementById("matchList");
  if (matchList) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    firebase.firestore().collection("likes")
      .where("userId", "==", user.uid)
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          matchList.innerHTML = "<p>Você ainda não curtiu nenhum cão.</p>";
        } else {
          querySnapshot.forEach((doc) => {
            const like = doc.data();
            firebase.firestore().collection("dogs").doc(like.dogId).get()
              .then((dogDoc) => {
                const dog = dogDoc.data();
                const card = document.createElement("div");
                card.className = "dog-card";
                card.innerHTML = `
                  <img src="${dog.photo}" alt="${dog.name}" style="width:100%;border-radius:8px;" />
                  <h3>${dog.name}</h3>
                  <p>Raça: ${dog.breed}</p>
                  <p>Idade: ${dog.age} anos</p>
                  <p>Sexo: ${dog.gender}</p>
                  <p>Cidade: ${dog.city}</p>
                `;
                matchList.appendChild(card);
              });
          });
        }
      });
  }
});
function startChat(otherUserId, dogId) {
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    alert("Você precisa estar logado.");
    return;
  }

  // Criar ou localizar chat existente entre esses dois usuários
  const chatsRef = firebase.firestore().collection("chats");
  chatsRef
    .where("participants", "array-contains", currentUser.uid)
    .get()
    .then((querySnapshot) => {
      let existingChat = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(otherUserId)) {
          existingChat = doc.id;
        }
      });

      if (existingChat) {
        // Chat já existe
        window.location.href = `chat.html?chatId=${existingChat}`;
      } else {
        // Criar novo chat
        chatsRef.add({
          participants: [currentUser.uid, otherUserId],
          dogId: dogId,
          messages: []
        })
        .then((docRef) => {
          window.location.href = `chat.html?chatId=${docRef.id}`;
        });
      }
    });
}
